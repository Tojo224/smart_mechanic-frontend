// Importa los scripts necesarios para Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDGZ392VUzOLDf4j7eQvbuRhAPNx24UPVQ",
  authDomain: "smart-mechanic-4a35e.firebaseapp.com",
  projectId: "smart-mechanic-4a35e",
  storageBucket: "smart-mechanic-4a35e.firebasestorage.app",
  messagingSenderId: "610969493592",
  appId: "1:610969493592:web:4ec086bc1dac9cdb17aa2d"
};

// Inicializa Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// Recupera una instancia de Firebase Messaging
const messaging = firebase.messaging();

// Manejador de mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico' // Puedes cambiar esto por una URL de icono real
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
