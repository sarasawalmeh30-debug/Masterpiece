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
    const activeDetail = detailPanel?.querySelector(".ai-detail-content");
    let activeIndex = 0;
    let autoCycle;

    const showService = (button) => {
        orbitIcons.forEach((iconButton) => iconButton.setAttribute("aria-pressed", String(iconButton === button)));

        const detailIcon = activeDetail.querySelector(".ai-detail-icon i");
        detailIcon.className = `fa ${button.dataset.icon}`;
        activeDetail.querySelector("h3").textContent = button.dataset.title;
        activeDetail.querySelector("p").textContent = button.dataset.description;
        activeDetail.hidden = false;
        detailPanel.hidden = false;
        detailPanel.classList.remove("is-visible");
        void detailPanel.offsetWidth;
        detailPanel.classList.add("is-visible");
        activeIndex = Array.from(orbitIcons).indexOf(button);
    };

    orbitIcons.forEach((button) => {
        button.addEventListener("click", () => {
            window.clearInterval(autoCycle);
            showService(button);
        });
    });

    if (orbitIcons.length && detailPanel && activeDetail) {
        showService(orbitIcons[0]);
        autoCycle = window.setInterval(() => {
            activeIndex = (activeIndex + 1) % orbitIcons.length;
            showService(orbitIcons[activeIndex]);
        }, 8000);
    }
});
