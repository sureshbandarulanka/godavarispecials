import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";

// Messaging is only available in the browser
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission denied");
  }
  return permission;
};

export const generateFCMToken = async () => {
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      // ⚠️ IMPORTANT: User MUST replace this with their actual VAPID key from Firebase Console
      vapidKey: "BHzQzdJhkV98PnhcYS58WzQmCkuiAoXHCK3M4vARboImIusr9k7mEGuqIH5FVChjShX64ka6ETwmclxqylyG3Hs"
    });

    return token;
  } catch (error) {
    console.error("FCM Token Error:", error);
    return null;
  }
};

export const listenForegroundMessages = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground Message:", payload);
    // User can trigger a custom UI toast here
  });
};

