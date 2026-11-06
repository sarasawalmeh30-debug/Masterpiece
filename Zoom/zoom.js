(() => {
    const meetContainer = document.getElementById("meet");
    const status = document.getElementById("meeting-status");
    const shareButton = document.getElementById("share-meeting");
    const pageParams = new URLSearchParams(window.location.search);
    const roomParam = pageParams.get("room");
    const returnToChat = new URL("../chat_butween_Them/chat.html", window.location.href);
    if (pageParams.get("role") === "provider") {
        returnToChat.searchParams.set("role", "provider");
        returnToChat.searchParams.set("conversation", "team");
    }
    document.getElementById("back-link").href = returnToChat.href;
    const safeRoom = /^[a-zA-Z0-9_-]{6,80}$/;
    const roomName = roomParam && safeRoom.test(roomParam)
        ? roomParam
        : `teamly-${createRoomId()}`;

    const iconRain = document.getElementById("zoom-icon-rain");
    if (iconRain && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const cameraIcon = '<svg viewBox="0 0 32 32" focusable="false"><rect x="3.5" y="8" width="17" height="16" rx="4"/><path d="m21 13 7-4v14l-7-4"/></svg>';
        for (let index = 0; index < 16; index++) {
            const icon = document.createElement("span");
            const duration = 20 + Math.random() * 12;
            icon.className = "zoom-rain-icon";
            icon.innerHTML = cameraIcon;
            icon.style.setProperty("--rain-left", `${Math.random() * 100}%`);
            icon.style.setProperty("--rain-size", `${16 + Math.random() * 20}px`);
            icon.style.setProperty("--rain-duration", `${duration}s`);
            icon.style.setProperty("--rain-delay", `${-Math.random() * duration}s`);
            icon.style.setProperty("--rain-drift", `${Math.round(Math.random() * 120 - 60)}px`);
            iconRain.appendChild(icon);
        }
    }

    if (!roomParam || roomName !== roomParam) {
        const url = new URL(window.location.href);
        url.searchParams.set("room", roomName);
        window.history.replaceState({}, "", url);
    }

    function createRoomId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID().replaceAll("-", "");
        }
        return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    }

    function setStatus(message, state) {
        status.lastChild.textContent = message;
        status.classList.toggle("is-ready", state === "ready");
        status.classList.toggle("is-error", state === "error");
    }

    async function shareMeeting() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            shareButton.innerHTML = '<span aria-hidden="true">✓</span> Link copied';
            window.setTimeout(() => {
                shareButton.innerHTML = '<span aria-hidden="true">↗</span> Share meeting link';
            }, 2200);
        } catch (error) {
            window.prompt("Copy this meeting link and share it with your team:", window.location.href);
        }
    }

    shareButton.addEventListener("click", shareMeeting);

    if (typeof window.JitsiMeetExternalAPI !== "function") {
        setStatus("The meeting service could not load. Check your internet connection and refresh.", "error");
        meetContainer.innerHTML = `<a class="meeting-fallback" href="https://meet.jit.si/${encodeURIComponent(roomName)}" target="_blank" rel="noopener">Open the meeting room in a new tab</a>`;
        return;
    }

    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: meetContainer,
        width: "100%",
        height: "100%",
        configOverwrite: {
            prejoinConfig: { enabled: true },
            disableDeepLinking: true
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            MOBILE_APP_PROMO: false
        }
    });

    api.addEventListener("videoConferenceJoined", () => {
        setStatus("You are now in the meeting", "ready");
    });
    api.addEventListener("readyToClose", () => {
        setStatus("The meeting has ended. Returning to your project chat...");
        window.setTimeout(() => { window.location.href = returnToChat.href; }, 700);
    });
    api.addEventListener("errorOccurred", () => {
        setStatus("There was a connection problem. Please refresh the page.", "error");
    });

    window.addEventListener("pagehide", () => api.dispose(), { once: true });
})();
