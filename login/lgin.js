
const loginForm = document.getElementById("loginForm");
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
const loginSection = document.querySelector(".login-section");
const invitationSeal = document.getElementById("invitationSeal");
let loginSuccessTimer = 0;
let resetStep = 1;
let resetEmail = "";

invitationSeal.addEventListener("click", function () {
    loginSection.classList.add("invitation-open");
    invitationSeal.setAttribute("aria-expanded", "true");
    window.setTimeout(function () { document.getElementById("email").focus(); }, 680);
});

function restoreLoginPage() {
    if (loginSuccessTimer) window.clearTimeout(loginSuccessTimer);
    loginSuccessTimer = 0;
    loginSection.classList.remove("login-successful", "login-celebrating", "is-form-focused");
    loginSection.classList.remove("invitation-open");
    invitationSeal.setAttribute("aria-expanded", "false");
    loginMessage.textContent = "";
    loginMessage.className = "message";
}

window.addEventListener("pageshow", restoreLoginPage);
window.addEventListener("pagehide", function () {
    if (loginSuccessTimer) window.clearTimeout(loginSuccessTimer);
    loginSuccessTimer = 0;
});

loginForm.addEventListener("focusin", function (event) {
    if (event.target.matches("input")) loginSection.classList.add("is-form-focused");
});

loginForm.addEventListener("focusout", function (event) {
    if (!event.relatedTarget || !event.relatedTarget.matches("input")) {
        loginSection.classList.remove("is-form-focused");
    }
});

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginEmailError = document.getElementById("emailError");
const loginPasswordError = document.getElementById("passwordError");

function clearLoginFieldError(input, errorElement) {
    input.classList.remove("input-invalid");
    input.removeAttribute("aria-invalid");
    errorElement.textContent = "";
    loginMessage.textContent = "";
    loginMessage.className = "message";
}

emailInput.addEventListener("input", function () { clearLoginFieldError(emailInput, loginEmailError); });
passwordInput.addEventListener("input", function () { clearLoginFieldError(passwordInput, loginPasswordError); });

