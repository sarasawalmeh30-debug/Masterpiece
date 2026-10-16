document.addEventListener("DOMContentLoaded", function () {

const form = document.getElementById("clientRegisterForm");

const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const confirmEmail = document.getElementById("confirmEmail");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const terms = document.getElementById("terms");

const formMessage = document.getElementById("formMessage");
const submitButton = form.querySelector(".create-account-btn");


// Display field error

function showError(field, errorId, message) {

    const errorElement = document.getElementById(errorId);

    errorElement.textContent = message;

    if (field) {
        field.classList.toggle("input-invalid", Boolean(message));
        field.setAttribute("aria-invalid", String(Boolean(message)));
    }

}


// Clear error while typing

[
    fullName,
    email,
    confirmEmail,
    password,
    confirmPassword
].forEach(function (field) {

    field.addEventListener("input", function () {

        field.classList.remove("input-invalid");
        field.removeAttribute("aria-invalid");

        const errorId = field.id + "Error";
        const errorElement = document.getElementById(errorId);

        if (errorElement) {
            errorElement.textContent = "";
        }

        formMessage.textContent = "";
        formMessage.className = "form-message";

    });

});


// Validate and submit

form.addEventListener("submit", function (event) {

    event.preventDefault();

    formMessage.textContent = "";
    formMessage.className = "form-message";

    let isValid = true;

    // Full name

    if (fullName.value.trim().length < 2) {

        showError(
            fullName,
            "fullNameError",
            "Please enter your full name."
        );

        isValid = false;

    } else {

        showError(fullName, "fullNameError", "");

    }


    // Email format

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.value.trim())) {

        showError(
            email,
            "emailError",
            "Please enter a valid email address."
        );

        isValid = false;

    } else {

        showError(email, "emailError", "");

    }


    // Confirm email

    if (
        !confirmEmail.value.trim() ||
        confirmEmail.value.trim().toLowerCase() !==
        email.value.trim().toLowerCase()
    ) {

        showError(
            confirmEmail,
            "confirmEmailError",
            "Email addresses do not match."
        );

        isValid = false;

    } else {

        showError(confirmEmail, "confirmEmailError", "");

    }


    // Password length

    if (password.value.length < 8) {

        showError(
            password,
            "passwordError",
            "Password must be at least 8 characters."
        );

        isValid = false;

    } else {

        showError(password, "passwordError", "");

    }


    // Confirm password

    if (
        !confirmPassword.value ||
        confirmPassword.value !== password.value
    ) {

        showError(
            confirmPassword,
            "confirmPasswordError",
            "Passwords do not match."
        );

        isValid = false;

    } else {

        showError(confirmPassword, "confirmPasswordError", "");

    }


    // Terms and conditions

    const termsError = document.getElementById("termsError");

    if (!terms.checked) {

        termsError.textContent =
            "Please agree to the Terms & Conditions and Privacy Policy.";

        isValid = false;

    } else {

        termsError.textContent = "";

    }


    // Stop if validation fails

    if (!isValid) {

        formMessage.textContent =
            "Please check the highlighted fields.";

        formMessage.classList.add("error");

        const firstInvalidField = form.querySelector(
            ".input-invalid, input[type='checkbox']:invalid"
        );

        if (firstInvalidField) {
            firstInvalidField.focus();
        }

        return;

    }


    // This static project has no database. Save the account metadata in this browser only.
    try {
        const savedClients = JSON.parse(window.localStorage.getItem("teamlyRegisteredClients") || "[]");
        const registeredClients = Array.isArray(savedClients) ? savedClients : [];
        const normalizedEmail = email.value.trim().toLowerCase();
        if (registeredClients.some(client => String(client.email || "").toLowerCase() === normalizedEmail)) {
            showError(email, "emailError", "An account with this email already exists on this device.");
            formMessage.textContent = "Please use a different email address.";
            formMessage.classList.add("error");
            email.focus();
            return;
        }
        const registeredClient = {
            id: "client-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
            name: fullName.value.trim(),
            email: normalizedEmail,
            type: "client",
            status: "active",
            created: new Date().toISOString()
        };
        registeredClients.push(registeredClient);
        window.localStorage.setItem("teamlyRegisteredClients", JSON.stringify(registeredClients));
        try {
            const savedNotifications = JSON.parse(window.localStorage.getItem("teamlyAdminNotifications") || "[]");
            const notifications = Array.isArray(savedNotifications) ? savedNotifications : [];
            notifications.unshift({ id: `signup-${registeredClient.id}`, kind: "registration", title: "Client registered", actor: registeredClient.name, detail: `New client account created (${registeredClient.email}).`, timestamp: registeredClient.created });
            window.localStorage.setItem("teamlyAdminNotifications", JSON.stringify(notifications.slice(0, 500)));
        } catch (notificationError) { /* signup still succeeds if the activity log cannot be written */ }
    } catch (error) {
        formMessage.textContent = "This browser could not save the account. Please check storage settings and try again.";
        formMessage.classList.add("error");
        return;
    }

    try {
        window.sessionStorage.setItem("teamlyLoggedIn", "true");
        window.sessionStorage.setItem("teamlyUserName", fullName.value.trim());
        window.sessionStorage.setItem("teamlyUserEmail", email.value.trim().toLowerCase());
    } catch (error) {
        // The demo can still continue to AI Chat if session storage is unavailable.
    }

    window.location.href="../ai_chat/ai_chat.html";

});

});
