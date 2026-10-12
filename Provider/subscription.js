(() => {
    "use strict";

    const PLAN_NAMES = {
        free: "Free",
        professional: "Professional",
        business: "Business"
    };
    const profile = readProviderProfile();
    const currentPlan = normalizePlan(profile);
    let selectedPlan = null;
    const onboarding = new URLSearchParams(window.location.search).get("onboarding") === "1"
        && window.sessionStorage.getItem("teamlyProviderOnboardingPending") === "true";

    if (onboarding) document.body.classList.add("provider-onboarding");

    function readProviderProfile() {
        try {
            const raw = window.localStorage.getItem("teamlyProviderProfile");
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function normalizePlan(provider) {
        if (!provider || typeof provider !== "object") return null;
        const rawPlan = provider.currentPlan || provider.subscriptionPlan || provider.plan;
        const value = rawPlan && typeof rawPlan === "object"
            ? rawPlan.id || rawPlan.name || rawPlan.code
            : rawPlan;
        if (typeof value !== "string") return null;
        const plan = value.trim().toLowerCase();
        if (["free", "starter", "basic"].includes(plan)) return "free";
        if (["professional", "pro", "professional plan"].includes(plan)) return "professional";
        if (["business", "business plan"].includes(plan)) return "business";
        return plan ? `unknown:${value.trim()}` : null;
    }

    function getRemainingFreeRequests(provider) {
        if (!provider || typeof provider !== "object") return null;
        const direct = provider.freeRequestsRemaining ?? provider.free_requests_remaining;
        if (Number.isInteger(direct) && direct >= 0) return direct;

        const limit = provider.freeRequestsLimit ?? provider.free_requests_limit;
        const used = provider.freeRequestsUsed ?? provider.free_requests_used;
        if (Number.isInteger(limit) && limit >= 0 && Number.isInteger(used) && used >= 0) {
            return Math.max(0, limit - used);
        }
        return null;
    }

    function renderAccountStatus() {
        renderPlanPrices();
        const remaining = getRemainingFreeRequests(profile);
        if (remaining !== null) {
            document.getElementById("free-request-count").textContent = `Free project requests remaining: ${remaining}`;
            document.getElementById("free-request-explanation").textContent = "A subscription is needed to continue receiving requests after your free allowance is used.";
        }

        const currentPlanLabel = document.getElementById("current-plan-label");
        if (currentPlan === null) {
            currentPlanLabel.textContent = "Current plan: unavailable";
        } else if (currentPlan.startsWith("unknown:")) {
            currentPlanLabel.textContent = `Current plan: ${currentPlan.slice(8)}`;
        } else {
            currentPlanLabel.textContent = `Current plan: ${PLAN_NAMES[currentPlan]}`;
            const badge = document.querySelector(`[data-current-badge="${currentPlan}"]`);
            if (badge) badge.hidden = false;
        }

        updatePlanButtons();
    }

    function renderPlanPrices() {
        const plans = window.TEAMLY_PROVIDER_PLANS;
        if (!plans) return;
        document.querySelectorAll("[data-plan-price]").forEach(element => {
            const plan = plans[element.dataset.planPrice];
            if (!plan) return;
            element.textContent = new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: plan.currency,
                minimumFractionDigits: plan.price % 1 ? 2 : 0
            }).format(plan.price);
        });
    }

    function updatePlanButtons() {
        document.querySelectorAll("[data-select-plan]").forEach(button => {
            const plan = button.dataset.selectPlan;
            const isCurrent = currentPlan === plan;
            const isSelected = selectedPlan === plan;
            button.disabled = isCurrent;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));

            if (isCurrent) button.textContent = "Current plan";
            else if (isSelected && plan === "professional") button.textContent = "Continue to payment";
            else if (isSelected) button.textContent = "Selected for review";
            else button.textContent = `Choose ${PLAN_NAMES[plan]}`;

            const card = button.closest(".plan-card");
            card.classList.toggle("is-current-plan", isCurrent);
            card.classList.toggle("is-selected-plan", isSelected);
        });
    }

    function selectPlan(plan) {
        if (!PLAN_NAMES[plan] || currentPlan === plan) return;

        selectedPlan = plan;
        updatePlanButtons();

        const feedback = document.getElementById("subscription-feedback");
        feedback.classList.remove("is-error");
        feedback.textContent = currentPlan
            ? `${PLAN_NAMES[plan]} is selected for review. Your current plan remains ${PLAN_NAMES[currentPlan] || currentPlan.slice(8)}. No subscription was changed and no payment was taken.`
            : `${PLAN_NAMES[plan]} is selected for review. Your current plan is unavailable, and this preview does not activate a subscription or take payment.`;
        feedback.hidden = false;
    }

    document.querySelectorAll("[data-select-plan]").forEach(button => {
        button.addEventListener("click", () => {
            const plan = button.dataset.selectPlan;
            if (onboarding && plan === "free") {
                chooseFreePlan();
                return;
            }
            if (["professional", "business"].includes(plan) && currentPlan !== plan) {
                const mode = onboarding ? "&onboarding=1" : "";
                window.location.href = `payment.html?plan=${encodeURIComponent(plan)}${mode}`;
                return;
            }
            selectPlan(plan);
        });
    });

    function chooseFreePlan() {
        const feedback = document.getElementById("subscription-feedback");
        if (!profile || typeof profile !== "object") {
            feedback.textContent = "Your provider profile could not be found. Please return to registration and try again.";
            feedback.classList.add("is-error");
            feedback.hidden = false;
            return;
        }
        try {
            const updatedProfile = { ...profile, currentPlan: "free" };
            window.localStorage.setItem("teamlyProviderProfile", JSON.stringify(updatedProfile));
            const savedProfile = JSON.parse(window.localStorage.getItem("teamlyProviderProfile") || "null");
            if (!savedProfile || savedProfile.currentPlan !== "free") throw new Error("Could not verify the selected plan.");
            window.sessionStorage.removeItem("teamlyProviderOnboardingPending");
            window.location.href = "requests.html";
        } catch (error) {
            feedback.textContent = "The free plan selection could not be saved in this browser. Please try again.";
            feedback.classList.add("is-error");
            feedback.hidden = false;
        }
    }

    renderAccountStatus();
})();
