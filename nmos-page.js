(function () {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  function resetScroll() {
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }

  function initMarquees() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll(".photo-marquee").forEach((marquee) => {
      const track = marquee.querySelector(".marquee-track");
      if (!track) return;

      const cardSize = marquee.classList.contains("activity-marquee")
        ? "clamp(260px, 27vw, 420px)"
        : "clamp(240px, 25vw, 360px)";

      marquee.style.overflow = "hidden";
      marquee.style.maxWidth = "100%";
      track.style.display = "flex";
      track.style.flexWrap = "nowrap";
      track.style.width = "max-content";
      track.style.gap = "18px";
      track.style.animation = "none";
      track.querySelectorAll(".marquee-card").forEach((card) => {
        card.style.flex = `0 0 ${cardSize}`;
        card.style.margin = "0";
      });

      if (reducedMotion) return;

      let position = 0;
      let frameId = null;
      let previousTime = 0;
      let pointerPaused = false;
      let isIntersecting = false;
      const speed = 25.2;

      function canRun() {
        return isIntersecting && !pointerPaused && !document.hidden;
      }

      function stop() {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        previousTime = 0;
      }

      function start() {
        if (!canRun() || frameId !== null) return;
        frameId = requestAnimationFrame(tick);
      }

      function tick(time) {
        frameId = null;
        if (!canRun()) {
          previousTime = 0;
          return;
        }

        const loopWidth = Math.max(1, track.scrollWidth / 2);
        if (previousTime) {
          position = (position + speed * ((time - previousTime) / 1000)) % loopWidth;
        }
        previousTime = time;
        track.style.transform = `translate3d(${-position}px, 0, 0)`;
        frameId = requestAnimationFrame(tick);
      }

      marquee.addEventListener("mouseenter", () => {
        pointerPaused = true;
        stop();
      });
      marquee.addEventListener("mouseleave", () => {
        pointerPaused = false;
        start();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
      });

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) start();
          else stop();
        }, { threshold: 0.01 });
        observer.observe(marquee);
      } else {
        isIntersecting = true;
        start();
      }
    });
  }

  function initScrollReveal() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const selectors = [
      ".home-hero-grid",
      ".page-header",
      ".section-heading",
      ".section > .grid-2",
      ".section > .grid-3",
      ".section > .grid-4",
      ".section > .split",
      ".section > .photo-marquee",
      ".section > .current-members-roster",
      ".publication-list",
      ".project-list",
      ".equipment-directory",
      ".equipment-structure-grid",
      ".equipment-hero-block",
      ".equipment-detail-grid",
      ".equipment-capabilities",
      ".equipment-flow",
      ".comparison-grid",
      ".conference-year-section",
      ".album-block",
      ".professor-profile",
      ".contact-layout",
      ".reveal"
    ];
    const elements = Array.from(new Set(document.querySelectorAll(selectors.join(","))));
    if (!elements.length) return;

    elements.forEach((element) => element.classList.add("motion-reveal"));
    document.documentElement.classList.add("motion-ready");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -16% 0px"
    });

    elements.forEach((element) => observer.observe(element));
  }

  function initTypewriter() {
    const output = document.querySelector("[data-typewriter]");
    if (!output) return;

    const phrases = [
      "光學與電磁超穎表面",
      "生態影像與聲景監測",
      "醫學影像與幾何分析",
      "邊緣裝置與智慧控制"
    ];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      output.dataset.typewriterState = "disabled";
      return;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timerId = null;

    function schedule(delay) {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(tick, delay);
    }

    function tick() {
      if (document.hidden) return;

      const phrase = phrases[phraseIndex];
      if (!deleting && characterIndex < phrase.length) {
        characterIndex += 1;
        output.textContent = phrase.slice(0, characterIndex);
        schedule(82);
        return;
      }

      if (!deleting) {
        deleting = true;
        schedule(1450);
        return;
      }

      if (characterIndex > 0) {
        characterIndex -= 1;
        output.textContent = phrase.slice(0, characterIndex);
        schedule(42);
        return;
      }

      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      schedule(320);
    }

    output.textContent = "";
    output.dataset.typewriterState = "running";
    schedule(220);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.clearTimeout(timerId);
        output.dataset.typewriterState = "paused";
      } else {
        output.dataset.typewriterState = "running";
        schedule(180);
      }
    });
  }

  function initPointerGlowCards() {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const compactViewport = window.matchMedia("(max-width: 900px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer.matches || coarsePointer.matches || compactViewport.matches || reducedMotion) return;

    document.querySelectorAll(".link-card, .equipment-card").forEach((card) => {
      let frameId = null;
      let latestEvent = null;
      let cleanupTimer = null;
      card.classList.add("pointer-glow-card");

      function renderPointer() {
        frameId = null;
        if (!latestEvent) return;
        const rect = card.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (latestEvent.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (latestEvent.clientY - rect.top) / rect.height));
        card.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
        card.style.setProperty("--tilt-x", `${((0.5 - y) * 6).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${((x - 0.5) * 6).toFixed(2)}deg`);
      }

      function activate() {
        window.clearTimeout(cleanupTimer);
        card.classList.add("is-pointer-active");
        card.style.willChange = "transform";
      }

      function deactivate() {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
        latestEvent = null;
        card.classList.remove("is-pointer-active");
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.style.setProperty("--glow-x", "50%");
        card.style.setProperty("--glow-y", "50%");
        cleanupTimer = window.setTimeout(() => {
          if (!card.classList.contains("is-pointer-active")) card.style.willChange = "";
        }, 240);
      }

      card.addEventListener("pointerenter", activate);
      card.addEventListener("pointermove", (event) => {
        latestEvent = event;
        if (frameId === null) frameId = requestAnimationFrame(renderPointer);
      });
      card.addEventListener("pointerleave", deactivate);
      card.addEventListener("pointercancel", deactivate);
    });
  }

  function initHeroParticles() {
    const canvas = document.querySelector(".hero-particles");
    const hero = canvas?.closest(".home-hero");
    if (!canvas || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 901px)");
    if (reducedMotion) {
      canvas.dataset.particleState = "disabled";
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let nodes = [];
    let frameId = null;
    let previousTime = 0;
    let isIntersecting = false;

    function resize() {
      if (!desktop.matches) return;
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const nodeCount = Math.max(25, Math.min(35, Math.round(width / 46)));
      canvas.dataset.particleCount = String(nodeCount);
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        radius: 1.2 + Math.random() * 1.2
      }));
    }

    function canRun() {
      return desktop.matches && isIntersecting && !document.hidden;
    }

    function stop(state = "paused") {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      previousTime = 0;
      canvas.dataset.particleState = state;
    }

    function start() {
      if (!canRun() || frameId !== null) return;
      canvas.dataset.particleState = "running";
      frameId = requestAnimationFrame(draw);
    }

    function draw(time) {
      frameId = null;
      if (!canRun()) {
        stop();
        return;
      }

      const elapsed = previousTime ? Math.min(0.04, (time - previousTime) / 1000) : 0;
      previousTime = time;
      context.clearRect(0, 0, width, height);

      nodes.forEach((node) => {
        node.x += node.vx * elapsed;
        node.y += node.vy * elapsed;
        if (node.x <= 0 || node.x >= width) node.vx *= -1;
        if (node.y <= 0 || node.y >= height) node.vy *= -1;
        node.x = Math.min(width, Math.max(0, node.x));
        node.y = Math.min(height, Math.max(0, node.y));
      });

      const connectionDistance = 132;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance >= connectionDistance) continue;
          const alpha = (1 - distance / connectionDistance) * 0.22;
          context.beginPath();
          context.moveTo(nodes[i].x, nodes[i].y);
          context.lineTo(nodes[j].x, nodes[j].y);
          context.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
          context.lineWidth = 0.8;
          context.stroke();
        }
      }

      nodes.forEach((node) => {
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(186, 230, 253, 0.58)";
        context.fill();
      });

      frameId = requestAnimationFrame(draw);
    }

    function updateMode() {
      if (!desktop.matches) {
        stop("disabled");
        context.clearRect(0, 0, width, height);
        return;
      }
      resize();
      start();
    }

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting) start();
      else stop();
    }, { threshold: 0.01 });
    observer.observe(hero);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
    desktop.addEventListener("change", updateMode);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
    updateMode();
  }

  window.addEventListener("pageshow", resetScroll);
  window.addEventListener("load", resetScroll);
  initMarquees();
  initScrollReveal();
  initTypewriter();
  initPointerGlowCards();
  initHeroParticles();
})();
