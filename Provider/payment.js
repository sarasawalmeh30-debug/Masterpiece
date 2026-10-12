(() => {
    "use strict";

    const form = document.getElementById("payment-form");
    const nameInput = document.getElementById("cardholder-name");
    const numberInput = document.getElementById("card-number");
    const expiryInput = document.getElementById("card-expiry");
    const cvvInput = document.getElementById("card-cvv");
    const feedback = document.getElementById("checkout-feedback");
    const onboarding = new URLSearchParams(window.location.search).get("onboarding") === "1"
        && window.sessionStorage.getItem("teamlyProviderOnboardingPending") === "true";
    const submitButtons = [...form.querySelectorAll('button[type="submit"]')];
    const touched = new Set();
    let submitted = false;

    if (onboarding) {
        document.body.classList.add("provider-onboarding");
    }

    const plans = window.TEAMLY_PROVIDER_PLANS || {};
    const selectedPlan = new URLSearchParams(window.location.search).get("plan") || "professional";
    const plan = ["professional", "business"].includes(selectedPlan) ? plans[selectedPlan] : null;
    if (plan) {
        const price = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: plan.currency,
            minimumFractionDigits: plan.price % 1 ? 2 : 0
        }).format(plan.price);
        document.getElementById("selected-plan-price").textContent = price;
        document.getElementById("summary-total").textContent = price;
        document.getElementById("summary-plan").textContent = plan.name;
        document.getElementById("selected-plan-title").textContent = plan.name;
        const billing = plan.billing === "month" ? "Monthly" : plan.billing;
        document.getElementById("selected-plan-billing").textContent = billing;
        document.getElementById("summary-billing").textContent = billing;
        const description = selectedPlan === "business"
            ? "For providers who want maximum exposure and priority tools."
            : "Designed for active providers who want more opportunities.";
        document.getElementById("selected-plan-description").textContent = description;
        document.getElementById("checkout-subtitle").textContent = `Activate your ${plan.name} plan and continue growing with TEAMLY.`;
        document.getElementById("subscription-activation-note").textContent = `Your ${plan.name} subscription will become active after successful payment.`;
    } else {
        feedback.textContent = "The Professional plan price is unavailable. Return to the subscription page and try again.";
        feedback.hidden = false;
        submitButtons.forEach(button => { button.disabled = true; });
    }

    const profile = readProviderProfile();
    if (plan && getCurrentPlan(profile) === selectedPlan) {
        feedback.textContent = `The ${plan.name} plan is already active on this provider account. No payment is needed.`;
        feedback.classList.add("is-info");
        feedback.hidden = false;
        submitButtons.forEach(button => { button.disabled = true; });
    }

    function readProviderProfile() {
        try {
            const raw = window.localStorage.getItem("teamlyProviderProfile");
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function getCurrentPlan(provider) {
        if (!provider || typeof provider !== "object") return null;
        const value = provider.currentPlan || provider.subscriptionPlan || provider.plan;
        const name = value && typeof value === "object" ? value.id || value.name || value.code : value;
        if (typeof name !== "string") return null;
        const normalized = name.trim().toLowerCase();
        if (["professional", "pro", "professional plan"].includes(normalized)) return "professional";
        if (["business", "business plan"].includes(normalized)) return "business";
        return normalized === "free" ? "free" : null;
    }

    function luhnIsValid(value) {
        const digits = value.replace(/\D/g, "");
        if (!/^\d{13,19}$/.test(digits)) return false;
        let sum = 0;
        let doubleDigit = false;
        for (let index = digits.length - 1; index >= 0; index -= 1) {
            let digit = Number(digits[index]);
            if (doubleDigit) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            doubleDigit = !doubleDigit;
        }
        return sum % 10 === 0;
    }

    function expiryIsValid(value) {
        const match = value.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
        if (!match) return false;
        const month = Number(match[1]);
        const year = 2000 + Number(match[2]);
        const endOfExpiryMonth = new Date(year, month, 0, 23, 59, 59, 999);
        return endOfExpiryMonth >= new Date();
    }

    function fieldMessage(input) {
        const value = input.value.trim();
        if (input === nameInput) return value.length >= 2 ? "" : "Enter the name shown on the card.";
        if (input === numberInput) return luhnIsValid(value) ? "" : "Enter a valid card number.";
        if (input === expiryInput) return expiryIsValid(value) ? "" : "Enter a valid future date in MM/YY format.";
        if (input === cvvInput) return /^\d{3,4}$/.test(value) ? "" : "Enter the 3 or 4 digit security code.";
        return "";
    }

    function validateField(input, showMessage = true) {
        const error = document.getElementById(`${input.id}-error`);
        const message = showMessage ? fieldMessage(input) : "";
        error.textContent = message;
        if (message) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
        return message === "";
    }

    [nameInput, numberInput, expiryInput, cvvInput].forEach(input => {
        input.addEventListener("blur", () => {
            touched.add(input);
            validateField(input);
        });
        input.addEventListener("input", () => {
            if (input === numberInput) {
                const digits = input.value.replace(/\D/g, "").slice(0, 19);
                input.value = (digits.match(/.{1,4}/g) || []).join(" ");
            } else if (input === expiryInput) {
                const digits = input.value.replace(/\D/g, "").slice(0, 4);
                input.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
            } else if (input === cvvInput) {
                input.value = input.value.replace(/\D/g, "").slice(0, 4);
            }
            if (submitted || touched.has(input)) validateField(input);
        });
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        if (submitButtons.some(button => button.disabled)) return;
        submitted = true;
        const fields = [nameInput, numberInput, expiryInput, cvvInput];
        const valid = fields.map(input => validateField(input)).every(Boolean);
        if (!valid) {
            feedback.classList.remove("is-info");
            feedback.textContent = "Check the highlighted payment fields and try again.";
            feedback.hidden = false;
            fields.find(input => input.getAttribute("aria-invalid") === "true")?.focus();
            return;
        }

        feedback.classList.add("is-info");
        feedback.textContent = "The details passed format checks, but TEAMLY provider billing is not connected. No payment was sent, no card details were saved, and your plan was not changed. Do not enter real card details on this preview page.";
        feedback.hidden = false;
    });
})();
