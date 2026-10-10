
fetch("../navbar/nav.html")
    .then(response => {
        if (!response.ok) throw new Error("Navbar HTML could not be loaded.");
        return response.text();
    })
    .then(data => {
        const container = document.getElementById("navbar-container");
        if (!container) return;
        container.innerHTML = data;
        initializeNavbar();
    })
    .catch(error => console.error("Error loading navbar:", error));

function initializeNavbar() {
const navbar = document.getElementById("navbar");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const navItems = document.querySelectorAll(".nav-link");
if (!navbar || !menuToggle || !navLinks) return;

// Mark the section/page this shared navigation points to when the page opens.
const currentUrl = new URL(window.location.href);
const isHomePage = currentUrl.pathname.toLowerCase().endsWith("/home_page/home.html");
const isAboutPage = currentUrl.pathname.toLowerCase().endsWith("/about/about.html");
navItems.forEach((link) => {
    const targetUrl = new URL(link.href, window.location.href);
    const samePage = targetUrl.pathname.toLowerCase() === currentUrl.pathname.toLowerCase();
    const isCurrent = isAboutPage
        ? samePage && targetUrl.hash === "#about"
        : samePage && (currentUrl.hash ? targetUrl.hash === currentUrl.hash : (isHomePage && targetUrl.hash === "#home"));
    link.classList.toggle("active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
});

// Navbar scroll effect
function handleScroll() {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
}

window.addEventListener("scroll", handleScroll);

handleScroll();

// Open and close mobile menu
menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("show");

    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
});

// Close menu when clicking a navigation link
navItems.forEach((link) => {
    link.addEventListener("click", () => {
        navItems.forEach((item) => {
            item.classList.remove("active");
            item.removeAttribute("aria-current");
        });

        link.classList.add("active");
        link.setAttribute("aria-current", "page");

        navLinks.classList.remove("show");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

// Close menu when clicking outside
document.addEventListener("click", (event) => {
    if (
        !navbar.contains(event.target) &&
        navLinks.classList.contains("show")
    ) {
        navLinks.classList.remove("show");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }
});

// Close menu when pressing Escape
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        navLinks.classList.remove("show");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }
});
}
