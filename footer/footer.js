fetch("../footer/footer.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer-container").innerHTML = data;
    const year = document.getElementById("footer-year");
    if (year) year.textContent = new Date().getFullYear();
  })
  .catch(error => console.error("Error loading footer:", error));
