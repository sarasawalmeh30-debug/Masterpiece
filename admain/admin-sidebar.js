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

        const scrollArea = sidebar.querySelector(".admin-sidebar-scroll-content");
        const scrollTrack = sidebar.querySelector(".admin-sidebar-scroll-track");
        const scrollThumb = sidebar.querySelector(".admin-sidebar-scroll-thumb");
        if (scrollArea && scrollTrack && scrollThumb) {
            let dragOffset = 0;
            const syncScrollbar = () => {
                const trackHeight = scrollTrack.clientHeight;
                if (!trackHeight) return;
                const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
                const thumbHeight = Math.min(trackHeight, 32);
                const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
                const progress = maxScroll > 0 ? scrollArea.scrollTop / maxScroll : 0;
                scrollThumb.style.height = `${thumbHeight}px`;
                scrollThumb.style.top = `${progress * maxThumbTop}px`;
                scrollTrack.classList.toggle("is-needed", maxScroll > 1);
                scrollThumb.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
            };
            const setScrollFromPointer = clientY => {
                const rect = scrollTrack.getBoundingClientRect();
                const thumbHeight = scrollThumb.offsetHeight;
                const maxThumbTop = Math.max(0, rect.height - thumbHeight);
                const nextTop = Math.min(maxThumbTop, Math.max(0, clientY - rect.top - dragOffset));
                const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
                scrollArea.scrollTop = maxThumbTop ? nextTop / maxThumbTop * maxScroll : 0;
            };
            scrollThumb.addEventListener("pointerdown", event => {
                event.preventDefault(); dragOffset = event.clientY - scrollThumb.getBoundingClientRect().top;
                scrollThumb.setPointerCapture(event.pointerId); scrollThumb.classList.add("is-dragging"); scrollArea.style.scrollBehavior = "auto";
            });
            scrollThumb.addEventListener("pointermove", event => { if (scrollThumb.hasPointerCapture(event.pointerId)) setScrollFromPointer(event.clientY); });
            const stopDragging = () => { scrollThumb.classList.remove("is-dragging"); scrollArea.style.scrollBehavior = ""; };
            ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => scrollThumb.addEventListener(type, stopDragging));
            scrollTrack.addEventListener("pointerdown", event => {
                if (event.target === scrollThumb || scrollThumb.contains(event.target)) return;
                dragOffset = scrollThumb.offsetHeight / 2; setScrollFromPointer(event.clientY);
            });
            scrollTrack.addEventListener("wheel", event => { scrollArea.scrollTop += event.deltaY; event.preventDefault(); }, { passive:false });
            scrollThumb.addEventListener("keydown", event => {
                const page = scrollArea.clientHeight * .8;
                if (event.key === "ArrowDown") scrollArea.scrollTop += 36;
                else if (event.key === "ArrowUp") scrollArea.scrollTop -= 36;
                else if (event.key === "PageDown") scrollArea.scrollTop += page;
                else if (event.key === "PageUp") scrollArea.scrollTop -= page;
                else if (event.key === "Home") scrollArea.scrollTop = 0;
                else if (event.key === "End") scrollArea.scrollTop = scrollArea.scrollHeight;
                else return;
                event.preventDefault();
            });
            scrollArea.addEventListener("scroll", syncScrollbar, { passive:true });
            window.addEventListener("resize", syncScrollbar);
            const observer = new ResizeObserver(syncScrollbar);
            observer.observe(scrollArea);
            Array.from(scrollArea.children).forEach(child => observer.observe(child));
            window.addEventListener("load", syncScrollbar, { once:true });
            syncScrollbar(); requestAnimationFrame(syncScrollbar);
        }
 
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
 
