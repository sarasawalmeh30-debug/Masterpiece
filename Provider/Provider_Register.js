document.addEventListener("DOMContentLoaded", function () {
    const individualPanel = document.getElementById("individualRegistration");
    const companyPanel = document.getElementById("companyRegistration");
    const registrationTypeButtons = document.querySelectorAll("[data-registration-type]");
    const serviceSelect = document.getElementById("service");
    const serviceCardField = document.getElementById("serviceOrbit");
    const serviceOrbitStage = document.getElementById("serviceOrbitStage");
    const serviceGlassCards = Array.from(document.querySelectorAll(".service-glass-card[data-service]"));
    const serviceIconRain = document.getElementById("serviceIconRain");
    const companyServicesCard = document.getElementById("companyServicesCard");
    const companyServicesCardList = document.getElementById("companyServicesCardList");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let selectionVersion = 0;
    const serviceIcons = {
        "Photography": "fa-camera",
        "Videography": "fa-video-camera",
        "Event Staff": "fa-users",
        "Event Planners": "fa-calendar-check-o",
        "Favors & Gifts": "fa-gift",
        "Decoration": "fa-pagelines",
        "Catering": "fa-birthday-cake",
        "Music & DJ": "fa-music",
        "Video Editing": "fa-film",
        "Venues & Halls": "fa-building",
        "Special Effects": "fa-magic"
    };

    function celebrateServiceCard(services) {
        serviceIconRain.replaceChildren();
        const validServices = services.filter(function (service) { return serviceIcons[service]; });
        if (!validServices.length) return;
        const isCompany = serviceOrbitStage.classList.contains("company-selection");
        const dropCount = isCompany ? validServices.length * 2 : 10;
        const stageRect = serviceOrbitStage.getBoundingClientRect();
        const companyChips = isCompany ? Array.from(companyServicesCardList.children) : [];

        for (let index = 0; index < dropCount; index += 1) {
            const serviceIndex = isCompany ? Math.floor(index / 2) : 0;
            const piece = document.createElement("span");
            piece.className = "fa " + serviceIcons[validServices[serviceIndex]] + " service-icon-drop";
            if (isCompany && companyChips[serviceIndex]) {
                const chipRect = companyChips[serviceIndex].getBoundingClientRect();
                piece.style.setProperty("--icon-x", (chipRect.left - stageRect.left + chipRect.width / 2 - serviceOrbitStage.clientWidth / 2) + "px");
                piece.style.setProperty("--icon-top", (chipRect.top - stageRect.top + chipRect.height / 2) + "px");
            } else {
                piece.style.setProperty("--icon-x", (Math.random() * serviceOrbitStage.clientWidth * 0.96 - serviceOrbitStage.clientWidth * 0.48) + "px");
            }
            piece.style.setProperty("--icon-drift", (Math.random() * 16 - 8) + "px");
            piece.style.setProperty("--icon-rotate", (Math.random() * 16 - 8) + "deg");
            piece.style.setProperty("--icon-delay", index * 300 + Math.random() * 180 + "ms");
            piece.style.setProperty("--icon-duration", 4200 + Math.random() * 1200 + "ms");
            piece.style.setProperty("--icon-color", index % 4 === 0 ? "#A88945" : "#527958");
            serviceIconRain.appendChild(piece);
        }
    }

    function highlightProvidedService(service) {
        selectionVersion += 1;
        const currentVersion = selectionVersion;
        const selectedCard = serviceGlassCards.find(function (card) {
            return card.dataset.service === service;
        });

        serviceGlassCards.forEach(function (card) {
            card.classList.remove("is-winner");
            card.style.removeProperty("--away-x");
            card.style.removeProperty("--away-y");
        });
        serviceOrbitStage.classList.remove("has-selection");
        serviceOrbitStage.classList.remove("company-selection");
        serviceCardField.classList.remove("company-mode-active");
        serviceCardField.style.removeProperty("height");
        companyServicesCard.hidden = true;
        serviceIconRain.replaceChildren();

        if (!selectedCard) {
            return;
        }

        const stageCenterX = serviceOrbitStage.clientWidth / 2;
        const stageCenterY = serviceOrbitStage.clientHeight / 2;
        serviceGlassCards.forEach(function (card) {
            if (card === selectedCard) return;
            const deltaX = card.offsetLeft + card.offsetWidth / 2 - stageCenterX;
            const deltaY = card.offsetTop + card.offsetHeight / 2 - stageCenterY;
            const distance = Math.max(1, Math.hypot(deltaX, deltaY));
            card.style.setProperty("--away-x", (deltaX / distance * 64) + "px");
            card.style.setProperty("--away-y", "24px");
        });

        serviceOrbitStage.classList.add("has-selection");
        selectedCard.classList.add("is-winner");

        if (reducedMotion.matches) return;
        window.setTimeout(function () {
            if (currentVersion === selectionVersion) celebrateServiceCard([service]);
        }, 760);
    }

    function highlightCompanyServices(services) {
        selectionVersion += 1;
        const currentVersion = selectionVersion;
        serviceGlassCards.forEach(function (card) {
            card.classList.remove("is-winner");
            card.classList.remove("is-contained");
            card.style.removeProperty("--away-x");
            card.style.removeProperty("--away-y");
            card.style.removeProperty("--company-x");
            card.style.removeProperty("--company-y");
        });
        serviceIconRain.replaceChildren();
        const validServices = services.filter(function (service) { return serviceIcons[service]; });
        companyServicesCardList.replaceChildren();
        validServices.forEach(function (service) {
            const containedCard = document.createElement("span");
            const icon = document.createElement("i");
            icon.className = "fa " + serviceIcons[service];
            icon.setAttribute("aria-hidden", "true");
            containedCard.className = "company-contained-service";
            containedCard.append(icon, document.createTextNode(service));
            companyServicesCardList.appendChild(containedCard);
        });
        const surroundingCards = serviceGlassCards.filter(function (card) {
            const isSelected = validServices.includes(card.dataset.service);
            card.classList.toggle("is-contained", isSelected);
            return !isSelected;
        });
        companyServicesCard.hidden = validServices.length === 0;
        serviceOrbitStage.classList.toggle("company-selection", validServices.length > 0);
        serviceOrbitStage.classList.toggle("has-selection", validServices.length > 0);
        serviceCardField.classList.toggle("company-mode-active", validServices.length > 0);
        if (!validServices.length) {
            serviceCardField.style.removeProperty("height");
            return;
        }

        const stageWidth = serviceOrbitStage.clientWidth;
        const serviceCardWidth = parseFloat(window.getComputedStyle(serviceGlassCards[0]).width);
        const serviceCardHeight = parseFloat(window.getComputedStyle(serviceGlassCards[0]).height);
        const columnGap = (stageWidth - serviceCardWidth * 3) / 4;
        const boxHeight = companyServicesCard.offsetHeight;
        const rows = Math.ceil(surroundingCards.length / 3);
        surroundingCards.forEach(function (card, index) {
            const row = Math.floor(index / 3);
            const rowStart = row * 3;
            const cardsInRow = Math.min(3, surroundingCards.length - rowStart);
            const columnOffset = (3 - cardsInRow) / 2;
            const column = index % 3;
            const x = columnGap + (columnOffset + column) * (serviceCardWidth + columnGap);
            const y = boxHeight + 18 + row * (serviceCardHeight + 14);
            card.style.setProperty("--company-x", x + "px");
            card.style.setProperty("--company-y", y + "px");
        });
        const cardsHeight = surroundingCards.length
            ? 18 + rows * serviceCardHeight + (rows - 1) * 14
            : 0;
        serviceCardField.style.height = Math.max(276, boxHeight + cardsHeight + 12) + "px";
        if (!validServices.length || reducedMotion.matches) return;
        window.setTimeout(function () {
            if (currentVersion === selectionVersion) celebrateServiceCard(validServices);
        }, 760);
    }

    serviceSelect.addEventListener("change", function () {
        highlightProvidedService(serviceSelect.value);
    });

    registrationTypeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const showIndividual = button.dataset.registrationType === "individual";
            individualPanel.hidden = !showIndividual;
            companyPanel.hidden = showIndividual;
            if (showIndividual) {
                highlightProvidedService(serviceSelect.value);
            } else {
                const selectedCompanyServices = Array.from(document.querySelectorAll("input[name='companyServices']:checked"))
                    .map(function (checkbox) { return checkbox.value; });
                highlightCompanyServices(selectedCompanyServices);
            }
            registrationTypeButtons.forEach(function (typeButton) {
                const isActive = typeButton === button;
                typeButton.classList.toggle("is-active", isActive);
                typeButton.setAttribute("aria-pressed", String(isActive));
            });
        });
    });

    const companyServiceDropdown = document.getElementById("companyServiceDropdown");
    const companyServiceTrigger = document.getElementById("companyServiceTrigger");
    const companyServiceMenu = document.getElementById("companyServiceMenu");
    const companyServiceSelection = document.getElementById("companyServiceSelection");
    const companyServiceCheckboxes = companyServiceMenu.querySelectorAll("input[type='checkbox']");

    function closeCompanyServiceMenu() {
        companyServiceMenu.hidden = true;
        companyServiceTrigger.setAttribute("aria-expanded", "false");
    }

    companyServiceTrigger.addEventListener("click", function () {
        const isOpening = companyServiceMenu.hidden;
        companyServiceMenu.hidden = !isOpening;
        companyServiceTrigger.setAttribute("aria-expanded", String(isOpening));
    });
    companyServiceCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            const selected = Array.from(companyServiceCheckboxes)
                .filter(function (item) { return item.checked; })
                .map(function (item) { return item.value; });
            companyServiceSelection.textContent = selected.length ? selected.join(", ") : "Choose your services";
            highlightCompanyServices(selected);
        });
    });
    document.addEventListener("click", function (event) {
        if (!companyServiceDropdown.contains(event.target)) closeCompanyServiceMenu();
    });
    companyServiceDropdown.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeCompanyServiceMenu();
            companyServiceTrigger.focus();
        }
    });

    const form = document.getElementById("providerRegisterForm");
    const fields = {
        fullName: document.getElementById("fullName"),
        email: document.getElementById("email"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        service: document.getElementById("service"),
        startingPrice: document.getElementById("startingPrice"),
        location: document.getElementById("providerLocation")
    };
    const photosInput = document.getElementById("photos");
    const previewGrid = document.getElementById("photoPreviews");
    const dropZone = document.getElementById("dropZone");
    const photoUploadFrame = dropZone.closest(".media-upload-frame");
    const videoInput = document.getElementById("videoFile");
    const videoDropZone = document.getElementById("videoDropZone");
    const videoUploadFrame = videoDropZone.closest(".media-upload-frame");
    const selectedVideo = document.getElementById("selectedVideo");
    const selectedVideoName = document.getElementById("selectedVideoName");
    const removeVideo = document.getElementById("removeVideo");
    const companyPhotosInput = document.getElementById("companyPortfolioPhotos");
    const companyPhotoPreviews = document.getElementById("companyPhotoPreviews");
    const companyPhotoDropZone = document.getElementById("companyPhotoDropZone");
    const companyPhotosError = document.getElementById("companyPhotosError");
    const companyVideoInput = document.getElementById("companyPortfolioVideo");
    const companyVideoDropZone = document.getElementById("companyVideoDropZone");
    const companyVideoFrame = companyVideoDropZone.closest(".media-upload-frame");
    const companySelectedVideo = document.getElementById("companySelectedVideo");
    const companySelectedVideoName = document.getElementById("companySelectedVideoName");
    const companyVideoError = document.getElementById("companyVideoError");
    const companyRemoveVideo = document.getElementById("companyRemoveVideo");
    const formMessage = document.getElementById("formMessage");
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    let selectedFiles = [];
    let previewUrls = [];
    let companySelectedFiles = [];
    let companyPreviewUrls = [];

    function setError(id, message, control) {
        document.getElementById(id + "Error").textContent = message;
        if (control) {
            control.classList.toggle("input-invalid", Boolean(message));
            control.setAttribute("aria-invalid", String(Boolean(message)));
        }
    }

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

    function syncCompanyPhotoFiles() {
        const transfer = new DataTransfer();
        companySelectedFiles.forEach(function (file) { transfer.items.add(file); });
        companyPhotosInput.files = transfer.files;
    }

    function renderCompanyPhotoPreviews() {
        companyPreviewUrls.forEach(URL.revokeObjectURL);
        companyPreviewUrls = [];
        companyPhotoPreviews.replaceChildren();
        companySelectedFiles.forEach(function (file, index) {
            const url = URL.createObjectURL(file);
            companyPreviewUrls.push(url);
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
                companySelectedFiles.splice(index, 1);
                syncCompanyPhotoFiles();
                renderCompanyPhotoPreviews();
            });
            item.append(image, remove);
            companyPhotoPreviews.append(item);
        });
        companyPhotosError.textContent = "";
        companyPhotosInput.removeAttribute("aria-invalid");
    }

    function addCompanyPhotoFiles(fileList) {
        const incoming = Array.from(fileList);
        if (incoming.some(function (file) { return !allowedTypes.has(file.type); })) {
            companyPhotosError.textContent = "Choose JPG, JPEG, PNG, or WEBP images only.";
            companyPhotosInput.setAttribute("aria-invalid", "true");
            syncCompanyPhotoFiles();
            return;
        }
        incoming.forEach(function (file) {
            if (!companySelectedFiles.some(function (existing) {
                return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
            })) companySelectedFiles.push(file);
        });
        syncCompanyPhotoFiles();
        renderCompanyPhotoPreviews();
    }

    companyPhotosInput.addEventListener("change", function () { addCompanyPhotoFiles(companyPhotosInput.files); });
    companyPhotoDropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); companyPhotosInput.click(); }
    });
    ["dragenter", "dragover"].forEach(function (name) {
        companyPhotoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            companyPhotoDropZone.closest(".media-upload-frame").classList.add("is-dragging");
        });
    });
    ["dragleave", "drop"].forEach(function (name) {
        companyPhotoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            companyPhotoDropZone.closest(".media-upload-frame").classList.remove("is-dragging");
        });
    });
    companyPhotoDropZone.addEventListener("drop", function (event) { addCompanyPhotoFiles(event.dataTransfer.files); });

    dropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); photosInput.click(); }
    });
    ["dragenter", "dragover"].forEach(function (name) {
        dropZone.addEventListener(name, function (event) { event.preventDefault(); dropZone.classList.add("is-dragging"); photoUploadFrame.classList.add("is-dragging"); });
    });
    ["dragleave", "drop"].forEach(function (name) {
        dropZone.addEventListener(name, function (event) { event.preventDefault(); dropZone.classList.remove("is-dragging"); photoUploadFrame.classList.remove("is-dragging"); });
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
            videoUploadFrame.classList.add("is-dragging");
        });
    });
    ["dragleave", "drop"].forEach(function (name) {
        videoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            videoDropZone.classList.remove("is-dragging");
            videoUploadFrame.classList.remove("is-dragging");
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

    function setCompanyVideo(file) {
        if (!file) return;
        if (!acceptVideo(file)) {
            companyVideoInput.value = "";
            companySelectedVideo.hidden = true;
            companyVideoError.textContent = "Choose a video in MP4, MOV, or WEBM format.";
            companyVideoInput.setAttribute("aria-invalid", "true");
            return;
        }
        companyVideoError.textContent = "";
        companyVideoInput.removeAttribute("aria-invalid");
        companySelectedVideoName.textContent = file.name;
        companySelectedVideo.hidden = false;
        formMessage.textContent = "";
    }

    companyVideoInput.addEventListener("change", function () {
        setCompanyVideo(companyVideoInput.files && companyVideoInput.files[0]);
    });
    companyVideoDropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            companyVideoInput.click();
        }
    });
    ["dragenter", "dragover"].forEach(function (name) {
        companyVideoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            companyVideoFrame.classList.add("is-dragging");
        });
    });
    ["dragleave", "drop"].forEach(function (name) {
        companyVideoDropZone.addEventListener(name, function (event) {
            event.preventDefault();
            companyVideoFrame.classList.remove("is-dragging");
        });
    });
    companyVideoDropZone.addEventListener("drop", function (event) {
        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        companyVideoInput.files = transfer.files;
        setCompanyVideo(file);
    });
    companyRemoveVideo.addEventListener("click", function () {
        companyVideoInput.value = "";
        companySelectedVideo.hidden = true;
        companySelectedVideoName.textContent = "";
        companyVideoError.textContent = "";
        companyVideoInput.removeAttribute("aria-invalid");
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

        if (fields.startingPrice.value === "" || !fields.startingPrice.validity.valid || Number(fields.startingPrice.value) < 0) {
            fail("startingPrice", "Enter a valid starting price of 0 JOD or more.", fields.startingPrice);
        } else setError("startingPrice", "", fields.startingPrice);

        if (fields.location.value.trim().length < 2) fail("providerLocation", "Enter at least one service location.", fields.location);
        else setError("providerLocation", "", fields.location);

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

        const providerProfile = {
            fullName: fields.fullName.value.trim(),
            email: fields.email.value.trim(),
            service: fields.service.value,
            startingPrice: Number(fields.startingPrice.value),
            currency: "JOD",
            location: fields.location.value.split(",").map(function (city) { return city.trim(); }).filter(Boolean).join(", "),
            currentPlan: null,
            registrationComplete: true
        };

        try {
            window.localStorage.setItem("teamlyProviderProfile", JSON.stringify(providerProfile));
            const savedProfile = JSON.parse(window.localStorage.getItem("teamlyProviderProfile") || "null");
            if (!savedProfile || savedProfile.email !== providerProfile.email) {
                throw new Error("Provider profile could not be verified.");
            }
            window.sessionStorage.setItem("teamlyLoggedIn", "true");
            window.sessionStorage.setItem("teamlyProviderOnboardingPending", "true");
        } catch (error) {
            formMessage.textContent = "Your account preview could not be saved in this browser. Please check browser storage and try again.";
            return;
        }

        // Passwords and uploaded files are intentionally not persisted in this frontend-only flow.
        window.location.href = "../Provider/subscription.html?onboarding=1";
    });
});
