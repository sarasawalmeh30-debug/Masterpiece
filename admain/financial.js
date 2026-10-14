(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Financial.html");
            return;
        }
    } catch (e) { /* allow local preview if session storage is unavailable */ }

    const $ = (selector, root = document) => root.querySelector(selector);
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const fmt = value => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const money = value => `${fmt(value)} JOD`;
    const date = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
    const stamp = value => value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not available";
    const modal = $("#transactionModal");
    let data;

    function renderStats() {
        const successful = data.transactions.filter(item => item.status === "successful");
        const pending = data.transactions.filter(item => item.status === "pending");
        const refunded = data.transactions.filter(item => item.status === "refunded");
        const gross = successful.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const commission = successful.reduce((sum, item) => sum + Number(item.commission || 0), 0);
        const pendingValue = pending.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const refundValue = refunded.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        $("#financialStats").innerHTML = [
            ["Successful payments", gross, "fa-check-circle", `${successful.length} transactions`],
            ["TEAMLY commission", commission, "fa-percent", `${(Number(window.TEAMLY_ADMIN_DATA.commissionRate || 0) * 100).toFixed(0)}% standard rate`],
            ["Pending payments", pendingValue, "fa-clock-o", `${pending.length} transactions`],
            ["Refunded", refundValue, "fa-undo", `${refunded.length} transactions`]
        ].map(([label, amount, icon, sub]) => `<article class="financial-stat"><span><i class="fa ${icon}" aria-hidden="true"></i>${esc(label)}</span><strong>${money(amount)}</strong><small>${esc(sub)}</small></article>`).join("");
    }
    function renderChart() {
        const months = [];
        const now = new Date();
        for (let offset = 5; offset >= 0; offset--) {
            const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            months.push({ date: d, key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-US", { month: "short" }) , total: 0 });
        }
        data.transactions.filter(item => item.status === "successful").forEach(item => {
            const d = new Date(item.created);
            const month = months.find(bucket => bucket.key === `${d.getFullYear()}-${d.getMonth()}`);
            if (month) month.total += Number(item.amount || 0);
        });
        const max = Math.max(1, ...months.map(month => month.total));
        const width = 720, height = 210, left = 48, right = 14, top = 18, bottom = 34, plotH = height - top - bottom;
        const barsW = (width - left - right) / months.length;
        const grid = [0, .25, .5, .75, 1].map(frac => {
            const y = top + plotH * (1 - frac), val = max * frac;
            return `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text class="chart-axis-label" x="${left - 8}" y="${y + 3}" text-anchor="end">${Math.round(val)}</text>`;
        }).join("");
        const bars = months.map((month, index) => {
            const barHeight = month.total ? Math.max(3, month.total / max * plotH) : 2;
            const x = left + index * barsW + barsW * .28, y = top + plotH - barHeight, w = barsW * .44;
            return `<g><title>${esc(month.label)}: ${money(month.total)}</title><rect class="chart-bar" x="${x}" y="${y}" width="${w}" height="${barHeight}" rx="5"></rect><text class="chart-axis-label" x="${x + w / 2}" y="${height - 10}" text-anchor="middle">${esc(month.label)}</text></g>`;
        }).join("");
        $("#revenueChart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Successful transaction volume by month in JOD">${grid}${bars}</svg>`;
    }
    function statusMarkup(status) {
        const allowed = ["successful", "pending", "failed", "refunded"];
        const value = allowed.includes(status) ? status : "pending";
        return `<span class="financial-status ${value}">${esc(value[0].toUpperCase() + value.slice(1))}</span>`;
    }
    function renderTransactions() {
        const query = $("#transactionSearch").value.trim().toLowerCase();
        const filterStatus = $("#transactionStatus").value;
        const transactions = data.transactions.filter(item => {
            const haystack = `${item.id} ${item.payer} ${item.project} ${item.method}`.toLowerCase();
            return (!query || haystack.includes(query)) && (filterStatus === "all" || item.status === filterStatus);
        }).sort((a, b) => Date.parse(b.created || 0) - Date.parse(a.created || 0));
        $("#transactionsBody").innerHTML = transactions.length ? transactions.map(item => `<tr>
            <td><strong>${esc(item.id)}</strong></td><td>${esc(item.payer || "Not available")}</td><td>${esc(item.project || "Not available")}</td>
            <td>${money(item.amount)}</td><td>${money(item.commission)}</td><td>${esc(item.method || "Not available")}</td><td>${statusMarkup(item.status)}</td><td>${esc(date(item.created))}</td>
            <td><button class="financial-details-btn" type="button" data-transaction-details="${esc(item.id)}">Details</button></td>
        </tr>`).join("") : `<tr><td colspan="9"><div class="financial-empty">No transactions match these filters.</div></td></tr>`;
        $("#transactionsCount").textContent = `Showing ${transactions.length} of ${data.transactions.length} transactions`;
    }
    function renderSubscriptions() {
        const rows = [...data.subscriptions].sort((a, b) => Date.parse(b.created || 0) - Date.parse(a.created || 0));
        $("#subscriptionsBody").innerHTML = rows.length ? rows.map(item => `<tr>
            <td>${esc(item.provider || "Not available")}</td><td>${esc(item.type === "company" ? "Company" : "Individual")}</td><td>${esc(item.plan || "Not available")}</td>
            <td>${fmt(item.price)} ${esc(item.currency || "USD")}</td><td>${statusMarkup(item.status)}</td><td>${esc(date(item.created))}</td><td>${esc(date(item.renewal))}</td>
        </tr>`).join("") : `<tr><td colspan="7"><div class="financial-empty">No provider subscriptions recorded.</div></td></tr>`;
    }
    function showTransaction(item) {
        $("#transactionModalTitle").textContent = item.id;
        const fields = [
            ["Transaction ID", item.id], ["Status", item.status], ["Client / payer", item.payer], ["Project", item.project],
            ["Project ID", item.projectId], ["Amount", money(item.amount)], ["TEAMLY commission", money(item.commission)],
            ["Payment method", item.method], ["Created", stamp(item.created)]
        ];
        $("#transactionDetails").innerHTML = fields.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value || "Not available")}</dd></div>`).join("");
        modal.hidden = false;
        $("#transactionModalClose").focus();
    }
    function closeModal() { modal.hidden = true; }

    $("#transactionSearch").addEventListener("input", renderTransactions);
    $("#transactionStatus").addEventListener("change", renderTransactions);
    $("#transactionModalClose").addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-transaction-details]");
        if (button) {
            const transaction = data.transactions.find(item => item.id === button.dataset.transactionDetails);
            if (transaction) showTransaction(transaction);
        }
    });

    Promise.resolve().then(() => {
        if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") throw new Error("Admin data loader is unavailable.");
        return window.TEAMLY_ADMIN_DATA.load();
    }).then(result => {
        if (!result || !Array.isArray(result.transactions) || !Array.isArray(result.subscriptions)) throw new Error("Financial records are incomplete.");
        data = result;
        const name = result.admin && result.admin.name || "Admin";
        $("#financialAdminName").textContent = name;
        $("#financialAdminAvatar").textContent = name.charAt(0).toUpperCase();
        window.TEAMLY_ADMIN_NAME = name;
        renderStats(); renderChart(); renderTransactions(); renderSubscriptions();
    }).catch(error => {
        console.error(error);
        $("#financialError").textContent = "Financial records could not be loaded. Check that this page is running through the project server and that Admin_data.js loaded.";
        $("#financialError").hidden = false;
    });
})();
