
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDiBxFISZbY3MveLqDo75T2ILMcH-BNEyQ",
  authDomain: "over-mods-d2d03.firebaseapp.com",
  projectId: "over-mods-d2d03",
  storageBucket: "over-mods-d2d03.firebasestorage.app",
  messagingSenderId: "460799504048",
  appId: "1:460799504048:web:4ff9fadce080bf1ff1d575"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Default icon if available
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
