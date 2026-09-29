const productSection = document.querySelector(".product-section");

if (productSection) {
    const productTrack = productSection.querySelector(".product-section__track");
    const productViewport = productSection.querySelector(".product-section__viewport");
    const previousButton = productSection.querySelector('[data-direction="prev"]');
    const nextButton = productSection.querySelector('[data-direction="next"]');
    const heading = productSection.querySelector(".product-section__title");
    const categoryList = document.querySelector(".category-list");

    const API_BASE = "https://dummyapi.codesmash.in/api/products/category";

    const status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    productSection.appendChild(status);

    let currentIndex = 0;
    let currentSlug = null;

    // Guards against a slow response overwriting a newer one
    let requestId = 0;

    const formatPrice = (value) => `$${Number(value).toFixed(2)}`;

    // Measured rather than hardcoded, because the card is fluid across breakpoints
    const measure = () => {
        const card = productTrack.querySelector(".product-card");
        const gap = parseFloat(getComputedStyle(productTrack).columnGap) || 0;

        return { cardWidth: card ? card.offsetWidth : 0, gap };
    };

    const updateCarousel = () => {
        const cards = productTrack.querySelectorAll(".product-card");

        if (!cards.length) {
            previousButton.disabled = true;
            nextButton.disabled = true;
            return;
        }

        const { cardWidth, gap } = measure();

        if (!cardWidth) {
            return;
        }

        const visibleCards = Math.max(1, Math.floor(productViewport.clientWidth / (cardWidth + gap)));
        const maxIndex = Math.max(0, cards.length - visibleCards);

        currentIndex = Math.min(currentIndex, maxIndex);

        productTrack.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;

        previousButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex >= maxIndex;
    };

    const resetCarousel = () => {
        currentIndex = 0;
        productTrack.style.transform = "";
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

        // Struck-through figure is only meaningful when the product is discounted
        const discount = Number(product.discountPercentage) || 0;

        if (discount > 0 && product.price) {
            const originalPrice = document.createElement("del");
            originalPrice.textContent = formatPrice(product.price / (1 - discount / 100));
            price.appendChild(originalPrice);
        }

        const stock = document.createElement("div");
        stock.className = "product-card__stock";

        const stockState = document.createElement("span");
        const remaining = Number(product.stock) || 0;
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

    const clearTrack = () => {
        productTrack.textContent = "";
    };

    const showLoading = (label) => {
        clearTrack();
        resetCarousel();

        for (let i = 0; i < 8; i++) {
            productTrack.appendChild(createLoadingCard());
        }

        productSection.setAttribute("aria-busy", "true");
        previousButton.disabled = true;
        nextButton.disabled = true;

        status.textContent = `Loading ${label} products`;

        updateCarousel();
    };

    const showMessage = (text, role) => {
        clearTrack();
        resetCarousel();

        const message = document.createElement("div");
        message.className = "product-section__message";

        if (role) {
            message.setAttribute("role", role);
        }

        const copy = document.createElement("p");
        copy.textContent = text;

        message.appendChild(copy);
        productTrack.appendChild(message);

        productSection.setAttribute("aria-busy", "false");
        previousButton.disabled = true;
        nextButton.disabled = true;

        status.textContent = text;

        updateCarousel();
    };

    const renderProducts = (products, label) => {
        clearTrack();

        products.forEach((product) => {
            productTrack.appendChild(createProductCard(product));
        });

        productSection.setAttribute("aria-busy", "false");
        status.textContent = `Showing ${products.length} ${label} products`;

        resetCarousel();
        updateCarousel();
    };

    const loadCategory = (slug, label) => {
        if (!slug) {
            return;
        }

        currentSlug = slug;

        const request = ++requestId;

        heading.textContent = label;
        showLoading(label);

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

                if (!products.length) {
                    showMessage(`No ${label} products found.`, "status");
                    return;
                }

                renderProducts(products, label);
            })
            .catch((error) => {
                if (request !== requestId) {
                    return;
                }

                console.error(`Failed to load ${label} products:`, error);

                showMessage(`Couldn't load ${label} products. Please try again.`, "alert");
            });
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
