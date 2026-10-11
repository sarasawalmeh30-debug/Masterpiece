// ======================================
// TEAMLY CHAT
// Demo frontend functionality
// ======================================

const messagesArea = document.getElementById("messages-area");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const attachButton = document.getElementById("attach-button");
const imageInput = document.getElementById("image-input");

const usageText = document.getElementById("usage-text");
const usageCount = document.getElementById("usage-count");
const usageProgress = document.getElementById("usage-progress");

const paymentPrompt = document.getElementById("payment-prompt");
const unlockChatButton = document.getElementById("unlock-chat-button");

const characterCount = document.getElementById("character-count");

const FREE_MESSAGE_LIMIT = 4;
const MAX_MESSAGE_LENGTH = 250;

// Four messages sent by the current user are allowed.
// This demo keeps the count for this browser tab.
let sentMessages = 0;
let selectedImage = null;


// ======================================
// Add a message to the chat
// ======================================

function addMessage(text, imageFile = null) {
    const message = document.createElement("div");

    message.className = "message sent";

    const content = document.createElement("div");
    content.className = "message-content";

    const sender = document.createElement("span");
    sender.className = "sender-name";
    sender.textContent = "You";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (text) {
        const textElement = document.createElement("div");
        textElement.textContent = text;
        bubble.appendChild(textElement);
    }

    if (imageFile) {
        const image = document.createElement("img");

        image.className = "message-image";
        image.alt = "Attached image";
        image.src = URL.createObjectURL(imageFile);

        bubble.appendChild(image);
    }

    const time = document.createElement("span");
    time.className = "message-time";

    time.textContent = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    content.append(sender, bubble, time);
    message.appendChild(content);

    messagesArea.appendChild(message);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}


// ======================================
// Update the message quota
// ======================================

function updateUsage() {
    usageCount.textContent =
        `${sentMessages} / ${FREE_MESSAGE_LIMIT}`;

    usageProgress.style.width =
        `${(sentMessages / FREE_MESSAGE_LIMIT) * 100}%`;

    if (sentMessages >= FREE_MESSAGE_LIMIT) {
        usageText.textContent = "Free messages used";

        messageInput.disabled = true;
        attachButton.disabled = true;
        imageInput.disabled = true;

        messageInput.placeholder =
            "Upgrade to continue chatting...";

        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fa fa-lock"></i>';
        sendButton.title = "Payment required";

        paymentPrompt.hidden = false;

    } else {
        usageText.textContent = "Your free messages";

        messageInput.disabled = false;
        attachButton.disabled = false;
        imageInput.disabled = false;

        messageInput.placeholder = "Write your message...";

        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fa fa-paper-plane"></i>';
        sendButton.title = "Send message";

        paymentPrompt.hidden = true;
    }
}


// ======================================
// Send message
// ======================================

messageForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (sentMessages >= FREE_MESSAGE_LIMIT) {
        updateUsage();
        return;
    }

    const text = messageInput.value.trim();

    if (!text && !selectedImage) {
        messageInput.focus();
        return;
    }

    // Maximum two lines per message.
    const lineCount = text
        ? text.split(/\r\n|\r|\n/).length
        : 0;

    if (lineCount > 2) {
        alert("Each message can contain a maximum of two lines.");
        return;
    }

    addMessage(text, selectedImage);

    sentMessages++;

    messageInput.value = "";
    characterCount.textContent = "0 / 250";

    selectedImage = null;
    imageInput.value = "";

    updateUsage();
});


// ======================================
// Message character counter
// ======================================

messageInput.addEventListener("input", function () {
    characterCount.textContent =
        `${messageInput.value.length} / ${MAX_MESSAGE_LENGTH}`;
});


// ======================================
// Attach image
// ======================================

attachButton.addEventListener("click", function () {
    if (sentMessages >= FREE_MESSAGE_LIMIT) {
        goToPayment();
        return;
    }

    imageInput.click();
});

imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        imageInput.value = "";
        return;
    }

    selectedImage = file;

    messageInput.placeholder =
        `Image selected: ${file.name}. Add a message or press Send.`;
});


// ======================================
// Payment page navigation
// ======================================

function goToPayment() {
    window.location.href = "../payment_client/payment.html";
}

document.getElementById("payment-button")
    .addEventListener("click", goToPayment);

document.getElementById("project-payment-button")
    .addEventListener("click", goToPayment);

unlockChatButton.addEventListener("click", goToPayment);


// ======================================
// Zoom page navigation
// ======================================

document.getElementById("zoom-button")
    .addEventListener("click", function () {
        window.location.href = "../Zoom/zoom.html";
    });


// ======================================
// Sidebar loader
// ======================================

async function loadSidebar() {
    const container = document.getElementById("sidebar-container");

    try {
        const response = await fetch("../sidebar_client/sidbar.html");

        if (!response.ok) {
            throw new Error("Sidebar HTML could not be loaded.");
        }

        container.innerHTML = await response.text();

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "../sidebar_client/sidbar.css";

        document.head.appendChild(css);

        const script = document.createElement("script");
        script.src = "../sidebar_client/sidbar.js";

        script.onerror = function () {
            console.error("Sidebar JavaScript failed to load.");
        };

        document.body.appendChild(script);

    } catch (error) {
        console.error("Sidebar error:", error);

        container.innerHTML = `
            <p style="padding: 16px;">
                
            </p>
        `;
    }
}


// ======================================
// Initialize
// ======================================

updateUsage();
loadSidebar();
