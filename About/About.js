const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

if (contactForm && contactStatus) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        contactStatus.textContent = "This form is not connected to message delivery yet, so your message was not sent. Please visit the Help Center for assistance.";
    });
}
