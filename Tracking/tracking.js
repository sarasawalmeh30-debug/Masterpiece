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
    services: ["Photography", "Videography", "Decoration"],
    date: "",
    location: "Amman, Jordan",
    budget: 320,
    currency: "JOD",

    providers: [
        {
            id: 1,
            name: "Ahmad Khaled",
            initials: "AK",
            service: "Photography",
            rating: 4.8,
            price: 30,
            pricingUnit: "hour",
            pricingQuantity: 1,
            bio: "Wedding photographer specializing in event coverage and portraits.",
            status: "Pending",
            responseDeadline:
                Date.now() + (23 * 60 + 18) * 60 * 1000
        },
        {
            id: 2,
            name: "Maya Naser",
            initials: "MN",
            service: "Videography",
            rating: 4.7,
            price: 40,
            pricingUnit: "hour",
            pricingQuantity: 1,
            bio: "Event videographer creating cinematic wedding films.",
            status: "Pending",
            responseDeadline: Date.now() + 24 * 60 * 60 * 1000
        },
        {
            id: 3,
            name: "Omar Saleh",
            initials: "OS",
            service: "Decoration",
            rating: 4.9,
            price: 250,
            pricingUnit: "package",
            pricingQuantity: 1,
            bio: "Event decorator specializing in wedding and celebration setups.",
            status: "Pending",
            responseDeadline: Date.now() + 24 * 60 * 60 * 1000
        }
    ]
};
let restoredTrackingProviderId = null;

try {
    const draft = JSON.parse(sessionStorage.getItem("teamlyTrackingProjectDraft") || "null");
    if (draft && Array.isArray(draft.providers) && draft.providers.length) {
        project.name = draft.name || project.name;
        project.location = draft.location || project.location;
        project.budget = Number.isFinite(draft.budget) ? draft.budget : project.budget;
        project.currency = draft.currency || project.currency;
        project.providers = draft.providers.map((provider, index) => ({
            ...provider,
            status: "Pending",
            bio: "Service provider selected for this project.",
            responseDeadline: Date.now() + (23 * 60 + 18) * 60 * 1000
        }));
        const scheduledProvider = project.providers.find(provider => provider.date);
        if (scheduledProvider) {
            project.date = scheduledProvider.date;
            project.time = scheduledProvider.time || "";
            project.timeRange = scheduledProvider.timeRange || "";
        }
        sessionStorage.removeItem("teamlyTrackingProjectDraft");
    }
} catch (error) { /* Keep the sample tracking project if no selection was passed. */ }

try {
    const savedState = JSON.parse(sessionStorage.getItem("teamlyTrackingReturnState") || "null");
    if (savedState && Array.isArray(savedState.providers)) {
        project.name = savedState.name || project.name;
        project.location = savedState.location || project.location;
        project.date = savedState.date || project.date;
        project.time = savedState.time || "";
        project.budget = Number.isFinite(savedState.budget) ? savedState.budget : project.budget;
        project.providers = savedState.providers;
        restoredTrackingProviderId = savedState.activeProviderId ?? null;
        sessionStorage.removeItem("teamlyTrackingReturnState");
    }
} catch (error) { /* Keep current tracking data if the return state is unavailable. */ }

let pendingProfileAlternative = null;
try {
    const selection = JSON.parse(sessionStorage.getItem("teamlyTrackingAlternativeSelection") || "null");
    if (selection && selection.provider) pendingProfileAlternative = selection.provider;
    sessionStorage.removeItem("teamlyTrackingAlternativeSelection");
} catch (error) { /* Keep the current tracking state if no profile selection was saved. */ }


// Example alternative providers shown after rejection.

