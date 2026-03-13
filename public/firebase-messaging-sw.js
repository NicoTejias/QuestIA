// Scripts for firebase and messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDdRuBm_vzTe3TtSynUFIlqyWYBWVhPM6Y",
  authDomain: "duocencia-3904a.firebaseapp.com",
  projectId: "duocencia-3904a",
  storageBucket: "duocencia-3904a.firebasestorage.app",
  messagingSenderId: "621355141271",
  appId: "1:621355141271:web:f018345802eeb0479fc1d2",
  measurementId: "G-HWYVNVDP1C"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-512.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
