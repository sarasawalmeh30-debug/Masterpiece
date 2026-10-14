(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Clients.html");
            return;
        }
    } catch (e) { /* keep the preview usable if storage is unavailable */ }

    const $ = (selector, root = document) => root.querySelector(selector);
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const fmt = value => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const date = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
    const timestamp = value => value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not available";
    const EDIT_KEY = "teamlyAdminClientEdits";
    const modal = $("#clientModal"), modalBody = $("#clientModalBody");
    let data = null;

    const readEdits = () => {
        try { return JSON.parse(localStorage.getItem(EDIT_KEY) || "{}"); }
        catch (e) { return {}; }
    };
    function projectsFor(client) {
        return data.projects.filter(project => project.clientId === client.id || project.client === client.name);
    }
    function relatedRecords(client) {
        const projects = projectsFor(client), ids = new Set(projects.map(project => project.id));
        return {
            projects,
            requests: data.requests.filter(request => ids.has(request.projectId) || request.client === client.name),
            transactions: data.transactions.filter(transaction => ids.has(transaction.projectId) || transaction.payer === client.name)
        };
    }
    function paidTotal(transactions) {
        return transactions.filter(transaction => transaction.status === "successful").reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    }
    function statusMarkup(status) {
        const clean = ["active", "inactive", "pending"].includes(status) ? status : "active";
        return `<span class="client-status ${clean}">${esc(clean[0].toUpperCase() + clean.slice(1))}</span>`;
    }
    function renderStats() {
        const active = data.clients.filter(client => client.status === "active").length;
        const projects = data.projects.filter(project => data.clients.some(client => client.id === project.clientId)).length;
        const collected = data.transactions.filter(transaction => transaction.status === "successful").reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
        $("#clientsStats").innerHTML = [
            ["All clients", data.clients.length], ["Active accounts", active], ["Client projects", projects], ["Successful payments", `${fmt(collected)} JOD`]
        ].map(([label, value]) => `<article class="client-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
    }
    function renderTable() {
        const query = $("#clientSearch").value.trim().toLowerCase();
        const status = $("#clientStatusFilter").value;
        const clients = data.clients.filter(client => {
            const text = `${client.name} ${client.id} ${client.email || ""}`.toLowerCase();
            return (!query || text.includes(query)) && (status === "all" || client.status === status);
        }).sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
        $("#clientsTableBody").innerHTML = clients.length ? clients.map(client => {
            const records = relatedRecords(client), initials = client.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
            return `<tr>
                <td><div class="client-name"><span class="client-avatar">${esc(initials || "C")}</span><span>${esc(client.name)}<small class="client-id">${esc(client.id)}${client.email ? ` · ${esc(client.email)}` : ""}</small></span></div></td>
                <td>${esc(date(client.created))}</td><td>${records.projects.length}</td><td>${records.requests.length}</td>
                <td>${fmt(paidTotal(records.transactions))} JOD</td><td>${statusMarkup(client.status)}</td>
                <td><div class="client-actions"><button class="client-action primary" type="button" data-client-details="${esc(client.id)}">Details</button><button class="client-action" type="button" data-client-edit="${esc(client.id)}">Edit</button></div></td>
            </tr>`;
        }).join("") : `<tr><td colspan="7"><div class="clients-empty">No clients match this search.</div></td></tr>`;
        $("#clientsCount").textContent = `Showing ${clients.length} of ${data.clients.length} client accounts`;
    }
    function fact(label, value) {
        return `<div><dt>${esc(label)}</dt><dd>${esc(value || "Not available")}</dd></div>`;
    }
    function renderDetail(client) {
        const related = relatedRecords(client), paid = paidTotal(related.transactions);
        const projectRows = related.projects.length ? related.projects.map(project => `<tr><td>${esc(project.name)}</td><td>${esc(project.provider || "Not available")}</td><td>${esc((project.services || []).join(", ") || "Not available")}</td><td>${esc(date(project.created))}</td><td>${esc(project.status)}</td><td>${fmt(project.budget)} JOD</td></tr>`).join("") : `<tr><td colspan="6">No project records for this client.</td></tr>`;
        const requestRows = related.requests.length ? related.requests.map(request => `<tr><td>${esc(request.id)}</td><td>${esc(request.project)}</td><td>${esc(request.provider)}</td><td>${esc(request.service)}</td><td>${esc(request.status)}</td><td>${esc(timestamp(request.created))}</td></tr>`).join("") : `<tr><td colspan="6">No request records for this client.</td></tr>`;
        const transactionRows = related.transactions.length ? related.transactions.map(transaction => `<tr><td>${esc(transaction.id)}</td><td>${esc(transaction.project)}</td><td>${fmt(transaction.amount)} JOD</td><td>${esc(transaction.status)}</td><td>${esc(transaction.method || "Not available")}</td><td>${esc(timestamp(transaction.created))}</td></tr>`).join("") : `<tr><td colspan="6">No payment records for this client.</td></tr>`;
        const activity = [
            { at: client.created, event: "Client registered", detail: client.name },
            ...related.projects.map(project => ({ at: project.created, event: "Project created", detail: `${project.name} · ${project.provider || "Provider not recorded"}` })),
            ...related.requests.map(request => ({ at: request.created, event: `Request ${request.status}`, detail: `${request.id} · ${request.project}` })),
            ...related.transactions.map(transaction => ({ at: transaction.created, event: `Payment ${transaction.status}`, detail: `${transaction.id} · ${fmt(transaction.amount)} JOD` }))
        ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
        const activityRows = activity.map(item => `<tr><td>${esc(timestamp(item.at))}</td><td>${esc(item.event)}</td><td>${esc(item.detail)}</td></tr>`).join("");
        $("#clientModalTitle").textContent = client.name;
        modalBody.innerHTML = `<div class="client-detail-content">
            <div class="client-detail-top">
                <div class="detail-metric"><span>Projects</span><strong>${related.projects.length}</strong></div>
                <div class="detail-metric"><span>Requests</span><strong>${related.requests.length}</strong></div>
                <div class="detail-metric"><span>Successful payments</span><strong>${fmt(paid)} JOD</strong></div>
                <div class="detail-metric"><span>Payment transactions</span><strong>${related.transactions.length}</strong></div>
            </div>
            <section class="detail-section"><h3>Client profile</h3><dl class="detail-facts">${fact("Account ID", client.id)}${fact("Name", client.name)}${fact("Email", client.email || "Not stored in current record")}${fact("Status", client.status)}${fact("Registered", timestamp(client.created))}${fact("Last activity", activity.length ? timestamp(activity[0].at) : "No activity")}</dl></section>
            <section class="detail-section"><h3>Projects and providers</h3><div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>Project</th><th>Provider / team</th><th>Services</th><th>Created</th><th>Status</th><th>Budget</th></tr></thead><tbody>${projectRows}</tbody></table></div></section>
            <section class="detail-section"><h3>Service requests</h3><div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>Request</th><th>Project</th><th>Provider</th><th>Service</th><th>Status</th><th>Date</th></tr></thead><tbody>${requestRows}</tbody></table></div></section>
            <section class="detail-section"><h3>Payments</h3><p class="detail-not-tracked">Total paid counts successful transactions only. Pending, failed and refunded transactions are listed separately below.</p><div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>Transaction</th><th>Project</th><th>Amount</th><th>Status</th><th>Method</th><th>Date</th></tr></thead><tbody>${transactionRows}</tbody></table></div></section>
            <section class="detail-section"><h3>Feedback, meetings and other activity</h3><dl class="detail-facts">${fact("Client feedback", "Not tracked in current data")}${fact("Zoom meetings", "Not tracked in current data")}${fact("Project partners", related.projects.map(project => project.provider).filter(Boolean).filter((name, index, all) => all.indexOf(name) === index).join(", ") || "No provider team recorded")}</dl></section>
            <section class="detail-section"><h3>Activity history</h3><div class="detail-table-wrap"><table class="detail-table"><thead><tr><th>Date and time</th><th>Activity</th><th>Details</th></tr></thead><tbody>${activityRows || `<tr><td colspan="3">No activity recorded.</td></tr>`}</tbody></table></div></section>
            <div class="detail-actions"><button type="button" class="client-action" data-client-modal-close>Close</button><button type="button" class="client-action primary" data-client-edit="${esc(client.id)}">Edit client</button></div>
        </div>`;
        modal.hidden = false;
        $("#clientModalClose").focus();
    }
    function renderEdit(client) {
        $("#clientModalTitle").textContent = `Edit ${client.name}`;
        modalBody.innerHTML = `<form class="client-edit-form" id="clientEditForm" data-client-id="${esc(client.id)}">
            <label>Full name<input name="name" type="text" required maxlength="100" value="${esc(client.name)}"></label>
            <label>Email address<input name="email" type="email" maxlength="160" value="${esc(client.email || "")}" placeholder="No email stored"></label>
            <label>Account status<select name="status"><option value="active" ${client.status === "active" ? "selected" : ""}>Active</option><option value="inactive" ${client.status === "inactive" ? "selected" : ""}>Inactive</option><option value="pending" ${client.status === "pending" ? "selected" : ""}>Pending</option></select></label>
            <p class="edit-message" id="clientEditMessage" role="alert"></p>
            <div class="detail-actions"><button type="button" class="client-action" data-client-modal-close>Cancel</button><button type="submit" class="client-action primary">Save changes</button></div>
        </form>`;
        modal.hidden = false;
        $("input[name='name']", modalBody).focus();
    }
    function closeModal() { modal.hidden = true; modalBody.innerHTML = ""; }
    function saveClient(form) {
        const client = data.clients.find(item => item.id === form.dataset.clientId);
        if (!client) return;
        const values = new FormData(form), name = String(values.get("name") || "").trim(), email = String(values.get("email") || "").trim(), status = String(values.get("status") || "active");
        const message = $("#clientEditMessage");
        if (name.length < 2) { message.textContent = "Enter a name with at least 2 characters."; return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message.textContent = "Enter a valid email address."; return; }
        const edits = readEdits();
        edits[client.id] = { name, email, status };
        try {
            localStorage.setItem(EDIT_KEY, JSON.stringify(edits));
            Object.assign(client, edits[client.id]);
            renderStats(); renderTable(); renderDetail(client);
        } catch (error) {
            message.textContent = "Changes could not be saved in this browser.";
        }
    }

    $("#clientSearch").addEventListener("input", renderTable);
    $("#clientStatusFilter").addEventListener("change", renderTable);
    $("#clientModalClose").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
    document.addEventListener("click", event => {
        const detail = event.target.closest("[data-client-details]");
        if (detail) { const client = data.clients.find(item => item.id === detail.dataset.clientDetails); if (client) renderDetail(client); return; }
        const edit = event.target.closest("[data-client-edit]");
        if (edit) { const client = data.clients.find(item => item.id === edit.dataset.clientEdit); if (client) renderEdit(client); return; }
        if (event.target.closest("[data-client-modal-close]")) closeModal();
    });
    document.addEventListener("submit", event => {
        if (event.target.id === "clientEditForm") { event.preventDefault(); saveClient(event.target); }
    });

    Promise.resolve().then(() => {
        if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") {
            throw new Error("Admin data loader is unavailable. Check that Admin_data.js loaded successfully.");
        }
        return window.TEAMLY_ADMIN_DATA.load();
    }).then(result => {
        if (!result || !Array.isArray(result.clients) || !Array.isArray(result.projects) || !Array.isArray(result.requests) || !Array.isArray(result.transactions)) {
            throw new Error("Admin data loader returned an incomplete client record set.");
        }
        data = result;
        const name = result.admin && result.admin.name || "Admin";
        $("#clientsAdminName").textContent = name;
        $(".clients-admin .avatar").textContent = name.charAt(0).toUpperCase();
        window.TEAMLY_ADMIN_NAME = name;
        renderStats(); renderTable();
        document.dispatchEvent(new CustomEvent("admin-sidebar-ready"));
    }).catch(error => {
        console.error(error);
        $("#clientsError").textContent = "Client records could not be loaded. Check that the page is running through the project server and that Admin_data.js loaded.";
        $("#clientsError").hidden = false;
    });
})();