const alternativeProviders = [
    {
        id: 2,
        name: "Lina Ahmad",
        initials: "LA",
        service: "Photographer",
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 4.9,
        location: "Amman, Jordan",
        price: 700,
        bio: "Professional photographer specializing in weddings, portraits, and special events."
    },
    {
        id: 3,
        name: "Omar Khaled",
        initials: "OK",
        service: "Photographer",
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 4.7,
        location: "Irbid, Jordan",
        price: 650,
        bio: "Wedding photographer offering event coverage and creative photography."
    },
    {
        id: 4,
        name: "Sara Studio",
        initials: "SS",
        service: "Photography & Videography",
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 4.8,
        location: "Amman, Jordan",
        price: 900,
        bio: "Photography and videography services for weddings and private events."
    },
    {
        id: 5,
        name: "Maya Naser",
        initials: "MN",
        service: "Videography",
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 4.8,
        location: "Amman, Jordan",
        price: 650,
        bio: "Event videographer creating cinematic wedding films."
    },
    {
        id: 6,
        name: "Omar Saleh",
        initials: "OS",
        service: "Decoration",
        pricingUnit: "package",
        pricingQuantity: 1,
        rating: 4.7,
        location: "Amman, Jordan",
        price: 600,
        bio: "Event decorator specializing in wedding and celebration setups."
    },
    {
        id: 7,
        name: "Sara Haddad",
        initials: "SH",
        service: "Catering",
        pricingUnit: "package",
        pricingQuantity: 1,
        rating: 4.9,
        location: "Zarqa, Jordan",
        price: 500,
        bio: "Catering provider for weddings and private events."
    }
];

function serviceCategories(service) {
    const value = String(service || "").toLowerCase();
    const categories = [];
    if (/(photo|photographer)/.test(value)) categories.push("photography");
    if (/(video|videographer)/.test(value)) categories.push("videography");
    if (/(decor)/.test(value)) categories.push("decoration");
    if (/(cater|food)/.test(value)) categories.push("catering");
    return categories;
}

function getAlternativeProvidersForCurrentService() {
    const rejectedProvider = getCurrentProvider();
    const rejectedCategories = serviceCategories(rejectedProvider?.service);
    return alternativeProviders.filter(provider =>
        serviceCategories(provider.service).some(category => rejectedCategories.includes(category))
    );
}


// ========================================
// 3. CURRENT PAGE STATE
// ========================================

// Possible values:
// "Pending", "Rejected", "Accepted"

let selectedAlternativeId = pendingProfileAlternative ? Number(pendingProfileAlternative.id) : null;
let selectedTrackingProviderId = restoredTrackingProviderId ?? project.providers[0]?.id ?? null;

function getCurrentProvider() {
    return project.providers.find(provider => String(provider.id) === String(selectedTrackingProviderId)) || project.providers[0] || null;
}

