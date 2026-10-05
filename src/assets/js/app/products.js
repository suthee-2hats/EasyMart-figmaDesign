// Owns the product section: fetches a category from the API and appends a new
// carousel group for it, leaving every category already loaded on screen
const productSection = document.querySelector(".product-section");

if (productSection) {
    const productTrack = productSection.querySelector(".product-section__track");
    const categoryList = document.querySelector(".category-list");

    const API_BASE = "https://dummyapi.codesmash.in/api/products/category";

    // Incremented per request so a slow response cannot overwrite a newer group
    let requestId = 0;
    let lastSlug = null;

    // One entry per category group, so each keeps its own header and scroll position
    const groups = [];

    const updateCarousel = () => {
        groups.forEach(ProductCarousel.updateGroup);
    };

    // Filtering changes how many cards are visible, so each group has to
    // recompute its own bounds
    document.addEventListener("products-filtered", updateCarousel);

    const loadCategory = (slug, label) => {
        if (!slug || slug === lastSlug) {
            return;
        }

        lastSlug = slug;

        const request = ++requestId;

        // The static group is only a visual placeholder; its arrows are not
        // wired up, so it goes as soon as a real category replaces it
        const placeholder = productTrack.querySelector("[data-placeholder]");

        if (placeholder) {
            placeholder.remove();
        }

        // Appended, never cleared, so earlier categories stay on screen
        const ref = ProductCarousel.createGroup(label);
        groups.push(ref);
        productTrack.appendChild(ref.group);

        ref.group.setAttribute("aria-busy", "true");

        for (let i = 0; i < 8; i++) {
            ref.track.appendChild(ProductCard.createSkeleton());
        }

        // No cards yet, so the controls start disabled while loading
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
                if (request !== requestId) {
                    return;
                }

                const products = (data && data.products) || [];

                ref.group.setAttribute("aria-busy", "false");

                if (!products.length) {
                    ProductCarousel.renderMessage(ref.track, `No ${label} products found.`, "status");
                    ref.status.textContent = `No ${label} products found`;
                    ProductCarousel.updateGroup(ref);
                    return;
                }

                ProductCarousel.renderCards(ref.track, products.map(ProductCard.create));

                // Fired after the cards are in the DOM so the filter can
                // apply the active selection to this group too
                document.dispatchEvent(new CustomEvent("products-rendered"));

                ref.status.textContent = `Showing ${products.length} ${label} products`;

                ProductCarousel.updateGroup(ref);
            })
            .catch((error) => {
                if (request !== requestId) {
                    return;
                }

                console.error(`Failed to load ${label} products:`, error);

                ref.group.setAttribute("aria-busy", "false");
                ProductCarousel.renderMessage(ref.track, `Couldn't load ${label} products. Please try again.`, "alert");
                ref.status.textContent = `Couldn't load ${label} products`;

                ProductCarousel.updateGroup(ref);
            });
    };

    // One delegated listener, so it covers every group including ones added later
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

    window.addEventListener("resize", updateCarousel);

    // Fired once by category.js when the category list has loaded
    document.addEventListener("category-ready", (event) => {
        loadCategory(event.detail.slug, event.detail.label);
    });

    // Delegated so it survives the category list being re-rendered
    if (categoryList) {
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
