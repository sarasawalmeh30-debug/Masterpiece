document.addEventListener("DOMContentLoaded", function () {

const params = new URLSearchParams(window.location.search);
const returnTo = params.get("returnTo");
const safeReturnTo = returnTo === "../select_provider/select_provider.html" ? returnTo : "";
if (safeReturnTo) {
    document.querySelectorAll("a.account-button, .login-prompt a").forEach(function (link) {
        const target = new URL(link.getAttribute("href"), window.location.href);
        target.searchParams.set("returnTo", safeReturnTo);
        link.href = target.pathname + target.search;
    });
}

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
