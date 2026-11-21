document.addEventListener("DOMContentLoaded", initScrollReviews, { once: true });

function initScrollReviews() {
  const section = document.querySelector(".scroll-reviews");

  if (
    !section ||
    section.dataset.coffeeStoriesInitialized === "true" ||
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    return;
  }

  section.dataset.coffeeStoriesInitialized = "true";
  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();

  media.add(
    "(prefers-reduced-motion: no-preference) and (min-height: 621px)",
    () => {
      const stage = section.querySelector(".scroll-reviews__stage");
      const title = section.querySelector(".scroll-reviews__title");
      const cards = gsap.utils.toArray(".scroll-review-card", section);
      const rotations = [-4, 3, -2, 5, -3, 2];

      if (!stage || !title || cards.length === 0) return undefined;

      const cardDuration = 1;
      const cardStep = 1.08;
      const timelineDuration = (cards.length - 1) * cardStep + cardDuration;
      const removedIntroDuration = 0.65;
      const titleOverlap = 20;

      section.classList.add("is-enhanced");

      cards.forEach((card, index) => {
        gsap.set(card, {
          xPercent: -50,
          yPercent: 118,
          rotation: rotations[index],
          scale: 1,
          zIndex: index + 1,
        });
      });

      const timeline = gsap.timeline({
        defaults: {
          ease: "none",
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () =>
            `+=${
              Math.max(window.innerHeight * 5.5, 3600) *
              (timelineDuration / (timelineDuration + removedIntroDuration))
            }`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      cards.forEach((card, index) => {
        const step = index * cardStep;

        timeline.to(
          card,
          {
            yPercent: () => {
              const stageRect = stage.getBoundingClientRect();
              const titleBottom = title.getBoundingClientRect().bottom;
              const stageCenter = stageRect.top + stageRect.height / 2;
              const targetTop = titleBottom - titleOverlap;

              return ((targetTop - stageCenter) / card.offsetHeight) * 100;
            },
            duration: cardDuration,
          },
          step,
        );
      });

      return () => {
        section.classList.remove("is-enhanced");
        gsap.set(cards, { clearProps: "all" });
      };
    },
  );
}
