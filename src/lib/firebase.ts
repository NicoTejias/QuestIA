import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is properly configured
const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId;

// Initialize Firebase only if config is present to avoid crashing the app
let app: any = null;
let analytics: any = null;
let messaging: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
  }
} else {
  console.warn("⚠️ Firebase is not configured. Push notifications and analytics will be disabled. Check your environment variables (VITE_FIREBASE_...).");
}

export { app, analytics, messaging };

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Nota: Aquí se suele requerir una VAPID key para web push
      const token = await getToken(messaging, {
        vapidKey: undefined // El usuario debe obtenerla de la consola de Firebase
      });
      return token;
    }
  } catch (error) {
    console.error("Error al obtener permiso/token push:", error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
