import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDdRuBm_vzTe3TtSynUFIlqyWYBWVhPM6Y",
  authDomain: "duocencia-3904a.firebaseapp.com",
  projectId: "duocencia-3904a",
  storageBucket: "duocencia-3904a.firebasestorage.app",
  messagingSenderId: "621355141271",
  appId: "1:621355141271:web:f018345802eeb0479fc1d2",
  measurementId: "G-HWYVNVDP1C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

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
