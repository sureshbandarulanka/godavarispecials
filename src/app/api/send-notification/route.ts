import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import admin from "@/lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * PRODUCTION-GRADE SEND NOTIFICATION API
 * Features: Targeting, Batching, Token Cleanup, Dry Run, and Logging
 */
export async function POST(req: Request) {
  try {
    const { title, body, image, target, targetValue, dryRun = false } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Title and Body are required" }, { status: 400 });
    }

    const db = getFirestore();
    let tokens: string[] = [];
    const tokenToUserMap: Record<string, string> = {}; // To identify which user to prune

    // 1. TARGETING LOGIC
    let query: any = db.collection("users");

    if (target === "city" && targetValue) {
      query = query.where("city", "==", targetValue);
    } else if (target === "category" && targetValue) {
      query = query.where("categoryPreference", "array-contains", targetValue);
    }

    const usersSnap = await query.get();
    
    usersSnap.forEach((doc: any) => {
      const data = doc.data();
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        data.fcmTokens.forEach((t: string) => {
          tokens.push(t);
          tokenToUserMap[t] = doc.id;
        });
      }
    });

    // Deduplicate tokens
    tokens = [...new Set(tokens)];

    // 2. DRY RUN MODE - Preview Audience Size
    if (dryRun) {
      return NextResponse.json({ 
        success: true, 
        dryRun: true, 
        audienceSize: tokens.length 
      });
    }

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No tokens found for target" });
    }

    // 3. BATCHING & SENDING (FCM 500 limit)
    const chunkSize = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const tokensToRemove: Record<string, string[]> = {}; // uid -> [tokens]

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: {
          title,
          body,
          ...(image && { imageUrl: image })
        }
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      // 4. AUTOMATED TOKEN CLEANUP
      response.responses.forEach((res, index) => {
        if (!res.success && res.error) {
          const errorCode = res.error.code;
          // Prune tokens that are no longer valid
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            const badToken = chunk[index];
            const uid = tokenToUserMap[badToken];
            if (uid) {
              if (!tokensToRemove[uid]) tokensToRemove[uid] = [];
              tokensToRemove[uid].push(badToken);
            }
          }
        }
      });
    }

    // Execute Pruning in Batch
    if (Object.keys(tokensToRemove).length > 0) {
      const prunePromises = Object.entries(tokensToRemove).map(([uid, badTokens]) => {
        return db.collection("users").doc(uid).update({
          fcmTokens: FieldValue.arrayRemove(...badTokens)
        });
      });
      await Promise.all(prunePromises);
    }

    // 5. LOGGING SYSTEM
    await db.collection("notificationLogs").add({
      title,
      body,
      target,
      targetValue: targetValue || "all",
      audienceSize: tokens.length,
      successCount: totalSuccess,
      failureCount: totalFailure,
      timestamp: FieldValue.serverTimestamp(),
      type: 'instant'
    });

    return NextResponse.json({ 
      success: true, 
      sent: totalSuccess, 
      failed: totalFailure,
      pruned: Object.values(tokensToRemove).flat().length
    });

  } catch (error: any) {
    console.error("Multicast Notification Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to send notifications" 
    }, { status: 500 });
  }
}

