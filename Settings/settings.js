(() => {
    const views = {
        home: document.getElementById("settingsHome"),
        password: document.getElementById("passwordView"),
        email: document.getElementById("emailView"),
        terms: document.getElementById("termsView"),
        privacy: document.getElementById("privacyView")
    };
    const alertBox = document.getElementById("settingsAlert");
    const form = document.getElementById("passwordForm");
    const emailForm = document.getElementById("emailForm");
    const emailInput = document.getElementById("newEmail");
    const emailError = document.getElementById("emailError");
    const fields = {
        current: document.getElementById("currentPassword"),
        next: document.getElementById("newPassword"),
        confirm: document.getElementById("confirmPassword")
    };
    const errorNodes = {
        current: document.getElementById("currentPasswordError"),
        next: document.getElementById("newPasswordError"),
        confirm: document.getElementById("confirmPasswordError")
    };

    const role = new URLSearchParams(window.location.search).get("role");
    const storedProviderProfile = readJSON("teamlyProviderProfile", null);
    let currentEmail = (() => {
        try { return window.sessionStorage.getItem("teamlyUserEmail") || (storedProviderProfile && storedProviderProfile.email) || ""; }
        catch (error) { return (storedProviderProfile && storedProviderProfile.email) || ""; }
    })();
    const backLinks = {
        client: "../ai_chat/ai_chat.html",
        provider: "../Provider/requests.html",
        admin: "../admain/Admin_dashboard.html"
    };
    if (backLinks[role]) document.getElementById("workspaceBack").href = backLinks[role];
    const returnSource = new URLSearchParams(window.location.search).get("from");
    if (returnSource === "register") {
        document.getElementById("workspaceBack").href = "../Regester_Client/reg_client.html";
    } else if (returnSource === "provider-register") {
        document.getElementById("workspaceBack").href = "../Provider/Provider_Register.html";
    }

    function showView(name) {
        Object.entries(views).forEach(([key, node]) => { node.hidden = key !== name; });
        alertBox.hidden = true;
        if (name === "email") {
            emailInput.value = currentEmail;
            emailError.textContent = "";
            emailInput.removeAttribute("aria-invalid");
        }
        const target = name === "home" ? document.getElementById("settingsOptionsTitle") : views[name].querySelector("h2");
        if (target) {
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
        }
    }

    function readJSON(key, fallback) {
        try { return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback; }
        catch (error) { return fallback; }
    }

    document.querySelectorAll("[data-open-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.openView)));
    document.querySelectorAll("[data-back]").forEach(button => button.addEventListener("click", () => showView("home")));
    const requestedView = new URLSearchParams(window.location.search).get("view");
    if (requestedView && views[requestedView]) showView(requestedView);
    function setError(key, message) {
        errorNodes[key].textContent = message;
        fields[key].setAttribute("aria-invalid", message ? "true" : "false");
    }
    function clearErrors() { Object.keys(errorNodes).forEach(key => setError(key, "")); }

    form.addEventListener("submit", event => {
        event.preventDefault();
        clearErrors();
        let valid = true;
        if (!fields.current.value) { setError("current", "Enter your current password."); valid = false; }
        if (!fields.next.value) { setError("next", "Enter a new password."); valid = false; }
        else if (fields.next.value.length < 8) { setError("next", "Use at least 8 characters."); valid = false; }
        if (!fields.confirm.value) { setError("confirm", "Confirm your new password."); valid = false; }
        else if (fields.confirm.value !== fields.next.value) { setError("confirm", "The passwords do not match."); valid = false; }
        if (fields.current.value && fields.next.value && fields.current.value === fields.next.value) {
            setError("next", "Choose a password different from your current one."); valid = false;
        }
        if (!valid) {
            const firstInvalid = form.querySelector('[aria-invalid="true"]');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        // No backend/authentication endpoint exists in this project. Never persist password data or report a false success.
        form.reset();
        alertBox.textContent = "No changes were made. This project has no authenticated backend endpoint to verify the current password or save a new one.";
        alertBox.hidden = false;
        alertBox.focus();
    });

    document.getElementById("cancelPassword").addEventListener("click", () => {
        form.reset();
        clearErrors();
        alertBox.hidden = true;
        fields.current.focus();
    });

    emailForm.addEventListener("submit", event => {
        event.preventDefault();
        const nextEmail = emailInput.value.trim().toLowerCase();
        emailError.textContent = "";
        emailInput.removeAttribute("aria-invalid");
        alertBox.hidden = true;

        if (!emailInput.validity.valid || !nextEmail) {
            emailError.textContent = "Enter a valid email address.";
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
            return;
        }
        if (nextEmail === currentEmail.toLowerCase()) {
            emailError.textContent = "This is already your current email address.";
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
            return;
        }

        try {
            const clients = readJSON("teamlyRegisteredClients", []);
            const provider = readJSON("teamlyProviderProfile", null);
            const clientList = Array.isArray(clients) ? clients : [];
            const duplicateClient = clientList.some(client => String(client.email || "").toLowerCase() === nextEmail && String(client.email || "").toLowerCase() !== currentEmail.toLowerCase());
            const duplicateProvider = provider && String(provider.email || "").toLowerCase() === nextEmail && String(provider.email || "").toLowerCase() !== currentEmail.toLowerCase();
            if (duplicateClient || duplicateProvider) {
                emailError.textContent = "This email address is already used by an account on this device.";
                emailInput.setAttribute("aria-invalid", "true");
                emailInput.focus();
                return;
            }

            let savedAccount = false;
            const clientIndex = clientList.findIndex(client => String(client.email || "").toLowerCase() === currentEmail.toLowerCase());
            if (clientIndex >= 0) {
                clientList[clientIndex].email = nextEmail;
                window.localStorage.setItem("teamlyRegisteredClients", JSON.stringify(clientList));
                savedAccount = true;
            } else if (provider && String(provider.email || "").toLowerCase() === currentEmail.toLowerCase()) {
                provider.email = nextEmail;
                window.localStorage.setItem("teamlyProviderProfile", JSON.stringify(provider));
                savedAccount = true;
            }
            window.sessionStorage.setItem("teamlyUserEmail", nextEmail);
            currentEmail = nextEmail;
            const successMessage = savedAccount
                ? "Your email address was updated for this browser account."
                : "Your email address was updated for this session. This demo does not have an authenticated server account.";
            showView("home");
            alertBox.textContent = successMessage;
            alertBox.hidden = false;
            alertBox.focus();
        } catch (error) {
            emailError.textContent = "The email address could not be saved in this browser. Check browser storage and try again.";
            emailInput.setAttribute("aria-invalid", "true");
            emailInput.focus();
        }
    });

    document.getElementById("cancelEmail").addEventListener("click", () => {
        emailForm.reset();
        emailError.textContent = "";
        emailInput.removeAttribute("aria-invalid");
        showView("home");
    });
})();
