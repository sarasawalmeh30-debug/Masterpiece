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

    const serviceCards = document.querySelectorAll(".ai-service-card[role='button']");

    serviceCards.forEach((card) => {
        const toggleSelected = () => {
            const selected = card.getAttribute("aria-pressed") !== "true";
            card.setAttribute("aria-pressed", String(selected));
            card.classList.toggle("is-selected", selected);
        };

        card.addEventListener("click", toggleSelected);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleSelected();
            }
        });
    });
});
