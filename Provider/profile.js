(() => {
    "use strict";

    const PROFILE_KEY = "teamlyProviderProfile";
    const workspace = document.getElementById("profileWorkspace");
    const editForm = document.getElementById("profileEditForm");
    const readView = document.getElementById("profileReadView");
    const alertBox = document.getElementById("profileAlert");
    const experienceEditorList = document.getElementById("experienceEditorList");
    const portfolioEditList = document.getElementById("portfolioEditList");
    const companyTypeLabel = value => value === "company" ? "Company" : value === "individual" ? "Individual" : "Account type unavailable";
    let profile = null;
    let editing = false;
    let dirty = false;
    let stagedPhoto = null;
    let editingPortfolio = [];
    let messageTimer = null;

    function readProfile() {
        try {
            const value = window.localStorage.getItem(PROFILE_KEY);
            const parsed = value ? JSON.parse(value) : null;
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
        } catch (error) { return null; }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }

    function cleanPublicText(value) {
        return String(value ?? "").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[contact details hidden]").replace(/(?:\+?\d[\d .()/-]{7,}\d)/g, "[contact details hidden]");
    }

    function setMessage(message, isError = false) {
        window.clearTimeout(messageTimer);
        alertBox.textContent = message;
        alertBox.classList.toggle("is-error", isError);
        alertBox.hidden = !message;
        if (message) messageTimer = window.setTimeout(() => { alertBox.hidden = true; }, 7000);
    }

    function safeMediaUrl(value) {
        if (typeof value !== "string") return "";
        if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(value) || /^data:video\/(?:mp4|webm|quicktime);base64,/i.test(value)) return value;
        try {
            const url = new URL(value, window.location.href);
            const hasContactDetails = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(url.href) || /(?:\+?\d[\d .()/-]{7,}\d)/.test(url.href);
            return ["http:", "https:"].includes(url.protocol) && !hasContactDetails ? url.href : "";
        } catch (error) { return ""; }
    }

    function providerName(data = profile) {
        return data.companyName || data.fullName || data.name || data.displayName || "Provider name not added";
    }

    function services(data = profile) {
        const serviceList = Array.isArray(data.companyServices) ? data.companyServices : Array.isArray(data.services) ? data.services : [];
        const main = data.service || data.mainService || serviceList[0] || "Not added";
        const additionalValue = data.additionalServices || serviceList.filter(value => value !== main);
        const additional = Array.isArray(additionalValue) ? additionalValue.join(", ") : additionalValue;
        return { main, additional: additional || "Not added" };
    }

    function renderProfile() {
        const name = providerName();
        const serviceData = services();
        const photo = safeMediaUrl(profile.profilePhoto);
        const accountType = String(profile.accountType || "").toLowerCase();
        document.getElementById("profileName").textContent = cleanPublicText(name);
        document.getElementById("accountTypeBadge").textContent = companyTypeLabel(accountType);
        document.getElementById("aboutHeading").textContent = accountType === "company" ? "Company Description" : "About Me";
        document.getElementById("profileSpecialty").textContent = cleanPublicText(serviceData.main);
        const tagline = document.getElementById("profileTagline");
        tagline.textContent = cleanPublicText(profile.tagline || "");
        tagline.hidden = !profile.tagline;
        document.getElementById("profileLocation").textContent = cleanPublicText(profile.location || "Location not added");
        document.getElementById("profileAvatarFallback").textContent = name.trim().charAt(0).toUpperCase() || "P";
        const avatar = document.getElementById("profileAvatar");
        avatar.hidden = !photo;
        avatar.src = photo || "";
        document.getElementById("profileAvatarFallback").hidden = Boolean(photo);
        document.getElementById("aboutDescription").textContent = cleanPublicText(profile.description || profile.companyDescription || profile.bio || "No professional description added yet.");
        document.getElementById("aboutLocation").textContent = cleanPublicText(profile.location || "Not added");
        document.getElementById("aboutService").textContent = cleanPublicText(serviceData.main);
        document.getElementById("aboutAdditionalServices").textContent = cleanPublicText(serviceData.additional);
        const price = Number(profile.startingPrice ?? profile.price);
        const currency = typeof profile.currency === "string" && profile.currency.trim() ? profile.currency.trim() : "";
        document.getElementById("startingPrice").textContent = Number.isFinite(price) && price >= 0 && profile.startingPrice !== "" && profile.price !== "" && (profile.startingPrice != null || profile.price != null) ? `Starting from ${price.toLocaleString()}${currency ? ` ${currency}` : ""}` : "Not set";
        renderRating();
        renderExperience();
        renderPortfolio();
    }

    function renderRating() {
        const rating = Number(profile.averageRating ?? profile.rating);
        const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
        const count = Number(profile.reviewCount ?? reviews.length);
        const hasRating = Number.isFinite(rating) && rating >= 0 && rating <= 5 && count > 0;
        document.getElementById("ratingSummary").hidden = !hasRating;
        document.getElementById("reviewsEmpty").hidden = hasRating || reviews.length > 0;
        document.getElementById("profileRating").textContent = hasRating ? `${rating.toFixed(1)} (${count} reviews)` : reviews.length ? "Reviews available" : "No reviews yet";
        if (hasRating) {
            document.getElementById("ratingStars").textContent = "★".repeat(Math.max(0, Math.min(5, Math.round(rating)))) + "☆".repeat(Math.max(0, 5 - Math.min(5, Math.round(rating))));
            document.getElementById("ratingStars").setAttribute("aria-label", `${rating.toFixed(1)} out of 5 stars`);
            document.getElementById("ratingAverage").textContent = rating.toFixed(1);
            document.getElementById("ratingCount").textContent = `${count} ${count === 1 ? "review" : "reviews"}`;
        }
        const reviewList = document.getElementById("reviewList");
        reviewList.replaceChildren();
        reviews.forEach(review => {
            if (!review || typeof review !== "object") return;
            const item = document.createElement("article");
            item.className = "review-item";
            const heading = document.createElement("header");
            const author = document.createElement("span");
            author.textContent = cleanPublicText(review.author || review.customerName || "Client");
            const stars = document.createElement("span");
            const value = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
            stars.textContent = "★".repeat(value) + "☆".repeat(5 - value);
            stars.style.color = "#d8a63d";
            heading.append(author, stars);
            const text = document.createElement("p");
            text.textContent = cleanPublicText(review.comment || review.text || "");
            item.append(heading, text);
            reviewList.append(item);
        });
    }

    function renderExperience() {
        const items = Array.isArray(profile.experience) ? profile.experience : [];
        const list = document.getElementById("experienceList");
        list.replaceChildren();
        document.getElementById("experienceEmpty").hidden = items.length > 0;
        items.forEach(entry => {
            if (!entry || typeof entry !== "object") return;
            const row = document.createElement("article");
            row.className = "experience-item";
            row.innerHTML = `<span class="experience-marker" aria-hidden="true"></span><div class="experience-copy"><h3>${escapeHTML(cleanPublicText(entry.project || entry.company || "Experience"))}</h3><p class="experience-role">${escapeHTML(cleanPublicText(entry.role || ""))}</p><span class="experience-period">${escapeHTML(entry.period || "")}</span><p class="experience-description">${escapeHTML(cleanPublicText(entry.description || ""))}</p></div>`;
            list.append(row);
        });
    }

    function portfolioItems(data = profile) {
        return Array.isArray(data.portfolio) ? data.portfolio : Array.isArray(data.portfolioItems) ? data.portfolioItems : [];
    }

    function renderPortfolio() {
        const items = portfolioItems();
        const gallery = document.getElementById("portfolioGallery");
        gallery.replaceChildren();
        document.getElementById("portfolioEmpty").hidden = items.length > 0;
        items.forEach((entry, index) => {
            if (!entry || typeof entry !== "object") return;
            const url = safeMediaUrl(entry.data || entry.url || entry.src);
            const type = entry.type || (/^data:video\//i.test(url) ? "video" : "image");
            const card = document.createElement("article");
            card.className = "portfolio-item";
            if (url && type === "video") {
                const video = document.createElement("video");
                video.className = "portfolio-preview video-preview";
                video.src = url;
                video.controls = true;
                video.preload = "metadata";
                video.setAttribute("aria-label", entry.title || `Portfolio video ${index + 1}`);
                card.append(video);
            } else if (url && type === "image") {
                const imageButton = document.createElement("button");
                imageButton.type = "button";
                imageButton.className = "portfolio-preview";
                imageButton.setAttribute("aria-label", `Open ${entry.title || "portfolio image"} preview`);
                const image = document.createElement("img");
                image.src = url;
                image.alt = entry.title || `Portfolio image ${index + 1}`;
                imageButton.append(image);
                imageButton.addEventListener("click", () => openLightbox(url, "image", entry.title));
                card.append(imageButton);
            } else if (url) {
                const link = document.createElement("a");
                link.className = "portfolio-preview portfolio-link-preview";
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Open video link";
                card.append(link);
            }
            const copy = document.createElement("div");
            copy.className = "portfolio-item-copy";
            const title = document.createElement("h3");
            title.textContent = cleanPublicText(entry.title || entry.name || `Portfolio item ${index + 1}`);
            copy.append(title);
            if (entry.description) {
                const description = document.createElement("p");
                description.textContent = cleanPublicText(entry.description);
                copy.append(description);
            }
            card.append(copy);
            gallery.append(card);
        });
    }

    function openLightbox(url, type, title) {
        const dialog = document.getElementById("portfolioLightbox");
        const content = document.getElementById("lightboxContent");
        content.replaceChildren();
        const media = document.createElement(type === "video" ? "video" : "img");
        media.src = url;
        if (type === "video") { media.controls = true; media.autoplay = true; }
        else media.alt = title || "Portfolio preview";
        content.append(media);
        dialog.showModal();
    }

    function beginEdit() {
        stagedPhoto = null;
        editingPortfolio = [];
        dirty = false;
        const name = profile.companyName || profile.fullName || profile.name || profile.displayName || "";
        document.getElementById("editDisplayName").value = name;
        document.getElementById("editTagline").value = profile.tagline || "";
        document.getElementById("editLocation").value = profile.location || "";
        document.getElementById("editService").value = profile.service || profile.mainService || "";
        const currentServices = services(profile);
        document.getElementById("editAdditionalServices").value = currentServices.additional === "Not added" ? "" : currentServices.additional;
        document.getElementById("editDescription").value = profile.description || profile.companyDescription || profile.bio || "";
        const price = profile.startingPrice ?? profile.price;
        document.getElementById("editPrice").value = price == null ? "" : price;
        document.getElementById("profilePhotoInput").value = "";
        document.getElementById("portfolioFiles").value = "";
        document.getElementById("portfolioVideoUrl").value = "";
        editingPortfolio = portfolioItems().map(item => ({ ...item }));
        renderExperienceEditors(Array.isArray(profile.experience) ? profile.experience : []);
        renderPortfolioEditors(editingPortfolio);
        editForm.hidden = false;
        readView.hidden = true;
        document.getElementById("editProfileButton").hidden = true;
        editing = true;
        document.getElementById("editDisplayName").focus();
    }

    function renderExperienceEditors(items) {
        experienceEditorList.replaceChildren();
        document.getElementById("experienceEditorEmpty").hidden = items.length > 0;
        items.forEach(item => addExperienceEditor(item));
    }

    function addExperienceEditor(item = {}) {
        const wrapper = document.createElement("div");
        wrapper.className = "experience-editor-item";
        wrapper.innerHTML = `<button class="remove-entry-button" type="button">Remove</button><div class="experience-editor-grid"><div class="profile-field"><label>Project or Company</label><input type="text" data-experience="project" maxlength="100" value="${escapeHTML(item.project || item.company || "")}"></div><div class="profile-field"><label>Job Title or Role</label><input type="text" data-experience="role" maxlength="100" value="${escapeHTML(item.role || "")}"></div><div class="profile-field"><label>Date or Period</label><input type="text" data-experience="period" maxlength="80" placeholder="2022 – 2024" value="${escapeHTML(item.period || "")}"></div><div class="profile-field"><label>Description</label><textarea data-experience="description" rows="2" maxlength="500">${escapeHTML(item.description || "")}</textarea></div></div>`;
        wrapper.querySelectorAll("input,textarea").forEach(input => input.addEventListener("input", markDirty));
        wrapper.querySelector(".remove-entry-button").addEventListener("click", () => { wrapper.remove(); updateExperienceEmpty(); markDirty(); });
        experienceEditorList.append(wrapper);
        updateExperienceEmpty();
    }

    function updateExperienceEmpty() { document.getElementById("experienceEditorEmpty").hidden = experienceEditorList.children.length > 0; }

    function renderPortfolioEditors(items) {
        portfolioEditList.replaceChildren();
        items.forEach((item, index) => addPortfolioEditor(item, index));
    }

    function addPortfolioEditor(item, index) {
        const row = document.createElement("div");
        row.className = "portfolio-edit-item";
        const url = safeMediaUrl(item.data || item.url || item.src);
        const type = item.type || (/^data:video\//i.test(url) ? "video" : "image");
        let thumb;
        if (type === "image" && url) { thumb = document.createElement("img"); thumb.src = url; thumb.alt = ""; }
        else { thumb = document.createElement("span"); thumb.className = "portfolio-edit-thumb"; thumb.textContent = type === "video" ? "Video" : "Link"; }
        thumb.classList.add("portfolio-edit-thumb");
        const name = document.createElement("span");
        name.className = "portfolio-edit-name";
        name.textContent = item.title || item.name || `Portfolio item ${index + 1}`;
        const remove = document.createElement("button");
        remove.type = "button"; remove.className = "remove-entry-button portfolio-remove-button"; remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            editingPortfolio.splice(index, 1);
            renderPortfolioEditors(editingPortfolio); markDirty();
        });
        row.append(thumb, name, remove);
        portfolioEditList.append(row);
    }

    function markDirty() { dirty = true; }

    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
            reader.readAsDataURL(file);
        });
    }

    function validImage(file) { return ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 2 * 1024 * 1024; }
    function validVideo(file) { return ["video/mp4", "video/quicktime", "video/webm"].includes(file.type) && file.size <= 8 * 1024 * 1024; }

    function collectExperience() {
        return Array.from(experienceEditorList.children).map(row => {
            const value = key => row.querySelector(`[data-experience="${key}"]`).value.trim();
            return { project: value("project"), role: value("role"), period: value("period"), description: value("description") };
        }).filter(item => item.project || item.role || item.period || item.description);
    }

    async function saveProfile(event) {
        event.preventDefault();
        setMessage("");
        const name = document.getElementById("editDisplayName");
        const priceInput = document.getElementById("editPrice");
        const priceValue = priceInput.value.trim();
        if (!name.value.trim()) { name.setCustomValidity("Enter your full name or company name."); name.reportValidity(); name.setCustomValidity(""); return; }
        if (priceValue && (!Number.isFinite(Number(priceValue)) || Number(priceValue) < 0)) { priceInput.setCustomValidity("Enter a valid price of zero or more."); priceInput.reportValidity(); priceInput.setCustomValidity(""); return; }

        const updated = { ...profile };
        if (profile.accountType === "company" || profile.companyName) updated.companyName = name.value.trim();
        else updated.fullName = name.value.trim();
        updated.tagline = document.getElementById("editTagline").value.trim();
        updated.location = document.getElementById("editLocation").value.trim();
        updated.service = document.getElementById("editService").value;
        updated.additionalServices = document.getElementById("editAdditionalServices").value.split(",").map(value => value.trim()).filter(Boolean);
        updated.description = document.getElementById("editDescription").value.trim();
        if (priceValue) updated.startingPrice = Number(priceValue);
        else { delete updated.startingPrice; delete updated.price; }
        updated.experience = collectExperience();
        updated.portfolio = editingPortfolio;
        if (stagedPhoto) updated.profilePhoto = stagedPhoto;

        try {
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
            const saved = readProfile();
            if (!saved || providerName(saved) !== providerName(updated)) throw new Error("The profile update could not be verified in browser storage.");
            profile = saved;
            editing = false; dirty = false;
            editForm.hidden = true; readView.hidden = false;
            document.getElementById("editProfileButton").hidden = false;
            renderProfile();
            setMessage("Profile updated in this browser. It has not been synced to a TEAMLY server.");
        } catch (error) {
            setMessage("The profile could not be saved in this browser. Your edits are still here; try removing large portfolio files and save again.", true);
        }
    }

    function cancelEdit() {
        if (dirty && !window.confirm("Discard your unsaved profile changes?")) return;
        editing = false; dirty = false; stagedPhoto = null; editingPortfolio = [];
        editForm.hidden = true; readView.hidden = false;
        document.getElementById("editProfileButton").hidden = false;
        profile = readProfile() || profile;
        renderProfile();
    }

    document.getElementById("editProfileButton").addEventListener("click", beginEdit);
    document.getElementById("cancelEditButton").addEventListener("click", cancelEdit);
    document.getElementById("addExperienceButton").addEventListener("click", () => { addExperienceEditor(); markDirty(); });
    editForm.addEventListener("input", markDirty);
    editForm.addEventListener("change", markDirty);
    editForm.addEventListener("submit", saveProfile);
    document.getElementById("profilePhotoInput").addEventListener("change", async event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!validImage(file)) { setMessage("Choose a JPG, PNG, or WEBP profile photo up to 2 MB.", true); event.target.value = ""; return; }
        try { stagedPhoto = await readFile(file); markDirty(); setMessage("Profile photo ready to save."); }
        catch (error) { setMessage(error.message, true); }
    });
    document.getElementById("portfolioFiles").addEventListener("change", async event => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        const invalid = files.find(file => !(validImage(file) || validVideo(file)));
        if (invalid) { setMessage(`Unsupported or oversized file: ${invalid.name}. Use JPG, PNG, WEBP up to 2 MB or MP4, MOV, WEBM up to 8 MB.`, true); event.target.value = ""; return; }
        try {
            for (const file of files) {
                editingPortfolio.push({ title: file.name, type: file.type.startsWith("video/") ? "video" : "image", data: await readFile(file) });
            }
            renderPortfolioEditors(editingPortfolio);
            markDirty();
            event.target.value = "";
        } catch (error) { setMessage(error.message, true); }
    });
    document.getElementById("addVideoLinkButton").addEventListener("click", () => {
        const input = document.getElementById("portfolioVideoUrl");
        let url;
        try { url = new URL(input.value.trim()); } catch (error) { setMessage("Enter a valid video link beginning with http:// or https://.", true); input.focus(); return; }
        if (!["http:", "https:"].includes(url.protocol)) { setMessage("Use an http or https video link.", true); input.focus(); return; }
        editingPortfolio.push({ title: "Video link", type: "link", url: url.href });
        renderPortfolioEditors(editingPortfolio);
        input.value = ""; markDirty();
    });
    document.getElementById("closeLightbox").addEventListener("click", () => document.getElementById("portfolioLightbox").close());
    document.getElementById("portfolioLightbox").addEventListener("click", event => {
        if (event.target === event.currentTarget) event.currentTarget.close();
    });
    window.addEventListener("beforeunload", event => {
        if (editing && dirty) { event.preventDefault(); event.returnValue = ""; }
    });

    profile = readProfile() || {};
    workspace.hidden = false;
    renderProfile();
})();
