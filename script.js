import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js";

// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBA5Dr-NS2B-bZKoru3bOHbXnr-fsQjFA4",
    authDomain: "chatapp-fd187.firebaseapp.com",
    projectId: "chatapp-fd187",
    storageBucket: "chatapp-fd187.appspot.com",
    messagingSenderId: "919355591895",
    appId: "1:919355591895:web:31eba4577ba627fe17f492"
};

// ✅ Initialize Firebase **only once**
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// ✅ Register Firebase Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("firebase-messaging-sw.js")
        .then((registration) => {
            console.log("Service Worker Registered:", registration);
        }).catch((error) => {
            console.error("Service Worker Registration Failed:", error);
        });
}

// ✅ Request notification permission from the user
Notification.requestPermission().then(permission => {
    console.log("Notification permission status:", permission);
    if (permission === "granted") {
        getToken(messaging, { vapidKey: "BEPQKu1vJvO0rVlQsuoxDE2IAKBl3lbQrJck4jr1htQ3VFpZJDg0O6UnuYdNmAfYvVCrQB1_-G5-j9rV63TcFe8" })
            .then((currentToken) => {
                if (currentToken) {
                    console.log("FCM Token received:", currentToken);
                } else {
                    console.warn("No FCM token received");
                }
            }).catch(error => console.error("Error fetching FCM token:", error));
    }
});

// ✅ Listen for FCM messages
onMessage(messaging, (payload) => {
    console.log("New Notification:", payload);
    new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || "https://icons.iconarchive.com/icons/icons8/windows-8/256/Messaging-Bubble-icon.png"
    });
});

// ✅ Login & Chat Logic
const users = {
    "momin": "abcd1234",
    "isha": "abcd1234"
};

document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("login-btn");
    const logoutButton = document.getElementById("logout-btn");

    if (!loginButton) {
        console.warn("Login button not found, skipping login setup.");
    } else {
        loginButton.addEventListener("click", function () {
            const usernameInput = document.getElementById("username");
            const passwordInput = document.getElementById("password");

            if (!usernameInput || !passwordInput) {
                console.error("Login input fields not found!");
                return;
            }

            const username = usernameInput.value.toLowerCase();
            const password = passwordInput.value;

            if (users[username] && users[username] === password) {
                localStorage.setItem("loggedInUser", username);
                window.location.href = "chat.html";
            } else {
                alert("Invalid username or password");
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        });
    }

    if (window.location.pathname.includes("chat.html")) {
        const loggedInUser = localStorage.getItem("loggedInUser");
        if (!loggedInUser || !users[loggedInUser]) {
            window.location.href = "login.html";
        }
    }

    const sendButton = document.getElementById("send-btn");
    const messageInput = document.getElementById("message-input");
    const messagesDiv = document.getElementById("messages");
    const deleteButton = document.getElementById("delete-btn");
    const loggedInUser = localStorage.getItem("loggedInUser") || "";

    let isPageActive = true;
    document.addEventListener("visibilitychange", () => {
        isPageActive = !document.hidden;
    });

    if (sendButton) {
        sendButton.addEventListener("click", async () => {
            const messageText = messageInput.value.trim();
            if (messageText !== "" && loggedInUser) {
                await addDoc(collection(db, "messages"), {
                    sender: loggedInUser,
                    text: messageText,
                    timestamp: serverTimestamp()
                });
                messageInput.value = "";
            }
        });
    }

    const q = query(collection(db, "messages"), orderBy("timestamp"));
    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach(doc => {
            const msgData = doc.data();
            const msgElement = document.createElement("div");

            if (!msgData.text) {
                console.error("Message missing text:", msgData);
                return;
            }

            msgElement.textContent = msgData.text;
            msgElement.classList.add(msgData.sender.trim() === loggedInUser.trim() ? "sent-message" : "received-message");
            messagesDiv.appendChild(msgElement);

            if (!isPageActive && "Notification" in window && Notification.permission === "granted" && msgData.sender !== loggedInUser) {
                new Notification(`New message from ${msgData.sender}`, {
                    body: msgData.text,
                    icon: "https://icons.iconarchive.com/icons/icons8/windows-8/256/Messaging-Bubble-icon.png"
                });
            }
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            const password = prompt("Enter the password to delete all messages:");
            if (password === "pass1234") {
                const snapshot = await getDocs(collection(db, "messages"));
                snapshot.forEach(async (message) => {
                    await deleteDoc(doc(db, "messages", message.id));
                });
                alert("All messages have been deleted!");
            } else {
                alert("Incorrect password. Deletion canceled.");
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                sendButton.click();
            }
        });
    }
});
