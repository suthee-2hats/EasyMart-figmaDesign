const heroCarousel = document.querySelector(".hero-carousel");

if (heroCarousel) {
    const track = heroCarousel.querySelector(".hero-carousel__track");
    const slides = Array.from(
        heroCarousel.querySelectorAll(".hero-carousel__slide")
    );

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const loopWidth = () => {
        const slideWidth = slides[0].getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;

        return slides.length * (slideWidth + gap);
    };

    if (!prefersReducedMotion) {
        slides.forEach((slide) => track.appendChild(slide.cloneNode(true)));
    }

    let offset = 0;
    let paused = false;
    let lastTime = null;
    let timer = null;

    const speed = 50;

    const step = () => {
        const now = performance.now();

        if (lastTime === null) {
            lastTime = now;
            return;
        }

        const delta = (now - lastTime) / 1000;
        lastTime = now;

        if (!paused) {
            offset = (offset + speed * delta) % loopWidth();

            track.style.transform = `translateX(-${offset}px)`;
        }
    };

    const setPaused = (value) => {
        paused = value;
        lastTime = null;
    };

    heroCarousel.addEventListener("mouseenter", () => setPaused(true));
    heroCarousel.addEventListener("mouseleave", () => setPaused(false));
    heroCarousel.addEventListener("focusin", () => setPaused(true));
    heroCarousel.addEventListener("focusout", () => setPaused(false));

    if (!prefersReducedMotion) {
        timer = setInterval(step, 33);
    }
}