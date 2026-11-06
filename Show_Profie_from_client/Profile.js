// ========================================
// Provider Profile Data
// ========================================

const params = new URLSearchParams(window.location.search);
const profileBackLink = document.querySelector(".profile-header .back-link");
if (profileBackLink && params.get("returnTo") === "tracking") {
    profileBackLink.href = "../Tracking/tracking.html";
    profileBackLink.innerHTML = '<i class="fa fa-arrow-left"></i> Back to Tracking';
}

const serviceForDefaultUnit = params.get("service") || "Photography";
const defaultPricingUnit = /photo|video/i.test(serviceForDefaultUnit) ? "hour" : "package";
const provider = {
    name: params.get("name") || "Sarah Photography",
    service: params.get("service") || "Photography",
    rating: params.get("rating") || "4.8",
    location: params.get("location") || "Amman, Jordan",
    price: params.get("price") || "100 JOD",
    pricingUnit: params.get("pricingUnit") || defaultPricingUnit,
    pricingQuantity: Math.max(1, Number(params.get("pricingQuantity")) || 1),
    description:
        params.get("description") ||
        "Capturing beautiful moments and creating memorable photography experiences.",

    video: params.get("video") || "",

    // Demo only: these booked days are examples.
    // Replace them with real availability data later.
    bookedDays: (params.get("booked") || "8,16,24")
        .split(",")
        .map(Number)
        .filter(Number.isFinite),

    // Demo only: sample booked times for partially booked dates each month.
    bookedTimesByDay: {
        20: ["10:00 AM", "2:00 PM"],
        22: ["11:00 AM", "1:00 PM", "3:00 PM"]
    }
};

const pricingUnitLabels = {
    hour: ["hour", "hours"], photo: ["photo", "photos"], video: ["finished video", "finished videos"],
    favor: ["favor", "favors"], item: ["item", "items"], package: ["package", "packages"]
};
function rateUnitText(quantity = provider.pricingQuantity) {
    const labels = pricingUnitLabels[provider.pricingUnit] || ["service unit", "service units"];
    return `${quantity} ${quantity === 1 ? labels[0] : labels[1]}`;
}
function estimatePrice(quantity) {
    const price = Number.parseFloat(provider.price);
    if (!Number.isFinite(price) || quantity < 1) return null;
    return provider.pricingUnit === "hour"
        ? (quantity / provider.pricingQuantity) * price
        : Math.ceil(quantity / provider.pricingQuantity) * price;
}


// ========================================
// Display Provider Information
// ========================================

function displayProvider() {
    document.getElementById("provider-name").textContent = provider.name;

    document.getElementById("provider-service").textContent =
        provider.service;

    document.getElementById("provider-rating").textContent =
        provider.rating;

    document.getElementById("provider-location").textContent =
        provider.location;

    document.getElementById("provider-description").textContent =
        provider.description;

    const rateText = `${provider.price} / ${rateUnitText()}`;
    document.getElementById("provider-price").textContent = rateText;

    document.getElementById("provider-avatar").textContent =
        provider.name.trim().charAt(0).toUpperCase() || "P";

    document.getElementById("detail-service").textContent =
        provider.service;

    document.getElementById("detail-location").textContent =
        provider.location;

    document.getElementById("detail-rating").textContent =
        `${provider.rating} / 5`;

    document.getElementById("detail-price").textContent = rateText;

    const videoLink = document.getElementById("video-link");
    if (provider.video) {
        videoLink.href = provider.video;
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";
    } else {
        videoLink.textContent = "Profile video unavailable";
        videoLink.setAttribute("aria-disabled", "true");
        videoLink.removeAttribute("href");
    }
}


// ========================================
// Portfolio Image Viewer
// ========================================

const portfolioButtons = Array.from(
    document.querySelectorAll(".portfolio-item")
);

const imageModal = document.getElementById("image-modal");
const expandedImage = document.getElementById("expanded-image");

let currentImageIndex = 0;

function showPortfolioImage(index) {
    if (portfolioButtons.length === 0) return;

    currentImageIndex =
        (index + portfolioButtons.length) % portfolioButtons.length;

    const button = portfolioButtons[currentImageIndex];
    const image = button.querySelector("img");

    expandedImage.src = button.dataset.image;
    expandedImage.alt = image.alt;

    imageModal.hidden = false;
    document.getElementById("close-image").focus();
}

portfolioButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        showPortfolioImage(index);
    });
});

document.getElementById("previous-image").addEventListener("click", () => {
    showPortfolioImage(currentImageIndex - 1);
});

document.getElementById("next-image").addEventListener("click", () => {
    showPortfolioImage(currentImageIndex + 1);
});

function closeImageModal() {
    imageModal.hidden = true;
}