function renderTrackingProviderSelector() {
    const selector = getElement("trackingProviderSelect");
    if (!selector) return;
    selector.replaceChildren();
    project.providers.forEach((provider, index) => {
        const option = document.createElement("option");
        option.value = String(provider.id ?? index);
        option.textContent = `${provider.name} · ${provider.service} · ${provider.status}`;
        selector.append(option);
    });
    const current = getCurrentProvider();
    if (current) {
        selectedTrackingProviderId = current.id ?? project.providers.indexOf(current);
        selector.value = String(selectedTrackingProviderId);
    }
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

function estimateProviderBudget(provider) {
    if (!provider || !Number.isFinite(provider.price)) return null;
    if (Number.isFinite(provider.estimatedPrice)) return provider.estimatedPrice;
    const covered = Number(provider.pricingQuantity) > 0 ? Number(provider.pricingQuantity) : 1;
    const requested = provider.pricingUnit === "hour"
        ? Number(provider.durationHours) || covered
        : Number(provider.quantity) || covered;
    return provider.pricingUnit === "hour"
        ? (requested / covered) * provider.price
        : Math.ceil(requested / covered) * provider.price;
}

function formatDate() {
    if (!project.date) return "Not set";
    return project.timeRange ? `${project.date} at ${project.timeRange}`
        : project.time ? `${project.date} at ${project.time}` : project.date;
}


// ========================================
// 5. RENDER PROJECT DETAILS
// ========================================

function renderProjectDetails() {
    const provider = getCurrentProvider();
    getElement("projectName").textContent = project.name;
    getElement("projectId").textContent = project.id;

    getElement("projectLocation").textContent = project.location;
    getElement("projectBudget").textContent = formatBudget();

    getElement("projectTeamCount").textContent =
        `${project.providers.length} Provider${project.providers.length === 1 ? "" : "s"}`;

    getElement("detailType").textContent = project.type;

    getElement("detailServices").textContent = provider?.service ||
        (project.services.length ? project.services.join(", ") : "Not selected");

    const providerDate = provider?.date || project.date;
    const providerTimeRange = provider?.timeRange || project.timeRange || "";
    getElement("detailDate").textContent = providerDate
        ? `${providerDate}${providerTimeRange ? ` at ${providerTimeRange}` : provider?.time ? ` at ${provider.time}` : ""}`
        : formatDate();
    getElement("detailLocation").textContent = project.location;
    const selectedProviderBudget = estimateProviderBudget(provider);
    getElement("detailBudget").textContent = selectedProviderBudget == null
        ? "Price not set"
        : `${selectedProviderBudget.toLocaleString()} ${provider.currency || project.currency}`;

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
    const processLine = getElement("processLine");

    const waitingStep = getElement("waitingStep");
    const confirmedStep = getElement("confirmedStep");

    const waitingCircle = getElement("waitingCircle");
    const confirmedCircle = getElement("confirmedCircle");

    waitingStep.classList.remove("active");
    confirmedStep.classList.remove("confirmed");
    processLine.classList.toggle("is-confirmed", provider?.status === "Accepted");

    waitingCircle.innerHTML = "2";
    confirmedCircle.innerHTML = '<i class="fa fa-check"></i>';

    if (!provider) {
        processLine.classList.remove("is-confirmed");
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
        const description = getElement("alternativesDescription");
        if (description) {
            description.textContent = `TEAMLY AI found these ${provider.service} providers as alternatives. Choose a provider to replace the one who rejected your request.`;
        }

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

    const matches = getAlternativeProvidersForCurrentService();
    if (!matches.length) {
        container.innerHTML = '<p class="no-alternatives">There are no alternative providers for this service right now.</p>';
        getElement("sendRequestBtn").disabled = true;
        return;
    }

    matches.forEach(provider => {
        const card = document.createElement("article");

        card.className = "alternative-provider";
        card.dataset.providerId = String(provider.id);

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
    if (pendingProfileAlternative && selectedAlternativeId === Number(pendingProfileAlternative.id)) {
        getElement("selectionMessage").textContent = `${pendingProfileAlternative.name} selected for ${pendingProfileAlternative.date} at ${pendingProfileAlternative.time}. Click Send Request to send the request.`;
    }
}


// ========================================
// 11. SELECT AN ALTERNATIVE PROVIDER
// ========================================

function selectAlternativeProvider(providerId) {
    selectedAlternativeId = null;
    pendingProfileAlternative = null;
    getElement("sendRequestBtn").disabled = true;
    getElement("selectionMessage").textContent = "";
    renderAlternativeProviders();
    const card = [...getElement("alternativeProviders").querySelectorAll(".alternative-provider")]
        .find(item => Number(item.dataset.providerId) === Number(providerId));
    if (!card) return;
    const hint = document.createElement("p");
    hint.className = "provider-selection-hint";
    hint.textContent = "Open View Profile and choose a day and time before selecting this provider.";
    card.appendChild(hint);
}


// ========================================
// 12. OPEN THE EXISTING PROVIDER PROFILE PAGE
// ========================================

function openProviderProfile(providerId) {
    const provider = alternativeProviders.find(
        item => item.id === providerId
    );

    if (!provider) {
        return;
    }

    try {
        sessionStorage.setItem("teamlyTrackingReturnState", JSON.stringify({ ...project, activeProviderId: selectedTrackingProviderId }));
    } catch (error) { /* Profile navigation remains available without session storage. */ }

    const params = new URLSearchParams({
        name: provider.name,
        service: provider.service,
        rating: String(provider.rating),
        location: provider.location || "Amman, Jordan",
        price: `${provider.price} JOD`,
        pricingUnit: provider.pricingUnit || (/photo|video/i.test(provider.service) ? "hour" : "package"),
        pricingQuantity: String(provider.pricingQuantity || 1),
        description: provider.bio || "Service provider recommended by TEAMLY AI.",
        returnTo: "tracking",
        alternativeId: String(provider.id),
        trackingProviderId: String(getCurrentProvider()?.id ?? "")
    });

    window.location.href =
        `../Show_Profie_from_client/Profile.html?${params.toString()}`;
}


// ========================================
// 13. SEND REQUEST TO THE NEW PROVIDER
// ========================================

getElement("sendRequestBtn").addEventListener("click", function () {
    if (selectedAlternativeId === null) {
        getElement("selectionMessage").textContent =
            "Please select a provider first.";

        return;
    }

    const newProvider = pendingProfileAlternative && Number(pendingProfileAlternative.id) === selectedAlternativeId
        ? pendingProfileAlternative
        : getAlternativeProvidersForCurrentService().find(provider => provider.id === selectedAlternativeId);

    if (!newProvider) {
        return;
    }

    // The old provider remains rejected.
    // The selected alternative becomes the active request.

    const oldProvider = getCurrentProvider();
    const replacementForId = pendingProfileAlternative?.replacesProviderId ?? oldProvider?.id;
    const replacementIndex = project.providers.findIndex(provider => String(provider.id) === String(replacementForId));
    if (replacementIndex < 0) return;

    const replacement = {
        ...newProvider,
        id: `replacement-${replacementForId}-${newProvider.id}`,
        status: "Pending",
        bio: newProvider.bio || "Service provider selected for this project.",
        responseDeadline:
            Date.now() + 24 * 60 * 60 * 1000
    };
    project.providers[replacementIndex] = replacement;
    if (pendingProfileAlternative) {
        replacement.date = pendingProfileAlternative.date || replacement.date;
        replacement.time = pendingProfileAlternative.time || "";
        replacement.timeRange = pendingProfileAlternative.timeRange || "";
    }
    selectedTrackingProviderId = replacement.id;
    project.budget = project.providers.reduce((sum, provider) => sum + (estimateProviderBudget(provider) || 0), 0);

    selectedAlternativeId = null;
    pendingProfileAlternative = null;

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
    renderTrackingProviderSelector();
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
renderPage();
if (new URLSearchParams(window.location.search).get("alternativeSelected") === "1" && pendingProfileAlternative && project.providers[0]) {
    getElement("trackingMessage").textContent = `${pendingProfileAlternative.name} selected for ${pendingProfileAlternative.date} at ${pendingProfileAlternative.time}. The request has not been sent yet; click Send Request to continue.`;
}

document.querySelectorAll("[data-demo-status]").forEach(button => {
    button.addEventListener("click", () => updateProviderStatus(button.dataset.demoStatus));
});

getElement("trackingProviderSelect").addEventListener("change", event => {
    selectedTrackingProviderId = event.target.value;
    const stagedForThisProvider = pendingProfileAlternative &&
        String(pendingProfileAlternative.replacesProviderId) === String(selectedTrackingProviderId);
    selectedAlternativeId = stagedForThisProvider ? Number(pendingProfileAlternative.id) : null;
    renderPage();
});

function updateProviderStatus(newStatus) {
    const allowedStatuses = ["Pending", "Rejected", "Accepted"];

    if (!allowedStatuses.includes(newStatus)) {
        console.error("Invalid provider status:", newStatus);
        return;
    }

    if (!project.providers.length) {
        return;
    }

    const provider = getCurrentProvider();
    if (!provider) return;
    provider.status = newStatus;

    if (newStatus === "Rejected") {
        selectedAlternativeId = null;
    }

    renderPage();
}
