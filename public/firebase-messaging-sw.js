importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBdfvMGyCGYZZsiCcN_I7_AjEQ4t5N73Oo",
  authDomain: "godavari-specials.firebaseapp.com",
  projectId: "godavari-specials",
  messagingSenderId: "537128701575",
  appId: "1:537128701575:web:d2099612c0840568ff7222"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = "Godavari Specials";
  const notificationOptions = {
    body: payload.notification?.body || "Pickles at your Door Step",
    icon: '/assets/favicon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
