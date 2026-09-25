const categoryItems = document.querySelectorAll(".category-list__item");

categoryItems.forEach((item) => {
    item.addEventListener("click", () => {
        categoryItems.forEach((el) => {
            el.classList.remove("category-list__item--active");
            el.setAttribute("aria-pressed", "false");
        });

        item.classList.add("category-list__item--active");
        item.setAttribute("aria-pressed", "true");
    });
});