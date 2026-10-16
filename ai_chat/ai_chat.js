document.addEventListener("DOMContentLoaded", function () {

    let isLoggedIn = false;
    try {
        isLoggedIn = sessionStorage.getItem("teamlyLoggedIn") === "true";
    } catch (error) {
        isLoggedIn = false;
    }
    const layout = document.querySelector(".ai-layout");
    const sidebarContainer = document.getElementById("sidebar-container");
    if (layout) layout.classList.toggle("ai-guest", !isLoggedIn);
    if (sidebarContainer) sidebarContainer.hidden = !isLoggedIn;

    // ==================================
    // 1. User Information
    // ==================================

    // Connect this to the logged-in user's data later.
    // Example: window.currentUser = { name: "Sara" };

    const currentUser = window.currentUser || null;
    const welcomeGreeting = document.getElementById("welcomeGreeting");
    const welcomeName = document.getElementById("welcomeName");
    let storedUserName = "";
    if (isLoggedIn) {
        try {
            storedUserName = sessionStorage.getItem("teamlyUserName") || "";
        } catch (error) {
            storedUserName = "";
        }
    }

    const signedInName = (currentUser && currentUser.name) || storedUserName;
    if (isLoggedIn) {
        welcomeGreeting.textContent = "Hello,";
        welcomeName.textContent = signedInName || "there";
    } else {
        welcomeGreeting.textContent = "Welcome to";
        welcomeName.textContent = "TEAMLY";
    }


    // ==================================
    // 2. Load Existing Sidebar
    // ==================================

    if (isLoggedIn && sidebarContainer) fetch("../sidebar_client/sidbar.html")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Sidebar file was not found.");
            }

            return response.text();
        })
        .then(function (html) {
            sidebarContainer.innerHTML = html;
            const script = document.createElement("script");
            script.src = "../sidebar_client/sidbar.js";
            document.body.appendChild(script);
        })
        .catch(function (error) {
            console.warn("Could not load the sidebar:", error);
        });


    // ==================================
    // 3. Chat Elements
    // ==================================

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const historyPanel = document.getElementById("chatHistoryPanel");
    const historyList = document.getElementById("chatHistoryList");
    const historyEmpty = document.getElementById("chatHistoryEmpty");
    const toggleHistoryButton = document.getElementById("toggleHistoryButton");
    const closeHistoryButton = document.getElementById("closeHistoryButton");
    const newChatButton = document.getElementById("newChatButton");
    const cancelEditButton = document.getElementById("cancelEditButton");
    const sendButton = chatForm.querySelector(".send-button");
    const deleteChatDialog = document.getElementById("deleteChatDialog");
    const deleteChatName = document.getElementById("deleteChatName");
    const cancelDeleteChatButton = document.getElementById("cancelDeleteChat");
    const confirmDeleteChatButton = document.getElementById("confirmDeleteChat");

    const summaryEmpty = document.getElementById("summaryEmpty");
    const summaryDetails = document.getElementById("summaryDetails");

    const searchTeamButton =
        document.getElementById("searchTeamButton");


    // ==================================
    // 4. Project Data
    // ==================================

    const createEmptyProject = () => ({
        type: "", services: [], description: [], date: "", location: "", budget: "",
        teamStatus: "Not started", planning: "Waiting for project details"
    });
    let project = createEmptyProject();
    const conversationsKey = "teamlyAiConversations";
    const greeting = "Hi! I'm TEAMLY AI. Tell me about your project, and I'll help you identify the services you need, organize your plans, and build your team.";
    let conversations = [];
    let currentConversation = null;
    let editingMessageIndex = null;
    let pendingDeleteId = null;

    try {
        const savedConversations = JSON.parse(localStorage.getItem(conversationsKey) || "[]");
        if (Array.isArray(savedConversations)) {
            conversations = savedConversations.filter((item) => item && item.id && Array.isArray(item.messages));
        }
    } catch (error) {
        conversations = [];
    }

    function persistConversations() {
        try {
            localStorage.setItem(conversationsKey, JSON.stringify(conversations));
        } catch (error) {
            // Keep the chat working when browser storage is unavailable or full.
        }
    }

    function conversationTitle(conversation) {
        const firstUserMessage = conversation.messages.find((item) => item.sender === "user");
        return firstUserMessage ? firstUserMessage.text.slice(0, 46) : "New Chat";
    }

    function renderHistory() {
        historyList.replaceChildren();
        const ordered = [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        historyEmpty.hidden = ordered.length > 0;
        ordered.forEach((conversation) => {
            const entry = document.createElement("div");
            entry.className = "chat-history-entry";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-history-item" + (currentConversation && currentConversation.id === conversation.id ? " is-active" : "");
            button.setAttribute("aria-current", currentConversation && currentConversation.id === conversation.id ? "true" : "false");

            const title = document.createElement("span");
            title.className = "chat-history-item-title";
            title.textContent = conversationTitle(conversation);
            const meta = document.createElement("span");
            meta.className = "chat-history-item-meta";
            const date = new Date(conversation.updatedAt || Date.now());
            meta.textContent = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " · " + Math.max(0, conversation.messages.filter((item) => item.sender === "user").length) + " messages";
            button.append(title, meta);
            button.addEventListener("click", () => openConversation(conversation.id));
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-chat-button";
            deleteButton.setAttribute("aria-label", "Delete chat: " + conversationTitle(conversation));
            deleteButton.title = "Delete chat";
            deleteButton.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
            deleteButton.addEventListener("click", () => askToDeleteConversation(conversation.id));
            entry.append(button, deleteButton);
            historyList.appendChild(entry);
        });
    }

    function askToDeleteConversation(id) {
        const conversation = conversations.find((item) => item.id === id);
        if (!conversation) return;
        pendingDeleteId = id;
        deleteChatName.textContent = conversationTitle(conversation);
        deleteChatDialog.showModal();
        cancelDeleteChatButton.focus();
    }

    function deleteConversation(id) {
        if (!conversations.some((item) => item.id === id)) return;
        conversations = conversations.filter((item) => item.id !== id);
        persistConversations();
        if (currentConversation && currentConversation.id === id) {
            const next = [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
            if (next) openConversation(next.id);
            else {
                currentConversation = null;
                project = createEmptyProject();
                chatMessages.replaceChildren();
                renderStoredMessage({ sender: "ai", text: greeting });
                summaryEmpty.hidden = false;
                summaryDetails.hidden = true;
                cancelMessageEdit();
                renderHistory();
            }
        } else {
            renderHistory();
        }
    }

    function setHistoryOpen(isOpen) {
        historyPanel.hidden = !isOpen;
        toggleHistoryButton.setAttribute("aria-expanded", String(isOpen));
    }

    function renderStoredMessage(item, index) {
        const message = document.createElement("div");
        message.className = "message " + (item.sender === "user" ? "user-message" : "ai-message");
        if (item.sender === "ai") {
            const avatar = document.createElement("div");
            avatar.className = "message-avatar";
            const icon = document.createElement("i");
            icon.className = "fa fa-magic";
            icon.setAttribute("aria-hidden", "true");
            avatar.appendChild(icon);
            message.appendChild(avatar);
        }
        const content = document.createElement("div");
        content.className = "message-content";
        const paragraph = document.createElement("p");
        paragraph.textContent = item.text;
        content.appendChild(paragraph);
        message.appendChild(content);
        if (item.sender === "user") {
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "edit-message-button";
            editButton.setAttribute("aria-label", "Edit your message");
            editButton.title = "Edit message";
            editButton.innerHTML = '<i class="fa fa-pencil" aria-hidden="true"></i>';
            editButton.addEventListener("click", () => beginMessageEdit(index));
            message.appendChild(editButton);
        }
        chatMessages.appendChild(message);
        return message;
    }

    function beginMessageEdit(index) {
        const item = currentConversation && currentConversation.messages[index];
        if (!item || item.sender !== "user") return;
        editingMessageIndex = index;
        chatInput.value = item.text;
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
        cancelEditButton.hidden = false;
        sendButton.setAttribute("aria-label", "Save edited message");
        sendButton.title = "Save edited message";
        chatInput.focus();
    }

    function cancelMessageEdit() {
        editingMessageIndex = null;
        chatInput.value = "";
        chatInput.style.height = "auto";
        cancelEditButton.hidden = true;
        sendButton.setAttribute("aria-label", "Send message");
        sendButton.title = "Send message";
    }

    function rebuildProjectFromConversation() {
        project = createEmptyProject();
        currentConversation.messages
            .filter((item) => item.sender === "user")
            .forEach((item) => analyzeMessage(item.text));
        currentConversation.project = JSON.parse(JSON.stringify(project));
    }

    function openConversation(id) {
        const selected = conversations.find((item) => item.id === id);
        if (!selected) return;
        currentConversation = selected;
        project = Object.assign(createEmptyProject(), selected.project || {});
        project.services = Array.isArray(project.services) ? project.services : [];
        project.description = Array.isArray(project.description) ? project.description : [];
        chatMessages.replaceChildren();
        selected.messages.forEach(renderStoredMessage);
        if (selected.project && (project.type || project.description.length || project.services.length || project.date || project.location || project.budget)) {
            updateSummary();
        } else {
            summaryEmpty.hidden = false;
            summaryDetails.hidden = true;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
        cancelMessageEdit();
        setHistoryOpen(false);
        renderHistory();
    }

    function startNewConversation() {
        project = createEmptyProject();
        currentConversation = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            updatedAt: Date.now(),
            messages: [{ sender: "ai", text: greeting }],
            project: project
        };
        conversations.push(currentConversation);
        persistConversations();
        chatMessages.replaceChildren();
        renderStoredMessage(currentConversation.messages[0]);
        summaryEmpty.hidden = false;
        summaryDetails.hidden = true;
        chatInput.value = "";
        chatInput.style.height = "auto";
        cancelMessageEdit();
        setHistoryOpen(false);
        renderHistory();
        chatInput.focus();
    }


    // ==================================
    // 5. Add Chat Message
    // ==================================

    function addMessage(text, sender) {
        if (!currentConversation) startNewConversation();
        currentConversation.messages.push({ sender: sender, text: text });
        currentConversation.updatedAt = Date.now();
        currentConversation.project = JSON.parse(JSON.stringify(project));
        const message = renderStoredMessage({ sender: sender, text: text }, currentConversation.messages.length - 1);
        persistConversations();
        renderHistory();

        message.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    toggleHistoryButton.addEventListener("click", () => setHistoryOpen(historyPanel.hidden));
    closeHistoryButton.addEventListener("click", () => setHistoryOpen(false));
    newChatButton.addEventListener("click", startNewConversation);
    cancelEditButton.addEventListener("click", cancelMessageEdit);
    cancelDeleteChatButton.addEventListener("click", () => {
        pendingDeleteId = null;
        deleteChatDialog.close();
        toggleHistoryButton.focus();
    });
    confirmDeleteChatButton.addEventListener("click", () => {
        const id = pendingDeleteId;
        pendingDeleteId = null;
        deleteChatDialog.close();
        if (id) deleteConversation(id);
        toggleHistoryButton.focus();
    });
    const mostRecentConversation = [...conversations].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    if (mostRecentConversation) openConversation(mostRecentConversation.id);
    else startNewConversation();


    // ==================================
    // 6. Analyze Project Information
    // ==================================

    function analyzeMessage(text) {

        const lowerText = text.toLowerCase();

        // Project types
        const projectTypes = [
            {
                name: "Wedding",
                keywords: ["wedding", "bride", "groom", "marriage"]
            },
            {
                name: "Birthday",
                keywords: ["birthday"]
            },
            {
                name: "Corporate Event",
                keywords: [
                    "corporate event",
                    "company event",
                    "conference"
                ]
            },
            {
                name: "Graduation",
                keywords: ["graduation"]
            },
            {
                name: "Engagement",
                keywords: ["engagement"]
            },
            {
                name: "Private Event",
                keywords: ["party", "celebration", "event"]
            }
        ];

        for (const item of projectTypes) {

            if (
                item.keywords.some(function (keyword) {
                    return lowerText.includes(keyword);
                })
            ) {
                project.type = item.name;
                break;
            }
        }


        // Services
        const services = [
            {
                name: "Photography",
                keywords: ["photography", "photographer", "photos"]
            },
            {
                name: "Videography",
                keywords: ["videography", "videographer", "video"]
            },
            {
                name: "Decoration",
                keywords: ["decoration", "decorator", "decor"]
            },
            {
                name: "Catering",
                keywords: ["catering", "food", "caterer"]
            },
            {
                name: "DJ & Music",
                keywords: ["dj", "music", "musician"]
            },
            {
                name: "Hall & Venue",
                keywords: ["hall", "venue"]
            }
        ];

        services.forEach(function (item) {

            const found = item.keywords.some(function (keyword) {
                return lowerText.includes(keyword);
            });

            if (found && !project.services.includes(item.name)) {
                project.services.push(item.name);
            }
        });


        // Date detection: examples 12/10 or 12/10/2026
        const dateMatch = text.match(
            /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/
        );

        if (dateMatch) {
            project.date = dateMatch[0];
        }


        // Budget detection: examples 500 JOD, JOD 500, $500
        const budgetMatch = text.match(
            /(?:\$|jod\s*)\s*\d+(?:[,.]\d+)?|\d+(?:[,.]\d+)?\s*(?:jod|jd|dollars|dollar)\b/i
        );

        if (budgetMatch) {
            project.budget = budgetMatch[0];
        }


        // Location detection:
        // Examples: Location: Amman / in Irbid / in Aqaba
        const locationMatch = text.match(
            /\b(?:location\s*:\s*|in\s+)(Amman|Irbid|Aqaba|Zarqa|Salt|Madaba|Jerash|Ajloun|Mafraq|Karak|Tafilah|Ma'an|Aqaba)\b/i
        );

        if (locationMatch) {
            project.location = locationMatch[1];
        }


        // Save message as a project detail
        if (!project.description.includes(text)) {
            project.description.push(text);
        }

        project.planning = "Project information is being collected";

        updateSummary();
    }


    // ==================================
    // 7. Update Project Summary
    // ==================================

    function setSummaryText(id, value) {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = value || "Not specified yet";
        }
    }

    function updateSummary() {

        summaryEmpty.hidden = true;
        summaryDetails.hidden = false;

        setSummaryText("summaryType", project.type);

        setSummaryText(
            "summaryServices",
            project.services.join(", ")
        );

        setSummaryText(
            "summaryDescription",
            project.description.join(" ").slice(0, 350)
        );

        setSummaryText("summaryDate", project.date);
        setSummaryText("summaryLocation", project.location);
        setSummaryText("summaryBudget", project.budget);
        setSummaryText("summaryTeamStatus", project.teamStatus);
        setSummaryText("summaryPlanning", project.planning);
    }


    // ==================================
    // 8. Send Message
    // ==================================

    chatForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const text = chatInput.value.trim();

        if (!text) {
            return;
        }

        // Clear the composer as soon as the message is accepted.
        chatInput.value = "";
        chatInput.style.height = "auto";

        if (editingMessageIndex !== null) {
            const editedIndex = editingMessageIndex;
            const nextMessage = currentConversation.messages[editedIndex + 1];
            currentConversation.messages[editedIndex].text = text;
            if (nextMessage && nextMessage.sender === "ai") {
                currentConversation.messages.splice(editedIndex + 1, 1);
            }
            rebuildProjectFromConversation();
            currentConversation.updatedAt = Date.now();
            currentConversation.messages.splice(editedIndex + 1, 0, {
                sender: "ai",
                text: "Thanks for the update! I've refreshed your project details. You can share more about your services, date, location, or budget."
            });
            currentConversation.project = JSON.parse(JSON.stringify(project));
            persistConversations();
            chatMessages.replaceChildren();
            currentConversation.messages.forEach(renderStoredMessage);
            cancelMessageEdit();
            renderHistory();
            return;
        }

        addMessage(text, "user");

        analyzeMessage(text);

        // Demo response only.
        // A real AI API must be connected for actual AI responses.
        addMessage(
            "Thanks for sharing! I'm collecting your project details. " +
            "You can tell me more about the services you need, your date, " +
            "location, or budget.",
            "ai"
        );
    });


    // ==================================
    // 9. Auto Resize Input
    // ==================================

    chatInput.addEventListener("input", function () {

        chatInput.style.height = "auto";

        chatInput.style.height =
            Math.min(chatInput.scrollHeight, 120) + "px";
    });


    // ==================================
    // 10. Search for Team
    // ==================================

    searchTeamButton.addEventListener("click", function () {

        if (!project.type && project.description.length === 0) {

            addMessage(
                "Tell me a little about your project before searching for a team.",
                "ai"
            );

            chatInput.focus();
            return;
        }

        // Replace this with the actual team-search page.
        window.location.href = "../select_provider/select_provider.html";
    });

});
