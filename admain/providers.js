(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Providers.html");
            return;
        }
    } catch (e) { /* allow the local preview to continue when storage is unavailable */ }

    const $ = (selector, root = document) => root.querySelector(selector);
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const fmt = value => Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const date = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
    const stamp = value => value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not available";
    const EDIT_KEY = "teamlyAdminProviderEdits";
    const modal = $("#providerModal"), modalBody = $("#providerModalBody");
    let data;

    function readEdits() {
        try { return JSON.parse(localStorage.getItem(EDIT_KEY) || "{}"); } catch (e) { return {}; }
    }
    function projectRows(provider) {
        return data.projects.filter(project => project.providerId === provider.id || project.provider === provider.name);
    }
    function related(provider) {
        const projects = projectRows(provider), ids = new Set(projects.map(project => project.id));
        return {
            projects,
            requests: data.requests.filter(request => request.providerId === provider.id || request.provider === provider.name),
            transactions: data.transactions.filter(transaction => ids.has(transaction.projectId)),
            subscriptions: data.subscriptions.filter(subscription => subscription.providerId === provider.id || subscription.provider === provider.name)
        };
    }
    function successfulTotal(transactions) {
        return transactions.filter(item => item.status === "successful").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }
    function statusMarkup(status) {
        const value = ["active", "inactive", "pending"].includes(status) ? status : "active";
        return `<span class="provider-status ${value}">${esc(value[0].toUpperCase() + value.slice(1))}</span>`;
    }
    function servicesFor(provider) {
        const services = Array.isArray(provider.services) ? provider.services : provider.service ? [provider.service] : [];
        return services.filter(Boolean);
    }
    function renderStats() {
        const active = data.providers.filter(provider => provider.status === "active").length;
        const companies = data.providers.filter(provider => provider.type === "company").length;
        const projects = data.projects.filter(project => data.providers.some(provider => provider.id === project.providerId || provider.name === project.provider)).length;
        $("#providersStats").innerHTML = [
            ["All providers", data.providers.length], ["Active accounts", active], ["Companies", companies], ["Projects served", projects]
        ].map(([label, value]) => `<article class="provider-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join("");
    }
    function renderTable() {
        const query = $("#providerSearch").value.trim().toLowerCase();
        const type = $("#providerTypeFilter").value, status = $("#providerStatusFilter").value;
        const providers = data.providers.filter(provider => {
            const text = `${provider.name} ${provider.email || ""} ${provider.id} ${servicesFor(provider).join(" ")}`.toLowerCase();
            return (!query || text.includes(query)) && (type === "all" || provider.type === type) && (status === "all" || provider.status === status);
        }).sort((a, b) => Date.parse(b.created || 0) - Date.parse(a.created || 0));
        $("#providersTableBody").innerHTML = providers.length ? providers.map(provider => {
            const initials = String(provider.name || "Provider").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
            const projects = projectRows(provider).length;
            const services = servicesFor(provider);
            return `<tr>
                <td><div class="provider-name"><span class="provider-avatar">${esc(initials || "P")}</span><span>${esc(provider.name)}<small class="provider-sub">${esc(provider.email || provider.id)}</small></span></div></td>
                <td><span class="provider-type ${provider.type === "company" ? "company" : ""}">${esc(provider.type === "company" ? "Company" : "Individual")}</span></td>
                <td><div class="provider-services">${services.length ? services.map(service => `<span class="provider-service-chip">${esc(service)}</span>`).join("") : "Not listed"}</div></td>
                <td>${projects}</td><td>${provider.startingPrice == null ? "Not listed" : `${fmt(provider.startingPrice)} ${esc(provider.currency || "JOD")}`}</td>
                <td>${statusMarkup(provider.status)}</td>
                <td><div class="provider-actions"><button class="provider-action primary" type="button" data-provider-details="${esc(provider.id)}">Details</button><button class="provider-action" type="button" data-provider-edit="${esc(provider.id)}">Edit</button></div></td>
            </tr>`;
        }).join("") : `<tr><td colspan="7"><div class="providers-empty">No providers match these filters.</div></td></tr>`;
        $("#providersCount").textContent = `Showing ${providers.length} of ${data.providers.length} provider accounts`;
    }
    function fact(label, value) {
        return `<div><dt>${esc(label)}</dt><dd>${esc(value == null || value === "" ? "Not available" : value)}</dd></div>`;
    }
    function tableRows(records, fields, emptyText) {
        if (!records.length) return `<tr><td colspan="${fields.length}">${esc(emptyText)}</td></tr>`;
        return records.map(record => `<tr>${fields.map(field => `<td>${esc(typeof field.value === "function" ? field.value(record) : record[field.value])}</td>`).join("")}</tr>`).join("");
    }
    function detailTable(headers, rows) {
        return `<div class="provider-detail-table-wrap"><table class="provider-detail-table"><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    function renderDetail(provider) {
        const records = related(provider), paid = successfulTotal(records.transactions), services = servicesFor(provider);
        const projectTable = detailTable(["Project", "Client", "Services", "Date", "Status", "Budget"], tableRows(records.projects, [
            { value: "name" }, { value: "client" }, { value: project => (project.services || []).join(", ") }, { value: project => date(project.created) }, { value: "status" }, { value: project => `${fmt(project.budget)} JOD` }
        ], "No project records for this provider."));
        const requestTable = detailTable(["Request", "Project", "Client", "Service", "Status", "Date"], tableRows(records.requests, [
            { value: "id" }, { value: "project" }, { value: "client" }, { value: "service" }, { value: "status" }, { value: request => stamp(request.created) }
        ], "No service requests for this provider."));
        const transactionTable = detailTable(["Transaction", "Project", "Payer", "Amount", "Status", "Date"], tableRows(records.transactions, [
            { value: "id" }, { value: "project" }, { value: "payer" }, { value: transaction => `${fmt(transaction.amount)} JOD` }, { value: "status" }, { value: transaction => stamp(transaction.created) }
        ], "No transactions linked to this provider's projects."));
        const subscriptionTable = detailTable(["Plan", "Price", "Status", "Started", "Renews"], tableRows(records.subscriptions, [
            { value: "plan" }, { value: subscription => `${fmt(subscription.price)} ${subscription.currency || "USD"}` }, { value: "status" }, { value: subscription => date(subscription.created) }, { value: subscription => date(subscription.renewal) }
        ], "No subscription record for this provider."));

        $("#providerModalTitle").textContent = provider.name;
        modalBody.innerHTML = `<div class="provider-detail-content">
            <div class="provider-detail-top">
                <div class="provider-metric"><span>Projects</span><strong>${records.projects.length}</strong></div>
                <div class="provider-metric"><span>Requests</span><strong>${records.requests.length}</strong></div>
                <div class="provider-metric"><span>Successful payments</span><strong>${fmt(paid)} JOD</strong></div>
                <div class="provider-metric"><span>Transactions</span><strong>${records.transactions.length}</strong></div>
            </div>
            <section class="provider-section"><h3>Provider profile</h3><dl class="provider-facts">${fact("Account ID", provider.id)}${fact("Name", provider.name)}${fact("Account type", provider.type === "company" ? "Company" : "Individual")}${fact("Email", provider.email || "Not stored in current record")}${fact("Phone", provider.phone)}${fact("Status", provider.status)}${fact("Registered", stamp(provider.created))}${fact("Starting price", provider.startingPrice == null ? "Not stored in current record" : `${fmt(provider.startingPrice)} ${provider.currency || "JOD"}`)}${fact("Location", Array.isArray(provider.location) ? provider.location.join(", ") : provider.location)}${fact("Description", provider.description || provider.companyDescription)}</dl></section>
            <section class="provider-section"><h3>Services offered</h3><div class="provider-detail-services">${services.length ? services.map(service => `<span class="provider-service-chip">${esc(service)}</span>`).join("") : `<p class="provider-note">No service details stored.</p>`}</div></section>
            <section class="provider-section"><h3>Projects and clients</h3>${projectTable}</section>
            <section class="provider-section"><h3>Service requests</h3>${requestTable}</section>
            <section class="provider-section"><h3>Payments</h3><p class="provider-note">Successful transactions total ${fmt(paid)} JOD. Other statuses remain listed in the table.</p>${transactionTable}</section>
            <section class="provider-section"><h3>Subscriptions</h3>${subscriptionTable}</section>
            <section class="provider-section"><h3>Feedback and meetings</h3><p class="provider-note">Feedback and Zoom meeting records are not included in the current project data.</p></section>
            <div class="provider-detail-actions"><button type="button" class="provider-action" data-provider-modal-close>Close</button><button type="button" class="provider-action primary" data-provider-edit="${esc(provider.id)}">Edit provider</button></div>
        </div>`;
        modal.hidden = false;
        $("#providerModalClose").focus();
    }
    function renderEdit(provider) {
        $("#providerModalTitle").textContent = `Edit ${provider.name}`;
        modalBody.innerHTML = `<form class="provider-edit-form" id="providerEditForm" data-provider-id="${esc(provider.id)}">
            <label>Provider name<input name="name" type="text" required maxlength="120" value="${esc(provider.name)}"></label>
            <label>Email address<input name="email" type="email" maxlength="160" value="${esc(provider.email || "")}" placeholder="No email stored"></label>
            <label>Account status<select name="status"><option value="active" ${provider.status === "active" ? "selected" : ""}>Active</option><option value="inactive" ${provider.status === "inactive" ? "selected" : ""}>Inactive</option><option value="pending" ${provider.status === "pending" ? "selected" : ""}>Pending</option></select></label>
            <p class="provider-edit-message" id="providerEditMessage" role="alert"></p>
            <div class="provider-detail-actions"><button type="button" class="provider-action" data-provider-modal-close>Cancel</button><button type="submit" class="provider-action primary">Save changes</button></div>
        </form>`;
        modal.hidden = false;
        $("input[name='name']", modalBody).focus();
    }
    function saveProvider(form) {
        const provider = data.providers.find(item => item.id === form.dataset.providerId);
        if (!provider) return;
        const values = new FormData(form), name = String(values.get("name") || "").trim(), email = String(values.get("email") || "").trim(), status = String(values.get("status") || "active");
        const message = $("#providerEditMessage");
        if (name.length < 2) { message.textContent = "Enter a name with at least 2 characters."; return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message.textContent = "Enter a valid email address."; return; }
        const edits = readEdits();
        edits[provider.id] = { name, email, status };
        try {
            localStorage.setItem(EDIT_KEY, JSON.stringify(edits));
            Object.assign(provider, edits[provider.id]);
            renderStats(); renderTable(); renderDetail(provider);
        } catch (error) { message.textContent = "Changes could not be saved in this browser."; }
    }
    function closeModal() { modal.hidden = true; modalBody.innerHTML = ""; }

    $("#providerSearch").addEventListener("input", renderTable);
    $("#providerTypeFilter").addEventListener("change", renderTable);
    $("#providerStatusFilter").addEventListener("change", renderTable);
    $("#providerModalClose").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
    document.addEventListener("click", event => {
        const detail = event.target.closest("[data-provider-details]");
        if (detail) { const provider = data.providers.find(item => item.id === detail.dataset.providerDetails); if (provider) renderDetail(provider); return; }
        const edit = event.target.closest("[data-provider-edit]");
        if (edit) { const provider = data.providers.find(item => item.id === edit.dataset.providerEdit); if (provider) renderEdit(provider); return; }
        if (event.target.closest("[data-provider-modal-close]")) closeModal();
    });
    document.addEventListener("submit", event => {
        if (event.target.id === "providerEditForm") { event.preventDefault(); saveProvider(event.target); }
    });

    Promise.resolve().then(() => {
        if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") throw new Error("Admin data loader is unavailable.");
        return window.TEAMLY_ADMIN_DATA.load();
    }).then(result => {
        if (!result || !Array.isArray(result.providers) || !Array.isArray(result.projects) || !Array.isArray(result.requests) || !Array.isArray(result.transactions) || !Array.isArray(result.subscriptions)) throw new Error("Provider data is incomplete.");
        data = result;
        const edits = readEdits();
        data.providers = data.providers.map(provider => Object.assign({}, provider, edits[provider.id] || {}));
        try {
            const profile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
            if (profile && profile.email && !data.providers.some(provider => provider.email && provider.email.toLowerCase() === profile.email.toLowerCase())) {
                data.providers.push({ id: `local-${profile.email.toLowerCase()}`, name: profile.companyName || profile.fullName || "Registered provider", email: profile.email, type: profile.companyName ? "company" : "individual", services: profile.services || (profile.service ? [profile.service] : []), startingPrice: profile.startingPrice, currency: profile.currency || "JOD", location: profile.location, description: profile.description, status: "active", created: profile.created || profile.registeredAt });
            }
        } catch (e) { /* ignore malformed local preview profile */ }
        const name = result.admin && result.admin.name || "Admin";
        $("#providersAdminName").textContent = name;
        $("#providersAdminAvatar").textContent = name.charAt(0).toUpperCase();
        window.TEAMLY_ADMIN_NAME = name;
        renderStats(); renderTable();
    }).catch(error => {
        console.error(error);
        $("#providersError").textContent = "Provider records could not be loaded. Check that this page is running through the project server and that Admin_data.js loaded.";
        $("#providersError").hidden = false;
    });
})();
