(() => {
  const shReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shHasGSAP = Boolean(window.gsap) && !shReducedMotion;
  const shHasScrollTrigger = shHasGSAP && Boolean(window.ScrollTrigger);

  if (shHasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const fitCanvas = (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { ctx: canvas.getContext("2d"), width, height, dpr };
  };

  const drawHeroPrintField = () => {
    const canvas = document.querySelector(".masthead__print-field");
    if (!canvas) return;

    const render = (time = 0) => {
      const { ctx, width, height, dpr } = fitCanvas(canvas);
      const tick = time * 0.001;
      const step = 18 * dpr;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      for (let y = -step; y < height + step; y += step) {
        for (let x = -step; x < width + step; x += step) {
          const wave = Math.sin(x * 0.006 + y * 0.004 + tick * 0.9);
          const radius = (0.75 + Math.max(0, wave) * 1.8) * dpr;
          ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.max(0, wave) * 0.08})`;
          ctx.beginPath();
          ctx.arc(x + Math.sin(tick + y * 0.01) * dpr, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "overlay";
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < 7; i += 1) {
        const x = ((i + 1) / 8) * width + Math.sin(tick * 0.45 + i) * 16 * dpr;
        ctx.strokeStyle = `rgba(255,255,255,${i % 2 ? 0.14 : 0.08})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + Math.sin(tick + i) * 24 * dpr, height);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(Math.sin(tick * 0.34) * width * 0.12, 0, width * 0.2, height);

      if (!shReducedMotion) requestAnimationFrame(render);
    };

    render();
  };

  const initEditorialAssembly = () => {
    if (!shHasScrollTrigger) return;

    gsap.utils.toArray(".section-coordinate").forEach((coordinate) => {
      gsap.fromTo(
        coordinate,
        { autoAlpha: 0, y: 18, "--rule-progress": 0 },
        {
          autoAlpha: 1,
          y: 0,
          "--rule-progress": 1,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: {
            trigger: coordinate,
            start: "top 86%",
            once: true,
          },
        }
      );
    });

    gsap.utils.toArray(".feature-spread, .bu-section, .lesson-band, .sharing-section").forEach((section) => {
      const isFeatureSpread = section.matches(".feature-spread");
      const headlines = section.querySelectorAll("h2");
      const media = isFeatureSpread
        ? section.querySelectorAll(".feature-spread__image-stack")
        : section.querySelectorAll("figure, .share-post, .week-card");
      const text = section.querySelectorAll("p, figcaption");
      const mediaFrom = isFeatureSpread ? { autoAlpha: 0, y: 42 } : { y: 56, clipPath: "inset(0 0 100% 0)" };
      const mediaTo = isFeatureSpread
        ? { autoAlpha: 1, y: 0, duration: 1, clearProps: "clipPath", stagger: 0.05 }
        : { y: 0, clipPath: "inset(0 0 0% 0)", duration: 1.2, stagger: 0.05 };

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            end: "center 48%",
            scrub: 0.7,
          },
        })
        .fromTo(
          headlines,
          { autoAlpha: 0, y: 56 },
          { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 },
          0
        )
        .fromTo(media, mediaFrom, mediaTo, 0.08)
        .fromTo(text, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.03 }, 0.28);
    });

    gsap.to(".masthead__frame", {
      yPercent: -5,
      ease: "none",
      scrollTrigger: {
        trigger: ".masthead",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".masthead__print-field", {
      opacity: 0.64,
      ease: "none",
      scrollTrigger: {
        trigger: ".masthead",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  };

  const initShareObservatory = () => {
    const posts = [...document.querySelectorAll(".share-post")];
    const thumbs = [...document.querySelectorAll(".share-thumb")];
    const source = document.querySelector(".share-carousel__source");
    const title = document.querySelector(".share-carousel__copy h3");
    const progress = document.querySelector(".share-carousel__progress span");
    if (!posts.length) return;

    let active = Math.max(0, posts.findIndex((post) => post.classList.contains("is-active")));

    const activate = (index, instant = false) => {
      active = (index + posts.length) % posts.length;
      const activePost = posts[active];
      posts.forEach((post, postIndex) => {
        post.classList.toggle("is-active", postIndex === active);
        if (shHasGSAP) {
          gsap.to(post, {
            opacity: postIndex === active ? 1 : 0.66,
            scale: postIndex === active ? 1 : 0.985,
            filter:
              postIndex === active
                ? "grayscale(0) contrast(1.05) saturate(0.94)"
                : "grayscale(0.28) contrast(0.9) saturate(0.76)",
            duration: instant ? 0 : 0.5,
            ease: "expo.out",
            overwrite: "auto",
          });
        }
      });
      thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle("is-active", thumbIndex === active));
      if (source) source.textContent = activePost.dataset.source;
      if (title) title.textContent = activePost.dataset.title;
      if (progress && shHasGSAP) {
        gsap.to(progress, { scaleX: (active + 1) / posts.length, duration: instant ? 0 : 0.42 });
      }
    };

    posts.forEach((post, index) => {
      post.addEventListener("pointerenter", () => activate(index));
      post.addEventListener("click", () => activate(index));
    });
    thumbs.forEach((thumb, index) => thumb.addEventListener("pointerenter", () => activate(index)));
    activate(active, true);
  };

  const initFeatureImageGrid = () => {
    if (!shHasGSAP) return;

    const stack = document.querySelector(".feature-spread__image-stack");
    const cards = stack ? gsap.utils.toArray(stack.querySelectorAll(".image-slab")) : [];
    if (!stack || cards.length < 2) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 981px)", () => {
      const clamp = gsap.utils.clamp(0, 1);
      const wrapRotation = gsap.utils.wrap([-3.5, 2.8, -1.8, 3.2, -2.2]);
      let pointer = null;
      let frame = 0;

      stack.classList.add("is-bouncy-grid");
      gsap.set(cards, {
        force3D: true,
        transformPerspective: 900,
        zIndex: (index) => cards.length - index,
      });

      const motion = cards.map((card) => ({
        x: gsap.quickTo(card, "x", { duration: 0.72, ease: "power3.out" }),
        y: gsap.quickTo(card, "y", { duration: 0.72, ease: "power3.out" }),
        z: gsap.quickTo(card, "z", { duration: 0.72, ease: "power3.out" }),
        rotation: gsap.quickTo(card, "rotation", { duration: 0.78, ease: "power3.out" }),
        rotationX: gsap.quickTo(card, "rotationX", { duration: 0.78, ease: "power3.out" }),
        rotationY: gsap.quickTo(card, "rotationY", { duration: 0.78, ease: "power3.out" }),
        scale: gsap.quickTo(card, "scale", { duration: 0.76, ease: "power3.out" }),
      }));

      const resetCards = () => {
        cards.forEach((card, index) => {
          card.classList.remove("is-nearest");
          motion[index].x(0);
          motion[index].y(0);
          motion[index].z(0);
          motion[index].rotation(wrapRotation(index));
          motion[index].rotationX(0);
          motion[index].rotationY(0);
          motion[index].scale(1);
          gsap.set(card, { zIndex: cards.length - index });
        });
      };

      const updateGrid = () => {
        frame = 0;
        if (!pointer) return;

        const stackRect = stack.getBoundingClientRect();
        const cardRects = cards.map((card) => card.getBoundingClientRect());
        const maxDistance = Math.hypot(stackRect.width, stackRect.height) * 0.38;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        cardRects.forEach((rect, index) => {
          const dx = pointer.x - (rect.left + rect.width / 2);
          const dy = pointer.y - (rect.top + rect.height / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        cards.forEach((card, index) => {
          const rect = cardRects[index];
          const dx = pointer.x - (rect.left + rect.width / 2);
          const dy = pointer.y - (rect.top + rect.height / 2);
          const distance = Math.hypot(dx, dy);
          const influence = clamp(1 - distance / maxDistance);
          const isNearest = index === nearestIndex;
          const awayX = dx === 0 && dy === 0 ? 0 : -dx / Math.max(distance, 1);
          const awayY = dx === 0 && dy === 0 ? 0 : -dy / Math.max(distance, 1);
          const lift = isNearest ? -10 : -3 * influence;

          card.classList.toggle("is-nearest", isNearest);
          motion[index].x(isNearest ? dx * 0.026 : awayX * (9 + influence * 14));
          motion[index].y(isNearest ? dy * 0.02 + lift : awayY * (7 + influence * 12));
          motion[index].z(isNearest ? 24 : influence * 8);
          motion[index].rotation(
            wrapRotation(index) + (isNearest ? gsap.utils.clamp(-2.2, 2.2, dx * 0.008) : awayX * 1.4)
          );
          motion[index].rotationX(isNearest ? gsap.utils.clamp(-3, 3, -dy * 0.009) : awayY * 1);
          motion[index].rotationY(isNearest ? gsap.utils.clamp(-3, 3, dx * 0.009) : -awayX * 1);
          motion[index].scale(isNearest ? 1.035 : 1 + influence * 0.006);
          gsap.set(card, { zIndex: isNearest ? 20 : Math.round(6 + influence * 8) });
        });
      };

      const queueUpdate = (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        if (!frame) frame = requestAnimationFrame(updateGrid);
      };

      stack.addEventListener("pointermove", queueUpdate);
      stack.addEventListener("pointerleave", resetCards);
      resetCards();

      return () => {
        if (frame) cancelAnimationFrame(frame);
        stack.classList.remove("is-bouncy-grid");
        stack.removeEventListener("pointermove", queueUpdate);
        stack.removeEventListener("pointerleave", resetCards);
        cards.forEach((card) => card.classList.remove("is-nearest"));
        gsap.set(cards, { clearProps: "transform,zIndex" });
      };
    });
  };

  const initOccasionInteractions = () => {
    const items = shHasGSAP
      ? gsap.utils.toArray(".issue--audrey-a .week-card__item")
      : [...document.querySelectorAll(".issue--audrey-a .week-card__item")];
    if (!items.length) return;

    const card = document.querySelector(".issue--audrey-a .week-card--occasions");
    const prevButton = card?.querySelector("[data-occasion-prev]");
    const nextButton = card?.querySelector("[data-occasion-next]");
    const desktopQuery = window.matchMedia("(min-width: 981px)");
    const deckSlots = [
      { x: -10, y: -14, rotation: -1, scale: 1, z: 8, opacity: 1 },
      { x: 12, y: -6, rotation: 1, scale: 0.99, z: 7, opacity: 0.98 },
      { x: 34, y: 2, rotation: 2, scale: 0.98, z: 6, opacity: 0.96 },
      { x: 56, y: 10, rotation: 3, scale: 0.97, z: 5, opacity: 0.94 },
    ];
    let activeIndex = 0;

    const orderForActive = (frontIndex) => {
      const ordered = [frontIndex];
      for (let step = 1; step < items.length; step += 1) {
        ordered.push((frontIndex + step) % items.length);
      }
      return ordered;
    };

    const applyStack = (frontIndex, instant = false) => {
      if (!shHasGSAP) return;
      if (!desktopQuery.matches) {
        items.forEach((item, index) => {
          gsap.set(item, { clearProps: "x,y,xPercent,yPercent,rotation,scale,autoAlpha,zIndex" });
          item.classList.toggle("is-active", index === frontIndex);
        });
        return;
      }
      const ordered = orderForActive(frontIndex);
      ordered.forEach((itemIndex, slotIndex) => {
        const item = items[itemIndex];
        const slot = deckSlots[slotIndex] || deckSlots.at(-1);
        gsap.to(item, {
          xPercent: -50,
          yPercent: -50,
          x: slot.x,
          y: slot.y,
          rotation: slot.rotation,
          scale: slot.scale,
          autoAlpha: slot.opacity,
          zIndex: slot.z,
          duration: instant ? 0 : 0.44,
          ease: "power3.out",
          overwrite: true,
        });
      });
    };

    const markActive = (nextIndex) => {
      items.forEach((item, index) => {
        item.classList.toggle("is-active", index === nextIndex);
      });
    };

    const activate = (nextIndex, instant = false) => {
      activeIndex = gsap.utils.wrap(0, items.length, nextIndex);
      markActive(activeIndex);
      applyStack(activeIndex, instant);
    };

    items.forEach((item) => {
      const index = items.indexOf(item);
      item.tabIndex = 0;
      item.dataset.occasionLabel = item.querySelector("span")?.textContent || "";
      const deactivate = () => {
        window.setTimeout(() => {
          if (!card?.contains(document.activeElement)) {
            markActive(activeIndex);
            applyStack(activeIndex);
          }
        }, 0);
      };
      item.addEventListener("focus", () => activate(index));
      item.addEventListener("blur", deactivate);
    });

    prevButton?.addEventListener("click", () => {
      activate(activeIndex - 1);
    });

    nextButton?.addEventListener("click", () => {
      activate(activeIndex + 1);
    });

    card?.addEventListener("pointerleave", () => {
      markActive(activeIndex);
      applyStack(activeIndex);
    });

    activate(activeIndex, true);
  };

  drawHeroPrintField();
  initOccasionInteractions();
  initShareObservatory();
  initFeatureImageGrid();
  initEditorialAssembly();
})();
