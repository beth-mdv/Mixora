(() => {
  const heroRoot = document.querySelector(".hero-pack-swiper");
  const heroName = document.querySelector("[data-hero-product-name]");
  const heroDescription = document.querySelector("[data-hero-product-description]");
  const heroLink = document.querySelector("[data-hero-product-link]");
  const heroPrev = document.querySelector("[data-hero-prev]");
  const heroNext = document.querySelector("[data-hero-next]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let heroSwiper = null;
  let heroAnimationFrame = 0;
  let heroLoopFixFrame = 0;
  let heroTransitionActive = false;
  let heroTransitionDuration = 0;

  function syncHeroProduct(slide) {
    if (!slide || !heroName || !heroDescription || !heroLink) {
      return;
    }
    heroName.textContent = slide.dataset.productName ?? "";
    heroDescription.textContent = slide.dataset.productDescription ?? "";
    heroLink.href = slide.dataset.productTarget ?? "#products";
  }

  function getAngleWeights(progress) {
    const boundedProgress = Math.max(-2, Math.min(2, Number(progress) || 0));
    const position = Math.max(0, Math.min(4, 2 - boundedProgress));
    const lower = Math.floor(position);
    const upper = Math.min(4, lower + 1);
    const fraction = position - lower;
    const blend = fraction * fraction * (3 - 2 * fraction);
    const weights = [0, 0, 0, 0, 0];
    weights[lower] += 1 - blend;
    weights[upper] += blend;
    return weights;
  }

  function getHeroVisualStep(swiper, wrapper) {
    const carouselStep = Math.max(1, swiper.size);
    const packWidth = wrapper.offsetWidth || carouselStep;
    const sideScale = 1 - 0.24;
    const maximumSideOffset = Math.max(
      0,
      (carouselStep - packWidth * sideScale) / 2,
    );
    const preferredSideOffset = Math.max(
      carouselStep * 0.33,
      packWidth * 0.5,
    );
    return Math.min(preferredSideOffset, maximumSideOffset);
  }

  function updateHeroPackSlide(slide, progress = 0, swiper = null) {
    const weights = getAngleWeights(progress);
    const frames = [...slide.querySelectorAll(".hero-pack-frame")];
    const fallback = slide.querySelector(".hero-pack-fallback");
    let fallbackOpacity = 0;

    frames.forEach((frame, index) => {
      const weight = weights[index] ?? 0;
      if (frame.dataset.loaded === "true") {
        frame.style.opacity = String(weight);
      } else {
        frame.style.opacity = "0";
        fallbackOpacity += weight;
      }
    });

    if (fallback) {
      fallback.style.opacity = String(fallbackOpacity);
    }

    const boundedProgress = Math.max(-2, Math.min(2, Number(progress) || 0));
    const distance = Math.abs(boundedProgress);
    const farFadeProgress = Math.max(0, Math.min(1, distance - 1));
    const farFade = farFadeProgress * farFadeProgress * (3 - 2 * farFadeProgress);
    const wrapper = slide.querySelector(".hero-pack-3d");
    if (wrapper) {
      const carouselStep = swiper
        ? Math.max(
            1,
            (swiper.slidesSizesGrid[0] || swiper.size) +
              (Number.parseFloat(swiper.params.spaceBetween) || 0),
          )
        : 0;
      const visualStep = swiper ? getHeroVisualStep(swiper, wrapper) : 0;
      const horizontalOffset = swiper
        ? boundedProgress * (carouselStep - visualStep) +
          boundedProgress * 6
        : boundedProgress * 6;
      wrapper.style.opacity = String(
        1 - Math.min(distance, 1) * 0.3 - farFade * 0.7,
      );
      wrapper.style.transform =
        `translate3d(${horizontalOffset}px, ${distance * 28}px, 0) ` +
        `scale(${1 - distance * 0.24})`;
    }
    slide.style.zIndex = String(Math.round((1 - distance) * 10));
  }

  function getHeroSlideProgress(swiper, slide, index, useVisualPosition = false) {
    const slideSize = swiper.slidesSizesGrid[index] || slide.offsetWidth;
    const spaceBetween = Number.parseFloat(swiper.params.spaceBetween) || 0;
    const slideStep = Math.max(1, slideSize + spaceBetween);

    if (useVisualPosition) {
      const containerRect = swiper.el.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const slideCenter = slideRect.left + slideRect.width / 2;
      return (containerCenter - slideCenter) / slideStep;
    }

    return Number(slide.progress) || 0;
  }

  function updateHeroSlides(swiper, useVisualPosition = false) {
    swiper.slides.forEach((slide, index) => {
      updateHeroPackSlide(
        slide,
        getHeroSlideProgress(swiper, slide, index, useVisualPosition),
        swiper,
      );
    });
  }

  // Swiper's CSS transition does not report slide progress on every frame.
  function animateHeroSlides(swiper) {
    heroTransitionActive = true;
    if (heroAnimationFrame) {
      return;
    }

    const updateFrame = () => {
      heroAnimationFrame = 0;
      if (!heroTransitionActive || swiper.destroyed) {
        return;
      }

      updateHeroSlides(swiper, true);
      heroAnimationFrame = window.requestAnimationFrame(updateFrame);
    };

    heroAnimationFrame = window.requestAnimationFrame(updateFrame);
  }

  function finishHeroSlideTransition(swiper) {
    heroTransitionActive = false;
    if (heroAnimationFrame) {
      window.cancelAnimationFrame(heroAnimationFrame);
      heroAnimationFrame = 0;
    }
    updateHeroSlides(swiper);
  }

  function scheduleHeroLoopFix(swiper) {
    if (heroLoopFixFrame) {
      window.cancelAnimationFrame(heroLoopFixFrame);
    }

    heroLoopFixFrame = window.requestAnimationFrame(() => {
      heroLoopFixFrame = 0;
      if (swiper.destroyed || swiper.animating) {
        return;
      }

      const previousSlide = swiper.slides.find((slide) =>
        slide.classList.contains("swiper-slide-prev"),
      );
      const nextSlide = swiper.slides.find((slide) =>
        slide.classList.contains("swiper-slide-next"),
      );
      const hasVisiblePack = (slide) =>
        slide &&
        Number(slide.querySelector(".hero-pack-3d")?.style.opacity || 0) > 0;

      if (!hasVisiblePack(previousSlide) || !hasVisiblePack(nextSlide)) {
        swiper.loopFix();
      }
    });
  }

  if (heroRoot) {
    heroRoot.querySelectorAll(".hero-pack-frame").forEach((frame) => {
      const updateFrameState = (isLoaded) => {
        frame.dataset.loaded = String(isLoaded);
        const slide = frame.closest(".swiper-slide");
        if (slide) {
          if (heroSwiper) {
            const index = Array.prototype.indexOf.call(heroSwiper.slides, slide);
            updateHeroPackSlide(
              slide,
              getHeroSlideProgress(
                heroSwiper,
                slide,
                index,
                heroTransitionActive,
              ),
              heroSwiper,
            );
          } else {
            updateHeroPackSlide(slide);
          }
        }
      };

      frame.addEventListener("load", () => updateFrameState(true));
      frame.addEventListener("error", () => updateFrameState(false));
      if (frame.complete) {
        updateFrameState(frame.naturalWidth > 0);
      }
    });

    heroRoot.querySelectorAll(".swiper-slide").forEach((slide) => {
      updateHeroPackSlide(slide);
    });
  }

  if (heroRoot && window.Swiper) {
    heroSwiper = new window.Swiper(heroRoot, {
      loop: true,
      loopAddBlankSlides: false,
      loopAdditionalSlides: 1,
      centeredSlides: true,
      watchSlidesProgress: true,
      initialSlide: 3,
      slidesPerView: 1,
      slidesPerGroup: 1,
      spaceBetween: 0,
      speed: reducedMotion ? 0 : 1100,
      autoplay: reducedMotion
        ? false
        : {
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      touchEventsTarget: "container",
      pagination: {
        el: heroRoot.querySelector(".hero-pack-pagination"),
        clickable: true,
      },
      navigation: {
        prevEl: heroPrev,
        nextEl: heroNext,
      },
      on: {
        setTransition(swiper, duration) {
          heroTransitionDuration = duration;
        },
        setTranslate(swiper) {
          if (heroTransitionActive || heroTransitionDuration > 0) {
            animateHeroSlides(swiper);
          } else {
            updateHeroSlides(swiper);
          }
        },
        transitionStart(swiper) {
          animateHeroSlides(swiper);
        },
        transitionEnd(swiper) {
          heroTransitionDuration = 0;
          finishHeroSlideTransition(swiper);
          scheduleHeroLoopFix(swiper);
        },
        loopFix(swiper) {
          updateHeroSlides(swiper, heroTransitionActive);
        },
        realIndexChange(swiper) {
          const activeSlide =
            swiper.slides.find(
              (slide) =>
                Number(slide.dataset.swiperSlideIndex) === swiper.realIndex,
            ) || swiper.slides[swiper.activeIndex];
          syncHeroProduct(activeSlide);
          scheduleHeroLoopFix(swiper);
        },
      },
    });

    heroSwiper.slides.forEach((slide) => {
      slide.setAttribute(
        "aria-label",
        `${slide.dataset.productName} coffee blend`,
      );
    });
    updateHeroSlides(heroSwiper);
    const activeSlide = [...heroSwiper.slides].find((slide) =>
      slide.classList.contains("swiper-slide-active"),
    );
    syncHeroProduct(activeSlide);
  } else if (heroRoot) {
    syncHeroProduct(heroRoot.querySelector(".swiper-slide-active"));
  }

  const menuButton = document.querySelector(
    'button[aria-controls="mobile-navigation-drawer"]',
  );
  const mobileDrawer = document.getElementById("mobile-navigation-drawer");
  const drawerBackdrop = document.querySelector("[data-drawer-backdrop]");
  const drawerCloseButton = mobileDrawer?.querySelector("[data-drawer-close]");
  const hasMobileNavigation =
    menuButton && mobileDrawer && drawerBackdrop && drawerCloseButton;
  const productGrid = document.querySelector(".product-grid");
  const searchInputs = [...document.querySelectorAll("[data-product-search]")];
  const searchResultLists = [
    ...document.querySelectorAll("[data-search-results]"),
  ];
  const searchStatusElements = [
    ...document.querySelectorAll("[data-search-status]"),
  ];
  const desktopSearchToggle = document.querySelector(
    "[data-desktop-search-toggle]",
  );
  const desktopSearchPanel = document.querySelector(
    "[data-desktop-search-panel]",
  );
  const desktopSearchClose =
    desktopSearchPanel?.querySelector("[data-search-close]");
  const hasDesktopSearch = desktopSearchToggle && desktopSearchPanel;

  if (hasMobileNavigation) {
    const drawerLinks = [...mobileDrawer.querySelectorAll("a[href]")];
    const backgroundElements = [...document.body.children].filter(
      (element) => element !== mobileDrawer && element !== drawerBackdrop,
    );
    let isMenuOpen = false;
    let previousBodyOverflow = "";
    let previousDocumentOverflow = "";
    let previousBackgroundInert = [];

    function setMenuOpen(isOpen, restoreFocus = true) {
      isMenuOpen = isOpen;
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu",
      );
      mobileDrawer.classList.toggle("pointer-events-none", !isOpen);
      mobileDrawer.toggleAttribute("data-open", isOpen);
      mobileDrawer.setAttribute("aria-hidden", String(!isOpen));
      mobileDrawer.inert = !isOpen;

      drawerBackdrop.classList.toggle("pointer-events-none", !isOpen);
      drawerBackdrop.toggleAttribute("data-open", isOpen);
      drawerBackdrop.inert = !isOpen;

      if (isOpen) {
        previousBodyOverflow = document.body.style.overflow;
        previousDocumentOverflow = document.documentElement.style.overflow;
        previousBackgroundInert = backgroundElements.map(
          (element) => element.inert,
        );
        backgroundElements.forEach((element) => {
          element.inert = true;
        });
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        drawerCloseButton.focus();
      } else {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousDocumentOverflow;
        backgroundElements.forEach((element, index) => {
          element.inert = previousBackgroundInert[index];
        });
        if (restoreFocus) {
          menuButton.focus();
        }
      }
    }

    menuButton.addEventListener("click", () => {
      setMenuOpen(!isMenuOpen);
    });
    drawerCloseButton.addEventListener("click", () => setMenuOpen(false));
    drawerBackdrop.addEventListener("click", () => setMenuOpen(false));
    drawerLinks.forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    mobileDrawer.addEventListener("click", (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-search-result]")
      ) {
        setMenuOpen(false, Boolean(productGrid));
        if (productGrid) {
          window.setTimeout(() => menuButton.focus(), 0);
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!isMenuOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = [
          ...mobileDrawer.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), a[href]',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) {
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setMenuOpen(false, false);
        document.querySelector("#primary-navigation a")?.focus();
      }
    });
  }

  if (searchInputs.length === 0 || searchResultLists.length === 0) {
    return;
  }

  const coffeeBlends = [
    {
      name: "Morning Ritual",
      details: "Balance · Choco · Nutty",
      keywords: ["chocolate", "cocoa", "nutty", "morning"],
      target: "product-morning-ritual",
    },
    {
      name: "Citrus Bloom",
      details: "Bright · Floral · Citrus",
      keywords: ["citrus", "orange", "floral", "fruity"],
      target: "product-citrus-bloom",
    },
    {
      name: "After Dark",
      details: "Bold · Cocoa · Roasty",
      keywords: ["dark", "cocoa", "chocolate", "roasty"],
      target: "product-after-dark",
    },
    {
      name: "Daily Balance",
      details: "Sweet · Caramel · Smooth",
      keywords: ["daily", "caramel", "sweet", "smooth"],
      target: "product-daily-balance",
    },
  ];
  let isDesktopSearchOpen = false;

  function renderSearchResults(blends) {
    searchResultLists.forEach((list) => {
      if (blends.length === 0) {
        const emptyState = document.createElement("li");
        emptyState.className =
          "px-2 py-3 font-[Inter,sans-serif] text-sm text-[#27140D]/70";
        emptyState.textContent = "No coffee blends found";
        list.replaceChildren(emptyState);
        return;
      }

      const items = blends.map((blend) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        const name = document.createElement("span");
        const details = document.createElement("span");

        link.className =
          "flex flex-col gap-1 border-b border-[#B9A99C] px-2 py-3 font-[Inter,sans-serif] transition-colors hover:bg-[#FC4696]/10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#FC4696]";
        link.href = `${productGrid ? "" : "index.html#"}${blend.target}`;
        link.dataset.searchResult = "true";
        name.className = "text-sm font-semibold";
        name.textContent = blend.name;
        details.className = "text-xs text-[#27140D]/70";
        details.textContent = blend.details;
        link.append(name, details);
        item.append(link);
        return item;
      });

      list.replaceChildren(...items);
    });

    const status =
      blends.length === 0
        ? "No coffee blends found"
        : `${blends.length} coffee ${
            blends.length === 1 ? "blend" : "blends"
          } found`;
    searchStatusElements.forEach((element) => {
      element.textContent = status;
    });
  }

  function updateSearchResults(query) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    const matchingBlends = coffeeBlends.filter((blend) => {
      const searchableText = [blend.name, blend.details, ...blend.keywords]
        .join(" ")
        .toLocaleLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });

    renderSearchResults(matchingBlends);
  }

  function setDesktopSearchOpen(isOpen, restoreFocus = true) {
    if (!hasDesktopSearch) {
      return;
    }

    isDesktopSearchOpen = isOpen;
    desktopSearchToggle.setAttribute("aria-expanded", String(isOpen));
    desktopSearchPanel.classList.toggle("hidden", !isOpen);
    desktopSearchPanel.setAttribute("aria-hidden", String(!isOpen));
    desktopSearchPanel.inert = !isOpen;

    if (isOpen) {
      desktopSearchPanel.querySelector("[data-product-search]")?.focus();
    } else if (restoreFocus) {
      desktopSearchToggle.focus();
    }
  }

  searchInputs.forEach((input) => {
    input.addEventListener("input", () => {
      searchInputs.forEach((otherInput) => {
        if (otherInput !== input) {
          otherInput.value = input.value;
        }
      });
      updateSearchResults(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      const resultsContainer = input.closest("form")?.parentElement;
      const results = [
        ...(resultsContainer?.querySelectorAll("[data-search-result]") ?? []),
      ];
      const target = event.key === "ArrowDown" ? results[0] : results.at(-1);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    });
  });

  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (event) => event.preventDefault());

    const clearButton = form.querySelector("[data-search-clear]");
    clearButton?.addEventListener("click", () => {
      const input = form.querySelector("[data-product-search]");
      if (!input) {
        return;
      }
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });

    form.querySelector("[data-search-results]")?.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
          return;
        }

        const results = [
          ...event.currentTarget.querySelectorAll("[data-search-result]"),
        ];
        const currentIndex = results.indexOf(event.target);
        const nextIndex =
          event.key === "ArrowDown"
            ? Math.min(currentIndex + 1, results.length - 1)
            : Math.max(currentIndex - 1, 0);
        if (results[nextIndex]) {
          event.preventDefault();
          results[nextIndex].focus();
        }
      },
    );
  });

  if (hasDesktopSearch) {
    desktopSearchToggle.addEventListener("click", () => {
      setDesktopSearchOpen(!isDesktopSearchOpen);
    });
    desktopSearchClose?.addEventListener("click", () => {
      setDesktopSearchOpen(false);
    });
    desktopSearchPanel.addEventListener("click", (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-search-result]")
      ) {
        setDesktopSearchOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isDesktopSearchOpen) {
        event.preventDefault();
        setDesktopSearchOpen(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (
        isDesktopSearchOpen &&
        !desktopSearchPanel.contains(event.target) &&
        !desktopSearchToggle.contains(event.target)
      ) {
        setDesktopSearchOpen(false, false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth < 768 && isDesktopSearchOpen) {
        setDesktopSearchOpen(false, false);
      }
    });
  }

  updateSearchResults("");
})();
