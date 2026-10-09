document.addEventListener("DOMContentLoaded", function () {

    // ==================================
    // 1. User Information
    // ==================================

    // Connect this to the logged-in user's data later.
    // Example: window.currentUser = { name: "Sara" };

    const currentUser = window.currentUser || null;
    const welcomeName = document.getElementById("welcomeName");

    if (currentUser && currentUser.name) {
        welcomeName.textContent = currentUser.name;
    } else {
        welcomeName.textContent = "TEAMLY";
    }


    // ==================================
    // 2. Load Existing Sidebar
    // ==================================

    const sidebarContainer =
        document.getElementById("sidebar-container");

    fetch("../sidebar_client/sidbar.html")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Sidebar file was not found.");
            }

            return response.text();
        })
        .then(function (html) {
            sidebarContainer.innerHTML = html;
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

    const summaryEmpty = document.getElementById("summaryEmpty");
    const summaryDetails = document.getElementById("summaryDetails");

    const searchTeamButton =
        document.getElementById("searchTeamButton");


    // ==================================
    // 4. Project Data
    // ==================================

    const project = {
        type: "",
        services: [],
        description: [],
        date: "",
        location: "",
        budget: "",
        teamStatus: "Not started",
        planning: "Waiting for project details"
    };


    // ==================================
    // 5. Add Chat Message
    // ==================================

    function addMessage(text, sender) {

        const message = document.createElement("div");

        message.className = "message " +
            (sender === "user" ? "user-message" : "ai-message");

        if (sender === "ai") {

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
        paragraph.textContent = text;

        content.appendChild(paragraph);
        message.appendChild(content);

        chatMessages.appendChild(message);

        message.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }


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

        addMessage(text, "user");

        analyzeMessage(text);

        chatInput.value = "";
        chatInput.style.height = "auto";

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
        window.location.href = "search-team.html";
    });

});