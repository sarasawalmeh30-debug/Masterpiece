function initializeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const openButton = document.getElementById("sidebarOpen");
    const closeButton = document.getElementById("sidebarClose");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar || sidebar.dataset.initialized === "true") return;
    sidebar.dataset.initialized = "true";

    const scrollTrack = sidebar.querySelector(".sidebar-scroll-track");
    const scrollThumb = sidebar.querySelector(".sidebar-scroll-thumb");
    const scrollArea = sidebar.querySelector(".sidebar-scroll-content") || sidebar;
    if (scrollTrack && scrollThumb && scrollArea) {
    let dragOffset = 0;

    const syncScrollbar = () => {
        const trackHeight = scrollTrack.clientHeight;
        if (!trackHeight || !scrollArea.scrollHeight) return;
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
        const trackRect = scrollTrack.getBoundingClientRect();
        const thumbHeight = scrollThumb.offsetHeight;
        const maxThumbTop = Math.max(0, trackRect.height - thumbHeight);
        const nextTop = Math.min(maxThumbTop, Math.max(0, clientY - trackRect.top - dragOffset));
        const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
        scrollArea.scrollTop = maxThumbTop ? nextTop / maxThumbTop * maxScroll : 0;
    };

    scrollThumb.addEventListener("pointerdown", event => {
        event.preventDefault();
        dragOffset = event.clientY - scrollThumb.getBoundingClientRect().top;
        scrollThumb.setPointerCapture(event.pointerId);
        scrollThumb.classList.add("is-dragging");
        scrollArea.style.scrollBehavior = "auto";      // بدون تأخير وقت السحب
    });
    scrollThumb.addEventListener("pointermove", event => {
        if (scrollThumb.hasPointerCapture(event.pointerId)) setScrollFromPointer(event.clientY);
    });
    const stopDragging = () => {
        scrollThumb.classList.remove("is-dragging");
        scrollArea.style.scrollBehavior = "";
    };
    scrollThumb.addEventListener("pointerup", stopDragging);
    scrollThumb.addEventListener("pointercancel", stopDragging);
    scrollThumb.addEventListener("lostpointercapture", stopDragging);

    scrollTrack.addEventListener("pointerdown", event => {
        if (event.target === scrollThumb || scrollThumb.contains(event.target)) return;
        dragOffset = scrollThumb.offsetHeight / 2;
        setScrollFromPointer(event.clientY);
    });
    scrollTrack.addEventListener("wheel", event => {
        scrollArea.scrollTop += event.deltaY;
        event.preventDefault();
    }, { passive: false });

    scrollThumb.addEventListener("keydown", event => {
        const page = scrollArea.clientHeight * 0.8;
        if (event.key === "ArrowDown") scrollArea.scrollTop += 36;
        else if (event.key === "ArrowUp") scrollArea.scrollTop -= 36;
        else if (event.key === "PageDown") scrollArea.scrollTop += page;
        else if (event.key === "PageUp") scrollArea.scrollTop -= page;
        else if (event.key === "Home") scrollArea.scrollTop = 0;
        else if (event.key === "End") scrollArea.scrollTop = scrollArea.scrollHeight;
        else return;
        event.preventDefault();
    });

    scrollArea.addEventListener("scroll", syncScrollbar, { passive: true });
    window.addEventListener("resize", syncScrollbar);
    window.addEventListener("load", syncScrollbar);

    // يراقب المحتوى نفسه مش بس الحاوية
    const resizeObserver = new ResizeObserver(syncScrollbar);
    resizeObserver.observe(scrollArea);
    Array.from(scrollArea.children).forEach(child => resizeObserver.observe(child));

    scrollArea.querySelectorAll("img").forEach(img => {
        if (!img.complete) img.addEventListener("load", syncScrollbar, { once: true });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncScrollbar);

    syncScrollbar();
    requestAnimationFrame(syncScrollbar);
}

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
