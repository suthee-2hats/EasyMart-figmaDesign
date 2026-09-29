const productFilters = document.querySelector(".product-filters");
const filterToggle = document.querySelector(".menu-mobile-trigger");

if (productFilters && filterToggle) {
    const FOCUSABLE = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])'
    ].join(",");

    const isOpen = () => productFilters.classList.contains("is-open");

    const getFocusable = () =>
        Array.from(productFilters.querySelectorAll(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null
        );

    function openFilters() {
        productFilters.classList.add("is-open");
        filterToggle.setAttribute("aria-expanded", "true");

        const first = getFocusable()[0];

        if (first) {
            first.focus();
        }
    }

    function closeFilters(returnFocus = false) {
        if (!isOpen()) {
            return;
        }

        productFilters.classList.remove("is-open");
        filterToggle.setAttribute("aria-expanded", "false");

        if (returnFocus) {
            filterToggle.focus();
        }
    }

    filterToggle.addEventListener("click", () => {
        if (isOpen()) {
            closeFilters(true);
        } else {
            openFilters();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (!isOpen()) {
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            closeFilters(true);
            return;
        }

        if (e.key !== "Tab") {
            return;
        }

        const focusable = getFocusable();

        if (!focusable.length) {
            e.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const outside = !productFilters.contains(active);

        if (e.shiftKey && (active === first || outside)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (active === last || outside)) {
            e.preventDefault();
            first.focus();
        }
    });

    document.addEventListener("click", (e) => {
        if (
            isOpen() &&
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
}