document.getElementById("close-image").addEventListener(
    "click",
    closeImageModal
);

imageModal.addEventListener("click", event => {
    if (event.target === imageModal) {
        closeImageModal();
    }
});

document.addEventListener("keydown", event => {
    if (imageModal.hidden) return;

    if (event.key === "Escape") {
        closeImageModal();
    }

    if (event.key === "ArrowRight") {
        showPortfolioImage(currentImageIndex + 1);
    }

    if (event.key === "ArrowLeft") {
        showPortfolioImage(currentImageIndex - 1);
    }
});


// Update portfolio count

document.getElementById("portfolio-count").textContent =
    `${portfolioButtons.length} Photos`;


// ========================================
// Availability Calendar
// ========================================

const calendarDays = document.getElementById("calendar-days");
const calendarMonth = document.getElementById("calendar-month");
const selectedDateMessage = document.getElementById("selected-date");
const detailAvailability = document.getElementById("detail-availability");
const timeAvailability = document.getElementById("time-availability");
const availabilityNote = document.getElementById("availability-note");
const timeOptions = document.getElementById("time-options");
const selectedTimeMessage = document.getElementById("selected-time");
const durationSelect = document.getElementById("duration-hours");
const durationControlLabel = document.querySelector("label[for='duration-hours']");
const unitLabels = pricingUnitLabels[provider.pricingUnit] || ["service unit", "service units"];
durationControlLabel.textContent = provider.pricingUnit === "hour"
    ? "How many consecutive hours?"
    : `How many ${unitLabels[1]} do you need?`;
const availabilityTimeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM"
];

let displayedYear = new Date().getFullYear();
let displayedMonth = new Date().getMonth();

let selectedDate = null;
let selectedTime = null;
let selectedDurationHours = null;
let selectedBookingQuantity = null;

function selectCalendarDate(day) {
    selectedDate = new Date(displayedYear, displayedMonth, day);
    selectedTime = null;
    selectedDurationHours = null;
    selectedBookingQuantity = null;
    renderCalendar();
    selectedDateMessage.textContent =
        `Selected date: ${selectedDate.toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
        })}. Choose a time below.`;
    renderTimeAvailability(selectedDate);
}

function getBookedTimes(date) {
    return provider.bookedTimesByDay[date.getDate()] || [];
}

function isFullyBooked(date, bookedTimes = getBookedTimes(date)) {
    return provider.bookedDays.includes(date.getDate()) ||
        availabilityTimeSlots.every(time => bookedTimes.includes(time));
}

function renderTimeAvailability(date) {
    timeAvailability.hidden = false;
    timeOptions.replaceChildren();
    selectedTimeMessage.textContent = "";
    durationSelect.replaceChildren(new Option("Choose a start time first", ""));
    durationSelect.disabled = true;

    const bookedTimes = getBookedTimes(date);
    const fullDay = isFullyBooked(date, bookedTimes);
    availabilityNote.hidden = !fullDay && bookedTimes.length === 0;
    availabilityNote.textContent = fullDay
        ? "This day is fully booked. Please choose another date."
        : bookedTimes.length
            ? `Booked hours for this day: ${bookedTimes.join(", ")}.`
            : "";

    if (fullDay) detailAvailability.textContent = "Fully booked";
    else if (bookedTimes.length) detailAvailability.textContent = "Limited availability";
    else detailAvailability.textContent = "Available";
    detailAvailability.classList.toggle("is-booked", fullDay || bookedTimes.length > 0);

    availabilityTimeSlots.forEach(time => {
        const button = document.createElement("button");
        const isBooked = fullDay || bookedTimes.includes(time);
        button.type = "button";
        button.className = isBooked ? "time-slot booked" : "time-slot";
        button.textContent = time;
        button.disabled = isBooked;
        button.setAttribute("aria-label", isBooked ? `${time}, booked` : `Choose ${time}`);
        if (!isBooked) {
            button.addEventListener("click", () => {
                selectedTime = time;
                selectedDurationHours = null;
                selectedBookingQuantity = null;
                timeOptions.querySelectorAll(".time-slot.selected").forEach(slot => slot.classList.remove("selected"));
                button.classList.add("selected");
                populateDurationOptions(time, bookedTimes);
                selectedTimeMessage.textContent = provider.pricingUnit === "hour"
                    ? `Start time: ${time}. Choose how many consecutive hours you need.`
                    : `Start time: ${time}. Choose how many ${unitLabels[1]} you need.`;
                detailAvailability.textContent = `Starts at ${time}`;
                detailAvailability.classList.remove("is-booked");
            });
        }
        timeOptions.append(button);
    });
}

function timeToMinutes(time) {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time);
    if (!match) return NaN;
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(match[2]);
}

