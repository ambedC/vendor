import { useEffect, useState } from "react";
import { useRouter, type NextRouter } from "next/router";
import { FirebaseInstance, initializeFirebase } from "@/lib/firebase";
import { setFirebaseInstance } from "@/lib/analytics";
import { RecaptchaVerifier } from "firebase/auth";
import {
  firebaseConfigType,
  NotificationSettings,
  Settings,
} from "@/types/ApiResponse";
import { addToast, Avatar, closeToast } from "@heroui/react";
import { getFirebaseConfig, getSpecificSettings } from "@/helpers/getters";
import { getMessaging, getToken } from "firebase/messaging";
import { Bell } from "lucide-react";
import {
  getNotificationRedirectUrl,
  NotificationData,
} from "@/helpers/notificationUrl";

interface FirebaseInitializerProps {
  settings: Settings;
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    firebaseInstance?: FirebaseInstance;
  }
}

type NotificationPayload = {
  notification?: { title?: string; body?: string; image?: string; icon?: string };
  data?: NotificationData;
};

const playNotificationSound = () => {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Sound blocked by browser:", e));
  } catch (error) {
    console.error("Audio play failed:", error);
  }
};

const showNotification = (payload: NotificationPayload, router?: NextRouter) => {
  if (!payload.notification) return;

  playNotificationSound();
  const { title, body, image } = payload.notification;
  const url = getNotificationRedirectUrl(payload.data);

  // generate unique ID if you still want one for CSS purpose
  const toastClass = `toast-clickable-${Date.now()}`;

  // Create the toast and capture its key
  const toastKey = addToast({
    title: title || "New Notification",
    description: body || "You have a new message",
    color: "default",
    timeout: 10000,
    classNames: { wrapper: toastClass },
    icon: image ? (
      <Avatar size="md" src={image} />
    ) : (
      <Bell className="w-6 h-6" />
    ),
  });

  // Attach click listener after slight delay to ensure DOM mounting
  setTimeout(() => {
    const toastEl = document.querySelector(`.${toastClass}`) as HTMLElement | null;
    if (toastEl && url) {
      toastEl.style.cursor = "pointer";
      const handleClick = () => {
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (router) {
      router.push(url);
    }
        if (toastKey) closeToast(toastKey);
      };
      toastEl.addEventListener("click", handleClick, { once: true });
    }
  }, 100);
};

const initializeMessaging = async (
  firebaseInstance: FirebaseInstance,
  vapIdKey: string,
  firebaseConfig: firebaseConfigType,
) => {
  try {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const readyReg = await navigator.serviceWorker.ready;
    readyReg.active?.postMessage({
      type: "INIT_FIREBASE",
      config: firebaseConfig,
    });

    const messaging = getMessaging(firebaseInstance.app);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: vapIdKey });
      if (token) {
        console.log("FCM Token:", token);
        localStorage.setItem("fcm-token", token);
      }
    }
  } catch (error) {
    console.error("Failed to initialize messaging:", error);
  }
};

export default function FirebaseInitializer({
  settings,
}: FirebaseInitializerProps) {
  const router = useRouter();
  const [firebase, setFirebase] = useState<FirebaseInstance | null>(null);

  useEffect(() => {
    try {
      const firebaseConfig = getFirebaseConfig(settings);
      const notificationSettings = getSpecificSettings(
        settings,
        "notification",
      ) as NotificationSettings | undefined;

      const { vapIdKey = "" } = notificationSettings || {};

      if (firebaseConfig && !firebase) {
        const firebaseInstance = initializeFirebase(firebaseConfig);

        if (!firebaseInstance) {
          const errorMsg = "Failed to initialize Firebase instance";
          console.error(errorMsg);
          addToast({
            title: "Firebase Error",
            description: errorMsg,
            color: "danger",
          });
          return;
        }

        // 👇 defer setState to next microtask to avoid cascading render
        queueMicrotask(() => {
          setFirebase(firebaseInstance);
          window.firebaseInstance = firebaseInstance;
          // Set Firebase instance for analytics
          setFirebaseInstance(firebaseInstance);
        });

        if (typeof window !== "undefined") {
          try {
            const auth = firebaseInstance.auth;
            auth.settings.appVerificationDisabledForTesting = false;

            console.log("Firebase initialized successfully");

            if (
              vapIdKey &&
              "serviceWorker" in navigator &&
              "Notification" in window
            ) {
              initializeMessaging(firebaseInstance, vapIdKey, firebaseConfig);
            }
          } catch (authError) {
            const errorMsg = `Failed to configure Firebase Auth: ${
              authError instanceof Error ? authError.message : "Unknown error"
            }`;
            console.error(errorMsg);
            addToast({
              title: "Firebase Auth Error",
              description: errorMsg,
              color: "danger",
            });
          }
        }
      }
    } catch (error) {
      const errorMsg = `Error processing Firebase initialization: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.error(errorMsg);
      addToast({
        title: "Firebase Initialization Error",
        description: errorMsg,
        color: "danger",
      });
    }
  }, [settings, firebase]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "PUSH_EVENT") {
          showNotification(event.data.payload, router);
        }
      };
      navigator.serviceWorker.addEventListener("message", handler);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handler);
      };
    }
    return undefined;
  }, [router]);

  return null;
}
