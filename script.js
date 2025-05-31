import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBA5Dr-NS2B-bZKoru3bOHbXnr-fsQjFA4",
    authDomain: "chatapp-fd187.firebaseapp.com",
    projectId: "chatapp-fd187",
    storageBucket: "chatapp-fd187.appspot.com",
    appId: "1:919355591895:web:31eba4577ba627fe17f492"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

    // Ask for notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

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
