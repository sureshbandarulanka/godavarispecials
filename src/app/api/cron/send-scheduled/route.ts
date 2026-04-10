import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import admin from "@/lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * AUTOMATED SCHEDULER (CRON)
 * Expected to be called every 1-5 minutes
 */
export async function GET() {
  try {
    const db = getFirestore();
    const now = new Date();

    // 1. Fetch pending notifications that are due
    const snapshot = await db
      .collection("scheduledNotifications")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "No pending notifications due" });
    }

    const results = [];

    for (const notificationDoc of snapshot.docs) {
      const data = notificationDoc.data();
      const docId = notificationDoc.id;

      // 2. DOUBLE SEND PROTECTION: Update status to 'processing' immediately
      await notificationDoc.ref.update({ status: "processing" });

      const { title, body, image, target, targetValue } = data;

      // 3. AUDIENCE TARGETING
      let tokens: string[] = [];
      const tokenToUserMap: Record<string, string> = {};
      let query: any = db.collection("users");

      if (target === "city" && targetValue) {
        query = query.where("city", "==", targetValue);
      } else if (target === "category" && targetValue) {
        query = query.where("categoryPreference", "array-contains", targetValue);
      }

      const usersSnap = await query.get();
      usersSnap.forEach((u: any) => {
        const uData = u.data();
        if (uData.fcmTokens && Array.isArray(uData.fcmTokens)) {
          uData.fcmTokens.forEach((t: string) => {
            tokens.push(t);
            tokenToUserMap[t] = u.id;
          });
        }
      });

      tokens = [...new Set(tokens)];

      if (tokens.length === 0) {
        await notificationDoc.ref.update({ status: "sent", sentAt: FieldValue.serverTimestamp(), message: "No tokens found" });
        continue;
      }

      // 4. BATCH SENDING & SELF-HEALING PRUNING
      const chunkSize = 500;
      let successCount = 0;
      let failureCount = 0;
      const tokensToRemove: Record<string, string[]> = {};

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

        successCount += response.successCount;
        failureCount += response.failureCount;

        response.responses.forEach((res, index) => {
          if (!res.success && res.error) {
            const errorCode = res.error.code;
            if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
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

      // 5. CLEANUP & LOGGING
      if (Object.keys(tokensToRemove).length > 0) {
        const prunePromises = Object.entries(tokensToRemove).map(([uid, badTokens]) => {
          return db.collection("users").doc(uid).update({
            fcmTokens: FieldValue.arrayRemove(...badTokens)
          });
        });
        await Promise.all(prunePromises);
      }

      // Update notification status to 'sent'
      await notificationDoc.ref.update({
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
        actualAudience: tokens.length,
        actualSuccess: successCount,
        actualFailure: failureCount
      });

      // Add to analytics log
      await db.collection("notificationLogs").add({
        title,
        body,
        target,
        targetValue: targetValue || "all",
        audienceSize: tokens.length,
        successCount,
        failureCount,
        timestamp: FieldValue.serverTimestamp(),
        type: 'scheduled',
        originalDocId: docId
      });

      results.push({ docId, successCount });
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });

  } catch (error: any) {
    console.error("Cron Notification Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

