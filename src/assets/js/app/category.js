const categoryList = document.querySelector(".category-list");

const CATEGORY_ICONS = {
    automotive: "1F697",
    beauty: "1F484",
    electronics: "1F5A5",
    fragrances: "1F338",
    furniture: "1F6CB",
    groceries: "1F6D2",
    "home-decoration": "1F5BC",
    "kitchen-accessories": "1F37D",
    laptops: "1F4BB",
    lighting: "1F4A1",
    "mens-shirts": "1F455",
    "mens-shoes": "1F45E",
    "mens-watches": "231A",
    motorcycle: "1F3CD",
    skincare: "1F9F4",
    smartphones: "1F4F1",
    "sports-accessories": "26BD",
    sunglasses: "1F576",
    tops: "1F3BD",
    "womens-bags": "1F45C",
    "womens-dresses": "1F457",
    "womens-jewellery": "1F48E",
    "womens-shoes": "1F460",
    "womens-watches": "231A"
};

const ICON_BASE = "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg";

if (categoryList) {
    const select = (active) => {
        categoryList.querySelectorAll(".category-list__item").forEach((el) => {
            const isActive = el === active;
            el.classList.toggle("category-list__item--active", isActive);
            el.setAttribute("aria-pressed", String(isActive));
        });
    };

    const toLabel = (slug) =>
        slug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    fetch("https://dummyapi.codesmash.in/api/products/categories")
        .then((res) => res.json())
        .then((categories) => {
            categories.forEach((slug, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "category-list__item";
                button.setAttribute("aria-pressed", String(index === 0));

                if (index === 0) {
                    button.classList.add("category-list__item--active");
                }

                const icon = document.createElement("span");
                icon.className = "category-list__icon";

                const img = document.createElement("img");
                img.src = `${ICON_BASE}/${CATEGORY_ICONS[slug] || "1F4E6"}.svg`;
                img.alt = "";
                img.width = 32;
                img.height = 32;

                icon.appendChild(img);

                const name = document.createElement("span");
                name.className = "category-list__name";
                name.textContent = toLabel(slug);

                button.appendChild(icon);
                button.appendChild(name);
                button.addEventListener("click", () => select(button));

                categoryList.appendChild(button);
            });
        })
        .catch((error) => {
            console.error("Failed to load categories:", error);
        });
}