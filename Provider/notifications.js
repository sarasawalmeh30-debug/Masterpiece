(() => {
    "use strict";

    const readJSON = key => {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    };
    const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
    const provider = readJSON("teamlyProviderProfile");
    const providerName = provider && (provider.fullName || provider.name || provider.displayName);
    if (typeof providerName === "string" && providerName.trim()) {
        const firstName = providerName.trim().split(/\s+/)[0];
        document.getElementById("welcome-title").innerHTML = `Welcome, ${escapeHTML(firstName)}! <span aria-hidden="true">\u{1F44B}</span>`;
    }

    const demoRequests = Array.isArray(window.TEAMLY_PROVIDER_DEMO_REQUESTS) ? window.TEAMLY_PROVIDER_DEMO_REQUESTS : [];
    const savedStatuses = readJSON("teamlyProviderRequestDemoStatuses");
    const statuses = savedStatuses && typeof savedStatuses === "object" && !Array.isArray(savedStatuses) ? savedStatuses : {};
    const request = demoRequests.map(item => ({ ...item, status: statuses[item.id] || item.initialStatus }))
        .find(item => item.status === "new");
    const isSampleRequest = Boolean(request);
    const chips = document.getElementById("request-chips");
    const viewButton = document.getElementById("view-request-button");

    function chip(icon, text, modifier = "") {
        return `<span class="request-chip ${modifier}"><i class="fa ${icon}" aria-hidden="true"></i>${escapeHTML(text)}</span>`;
    }
    function setPending(id, value) {
        document.getElementById(id).textContent = value || "Unavailable";
    }
    function expiryTime(item) {
        const value = item.expiresAt || item.expiryAt || item.responseDeadlineAt;
        if (!value) return null;
        const time = Date.parse(value);
        return Number.isFinite(time) ? time : null;
    }
    function updateCountdown(expiresAt) {
        const status = document.getElementById("pending-status");
        const output = document.getElementById("pending-time");
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
            status.textContent = "EXPIRED";
            output.textContent = "Expired";
            return;
        }
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        output.textContent = `${hours}h ${String(minutes).padStart(2, "0")}m remaining`;
    }

    if (request) {
        chips.innerHTML = [
            chip(request.serviceIcon || "fa-briefcase", `${request.project} \u00b7 ${request.service}`),
            chip("fa-map-marker", request.location),
            chip("fa-clock-o", request.deadline ? `Respond by ${request.deadline}` : "Response deadline unavailable", request.deadline ? "deadline-chip" : "")
        ].join("");
        viewButton.href = `requests.html?requestId=${encodeURIComponent(request.id)}`;
        document.getElementById("request-source-label").hidden = false;
        document.getElementById("pending-source-note").hidden = false;
        setPending("pending-project", request.project);
        setPending("pending-budget", request.budget);
        setPending("pending-location", request.location);
        setPending("pending-date", request.date);
        const expiry = expiryTime(request);
        if (expiry) {
            updateCountdown(expiry);
            window.setInterval(() => updateCountdown(expiry), 30000);
        } else {
            setPending("pending-time", request.deadline ? `By ${request.deadline}` : "Unavailable");
        }
    } else {
        document.getElementById("new-request-card").hidden = true;
        document.getElementById("request-unavailable").hidden = false;
        viewButton.setAttribute("aria-disabled", "true");
        viewButton.removeAttribute("href");
        document.getElementById("pending-status").textContent = "NO PENDING REQUEST";
    }

    function renderActivity(item, isSample) {
        const title = item.title || item.name || "Provider activity";
        const description = item.description || item.message || "";
        const timeValue = item.timestamp || item.createdAt || item.time;
        const parsed = timeValue ? Date.parse(timeValue) : NaN;
        const time = Number.isFinite(parsed) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed) : "Time unavailable";
        const icon = item.icon || (String(title).toLowerCase().includes("portfolio") ? "fa-picture-o" : "fa-user-o");
        const activity = document.createElement("article");
        activity.className = "recent-item";
        const iconNode = document.createElement("span");
        iconNode.className = "activity-icon";
        iconNode.setAttribute("aria-hidden", "true");
        iconNode.innerHTML = `<i class="fa ${escapeHTML(icon)}"></i>`;
        const copy = document.createElement("div");
        copy.className = "activity-copy";
        const heading = document.createElement("h3");
        heading.textContent = title;
        const detail = document.createElement("p");
        detail.textContent = description;
        copy.append(heading, detail);
        const timeNode = document.createElement("time");
        timeNode.className = "activity-time";
        if (Number.isFinite(parsed)) timeNode.dateTime = new Date(parsed).toISOString();
        timeNode.textContent = isSample ? "Sample activity \u00b7 time unavailable" : time;
        activity.append(iconNode, copy, timeNode);
        return activity;
    }

    const activityList = document.getElementById("recent-list");
    const realNotifications = readJSON("teamlyProviderNotifications");
    const validNotifications = Array.isArray(realNotifications)
        ? realNotifications.filter(item => item && typeof item === "object")
        : [];
    const hasRealNotifications = validNotifications.length > 0;
    if (hasRealNotifications) {
        validNotifications.slice(0, 6).forEach(item => activityList.append(renderActivity(item, false)));
    } else {
        document.getElementById("activity-source-label").hidden = false;
        [
            { title: "Your profile was updated", description: "Your provider profile information was saved.", icon: "fa-user-o" },
            { title: "Portfolio successfully uploaded", description: "Your project photos and videos are now visible.", icon: "fa-picture-o" }
        ].forEach(item => activityList.append(renderActivity(item, true)));
    }
    document.getElementById("empty-recent").hidden = activityList.childElementCount > 0;
})();
