/**
 * @file Product section controller.
 *
 * Owns the product section: fetches a category from the API and appends a new
 * carousel group for it, leaving every category already loaded on screen.
 */

/** @type {HTMLElement|null} */
const productSection = document.querySelector(".product-section");

if (productSection) {
    /** @type {HTMLElement} Track that holds every category group. */
    const productTrack = productSection.querySelector(".product-section__track");

    /** @type {HTMLElement|null} Sidebar list, listened to for category clicks. */
    const categoryList = document.querySelector(".category-list");

    /** @type {string} */
    const API_BASE = "https://dummyapi.codesmash.in/api/products/category";

    /**
     * Every slug that already has a group, so a repeated click cannot append a
     * second copy of the same category.
     *
     * @type {Set<string>}
     */
    const loadedSlugs = new Set();

    /**
     * One entry per category group, so each keeps its own header and scroll
     * position.
     *
     * @type {object[]}
     */
    const groups = [];

    /**
     * Recomputes scroll bounds for every loaded group.
     *
     * @returns {void}
     */
    const updateCarousel = () => {
        groups.forEach(ProductCarousel.updateGroup);
    };

    /**
     * Filtering changes how many cards are visible, so each group has to
     * recompute its own bounds.
     *
     * @returns {void}
     */
    document.addEventListener("products-filtered", updateCarousel);

    /**
     * Appends a new carousel group for one category and fills it from the API.
     *
     * @param {string} slug - API category slug.
     * @param {string} label - Display name used in the heading and messages.
     * @returns {void}
     */
    const loadCategory = (slug, label) => {
        if (!slug || loadedSlugs.has(slug)) {
            return;
        }

        loadedSlugs.add(slug);

        const placeholder = productTrack.querySelector("[data-placeholder]");

        if (placeholder) {
            placeholder.remove();
        }

        const ref = ProductCarousel.createGroup(label);

        groups.push(ref);
        productTrack.appendChild(ref.group);

        ref.group.setAttribute("aria-busy", "true");

        for (let i = 0; i < 8; i++) {
            ref.track.appendChild(ProductCard.createSkeleton());
        }

        ProductCarousel.updateGroup(ref);

        ref.status.textContent = `Loading ${label} products`;

        fetch(`${API_BASE}/${encodeURIComponent(slug)}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                return response.json();
            })
            .then((data) => {
                /**
                 * Each request only ever writes into its own `ref`, and groups
                 * are appended rather than replacing one another, so an
                 * out-of-order response is always still wanted.
                 *
                 * @type {object[]}
                 */
                const products = (data && data.products) || [];

                ref.group.setAttribute("aria-busy", "false");

                if (!products.length) {
                    ProductCarousel.renderMessage(ref.track, `No ${label} products found.`, "status");
                    ref.status.textContent = `No ${label} products found`;
                    ProductCarousel.updateGroup(ref);
                    return;
                }

                ProductCarousel.renderCards(ref.track, products.map(ProductCard.create));

                /**
                 * The base count is written first so the filter, which runs
                 * synchronously inside this dispatch and rewrites every group's
                 * status from the classes it applies, has the last word.
                 *
                 * @type {string}
                 */
                const baseStatus = `Showing ${products.length} ${label} products`;

                ref.status.textContent = baseStatus;

                /**
                 * Fired after the cards are in the DOM so the filter can
                 * apply the active selection to this group too.
                 *
                 * @type {CustomEvent<Record<string, never>>}
                 */
                const rendered = new CustomEvent("products-rendered");

                document.dispatchEvent(rendered);

                ProductCarousel.updateGroup(ref);
            })
            .catch((error) => {
                console.error(`Failed to load ${label} products:`, error);

                ref.group.setAttribute("aria-busy", "false");
                ProductCarousel.renderMessage(ref.track, `Couldn't load ${label} products. Please try again.`, "alert");
                ref.status.textContent = `Couldn't load ${label} products`;

                ProductCarousel.updateGroup(ref);
            });
    };

    /**
     * Scrolls whichever group the clicked arrow belongs to.
     *
     * Delegated from the section, so it covers every group including ones added
     * after this listener was attached.
     *
     * @param {MouseEvent} event - Click bubbling up from an arrow button.
     * @returns {void}
     */
    productSection.addEventListener("click", (event) => {
        const button = event.target.closest(".product-section__control");

        if (!button) {
            return;
        }

        const group = button.closest(".product-section__group");
        const ref = groups.find((item) => item.group === group);

        if (ref) {
            ProductCarousel.stepGroup(ref, button.dataset.direction === "next" ? 1 : -1);
        }
    });

    /**
     * Card widths are fluid, so bounds depend on the viewport.
     *
     * @returns {void}
     */
    window.addEventListener("resize", updateCarousel);

    /**
     * Loads the first category once the sidebar list has data.
     *
     * @param {CustomEvent<{slug: string, label: string}>} event - Payload from category.js.
     * @returns {void}
     */
    document.addEventListener("category-ready", (event) => {
        loadCategory(event.detail.slug, event.detail.label);
    });

    if (categoryList) {
        /**
         * Loads whichever category was clicked.
         *
         * Delegated so it survives the category list being re-rendered.
         *
         * @param {MouseEvent} event - Click bubbling up from a category item.
         * @returns {void}
         */
        categoryList.addEventListener("click", (event) => {
            const button = event.target.closest(".category-list__item");

            if (!button) {
                return;
            }

            const slug = button.dataset.slug;
            const label = button.querySelector(".category-list__name").textContent;

            loadCategory(slug, label);
        });
    }
}