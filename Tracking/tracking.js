// ========================================
// 1. LOAD THE EXISTING SIDEBAR
// ========================================

async function loadSidebar() {
    const container = document.getElementById("sidebar-container");

    try {
        const response = await fetch("../sidebar_client/sidbar.html");

        if (!response.ok) {
            throw new Error("Sidebar HTML file not found");
        }

        container.innerHTML = await response.text();

        // Load sidebar CSS once
        if (!document.querySelector("[data-sidebar-css]")) {
            const css = document.createElement("link");

            css.rel = "stylesheet";
            css.href = "../sidebar_client/sidbar.css";
            css.dataset.sidebarCss = "true";

            document.head.appendChild(css);
        }

    } catch (error) {
        console.error("Sidebar loading error:", error);
    }
}

loadSidebar();


// ========================================
// 2. DEMO PROJECT DATA
// ========================================

// These are example values.
// Later, load them from your backend/database.

const project = {
    name: "Wedding Project",
    id: "TML-2026-014",
    type: "Wedding",
    services: ["Photography"],
    date: "",
    location: "Amman, Jordan",
    budget: 850,
    currency: "JOD",

    providers: [
        {
            id: 1,
            name: "Jordan Doe",
            initials: "JD",
            service: "Photographer",
            rating: 4.8,
            bio: "Experienced photographer specializing in weddings and special events.",
            status: "Pending",
            responseDeadline:
                Date.now() + (23 * 60 + 18) * 60 * 1000
        }
    ]
};


// Example alternative providers shown after rejection.

const alternativeProviders = [
    {
        id: 2,
        name: "Lina Ahmad",
        initials: "LA",
        service: "Photographer",
        rating: 4.9,
        bio: "Professional photographer specializing in weddings, portraits, and special events."
    },
    {
        id: 3,
        name: "Omar Khaled",
        initials: "OK",
        service: "Photographer",
        rating: 4.7,
        bio: "Wedding photographer offering event coverage and creative photography."
    },
    {
        id: 4,
        name: "Sara Studio",
        initials: "SS",
        service: "Photography & Videography",
        rating: 4.8,
        bio: "Photography and videography services for weddings and private events."
    }
];


// ========================================
// 3. CURRENT PAGE STATE
// ========================================

// Possible values:
// "Pending", "Rejected", "Accepted"

let selectedAlternativeId = null;

function getCurrentProvider() {
    return project.providers[0] || null;
}

function getElement(id) {
    return document.getElementById(id);
}


// ========================================
// 4. FORMAT PROJECT INFORMATION
// ========================================

function formatBudget() {
    return `${project.budget} ${project.currency}`;
}

function formatDate() {
    return project.date || "Not set";
}


// ========================================
// 5. RENDER PROJECT DETAILS
// ========================================

function renderProjectDetails() {
    getElement("projectName").textContent = project.name;
    getElement("projectId").textContent = project.id;

    getElement("projectLocation").textContent = project.location;
    getElement("projectBudget").textContent = formatBudget();

    getElement("projectTeamCount").textContent =
        `${project.providers.length} Provider`;

    getElement("detailType").textContent = project.type;

    getElement("detailServices").textContent =
        project.services.length
            ? project.services.join(", ")
            : "Not selected";

    getElement("detailDate").textContent = formatDate();
    getElement("detailLocation").textContent = project.location;
    getElement("detailBudget").textContent = formatBudget();

    getElement("selectedCount").textContent =
        `${project.providers.length} of ${project.providers.length}`;

    getElement("teamProgress").style.width =
        project.providers.length > 0 ? "100%" : "0%";
}


// ========================================
// 6. RENDER SELECTED PROVIDER
// ========================================

function renderProvider() {
    const provider = getCurrentProvider();

    if (!provider) {
        getElement("providerName").textContent = "No provider selected";
        getElement("providerService").textContent = "Not selected";

        getElement("providerAvatar").textContent = "--";
        getElement("providerRating").textContent = "--";

        getElement("sideProviderName").textContent = "No provider selected";
        getElement("sideProviderService").textContent = "Not selected";

        getElement("sideProviderAvatar").textContent = "--";
        getElement("sideProviderRating").textContent = "--";

        getElement("providerStatus").textContent = "No Request";
        getElement("sideProviderStatus").textContent = "No Request";

        getElement("timeRemaining").textContent = "--";

        return;
    }

    getElement("providerName").textContent = provider.name;
    getElement("providerService").textContent = provider.service;

    getElement("providerAvatar").textContent = provider.initials;
    getElement("providerRating").textContent = provider.rating;

    getElement("sideProviderName").textContent = provider.name;
    getElement("sideProviderService").textContent = provider.service;

    getElement("sideProviderAvatar").textContent = provider.initials;
    getElement("sideProviderRating").textContent = provider.rating;

    const statusText = {
        Pending: "Pending Request",
        Rejected: "Rejected",
        Accepted: "Accepted"
    };

    const badgeClass = {
        Pending: "pending",
        Rejected: "rejected",
        Accepted: "accepted"
    };

    getElement("providerStatus").textContent =
        statusText[provider.status];

    getElement("sideProviderStatus").textContent =
        provider.status;

    getElement("providerStatus").className =
        `status-badge ${badgeClass[provider.status]}`;

    getElement("sideProviderStatus").className =
        `status-badge ${badgeClass[provider.status]}`;

    updateRemainingTime();
}


