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
const projectSummaryCard = document.querySelector(".project-summary");
if (projectSummaryCard) projectSummaryCard.hidden = !IS_LOGGED_IN;
const projectDetailsCard = document.querySelector(".details-card");
if (projectDetailsCard) projectDetailsCard.hidden = !IS_LOGGED_IN;


/* ==================================
   PROJECT DATA
================================== */

let project = {
    name: "Wedding Photography Project",
    location: "Amman, Jordan",
    budget: 0
};
try {
    const incomingProject = JSON.parse(sessionStorage.getItem("teamlyAiProjectDraft") || "null");
    if (incomingProject && typeof incomingProject === "object") {
        project = {
            ...project,
            name: typeof incomingProject.name === "string" && incomingProject.name.trim() ? incomingProject.name.trim() : project.name,
            location: typeof incomingProject.location === "string" && incomingProject.location.trim() ? incomingProject.location.trim() : project.location
        };
        sessionStorage.removeItem("teamlyAiProjectDraft");
    }
} catch (error) { /* Keep the default project details if browser storage is unavailable. */ }


/* ==================================
   PROVIDER DATA
================================== */

const providers = [
    {
        id: 1,
        firstName: "Ahmad",
        lastName: "Khaled",
        service: "Photography",
        pricingUnit: "hour",
        pricingQuantity: 1,
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
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 4.3,
        location: "Irbid",
        price: 700,
        recommended: 2
    },
    {
        id: 3,
        firstName: "Lina",
        lastName: "Hassan",
        service: "Photography",
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 4.4,
        location: "Amman",
        price: 950,
        recommended: 3
    },
    {
        id: 4,
        firstName: "Omar",
        lastName: "Naser",
        service: "Videography",
        pricingUnit: "hour",
        pricingQuantity: 1,
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
        pricingUnit: "hour",
        pricingQuantity: 1,
        rating: 3.9,
        location: "Zarqa",
        price: 550,
        recommended: 2
    },
    {
        id: 6,
        firstName: "Yazan",
        lastName: "Saleh",
        service: "Decoration",
        pricingUnit: "package",
        pricingQuantity: 1,
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
        pricingUnit: "package",
        pricingQuantity: 1,
        rating: 4.2,
        location: "Irbid",
        price: 750,
        recommended: 2
    },
    {
        id: 8,
        firstName: "Khaled",
        lastName: "Sami",
        service: "Catering",
        pricingUnit: "package",
        pricingQuantity: 1,
        rating: 4.8,
        location: "Amman",
        price: 500,
        recommended: 1
    }
];

