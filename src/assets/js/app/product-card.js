// Renders a single product card, plus the placeholder shown while a category loads
const formatPrice = (value) => `$${Number(value).toFixed(2)}`;

const createProductCard = (product) => {
    const article = document.createElement("article");
    article.className = "product-card";

    // Exposed as data attributes so the filter can read values off the DOM
    // instead of keeping a second copy of every product
    article.dataset.price = Number(product.price) || 0;
    article.dataset.discount = Number(product.discountPercentage) || 0;
    article.dataset.rating = Number(product.rating) || 0;

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

const ProductCard = {
    create: createProductCard,
    createSkeleton: createLoadingCard
};
