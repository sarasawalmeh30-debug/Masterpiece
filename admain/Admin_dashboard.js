/* TEAMLY Admin Dashboard — behaviour. Data comes only from TEAMLY_ADMIN_DATA.load() (admin-data.js). */
(() => {
    "use strict";
 
    // Demo-level guard only: the project has no roles/backend, so real admin protection must be server-side.
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Admin_dashboard.html");
            return;
        }
    } catch (e) { /* storage unavailable: keep page usable */ }
 
    const DAY = 864e5;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const num = n => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const money = (n, cur = "JOD") => num(n) + " " + cur;
    const when = iso => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
 
    const TYPE_LABEL = { client: "Client", individual: "Individual provider", company: "Company" };
    const BADGE = { active: "success", successful: "success", accepted: "success", completed: "success", new: "info", refunded: "info", pending: "pending", rejected: "error", failed: "error", cancelled: "error", expired: "muted", inactive: "muted" };
    const badge = s => `<span class="badge badge-${BADGE[s] || "muted"}">${esc(s === "pending" ? cap(s) : cap(s))}</span>`;
    const SECTION_OF = { reqStatus: "requests", provType: "providers", provCat: "providers", provStatus: "providers", signType: "signups", txStatus: "payments", projStatus: "projects", subStatus: "subscriptions" };
 
    const state = {
        data: null, range: 30,
        f: { reqStatus: "all", provType: "all", provCat: "all", provStatus: "all", signType: "all", txStatus: "all", projStatus: "all", subStatus: "all" },
        q: {}, expanded: {}, page: {}
    };
 
    /* ---------- period helpers ---------- */
    function win(k) {
        const now = Date.now(), r = state.range;
        if (r === 0) return k === 0 ? [0, now] : [0, 0];
        return [now - (k + 1) * r * DAY, now - k * r * DAY];
    }
    const inWin = (iso, w) => { const t = Date.parse(iso); return t >= w[0] && t <= w[1]; };
    const cur = list => list.filter(x => inWin(x.created, win(0)));
    const prev = list => list.filter(x => inWin(x.created, win(1)));
    function delta(c, p) {
        if (state.range === 0) return "";
        if (!p) return c ? `<span class="up">New this period</span>` : "";
        const d = Math.round((c - p) / p * 100);
        return `<span class="${d >= 0 ? "up" : "down"}">${d >= 0 ? "+" : ""}${d}%</span> vs previous period`;
    }
 
    /* ---------- derived data ---------- */
    function derive() {
        const d = state.data, r = state.range;
        const accounts = [...d.clients.map(c => ({ ...c, services: [] })), ...d.providers].sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
        const fin = txs => {
            const ok = txs.filter(t => t.status === "successful");
            return { volume: sum(ok, t => t.amount), commission: sum(ok, t => t.commission), refunds: sum(txs.filter(t => t.status === "refunded"), t => t.amount), failed: txs.filter(t => t.status === "failed").length, pending: txs.filter(t => t.status === "pending").length };
        };
        const paidSubs = s => s.filter(x => x.status !== "pending" && x.price > 0);
        return {
            accounts, fin,
            txC: cur(d.transactions), txP: prev(d.transactions),
            reqC: cur(d.requests), reqP: prev(d.requests),
            projC: cur(d.projects), projP: prev(d.projects),
            subC: cur(d.subscriptions), subP: prev(d.subscriptions),
            subRev: s => sum(paidSubs(s), x => x.price),
            inds: d.providers.filter(p => p.type === "individual"), cos: d.providers.filter(p => p.type === "company"),
            span: r === 0 ? 90 : r
        };
    }
 
    /* ---------- generic table with search, filter, View all + pagination ---------- */
    const PAGE = 8, PREVIEW = 5;
    function table(key, rows, cols, opts = {}) {
        const host = $("#tbl-" + key); if (!host) return;
        const q = (state.q[key] || "").toLowerCase().trim();
        let list = rows;
        if (q) list = rows.filter(r => (opts.text ? opts.text(r) : JSON.stringify(r)).toLowerCase().includes(q));
        if (!list.length) { host.innerHTML = `<div class="tbl-wrap"><div class="empty">${esc(q ? "No results match your search." : opts.empty || "Nothing to show for this period.")}</div></div>`; return; }
        const exp = !!state.expanded[key];
        const pages = Math.max(1, Math.ceil(list.length / PAGE));
        const pg = Math.min(state.page[key] || 1, pages);
        const shown = exp ? list.slice((pg - 1) * PAGE, pg * PAGE) : list.slice(0, PREVIEW);
        host.innerHTML = `<div class="tbl-wrap"><table><thead><tr>${cols.map(c => `<th scope="col">${esc(c.h)}</th>`).join("")}</tr></thead><tbody>${
            shown.map(r => `<tr>${cols.map(c => `<td>${c.f(r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
            <div class="tbl-foot"><span>Showing ${shown.length} of ${list.length}</span>
            ${exp ? `<div class="pager"><button type="button" data-pg="${key}:-1" ${pg <= 1 ? "disabled" : ""}>Previous</button><span>Page ${pg} of ${pages}</span><button type="button" data-pg="${key}:1" ${pg >= pages ? "disabled" : ""}>Next</button></div>` : ""}
            ${list.length > PREVIEW ? `<button class="btn btn-outline" type="button" data-expand="${key}">${exp ? "Show less" : opts.viewAll || "View all"}</button>` : ""}</div>`;
    }
    const detailBtn = (kind, id) => `<button class="link-btn" type="button" data-detail="${kind}:${esc(id)}">Details</button>`;
    const chips = a => a.map(s => `<span class="chip">${esc(s)}</span>`).join("") || "—";
 
    /* ---------- render ---------- */
    function kpi(o) {
        return `<button class="kpi" type="button" data-act="${o.act}"><span class="kpi-top"><i class="fa ${o.icon}" aria-hidden="true"></i>${esc(o.label)}</span><span class="kpi-value">${o.value}</span><span class="kpi-sub">${o.sub || "&nbsp;"}</span></button>`;
    }
    function renderKpis(D) {
        const d = state.data;
        const accounts = d.clients.length + d.providers.length;
        const successful = D.txC.filter(t => t.status === "successful");
        const pendingProviders = d.providers.filter(p => p.status === "pending").length;
        $("#kpiMain").innerHTML = [
            kpi({ label: "Total accounts", icon: "fa-users", value: num(accounts), sub: `+${cur([...d.clients, ...d.providers]).length} this period`, act: "signType:all" }),
            kpi({ label: "Providers", icon: "fa-briefcase", value: num(d.providers.length), sub: `${num(D.inds.length)} individual · ${num(D.cos.length)} companies`, act: "provType:all" }),
            kpi({ label: "Projects", icon: "fa-folder-open-o", value: num(D.projC.length), sub: delta(D.projC.length, D.projP.length), act: "projStatus:all" }),
            kpi({ label: "Service requests", icon: "fa-inbox", value: num(D.reqC.length), sub: delta(D.reqC.length, D.reqP.length), act: "reqStatus:all" }),
            kpi({ label: "Payment volume", icon: "fa-credit-card", value: money(D.fin(D.txC).volume), sub: `${num(successful.length)} successful transactions`, act: "txStatus:successful" }),
            kpi({ label: "Awaiting approval", icon: "fa-clock-o", value: num(pendingProviders), sub: "Providers to review", act: "provStatus:pending" })
        ].join("");
    }
 
    function statCards(el, items, key) {
        $(el).innerHTML = items.map(i => i.act
            ? `<button class="stat ${state.f[key] === i.v ? "is-on" : ""}" type="button" data-act="${i.act}"><b>${i.n}</b><span>${esc(i.l)}</span></button>`
            : `<div class="stat"><b>${i.n}</b><span>${esc(i.l)}</span></div>`).join("");
    }
 
    function renderRequests(D) {
        const L = ["new", "pending", "accepted", "rejected", "expired"];
        statCards("#reqStatusGrid", [{ l: "All requests", n: D.reqC.length, act: "reqStatus:all", v: "all" }, ...L.map(s => ({ l: cap(s), n: D.reqC.filter(r => r.status === s).length, act: "reqStatus:" + s, v: s }))], "reqStatus");
        const rows = D.reqC.filter(r => state.f.reqStatus === "all" || r.status === state.f.reqStatus).sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
        table("requests", rows, [
            { h: "Request", f: r => `${esc(r.id)}<small>${esc(r.project)}</small>` },
            { h: "Client", f: r => esc(r.client) }, { h: "Provider", f: r => esc(r.provider) },
            { h: "Service", f: r => esc(r.service) }, { h: "Status", f: r => badge(r.status) },
            { h: "Created", f: r => when(r.created) }
        ], { text: r => [r.id, r.project, r.client, r.provider, r.service, r.status].join(" "), viewAll: "View all requests" });
    }
 
    function renderProviders(D) {
        const d = state.data, P = d.providers;
        statCards("#provStats", [
            { l: "Individual providers", n: D.inds.length, act: "provType:individual", v: "individual" }, { l: "Companies", n: D.cos.length, act: "provType:company", v: "company" },
            { l: "Active", n: P.filter(p => p.status === "active").length, act: "provStatus:active", v: "active" },
            { l: "Inactive", n: P.filter(p => p.status === "inactive").length, act: "provStatus:inactive", v: "inactive" },
            { l: "Awaiting approval", n: P.filter(p => p.status === "pending").length, act: "provStatus:pending", v: "pending" }
        ], "provStatus");
        const cats = window.TEAMLY_ADMIN_DATA.services, counts = cats.map(c => P.filter(p => p.services.includes(c)).length), max = Math.max(1, ...counts);
        $("#provCats").innerHTML = cats.map((c, i) => `<button class="hbar ${state.f.provCat === c ? "is-on" : ""}" type="button" data-act="provCat:${esc(c)}"><span>${esc(c)}</span><em><i style="width:${counts[i] / max * 100}%"></i></em><b>${counts[i]}</b></button>`).join("");
        renderServiceMix(cats, counts);
        const sel = $("#provCatSelect"); if (sel && !sel.options.length) sel.innerHTML = `<option value="all">All services</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
        const f = state.f;
        const rows = P.filter(p => (f.provType === "all" || p.type === f.provType) && (f.provCat === "all" || p.services.includes(f.provCat)) && (f.provStatus === "all" || p.status === f.provStatus));
        table("providers", rows, [
            { h: "Name", f: r => esc(r.name) }, { h: "Type", f: r => TYPE_LABEL[r.type] }, { h: "Services", f: r => chips(r.services) },
            { h: "Status", f: r => r.status === "pending" ? `<span class="badge badge-pending">Awaiting approval</span>` : badge(r.status) },
            { h: "Joined", f: r => when(r.created) }, { h: "", f: r => detailBtn("provider", r.id) }
        ], { text: r => [r.name, r.type, r.services.join(" "), r.status].join(" "), viewAll: "View all providers" });
    }

    function renderServiceMix(services, counts) {
        const total = sum(counts, count => count);
        const chart = $("#serviceMixChart"), legend = $("#serviceMixLegend");
        if (!chart || !legend) return;
        if (!total) {
            chart.innerHTML = `<div class="empty">No provider service data.</div>`;
            legend.innerHTML = "";
            return;
        }
        const colors = ["#527f58", "#8eae83", "#d6ae62", "#7189a4", "#b78070", "#829a8a", "#b1a276"];
        const radius = 48, circumference = 2 * Math.PI * radius;
        let offset = 0;
        const arcs = services.map((service, index) => {
            const count = counts[index] || 0;
            if (!count) return "";
            const length = circumference * count / total;
            const arc = `<circle r="${radius}" cx="60" cy="60" fill="none" stroke="${colors[index % colors.length]}" stroke-width="16" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)"><title>${esc(service)}: ${count} providers</title></circle>`;
            offset += length;
            return arc;
        }).join("");
        chart.innerHTML = `<svg viewBox="0 0 120 120" role="img" aria-label="Donut chart of providers by service"><circle r="48" cx="60" cy="60" fill="none" stroke="#edf2ec" stroke-width="16"/>${arcs}<text x="60" y="57" text-anchor="middle" class="service-mix-total">${total}</text><text x="60" y="72" text-anchor="middle" class="service-mix-caption">listings</text></svg>`;
        legend.innerHTML = services.map((service, index) => `<div class="service-mix-item"><i style="--mix-color:${colors[index % colors.length]}"></i><span>${esc(service)}</span><b>${counts[index] || 0}</b></div>`).join("");
    }
 
    function renderSignups(D) {
        const rows = D.accounts.filter(a => state.f.signType === "all" || a.type === state.f.signType);
        table("signups", rows, [
            { h: "Name", f: r => esc(r.name) }, { h: "Account type", f: r => TYPE_LABEL[r.type] },
            { h: "Registered", f: r => when(r.created) }, { h: "Status", f: r => r.status === "pending" ? `<span class="badge badge-pending">Awaiting approval</span>` : badge(r.status) },
            { h: "Services", f: r => chips(r.services || []) }, { h: "", f: r => detailBtn(r.type === "client" ? "client" : "provider", r.id) }
        ], { text: r => [r.name, r.type].join(" "), viewAll: "View all accounts" });
    }
 
    function renderPayments(D) {
        const F = D.fin(D.txC), d = state.data;
        statCards("#finStats", [
            { l: "Payment volume", n: money(F.volume) }, { l: "Commission revenue", n: money(F.commission) },
            { l: "Subscription revenue", n: money(D.subRev(D.subC), "USD") }, { l: "Provider payouts", n: "Not tracked" },
            { l: "Refunds", n: money(F.refunds), act: "txStatus:refunded", v: "refunded" }, { l: "Failed transactions", n: F.failed, act: "txStatus:failed", v: "failed" },
            { l: "Pending transactions", n: F.pending, act: "txStatus:pending", v: "pending" }
        ], "txStatus");
        $("#finNote").textContent = "Volume and commission count successful transactions only. Pending, failed and refunded payments earn no commission. Subscription revenue is in USD and kept separate. Provider payouts are not tracked yet.";
        const rows = D.txC.filter(t => state.f.txStatus === "all" || t.status === state.f.txStatus).sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
        table("transactions", rows, [
            { h: "Transaction", f: r => esc(r.id) }, { h: "Payer", f: r => esc(r.payer) }, { h: "Project", f: r => esc(r.project) },
            { h: "Amount", f: r => money(r.amount) }, { h: "Commission", f: r => r.commission ? money(r.commission) : "—" },
            { h: "Date", f: r => when(r.created) }, { h: "Method", f: r => esc(r.method) }, { h: "Status", f: r => badge(r.status) }, { h: "", f: r => detailBtn("tx", r.id) }
        ], { text: r => [r.id, r.payer, r.project, r.status].join(" "), viewAll: "View all transactions" });
    }
 
    function renderProjects(D) {
        const L = ["pending", "active", "completed", "cancelled"];
        statCards("#projStats", [{ l: "All projects", n: D.projC.length, act: "projStatus:all", v: "all" }, ...L.map(s => ({ l: cap(s), n: D.projC.filter(p => p.status === s).length, act: "projStatus:" + s, v: s }))], "projStatus");
        const rows = D.projC.filter(p => state.f.projStatus === "all" || p.status === state.f.projStatus).sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
        table("projects", rows, [
            { h: "Project", f: r => esc(r.name) }, { h: "Client", f: r => esc(r.client) }, { h: "Provider", f: r => esc(r.provider) },
            { h: "Services", f: r => chips(r.services) }, { h: "Budget", f: r => money(r.budget) }, { h: "Status", f: r => badge(r.status) },
            { h: "Created", f: r => when(r.created) }, { h: "", f: r => detailBtn("project", r.id) }
        ], { text: r => [r.name, r.client, r.provider, r.status].join(" "), viewAll: "View all projects" });
    }
 
    function renderSubs(D) {
        const S = D.subC, c = s => S.filter(x => x.status === s).length;
        statCards("#subStats", [{ l: "All subscriptions", n: S.length, act: "subStatus:all", v: "all" }, { l: "Active", n: c("active"), act: "subStatus:active", v: "active" }, { l: "Pending", n: c("pending"), act: "subStatus:pending", v: "pending" }, { l: "Expired", n: c("expired"), act: "subStatus:expired", v: "expired" }, { l: "Cancelled", n: c("cancelled"), act: "subStatus:cancelled", v: "cancelled" }, { l: "Revenue", n: money(D.subRev(S), "USD") }], "subStatus");
        const rows = S.filter(x => state.f.subStatus === "all" || x.status === state.f.subStatus).sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
        table("subscriptions", rows, [
            { h: "Provider", f: r => `${esc(r.provider)}<small>${TYPE_LABEL[r.type]}</small>` }, { h: "Plan", f: r => esc(r.plan) },
            { h: "Status", f: r => badge(r.status) }, { h: "Price", f: r => r.price ? money(r.price, r.currency) + "/month" : "Free" },
            { h: "Start", f: r => when(r.created) }, { h: "Renewal", f: r => r.status === "active" ? when(r.renewal) : "—" }
        ], { text: r => [r.provider, r.plan, r.status].join(" "), viewAll: "View all subscriptions" });
    }
 
    /* Activity is derived from the records above — no invented events, one event per record. */
    function renderActivity(D) {
        const d = state.data, ev = [];
        d.clients.forEach(c => ev.push({ t: c.created, k: "Client registered", s: c.name, a: "#signups" }));
        d.providers.forEach(p => ev.push({ t: p.created, k: p.type === "company" ? "Company registered" : "Individual provider registered", s: p.name, a: "#providers" }));
        d.projects.forEach(p => ev.push({ t: p.created, k: "Project created", s: `${p.name} (${p.client})`, a: "#projects" }));
        d.requests.forEach(r => ev.push({ t: r.created, k: { new: "Service request sent", pending: "Service request sent", accepted: "Request accepted", rejected: "Request rejected", expired: "Request expired" }[r.status], s: `${r.id}: ${r.provider}`, a: "#requests" }));
        d.transactions.forEach(x => ev.push({ t: x.created, k: { successful: "Payment completed", failed: "Payment failed", pending: "Payment pending", refunded: "Payment refunded" }[x.status], s: `${x.id}: ${money(x.amount)}`, a: "#payments" }));
        d.subscriptions.forEach(s => ev.push({ t: s.created, k: s.status === "cancelled" ? "Subscription cancelled" : "Subscription started", s: `${s.provider} (${s.plan})`, a: "#subscriptions" }));
        const rows = ev.filter(e => state.range === 0 || inWin(e.t, win(0))).sort((a, b) => Date.parse(b.t) - Date.parse(a.t));
        table("activity", rows, [
            { h: "Event", f: r => esc(r.k) }, { h: "Record", f: r => esc(r.s) }, { h: "When", f: r => when(r.t) }, { h: "", f: r => `<a class="link-btn" href="${r.a}">Open</a>` }
        ], { text: r => r.k + " " + r.s, viewAll: "View all activity" });
    }
 
    /* ---------- charts (inline SVG, no library) ---------- */
    const COL = { a: "var(--primary-dark)", b: "var(--primary)", c: "var(--pending)", d: "var(--info)", e: "var(--error)" };
    function buckets(D, list, val = () => 1, filt = () => true) {
        const N = 8, step = D.span * DAY / N, start = Date.now() - D.span * DAY, out = Array(N).fill(0);
        list.filter(filt).forEach(x => { const t = Date.parse(x.created) - start; if (t >= 0) out[Math.min(N - 1, Math.floor(t / step))] += val(x); });
        return { out, labels: out.map((_, i) => new Date(start + i * step).toLocaleDateString("en-GB", { day: "numeric", month: "short" })) };
    }
    function bars(el, labels, series) {
        const W = 360, H = 200, L = 34, B = 24, max = Math.max(3, ...series.flatMap(s => s.v)), n = labels.length, gw = (W - L) / n, bw = Math.min(22, gw / series.length - 3);
        if (!series.some(s => s.v.some(Boolean))) { $(el).innerHTML = `<div class="empty">No data in this period.</div>`; return; }
        let g = "";
        for (let i = 0; i <= 3; i++) { const y = 8 + (H - B - 8) * i / 3; g += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--border)"/><text x="${L - 5}" y="${y + 4}" font-size="10" text-anchor="end" fill="var(--text-light)">${num(Math.round(max * (1 - i / 3)))}</text>`; }
        series.forEach((s, si) => s.v.forEach((v, i) => { const h = (H - B - 8) * v / max, x = L + i * gw + gw / 2 - series.length * (bw + 3) / 2 + si * (bw + 3); g += `<rect x="${x}" y="${H - B - h}" width="${bw}" height="${h}" rx="3" fill="${s.c}"><title>${esc(s.n)}: ${num(v)}</title></rect>`; }));
        labels.forEach((l, i) => { if (i % 2 === 0 || n < 6) g += `<text x="${L + i * gw + gw / 2}" y="${H - 6}" font-size="10" text-anchor="middle" fill="var(--text-light)">${esc(l)}</text>`; });
        $(el).innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">${g}</svg>` + (series.length > 1 ? `<div class="legend">${series.map(s => `<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join("")}</div>` : "");
    }
    function line(el, labels, series) {
        const W = 460, H = 260, L = 52, B = 46, max = Math.max(3, ...series.flatMap(s => s.v)), n = labels.length;
        if (!series.some(s => s.v.some(Boolean))) { $(el).innerHTML = `<div class="empty">No data in this period.</div>`; return; }
        const X = i => L + (W - L - 18) * i / (n - 1), Y = v => H - B - (H - B - 18) * v / max;
        let g = ""; for (let i = 0; i <= 4; i++) { const y = 18 + (H - B - 18) * i / 4; g += `<line x1="${L}" x2="${W - 18}" y1="${y}" y2="${y}" stroke="var(--border)"/><text x="${L - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="var(--text-light)">${num(Math.round(max * (1 - i / 4)))}</text>`; }
        g += `<line x1="${L}" x2="${L}" y1="18" y2="${H - B}" stroke="var(--text-light)"/><line x1="${L}" x2="${W - 18}" y1="${H - B}" y2="${H - B}" stroke="var(--text-light)"/>`;
        series.forEach((s, index) => {
            const points = s.v.map((v, i) => ({ x: X(i), y: Y(v), value: v }));
            let path = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                const previous = points[i - 1], current = points[i];
                const midX = (previous.x + current.x) / 2, midY = (previous.y + current.y) / 2;
                path += ` Q ${previous.x} ${previous.y} ${midX} ${midY}`;
            }
            const last = points[points.length - 1];
            path += ` L ${last.x} ${last.y}`;
            const area = `${path} L ${last.x} ${H - B} L ${points[0].x} ${H - B} Z`;
            const gradientId = `growthArea${index}`;
            g += `<defs><linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${s.c}" stop-opacity=".2"/><stop offset="100%" stop-color="${s.c}" stop-opacity="0"/></linearGradient></defs>`;
            g += `<path d="${area}" fill="url(#${gradientId})"/><path d="${path}" fill="none" stroke="${s.c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
            g += points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="var(--white)" stroke="${s.c}" stroke-width="2"><title>${esc(s.n)}: ${num(point.value)}</title></circle>`).join("");
        });
        labels.forEach((l, i) => { if (i % 2 === 0 || n < 6) g += `<text x="${X(i)}" y="${H - 25}" font-size="10" text-anchor="middle" fill="var(--text-light)">${esc(l)}</text>`; });
        g += `<text x="14" y="${(H - B) / 2}" transform="rotate(-90 14 ${(H - B) / 2})" font-size="11" text-anchor="middle" fill="var(--text-secondary)">Count</text><text x="${(L + W - 18) / 2}" y="${H - 4}" font-size="11" text-anchor="middle" fill="var(--text-secondary)">Date</text>`;
        $(el).innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart showing counts by date">${g}</svg><div class="legend">${series.map(s => `<span><i style="background:${s.c}"></i>${esc(s.n)}</span>`).join("")}</div>`;
    }
    function renderCharts(D) {
        const d = state.data, regs = buckets(D, [...d.clients, ...d.providers]);
        const projectBuckets = buckets(D, d.projects);
        bars("#chActivity", regs.labels, [
            { n: "New accounts", c: "#5b9362", v: regs.out },
            { n: "Projects", c: "#91a9df", v: projectBuckets.out }
        ]);
        line("#chRegs", regs.labels, [
            { n: "New accounts", c: COL.a, v: regs.out },
            { n: "Projects created", c: COL.c, v: buckets(D, d.projects).out }
        ]);
    }
 
    /* ---------- header and menus ---------- */
    function renderBell(D) {
        const d = state.data, F = D.fin(D.txC);
        const items = [
            ["New service requests", D.reqC.filter(r => r.status === "new").length, "reqStatus:new"],
            ["Requests awaiting a response", D.reqC.filter(r => r.status === "pending").length, "reqStatus:pending"],
            ["Providers awaiting approval", d.providers.filter(p => p.status === "pending").length, "provStatus:pending"],
            ["Failed payments", F.failed, "txStatus:failed"]
        ].filter(i => i[1]);
        $("#bellDot").hidden = !items.length;
        $("#bellMenu").innerHTML = items.length ? items.map(([l, n, a]) => `<button class="menu-item" type="button" data-act="${a}"><span>${esc(l)}</span><b>${n}</b></button>`).join("") : `<p class="menu-note">You are all caught up.</p>`;
    }
 
    function go(section) {
        const el = document.getElementById(section); if (!el) return;
        el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", "#" + section);
        document.dispatchEvent(new CustomEvent("admin-section-change", { detail: section }));
    }
    function act(spec) {
        if (spec.startsWith("#")) { go(spec.slice(1)); return; }
        const [k, v] = spec.split(":"); state.f[k] = v; state.expanded[SECTION_OF[k]] = false;
        $$("[data-f]").forEach(s => { if (state.f[s.dataset.f] !== undefined) s.value = state.f[s.dataset.f]; });
        render(); go(SECTION_OF[k]);
    }
 
    /* ---------- detail modal (no admin detail pages exist yet) ---------- */
    function showDetail(spec) {
        const [kind, id] = spec.split(":"), d = state.data;
        const src = { client: d.clients, provider: d.providers, project: d.projects, tx: d.transactions }[kind];
        const r = (src || []).find(x => x.id === id); if (!r) return;
        const skip = ["id"], rows = Object.entries(r).filter(([k]) => !skip.includes(k) && !/Id$/.test(k)).map(([k, v]) => {
            const val = /created|renewal/.test(k) ? when(v) : Array.isArray(v) ? v.join(", ") : typeof v === "number" ? num(v) : v;
            return `<dt>${esc(cap(k.replace(/([A-Z])/g, " $1").toLowerCase()))}</dt><dd>${esc(val)}</dd>`;
        });
        $("#detailTitle").textContent = r.name || r.id; $("#detailBody").innerHTML = rows.join("");
        $("#detailModal").hidden = false; $("#detailClose").focus();
    }
 
    function render() {
        const D = derive();
        renderKpis(D); renderRequests(D); renderProviders(D); renderSignups(D); renderPayments(D);
        renderProjects(D); renderSubs(D); renderActivity(D); renderCharts(D); renderBell(D);
        $$("[data-f]").forEach(s => { s.value = state.f[s.dataset.f]; });
    }
 
    /* ---------- events ---------- */
    document.addEventListener("click", e => {
        const a = e.target.closest("[data-act]"); if (a) { $$(".menu").forEach(m => m.hidden = true); act(a.dataset.act); return; }
        const x = e.target.closest("[data-expand]"); if (x) { const k = x.dataset.expand; state.expanded[k] = !state.expanded[k]; state.page[k] = 1; render(); return; }
        const p = e.target.closest("[data-pg]"); if (p) { const [k, s] = p.dataset.pg.split(":"); state.page[k] = (state.page[k] || 1) + Number(s); render(); return; }
        const dt = e.target.closest("[data-detail]"); if (dt) { showDetail(dt.dataset.detail); return; }
        const m = e.target.closest(".menu-wrap");
        $$(".menu-wrap").forEach(w => { if (w !== m) { $(".menu", w).hidden = true; $("button[aria-expanded]", w).setAttribute("aria-expanded", "false"); } });
        if (e.target === $("#detailModal")) $("#detailModal").hidden = true;
    });
    document.addEventListener("change", e => { const s = e.target.closest("[data-f]"); if (s) { state.f[s.dataset.f] = s.value; state.page[SECTION_OF[s.dataset.f]] = 1; render(); } });
    document.addEventListener("input", e => { const q = e.target.closest("[data-q]"); if (q) { state.q[q.dataset.q] = q.value; state.page[q.dataset.q] = 1; if (q.value) state.expanded[q.dataset.q] = true; render(); const n = $(`[data-q="${q.dataset.q}"]`); n.focus(); } });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { $("#detailModal").hidden = true; $$(".menu").forEach(m => m.hidden = true); } });
    $("#detailClose").addEventListener("click", () => { $("#detailModal").hidden = true; });
    [["#bellBtn", "#bellMenu"], ["#profileBtn", "#profileMenu"]].forEach(([b, m]) => $(b).addEventListener("click", ev => { ev.stopPropagation(); const open = $(m).hidden; $$(".menu").forEach(x => x.hidden = true); $(m).hidden = !open; $(b).setAttribute("aria-expanded", String(open)); }));
    $("#rangeSelect").addEventListener("change", e => { state.range = Number(e.target.value); state.expanded = {}; state.page = {}; if (state.data) render(); });
    $("#menuLogout").addEventListener("click", () => { try { sessionStorage.removeItem("teamlyLoggedIn"); } catch (e) { /* continue */ } });
    $("#retryBtn").addEventListener("click", load);
 
    function setName() {
        const n = (state.data && state.data.admin && state.data.admin.name) || "Sara";
        window.TEAMLY_ADMIN_NAME = n;
        $("#greeting").textContent = "Welcome back, " + n; $("#profileName").textContent = n; $("#profileAvatar").textContent = n.charAt(0).toUpperCase();
        const sn = $("#adminSidebarName"), sa = $("#adminSidebarAvatar"); if (sn) sn.textContent = n; if (sa) sa.textContent = n.charAt(0).toUpperCase();
    }
    document.addEventListener("admin-sidebar-ready", setName);
 
    function load() {
        $("#errorBanner").hidden = true;
        $("#kpiMain").innerHTML = `<div class="loading">Loading…</div>`;
        window.TEAMLY_ADMIN_DATA.load().then(data => {
            state.data = data; $("#activityDataTag").hidden = !data.isDemo; setName(); render();
            if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
        }).catch(err => {
            console.error(err); $("#kpiMain").innerHTML = "";
            $("#errorText").textContent = "Dashboard data could not be loaded. Check your connection and try again."; $("#errorBanner").hidden = false;
        });
    }
    load();
})();
 
