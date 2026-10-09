
fetch("./sidebar_client/sidebar.html")
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load sidebar.html");
        }

        return response.text();
    })
    .then(function (html) {
        document.getElementById("sidebar-container").innerHTML = html;

        initializeSidebar();
    })
    .catch(function (error) {
        console.error("Sidebar loading error:", error);
    });

function initializeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const openButton = document.getElementById("sidebarOpen");
    const closeButton = document.getElementById("sidebarClose");
    const overlay = document.getElementById("sidebarOverlay");

    function openSidebar() {
        sidebar.classList.add("open");
        overlay.classList.add("show");
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    }

    openButton.addEventListener("click", openSidebar);
    closeButton.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    // Highlight the current page
    const currentPage = window.location.pathname
        .split("/")
        .pop() || "dashboard.html";

    sidebar.querySelectorAll(".sidebar-link").forEach(function (link) {
        const linkPage = link.getAttribute("href").split("/").pop();

        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });

    // Close the sidebar after selecting a link on mobile
    sidebar.querySelectorAll(".sidebar-link").forEach(function (link) {
        link.addEventListener("click", closeSidebar);
    });
}
