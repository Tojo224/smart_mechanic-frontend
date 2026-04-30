import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-sw.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDGZ392VUzOLDf4j7eQvbuRhAPNx24UPVQ",
  authDomain: "smart-mechanic-4a35e.firebaseapp.com",
  projectId: "smart-mechanic-4a35e",
  storageBucket: "smart-mechanic-4a35e.firebasestorage.app",
  messagingSenderId: "610969493592",
  appId: "1:610969493592:web:4ec086bc1dac9cdb17aa2d"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano: ', payload);

  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje.',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
