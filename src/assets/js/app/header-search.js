const searchInput = document.querySelector("#header-search");
const searchDropdown = document.querySelector(".search-dropdown");
const searchItems = document.querySelectorAll(".search-dropdown__item");
const searchInside = document.querySelector(".header-search_inside");

searchInside.addEventListener("click", () => {
    searchInput.focus();
    searchInput.style.borderColor = "none";
});

if (searchInput && searchDropdown) {

    // Set while picking a suggestion, so the refocus that follows does not
    // reopen the dropdown on the way out
    let suppressOpen = false;

    const openDropdown = () => {
        if (suppressOpen) {
            suppressOpen = false;
            return;
        }

        searchDropdown.classList.add("is-open");
    };

    const closeDropdown = () => {
        searchDropdown.classList.remove("is-open");
    };

    searchInput.addEventListener("focus", openDropdown);

    searchItems.forEach((item) => {
        item.addEventListener("click", () => {
            searchInput.value = item.textContent.trim();

            closeDropdown();

            // focus() fires its focus event synchronously, so the guard is
            // consumed by this call rather than leaking into the next one
            suppressOpen = true;
            searchInput.focus();
            suppressOpen = false;
        });
    });

    document.addEventListener("click", (event) => {

        if (!event.target.closest(".header-search")) {
            closeDropdown();
        }
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeDropdown();
            searchInput.blur();
        }
    });
}