// ========================================
// 7. UPDATE RESPONSE TIMER
// ========================================

function updateRemainingTime() {
    const provider = getCurrentProvider();

    if (!provider) {
        getElement("timeRemaining").textContent = "--";
        return;
    }

    if (provider.status === "Accepted") {
        getElement("timeRemaining").textContent = "Accepted";
        return;
    }

    if (provider.status === "Rejected") {
        getElement("timeRemaining").textContent = "Request rejected";
        return;
    }

    const remaining = Math.max(
        0,
        provider.responseDeadline - Date.now()
    );

    const totalMinutes = Math.floor(remaining / 60000);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    getElement("timeRemaining").textContent =
        remaining === 0
            ? "Time expired"
            : `${hours}h ${minutes}m`;
}


// ========================================
// 8. UPDATE TEAM PROCESS
// ========================================

function renderTeamProcess() {
    const provider = getCurrentProvider();

    const waitingStep = getElement("waitingStep");
    const confirmedStep = getElement("confirmedStep");

    const waitingCircle = getElement("waitingCircle");
    const confirmedCircle = getElement("confirmedCircle");

    waitingStep.classList.remove("active");
    confirmedStep.classList.remove("confirmed");

    waitingCircle.innerHTML = "2";
    confirmedCircle.innerHTML = '<i class="fa fa-check"></i>';

    if (!provider) {
        getElement("projectStatus").textContent = "No Provider";
        getElement("waitingText").textContent = "No request";
        getElement("confirmedText").textContent = "Not confirmed";
        return;
    }

    if (provider.status === "Pending") {
        waitingStep.classList.add("active");

        getElement("waitingText").textContent = "Awaiting reply";
        getElement("confirmedText").textContent = "Not confirmed";

        getElement("projectStatus").textContent = "In Progress";
        getElement("projectStatus").className = "status-badge pending";
    }

    if (provider.status === "Rejected") {
        waitingStep.classList.add("active");

        waitingCircle.innerHTML = '<i class="fa fa-times"></i>';

        getElement("waitingText").textContent = "Request rejected";
        getElement("confirmedText").textContent = "Not confirmed";

        getElement("projectStatus").textContent = "Request Rejected";
        getElement("projectStatus").className = "status-badge rejected";
    }

    if (provider.status === "Accepted") {
        waitingCircle.innerHTML = '<i class="fa fa-check"></i>';

        confirmedStep.classList.add("confirmed");

        getElement("waitingText").textContent = "Response received";
        getElement("confirmedText").textContent = "Provider accepted";

        getElement("projectStatus").textContent = "Confirmed";
        getElement("projectStatus").className = "status-badge accepted";
    }
}


// ========================================
// 9. SHOW THE CORRECT STATE PANEL
// ========================================

function renderStatePanel() {
    const provider = getCurrentProvider();

    getElement("pendingPanel").hidden = true;
    getElement("alternativesPanel").hidden = true;
    getElement("connectPanel").hidden = true;

    getElement("requestTimerBox").hidden = true;

    if (!provider) {
        getElement("pendingPanel").hidden = false;

        getElement("pendingPanel").querySelector("p").textContent =
            "Choose a provider to send a new request.";

        return;
    }

    if (provider.status === "Pending") {
        getElement("pendingPanel").hidden = false;
        getElement("requestTimerBox").hidden = false;
    }

    if (provider.status === "Rejected") {
        getElement("alternativesPanel").hidden = false;

        renderAlternativeProviders();
    }

    if (provider.status === "Accepted") {
        getElement("connectPanel").hidden = false;

        getElement("acceptedProviderName").textContent =
            provider.name;
    }
}


// ========================================
// 10. RENDER ALTERNATIVE PROVIDERS
// ========================================

