const productFilters = document.querySelector(".product-filters");
const filterToggle = document.querySelector(".menu-mobile-trigger");

function closeFilters() {
    productFilters.classList.remove("is-open");
    filterToggle.setAttribute("aria-expanded", "false");
}

filterToggle.addEventListener("click", () => {
    const isOpen = productFilters.classList.toggle("is-open");
    filterToggle.setAttribute("aria-expanded", isOpen);
});

document.addEventListener("click", (e) => {
    if (
        productFilters.classList.contains("is-open") &&
        !productFilters.contains(e.target) &&
        !filterToggle.contains(e.target)
    ) {
        closeFilters();
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) {
        closeFilters();
    }
});