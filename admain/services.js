(() => {
    "use strict";
    try {
        if (sessionStorage.getItem("teamlyLoggedIn") !== "true") {
            location.replace("../login/login.html?returnTo=../admain/Services.html");
            return;
        }
    } catch (error) { /* allow local preview when session storage is unavailable */ }

    const $ = selector => document.querySelector(selector);
    const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const countLabel = count => `${count} ${count === 1 ? "provider" : "providers"}`;
    const icons = { Photography: "fa-camera", Videography: "fa-video-camera", Decoration: "fa-magic", "Event Planning": "fa-calendar", Venues: "fa-university" };
    const cards = $("#serviceCards");
    const search = $("#servicesSearch");
    let serviceGroups = [];

    function getProviders(providers) {
        const edits = (() => { try { return JSON.parse(localStorage.getItem("teamlyAdminProviderEdits") || "{}"); } catch (error) { return {}; } })();
        const list = providers.map(provider => Object.assign({}, provider, edits[provider.id] || {}));
        try {
            const profile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
            if (profile && profile.email && !list.some(provider => String(provider.email || "").toLowerCase() === String(profile.email).toLowerCase())) {
                list.push({ id: `local-${profile.email}`, email: profile.email, name: profile.companyName || profile.fullName || "Registered provider", type: profile.companyName ? "company" : "individual", services: profile.services || (profile.service ? [profile.service] : []), status: "active" });
            }
        } catch (error) { /* skip invalid locally saved profile data */ }
        return list;
    }

    function render() {
        const query = search.value.trim().toLowerCase();
        const shown = serviceGroups.filter(group => !query || group.name.toLowerCase().includes(query) || group.providers.some(provider => provider.name.toLowerCase().includes(query)));
        $("#directoryCount").textContent = `${shown.length} of ${serviceGroups.length} services`;
        if (!shown.length) {
            cards.innerHTML = '<p class="services-state">No services or providers match your search.</p>';
            return;
        }
        cards.innerHTML = shown.map(group => {
            const icon = icons[group.name] || "fa-th-list";
            const providers = group.providers.length
                ? group.providers.map(provider => `<div class="service-provider"><span class="provider-initial">${esc((provider.name || "P").trim().charAt(0).toUpperCase())}</span><span class="service-provider-name">${esc(provider.name)}</span><span class="service-provider-type">${esc(provider.type === "company" ? "Company" : "Individual")}</span></div>`).join("")
                : '<p class="service-empty">No providers currently offer this service.</p>';
            return `<article class="service-card"><div class="service-card-head"><span class="service-card-icon"><i class="fa ${icon}" aria-hidden="true"></i></span><div class="service-card-title"><h3>${esc(group.name)}</h3></div><span class="service-provider-count"><i class="fa fa-users" aria-hidden="true"></i>${countLabel(group.providers.length)}</span></div><div class="service-provider-list">${providers}</div></article>`;
        }).join("");
    }

    search.addEventListener("input", render);
    if (!window.TEAMLY_ADMIN_DATA || typeof window.TEAMLY_ADMIN_DATA.load !== "function") {
        cards.innerHTML = "";
        $("#servicesError").textContent = "Service information could not be loaded. Check that Admin_data.js is available.";
        $("#servicesError").hidden = false;
        return;
    }

    window.TEAMLY_ADMIN_DATA.load().then(data => {
        const providers = getProviders(Array.isArray(data.providers) ? data.providers : []);
        const serviceNames = new Set(Array.isArray(data.services) ? data.services : []);
        providers.forEach(provider => (Array.isArray(provider.services) ? provider.services : provider.service ? [provider.service] : []).forEach(service => { if (service) serviceNames.add(String(service)); }));
        serviceGroups = Array.from(serviceNames).sort((a, b) => a.localeCompare(b)).map(name => ({
            name,
            providers: providers.filter(provider => (Array.isArray(provider.services) ? provider.services : provider.service ? [provider.service] : []).some(service => String(service).toLowerCase() === name.toLowerCase()))
        }));
        const providerCount = new Set(serviceGroups.flatMap(group => group.providers.map(provider => provider.id || provider.name))).size;
        $("#servicesStats").innerHTML = `<div class="service-stat"><span class="service-stat-icon"><i class="fa fa-th-list" aria-hidden="true"></i></span><span class="service-stat-copy"><strong>${serviceGroups.length}</strong><span>Services listed</span></span></div><div class="service-stat"><span class="service-stat-icon"><i class="fa fa-users" aria-hidden="true"></i></span><span class="service-stat-copy"><strong>${providerCount}</strong><span>Providers offering services</span></span></div><div class="service-stat"><span class="service-stat-icon"><i class="fa fa-link" aria-hidden="true"></i></span><span class="service-stat-copy"><strong>${serviceGroups.reduce((total, group) => total + group.providers.length, 0)}</strong><span>Service provider listings</span></span></div>`;
        render();
    }).catch(error => {
        console.error(error);
        cards.innerHTML = "";
        $("#servicesError").textContent = "Service information could not be loaded. Please refresh and try again.";
        $("#servicesError").hidden = false;
    });
})();
