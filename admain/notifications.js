(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Notifications.html");
            return;
        }
    } catch (e) { /* allow local preview if session storage is unavailable */ }

    const $ = selector => document.querySelector(selector);
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const timestamp = value => {
        const time = Date.parse(value || "");
        return Number.isFinite(time) ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(time) : "Time unavailable";
    };
    const EVENT_KEY = "teamlyAdminNotifications";
    const READ_KEY = "teamlyAdminNotificationRead";
    let events = [];
    let read = new Set();

    function readArray(key) {
        try {
            const result = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(result) ? result : [];
        } catch (e) { return []; }
    }
    function persistRead() {
        try { localStorage.setItem(READ_KEY, JSON.stringify(Array.from(read))); return true; }
        catch (e) { return false; }
    }
    function deriveLegacyRegistrations(data) {
        const notices = [];
        (data.clients || []).filter(client => String(client.id).startsWith("client-")).forEach(client => {
            notices.push({ id: `signup-${client.id}`, kind: "registration", title: "Client registered", actor: client.name, detail: `New client account created${client.email ? ` (${client.email})` : ""}.`, timestamp: client.created });
        });
        try {
            const profile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
            const actor = profile && (profile.fullName || profile.name);
            if (actor && profile.email && !notices.some(item => item.actor.toLowerCase() === actor.toLowerCase())) {
                notices.push({ id: `provider-signup-${profile.email.toLowerCase()}`, kind: "registration", title: "Provider registered", actor, detail: `Provider account created${profile.service ? ` for ${profile.service}` : ""}.`, timestamp: profile.created || profile.registeredAt || null });
            }
        } catch (e) { /* ignore malformed locally saved profile */ }
        return notices;
    }
    function deriveLegacyFeedback() {
        try {
            const choice = localStorage.getItem("teamlyProviderCheckinDemo");
            if (!["going-well", "concern"].includes(choice)) return [];
            const profile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
            return [{
                id: `legacy-feedback-${choice}`,
                kind: "feedback",
                title: "Provider gave feedback",
                actor: profile && (profile.fullName || profile.name) || "Provider",
                detail: choice === "going-well" ? "Everything is going well." : "The provider raised a concern.",
                timestamp: null
            }];
        } catch (e) { return []; }
    }
    function normalizeEvent(event) {
        if (!event || typeof event !== "object") return null;
        const kind = ["registration", "feedback", "zoom"].includes(event.kind) ? event.kind : "activity";
        return {
            id: String(event.id || `${kind}-${event.timestamp || Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
            kind,
            title: String(event.title || (kind === "registration" ? "New account registered" : kind === "feedback" ? "Feedback received" : kind === "zoom" ? "Zoom meeting requested" : "TEAMLY activity")),
            actor: String(event.actor || "TEAMLY user"),
            detail: String(event.detail || event.message || "Activity recorded."),
            timestamp: event.timestamp || event.createdAt || null
        };
    }
    function iconFor(kind) {
        return kind === "registration" ? "fa-user-plus" : kind === "feedback" ? "fa-commenting-o" : kind === "zoom" ? "fa-video-camera" : "fa-bell-o";
    }
    function kindLabel(kind) {
        return kind === "registration" ? "Registration" : kind === "feedback" ? "Feedback" : kind === "zoom" ? "Zoom request" : "Activity";
    }
    function renderStats() {
        const counts = {
            all: events.length,
            registration: events.filter(event => event.kind === "registration").length,
            feedback: events.filter(event => event.kind === "feedback").length,
            zoom: events.filter(event => event.kind === "zoom").length
        };
        $("#notificationStats").innerHTML = [
            ["All notifications", counts.all, "fa-bell-o"], ["Registrations", counts.registration, "fa-user-plus"],
            ["Feedback", counts.feedback, "fa-commenting-o"], ["Zoom requests", counts.zoom, "fa-video-camera"]
        ].map(([label, value, icon]) => `<article class="notification-stat"><span><i class="fa ${icon}" aria-hidden="true"></i>${esc(label)}</span><strong>${value}</strong></article>`).join("");
    }
    function renderList() {
        const query = $("#notificationSearch").value.trim().toLowerCase();
        const filter = $("#notificationFilter").value;
        const shown = events.filter(event => {
            const text = `${event.title} ${event.actor} ${event.detail}`.toLowerCase();
            return (filter === "all" || event.kind === filter) && (!query || text.includes(query));
        });
        $("#notificationList").innerHTML = shown.length ? shown.map(event => {
            const isUnread = !read.has(event.id);
            return `<article class="notification-item ${isUnread ? "is-unread" : ""}" data-kind="${esc(event.kind)}">
                <span class="notification-icon" aria-hidden="true"><i class="fa ${iconFor(event.kind)}"></i></span>
                <div class="notification-copy"><div class="notification-title-row"><h3>${esc(event.title)}</h3>${isUnread ? `<span class="unread-dot" title="Unread"></span>` : ""}</div>
                    <p><strong>${esc(event.actor)}</strong> · ${esc(event.detail)}</p>
                    <div class="notification-meta"><span><i class="fa fa-clock-o" aria-hidden="true"></i>${esc(timestamp(event.timestamp))}</span></div>
                </div>
                <div class="notification-item-actions"><span class="notification-type ${esc(event.kind)}">${esc(kindLabel(event.kind))}</span>${isUnread ? `<button class="read-one-button" type="button" data-read-notification="${esc(event.id)}">Mark read</button>` : `<span class="read-label">Read</span>`}</div>
            </article>`;
        }).join("") : `<p class="notification-empty">${events.length ? "No notifications match this filter." : "No activity has been recorded on this device yet."}</p>`;
        $("#notificationCount").textContent = `Showing ${shown.length} of ${events.length} notifications · ${events.filter(event => !read.has(event.id)).length} unread`;
        $("#markAllRead").disabled = events.every(event => read.has(event.id));
    }
    function markRead(id) {
        read.add(id);
        if (!persistRead()) {
            read.delete(id);
            $("#notificationsError").textContent = "Read status could not be saved in this browser.";
            $("#notificationsError").hidden = false;
            return;
        }
        $("#notificationsError").hidden = true;
        renderList();
    }
    function initialize(data) {
        const savedEvents = readArray(EVENT_KEY).map(normalizeEvent).filter(Boolean);
        const legacyFeedback = savedEvents.some(event => event && event.kind === "feedback") ? [] : deriveLegacyFeedback();
        const legacyRegistrations = deriveLegacyRegistrations(data).filter(legacy => !savedEvents.some(saved => saved && saved.kind === "registration" && String(saved.actor || "").toLowerCase() === String(legacy.actor || "").toLowerCase()));
        const combined = [...savedEvents, ...legacyRegistrations.map(normalizeEvent).filter(Boolean), ...legacyFeedback.map(normalizeEvent).filter(Boolean)];
        const byId = new Map();
        combined.forEach(event => { if (!byId.has(event.id)) byId.set(event.id, event); });
        events = Array.from(byId.values()).sort((a, b) => {
            const timeA = Date.parse(a.timestamp || ""), timeB = Date.parse(b.timestamp || "");
            if (!Number.isFinite(timeA)) return Number.isFinite(timeB) ? 1 : 0;
            if (!Number.isFinite(timeB)) return -1;
            return timeB - timeA;
        });
        read = new Set(readArray(READ_KEY).filter(id => events.some(event => event.id === id)));
        const name = data.admin && data.admin.name || "Admin";
        $("#notificationsAdminName").textContent = name;
        $("#notificationsAdminAvatar").textContent = name.charAt(0).toUpperCase();
        window.TEAMLY_ADMIN_NAME = name;
        renderStats();
        renderList();
    }

    $("#notificationSearch").addEventListener("input", renderList);
    $("#notificationFilter").addEventListener("change", renderList);
    $("#markAllRead").addEventListener("click", () => {
        read = new Set(events.map(event => event.id));
        if (!persistRead()) {
            read.clear();
            $("#notificationsError").textContent = "Read status could not be saved in this browser.";
            $("#notificationsError").hidden = false;
            return;
        }
        $("#notificationsError").hidden = true;
        renderList();
    });
    $("#notificationList").addEventListener("click", event => {
        const button = event.target.closest("[data-read-notification]");
        if (button) markRead(button.dataset.readNotification);
    });

    Promise.resolve().then(() => {
        if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") throw new Error("Admin data loader is unavailable.");
        return window.TEAMLY_ADMIN_DATA.load();
    }).then(data => {
        if (!data || !Array.isArray(data.clients)) throw new Error("Client account records are unavailable.");
        initialize(data);
    }).catch(error => {
        console.error(error);
        $("#notificationsError").textContent = "Notifications could not be loaded. Check that this page is running through the project server and Admin_data.js is available.";
        $("#notificationsError").hidden = false;
        $("#notificationList").innerHTML = `<p class="notification-empty">Activity feed could not be loaded.</p>`;
    });
})();
