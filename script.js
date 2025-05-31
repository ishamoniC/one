import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js";

// ✅ Updated Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBA5Dr-NS2B-bZKoru3bOHbXnr-fsQjFA4",
    authDomain: "chatapp-fd187.firebaseapp.com",
    projectId: "chatapp-fd187",
    storageBucket: "chatapp-fd187.appspot.com",
    messagingSenderId: "919355591895",  // 🔥 Added messagingSenderId for FCM
    appId: "1:919355591895:web:31eba4577ba627fe17f492"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);  // Initialize Firebase Messaging

// ✅ Request notification permission from the user
Notification.requestPermission().then(permission => {
    if (permission === "granted") {
        console.log("Notifications allowed!");
        getToken(messaging, { vapidKey: "BEPQKu1vJvO0rVlQsuoxDE2IAKBl3lbQrJck4jr1htQ3VFpZJDg0O6UnuYdNmAfYvVCrQB1_-G5-j9rV63TcFe8" })
            .then((currentToken) => {
                if (currentToken) {
                    console.log("FCM Token:", currentToken);
                } else {
                    console.warn("No FCM token received");
                }
            });
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

// Predefined users
const users = {
    "momin": "abcd1234",
    "isha": "abcd1234"
};

document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("login-btn");
    const logoutButton = document.getElementById("logout-btn");

    // Handle login system (Prevent errors if `login-btn` doesn’t exist)
    if (loginButton) {
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
    } else {
        console.error("Login button not found!");
    }

    // Handle logout system
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        });
    }

    // Ensure user is logged in before entering chat
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

    // Track visibility of the page
    let isPageActive = true;
    document.addEventListener("visibilitychange", () => {
        isPageActive = !document.hidden;
    });

    // Send message
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

    // Real-time message updates + Notifications (Only if user is inactive)
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

            // Show notification only when user is not on the website
            if (!isPageActive && "Notification" in window && Notification.permission === "granted" && msgData.sender !== loggedInUser) {
                new Notification(`New message from ${msgData.sender}`, {
                    body: msgData.text,
                    icon: "https://icons.iconarchive.com/icons/icons8/windows-8/256/Messaging-Bubble-icon.png"
                });
            }
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // Delete all messages with password prompt
    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            const password = prompt("Enter the password to delete all messages:");
            if (password === "pass1234") { // Password check
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

    // Press Enter to send message
    if (messageInput) {
        messageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                sendButton.click();
            }
        });
    }
});
