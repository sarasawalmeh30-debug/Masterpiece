document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("providerRegisterForm");
    const fields = {
        fullName: document.getElementById("fullName"),
        email: document.getElementById("email"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        service: document.getElementById("service")
    };
    const photosInput = document.getElementById("photos");
    const previewGrid = document.getElementById("photoPreviews");
    const dropZone = document.getElementById("dropZone");
    const videoInput = document.getElementById("videoFile");
    const videoDropZone = document.getElementById("videoDropZone");
    const selectedVideo = document.getElementById("selectedVideo");
    const selectedVideoName = document.getElementById("selectedVideoName");
    const removeVideo = document.getElementById("removeVideo");
    const formMessage = document.getElementById("formMessage");
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    let selectedFiles = [];
    let previewUrls = [];

    function setError(id, message, control) {
        document.getElementById(id + "Error").textContent = message;
        if (control) {
            control.classList.toggle("input-invalid", Boolean(message));
            control.setAttribute("aria-invalid", String(Boolean(message)));
        }
    }

    document.querySelectorAll(".password-toggle").forEach(function (button) {
        button.addEventListener("click", function () {
            const input = document.getElementById(button.dataset.target);
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            button.setAttribute("aria-label", show ? "Hide password" : "Show password");
            button.querySelector("i").className = show ? "fa fa-eye" : "fa fa-eye-slash";
        });
    });

    Object.values(fields).forEach(function (field) {
        field.addEventListener("input", function () {
            field.classList.remove("input-invalid");
            field.removeAttribute("aria-invalid");
            const error = document.getElementById(field.id + "Error");
            if (error) error.textContent = "";
            formMessage.textContent = "";
        });
        field.addEventListener("change", function () {
            field.classList.remove("input-invalid");
            field.removeAttribute("aria-invalid");
            const error = document.getElementById(field.id + "Error");
            if (error) error.textContent = "";
            formMessage.textContent = "";
        });
    });

    function syncInputFiles() {
        const transfer = new DataTransfer();
        selectedFiles.forEach(function (file) { transfer.items.add(file); });
        photosInput.files = transfer.files;
    }

    function renderPreviews() {
        previewUrls.forEach(URL.revokeObjectURL);
        previewUrls = [];
        previewGrid.replaceChildren();
        selectedFiles.forEach(function (file, index) {
            const url = URL.createObjectURL(file);
            previewUrls.push(url);
            const item = document.createElement("div");
            item.className = "preview-item";
            const image = document.createElement("img");
            image.src = url;
            image.alt = file.name;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-photo";
            remove.setAttribute("aria-label", "Remove " + file.name);
            remove.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
            remove.addEventListener("click", function () {
                selectedFiles.splice(index, 1);
                syncInputFiles();
                renderPreviews();
            });
            item.append(image, remove);
            previewGrid.append(item);
        });
        document.getElementById("photosError").textContent = "";
    }

    function addFiles(fileList) {
        const incoming = Array.from(fileList);
        const invalid = incoming.some(function (file) { return !allowedTypes.has(file.type); });
        if (invalid) {
            setError("photos", "Choose JPG, JPEG, PNG, or WEBP images only.", photosInput);
            return;
        }
        incoming.forEach(function (file) {
            if (!selectedFiles.some(function (existing) {
                return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
            })) selectedFiles.push(file);
        });
        syncInputFiles();
        renderPreviews();
        formMessage.textContent = "";
    }

    photosInput.addEventListener("change", function () { addFiles(photosInput.files); });
    dropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); photosInput.click(); }
    });
    ["dragenter", "dragover"].forEach(function (name) {
        dropZone.addEventListener(name, function (event) { event.preventDefault(); dropZone.classList.add("is-dragging"); });
    });
    ["dragleave", "drop"].forEach(function (name) {
        dropZone.addEventListener(name, function (event) { event.preventDefault(); dropZone.classList.remove("is-dragging"); });
    });
    dropZone.addEventListener("drop", function (event) { addFiles(event.dataTransfer.files); });

    function clearVideoError() {
        document.getElementById("videoFileError").textContent = "";
        videoInput.removeAttribute("aria-invalid");
    }

    function acceptVideo(file) {
        const extensions = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
        const extension = file.name.split(".").pop().toLowerCase();
        const expectedType = extensions[extension];
        return Boolean(expectedType && (!file.type || file.type === expectedType));
    }

    function setVideo(file) {
        if (!file) return;
        if (!acceptVideo(file)) {
            videoInput.value = "";
            selectedVideo.hidden = true;
            document.getElementById("videoFileError").textContent = "Choose a video in MP4, MOV, or WEBM format.";
            videoInput.setAttribute("aria-invalid", "true");
            return;
        }
        clearVideoError();
        selectedVideoName.textContent = file.name;
        selectedVideo.hidden = false;
        formMessage.textContent = "";
    }

    videoInput.addEventListener("change", function () {
        setVideo(videoInput.files && videoInput.files[0]);
    });
    videoDropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            videoInput.click();
        }
    });
    ["dragenter", "dragover"].forEach(function (name) {
        videoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            videoDropZone.classList.add("is-dragging");
        });
    });
    ["dragleave", "drop"].forEach(function (name) {
        videoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            videoDropZone.classList.remove("is-dragging");
        });
    });
    videoDropZone.addEventListener("drop", function (event) {
        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        videoInput.files = transfer.files;
        setVideo(file);
    });
    removeVideo.addEventListener("click", function () {
        videoInput.value = "";
        selectedVideo.hidden = true;
        selectedVideoName.textContent = "";
        clearVideoError();
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        formMessage.textContent = "";
        let valid = true;
        function fail(id, message, control) { setError(id, message, control); valid = false; }

        if (fields.fullName.value.trim().length < 2) fail("fullName", "Enter your full name.", fields.fullName);
        else setError("fullName", "", fields.fullName);

        if (!fields.email.validity.valid || !fields.email.value.trim()) fail("email", "Enter a valid email address.", fields.email);
        else setError("email", "", fields.email);

        if (fields.password.value.length < 8) fail("password", "Use at least 8 characters.", fields.password);
        else setError("password", "", fields.password);

        if (!fields.confirmPassword.value || fields.confirmPassword.value !== fields.password.value) fail("confirmPassword", "Passwords do not match.", fields.confirmPassword);
        else setError("confirmPassword", "", fields.confirmPassword);

        if (!fields.service.value) fail("service", "Choose the service you offer.", fields.service);
        else setError("service", "", fields.service);

        if (!selectedFiles.length) {
            document.getElementById("photosError").textContent = "Add at least one photo to your portfolio.";
            photosInput.setAttribute("aria-invalid", "true");
            valid = false;
        } else {
            document.getElementById("photosError").textContent = "";
            photosInput.removeAttribute("aria-invalid");
        }

        if (!valid) {
            formMessage.textContent = "Please review the highlighted fields.";
            const firstInvalid = form.querySelector("[aria-invalid='true']");
            if (firstInvalid) {
                if (firstInvalid === photosInput) dropZone.focus();
                else firstInvalid.focus();
            }
            return;
        }

        window.location.href = "../home_page/home.html";
    });
});
