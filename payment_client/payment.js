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

const projectBudget = 2500;
const providerDeposit = 300;
const serviceFee = 75;
const totalToPay = providerDeposit + serviceFee;

document.getElementById("project-budget").textContent =
    `${projectBudget.toFixed(2)} JOD`;

document.getElementById("provider-deposit").textContent =
    `${providerDeposit.toFixed(2)} JOD`;

document.getElementById("service-fee").textContent =
    `${serviceFee.toFixed(2)} JOD`;

document.getElementById("total-to-pay").textContent =
    `${totalToPay.toFixed(2)} JOD`;

document.getElementById("button-total").textContent =
    `${totalToPay.toFixed(2)} JOD`;

document.querySelector(".selected-item-total strong").textContent =
    `${totalToPay.toFixed(2)} JOD`;


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

    payButton.disabled = !(numberValid && expiryValid && cvvValid);

    return !payButton.disabled;
}


// =====================================
// PAYMENT BUTTON
// =====================================

paymentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateCard()) {
        return;
    }

    // This is a UI demonstration only.
    // No card data is stored and no payment is processed.
    // paymentResult.textContent =
       

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
