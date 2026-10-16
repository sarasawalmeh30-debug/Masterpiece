(() => {
    const container = document.getElementById("provider-sidebar-container");
    if (!container) return;

    fetch("provider_sidebar.html")
        .then(response => {
            if (!response.ok) throw new Error(`Could not load provider sidebar (${response.status}).`);
            return response.text();
        })
        .then(markup => {
            container.innerHTML = markup;
            initializeProviderSidebar(container);
        })
        .catch(error => {
            console.error("Provider sidebar failed to load:", error);
        });

    function initializeProviderSidebar(root) {
        const sidebar = root.querySelector("#providerSidebar");
        const openButton = root.querySelector("#providerSidebarToggle");
        const closeButton = root.querySelector("#providerSidebarClose");
        const scrim = root.querySelector("#providerSidebarScrim");
        if (!sidebar || !openButton || !closeButton || !scrim) return;

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
