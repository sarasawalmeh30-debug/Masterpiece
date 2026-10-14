(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Projects.html");
            return;
        }
    } catch (e) { /* allow local preview when browser storage is unavailable */ }

    const $ = (selector, root = document) => root.querySelector(selector);
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const fmt = value => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const date = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
    const stamp = value => value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not available";
    const FOLLOW_KEY = "teamlyAdminFollowedProjects";
    const modal = $("#projectModal"), modalBody = $("#projectModalBody");
    let data;
    let followed = readFollowed();

    function readFollowed() {
        try {
            const value = JSON.parse(localStorage.getItem(FOLLOW_KEY) || "[]");
            return new Set(Array.isArray(value) ? value : []);
        } catch (e) { return new Set(); }
    }
    function saveFollowed() {
        try { localStorage.setItem(FOLLOW_KEY, JSON.stringify(Array.from(followed))); return true; }
        catch (e) { return false; }
    }
    function projectRecords(project) {
        return {
            requests: data.requests.filter(item => item.projectId === project.id || item.project === project.name),
            transactions: data.transactions.filter(item => item.projectId === project.id || item.project === project.name)
        };
    }
    function findClient(project) {
        return data.clients.find(client => client.id === project.clientId || client.name === project.client) || null;
    }
    function findProvider(project) {
        return data.providers.find(provider => provider.id === project.providerId || provider.name === project.provider) || null;
    }
    function statusMarkup(status) {
        const value = ["active", "pending", "completed", "cancelled"].includes(status) ? status : "pending";
        return `<span class="project-status ${value}">${esc(value[0].toUpperCase() + value.slice(1))}</span>`;
    }
    function renderStats() {
        const active = data.projects.filter(project => project.status === "active").length;
        const pending = data.projects.filter(project => project.status === "pending").length;
        const totalBudget = data.projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
        $("#projectsStats").innerHTML = [
            ["All projects", data.projects.length], ["Active", active], ["Pending", pending], ["Followed", followed.size]
        ].map(([label, value]) => `<article class="project-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
        $("#projectsStats").setAttribute("aria-label", `Project summary. Total listed budget ${fmt(totalBudget)} JOD.`);
    }
    function renderTable() {
        const query = $("#projectSearch").value.trim().toLowerCase();
        const status = $("#projectStatusFilter").value;
        const onlyFollowed = $("#followedOnly").checked;
        const projects = data.projects.filter(project => {
            const client = findClient(project), provider = findProvider(project);
            const text = `${project.name} ${project.id} ${project.client || ""} ${client && client.email || ""} ${project.provider || ""} ${(project.services || []).join(" ")}`.toLowerCase();
            return (!query || text.includes(query)) && (status === "all" || project.status === status) && (!onlyFollowed || followed.has(project.id));
        }).sort((a, b) => Date.parse(b.created || 0) - Date.parse(a.created || 0));
        $("#projectsTableBody").innerHTML = projects.length ? projects.map(project => {
            const tracked = followed.has(project.id);
            return `<tr>
                <td><div class="project-name"><span class="project-icon"><i class="fa fa-calendar-check-o" aria-hidden="true"></i></span><span>${esc(project.name)}<small class="project-sub">${esc(project.id)} · ${(project.services || []).map(esc).join(", ") || "Service not listed"}</small></span></div></td>
                <td>${esc(project.client || "Not available")}</td><td>${esc(project.provider || "Not available")}</td><td>${esc(date(project.created))}</td><td>${fmt(project.budget)} JOD</td><td>${statusMarkup(project.status)}</td>
                <td><div class="project-actions"><button class="project-action primary" type="button" data-project-details="${esc(project.id)}">Details</button><button class="project-action ${tracked ? "is-following" : ""}" type="button" data-project-follow="${esc(project.id)}" aria-pressed="${tracked}"><i class="fa ${tracked ? "fa-star" : "fa-star-o"}" aria-hidden="true"></i>${tracked ? "Following" : "Follow"}</button></div></td>
            </tr>`;
        }).join("") : `<tr><td colspan="7"><div class="projects-empty">No projects match these filters.</div></td></tr>`;
        $("#projectsCount").textContent = `Showing ${projects.length} of ${data.projects.length} projects · ${followed.size} followed`;
    }
    function fact(label, value) {
        return `<div><dt>${esc(label)}</dt><dd>${esc(value == null || value === "" ? "Not available" : value)}</dd></div>`;
    }
    function table(headers, records, columns, emptyText) {
        const body = records.length ? records.map(record => `<tr>${columns.map(column => `<td>${esc(column(record))}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">${esc(emptyText)}</td></tr>`;
        return `<div class="project-detail-table-wrap"><table class="project-detail-table"><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
    }
    function renderDetail(project) {
        const client = findClient(project), provider = findProvider(project), records = projectRecords(project);
        const paid = records.transactions.filter(item => item.status === "successful").reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const followedNow = followed.has(project.id);
        const requestsTable = table(["Request", "Provider", "Service", "Status", "Date"], records.requests,
            [item => item.id, item => item.provider, item => item.service, item => item.status, item => stamp(item.created)], "No requests recorded for this project.");
        const paymentsTable = table(["Transaction", "Payer", "Amount", "Status", "Method", "Date"], records.transactions,
            [item => item.id, item => item.payer, item => `${fmt(item.amount)} JOD`, item => item.status, item => item.method, item => stamp(item.created)], "No payments recorded for this project.");
        const events = [
            { date: project.created, label: "Project created", details: project.name },
            ...records.requests.map(item => ({ date: item.created, label: `Request ${item.status}`, details: `${item.id} · ${item.provider || "Provider not recorded"}` })),
            ...records.transactions.map(item => ({ date: item.created, label: `Payment ${item.status}`, details: `${item.id} · ${fmt(item.amount)} JOD` }))
        ].sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0));
        const activityTable = table(["Date and time", "Activity", "Details"], events,
            [item => stamp(item.date), item => item.label, item => item.details], "No activity recorded.");

        $("#projectModalTitle").textContent = project.name;
        modalBody.innerHTML = `<div class="project-detail-content">
            <div class="project-detail-top">
                <div class="project-metric"><span>Requests</span><strong>${records.requests.length}</strong></div>
                <div class="project-metric"><span>Transactions</span><strong>${records.transactions.length}</strong></div>
                <div class="project-metric"><span>Successful payments</span><strong>${fmt(paid)} JOD</strong></div>
                <div class="project-metric"><span>Budget</span><strong>${fmt(project.budget)} JOD</strong></div>
            </div>
            <section class="project-section"><h3>Project details</h3><dl class="project-facts">${fact("Project ID", project.id)}${fact("Name", project.name)}${fact("Status", project.status)}${fact("Created", stamp(project.created))}${fact("Budget", `${fmt(project.budget)} JOD`)}${fact("Services", (project.services || []).join(", "))}${fact("Client", project.client)}${fact("Client email", client && client.email || "Not stored in current record")}${fact("Client account", client ? client.id : "Not linked")}${fact("Provider", project.provider)}${fact("Provider type", provider ? provider.type : "Not available")}${fact("Provider email", provider && provider.email || "Not stored in current record")}</dl></section>
            <section class="project-section"><h3>Service requests</h3>${requestsTable}</section>
            <section class="project-section"><h3>Payments</h3><p class="project-note">Successful payments total ${fmt(paid)} JOD.</p>${paymentsTable}</section>
            <section class="project-section"><h3>Activity history</h3>${activityTable}</section>
            <div class="project-detail-actions"><button type="button" class="project-action" data-project-modal-close>Close</button><button type="button" class="project-action ${followedNow ? "is-following" : "primary"}" data-project-follow="${esc(project.id)}" aria-pressed="${followedNow}"><i class="fa ${followedNow ? "fa-star" : "fa-star-o"}" aria-hidden="true"></i>${followedNow ? "Following" : "Follow project"}</button></div>
        </div>`;
        modal.hidden = false;
        $("#projectModalClose").focus();
    }
    function closeModal() { modal.hidden = true; modalBody.innerHTML = ""; }
    function toggleFollow(id) {
        const project = data.projects.find(item => item.id === id);
        if (!project) return;
        if (followed.has(id)) followed.delete(id); else followed.add(id);
        if (!saveFollowed()) {
            if (followed.has(id)) followed.delete(id); else followed.add(id);
            $("#projectsError").textContent = "Follow status could not be saved in this browser.";
            $("#projectsError").hidden = false;
            return;
        }
        $("#projectsError").hidden = true;
        renderStats(); renderTable();
        if (!modal.hidden && $("#projectModalTitle").textContent === project.name) renderDetail(project);
    }

    $("#projectSearch").addEventListener("input", renderTable);
    $("#projectStatusFilter").addEventListener("change", renderTable);
    $("#followedOnly").addEventListener("change", renderTable);
    $("#projectModalClose").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
    document.addEventListener("click", event => {
        const follow = event.target.closest("[data-project-follow]");
        if (follow) { toggleFollow(follow.dataset.projectFollow); return; }
        const detail = event.target.closest("[data-project-details]");
        if (detail) { const project = data.projects.find(item => item.id === detail.dataset.projectDetails); if (project) renderDetail(project); return; }
        if (event.target.closest("[data-project-modal-close]")) closeModal();
    });

    Promise.resolve().then(() => {
        if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") throw new Error("Admin data loader is unavailable.");
        return window.TEAMLY_ADMIN_DATA.load();
    }).then(result => {
        if (!result || !Array.isArray(result.projects) || !Array.isArray(result.clients) || !Array.isArray(result.providers) || !Array.isArray(result.requests) || !Array.isArray(result.transactions)) throw new Error("Project data is incomplete.");
        data = result;
        followed = new Set(Array.from(followed).filter(id => data.projects.some(project => project.id === id)));
        saveFollowed();
        const name = result.admin && result.admin.name || "Admin";
        $("#projectsAdminName").textContent = name;
        $("#projectsAdminAvatar").textContent = name.charAt(0).toUpperCase();
        window.TEAMLY_ADMIN_NAME = name;
        renderStats(); renderTable();
    }).catch(error => {
        console.error(error);
        $("#projectsError").textContent = "Project records could not be loaded. Check that this page is running through the project server and that Admin_data.js loaded.";
        $("#projectsError").hidden = false;
    });
})();
