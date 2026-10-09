// =========================
// LOGIN PAGE INTERACTIONS
// =========================

const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");

const forgotPassword = document.getElementById("forgotPassword");
const resetOverlay = document.getElementById("resetOverlay");
const closeReset = document.getElementById("closeReset");
const backToLogin = document.getElementById("backToLogin");

const resetForm = document.getElementById("resetForm");
const resetTitle = document.getElementById("resetTitle");
const resetDescription = document.getElementById("resetDescription");
const resetLabel = document.getElementById("resetLabel");
const resetInput = document.getElementById("resetInput");
const resetExtraFields = document.getElementById("resetExtraFields");
const resetSubmit = document.getElementById("resetSubmit");
const resetMessage = document.getElementById("resetMessage");
const resetProgress = document.getElementById("resetProgress");

let resetStep = 1;
let resetEmail = "";

// Show or hide password
const eyeIcon = document.getElementById("eyeIcon");

togglePassword.addEventListener("click", function () {
const isHidden = passwordInput.type === "password";

passwordInput.type = isHidden ? "text" : "password";

eyeIcon.classList.toggle("fa-eye", isHidden);
eyeIcon.classList.toggle("fa-eye-slash", !isHidden);

togglePassword.setAttribute(
    "aria-label",
    isHidden ? "Hide password" : "Show password"
);

togglePassword.setAttribute(
    "title",
    isHidden ? "Hide password" : "Show password"
);

});

// Login form: frontend validation only
loginForm.addEventListener("submit", function (event) {
event.preventDefault();

loginMessage.textContent = "";
loginMessage.className = "message";

if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
}

loginMessage.textContent =
    "The login form is ready to be connected to your backend.";
loginMessage.classList.add("success");

});

// Open popup
function openResetPopup() {
resetOverlay.hidden = false;
resetOverlay.setAttribute("aria-hidden", "false");
document.body.style.overflow = "hidden";

showResetStep(1);

setTimeout(function () {
    resetInput.focus();
}, 0);

}

forgotPassword.addEventListener("click", openResetPopup);

// Close popup and reset its interface
function closeResetPopup() {
resetOverlay.hidden = true;
resetOverlay.setAttribute("aria-hidden", "true");
document.body.style.overflow = "";

resetForm.reset();

resetStep = 1;
resetEmail = "";

resetExtraFields.innerHTML = "";
resetMessage.textContent = "";
resetMessage.className = "reset-message";

resetSubmit.onclick = null;

}

closeReset.addEventListener("click", closeResetPopup);
backToLogin.addEventListener("click", closeResetPopup);

// Close when clicking outside the popup
resetOverlay.addEventListener("click", function (event) {
if (event.target === resetOverlay) {
closeResetPopup();
}
});

// Escape key closes popup
document.addEventListener("keydown", function (event) {
if (event.key === "Escape" && !resetOverlay.hidden) {
closeResetPopup();
}
});

// Display the correct step
function showResetStep(step) {
resetStep = step;

resetMessage.textContent = "";
resetMessage.className = "reset-message";

resetExtraFields.innerHTML = "";

resetInput.hidden = false;
resetInput.required = true;
resetInput.value = "";
resetInput.removeAttribute("pattern");
resetInput.removeAttribute("maxlength");
resetInput.removeAttribute("minlength");
resetInput.autocomplete = "off";

resetSubmit.onclick = null;
resetSubmit.type = "submit";

const progressItems = resetProgress.querySelectorAll("span");

progressItems.forEach(function (item, index) {
    item.classList.toggle("active", index < step);
});

if (step === 1) {
    resetTitle.textContent = "Forgot Password?";

    resetDescription.textContent =
        "No worries! Enter the email address associated with your account and we'll send you a verification code.";

    resetLabel.textContent = "Email Address";

    resetInput.type = "email";
    resetInput.placeholder = "you@example.com";
    resetInput.autocomplete = "email";

    resetSubmit.textContent = "Send Verification Code";
}

else if (step === 2) {
    resetTitle.textContent = "Verify Your Email";

    resetDescription.textContent =
        "Enter the 6-digit verification code sent to " + resetEmail + ".";

    resetLabel.textContent = "Verification Code";

    resetInput.type = "text";
    resetInput.inputMode = "numeric";
    resetInput.placeholder = "Enter 6-digit code";
    resetInput.maxLength = 6;
    resetInput.pattern = "[0-9]{6}";

    resetExtraFields.innerHTML = `
        <p class="reset-note">
            Demo only: enter any 6 digits to preview the next step.
        </p>
    `;

    resetSubmit.textContent = "Verify Code";
}

else if (step === 3) {
    resetTitle.textContent = "Create New Password";

    resetDescription.textContent =
        "Choose a new password for your TEAMLY account.";

    resetLabel.textContent = "New Password";

    resetInput.type = "password";
    resetInput.placeholder = "Enter new password";
    resetInput.minLength = 8;
    resetInput.autocomplete = "new-password";

    resetExtraFields.innerHTML = `
        <div class="reset-extra-group">
            <label for="confirmNewPassword">
                Confirm New Password
            </label>

            <input
                type="password"
                id="confirmNewPassword"
                placeholder="Re-enter your password"
                minlength="8"
                autocomplete="new-password"
                required
            >
        </div>
    `;

    resetSubmit.textContent = "Reset Password";
}

}

// Handle popup steps
resetForm.addEventListener("submit", function (event) {
event.preventDefault();

resetMessage.textContent = "";
resetMessage.className = "reset-message";

if (resetStep === 1) {
    if (!resetInput.checkValidity()) {
        resetInput.reportValidity();
        return;
    }

    resetEmail = resetInput.value.trim();

    showResetStep(2);

    resetMessage.textContent =
        "Demo: the verification screen is ready. No email was sent.";
    resetMessage.classList.add("success");
}

else if (resetStep === 2) {
    const verificationCode = resetInput.value.trim();

    if (!/^[0-9]{6}$/.test(verificationCode)) {
        resetMessage.textContent =
            "Please enter a 6-digit verification code.";

        resetMessage.classList.add("error");
        return;
    }

    // Demo only: no real code verification occurs.
    showResetStep(3);
}

else if (resetStep === 3) {
    const newPassword = resetInput.value;
    const confirmPassword =
        document.getElementById("confirmNewPassword").value;

    if (newPassword.length < 8) {
        resetMessage.textContent =
            "Password must contain at least 8 characters.";

        resetMessage.classList.add("error");
        return;
    }

    if (newPassword !== confirmPassword) {
        resetMessage.textContent =
            "Passwords do not match.";

        resetMessage.classList.add("error");
        return;
    }

    // Demo only: the password is not saved or changed.
    showResetSuccess();
}

});

// Final success screen
function showResetSuccess() {
resetStep = 3;

resetProgress.querySelectorAll("span").forEach(function (item) {
    item.classList.add("active");
});

resetTitle.textContent = "Password Reset Complete!";

resetDescription.textContent =
    "Your demo flow is complete. Once the backend is connected, your new password can be securely saved.";

resetLabel.textContent = "";

resetInput.hidden = true;
resetInput.required = false;

resetExtraFields.innerHTML = "";

resetSubmit.textContent = "Back to Login";

resetMessage.textContent =
    "Demo completed. No password was changed.";

resetMessage.className = "reset-message success";

resetSubmit.type = "button";

resetSubmit.onclick = closeResetPopup;

}