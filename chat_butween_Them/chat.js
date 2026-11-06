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
const chatParams = new URLSearchParams(window.location.search);
const isProviderView = chatParams.get("role") === "provider";
let currentUserName = "You";

const FREE_MESSAGE_LIMIT = 4;
const MAX_MESSAGE_LENGTH = 250;

const conversationTitle = document.getElementById("conversation-title");
const conversationSubtitle = document.getElementById("conversation-subtitle");
const conversationButtons = [...document.querySelectorAll("[data-conversation]")];
const conversations = {
    team: {
        title: "Wedding Team",
        subtitle: "Group conversation · 4 members",
        system: "Welcome to your Wedding Team group chat! Coordinate your project with your team members.",
        messages: [
            { sender: "Ahmad · Photographer", initials: "A", role: "received", text: "Hello everyone! I'm excited to work with you.", time: "10:30 AM" },
            { sender: "Dana · Decorator", initials: "D", role: "received", text: "Hi! I'll prepare the decoration ideas for the project.", time: "10:32 AM" },
            { sender: "You", role: "sent", text: "Great! Let's discuss the details and our timeline.", time: "10:35 AM" }
        ]
    },
    ahmad: {
        title: "Ahmad",
        subtitle: "Photography · Wedding Project",
        messages: [
            { sender: "Ahmad", initials: "A", role: "received", text: "Hi! I'll prepare a photography plan for your wedding.", time: "10:30 AM" },
            { sender: "You", role: "sent", text: "Great. What time should we plan for the first photos?", time: "10:35 AM" },
            { sender: "Ahmad", initials: "A", role: "received", text: "I'll share a suggested timeline with the team shortly.", time: "10:38 AM" }
        ]
    },
    dana: {
        title: "Dana",
        subtitle: "Decoration · Wedding Project",
        messages: [
            { sender: "Dana", initials: "D", role: "received", text: "I've started putting together decoration ideas for the venue.", time: "10:32 AM" },
            { sender: "You", role: "sent", text: "Thank you! I'll share the color palette here.", time: "10:36 AM" }
        ]
    },
    mohammad: {
        title: "Mohammad",
        subtitle: "Videography · Wedding Project",
        messages: [
            { sender: "Mohammad", initials: "M", role: "received", text: "Hello! Let's coordinate the video coverage and key moments.", time: "10:40 AM" },
            { sender: "You", role: "sent", text: "Sounds good. I'll send the event schedule when it's ready.", time: "10:43 AM" }
        ]
    }
};

if (isProviderView) {
    document.body.classList.add("provider-chat-view");
    try {
        const providerProfile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
        currentUserName = providerProfile && (providerProfile.companyName || providerProfile.fullName) || "Provider";
    } catch (error) { currentUserName = "Provider"; }
    const providerName = String(currentUserName).trim();
    conversations.team.messages.forEach(entry => { if (entry.sender === "You") entry.sender = providerName; });
    conversations.team.subtitle = "Shared project group · Client and providers";
    conversations.team.system = `Welcome to the project group, ${providerName}. Coordinate directly with the client and other accepted providers.`;
    document.querySelector(".conversation-list-heading h2").textContent = "Project Group";
    document.querySelector(".conversation-list-heading span").textContent = "1";
    document.querySelectorAll(".conversation-item:not([data-conversation='team'])").forEach(item => { item.hidden = true; });
    document.querySelector(".conversation-item[data-conversation='team'] .conversation-copy strong").textContent = "Project Team";
    document.querySelector(".conversation-item[data-conversation='team'] .conversation-copy small").textContent = "Wedding Project · 4 members";
    document.getElementById("details-heading-title").textContent = "Project Group";
    document.getElementById("details-status-text").closest(".project-status").hidden = true;
    document.querySelectorAll(".project-detail-row, #details-team-section, .project-state").forEach(section => { section.hidden = true; });
    document.getElementById("details-subtitle").textContent = "4 members in this group";
    document.querySelector(".usage-container").hidden = true;
    paymentPrompt.hidden = true;
    document.getElementById("project-payment-button").hidden = true;
}

const conversationContacts = {
    ahmad: { name: "Ahmad", service: "Photography" },
    dana: { name: "Dana", service: "Decoration" },
    mohammad: { name: "Mohammad", service: "Videography" }
};
let activeConversationId = "team";