// Login form: frontend validation only
loginForm.addEventListener("submit", function (event) {
event.preventDefault();

if (loginSection.classList.contains("login-celebrating") || loginSection.classList.contains("login-successful")) return;

loginMessage.textContent = "";
loginMessage.className = "message";
loginEmailError.textContent = "";
loginPasswordError.textContent = "";
emailInput.classList.remove("input-invalid");
passwordInput.classList.remove("input-invalid");
emailInput.removeAttribute("aria-invalid");
passwordInput.removeAttribute("aria-invalid");

const emailValue = emailInput.value.trim();
const normalizedEmail = emailValue.toLowerCase();
const isAdminLogin = normalizedEmail === "sarawaleed@gmail.com" && passwordInput.value === "20002003Sara";
let firstInvalid = null;
if (!emailValue || !emailInput.validity.valid) {
    loginEmailError.textContent = "Enter a valid email address.";
    emailInput.classList.add("input-invalid");
    emailInput.setAttribute("aria-invalid", "true");
    firstInvalid = emailInput;
}
if (passwordInput.value.length < 8) {
    loginPasswordError.textContent = passwordInput.value ? "Password must be at least 8 characters." : "Enter your password.";
    passwordInput.classList.add("input-invalid");
    passwordInput.setAttribute("aria-invalid", "true");
    firstInvalid = firstInvalid || passwordInput;
}

if (firstInvalid) {
    loginMessage.textContent = "Please correct the highlighted fields.";
    loginMessage.classList.add("error");
    firstInvalid.focus();
    return;
}

try {
    sessionStorage.setItem("teamlyLoggedIn", "true");
    let displayName = isAdminLogin ? "Sara Waleed" : emailValue.split("@")[0]
        .replace(/[._+-]+/g, " ")
        .replace(/\b\w/g, character => character.toUpperCase())
        .trim();
    sessionStorage.setItem("teamlyUserEmail", normalizedEmail);
    sessionStorage.setItem("teamlyUserRole", isAdminLogin ? "admin" : "client");
    if (!isAdminLogin) {
        try {
            const savedClients = JSON.parse(localStorage.getItem("teamlyRegisteredClients") || "[]");
            if (Array.isArray(savedClients)) {
                const matchingClient = savedClients.find(client => String(client.email || "").trim().toLowerCase() === normalizedEmail);
                if (matchingClient && matchingClient.name) displayName = String(matchingClient.name).trim();
            }
        } catch (storageError) {
            // The email-based display name remains available if client records cannot be read.
        }
    }
    if (displayName) sessionStorage.setItem("teamlyUserName", displayName);
} catch (error) {
    // Keep the demo login flow usable if browser storage is unavailable.
}

loginMessage.textContent = isAdminLogin
    ? "Admin sign-in successful. Opening the admin dashboard..."
    : "Demo sign-in: the fields passed validation, but account credentials are not verified.";
loginMessage.classList.add("success");
loginSection.classList.add("login-celebrating");
loginSuccessTimer = window.setTimeout(function () {
    loginSection.classList.remove("login-celebrating");
    loginSection.classList.add("login-successful");
    loginSuccessTimer = window.setTimeout(function () {
        loginSuccessTimer = 0;
        if (isAdminLogin) {
            window.location.href = "../admain/Admin_dashboard.html";
            return;
        }
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        window.location.href = [
            "../select_provider/select_provider.html",
            "../admain/Admin_dashboard.html",
            "../admain/Clients.html",
            "../admain/Providers.html",
            "../admain/Requests.html",
            "../admain/Projects.html",
            "../admain/Financial.html",
            "../admain/Notifications.html",
            "../admain/Services.html"
        ].includes(returnTo)
            ? returnTo
            : "../ai_chat/ai_chat.html";
    }, 680);
}, 720);

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
        <p class="reset-note"></p>
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

    // resetMessage.textContent =
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

// Proximity response stays separate from the central heart's automatic 3D spin.
(function setupLoginVisualInteraction() {
    const panel = document.querySelector(".login-image");
    if (!panel) return;
    const bubbleLayer = panel.querySelector(".mouse-bubbles");

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (motionPreference.matches || !finePointer.matches) return;

    const visuals = Array.from(panel.querySelectorAll("[data-reactive]")).map(function (element, index) {
        return {
            element,
            kind: element.dataset.reactive,
            host: element.closest(".event-object") || element,
            near: false,
            cameraLocked: false,
            flashTimer: 0,
            phase: index * 1.73,
            centerX: 0,
            centerY: 0,
            x: 0,
            y: 0,
            tiltX: 0,
            tiltY: 0,
            rotation: 0,
            scale: 1
        };
    });
    let frame = 0;
    let panelBounds = null;
    let pointer = null;
    let lastFrame = 0;
    let lastBubbleX = null;
    let lastBubbleY = null;
    let lastBubbleAt = 0;
    const bubbles = new Set();
    const bubbleColors = ["255,255,255", "234,244,232", "168,201,165"];
    const bubbleLimit = 38;

    function updatePositions() {
        pointer = null;
        panelBounds = panel.getBoundingClientRect();
        visuals.forEach(function (visual) {
            const bounds = visual.element.getBoundingClientRect();
            visual.centerX = bounds.left - panelBounds.left + bounds.width / 2;
            visual.centerY = bounds.top - panelBounds.top + bounds.height / 2;
        });
    }

    function animate(now) {
        const elapsed = lastFrame ? Math.min(now - lastFrame, 48) : 16;
        lastFrame = now;
        const easing = 1 - Math.exp(-elapsed / 135);
        let interactionActive = false;
        visuals.forEach(function (visual) {
            let targetX = 0;
            let targetY = 0;
            let targetTiltX = 0;
            let targetTiltY = 0;
            let targetRotation = 0;
            let targetScale = 1;

            const dx = pointer ? pointer.x - visual.centerX : 0;
            const dy = pointer ? pointer.y - visual.centerY : 0;
            const distance = pointer ? Math.hypot(dx, dy) : Infinity;
            const radius = visual.kind === "logo" ? 168 : visual.kind === "heart" ? 106 : 148;
            const influence = Math.max(0, 1 - distance / radius);
            const wasNear = visual.near;
            visual.near = distance < radius + (wasNear ? 32 : 0);
            visual.element.classList.toggle("is-near", visual.near);
            if (visual.host !== visual.element) visual.host.classList.toggle("is-near", visual.near);

            if (visual.host.classList.contains("event-camera")) {
                if (visual.near && !visual.cameraLocked) {
                    visual.cameraLocked = true;
                    visual.host.classList.add("is-flashing");
                    visual.flashTimer = window.setTimeout(function () {
                        visual.host.classList.remove("is-flashing");
                        visual.flashTimer = 0;
                    }, 500);
                } else if (!visual.near) {
                    visual.cameraLocked = false;
                }
            }

            if (influence > 0) {
                const wiggle = Math.sin(now / 74 + visual.phase);
                const bounce = (Math.sin(now / 112 + visual.phase * 1.4) + 1) / 2;
                const strength = visual.kind === "logo" ? .42 : visual.kind === "heart" ? .7 : 1;
                const movement = visual.kind === "logo" ? 1.1 : visual.kind === "heart" ? 1.8 : 3.1;
                const rotation = visual.kind === "logo" ? 1 : visual.kind === "heart" ? 2.4 : 5.2;
                const tilt = visual.kind === "logo" ? 1 : visual.kind === "heart" ? 2.5 : 4.2;
                targetX = wiggle * movement * influence * strength;
                targetY = -bounce * (visual.kind === "logo" ? .55 : 1.8) * influence * strength;
                targetTiltX = Math.max(-tilt, Math.min(tilt, -dy / radius * tilt)) * influence * strength;
                targetTiltY = Math.max(-tilt, Math.min(tilt, dx / radius * tilt)) * influence * strength;
                targetRotation = wiggle * rotation * influence * strength;
                targetScale = 1 + .022 * influence * strength;
                interactionActive = true;
            }

            visual.x += (targetX - visual.x) * easing;
            visual.y += (targetY - visual.y) * easing;
            visual.tiltX += (targetTiltX - visual.tiltX) * easing;
            visual.tiltY += (targetTiltY - visual.tiltY) * easing;
            visual.rotation += (targetRotation - visual.rotation) * easing;
            visual.scale += (targetScale - visual.scale) * easing;

            visual.element.style.setProperty("--pointer-x", visual.x.toFixed(2) + "px");
            visual.element.style.setProperty("--pointer-y", visual.y.toFixed(2) + "px");
            visual.element.style.setProperty("--pointer-tilt-x", visual.tiltX.toFixed(2) + "deg");
            visual.element.style.setProperty("--pointer-tilt-y", visual.tiltY.toFixed(2) + "deg");
            visual.element.style.setProperty("--pointer-rotation", visual.rotation.toFixed(2) + "deg");
            visual.element.style.setProperty("--pointer-scale", visual.scale.toFixed(4));

            if (Math.abs(targetX - visual.x) > .04 || Math.abs(targetY - visual.y) > .04 ||
                Math.abs(targetTiltX - visual.tiltX) > .04 || Math.abs(targetTiltY - visual.tiltY) > .04 ||
                Math.abs(targetRotation - visual.rotation) > .04 || Math.abs(targetScale - visual.scale) > .001) {
                interactionActive = true;
            }
        });

        frame = interactionActive ? window.requestAnimationFrame(animate) : 0;
    }

    function requestAnimation() {
        if (!frame) frame = window.requestAnimationFrame(animate);
    }

    function createBubble(x, y, now) {
        if (!bubbleLayer || motionPreference.matches) return;
        while (bubbles.size >= bubbleLimit) {
            const oldest = bubbles.values().next().value;
            if (!oldest) break;
            bubbles.delete(oldest);
            oldest.remove();
        }

        const bubble = document.createElement("span");
        const size = 6 + Math.random() * 8;
        bubble.className = "mouse-bubble";
        bubble.style.left = (x - size / 2) + "px";
        bubble.style.top = (y - size / 2) + "px";
        bubble.style.setProperty("--bubble-size", size.toFixed(1) + "px");
        bubble.style.setProperty("--bubble-duration", (1.15 + Math.random() * .8).toFixed(2) + "s");
        bubble.style.setProperty("--bubble-drift", ((Math.random() - .5) * 26).toFixed(1) + "px");
        bubble.style.setProperty("--bubble-color", bubbleColors[Math.floor(Math.random() * bubbleColors.length)]);
        bubbleLayer.appendChild(bubble);
        bubbles.add(bubble);
        bubble.addEventListener("animationend", function () {
            bubbles.delete(bubble);
            bubble.remove();
        }, { once: true });
        lastBubbleAt = now;
    }

    function spawnMouseBubbles(x, y, now) {
        if (!bubbleLayer || motionPreference.matches) return;
        if (lastBubbleX === null) {
            lastBubbleX = x;
            lastBubbleY = y;
            createBubble(x, y, now);
            return;
        }

        const distance = Math.hypot(x - lastBubbleX, y - lastBubbleY);
        if (distance < 17 || now - lastBubbleAt < 24) return;
        const steps = Math.min(6, Math.max(1, Math.floor(distance / 17)));
        for (let step = 1; step <= steps; step++) {
            const progress = step / steps;
            createBubble(lastBubbleX + (x - lastBubbleX) * progress, lastBubbleY + (y - lastBubbleY) * progress, now);
        }
        lastBubbleX = x;
        lastBubbleY = y;
    }

    function trackPointer(event) {
        const x = event.clientX - panelBounds.left;
        const y = event.clientY - panelBounds.top;
        pointer = { x, y };
        if (event.pointerType !== "touch") spawnMouseBubbles(x, y, performance.now());
        requestAnimation();
    }

    function clearPointer() {
        pointer = null;
        lastBubbleX = null;
        lastBubbleY = null;
        requestAnimation();
    }

    function handleMotionPreference() {
        if (!motionPreference.matches) return;
        pointer = null;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        lastBubbleX = null;
        lastBubbleY = null;
        bubbles.forEach(function (bubble) { bubble.remove(); });
        bubbles.clear();
        visuals.forEach(function (visual) {
            if (visual.flashTimer) window.clearTimeout(visual.flashTimer);
            visual.flashTimer = 0;
            visual.near = false;
            visual.cameraLocked = false;
            visual.host.classList.remove("is-near", "is-flashing");
            ["--pointer-x", "--pointer-y", "--pointer-tilt-x", "--pointer-tilt-y", "--pointer-rotation", "--pointer-scale"]
                .forEach(function (property) { visual.element.style.removeProperty(property); });
        });
    }

    updatePositions();
    panel.addEventListener("pointermove", trackPointer, { passive: true });
    panel.addEventListener("pointerleave", clearPointer, { passive: true });
    window.addEventListener("resize", updatePositions, { passive: true });
    motionPreference.addEventListener("change", handleMotionPreference);
    window.addEventListener("pagehide", function cleanup() {
        panel.removeEventListener("pointermove", trackPointer);
        panel.removeEventListener("pointerleave", clearPointer);
        window.removeEventListener("resize", updatePositions);
        motionPreference.removeEventListener("change", handleMotionPreference);
        if (frame) window.cancelAnimationFrame(frame);
        bubbles.forEach(function (bubble) { bubble.remove(); });
        bubbles.clear();
        visuals.forEach(function (visual) {
            if (visual.flashTimer) window.clearTimeout(visual.flashTimer);
            visual.host.classList.remove("is-near", "is-flashing");
            ["--pointer-x", "--pointer-y", "--pointer-tilt-x", "--pointer-tilt-y", "--pointer-rotation", "--pointer-scale"]
                .forEach(function (property) { visual.element.style.removeProperty(property); });
        });
    }, { once: true });
})();
