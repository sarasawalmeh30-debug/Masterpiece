(() => {
    "use strict";

    // Shared design fixtures. The current project has no provider request API/database.
    const DEMO_REQUESTS = window.TEAMLY_PROVIDER_DEMO_REQUESTS || [];

    const STATUS_KEY = "teamlyProviderRequestDemoStatuses";
    const FEEDBACK_KEY = "teamlyProviderCheckinDemo";
    const categories = {
        new: { title: "New Project Requests" },
        previous: { title: "Previous Requests" },
        expired: { title: "Expired Requests" }
    };
    let activeTab = "new";
    let selectedRequestId = null;
    let statuses = readStatusOverrides();
    const pendingActions = new Set();
    const requestList = document.getElementById("request-list");
    const emptyState = document.getElementById("empty-state");
    const feedbackMessage = document.getElementById("feedback-message");

    function readJSON(key) {
        try {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    }

    function readStatusOverrides() {
        const saved = readJSON(STATUS_KEY);
        return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    }

    function getRequests() {
        return DEMO_REQUESTS.map(request => ({
            ...request,
            status: statuses[request.id] || request.initialStatus
        }));
    }

    function readProviderProfile() {
        const profile = readJSON("teamlyProviderProfile");
        return profile && typeof profile === "object" ? profile : null;
    }

    function initializeProfile() {
        const profile = readProviderProfile();
        const name = profile && (profile.fullName || profile.name || profile.displayName);

        if (typeof name === "string" && name.trim()) {
            const firstName = name.trim().split(/\s+/)[0];
            document.getElementById("welcome-title").innerHTML = `Welcome, ${escapeHTML(firstName)}! <span aria-hidden="true">👋</span>`;
        }
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[character]);
    }

    function statusLabel(status) {
        return ({
            new: "New request",
            accepted: "Accepted",
            rejected: "Rejected",
            expired: "Expired"
        })[status] || "Request status unavailable";
    }

    function statusClass(status) {
        return ({
            new: "status-new",
            accepted: "status-accepted",
            rejected: "status-rejected",
            expired: "status-expired"
        })[status] || "status-expired";
    }

    function listForTab(tab) {
        return getRequests().filter(request => {
            if (tab === "new") return request.status === "new";
            if (tab === "previous") return request.status === "accepted" || request.status === "rejected";
            return request.status === "expired";
        });
    }

    function updateCounts() {
        document.getElementById("new-count").textContent = listForTab("new").length;
        document.getElementById("previous-count").textContent = listForTab("previous").length;
        document.getElementById("expired-count").textContent = listForTab("expired").length;
    }

    function renderCard(request) {
        const isNew = request.status === "new";
        return `
            <article class="request-card" tabindex="-1" data-request-id="${escapeHTML(request.id)}">
                <header class="request-card-head">
                    <div class="request-title-row">
                        <span class="service-icon"><i class="fa ${escapeHTML(request.serviceIcon)}" aria-hidden="true"></i></span>
                        <div>
                            <h3>${escapeHTML(request.title)}</h3>
                            <span class="service-name">${escapeHTML(request.service)}</span>
                        </div>
                    </div>
                    <span class="status-badge ${statusClass(request.status)}">${statusLabel(request.status)}</span>
                </header>
                <div class="request-card-body">
                    <dl class="request-facts">
                        <div><dt>Project name</dt><dd>${escapeHTML(request.project)}</dd></div>
                        <div><dt>Budget</dt><dd>${escapeHTML(request.budget)}</dd></div>
                        <div><dt>Location</dt><dd>${escapeHTML(request.location)}</dd></div>
                        <div><dt>Project date</dt><dd>${escapeHTML(request.date)}</dd></div>
                        <div><dt>Project time</dt><dd>${escapeHTML(request.time)}</dd></div>
                        <div><dt>Requested service</dt><dd>${escapeHTML(request.requestedService)}</dd></div>
                    </dl>
                    <p class="request-description"><strong>Client request</strong>${escapeHTML(request.description)}</p>
                </div>
                <footer class="request-card-footer">
                    <span class="request-meta"><i class="fa fa-clock-o" aria-hidden="true"></i> ${escapeHTML(request.created)}</span>
                    ${isNew ? `<div class="request-actions">
                        <button class="action-button reject-button" type="button" data-action="reject" data-id="${escapeHTML(request.id)}"><i class="fa fa-times" aria-hidden="true"></i> Reject</button>
                        <button class="action-button accept-button" type="button" data-action="accept" data-id="${escapeHTML(request.id)}"><i class="fa fa-check" aria-hidden="true"></i> Accept</button>
                    </div>` : ""}
                </footer>
                <p class="request-feedback" data-feedback-for="${escapeHTML(request.id)}" role="status" aria-live="polite"></p>
            </article>`;
    }

    function renderOverview(request) {
        document.getElementById("panel-status").className = `status-badge ${statusClass(request.status)}`;
        document.getElementById("panel-status").textContent = statusLabel(request.status);
        document.getElementById("panel-project").textContent = request.project;
        document.getElementById("panel-location").textContent = request.location;
        document.getElementById("panel-budget").textContent = request.budget;
        document.getElementById("panel-deadline").textContent = request.deadline || "Not provided";
    }

    function renderList() {
        const config = categories[activeTab];
        document.getElementById("list-title").textContent = config.title;
        const requests = listForTab(activeTab);
        requestList.innerHTML = requests.map(renderCard).join("");
        emptyState.hidden = requests.length > 0;

        document.querySelectorAll(".request-tab").forEach(tab => {
            const isActive = tab.dataset.tab === activeTab;
            tab.classList.toggle("is-active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });
        document.getElementById("requests-panel").setAttribute("aria-labelledby", `tab-${activeTab}`);

        let selected = requests.find(request => request.id === selectedRequestId);
        if (!selected) selected = requests[0] || null;
        selectedRequestId = selected ? selected.id : null;
        if (selected) renderOverview(selected);
        else {
            document.getElementById("panel-status").className = "status-badge status-expired";
            document.getElementById("panel-status").textContent = "No request selected";
            ["panel-project", "panel-location", "panel-budget", "panel-deadline"].forEach(id => {
                document.getElementById(id).textContent = "—";
            });
        }
        updateCounts();
    }

    function setActionFeedback(requestId, message, state) {
        const feedback = requestList.querySelector(`[data-feedback-for="${CSS.escape(requestId)}"]`);
        if (!feedback) return;
        feedback.textContent = message;
        feedback.classList.toggle("is-error", state === "error");
        feedback.classList.toggle("is-success", state === "success");
    }

    function announceAction(message, state) {
        const announcement = document.getElementById("action-announcement");
        announcement.textContent = message;
        announcement.hidden = false;
        announcement.classList.toggle("is-error", state === "error");
    }

    function processRequest(requestId, action) {
        const request = getRequests().find(item => item.id === requestId);
        if (!request || request.status !== "new" || pendingActions.has(requestId)) return;

        pendingActions.add(requestId);
        const card = requestList.querySelector(`[data-request-id="${CSS.escape(requestId)}"]`);
        const buttons = card ? card.querySelectorAll(".action-button") : [];
        buttons.forEach(button => {
            button.disabled = true;
            button.textContent = "Processing…";
        });

        window.setTimeout(() => {
            try {
                const nextStatuses = { ...statuses, [requestId]: action === "accept" ? "accepted" : "rejected" };
                window.localStorage.setItem(STATUS_KEY, JSON.stringify(nextStatuses));
                const saved = JSON.parse(window.localStorage.getItem(STATUS_KEY) || "{}");
                if (saved[requestId] !== nextStatuses[requestId]) throw new Error("The demo update could not be verified.");

                statuses = nextStatuses;
                pendingActions.delete(requestId);
                renderList();
                const message = action === "accept"
                    ? "Request accepted in this browser's preview. No client notification was sent."
                    : "Request rejected in this browser's preview. No client notification was sent.";
                announceAction(message, "success");
                setActionFeedback(requestId, message, "success");
            } catch (error) {
                pendingActions.delete(requestId);
                if (card) card.querySelectorAll(".action-button").forEach(button => { button.disabled = false; });
                announceAction("Could not save this preview update. Please try again.", "error");
                setActionFeedback(requestId, "Could not save this preview update. Please try again.", "error");
            }
        }, 180);
    }

    function handleTabKeydown(event) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const tabs = [...document.querySelectorAll(".request-tab")];
        const currentIndex = tabs.findIndex(tab => tab.dataset.tab === activeTab);
        const nextIndex = event.key === "Home" ? 0
            : event.key === "End" ? tabs.length - 1
            : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        event.preventDefault();
        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex].dataset.tab);
    }

    function activateTab(tab) {
        if (!categories[tab]) return;
        activeTab = tab;
        selectedRequestId = null;
        renderList();
    }

    document.querySelectorAll(".request-tab").forEach(tab => {
        tab.addEventListener("click", () => activateTab(tab.dataset.tab));
        tab.addEventListener("keydown", handleTabKeydown);
    });

    requestList.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        processRequest(button.dataset.id, button.dataset.action);
    });

    document.querySelectorAll(".feedback-option").forEach(button => {
        button.addEventListener("click", () => {
            const choice = button.dataset.feedback;
            if (choice === "help") {
                window.location.href = "../needHelp/Help.html";
                return;
            }

            document.querySelectorAll(".feedback-option").forEach(option => {
                const selected = option === button;
                option.classList.toggle("is-selected", selected);
                option.setAttribute("aria-pressed", String(selected));
            });

            let saved = false;
            try {
                window.localStorage.setItem(FEEDBACK_KEY, choice);
                saved = window.localStorage.getItem(FEEDBACK_KEY) === choice;
                if (saved) {
                    try {
                        const history = readJSON("teamlyAdminNotifications");
                        const notifications = Array.isArray(history) ? history : [];
                        const provider = readProviderProfile();
                        notifications.unshift({
                            id: `feedback-${Date.now()}`,
                            kind: "feedback",
                            title: "Provider gave feedback",
                            actor: provider && (provider.fullName || provider.name) || "Provider",
                            detail: choice === "going-well" ? "Everything is going well." : "The provider raised a concern.",
                            timestamp: new Date().toISOString()
                        });
                        window.localStorage.setItem("teamlyAdminNotifications", JSON.stringify(notifications.slice(0, 500)));
                    } catch (notificationError) { /* feedback can still be shown when activity logging fails */ }
                }
            } catch (error) {
                saved = false;
            }
            feedbackMessage.textContent = saved
                ? "Check-in saved on this device only. It is not connected to a project feedback service."
                : "Your selection is shown here, but could not be saved on this device.";
        });
    });

    function openRequestedItem() {
        const requestedId = new URLSearchParams(window.location.search).get("requestId");
        const requested = requestedId && getRequests().find(request => request.id === requestedId);
        if (!requested) {
            renderList();
            return;
        }

        activeTab = requested.status === "expired" ? "expired"
            : requested.status === "accepted" || requested.status === "rejected" ? "previous" : "new";
        selectedRequestId = requested.id;
        renderList();
        window.requestAnimationFrame(() => {
            const target = requestList.querySelector(`[data-request-id="${CSS.escape(requested.id)}"]`);
            if (!target) return;
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.focus({ preventScroll: true });
            target.classList.add("is-request-target");
        });
    }

    initializeProfile();
    openRequestedItem();
})();
