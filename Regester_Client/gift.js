(function () {
  const scene = document.getElementById("giftScene");
  if (!scene) return;

  const welcome = scene.closest(".register-welcome");
  const form = document.getElementById("clientRegisterForm");
  const box = scene.querySelector(".gift-box");
  const mouth = scene.querySelector("#giftMouth");
  const nameIn = document.getElementById("fullName");
  const emailIn = document.getElementById("email");
  const passIn = document.getElementById("password");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!welcome || !mouth) return;

  const layer = document.createElement("div");
  layer.className = "gift-particles";
  layer.setAttribute("aria-hidden", "true");
  welcome.appendChild(layer);

  const TYPES = [
    ["giftBloom", "0 0 80 80", 1], ["giftRose", "0 0 80 96", 1.2], ["giftPetal", "0 0 60 88", .9],
    ["giftLeaf", "0 0 80 100", 1], ["giftRibbon", "0 0 100 78", 1.1], ["giftCake", "0 0 100 92", 1.15],
    ["giftMusic", "0 0 80 100", 1.2], ["giftPhoto", "0 0 100 80", 1.3], ["giftMic", "0 0 80 100", 1.2],
    ["giftPaper", "0 0 100 80", 1.2]
  ];
  const SVGNS = "http://www.w3.org/2000/svg";
  const RATE = 9;
  const MAX = 90;
  const rand = (a, b) => a + Math.random() * (b - a);

  const parts = [];
  let running = false, last = 0, acc = 0, raf = 0;

  function makeEl(isGlint, size) {
    const el = document.createElement("span");
    el.className = "gift-particle " + (isGlint ? "gift-glint" : "gift-object");
    el.style.width = el.style.height = size + "px";
    if (!isGlint) {
      const type = TYPES[(Math.random() * TYPES.length) | 0];
      el.style.width = el.style.height = size * type[2] + "px";
      const svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("viewBox", type[1]);
      const use = document.createElementNS(SVGNS, "use");
      use.setAttribute("href", "#" + type[0]);
      svg.appendChild(use);
      el.appendChild(svg);
    }
    layer.appendChild(el);
    return el;
  }

  function spawn(delay) {
    if (parts.length >= MAX) return;
    const width = welcome.clientWidth;
    const welcomeRect = welcome.getBoundingClientRect();
    const mouthRect = mouth.getBoundingClientRect();
    const originX = mouthRect.left + mouthRect.width / 2 - welcomeRect.left;
    const originY = mouthRect.top + mouthRect.height / 2 - welcomeRect.top;
    const glint = Math.random() < .14;
    const size = glint ? rand(7, 13) : rand(34, 58);
    const el = makeEl(glint, size);
    const half = el.offsetWidth / 2 || size / 2;

    parts.push({
      el,
      half,
      delay: delay || 0,
      t: 0,
      phase: "rise",
      x0: originX + rand(-3, 3),
      y0: originY + rand(-2, 2),
      tx: Math.min(width - 24, Math.max(24, originX + rand(-1, 1) * width * .48)),
      ty: rand(16, 26),
      riseTime: rand(1.35, 1.75),
      spin: rand(-340, 340),
      startRotation: rand(0, 360),
      fx: 0,
      fy: 0,
      vy: 0,
      maxVelocity: rand(170, 270),
      gravity: rand(300, 460),
      sway: rand(8, 26),
      frequency: rand(1.2, 2.6),
      phaseOffset: rand(0, 6.28),
      drift: rand(-14, 14),
      fallTime: 0
    });
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0);
    last = now;
    const height = welcome.clientHeight;

    acc += dt * RATE;
    while (acc >= 1) {
      acc -= 1;
      spawn(0);
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (part.delay > 0) {
        part.delay -= dt;
        continue;
      }

      part.t += dt;
      let x, y, scale, opacity, rotation;

      if (part.phase === "rise") {
        const progress = Math.min(1, part.t / part.riseTime);
        const easedY = 1 - Math.pow(1 - progress, 3);
        const easedX = 1 - Math.pow(1 - progress, 2);
        x = part.x0 + (part.tx - part.x0) * easedX;
        y = part.y0 + (part.ty - part.y0) * easedY;
        scale = Math.min(1, .25 + progress * 3);
        opacity = Math.min(1, progress * 8);
        rotation = part.startRotation + part.spin * progress;
        if (progress >= 1) {
          part.phase = "fall";
          part.fx = x;
          part.fy = y;
          part.vy = 0;
          part.fallTime = 0;
          part.endRotation = rotation;
        }
      } else {
        part.fallTime += dt;
        part.vy = Math.min(part.maxVelocity, part.vy + part.gravity * dt);
        part.fy += part.vy * dt;
        part.fx += part.drift * dt;
        x = part.fx + Math.sin(part.fallTime * part.frequency + part.phaseOffset) * part.sway;
        y = part.fy;
        scale = 1;
        opacity = Math.min(1, Math.max(0, (height + 80 - y) / 100));
        rotation = part.endRotation + part.spin * .35 * part.fallTime;
        if (y > height + 80) {
          part.el.remove();
          parts.splice(i, 1);
          continue;
        }
      }

      part.el.style.opacity = opacity;
      part.el.style.transform = "translate3d(" + (x - part.half) + "px," + (y - part.half) + "px,0) rotate(" + rotation + "deg) scale(" + scale + ")";
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduce) return;
    running = true;
    for (let i = 0; i < 18; i++) spawn(rand(0, .06));
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function trigger() {
    if (scene.dataset.triggered === "true") return;
    scene.dataset.triggered = "true";
    if (scene.dataset.stage === "idle") scene.dataset.stage = "name";
    start();
  }

  function updateStage() {
    trigger();
    scene.dataset.stage = passIn.value ? "password" : emailIn.value.trim() ? "email" : "name";
  }

  if (box) box.addEventListener("click", function () {
    trigger();
    scene.dataset.stage = "password";
  });

  if (form) {
    form.addEventListener("input", trigger);
    form.addEventListener("focusin", trigger);
  }

  [nameIn, emailIn, passIn].forEach(function (field) {
    if (field) field.addEventListener("input", updateStage);
  });

  document.addEventListener("visibilitychange", function () {
    if (!running) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
})();
