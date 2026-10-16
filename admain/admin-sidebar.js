(() => {
    const container = document.getElementById("admin-sidebar-container");
    if (!container) return;
 
    fetch("admin-sidebar.html")
        .then(r => { if (!r.ok) throw new Error("Could not load admin sidebar (" + r.status + ")."); return r.text(); })
        .then(markup => { container.innerHTML = markup; init(container); document.dispatchEvent(new CustomEvent("admin-sidebar-ready")); })
        .catch(err => console.error("Admin sidebar failed to load:", err));
 
    function init(root) {
        const sidebar = root.querySelector("#adminSidebar");
        const openBtn = root.querySelector("#adminSidebarToggle");
        const closeBtn = root.querySelector("#adminSidebarClose");
        const scrim = root.querySelector("#adminSidebarScrim");
        if (!sidebar || !openBtn || !closeBtn || !scrim) return;
 
        const close = () => {
            sidebar.classList.remove("is-open"); scrim.classList.remove("is-visible");
            document.body.classList.remove("admin-drawer-open"); openBtn.setAttribute("aria-expanded", "false");
        };
        const open = () => {
            sidebar.classList.add("is-open"); scrim.classList.add("is-visible");
            document.body.classList.add("admin-drawer-open"); openBtn.setAttribute("aria-expanded", "true"); closeBtn.focus();
        };
        openBtn.addEventListener("click", open);
        closeBtn.addEventListener("click", () => { close(); openBtn.focus(); });
        scrim.addEventListener("click", close);
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && sidebar.classList.contains("is-open")) { close(); openBtn.focus(); }
        });
 
        // Active link follows the section id in the URL hash (default: overview).
        const links = [...sidebar.querySelectorAll("a[data-admin-nav]")];
        const setActive = key => links.forEach(a => {
            const on = a.dataset.adminNav === key;
            a.classList.toggle("is-active", on);
            if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
        });
        const normalizeKey = key => key === "signups" ? "clients" : key;
        const currentPath = location.pathname;
        const pageKey = /\/clients\.html$/i.test(currentPath) ? "clients" : /\/providers\.html$/i.test(currentPath) ? "providers" : /\/requests\.html$/i.test(currentPath) ? "requests" : /\/projects\.html$/i.test(currentPath) ? "projects" : /\/financial\.html$/i.test(currentPath) ? "payments" : /\/notifications\.html$/i.test(currentPath) ? "activity" : /\/services\.html$/i.test(currentPath) ? "services" : /\/settings\.html$/i.test(currentPath) ? "settings" : null;
        const fromHash = () => setActive(pageKey || normalizeKey((location.hash || "#overview").slice(1)));
        links.forEach(a => a.addEventListener("click", () => { close(); setActive(a.dataset.adminNav); }));
        window.addEventListener("hashchange", fromHash);
        fromHash();
 
        const name = (window.TEAMLY_ADMIN_NAME || "").trim();
        if (name) {
            root.querySelector("#adminSidebarName").textContent = name;
            root.querySelector("#adminSidebarAvatar").textContent = name.charAt(0).toUpperCase();
        }
        root.querySelector("#adminLogout").addEventListener("click", () => {
            try { sessionStorage.removeItem("teamlyLoggedIn"); } catch (e) { /* continue to login page */ }
        });
    }
})();
 
