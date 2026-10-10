// ========================================
// Provider Profile Data
// ========================================

const params = new URLSearchParams(window.location.search);

const provider = {
    name: params.get("name") || "Sarah Photography",
    service: params.get("service") || "Photography",
    rating: params.get("rating") || "4.8",
    location: params.get("location") || "Amman, Jordan",
    price: params.get("price") || "100 JOD",
    description:
        params.get("description") ||
        "Capturing beautiful moments and creating memorable photography experiences.",

    video: params.get("video") || "",

    // Demo only: these booked days are examples.
    // Replace them with real availability data later.
    bookedDays: (params.get("booked") || "8,16,24")
        .split(",")
        .map(Number)
        .filter(Number.isFinite)
};


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

    document.getElementById("provider-price").textContent =
        provider.price;

    document.getElementById("provider-avatar").textContent =
        provider.name.trim().charAt(0).toUpperCase() || "P";

    document.getElementById("detail-service").textContent =
        provider.service;

    document.getElementById("detail-location").textContent =
        provider.location;

    document.getElementById("detail-rating").textContent =
        `${provider.rating} / 5`;

    document.getElementById("detail-price").textContent =
        provider.price;

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

let displayedYear = new Date().getFullYear();
let displayedMonth = new Date().getMonth();

let selectedDate = null;

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
        const isBooked = provider.bookedDays.includes(day);
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
            button.disabled = true;
            button.textContent = `${day} ×`;
            button.title = "This date is booked.";

        } else {
            button.classList.add("available");
            button.title = "Select this available date.";

            button.addEventListener("click", () => {
                selectedDate = new Date(
                    displayedYear,
                    displayedMonth,
                    day
                );

                renderCalendar();

                selectedDateMessage.textContent =
                    `Selected date: ${selectedDate.toLocaleDateString(
                        "en-US",
                        {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                        }
                    )}. This date appears available in the demo calendar.`;

                detailAvailability.textContent = "Available";
            });
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

    if (!selectedDate) {
        message.textContent =
            "Please select an available date before continuing.";

        return;
    }

    const selectedProvider = {
        name: provider.name,
        service: provider.service,
        date: selectedDate.toISOString().slice(0, 10)
    };

    // Save for the current browser tab only.
    // This is a frontend demo, not a confirmed booking.
    try {
        sessionStorage.setItem(
            "teamly-selected-provider",
            JSON.stringify(selectedProvider)
        );
    } catch (error) {
        console.error("Could not save provider selection:", error);
    }

    message.textContent =
        `${provider.name} selected for ${selectedDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        )}. This selection is saved in this browser tab only; no booking request was sent.`;
});


// ========================================
// Initialize
// ========================================

displayProvider();
renderCalendar();
