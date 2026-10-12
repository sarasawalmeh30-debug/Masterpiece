/* ==================================
   TEAMLY - FIND YOUR TEAM
================================== */

// Frontend-only session indicator until a real authentication service exists.
let IS_LOGGED_IN = false;
try {
    IS_LOGGED_IN = sessionStorage.getItem("teamlyLoggedIn") === "true";
} catch (error) {
    IS_LOGGED_IN = false;
}
document.body.classList.add(IS_LOGGED_IN ? "provider-authenticated" : "provider-guest");


/* ==================================
   PROJECT DATA
================================== */

const project = {
    name: "Wedding Photography Project",
    location: "Amman, Jordan",
    budget: 2000
};


/* ==================================
   PROVIDER DATA
================================== */

const providers = [
    {
        id: 1,
        firstName: "Ahmad",
        lastName: "Khaled",
        service: "Photography",
        rating: 4.9,
        location: "Amman",
        price: 850,
        recommended: 1
    },
    {
        id: 2,
        firstName: "Sara",
        lastName: "Omar",
        service: "Photography",
        rating: 4.8,
        location: "Irbid",
        price: 700,
        recommended: 2
    },
    {
        id: 3,
        firstName: "Lina",
        lastName: "Hassan",
        service: "Photography",
        rating: 4.6,
        location: "Amman",
        price: 950,
        recommended: 3
    },
    {
        id: 4,
        firstName: "Omar",
        lastName: "Naser",
        service: "Videography",
        rating: 4.9,
        location: "Amman",
        price: 650,
        recommended: 1
    },
    {
        id: 5,
        firstName: "Maya",
        lastName: "Adel",
        service: "Videography",
        rating: 4.7,
        location: "Zarqa",
        price: 550,
        recommended: 2
    },
    {
        id: 6,
        firstName: "Yazan",
        lastName: "Saleh",
        service: "Decoration",
        rating: 4.9,
        location: "Amman",
        price: 600,
        recommended: 1
    },
    {
        id: 7,
        firstName: "Noor",
        lastName: "Ahmad",
        service: "Decoration",
        rating: 4.7,
        location: "Irbid",
        price: 750,
        recommended: 2
    },
    {
        id: 8,
        firstName: "Khaled",
        lastName: "Sami",
        service: "Catering",
        rating: 4.8,
        location: "Amman",
        price: 500,
        recommended: 1
    }
];

const availableServices = [...new Set(providers.map(provider => provider.service))];

// Include the clicked Tracking recommendation in this page without confusing
// its ID with a different record in the local provider catalog.
const trackingParams = new URLSearchParams(window.location.search);
const trackingProviderName = trackingParams.get("name");

if (trackingParams.get("source") === "tracking" && trackingProviderName) {
    const nameParts = trackingProviderName.trim().split(/\s+/);
    const requestedService = trackingParams.get("service") || "Provider";
    const matchingService = availableServices.find(service =>
        requestedService.toLowerCase().includes(service.toLowerCase()) ||
        (service.toLowerCase().includes("photography") &&
            requestedService.toLowerCase().includes("photo"))
    );
    const rating = Number(trackingParams.get("rating"));

    providers.unshift({
        id: -Math.max(1, Number(trackingParams.get("providerId")) || 1),
        firstName: nameParts.shift() || trackingProviderName,
        lastName: nameParts.join(" "),
        service: matchingService || requestedService,
        displayService: requestedService,
        rating: Number.isFinite(rating) ? rating : 0,
        location: "",
        price: null,
        recommended: -1,
        trackingContext: true,
        description: trackingParams.get("description") || ""
    });
}


/* ==================================
   STATE
================================== */

/*
  One provider can be selected for each required service.
*/

const selectedProviders = new Map();
let desiredProviderCount = null;

let searchQuery = "";


/* ==================================
   DOM ELEMENTS
================================== */

const providersGrid = document.getElementById("providers-grid");
const searchInput = document.getElementById("provider-search");

const serviceFilter = document.getElementById("service-filter");
const ratingFilter = document.getElementById("rating-filter");
const priceFilter = document.getElementById("price-filter");
const locationFilter = document.getElementById("location-filter");
const sortFilter = document.getElementById("sort-filter");

const resultsCount = document.getElementById("results-count");
const emptyState = document.getElementById("empty-state");

