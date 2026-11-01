document.addEventListener("DOMContentLoaded", () => {
    const title = document.querySelector(".ai-intro h1");
    if (title && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const titleText = title.textContent.trim();
        const fragment = document.createDocumentFragment();
        let characterIndex = 0;

        title.setAttribute("aria-label", titleText);
        Array.from(titleText).forEach((character) => {
            if (/\s/.test(character)) {
                fragment.append(document.createTextNode(character));
                return;
            }

            const letter = document.createElement("span");
            letter.className = "ai-title-char";
            letter.setAttribute("aria-hidden", "true");
            letter.style.setProperty("--char-index", characterIndex++);
            letter.textContent = character;
            fragment.append(letter);
        });
        title.replaceChildren(fragment);
    }

    const orbitIcons = document.querySelectorAll(".ai-orbit-icon");
    const detailPanel = document.querySelector(".ai-service-detail");
    const emptyDetail = detailPanel?.querySelector(".ai-detail-empty");
    const activeDetail = detailPanel?.querySelector(".ai-detail-content");

    orbitIcons.forEach((button) => {
        button.addEventListener("click", () => {
            orbitIcons.forEach((iconButton) => iconButton.setAttribute("aria-pressed", String(iconButton === button)));

            const detailIcon = activeDetail.querySelector(".ai-detail-icon i");
            detailIcon.className = `fa ${button.dataset.icon}`;
            activeDetail.querySelector("h3").textContent = button.dataset.title;
            activeDetail.querySelector("p").textContent = button.dataset.description;
            emptyDetail.hidden = true;
            activeDetail.hidden = false;
        });
    });
});