function updateConversationDetails(id) {
    const isTeamChat = id === "team";
    const contact = conversationContacts[id];
    const detailsHeading = document.getElementById("details-heading-title");
    const detailsStatus = document.getElementById("details-status-text");
    const detailsIcon = document.getElementById("details-project-icon");
    const detailsName = document.getElementById("details-name");
    const detailsSubtitle = document.getElementById("details-subtitle");

    detailsHeading.textContent = isTeamChat ? (isProviderView ? "Project Group" : "Project Details") : "Conversation Details";
    detailsStatus.textContent = isTeamChat ? "Team Confirmed" : "Team Member";
    detailsIcon.className = `fa ${isTeamChat ? "fa-heart" : "fa-user"}`;
    detailsName.textContent = isTeamChat ? "Wedding Project" : contact.name;
    detailsSubtitle.textContent = isTeamChat ? (isProviderView ? "4 members in this group" : "Project #TM-1024") : `${contact.service} · Wedding Project`;
    document.getElementById("details-budget-label").textContent = isTeamChat ? "Budget" : "Service";
    document.getElementById("details-budget").textContent = isTeamChat ? "2,500 JOD" : contact.service;
    document.getElementById("details-location-label").textContent = isTeamChat ? "Location" : "Project Location";
    document.getElementById("details-location").textContent = "Amman, Jordan";
    document.getElementById("details-date-label").textContent = isTeamChat ? "Event Date" : "Provider Status";
    document.getElementById("details-event-date").textContent = isTeamChat ? "25 October 2026" : "Accepted";
    document.getElementById("details-members-title").textContent = isTeamChat ? "Team Members" : "Conversation With";

    if (isTeamChat && !isProviderView) {
        const clientName = sessionStorage.getItem("teamlyUserName") || "You";
        const ownerName = [...document.querySelectorAll(".team-member")].find(member => member.querySelector(".member-info span")?.textContent.trim() === "Project Owner")?.querySelector(".member-info strong");
        if (ownerName) ownerName.textContent = clientName;
    }

    document.querySelectorAll(".team-member").forEach(member => {
        const memberName = member.querySelector(".member-info strong")?.textContent.trim();
        member.hidden = !isTeamChat && memberName !== contact.name;
    });
}