const teamServices = document.getElementById("team-services");
const teamProgressText = document.getElementById("team-progress-text");
const teamProgressPercent = document.getElementById("team-progress-percent");
const teamProgressBar = document.getElementById("team-progress-bar");
const progressFill = document.getElementById("progress-fill");

const teamTotalPrice = document.getElementById("team-total-price");
const sendRequestButton = document.getElementById("send-request-btn");
const requestNote = document.getElementById("request-note");

const accountModal = document.getElementById("account-modal");
const messageModal = document.getElementById("message-modal");
const providerCountModal = document.getElementById("provider-count-modal");


/* ==================================
   HELPERS
================================== */

function formatPrice(price) {
    return `${price.toLocaleString("en-US")} JOD`;
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


function getProviderName(provider) {
    return `${provider.firstName} ${provider.lastName}`;
}


function getInitials(provider) {
    return (
        provider.firstName.charAt(0) +
        provider.lastName.charAt(0)
    ).toUpperCase();
}


function getProviderById(id) {
    return providers.find(provider => provider.id === id);
}


function isRequiredService(service) {
    return availableServices.includes(service);
}


function isProviderSelected(providerId) {
    return [...selectedProviders.values()].includes(providerId);
}


/* ==================================
   PROJECT INFORMATION
================================== */

function renderProjectInformation() {
    const name = project.name;
    const location = project.location;
    const budget = formatPrice(project.budget);
    const requiredCount = availableServices.length;

    document.getElementById("project-name").textContent = name;
    document.getElementById("project-location").textContent = location;
    document.getElementById("project-budget").textContent = budget;
    document.getElementById("required-count").textContent = requiredCount;

    document.getElementById("details-project-name").textContent = name;
    document.getElementById("details-location").textContent = location;
    document.getElementById("details-budget").textContent = budget;
    document.getElementById("details-required").textContent = requiredCount;

    teamProgressBar.setAttribute("aria-valuemax", requiredCount);
}


/* ==================================
   RENDER PROVIDER CARDS
================================== */

function renderProviders(list) {
    providersGrid.innerHTML = "";

    resultsCount.textContent =
        `${list.length} provider${list.length === 1 ? "" : "s"} found`;

    emptyState.hidden = list.length !== 0;

    list.forEach(provider => {
        const selected = isProviderSelected(provider.id);
        const providerName = escapeHTML(getProviderName(provider));
        const serviceName = escapeHTML(
            provider.displayService || provider.service
        );
        const locationRow = provider.location
            ? `
                <div class="provider-location">
                    <i class="fa fa-map-marker"></i>
                    <span>${escapeHTML(provider.location)}, Jordan</span>
                </div>
            `
            : "";
        const priceRow = Number.isFinite(provider.price)
            ? `
                <div class="provider-price">
                    <span>Starting from</span>
                    <strong>${formatPrice(provider.price)}</strong>
                </div>
            `
            : "";
        const description = provider.trackingContext && provider.description
            ? `<p class="provider-context-note">${escapeHTML(provider.description)}</p>`
            : "";
        const actions = provider.trackingContext
            ? ""
            : `
                <div class="provider-actions">
                    <button
                        type="button"
                        class="view-profile-btn ${IS_LOGGED_IN ? "" : "login-required"}"
                        data-action="view-profile"
                        data-provider-id="${provider.id}"
                        aria-label="View profile of ${providerName}">
                        <i class="fa fa-user"></i>
                        View Profile
                    </button>
                    <button
                        type="button"
                        class="select-provider-btn ${selected ? "is-selected" : ""}"
                        data-action="select-provider"
                        data-provider-id="${provider.id}">
                        <i class="fa ${selected ? "fa-check" : "fa-plus"}"></i>
                        ${selected ? "Selected" : "Select"}
                    </button>
                </div>
            `;

        const card = document.createElement("article");

        card.className =
            `provider-card ${selected ? "selected" : ""}${provider.trackingContext ? " tracking-recommendation" : ""}`;

        card.innerHTML = `
            <div class="provider-card-top">

                <div class="provider-avatar">
                    ${escapeHTML(getInitials(provider))}
                </div>

                <div class="provider-heading">
                    <h3>${providerName}</h3>

                    <div class="provider-service">
                        ${serviceName}
                    </div>

                    <div class="provider-rating">
                        <i class="fa fa-star"></i>
                        <strong>${provider.rating.toFixed(1)}</strong>
                        <span>Rating</span>
                    </div>
                </div>

            </div>

            ${description}
            ${locationRow}
            ${priceRow}
            ${actions}
        `;

        providersGrid.appendChild(card);
    });
}


/* ==================================
   SEARCH AND FILTER
================================== */

function getFilteredProviders() {
    let result = [...providers];

    const service = serviceFilter.value;
    const minRating = Number(ratingFilter.value);

    const maxPrice =
        priceFilter.value === "all"
            ? Infinity
            : Number(priceFilter.value);

    const location = locationFilter.value;

    const query = searchQuery.trim().toLowerCase();


    // Search by name, service, or location

    if (query) {
        result = result.filter(provider => {
            const searchableText = [
                getProviderName(provider),
                provider.service,
                provider.location
            ].join(" ").toLowerCase();

            return searchableText.includes(query);
        });
    }


    // Filter by service

    if (service !== "all") {
        result = result.filter(provider =>
            provider.service === service
        );
    }


    // Filter by minimum rating

    result = result.filter(provider =>
        provider.rating >= minRating
    );


    // Filter by maximum price

    result = result.filter(provider =>
        provider.price <= maxPrice
    );


    // Filter by location

    if (location !== "all") {
        result = result.filter(provider =>
            provider.location === location
        );
    }


    // Sorting

    switch (sortFilter.value) {
        case "rating":
            result.sort((a, b) => b.rating - a.rating);
            break;

        case "price-low":
            result.sort((a, b) => a.price - b.price);
            break;

        case "price-high":
            result.sort((a, b) => b.price - a.price);
            break;

        case "recommended":
        default:
            result.sort((a, b) =>
                a.recommended - b.recommended
            );
            break;
    }

    return result;
}


function applyFilters() {
    const filteredProviders = getFilteredProviders();

    renderProviders(filteredProviders);
}


function clearFilters() {
    searchInput.value = "";
    searchQuery = "";

    serviceFilter.value = "all";
    ratingFilter.value = "0";
    priceFilter.value = "all";
    locationFilter.value = "all";
    sortFilter.value = "recommended";

    applyFilters();
}


/* ==================================
   SELECT PROVIDER
================================== */

function selectProvider(providerId) {
    const provider = getProviderById(providerId);

    if (!provider) {
        return;
    }

    if (!isRequiredService(provider.service)) {
        showMessage(
            "Service not required",
            `Your current project does not require ${provider.service}.`
        );

        return;
    }

    if (IS_LOGGED_IN && desiredProviderCount === null) {
        openProviderCountModal();
        return;
    }


    // Clicking a selected provider again removes the selection.

    if (selectedProviders.get(provider.service) === providerId) {
        selectedProviders.delete(provider.service);

        updateTeam();
        applyFilters();

        return;
    }

    if (
        IS_LOGGED_IN &&
        !selectedProviders.has(provider.service) &&
        selectedProviders.size >= desiredProviderCount
    ) {
        showMessage(
            "Your team is full",
            `You chose ${desiredProviderCount} provider${desiredProviderCount === 1 ? "" : "s"}. Remove one before choosing another.`
        );
        return;
    }


    /*
      If another provider is already selected for this service,
      replace the old provider with the new one.
    */

    selectedProviders.set(provider.service, providerId);

    updateTeam();
    applyFilters();
}


/* ==================================
   RENDER YOUR TEAM
================================== */

function updateTeam() {
    const selectedCount = selectedProviders.size;
    const progressTarget = IS_LOGGED_IN ? desiredProviderCount : availableServices.length;
    const percent = !progressTarget
        ? 0
        : Math.round((selectedCount / progressTarget) * 100);

    teamProgressText.textContent = IS_LOGGED_IN && desiredProviderCount !== null
        ? `${selectedCount} of ${desiredProviderCount} providers selected`
        : `${selectedCount} service${selectedCount === 1 ? "" : "s"} selected`;

    teamProgressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;

    teamProgressBar.setAttribute("aria-valuemax", progressTarget || availableServices.length);
    teamProgressBar.setAttribute(
        "aria-valuenow",
        selectedCount
    );


    teamServices.innerHTML = "";

    let totalPrice = 0;

    if (selectedCount === 0) {
        teamServices.innerHTML = '<p class="team-selection-empty">Choose any providers you need to build your team.</p>';
    }

    selectedProviders.forEach((providerId, service) => {
        const provider = getProviderById(providerId);
        if (!provider) return;
        const item = document.createElement("div");
        item.className = "team-service-item";

        if (Number.isFinite(provider.price)) totalPrice += provider.price;
        const location = provider.location ? `${provider.location}, Jordan` : "Location not provided";
        const price = Number.isFinite(provider.price) ? formatPrice(provider.price) : "Price on request";
        item.innerHTML = `
            <div class="team-service-top">
                <strong>${escapeHTML(service)}</strong>
                <span class="service-check completed"><i class="fa fa-check"></i></span>
            </div>
            <div class="selected-provider-info">
                <div class="selected-provider-avatar">${escapeHTML(getInitials(provider))}</div>
                <div class="selected-provider-text">
                    <strong>${escapeHTML(getProviderName(provider))}</strong>
                    <span>${escapeHTML(location)}</span>
                </div>
                <button type="button" class="remove-provider-btn" data-action="remove-provider" data-service="${escapeHTML(service)}" aria-label="Remove ${escapeHTML(getProviderName(provider))}">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div class="selected-price">${price}</div>
        `;

        teamServices.appendChild(item);
    });

    teamTotalPrice.textContent = formatPrice(totalPrice);

    // Guests can open the login prompt from Send Request even before making a selection.
    const canSendRequest = !IS_LOGGED_IN || (
        desiredProviderCount !== null && selectedCount === desiredProviderCount
    );
    sendRequestButton.disabled = !canSendRequest;
    sendRequestButton.style.opacity = canSendRequest ? "1" : "0.55";
    sendRequestButton.style.cursor = canSendRequest ? "pointer" : "not-allowed";

    if (!IS_LOGGED_IN) {
        requestNote.textContent = "Please log in before sending your request.";
    } else if (desiredProviderCount === null) {
        requestNote.textContent = "Choose how many providers you need to start your team.";
    } else if (selectedCount < desiredProviderCount) {
        requestNote.textContent = `Select ${desiredProviderCount - selectedCount} more provider${desiredProviderCount - selectedCount === 1 ? "" : "s"} to send your request.`;
    } else {
        requestNote.textContent = "Your team is ready to receive your request.";
    }
}


/* ==================================
   VIEW PROFILE
================================== */

function viewProviderProfile(providerId) {
    const provider = getProviderById(providerId);

    if (!provider) {
        return;
    }
    const params = new URLSearchParams({
        name: getProviderName(provider),
        service: provider.service,
        rating: String(provider.rating),
        location: `${provider.location}, Jordan`,
        price: `${provider.price} JOD`
    });
    window.location.href = `../Show_Profie_from_client/Profile.html?${params}`;
}


/* ==================================
   SEND REQUEST
================================== */

function sendRequest() {
    // Require an account before sending a request.
    if (!IS_LOGGED_IN) {
        openAccountModal();
        return;
    }

    if (desiredProviderCount === null) {
        openProviderCountModal();
        return;
    }

    if (selectedProviders.size !== desiredProviderCount) {
        showMessage(
            "Complete your team",
            `Please select exactly ${desiredProviderCount} provider${desiredProviderCount === 1 ? "" : "s"} before sending your request.`
        );

        return;
    }


    /*
      Backend integration will be added later.
      This is only a successful demo message.
    */

    showMessage(
        "Request prepared",
        "Your selected team is complete. This demo can confirm the request on screen, but saving or delivering it requires a connected backend or database."
    );
}


function openProviderCountModal() {
    providerCountModal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("provider-count-select").focus();
}


function closeProviderCountModal() {
    providerCountModal.hidden = true;
    document.body.style.overflow = "";
}


function confirmProviderCount() {
    const count = Number(document.getElementById("provider-count-select").value);
    if (!Number.isInteger(count) || count < 1 || count > availableServices.length) return;

    desiredProviderCount = count;
    selectedProviders.clear();
    closeProviderCountModal();
    updateTeam();
    applyFilters();
}


/* ==================================
   ACCOUNT MODAL
================================== */

function openAccountModal() {
    accountModal.hidden = false;

    document.body.style.overflow = "hidden";

    document.getElementById("close-account-modal").focus();
}


function closeAccountModal() {
    accountModal.hidden = true;

    document.body.style.overflow = "";
}


function openContinuePage() {
    /*
      Replace this with your actual registration page path.
    */

    window.location.href = "../choose_account/choose_account.html";
}


function openLoginPage() {
    /*
      Replace this with your actual login page path.
    */

    const returnTo = encodeURIComponent("../select_provider/select_provider.html");
    window.location.href = `../login/login.html?returnTo=${returnTo}`;
}


/* ==================================
   GENERAL MESSAGE MODAL
================================== */

function showMessage(title, message) {
    document.getElementById("message-title").textContent = title;

    document.getElementById("message-text").textContent = message;

    messageModal.hidden = false;

    document.body.style.overflow = "hidden";

    document.getElementById("message-ok-btn").focus();
}


function closeMessageModal() {
    messageModal.hidden = true;

    document.body.style.overflow = "";
}


/* ==================================
   SIDEBAR
================================== */

async function loadSidebar() {
    if (!IS_LOGGED_IN) {
        return;
    }

    const container = document.getElementById("sidebar-container");

    if (!container) {
        return;
    }

    try {
        const response = await fetch("../sidebar_client/sidbar.html");

        if (!response.ok) {
            throw new Error(
                `Unable to load sidebar.html: ${response.status}`
            );
        }

        container.innerHTML = await response.text();


        // Load sidebar CSS

        if (!document.getElementById("sidebar-styles")) {
            const css = document.createElement("link");

            css.id = "sidebar-styles";
            css.rel = "stylesheet";
            css.href = "../sidebar_client/sidbar.css";

            document.head.appendChild(css);
        }


        // Load sidebar JavaScript

        if (!document.getElementById("sidebar-script")) {
            const script = document.createElement("script");

            script.id = "sidebar-script";
            script.src = "../sidebar_client/sidbar.js";

            script.onerror = () => {
                console.error("Unable to load sidebar.js");
            };

            document.body.appendChild(script);
        }

    } catch (error) {
        console.error("Sidebar loading failed:", error);
    }
}


/* ==================================
   EVENT LISTENERS
================================== */

// Search

searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    applyFilters();
});


