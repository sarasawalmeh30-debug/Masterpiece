const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

const heroHubSvg = document.querySelector(".hero-hub-svg");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
if (heroHubSvg && typeof heroHubSvg.pauseAnimations === "function") {
    const syncHeroMotion = () => motionPreference.matches ? heroHubSvg.pauseAnimations() : heroHubSvg.unpauseAnimations();
    syncHeroMotion();
    motionPreference.addEventListener?.("change", syncHeroMotion);
}

const closingSection = document.querySelector(".closing-section");
const reduceMotion = motionPreference.matches;
if (closingSection && !reduceMotion && "IntersectionObserver" in window) {
    const closingObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => closingSection.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: 0.18 });
    closingObserver.observe(closingSection);
} else if (closingSection) {
    closingSection.classList.add("is-visible");
}

if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        contactStatus.textContent = "This form is not connected to message delivery yet, so your message was not sent. Please visit the Help Center for assistance.";
    });
}
