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

    const status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Loading categories";
    categoryList.appendChild(status);

    const showSkeletons = () => {
        categoryList.setAttribute("aria-busy", "true");

        for (let i = 0; i < 6; i++) {
            const skeleton = document.createElement("button");
            skeleton.type = "button";
            skeleton.className = "category-list__item category-list__item--skeleton";
            skeleton.disabled = true;
            skeleton.setAttribute("aria-hidden", "true");

            const bar = document.createElement("span");
            bar.className = "category-list__skeleton-bar";

            skeleton.appendChild(bar);
            categoryList.appendChild(skeleton);
        }
    };

    const buildItems = (categories) => {
        categoryList.textContent = "";
        categoryList.setAttribute("aria-busy", "false");
        status.textContent = "Categories loaded";

        categories.forEach((slug, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "category-list__item";
            button.dataset.slug = slug;
            button.setAttribute("aria-pressed", String(index === 0));

            if (index === 0) {
                button.classList.add("category-list__item--active");
            }

            const icon = document.createElement("span");
            icon.className = "category-list__icon";
            
            const iconWrapper = document.createElement("span");
            iconWrapper.className = "category-list__icon-wrapper";
            
            const img = document.createElement("img");
            img.src = `${ICON_BASE}/${CATEGORY_ICONS[slug] || "1F4E6"}.svg`;
            img.alt = "";
            img.width = 32;
            img.height = 32;
            
            iconWrapper.appendChild(img);
            icon.appendChild(iconWrapper);

            const name = document.createElement("span");
            name.className = "category-list__name";
            name.textContent = toLabel(slug);

            button.appendChild(icon);
            button.appendChild(name);
            button.addEventListener("click", () => select(button));

            categoryList.appendChild(button);
        });

        categoryList.appendChild(status);

        document.dispatchEvent(
            new CustomEvent("category-ready", {
                detail: { slug: categories[0], label: toLabel(categories[0]) }
            })
        );
    };

    const showError = () => {
        categoryList.textContent = "";
        categoryList.setAttribute("aria-busy", "false");
        status.textContent = "Categories could not be loaded";
        categoryList.appendChild(status);
    };

    showSkeletons();

    fetch("https://dummyapi.codesmash.in/api/products/categories")
        .then((res) => res.json())
        .then(buildItems)
        .catch(() => {
            console.error("Failed to load categories");
            showError();
        });
}

// Add scroll listener to category list
categoryList.addEventListener(
    "wheel",
    (event) => {
        if (event.deltaY === 0) return;

        event.preventDefault();

        categoryList.scrollLeft += event.deltaY;
    },
    { passive: false }
);