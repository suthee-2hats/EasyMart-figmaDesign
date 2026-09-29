const productSection = document.querySelector(".product-section");

if (productSection) {
    const productTrack = productSection.querySelector(".product-section__track");
    const categoryList = document.querySelector(".category-list");

    const API_BASE = "https://dummyapi.codesmash.in/api/products/category";

    const status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    productSection.appendChild(status);

    // Incremented per request so a slow response cannot overwrite a newer group
    let requestId = 0;
    let lastSlug = null;

    // One entry per category group, so each keeps its own header and scroll position
    const groups = [];

    const formatPrice = (value) => `$${Number(value).toFixed(2)}`;

    // Measured, not hardcoded, because the card is fluid across breakpoints
    const measure = (row) => {
        const card = row.querySelector(".product-card");
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;

        return { cardWidth: card ? card.offsetWidth : 0, gap };
    };

    const getBounds = (ref) => {
        const cards = ref.track.querySelectorAll(".product-card:not(.product-card--loading)");

        if (!cards.length) {
            return null;
        }

        const { cardWidth, gap } = measure(ref.track);

        if (!cardWidth) {
            return null;
        }

        const visibleCards = Math.max(1, Math.floor(ref.viewport.clientWidth / (cardWidth + gap)));

        return { cardWidth, gap, count: cards.length, maxIndex: Math.max(0, cards.length - visibleCards) };
    };

    // Each group is clamped to its own end, so one short row cannot block another
    const updateGroup = (ref) => {
        const bounds = getBounds(ref);

        if (!bounds) {
            ref.previous.disabled = true;
            ref.next.disabled = true;
            return;
        }

        const index = Math.min(Number(ref.track.dataset.index) || 0, bounds.maxIndex);

        ref.track.dataset.index = String(index);
        ref.track.style.transform = `translateX(-${index * (bounds.cardWidth + bounds.gap)}px)`;

        ref.previous.disabled = index === 0;
        ref.next.disabled = index >= bounds.maxIndex;
    };

    const updateCarousel = () => {
        groups.forEach(updateGroup);
    };

    const stepGroup = (ref, direction) => {
        const bounds = getBounds(ref);

        if (!bounds) {
            return;
        }

        const index = Number(ref.track.dataset.index) || 0;

        ref.track.dataset.index = String(
            Math.max(0, Math.min(bounds.maxIndex, index + direction))
        );

        updateGroup(ref);
    };

    const createProductCard = (product) => {
        const article = document.createElement("article");
        article.className = "product-card";

        const image = document.createElement("div");
        image.className = "product-card__image";

        const img = document.createElement("img");
        img.src = product.thumbnail || (product.images && product.images[0]) || "";
        img.alt = product.title || "Product";
        img.loading = "lazy";
        image.appendChild(img);

        const name = document.createElement("h3");
        name.className = "product-card__name";
        name.textContent = product.title || "Product";

        const priceAndStock = document.createElement("div");
        priceAndStock.className = "product-card__priceAndStock";

        // The card design has a small descriptor line; the API exposes brand here
        const pricePerLb = document.createElement("div");
        pricePerLb.className = "product-card__pricePerLb";

        const descriptor = document.createElement("p");
        descriptor.textContent = product.brand || "";
        pricePerLb.appendChild(descriptor);

        const price = document.createElement("div");
        price.className = "product-card__price";

        const currentPrice = document.createElement("strong");
        currentPrice.textContent = formatPrice(product.price || 0);
        price.appendChild(currentPrice);

        // Struck-through figure only means something when the product is discounted
        const discount = Number(product.discountPercentage) || 0;

        if (discount > 0 && product.price) {
            const originalPrice = document.createElement("del");
            originalPrice.textContent = formatPrice(product.price / (1 - discount / 100));
            price.appendChild(originalPrice);
        }

        const stock = document.createElement("div");
        stock.className = "product-card__stock";

        const remaining = Number(product.stock) || 0;

        const stockState = document.createElement("span");
        stockState.textContent = remaining > 0 ? "In stock" : "Out of stock";

        const separator = document.createElement("span");
        separator.textContent = "|";

        const stockLeft = document.createElement("span");
        stockLeft.textContent = `${remaining} Left`;

        stock.appendChild(stockState);
        stock.appendChild(separator);
        stock.appendChild(stockLeft);

        priceAndStock.appendChild(pricePerLb);
        priceAndStock.appendChild(price);
        priceAndStock.appendChild(stock);

        article.appendChild(image);
        article.appendChild(name);
        article.appendChild(priceAndStock);

        return article;
    };

    const createLoadingCard = () => {
        const article = document.createElement("article");
        article.className = "product-card product-card--loading";
        article.setAttribute("aria-hidden", "true");

        const image = document.createElement("div");
        image.className = "product-card__image";

        const name = document.createElement("div");
        name.className = "product-card__bar";

        const price = document.createElement("div");
        price.className = "product-card__bar product-card__bar--short";

        article.appendChild(image);
        article.appendChild(name);
        article.appendChild(price);

        return article;
    };

    const createControl = (direction, label) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "product-section__control";
        button.dataset.direction = direction;
        button.setAttribute("aria-label", label);

        const glyph = document.createElement("span");
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = direction === "prev" ? "\u2039" : "\u203a";

        button.appendChild(glyph);

        return button;
    };

    // Each category is a self-contained block: its own heading, its own
    // prev/next controls, and its own scrolling row of cards.
    const createGroup = (label) => {
        const group = document.createElement("section");
        group.className = "product-section__group";

        const header = document.createElement("div");
        header.className = "product-section__header";

        const heading = document.createElement("h2");
        heading.className = "product-section__title";
        heading.textContent = label;

        const controls = document.createElement("div");
        controls.className = "product-section__controls";
        controls.setAttribute("aria-label", `${label} navigation`);

        const previous = createControl("prev", `Previous ${label} products`);
        const next = createControl("next", `Next ${label} products`);

        controls.appendChild(previous);
        controls.appendChild(next);

        header.appendChild(heading);
        header.appendChild(controls);

        const viewport = document.createElement("div");
        viewport.className = "product-section__viewport";

        const track = document.createElement("div");
        track.className = "product-section__group-track";
        track.dataset.index = "0";

        viewport.appendChild(track);

        group.appendChild(header);
        group.appendChild(viewport);

        return { group, viewport, track, previous, next };
    };

    const fillRow = (row, cards) => {
        row.textContent = "";
        cards.forEach((card) => row.appendChild(card));
    };

    const showMessageIn = (row, text, role) => {
        row.textContent = "";

        const message = document.createElement("div");
        message.className = "product-section__message";

        if (role) {
            message.setAttribute("role", role);
        }

        const copy = document.createElement("p");
        copy.textContent = text;

        message.appendChild(copy);
        row.appendChild(message);
    };

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
        const ref = createGroup(label);
        groups.push(ref);
        productTrack.appendChild(ref.group);

        ref.group.setAttribute("aria-busy", "true");

        for (let i = 0; i < 8; i++) {
            ref.track.appendChild(createLoadingCard());
        }

        // No cards yet, so the controls start disabled while loading
        updateGroup(ref);

        status.textContent = `Loading ${label} products`;

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
                    showMessageIn(ref.track, `No ${label} products found.`, "status");
                    status.textContent = `No ${label} products found`;
                    updateGroup(ref);
                    return;
                }

                fillRow(ref.track, products.map(createProductCard));

                status.textContent = `Showing ${products.length} ${label} products`;

                updateGroup(ref);
            })
            .catch((error) => {
                if (request !== requestId) {
                    return;
                }

                console.error(`Failed to load ${label} products:`, error);

                ref.group.setAttribute("aria-busy", "false");
                showMessageIn(ref.track, `Couldn't load ${label} products. Please try again.`, "alert");
                status.textContent = `Couldn't load ${label} products`;

                updateGroup(ref);
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
            stepGroup(ref, button.dataset.direction === "next" ? 1 : -1);
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
