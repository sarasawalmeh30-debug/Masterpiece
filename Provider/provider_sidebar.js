(() => {
    const container = document.getElementById("provider-sidebar-container");
    if (!container) return;

    const sidebarMarkupUrl = new URL("provider_sidebar.html", document.currentScript.src);
    fetch(sidebarMarkupUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Could not load provider sidebar (${response.status}).`);
            return response.text();
        })
        .then(markup => {
            container.innerHTML = markup;
            initializeProviderSidebar(container, sidebarMarkupUrl);
        })
        .catch(error => {
            console.error("Provider sidebar failed to load:", error);
        });

    function initializeProviderSidebar(root, markupUrl) {
        root.querySelectorAll("a[href]").forEach(link => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(href)) return;
            link.href = new URL(href, markupUrl).href;
        });

        const sidebar = root.querySelector("#providerSidebar");
        const openButton = root.querySelector("#providerSidebarToggle");
        const closeButton = root.querySelector("#providerSidebarClose");
        const scrim = root.querySelector("#providerSidebarScrim");
        if (!sidebar || !openButton || !closeButton || !scrim) return;

        const scrollArea = sidebar.querySelector(".provider-sidebar-scroll-content");
        const scrollTrack = sidebar.querySelector(".provider-sidebar-scroll-track");
        const scrollThumb = sidebar.querySelector(".provider-sidebar-scroll-thumb");
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

        const closeDrawer = () => {
            sidebar.classList.remove("is-open");
            scrim.classList.remove("is-visible");
            document.body.classList.remove("provider-drawer-open");
            openButton.setAttribute("aria-expanded", "false");
        };
        const openDrawer = () => {
            sidebar.classList.add("is-open");
            scrim.classList.add("is-visible");
            document.body.classList.add("provider-drawer-open");
            openButton.setAttribute("aria-expanded", "true");
            closeButton.focus();
        };

        openButton.addEventListener("click", openDrawer);
        closeButton.addEventListener("click", () => {
            closeDrawer();
            openButton.focus();
        });
        scrim.addEventListener("click", closeDrawer);
        document.addEventListener("keydown", event => {
            if (!sidebar.classList.contains("is-open")) return;
            if (event.key === "Escape") {
                closeDrawer();
                openButton.focus();
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        const currentPath = window.location.pathname.toLowerCase();
        const sidebarActivePath = currentPath.endsWith("/payment.html")
            ? currentPath.replace(/payment\.html$/, "subscription.html")
            : currentPath;
        sidebar.querySelectorAll("a[data-provider-nav]").forEach(link => {
            const targetPath = new URL(link.href, window.location.href).pathname.toLowerCase();
            const active = targetPath === sidebarActivePath;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
            link.addEventListener("click", closeDrawer);
        });

        const provider = readProviderProfile();
        const providerName = provider && (provider.companyName || provider.fullName || provider.name || provider.displayName);
        if (typeof providerName === "string" && providerName.trim()) {
            const displayName = providerName.trim();
            root.querySelector("#providerSidebarName").textContent = displayName;
            root.querySelector("#providerSidebarAvatar").textContent = displayName.charAt(0).toUpperCase();
        }
        const accountLabel = root.querySelector(".provider-profile-copy small");
        const providerType = provider && String(provider.accountType || provider.providerType || "").toLowerCase();
        accountLabel.textContent = providerType === "company" ? "Company account" : "Provider account";

        const logoutLink = root.querySelector("#providerLogout");
        logoutLink.addEventListener("click", () => {
            // This matches the app's existing demo logout behavior used by the client sidebar.
            try {
                window.sessionStorage.removeItem("teamlyLoggedIn");
            } catch (error) {
                // Continue to the existing login page if browser storage is unavailable.
            }
        });
    }

    function readProviderProfile() {
        try {
            const value = window.localStorage.getItem("teamlyProviderProfile");
            return value ? JSON.parse(value) : null;
        } catch (error) {
            return null;
        }
    }
})();