// Filters

serviceFilter.addEventListener("change", applyFilters);
ratingFilter.addEventListener("change", applyFilters);
priceFilter.addEventListener("change", applyFilters);
locationFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);


// Clear filters

document.getElementById("clear-filters")
    .addEventListener("click", clearFilters);

document.getElementById("empty-clear-btn")
    .addEventListener("click", clearFilters);


// Provider card buttons

providersGrid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const providerId = Number(button.dataset.providerId);


    if (action === "select-provider") {
        selectProvider(providerId);
    }


    if (action === "view-profile") {
        viewProviderProfile(providerId);
    }
});


// Your Team buttons

teamServices.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const service = button.dataset.service;


    if (action === "remove-provider") {
        selectedProviders.delete(service);

        updateTeam();
        applyFilters();
    }


    if (action === "choose-service") {
        serviceFilter.value = service;

        searchQuery = "";
        searchInput.value = "";

        applyFilters();

        document.querySelector(".provider-list-section")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }
});


// Send request

sendRequestButton.addEventListener("click", sendRequest);


// Account modal

document.getElementById("close-account-modal")
    .addEventListener("click", closeAccountModal);

document.getElementById("continue-btn")
    .addEventListener("click", openContinuePage);

document.getElementById("login-btn")
    .addEventListener("click", openLoginPage);

document.getElementById("confirm-provider-count")
    .addEventListener("click", confirmProviderCount);


// Message modal

document.getElementById("close-message-modal")
    .addEventListener("click", closeMessageModal);

document.getElementById("message-ok-btn")
    .addEventListener("click", closeMessageModal);


// Clicking the dark background closes the dialogs.

[accountModal, messageModal, providerCountModal].forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.hidden = true;
            document.body.style.overflow = "";
        }
    });
});


// Escape closes open dialogs.

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeAccountModal();
        closeMessageModal();
        if (desiredProviderCount !== null) closeProviderCountModal();
    }
});


// Refresh

document.getElementById("refresh-btn")
    .addEventListener("click", () => {
        applyFilters();
        updateTeam();
    });


/* ==================================
   INITIALIZE PAGE
================================== */

function initializeProviderPage() {
    renderProjectInformation();

    applyFilters();

    updateTeam();

    loadSidebar();

    if (IS_LOGGED_IN) {
        openProviderCountModal();
    }
}

initializeProviderPage();
