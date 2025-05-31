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
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            const username = document.getElementById("username").value.toLowerCase();
            const password = document.getElementById("password").value;

            if (users[username] && users[username] === password) {
                localStorage.setItem("loggedInUser", username);
                window.location.href = "chat.html";
            } else {
                alert("Invalid username or password");
            }
        });
    }

    const logoutButton = document.getElementById("logout-btn");
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
    if (sendButton) {
        sendButton.addEventListener("click", async () => {
            const messageInput = document.getElementById("message-input");
            const messageText = messageInput.value.trim();
            const sender = localStorage.getItem("loggedInUser");

            if (messageText !== "" && sender) {
                await addDoc(collection(db, "messages"), {
                    sender: sender,
                    text: messageText,
                    timestamp: serverTimestamp()
                });
                messageInput.value = "";
            }
        });
    }

    const q = query(collection(db, "messages"), orderBy("timestamp"));
    onSnapshot(q, (snapshot) => {
        const messagesDiv = document.getElementById("messages");
        messagesDiv.innerHTML = "";

        const loggedInUser = localStorage.getItem("loggedInUser") || "";

        snapshot.forEach(doc => {
            const msgData = doc.data();
            const msgElement = document.createElement("div");

            if (!msgData.text) {
                console.error("Message missing text:", msgData);
                return;
            }

            msgElement.textContent = msgData.text; // Only show the message text

            // Ensure sender exists before applying `.trim()`
            if (msgData.sender && loggedInUser && msgData.sender.trim() === loggedInUser.trim()) {
                msgElement.classList.add("sent-message");
            } else {
                msgElement.classList.add("received-message");
            }

            messagesDiv.appendChild(msgElement);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    const deleteButton = document.getElementById("delete-btn");
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

    const messageInput = document.getElementById("message-input");
    if (messageInput) {
        messageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                document.getElementById("send-btn").click();
            }
        });
    }
});