function renderAlternativeProviders() {
    const container = getElement("alternativeProviders");

    container.replaceChildren();

    alternativeProviders.forEach(provider => {
        const card = document.createElement("article");

        card.className = "alternative-provider";

        if (provider.id === selectedAlternativeId) {
            card.classList.add("selected");
        }

        const top = document.createElement("div");
        top.className = "alternative-top";

        const avatar = document.createElement("div");
        avatar.className = "provider-avatar small-avatar";
        avatar.textContent = provider.initials;

        const info = document.createElement("div");
        info.className = "alternative-info";

        const name = document.createElement("h4");
        name.textContent = provider.name;

        const service = document.createElement("p");
        service.textContent = provider.service;

        const rating = document.createElement("div");
        rating.className = "alternative-rating";
        rating.innerHTML =
            '<i class="fa fa-star"></i> ' +
            `${provider.rating} <span class="rating-label">Rating</span>`;

        info.append(name, service, rating);
        top.append(avatar, info);

        const actions = document.createElement("div");
        actions.className = "alternative-actions";

        const profileButton = document.createElement("button");
        profileButton.type = "button";
        profileButton.className = "profile-btn";
        profileButton.innerHTML =
            '<i class="fa fa-user"></i> View Profile';

        profileButton.addEventListener("click", () => {
            openProviderProfile(provider.id);
        });

        const selectButton = document.createElement("button");
        selectButton.type = "button";
        selectButton.className = "select-provider-btn";

        selectButton.innerHTML =
            provider.id === selectedAlternativeId
                ? '<i class="fa fa-check"></i> Selected'
                : "Select";

        selectButton.addEventListener("click", () => {
            selectAlternativeProvider(provider.id);
        });

        actions.append(profileButton, selectButton);

        card.append(top, actions);

        container.appendChild(card);
    });

    getElement("sendRequestBtn").disabled =
        selectedAlternativeId === null;
}


// ========================================
// 11. SELECT AN ALTERNATIVE PROVIDER
// ========================================

function selectAlternativeProvider(providerId) {
    selectedAlternativeId = providerId;

    const provider = alternativeProviders.find(
        item => item.id === providerId
    );

    if (!provider) {
        return;
    }

    getElement("selectionMessage").textContent =
        `${provider.name} selected. Click Send Request to continue.`;

    renderAlternativeProviders();
}


// ========================================
// 12. PROVIDER PROFILE MODAL
// ========================================

function openProviderProfile(providerId) {
    const provider = alternativeProviders.find(
        item => item.id === providerId
    );

    if (!provider) {
        return;
    }

    getElement("profileModalAvatar").textContent =
        provider.initials;

    getElement("profileModalName").textContent =
        provider.name;

    getElement("profileModalService").textContent =
        provider.service;

    getElement("profileModalRating").textContent =
        provider.rating;

    getElement("profileModalBio").textContent =
        provider.bio;

    getElement("modalSelectBtn").onclick = function () {
        selectAlternativeProvider(provider.id);

        closeProviderProfile();
    };

    getElement("profileModal").hidden = false;

    getElement("closeProfileModal").focus();
}


function closeProviderProfile() {
    getElement("profileModal").hidden = true;
}

getElement("closeProfileModal").addEventListener(
    "click",
    closeProviderProfile
);

getElement("profileModal").addEventListener("click", function (event) {
    if (event.target === this) {
        closeProviderProfile();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeProviderProfile();
    }
});


// ========================================
// 13. SEND REQUEST TO THE NEW PROVIDER
// ========================================

getElement("sendRequestBtn").addEventListener("click", function () {
    if (selectedAlternativeId === null) {
        getElement("selectionMessage").textContent =
            "Please select a provider first.";

        return;
    }

    const newProvider = alternativeProviders.find(
        provider => provider.id === selectedAlternativeId
    );

    if (!newProvider) {
        return;
    }

    // The old provider remains rejected.
    // The selected alternative becomes the active request.

    project.providers = [{
        ...newProvider,
        status: "Pending",
        responseDeadline:
            Date.now() + 24 * 60 * 60 * 1000
    }];

    selectedAlternativeId = null;

    getElement("trackingMessage").textContent =
        `Request sent to ${newProvider.name}. Waiting for a response.`;

    renderPage();
});


// ========================================
// 14. REFRESH
// ========================================

getElement("refreshBtn").addEventListener("click", function () {
    renderPage();

    getElement("trackingMessage").textContent =
        "Project information refreshed.";
});


// ========================================
// 15. RENDER ALL PAGE SECTIONS
// ========================================

function renderPage() {
    renderProjectDetails();
    renderProvider();
    renderTeamProcess();
    renderStatePanel();
}


// ========================================
// 16. TIMER UPDATES
// ========================================

setInterval(function () {
    const provider = getCurrentProvider();

    if (provider && provider.status === "Pending") {
        updateRemainingTime();
    }
}, 60000);


// ========================================
// 17. INITIAL RENDER
// ========================================

renderPage();


// ========================================
// 18. DEMO / BACKEND INTEGRATION
// ========================================

// Call this function when your backend reports a provider response.
// Example:
// updateProviderStatus("Rejected");
// updateProviderStatus("Accepted");

function updateProviderStatus(newStatus) {
    const allowedStatuses = ["Pending", "Rejected", "Accepted"];

    if (!allowedStatuses.includes(newStatus)) {
        console.error("Invalid provider status:", newStatus);
        return;
    }

    const provider = getCurrentProvider();

    if (!provider) {
        return;
    }

    provider.status = newStatus;

    if (newStatus === "Rejected") {
        selectedAlternativeId = null;
    }

    renderPage();
}