// Include the provider profile registered in this browser so clients see its saved rate card.
try {
    const profile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
    if (profile && profile.registrationComplete && Number.isFinite(Number(profile.startingPrice))) {
        const fullName = String(profile.companyName || profile.fullName || "Registered provider").trim();
        const nameParts = fullName.split(/\s+/);
        const emailCode = Array.from(String(profile.email || "registered")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const offeredServices = Array.isArray(profile.services) && profile.services.length
            ? profile.services
            : [profile.service || "Provider"];
        offeredServices.forEach((service, index) => {
            providers.push({
                id: 100000 + emailCode * 20 + index,
                firstName: nameParts[0] || "Registered",
                lastName: nameParts.slice(1).join(" "),
                service,
                rating: Number(profile.averageRating) || 0,
                location: String(profile.location || "").split(",")[0].trim(),
                price: Number(profile.startingPrice),
                currency: profile.currency || "JOD",
                pricingUnit: profile.pricingUnit || "package",
                pricingQuantity: Number(profile.pricingQuantity) > 0 ? Number(profile.pricingQuantity) : 1,
                description: profile.description || "",
                recommended: 0
            });
        });
    }
} catch (error) { /* Continue with sample providers if the saved profile cannot be read. */ }

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

// Keep the in-progress team while a guest visits login or registration.
const providerSelectionKey = "teamlyProviderSelectionDraft";
function saveProviderSelectionDraft() {
    try {
        sessionStorage.setItem(providerSelectionKey, JSON.stringify({
            selected: [...selectedProviders.entries()],
            searchQuery,
            filters: {
                service: serviceFilter.value, rating: ratingFilter.value,
                price: priceFilter.value, location: locationFilter.value, sort: sortFilter.value
            },
            scrollY: window.scrollY
        }));
    } catch (error) { /* The selection still works when session storage is unavailable. */ }
}

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
availableServices.forEach(service => {
    if (![...serviceFilter.options].some(option => option.value === service)) {
        serviceFilter.add(new Option(service, service));
    }
});

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
let trackingAfterMessageOk = false;


/* ==================================
   HELPERS
================================== */

function formatPrice(price, currency = "JOD") {
    return `${price.toLocaleString("en-US")} ${currency}`;
}

function pricingUnitText(provider) {
    const labels = { hour: "hour", photo: "photo", video: "finished video", favor: "favor", item: "item", package: "package" };
    const unit = labels[provider.pricingUnit] || "service";
    const quantity = Number(provider.pricingQuantity) > 0 ? Number(provider.pricingQuantity) : 1;
    return `${quantity} ${quantity === 1 ? unit : `${unit}s`}`;
}

function getProviderBooking(provider) {
    try {
        const bookings = JSON.parse(sessionStorage.getItem("teamlyProviderBookings") || "[]");
        if (Array.isArray(bookings)) return bookings.find(booking => booking.id != null
            ? Number(booking.id) === Number(provider.id)
            : String(booking.name || "").toLowerCase() === getProviderName(provider).toLowerCase() &&
              String(booking.service || "").toLowerCase() === String(provider.service || "").toLowerCase()
        ) || null;
        const booking = JSON.parse(sessionStorage.getItem("teamly-selected-provider") || "null");
        return booking && String(booking.name || "").toLowerCase() === getProviderName(provider).toLowerCase() ? booking : null;
    } catch (error) { return null; }
}

function calculateProviderPrice(provider, booking = getProviderBooking(provider)) {
    if (!Number.isFinite(provider.price)) return null;
    const covered = Number(provider.pricingQuantity) > 0 ? Number(provider.pricingQuantity) : 1;
    const requested = provider.pricingUnit === "hour"
        ? Number(booking?.durationHours) || covered
        : Number(booking?.quantity) || covered;
    return provider.pricingUnit === "hour"
        ? (requested / covered) * provider.price
        : Math.ceil(requested / covered) * provider.price;
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
    return `${provider.firstName} ${provider.lastName}`.trim();
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


function normalizeFilterValue(value) {
    return String(value ?? "").trim().toLocaleLowerCase();
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
                    <strong>${formatPrice(provider.price, provider.currency || "JOD")} / ${escapeHTML(pricingUnitText(provider))}</strong>
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
            normalizeFilterValue(provider.service) === normalizeFilterValue(service) ||
            normalizeFilterValue(provider.displayService) === normalizeFilterValue(service)
        );
    }


    // Filter by minimum rating

    result = result.filter(provider =>
        provider.rating >= minRating
    );


    // Filter by maximum price

    // Providers without a listed price remain visible for "Any price". A
    // price cap can only match providers with a known price.
    if (Number.isFinite(maxPrice)) {
        result = result.filter(provider =>
            Number.isFinite(provider.price) && provider.price <= maxPrice
        );
    }


    // Filter by location

    if (location !== "all") {
        result = result.filter(provider =>
            normalizeFilterValue(provider.location) === normalizeFilterValue(location)
        );
    }


    // Sorting

    switch (sortFilter.value) {
        case "rating":
            result.sort((a, b) => b.rating - a.rating);
            break;

        case "price-low":
            result.sort((a, b) => {
                if (!Number.isFinite(a.price)) return 1;
                if (!Number.isFinite(b.price)) return -1;
                return a.price - b.price;
            });
            break;

        case "price-high":
            result.sort((a, b) => {
                if (!Number.isFinite(a.price)) return 1;
                if (!Number.isFinite(b.price)) return -1;
                return b.price - a.price;
            });
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

    const card = [...providersGrid.querySelectorAll(".provider-card")]
        .find(item => Number(item.querySelector('[data-action="select-provider"]')?.dataset.providerId) === Number(providerId));
    if (!card) return;
    card.querySelector(".provider-selection-hint")?.remove();
    const hint = document.createElement("p");
    hint.className = "provider-selection-hint";
    hint.textContent = "Open View Profile and choose a day and time before selecting this provider.";
    card.appendChild(hint);
}


/* ==================================
   RENDER YOUR TEAM
================================== */

function updateTeam() {
    const selectedCount = selectedProviders.size;
    const progressTarget = providers.length;
    const percent = !progressTarget
        ? 0
        : Math.round((selectedCount / progressTarget) * 100);

    teamProgressText.textContent = `${selectedCount} provider${selectedCount === 1 ? "" : "s"} selected`;

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

    selectedProviders.forEach(providerId => {
        const provider = getProviderById(providerId);
        if (!provider) return;
        const service = provider.service;
        const item = document.createElement("div");
        item.className = "team-service-item";

        const calculatedPrice = calculateProviderPrice(provider);
        if (Number.isFinite(calculatedPrice)) totalPrice += calculatedPrice;
        const location = provider.location ? `${provider.location}, Jordan` : "Location not provided";
        const price = Number.isFinite(calculatedPrice) ? formatPrice(calculatedPrice) : "Price on request";
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
                <button type="button" class="remove-provider-btn" data-action="remove-provider" data-provider-id="${provider.id}" aria-label="Remove ${escapeHTML(getProviderName(provider))}">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div class="selected-price">${price}</div>
        `;

        teamServices.appendChild(item);
    });

    teamTotalPrice.textContent = formatPrice(totalPrice);
    project.budget = totalPrice;
    const budgetText = formatPrice(totalPrice);
    const projectBudget = document.getElementById("project-budget");
    const detailsBudget = document.getElementById("details-budget");
    if (projectBudget) projectBudget.textContent = budgetText;
    if (detailsBudget) detailsBudget.textContent = budgetText;

    // Guests can open the login prompt from Send Request even before making a selection.
    const canSendRequest = !IS_LOGGED_IN || selectedCount > 0;
    sendRequestButton.disabled = !canSendRequest;
    sendRequestButton.style.opacity = canSendRequest ? "1" : "0.55";
    sendRequestButton.style.cursor = canSendRequest ? "pointer" : "not-allowed";

    if (!IS_LOGGED_IN) {
        requestNote.textContent = "Please log in before sending your request.";
    } else if (selectedCount === 0) {
        requestNote.textContent = "Select any providers you need to send your request.";
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
    // Preserve all previously selected providers while the client books this provider's date and time.
    saveProviderSelectionDraft();
    const params = new URLSearchParams({
        providerId: String(provider.id),
        name: getProviderName(provider),
        service: provider.service,
        rating: String(provider.rating),
        location: provider.location ? `${provider.location}, Jordan` : "Location not provided",
        price: `${provider.price} ${provider.currency || "JOD"}`,
        pricingUnit: provider.pricingUnit || "package",
        pricingQuantity: String(provider.pricingQuantity || 1),
        description: provider.description || ""
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

    if (selectedProviders.size === 0) {
        showMessage("Choose providers", "Please select at least one provider before sending your request.");
        return;
    }

    try {
        let savedBookings = [];
        try {
            savedBookings = JSON.parse(sessionStorage.getItem("teamlyProviderBookings") || "[]");
            if (!Array.isArray(savedBookings)) savedBookings = [];
        } catch (error) { savedBookings = []; }
        try {
            const legacyBooking = JSON.parse(sessionStorage.getItem("teamly-selected-provider") || "null");
            if (legacyBooking && !savedBookings.some(booking => booking.id === legacyBooking.id || booking.name === legacyBooking.name)) savedBookings.push(legacyBooking);
        } catch (error) { /* Ignore an invalid legacy booking draft. */ }
        const selectedTeam = [...selectedProviders.values()].map(providerId => {
            const provider = getProviderById(providerId);
            const providerName = provider ? getProviderName(provider) : "";
            const booking = provider ? getProviderBooking(provider) || savedBookings.find(item =>
                String(item.name || "").toLowerCase() === providerName.toLowerCase() &&
                String(item.service || "").toLowerCase() === String(provider.service || "").toLowerCase()
            ) : null;
            return provider ? {
                id: provider.id,
                name: providerName,
                initials: getInitials(provider),
                service: provider.displayService || provider.service,
                rating: provider.rating,
                price: Number.isFinite(provider.price) ? provider.price : null,
                currency: provider.currency || "JOD",
                pricingUnit: provider.pricingUnit || "package",
                pricingQuantity: provider.pricingQuantity || 1,
                location: provider.location || "",
                ...(booking ? {
                    date: booking.date,
                    time: booking.time,
                    timeRange: booking.timeRange,
                    durationHours: booking.durationHours,
                    quantity: booking.quantity,
                    estimatedPrice: calculateProviderPrice(provider, booking)
                } : {})
            } : null;
        }).filter(Boolean);
        const totalBudget = selectedTeam.reduce((sum, provider) => sum + (Number.isFinite(provider.estimatedPrice) ? provider.estimatedPrice : calculateProviderPrice(provider, provider)), 0);
        sessionStorage.setItem("teamlyTrackingProjectDraft", JSON.stringify({
            name: project.name,
            location: project.location,
            budget: totalBudget,
            currency: "JOD",
            providers: selectedTeam
        }));
    } catch (error) { /* Continue to the demo tracking page if draft storage is unavailable. */ }


    /*
      Backend integration will be added later.
      This is only a successful demo message.
    */

    trackingAfterMessageOk = true;
    showMessage(
        "Request prepared",
        "Your selected team is complete."
    );
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

    saveProviderSelectionDraft();
    const returnTo = encodeURIComponent("../select_provider/select_provider.html");
    window.location.href = `../choose_account/choose_account.html?returnTo=${returnTo}`;
}


function openLoginPage() {
    /*
      Replace this with your actual login page path.
    */

    saveProviderSelectionDraft();
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
    trackingAfterMessageOk = false;

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
        const providerId = Number(button.dataset.providerId);


    if (action === "remove-provider") {
        selectedProviders.delete(providerId);

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


// Message modal

document.getElementById("close-message-modal")
    .addEventListener("click", closeMessageModal);

document.getElementById("message-ok-btn")
    .addEventListener("click", () => {
        if (trackingAfterMessageOk) {
            window.location.href = "../Tracking/tracking.html";
            return;
        }

        closeMessageModal();
    });


// Clicking the dark background closes the dialogs.

[accountModal, messageModal].forEach(modal => {
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

    const pageParams = new URLSearchParams(window.location.search);
    const requestedService = pageParams.get("service");
    if (requestedService && [...serviceFilter.options].some(option => option.value === requestedService)) {
        serviceFilter.value = requestedService;
    }

    let restoredDraft = false;
    let restoredScrollY = 0;
    try {
        const draft = JSON.parse(sessionStorage.getItem(providerSelectionKey) || "null");
        if (draft && Array.isArray(draft.selected)) {
            draft.selected.forEach(([service, providerId]) => {
                const id = Number(providerId);
                if (providers.some(provider => provider.id === id)) selectedProviders.set(id, id);
            });
            if (draft.filters) {
                [[serviceFilter, draft.filters.service], [ratingFilter, draft.filters.rating], [priceFilter, draft.filters.price], [locationFilter, draft.filters.location], [sortFilter, draft.filters.sort]].forEach(([control, value]) => {
                    if (control && [...control.options].some(option => option.value === value)) control.value = value;
                });
            }
            if (typeof draft.searchQuery === "string") searchQuery = draft.searchQuery;
            if (Number.isFinite(draft.scrollY)) restoredScrollY = draft.scrollY;
            if (searchInput) searchInput.value = searchQuery;
            restoredDraft = selectedProviders.size > 0;
            sessionStorage.removeItem(providerSelectionKey);
        }
    } catch (error) { /* Ignore an unavailable or malformed draft. */ }

    const selectedProviderName = pageParams.get("profileSelected");
    let returnedWithSelectedProvider = false;
    if (selectedProviderName) {
        const selectedService = pageParams.get("selectedService");
        const chosenProvider = providers.find(provider =>
            getProviderName(provider).toLocaleLowerCase() === selectedProviderName.trim().toLocaleLowerCase() &&
            (!selectedService || normalizeFilterValue(provider.service) === normalizeFilterValue(selectedService))
        );

        if (chosenProvider) {
            selectedProviders.set(chosenProvider.id, chosenProvider.id);
            returnedWithSelectedProvider = true;
            try {
                sessionStorage.removeItem("teamly-selected-provider");
            } catch (error) {
                console.error("Could not clear saved provider selection:", error);
            }
        }

        // Remove the one-time return marker from the address bar.
        pageParams.delete("profileSelected");
        pageParams.delete("selectedService");
        const cleanQuery = pageParams.toString();
        window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`
        );
    }

    applyFilters();

    updateTeam();

    loadSidebar();

    if (restoredDraft && restoredScrollY > 0) window.scrollTo(0, restoredScrollY);
}

initializeProviderPage();
