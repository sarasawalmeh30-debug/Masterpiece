(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Requests.html");
            return;
        }
    } catch (error) { /* allow local preview when session storage is unavailable */ }

    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const statusLabels = { new: "New", pending: "Pending", accepted: "Accepted", rejected: "Rejected", expired: "Expired" };
    const dateLabel = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable";
    const search = document.getElementById("requestSearch");
    const status = document.getElementById("requestStatus");
    const body = document.getElementById("requestsBody");
    let allRequests = [];

    function renderStats() {
        const statuses = ["all", "new", "pending", "accepted", "rejected", "expired"];
        const labels = { all: "Total requests", new: "New", pending: "Pending", accepted: "Accepted", rejected: "Rejected", expired: "Expired" };
        document.getElementById("requestStats").innerHTML = statuses.map(key => `<div class="request-stat"><strong>${key === "all" ? allRequests.length : allRequests.filter(request => request.status === key).length}</strong><span>${labels[key]}</span></div>`).join("");
    }

    function render() {
        const query = search.value.trim().toLowerCase();
        const selectedStatus = status.value;
        const filtered = allRequests.filter(request => {
            const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
            const text = [request.id, request.project, request.client, request.provider, request.service, statusLabels[request.status] || request.status].join(" ").toLowerCase();
            return matchesStatus && (!query || text.includes(query));
        }).sort((a, b) => Date.parse(b.created || 0) - Date.parse(a.created || 0));

        document.getElementById("requestResultCount").textContent = `Showing ${filtered.length} of ${allRequests.length} requests`;
        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="6" class="requests-empty">No requests match these filters.</td></tr>';
            return;
        }
        body.innerHTML = filtered.map(request => {
            const requestStatus = statusLabels[request.status] || "Unknown";
            return `<tr><td><span class="request-id">${esc(request.id)}</span><span class="request-project">${esc(request.project || "Project not listed")}</span></td><td><div class="request-person"><span class="request-person-avatar">${esc((request.client || "C").trim().charAt(0).toUpperCase())}</span><span>${esc(request.client || "Client unavailable")}</span></div></td><td><div class="request-person"><span class="request-person-avatar">${esc((request.provider || "P").trim().charAt(0).toUpperCase())}</span><span>${esc(request.provider || "Provider unavailable")}</span></div></td><td><span class="request-service"><i class="fa fa-tag" aria-hidden="true"></i>${esc(request.service || "Not listed")}</span></td><td><span class="request-status ${esc(request.status)}">${esc(requestStatus)}</span></td><td><span class="request-date">${esc(dateLabel(request.created))}</span></td></tr>`;
        }).join("");
    }

    search.addEventListener("input", render);
    status.addEventListener("change", render);
    if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") {
        body.innerHTML = "";
        document.getElementById("requestsError").textContent = "Request data could not be loaded. Check that Admin_data.js is available.";
        document.getElementById("requestsError").hidden = false;
        return;
    }
    window.TEAMLY_ADMIN_DATA.load().then(data => {
        allRequests = Array.isArray(data.requests) ? data.requests : [];
        renderStats();
        render();
    }).catch(error => {
        console.error(error);
        body.innerHTML = "";
        document.getElementById("requestsError").textContent = "Request data could not be loaded. Please refresh and try again.";
        document.getElementById("requestsError").hidden = false;
    });
})();
