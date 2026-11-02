// =====================================
// TEAMLY PAYMENTS
// Frontend demo only
// =====================================

const paymentForm = document.getElementById("payment-form");

const cardNumberInput = document.getElementById("card-number");
const cardExpiryInput = document.getElementById("card-expiry");
const cardCvvInput = document.getElementById("card-cvv");

const payButton = document.getElementById("pay-button");
const paymentResult = document.getElementById("payment-result");


// =====================================
// PAYMENT AMOUNTS
// Demo values — replace with real project data
// =====================================

const projectGroups = {
    wedding: {
        name: "Wedding Project",
        location: "Amman, Jordan",
        date: "25 October 2026",
        budget: 2500,
        deposit: 300,
        fee: 75,
        members: [
            { name: "Ahmad", service: "Photography", initials: "A", avatar: "avatar-one" },
            { name: "Dana", service: "Decoration", initials: "D", avatar: "avatar-two" },
            { name: "Mohammad", service: "Videography", initials: "M", avatar: "avatar-three" }
        ]
    },
    engagement: {
        name: "Engagement Celebration",
        location: "Irbid, Jordan",
        date: "14 December 2026",
        budget: 1800,
        deposit: 240,
        fee: 60,
        members: [
            { name: "Sara", service: "Photography", initials: "S", avatar: "avatar-one" },
            { name: "Omar", service: "Videography", initials: "O", avatar: "avatar-three" }
        ]
    },
    graduation: {
        name: "Graduation Event",
        location: "Amman, Jordan",
        date: "10 January 2027",
        budget: 3200,
        deposit: 420,
        fee: 75,
        members: [
            { name: "Lina", service: "Photography", initials: "L", avatar: "avatar-one" },
            { name: "Yazan", service: "Decoration", initials: "Y", avatar: "avatar-two" },
            { name: "Khaled", service: "Catering", initials: "K", avatar: "avatar-three" }
        ]
    }
};

const groupSelect = document.getElementById("project-group-select");
const projectCard = document.getElementById("payment-project-card");
const paymentSection = document.getElementById("payment-section");
const selectedTeamContainer = document.getElementById("selected-team-members");
const selectedTeamTemplate = document.getElementById("selected-team-member-template");
let selectedGroup = null;

function money(amount) {
    return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
}

function selectProjectGroup(groupId) {
    selectedGroup = projectGroups[groupId] || null;
    projectCard.hidden = !selectedGroup;
    paymentSection.hidden = !selectedGroup;

    if (!selectedGroup) {
        selectedTeamContainer.replaceChildren();
        document.getElementById("selected-item-empty").hidden = false;
        document.getElementById("selected-project-name").textContent = "Choose a project group";
        document.getElementById("selected-count").textContent = "—";
        document.getElementById("selected-item-total-amount").textContent = "—";
        validateCard();
        return;
    }

    const total = selectedGroup.deposit + selectedGroup.fee;
    document.getElementById("payment-project-name").textContent = selectedGroup.name;
    document.getElementById("payment-location").textContent = selectedGroup.location;
    document.getElementById("payment-date").textContent = selectedGroup.date;
    document.getElementById("payment-team-count").textContent = selectedGroup.members.length;
    document.getElementById("selected-project-name").textContent = selectedGroup.name;
    document.getElementById("selected-count").textContent = selectedGroup.members.length;
    document.getElementById("project-budget").textContent = money(selectedGroup.budget);
    document.getElementById("provider-deposit").textContent = money(selectedGroup.deposit);
    document.getElementById("service-fee").textContent = money(selectedGroup.fee);
    document.getElementById("total-to-pay").textContent = money(total);
    document.getElementById("button-total").textContent = money(total);
    document.getElementById("selected-item-total-amount").textContent = money(total);

    const previewAvatars = document.querySelectorAll(".project-team-preview .team-avatar");
    previewAvatars.forEach((avatar, index) => {
        const member = selectedGroup.members[index];
        avatar.hidden = !member;
        if (member) {
            avatar.className = `team-avatar ${member.avatar}`;
            avatar.textContent = member.initials;
        }
    });

    selectedTeamContainer.replaceChildren();
    selectedGroup.members.forEach(member => {
        const item = selectedTeamTemplate.content.firstElementChild.cloneNode(true);
        const avatar = item.querySelector(".selected-item-avatar");
        avatar.classList.add(member.avatar);
        avatar.textContent = member.initials;
        item.querySelector(".selected-item-info strong").textContent = member.name;
        item.querySelector(".selected-item-info span").textContent = member.service;
        selectedTeamContainer.appendChild(item);
    });
    document.getElementById("selected-item-empty").hidden = true;
    validateCard();
}

