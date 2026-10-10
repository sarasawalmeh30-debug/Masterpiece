document.addEventListener("DOMContentLoaded", function () {

const accountButtons = document.querySelectorAll("a.account-button");

accountButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

        const targetPage = button.getAttribute("href");

        if (!targetPage) {
            event.preventDefault();
            return;
        }

        // Native anchor navigation handles the existing registration page.

    });

});

});
