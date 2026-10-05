// Product filter sidebar. Reads values off the rendered cards via their
// data-price/data-discount/data-rating attributes and marks non-matching cards
// as .is-filtered, then tells the carousel the visible count has changed.
const productFilterForm = document.querySelector("#product-filter-form");
const productFilterSection = document.querySelector(".product-section");

if (productFilterForm && productFilterSection) {
    // Read once at startup; the cards live inside groups appended later
    const PRICE_RANGES = {
        "0-100": [0, 100],
        "100-500": [100, 500],
        "500-1000": [500, 1000],
        "1000-plus": [1000, Infinity]
    };

    const getFilterValue = (name) => {
        const selected = productFilterForm.querySelector(`input[name="${name}"]:checked`);

        return selected ? selected.value : "all";
    };

    // Upper bound is exclusive, matching how the labels read ("$100 - $500")
    const matchesPrice = (price, filter) => {
        if (filter === "all") {
            return true;
        }

        const range = PRICE_RANGES[filter];

        if (!range) {
            return true;
        }

        return price >= range[0] && price < range[1];
    };

    // "50% and above" / "4 stars and above" style thresholds
    const matchesThreshold = (value, filter) => {
        if (filter === "all") {
            return true;
        }

        const minimum = Number(filter);

        if (Number.isNaN(minimum)) {
            return true;
        }

        return value >= minimum;
    };

    // Each group carries its own live region, so one category's count is
    // never overwritten by another. Groups without real cards are left alone
    // so a load-failure or empty-category message survives filtering.
    const announce = () => {
        productFilterSection
            .querySelectorAll(".product-section__group")
            .forEach((group) => {
                const status = group.querySelector(".product-section__group-status");
                const label = group.querySelector(".product-section__title");

                const cards = [
                    ...group.querySelectorAll(".product-card:not(.product-card--loading)")
                ];

                if (!status || !label || !cards.length) {
                    return;
                }

                const visible = cards.filter(
                    (card) => !card.classList.contains("is-filtered")
                ).length;

                const hidden = cards.length - visible;
                const name = label.textContent.trim();

                if (!hidden) {
                    status.textContent = `Showing all ${cards.length} ${name} products`;
                    return;
                }

                status.textContent =
                    `Showing ${visible} of ${cards.length} ${name} products. ` +
                    `${hidden} hidden by the current filters.`;
            });
    };

    const applyFilters = () => {
        const priceFilter = getFilterValue("price");
        const discountFilter = getFilterValue("discount");
        const ratingFilter = getFilterValue("rating");

        // Skeletons are excluded: they have no data attributes, so filtering
        // them would report every one as a mismatch
        const cards = productFilterSection.querySelectorAll(".product-card:not(.product-card--loading)");

        cards.forEach((card) => {
            // Every filter must pass
            const shouldShow =
                matchesPrice(Number(card.dataset.price) || 0, priceFilter) &&
                matchesThreshold(Number(card.dataset.discount) || 0, discountFilter) &&
                matchesThreshold(Number(card.dataset.rating) || 0, ratingFilter);

            card.classList.toggle("is-filtered", !shouldShow);
        });

        // Reads the classes just applied, so each group reports its own count
        announce();

        // Fired after the class changes, so the carousel measures the new state
        document.dispatchEvent(new CustomEvent("products-filtered"));
    };

    // One delegated listener covers every radio, so new groups need no wiring
    productFilterForm.addEventListener("change", (event) => {
        if (!event.target.matches('input[type="radio"]')) {
            return;
        }

        applyFilters();
    });

    productFilterForm.addEventListener("reset", () => {
        // reset fires before the browser restores the default checked radio,
        // so wait a frame before reading values back
        requestAnimationFrame(applyFilters);
    });

    // Reapply the active filters to each category as it loads
    document.addEventListener("products-rendered", applyFilters);
}