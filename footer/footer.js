fetch("../footer/footer.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer-container").innerHTML = data;
    const year = document.getElementById("footer-year");
    if (year) year.textContent = new Date().getFullYear();
    initializeFooterLogoConfetti();
  })
  .catch(error => console.error("Error loading footer:", error));

function initializeFooterLogoConfetti() {
  const footerLogo = document.querySelector(".footer-logo");
  const logoImage = footerLogo?.querySelector("img");
  if (!footerLogo || !logoImage) return;

  const positionConfettiAtImageCenter = () => {
    const logoRect = footerLogo.getBoundingClientRect();
    const imageRect = logoImage.getBoundingClientRect();
    footerLogo.style.setProperty("--confetti-origin-x", `${imageRect.left - logoRect.left + imageRect.width / 2}px`);
    footerLogo.style.setProperty("--confetti-origin-y", `${imageRect.top - logoRect.top + imageRect.height / 2}px`);
  };
  positionConfettiAtImageCenter();
  logoImage.addEventListener("load", positionConfettiAtImageCenter, { once: true });

  const confetti = [
    [-44, -62, -65, -16, -82, 72, -245, "#A8C9A5", 0],
    [-27, -78, -40, -28, -52, 102, 225, "#6F9B73", 70],
    [-5, -88, -8, -30, -12, 114, 285, "#A8C9A5", 130],
    [20, -74, 30, -24, 37, 92, -265, "#8CB17C", 45],
    [43, -58, 65, -12, 81, 68, 245, "#557F5A", 110],
    [61, -37, 82, -5, 98, 102, -235, "#A8C9A5", 180],
    [-62, -38, -82, -4, -98, 91, 235, "#557F5A", 90],
    [8, -96, 13, -34, 18, 122, -285, "#A8C9A5", 150],
    [-78, -12, -96, 5, -112, 82, 255, "#8CB17C", 35],
    [77, -16, 96, 7, 112, 89, -255, "#6F9B73", 125],
    [-48, -53, -69, -11, -91, 118, -275, "#6F9B73", 210],
    [48, -52, 69, -8, 90, 116, 275, "#A8C9A5", 80]
  ];

  confetti.forEach((item, index) => {
    const piece = document.createElement("span");
    piece.className = `footer-logo-confetti${index === 2 || index === 11 ? " dot" : ""}`;
    ["--confetti-burst-x", "--confetti-burst-y", "--confetti-fall-x", "--confetti-fall-y", "--confetti-x", "--confetti-y", "--confetti-rotate"].forEach((property, valueIndex) => {
      piece.style.setProperty(property, `${item[valueIndex]}px`);
    });
    piece.style.setProperty("--confetti-color", item[7]);
    piece.style.setProperty("--confetti-delay", `${item[8]}ms`);
    footerLogo.appendChild(piece);
  });

  const replayConfetti = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    footerLogo.classList.remove("is-confettiing");
    void footerLogo.offsetWidth;
    footerLogo.classList.add("is-confettiing");
  };

  footerLogo.addEventListener("pointerenter", replayConfetti);
  footerLogo.addEventListener("focus", replayConfetti);
}
