(() => {
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
