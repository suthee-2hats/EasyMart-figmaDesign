/**
 * @file Product filter sidebar.
 *
 * Reads filter values straight off the rendered cards through their
 * data-price/data-discount/data-rating attributes, marks non-matching cards as
 * `.is-filtered`, then notifies the carousel that the visible count changed.
 * No second copy of the product data is kept and no refetch is needed.
 */

/** @type {HTMLFormElement|null} */
const productFilterForm = document.querySelector("#product-filter-form");

/** @type {HTMLElement|null} */
const productFilterSection = document.querySelector(".product-section");

if (productFilterForm && productFilterSection) {
    /**
     * Inclusive lower bound per radio value. Read once at startup; the cards
     * themselves live inside groups appended after this point.
     *
     * @type {Record<string, [number, number]>}
     */
    const PRICE_RANGES = {
        "0-100": [0, 100],
        "100-500": [100, 500],
        "500-1000": [500, 1000],
        "1000-plus": [1000, Infinity]
    };

    /**
     * Reads the checked value for one filter group.
     *
     * @param {string} name - Radio group name, e.g. `"price"`.
     * @returns {string} The checked value, or `"all"` when nothing is checked.
     */
    const getFilterValue = (name) => {
        const selected = productFilterForm.querySelector(`input[name="${name}"]:checked`);

        return selected ? selected.value : "all";
    };

    /**
     * Tests a price against the selected band. The upper bound is exclusive,
     * matching how the labels read ("$100 - $500").
     *
     * @param {number} price - Price taken from the card's data attribute.
     * @param {string} filter - Selected radio value.
     * @returns {boolean} True when the price falls inside the band.
     */
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

    /**
     * Tests a value against a "50% and above" / "4 stars and above" threshold.
     *
     * @param {number} value - Value taken from the card's data attribute.
     * @param {string} filter - Selected radio value.
     * @returns {boolean} True when the value reaches the threshold.
     */
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

    /**
     * Writes a result count into each group's own live region.
     *
     * Counts are read back from the classes just applied rather than being
     * passed in, so one category's message is never overwritten by another's.
     * Groups without real cards are skipped, which leaves a load-failure or
     * empty-category message intact.
     *
     * @returns {void}
     */
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

    /**
     * Applies every active filter to all rendered cards, announces the new
     * counts and notifies the carousel.
     *
     * Every filter must pass. Skeletons are skipped because they carry no data
     * attributes, which would report each one as a mismatch.
     *
     * @returns {void}
     */
    const applyFilters = () => {
        const priceFilter = getFilterValue("price");
        const discountFilter = getFilterValue("discount");
        const ratingFilter = getFilterValue("rating");

        const cards = productFilterSection.querySelectorAll(".product-card:not(.product-card--loading)");

        cards.forEach((card) => {
            const shouldShow =
                matchesPrice(Number(card.dataset.price) || 0, priceFilter) &&
                matchesThreshold(Number(card.dataset.discount) || 0, discountFilter) &&
                matchesThreshold(Number(card.dataset.rating) || 0, ratingFilter);

            card.classList.toggle("is-filtered", !shouldShow);
        });

        announce();

        document.dispatchEvent(new CustomEvent("products-filtered"));
    };

    /**
     * A single delegated listener covers every radio, so filters added later
     * need no extra wiring.
     *
     * @param {Event} event - Change event bubbling up from a radio.
     * @returns {void}
     */
    productFilterForm.addEventListener("change", (event) => {
        if (!event.target.matches('input[type="radio"]')) {
            return;
        }

        applyFilters();
    });

    /**
     * Reapplies the filters after a reset.
     *
     * The reset event fires before the browser restores the default checked
     * radio, so the read is deferred by one frame.
     *
     * @returns {void}
     */
    productFilterForm.addEventListener("reset", () => {
        requestAnimationFrame(applyFilters);
    });

    /**
     * Keeps the active selection applied to each category as it loads.
     *
     * @returns {void}
     */
    document.addEventListener("products-rendered", applyFilters);
}