function formatClock(minutes) {
    const hour24 = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function populateDurationOptions(startTime, bookedTimes) {
    const startIndex = availabilityTimeSlots.indexOf(startTime);
    durationSelect.replaceChildren(new Option(provider.pricingUnit === "hour" ? "Choose hours" : "Choose quantity", ""));
    durationSelect.disabled = false;
    if (provider.pricingUnit !== "hour") {
        [...Array.from({ length: 100 }, (_, index) => index + 1), 150, 200, 250, 500].forEach(quantity => {
            durationSelect.add(new Option(`${quantity} ${quantity === 1 ? unitLabels[0] : unitLabels[1]}`, String(quantity)));
        });
        return;
    }

    let maxHours = 0;
    for (let index = startIndex; index < availabilityTimeSlots.length && index < startIndex + 8; index++) {
        if (bookedTimes.includes(availabilityTimeSlots[index])) break;
        maxHours++;
    }

    for (let hours = 1; hours <= maxHours; hours++) {
        durationSelect.add(new Option(`${hours} ${hours === 1 ? "hour" : "hours"}`, String(hours)));
    }
    durationSelect.disabled = maxHours === 0;
    durationSelect.value = "";
}

durationSelect.addEventListener("change", () => {
    selectedBookingQuantity = Number(durationSelect.value) || null;
    selectedDurationHours = provider.pricingUnit === "hour" ? selectedBookingQuantity : 1;
    if (!selectedDate || !selectedTime || !selectedBookingQuantity) {
        selectedTimeMessage.textContent = "Choose a quantity to see your estimated total.";
        return;
    }
    const range = `${selectedTime} - ${formatClock(timeToMinutes(selectedTime) + selectedDurationHours * 60)}`;
    const quantityText = provider.pricingUnit === "hour"
        ? `${selectedBookingQuantity} ${selectedBookingQuantity === 1 ? "hour" : "hours"}`
        : `${selectedBookingQuantity} ${selectedBookingQuantity === 1 ? unitLabels[0] : unitLabels[1]}`;
    const estimatedPrice = estimatePrice(selectedBookingQuantity);
    selectedTimeMessage.textContent = `Selected time: ${range}. ${quantityText}. Estimated total: ${Number.isFinite(estimatedPrice) ? `${estimatedPrice.toLocaleString()} JOD` : "Price on request"}.`;
    detailAvailability.textContent = `Available: ${range}`;
});

function renderCalendar() {
    calendarDays.innerHTML = "";

    const monthName = new Date(
        displayedYear,
        displayedMonth,
        1
    ).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    calendarMonth.textContent = monthName;

    // First weekday of the displayed month.
    const firstWeekday = new Date(
        displayedYear,
        displayedMonth,
        1
    ).getDay();

    // Number of days in the displayed month.
    const daysInMonth = new Date(
        displayedYear,
        displayedMonth + 1,
        0
    ).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells before day 1.
    for (let i = 0; i < firstWeekday; i++) {
        const emptyCell = document.createElement("div");

        emptyCell.className = "calendar-day empty";
        emptyCell.setAttribute("aria-hidden", "true");

        calendarDays.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "calendar-day";
        button.textContent = day;

        const date = new Date(
            displayedYear,
            displayedMonth,
            day
        );

        const isPast = date < today;
        const bookedTimes = provider.bookedTimesByDay[day] || [];
        const isBooked = provider.bookedDays.includes(day) ||
            availabilityTimeSlots.every(time => bookedTimes.includes(time));
        const hasBookedTimes = bookedTimes.length > 0 && !isBooked;
        const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === displayedYear &&
            selectedDate.getMonth() === displayedMonth &&
            selectedDate.getDate() === day;

        if (isPast) {
            button.classList.add("past");
            button.disabled = true;
            button.title = "This date has already passed.";

        } else if (isBooked) {
            button.classList.add("booked");
            button.textContent = `${day} ×`;
            button.title = "This date is fully booked. Select it to view details.";
            button.addEventListener("click", () => selectCalendarDate(day));

        } else {
            button.classList.add("available");
            if (hasBookedTimes) button.classList.add("partially-booked");
            button.title = hasBookedTimes
                ? `Partially booked: ${bookedTimes.join(", ")}. Select to see times.`
                : "Select this available date.";
            button.addEventListener("click", () => selectCalendarDate(day));
        }

        if (isSelected) {
            button.classList.add("selected");
        }

        calendarDays.appendChild(button);
    }
}


// Previous month

document.getElementById("previous-month").addEventListener("click", () => {
    displayedMonth--;

    if (displayedMonth < 0) {
        displayedMonth = 11;
        displayedYear--;
    }

    selectedDate = null;
    selectedTime = null;
    selectedDurationHours = null;
    selectedBookingQuantity = null;
    timeAvailability.hidden = true;
    detailAvailability.classList.remove("is-booked");

    selectedDateMessage.textContent =
        "Select an available date to check availability.";

    detailAvailability.textContent = "Check calendar";

    renderCalendar();
});


// Next month

document.getElementById("next-month").addEventListener("click", () => {
    displayedMonth++;

    if (displayedMonth > 11) {
        displayedMonth = 0;
        displayedYear++;
    }

    selectedDate = null;
    selectedTime = null;
    selectedDurationHours = null;
    selectedBookingQuantity = null;
    timeAvailability.hidden = true;
    detailAvailability.classList.remove("is-booked");

    selectedDateMessage.textContent =
        "Select an available date to check availability.";

    detailAvailability.textContent = "Check calendar";

    renderCalendar();
});


// ========================================
// Select Provider
// ========================================

document.getElementById("select-provider").addEventListener("click", () => {
    const message = document.getElementById("select-message");
    message.classList.remove("is-error");

    if (!selectedDate) {
        message.textContent =
            "Please select a date before continuing.";
        message.classList.add("is-error");

        return;
    }

    if (isFullyBooked(selectedDate)) {
        message.textContent = "This day is fully booked. Please choose another date.";
        message.classList.add("is-error");

        return;
    }

    if (!provider.pricingUnit) {
        message.textContent = "This provider has not set a pricing unit yet.";
        message.classList.add("is-error");
        return;
    }

    if (!selectedTime || !selectedDurationHours || !selectedBookingQuantity) {
        message.textContent = "Please choose a start time and quantity before continuing.";
        message.classList.add("is-error");

        return;
    }

    const selectedProvider = {
        id: Number(params.get("alternativeId") || params.get("providerId")) || undefined,
        name: provider.name,
        service: provider.service,
        rating: Number(provider.rating) || 0,
        location: provider.location,
        price: Number.parseFloat(provider.price) || 0,
        pricingUnit: provider.pricingUnit,
        pricingQuantity: provider.pricingQuantity,
        quantity: selectedBookingQuantity,
        estimatedPrice: estimatePrice(selectedBookingQuantity),
        replacesProviderId: params.get("returnTo") === "tracking" ? Number(params.get("trackingProviderId")) || undefined : undefined,
        bio: provider.description,
        date: [
            selectedDate.getFullYear(),
            String(selectedDate.getMonth() + 1).padStart(2, "0"),
            String(selectedDate.getDate()).padStart(2, "0")
        ].join("-"),
        time: selectedTime,
        durationHours: selectedDurationHours,
        endTime: formatClock(timeToMinutes(selectedTime) + selectedDurationHours * 60),
        timeRange: `${selectedTime} - ${formatClock(timeToMinutes(selectedTime) + selectedDurationHours * 60)}`
    };

    // Save for the current browser tab only.
    // This is a frontend demo, not a confirmed booking.
    try {
        sessionStorage.setItem(
            "teamly-selected-provider",
            JSON.stringify(selectedProvider)
        );
        const savedBookings = JSON.parse(sessionStorage.getItem("teamlyProviderBookings") || "[]");
        const bookings = Array.isArray(savedBookings) ? savedBookings : [];
        const existingIndex = bookings.findIndex(item =>
            (selectedProvider.id != null && item.id != null && Number(item.id) === Number(selectedProvider.id)) ||
            (String(item.name || "").toLowerCase() === selectedProvider.name.toLowerCase() &&
             String(item.service || "").toLowerCase() === selectedProvider.service.toLowerCase())
        );
        if (existingIndex >= 0) bookings[existingIndex] = selectedProvider;
        else bookings.push(selectedProvider);
        sessionStorage.setItem("teamlyProviderBookings", JSON.stringify(bookings));
        if (params.get("returnTo") === "tracking") {
            sessionStorage.setItem("teamlyTrackingAlternativeSelection", JSON.stringify({ provider: selectedProvider }));
        }
    } catch (error) {
        console.error("Could not save provider selection:", error);
        message.textContent = "Could not save your selection. Please try again.";
        message.classList.add("is-error");
        return;
    }

    if (params.get("returnTo") === "tracking") {
        window.location.href = "../Tracking/tracking.html?alternativeSelected=1";
        return;
    }

    // Return to the provider list so the client sees the updated selection.
    const returnParams = new URLSearchParams({
        profileSelected: provider.name,
        selectedService: provider.service
    });
    window.location.href = `../select_provider/select_provider.html?${returnParams.toString()}`;
});


// ========================================
// Initialize
// ========================================

displayProvider();
renderCalendar();