groupSelect.addEventListener("change", () => selectProjectGroup(groupSelect.value));
selectProjectGroup("");


// =====================================
// CARD NUMBER
// =====================================

cardNumberInput.addEventListener("input", function () {
    let digits = this.value.replace(/\D/g, "").slice(0, 16);

    this.value = digits.replace(/(.{4})/g, "$1 ").trim();

    validateCard();
});


// =====================================
// EXPIRY DATE
// =====================================

cardExpiryInput.addEventListener("input", function () {
    let digits = this.value.replace(/\D/g, "").slice(0, 4);

    if (digits.length > 2) {
        digits = digits.slice(0, 2) + "/" + digits.slice(2);
    }

    this.value = digits;

    validateCard();
});


// =====================================
// CVV
// =====================================

cardCvvInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 4);

    validateCard();
});


// =====================================
// VALIDATION
// =====================================

function isValidCardNumber(value) {
    const digits = value.replace(/\s/g, "");

    // Basic format check only.
    // Does not confirm the card is real or usable.
    return /^\d{16}$/.test(digits);
}

function isValidExpiry(value) {
    const match = value.match(/^(\d{2})\/(\d{2})$/);

    if (!match) return false;

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);

    if (month < 1 || month > 12) return false;

    const now = new Date();

    // The card remains valid through the final day of its expiry month.
    const expiryDate = new Date(year, month, 0, 23, 59, 59);

    return expiryDate >= now;
}

function isValidCVV(value) {
    return /^\d{3,4}$/.test(value);
}


function validateCard() {
    const numberValid = isValidCardNumber(cardNumberInput.value);
    const expiryValid = isValidExpiry(cardExpiryInput.value);
    const cvvValid = isValidCVV(cardCvvInput.value);

    document.getElementById("card-number-error").textContent =
        cardNumberInput.value && !numberValid
            ? "Enter a 16-digit card number."
            : "";

    document.getElementById("card-expiry-error").textContent =
        cardExpiryInput.value && !expiryValid
            ? "Enter a valid, unexpired MM/YY date."
            : "";

    document.getElementById("card-cvv-error").textContent =
        cardCvvInput.value && !cvvValid
            ? "Enter a 3- or 4-digit CVV."
            : "";

    payButton.disabled = !(selectedGroup && numberValid && expiryValid && cvvValid);

    return !payButton.disabled;
}


// =====================================
// PAYMENT BUTTON
// =====================================

paymentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!selectedGroup) {
        groupSelect.focus();
        return;
    }

    if (!validateCard()) {
        return;
    }

    // This is a UI demonstration only.
    // No card data is stored and no payment is processed.
    paymentResult.textContent = `Payment for ${selectedGroup.name} is ready, but payment processing is not connected in this demo.`;
    paymentResult.classList.add("is-demo-message");

    paymentResult.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
});


// =====================================
// PROJECT CHECK-IN
// =====================================

const checkinOptions = document.querySelectorAll(".checkin-option");
const checkinFeedback = document.getElementById("checkin-feedback");

checkinOptions.forEach(function (button) {
    button.addEventListener("click", function () {
        const choice = this.dataset.checkin;

        checkinOptions.forEach(function (option) {
            option.classList.remove("selected");
            option.setAttribute("aria-pressed", "false");
        });

        this.classList.add("selected");
        this.setAttribute("aria-pressed", "true");

        if (choice === "well") {
            checkinFeedback.textContent =
                "Thank you for your feedback! We're glad things are going well.";

        } else if (choice === "concern") {
            checkinFeedback.textContent =
                "Thank you for letting us know. Your concern has been selected.";

        } else if (choice === "help") {
            window.location.href = "../needHelp/Help.html";
        }
    });
});


// =====================================
// SIDEBAR
// =====================================

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
                Sidebar could not be loaded. Check the file paths.
            </p>
        `;
    }
}


// =====================================
// INITIALIZE
// =====================================

validateCard();
loadSidebar();
