importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js");

// ✅ Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyBA5Dr-NS2B-bZKoru3bOHbXnr-fsQjFA4",
    authDomain: "chatapp-fd187.firebaseapp.com",
    projectId: "chatapp-fd187",
    storageBucket: "chatapp-fd187.appspot.com",
    messagingSenderId: "919355591895",
    appId: "1:919355591895:web:31eba4577ba627fe17f492"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("✅ Received background notification:", payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || "https://icons.iconarchive.com/icons/icons8/windows-8/256/Messaging-Bubble-icon.png"
    });
});
