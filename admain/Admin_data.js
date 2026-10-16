(function () {
    "use strict";
    var DAY = 864e5, NOW = Date.now(), seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function ago(days) { return new Date(NOW - days * DAY).toISOString(); }
    var SERVICES = ["Photography", "Videography", "Decoration", "Event Planning", "Venues"];
    var RATE = 0.15;
 
    var clientNames = ["Sara Omar", "Lina Haddad", "Omar Nasser", "Rania Saleh", "Yazan Farouk", "Dana Mansour", "Khaled Aziz", "Huda Barakat", "Tariq Jaber", "Maya Qasem", "Faris Abu Ali", "Noor Taha", "Layan Zaid", "Basel Hijazi"];
    var indNames = ["Ahmad Khaled", "Rami Odeh", "Salma Yousef", "Jad Mansour", "Tala Rimawi", "Ziad Haddadin", "Mira Dababneh", "Hamza Said", "Reem Fakhoury", "Nader Abbas", "Dina Kilani", "Osama Qudah"];
    var coNames = ["Lens & Light Studio", "Golden Frame Co.", "Bloom Decor House", "Amman Events Co.", "Cedar Hall Venues", "Petra Productions", "Oasis Venues", "Sage Planners", "Moments Media"];
 
    var clients = clientNames.map(function (n, i) {
        return { id: "c" + (i + 1), name: n, type: "client", status: "active", created: ago(0.2 + i * 6.3 + rnd() * 3) };
    });
    var providers = [];
    indNames.forEach(function (n, i) {
        providers.push({ id: "p" + (i + 1), name: n, type: "individual", services: [SERVICES[i % 5]], status: i === 3 ? "pending" : i === 9 ? "inactive" : "active", created: ago(0.5 + i * 7.4 + rnd() * 4) });
    });
    coNames.forEach(function (n, i) {
        var s = [SERVICES[(i + 1) % 5], SERVICES[(i + 3) % 5]];
        if (i % 3 === 0) s.push(SERVICES[(i + 2) % 5]);
        providers.push({ id: "p" + (indNames.length + i + 1), name: n, type: "company", services: s.filter(function (v, k, a) { return a.indexOf(v) === k; }), status: i === 6 ? "pending" : i === 8 ? "inactive" : "active", created: ago(1.5 + i * 9.1 + rnd() * 5) });
    });
 
    var pStatus = ["active", "active", "pending", "completed", "completed", "cancelled", "active", "completed", "pending", "active", "completed", "active"];
    var pNames = ["Garden Wedding Celebration", "Modern Engagement Dinner", "Graduation Celebration", "Corporate Launch Night", "Baby Shower Brunch", "Henna Evening", "Charity Gala", "Birthday at the Farm", "Product Showcase", "Family Reunion", "Anniversary Dinner", "Summer Rooftop Party"];
    var projects = pNames.map(function (n, i) {
        var prov = providers[(i * 2) % providers.length];
        return { id: "j" + (i + 1), name: n, clientId: clients[i % clients.length].id, client: clients[i % clients.length].name, providerId: prov.id, provider: prov.name, services: prov.services.slice(0, 2), budget: 600 + Math.round(rnd() * 34) * 100, status: pStatus[i], created: ago(1 + i * 7.2 + rnd() * 3) };
    });
 
    var reqStatuses = ["new", "pending", "accepted", "rejected", "expired"];
    var requests = [];
    for (var i = 0; i < 30; i++) {
        var pr = projects[i % projects.length], prv = providers[(i * 3) % providers.length];
        requests.push({ id: "REQ-" + (1001 + i), projectId: pr.id, project: pr.name, client: pr.client, providerId: prv.id, provider: prv.name, service: prv.services[0], status: reqStatuses[(i * 7 + Math.floor(i / 3)) % 5], created: ago(0.1 + i * 2.9 + rnd()) });
    }
 
    var txStatuses = ["successful", "successful", "successful", "pending", "successful", "failed", "successful", "refunded", "successful", "successful"];
    var transactions = [];
    for (var t = 0; t < 22; t++) {
        var tp = projects[t % projects.length], st = txStatuses[t % txStatuses.length];
        var amount = 150 + Math.round(rnd() * 20) * 25;
        transactions.push({ id: "TX-" + (5001 + t), payer: tp.client, project: tp.name, projectId: tp.id, amount: amount, commission: st === "successful" ? Math.round(amount * RATE * 100) / 100 : 0, method: pick(["Card", "Card", "Card"]), status: st, created: ago(0.3 + t * 3.6 + rnd()) });
    }
 
    var plans = { free: { name: "Free", price: 0 }, professional: { name: "Professional", price: 9.99 }, business: { name: "Business", price: 14.99 } };
    var subStatuses = ["active", "active", "active", "expired", "active", "cancelled", "pending", "active"];
    var subscriptions = providers.slice(0, 14).map(function (p, i) {
        var planKey = ["professional", "business", "free", "professional"][i % 4], start = 2 + i * 6;
        return { id: "s" + (i + 1), providerId: p.id, provider: p.name, type: p.type, plan: plans[planKey].name, price: plans[planKey].price, currency: "USD", status: subStatuses[i % subStatuses.length], created: ago(start), renewal: new Date(NOW + (30 - (start % 30)) * DAY).toISOString() };
    });
 
    window.TEAMLY_ADMIN_DATA = {
        commissionRate: RATE,
        services: SERVICES,
        load: function () {
            var clientEdits = {};
            var registeredClients = [];
            try { clientEdits = JSON.parse(localStorage.getItem("teamlyAdminClientEdits") || "{}"); } catch (e) { clientEdits = {}; }
            try { registeredClients = JSON.parse(localStorage.getItem("teamlyRegisteredClients") || "[]"); } catch (e) { registeredClients = []; }
            if (!Array.isArray(registeredClients)) registeredClients = [];
            var allClients = clients.concat(registeredClients.filter(function (client) {
                return client && client.id && !clients.some(function (sample) { return sample.id === client.id; });
            }));
            return Promise.resolve({
                isDemo: true,
                admin: { name: "Sara" },
                clients: allClients.map(function (client) { return Object.assign({}, client, clientEdits[client.id] || {}); }), providers: providers, projects: projects,
                requests: requests, transactions: transactions, subscriptions: subscriptions
            });
        }
    };
})();
 
