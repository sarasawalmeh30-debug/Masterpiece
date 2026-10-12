function initializeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const openButton = document.getElementById("sidebarOpen");
    const closeButton = document.getElementById("sidebarClose");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar || sidebar.dataset.initialized === "true") return;
    sidebar.dataset.initialized = "true";

    const openSidebar = () => {
        sidebar.classList.add("open");
        if (overlay) overlay.classList.add("show");
        if (openButton) openButton.setAttribute("aria-expanded", "true");
    };
    const closeSidebar = () => {
        sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("show");
        if (openButton) openButton.setAttribute("aria-expanded", "false");
    };

    if (openButton) openButton.addEventListener("click", openSidebar);
    if (closeButton) closeButton.addEventListener("click", closeSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);
    const logoutLink = sidebar.querySelector(".sidebar-logout");
    if (logoutLink) {
        logoutLink.addEventListener("click", () => {
            try {
                sessionStorage.removeItem("teamlyLoggedIn");
            } catch (error) {
                // The sidebar still navigates to login if storage is unavailable.
            }
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeSidebar();
    });

    const currentPath = window.location.pathname.toLowerCase();
    sidebar.querySelectorAll(".sidebar-link[href]").forEach(link => {
        const linkPath = new URL(link.href, window.location.href).pathname.toLowerCase();
        const isCurrentPage = linkPath === currentPath;
        link.classList.toggle("active", isCurrentPage);
        if (isCurrentPage) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
        link.addEventListener("click", closeSidebar);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSidebar);
} else {
    initializeSidebar();
}

new MutationObserver(initializeSidebar).observe(document.documentElement, {
    childList: true,
    subtree: true
});
