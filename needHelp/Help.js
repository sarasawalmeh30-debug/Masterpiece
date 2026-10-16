document.addEventListener("DOMContentLoaded", () => {
const supportBack = document.getElementById("supportBack");
if (supportBack) {
    supportBack.addEventListener("click", event => {
        if (window.history.length > 1) {
            event.preventDefault();
            window.history.back();
        }
    });
}

// Load the existing sidebar
async function loadSidebar() {
const container = document.getElementById("sidebar-container");

    if (!container) return;

    try {
        const response = await fetch("../sidebar_client/sidbar.html");

        if (!response.ok) {
            throw new Error("Sidebar HTML not found");
        }

        container.innerHTML = await response.text();

        if (!document.querySelector('link[data-teamly-sidebar-css]')) {
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = "../sidebar_client/sidbar.css";
            css.dataset.teamlySidebarCss = "true";
            document.head.appendChild(css);
        }

        if (!document.querySelector('script[data-teamly-sidebar-js]')) {
            const script = document.createElement("script");
            script.src = "../sidebar_client/sidbar.js";
            script.dataset.teamlySidebarJs = "true";
            script.onerror = () => {
                console.error("Sidebar JavaScript failed to load.");
            };
            document.body.appendChild(script);
        }
    } catch (error) {
        console.error("Sidebar error:", error);
        container.innerHTML = `
            <p style="padding:20px;color:#b00020;">
                Sidebar failed to load. Check the file paths.
            </p>`;
    }
}

loadSidebar();

// Allow project/provider details to be supplied through the page URL.
// Example: support.html?project=My%20Project&provider=Ahmad&service=Photography
const params = new URLSearchParams(window.location.search);

const projectName = params.get("project");
const providerName = params.get("provider");
const providerService = params.get("service");

if (projectName) {
    document.getElementById("project-name").textContent = projectName;
}

if (providerName) {
    document.getElementById("provider-name").textContent = providerName;
}

if (providerService) {
    document.getElementById("provider-service").textContent = providerService;
}

// Show the subject field only when Others is selected.
const issueType = document.getElementById("issue-type");
const contactEmail = document.getElementById("contact-email");
const otherSubjectGroup = document.getElementById("other-subject-group");
const otherSubject = document.getElementById("other-subject");

issueType.disabled = !contactEmail.validity.valid;
contactEmail.addEventListener("input", () => {
    const validEmail = contactEmail.validity.valid && contactEmail.value.trim() !== "";
    issueType.disabled = !validEmail;

    if (!validEmail) {
        issueType.value = "";
        otherSubjectGroup.classList.add("hidden");
        otherSubject.required = false;
        otherSubject.value = "";
    }
});

issueType.addEventListener("change", () => {
    const isOther = issueType.value === "Others";

    otherSubjectGroup.classList.toggle("hidden", !isOther);
    otherSubject.required = isOther;

    if (!isOther) {
        otherSubject.value = "";
    }
});

// Description character counter.
const description = document.getElementById("problem-description");
const descriptionCount = document.getElementById("description-count");

description.addEventListener("input", () => {
    descriptionCount.textContent = description.value.length;
});

// Submit support request.
const form = document.getElementById("support-form");
const formMessage = document.getElementById("form-message");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedIssue = issueType.value;
    const email = contactEmail.value.trim();
    const subject = otherSubject.value.trim();
    const problemDescription = description.value.trim();

    if (!contactEmail.validity.valid || !email || !selectedIssue || !problemDescription || (selectedIssue === "Others" && !subject)) {
        formMessage.textContent = "Please complete all required fields.";
        formMessage.className = "form-message error";
        return;
    }

    // Front-end demonstration only: no server request is made.
    const request = {
        project: document.getElementById("project-name")?.textContent || params.get("project") || "",
        provider: document.getElementById("provider-name")?.textContent || params.get("provider") || "",
        email,
        issueType: selectedIssue,
        subject: selectedIssue === "Others" ? subject : selectedIssue,
        description: problemDescription,
        submittedAt: new Date().toISOString()
    };

    console.log("Demo support request:", request);

    formMessage.textContent =
        "Your support request has been prepared successfully. In the connected version, it will be sent to the Teamly support team.";

    formMessage.className = "form-message success";

    submitButton.innerHTML = '<i class="fa fa-check"></i> Request Prepared';
    submitButton.disabled = true;
});

// The real support chat will need to be connected to a chat page/service.
document.getElementById("support-chat-btn").addEventListener("click", () => {
    alert("Your support chat will be available once a Teamly support specialist connects with you.");
});

});
