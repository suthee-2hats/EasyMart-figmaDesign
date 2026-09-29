const productSection = document.querySelector(".product-section");

if (productSection) {
    const productTrack = productSection.querySelector(".product-section__track");
    const productViewport = productSection.querySelector(".product-section__viewport");
    const previousButton = productSection.querySelector('[data-direction="prev"]');
    const nextButton = productSection.querySelector('[data-direction="next"]');

    const cardWidth = 150;
    const cardGap = 16;

    let currentIndex = 0;

    const updateCarousel = () => {
        const cards = productTrack.querySelectorAll(".product-card");

        if (!cards.length) {
            previousButton.disabled = true;
            nextButton.disabled = true;
            return;
        }

        const visibleCards = Math.max(1, Math.floor(productViewport.clientWidth / (cardWidth + cardGap)));
        const maxIndex = Math.max(0, cards.length - visibleCards);

        currentIndex = Math.min(currentIndex, maxIndex);

        const position = currentIndex * (cardWidth + cardGap);

        productTrack.style.transform = `translateX(-${position}px)`;

        previousButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= maxIndex;
    };

    nextButton.addEventListener("click", () => {
        currentIndex++;
        updateCarousel();
    });

    previousButton.addEventListener("click", () => {
        currentIndex--;
        updateCarousel();
    });

    window.addEventListener("resize", updateCarousel);

    updateCarousel();
}
