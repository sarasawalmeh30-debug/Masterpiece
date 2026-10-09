document.addEventListener("DOMContentLoaded", function () {

const accountButtons = document.querySelectorAll(".account-button");

accountButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

        const targetPage = button.getAttribute("href");

        if (!targetPage) {
            event.preventDefault();
            return;
        }

        // The browser opens the selected registration page.
        // Make sure the target HTML file exists in your project.

    });

});

});