function renderConversationMessage(entry) {
    const message = document.createElement("div");
    message.className = `message ${entry.role}`;

    if (entry.role === "received") {
        const avatar = document.createElement("div");
        avatar.className = `message-avatar${entry.initials === "D" ? " decoration-avatar" : ""}`;
        avatar.textContent = entry.initials || entry.sender.charAt(0);
        message.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "message-content";
    const sender = document.createElement("span");
    sender.className = "sender-name";
    sender.textContent = entry.sender;
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = entry.text;
    if (entry.imageUrl) {
        const image = document.createElement("img");
        image.className = "message-image";
        image.alt = "Attached image";
        image.src = entry.imageUrl;
        bubble.appendChild(image);
    }
    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = entry.time;
    content.append(sender, bubble, time);
    message.appendChild(content);
    return message;
}

function renderConversation(id, updateAddress = true) {
    const conversation = conversations[id];
    if (!conversation) return;

    activeConversationId = id;
    conversationTitle.textContent = conversation.title;
    conversationSubtitle.textContent = conversation.subtitle;
    updateConversationDetails(id);
    conversationButtons.forEach(button => {
        const selected = button.dataset.conversation === id;
        button.classList.toggle("active", selected);
        if (selected) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
    });

    messagesArea.replaceChildren();
    const date = document.createElement("div");
    date.className = "chat-date";
    const dateLabel = document.createElement("span");
    dateLabel.textContent = "Today";
    date.appendChild(dateLabel);
    messagesArea.appendChild(date);

    const guide = document.createElement("aside");
    guide.className = "chat-guide-note";
    guide.setAttribute("aria-label", "What to discuss in this project chat");
    guide.innerHTML = `
        <div class="chat-guide-icon" aria-hidden="true"><i class="fa fa-comments-o"></i></div>
        <div class="chat-guide-copy">
            <h2>Make sure every project detail feels right</h2>
            <p>Use this chat to talk things through with your client and providers, and agree on:</p>
            <ul>
                <li>Design ideas, theme, colors, and references</li>
                <li>Event date, exact time, and schedule</li>
                <li>Services, deliverables, and any special requests</li>
                <li>Pricing, budget, and what is included</li>
                <li>Location, setup details, and the next steps</li>
            </ul>
            <p class="chat-guide-footnote">Share your ideas and confirm the details together so everyone is on the same page.</p>
        </div>`;
    messagesArea.appendChild(guide);

    if (conversation.system) {
        const system = document.createElement("div");
        system.className = "system-message";
        system.textContent = conversation.system;
        messagesArea.appendChild(system);
    }

    conversation.messages.forEach(entry => messagesArea.appendChild(renderConversationMessage(entry)));
    messagesArea.scrollTop = messagesArea.scrollHeight;

    if (updateAddress) {
        const url = new URL(window.location.href);
        url.searchParams.set("conversation", id);
        window.history.replaceState({}, "", url);
    }
}

conversationButtons.forEach(button => button.addEventListener("click", () => {
    renderConversation(button.dataset.conversation);
}));

const requestedConversation = new URLSearchParams(window.location.search).get("conversation");
renderConversation(conversations[requestedConversation] ? requestedConversation : "team", false);

// Four messages sent by the current user are allowed.
// This demo keeps the count for this browser tab.
let sentMessages = 0;
let selectedImage = null;


// ======================================
// Add a message to the chat
// ======================================

function addMessage(text, imageFile = null) {
    const message = document.createElement("div");
    let imageUrl = "";

    message.className = "message sent";

    const content = document.createElement("div");
    content.className = "message-content";

    const sender = document.createElement("span");
    sender.className = "sender-name";
    sender.textContent = currentUserName;

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
        imageUrl = URL.createObjectURL(imageFile);
        image.src = imageUrl;

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

    conversations[activeConversationId].messages.push({
        sender: currentUserName,
        role: "sent",
        text,
        imageUrl,
        time: time.textContent
    });
    messagesArea.appendChild(message);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}


// ======================================
// Update the message quota
// ======================================

function updateUsage() {
    if (isProviderView) {
        messageInput.disabled = false;
        attachButton.disabled = false;
        imageInput.disabled = false;
        sendButton.disabled = false;
        paymentPrompt.hidden = true;
        return;
    }
    usageCount.textContent =
        `${sentMessages} / ${FREE_MESSAGE_LIMIT}`;

    usageProgress.style.width =
        `${(sentMessages / FREE_MESSAGE_LIMIT) * 100}%`;

    if (!isProviderView && sentMessages >= FREE_MESSAGE_LIMIT) {
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

    if (!isProviderView && sentMessages >= FREE_MESSAGE_LIMIT) {
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
    if (!isProviderView && sentMessages >= FREE_MESSAGE_LIMIT) {
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

document.getElementById("project-payment-button")
    .addEventListener("click", goToPayment);

unlockChatButton.addEventListener("click", goToPayment);


// ======================================
// Zoom page navigation
// ======================================

document.getElementById("zoom-button")
    .addEventListener("click", function () {
        try {
            const notifications = JSON.parse(window.localStorage.getItem("teamlyAdminNotifications") || "[]");
            const savedNotifications = Array.isArray(notifications) ? notifications : [];
            savedNotifications.unshift({
                id: `zoom-${Date.now()}`,
                kind: "zoom",
                title: "Zoom meeting requested",
                actor: isProviderView ? currentUserName : "Client",
                detail: "A team member opened the project Zoom meeting.",
                timestamp: new Date().toISOString()
            });
            window.localStorage.setItem("teamlyAdminNotifications", JSON.stringify(savedNotifications.slice(0, 500)));
        } catch (error) { /* continue to meeting even if activity cannot be stored */ }
        const zoomUrl = new URL("../Zoom/zoom.html", window.location.href);
        if (isProviderView) zoomUrl.searchParams.set("role", "provider");
        window.location.href = zoomUrl.href;
    });



// ======================================
// Sidebar loader
// ======================================

async function loadSidebar() {
    const container = document.getElementById("sidebar-container");

    try {
        if (isProviderView) {
            container.id = "provider-sidebar-container";
            container.classList.add("provider-sidebar-container");
            const sidebarCss = document.createElement("link");
            sidebarCss.rel = "stylesheet";
            sidebarCss.href = "../Provider/provider_sidebar.css";
            document.head.appendChild(sidebarCss);
            const providerSidebarScript = document.createElement("script");
            providerSidebarScript.src = "../Provider/provider_sidebar.js";
            document.body.appendChild(providerSidebarScript);
            return;
        }

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
