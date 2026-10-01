const searchForm = document.querySelector(".header-search");
const searchInput = document.querySelector("#header-search");
const searchDropdown = document.querySelector(".search-dropdown");
const searchInside = document.querySelector(".header-search_inside");
const searchPopular = document.querySelector(".search-dropdown__popular");
const searchResults = document.querySelector(".search-dropdown__results");

const SEARCH_API = "https://dummyapi.codesmash.in/api/products/search";

// A request that never settles would leave "Searching..." on screen forever
const SEARCH_TIMEOUT = 8000;

if (searchInput && searchDropdown && searchInside && searchPopular && searchResults) {

    // Set while picking a result, so the refocus that follows does not
    // reopen the dropdown on the way out
    let suppressOpen = false;

    let searchTimer;

    // Aborts the in-flight request when the user keeps typing
    let currentController = null;

    // Guards against a slow response resolving after a newer query started,
    // which would otherwise repaint the panel with stale results
    let latestQuery = 0;

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

    const showPanel = (panel) => {
        searchPopular.hidden = panel !== searchPopular;
        searchResults.hidden = panel !== searchResults;
    };

    const showPopularSearches = () => {
        searchResults.textContent = "";
        showPanel(searchPopular);
    };

    const showMessage = (text, isError) => {
        searchResults.textContent = "";

        const message = document.createElement("div");
        message.className = isError
            ? "search-dropdown__empty search-dropdown__empty--error"
            : "search-dropdown__empty";
        message.textContent = text;

        searchResults.appendChild(message);
        showPanel(searchResults);
    };

    const renderProducts = (products) => {
        searchResults.textContent = "";
        showPanel(searchResults);

        // The panel is a fixed-height scroll area, so a short cap keeps it
        // from becoming a full catalogue
        products.slice(0, 5).forEach((product) => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "search-dropdown__product";

            const image = document.createElement("span");
            image.className = "search-dropdown__product-image";

            const img = document.createElement("img");
            img.src = product.thumbnail || (product.images && product.images[0]) || "";
            img.alt = "";
            img.width = 48;
            img.height = 48;
            image.appendChild(img);

            const info = document.createElement("span");
            info.className = "search-dropdown__product-info";

            const title = document.createElement("span");
            title.className = "search-dropdown__product-title";
            title.textContent = product.title || "Product";

            const price = document.createElement("span");
            price.className = "search-dropdown__product-price";
            price.textContent = formatPrice(product.price);

            info.appendChild(title);
            info.appendChild(price);

            row.appendChild(image);
            row.appendChild(info);

            row.addEventListener("click", () => {
                searchInput.value = product.title || "";

                closeDropdown();

                // focus() fires its event synchronously, so the guard is
                // consumed by this call rather than leaking into the next one
                suppressOpen = true;
                searchInput.focus();
                suppressOpen = false;
            });

            searchResults.appendChild(row);
        });
    };

    // Turns whatever fetch threw into a message a shopper can act on
    const describeFailure = (error) => {
        if (!navigator.onLine) {
            return "You appear to be offline. Check your connection.";
        }

        if (error instanceof TypeError) {
            // fetch only rejects with TypeError for network-level failures
            return "Could not reach the server. Please try again.";
        }

        if (error.status) {
            if (error.status === 404) {
                return "Search is unavailable right now.";
            }

            if (error.status === 429) {
                return "Too many searches. Wait a moment and try again.";
            }

            if (error.status >= 500) {
                return "The server had a problem. Please try again.";
            }

            return `Search failed (error ${error.status}).`;
        }

        if (error.name === "SyntaxError") {
            return "Received an unexpected response from the server.";
        }

        return "Something went wrong. Please try again.";
    };

    const searchProducts = async (query) => {
        // Every search takes a ticket; only the newest ticket may paint
        const ticket = ++latestQuery;

        if (currentController) {
            currentController.abort();
        }

        const controller = new AbortController();
        currentController = controller;

        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, SEARCH_TIMEOUT);

        showMessage("Searching...");

        try {
            const response = await fetch(
                `${SEARCH_API}?q=${encodeURIComponent(query)}&limit=5`,
                { signal: controller.signal }
            );

            if (!response.ok) {
                const httpError = new Error(`HTTP error: ${response.status}`);
                httpError.status = response.status;
                throw httpError;
            }

            const data = await response.json();

            // Superseded while this request was in flight
            if (ticket !== latestQuery) {
                return;
            }

            const products = (data && data.products) || [];

            if (products.length) {
                renderProducts(products);
            } else {
                showMessage(`No products found for "${query}".`);
            }
        } catch (error) {
            clearTimeout(timer);

            // A newer keystroke cancelled this one, which is expected
            if (ticket !== latestQuery) {
                return;
            }

            if (timedOut) {
                showMessage("Search took too long. Please try again.", true);
                return;
            }

            // Our own cancellation, not a failure worth reporting
            if (error.name === "AbortError") {
                return;
            }

            console.error("Product search failed:", error);
            showMessage(describeFailure(error), true);
        } finally {
            clearTimeout(timer);

            // Release the reference so the next search does not abort a
            // request that has already finished
            if (currentController === controller) {
                currentController = null;
            }
        }
    };

    // Enter must not submit the form and reload the page
    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const query = searchInput.value.trim();

            clearTimeout(searchTimer);

            if (query) {
                searchProducts(query);
            }
        });
    }

    // Clicking anywhere on the pill focuses the input, so the dropdown opens
    searchInside.addEventListener("click", () => {
        if (document.activeElement !== searchInput) {
            searchInput.focus();
        }
    });

    searchInput.addEventListener("focus", () => {
        openDropdown();

        if (!searchInput.value.trim()) {
            showPopularSearches();
        }
    });

    searchInput.addEventListener("input", (event) => {
        const query = event.target.value.trim();

        clearTimeout(searchTimer);

        if (!query) {
            // Invalidate anything still in flight, or its response would
            // overwrite the popular searches with results for a stale query
            latestQuery++;

            if (currentController) {
                currentController.abort();
                currentController = null;
            }

            showPopularSearches();
            return;
        }

        searchTimer = setTimeout(() => {
            searchProducts(query);
        }, 300);
    });

    // Picking a chip searches for it rather than just filling the field
    searchPopular.addEventListener("click", (event) => {
        const item = event.target.closest(".search-dropdown__item");

        if (!item) {
            return;
        }

        searchInput.value = item.textContent.trim();

        clearTimeout(searchTimer);
        searchProducts(searchInput.value);
    });

    const cancelPendingSearch = () => {
        clearTimeout(searchTimer);

        // Bump the ticket and abort, so a response that is already on its way
        // cannot reopen the panel after it was dismissed
        latestQuery++;

        if (currentController) {
            currentController.abort();
            currentController = null;
        }
    };

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".header-search")) {
            cancelPendingSearch();
            closeDropdown();
        }
    });

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            cancelPendingSearch();
            closeDropdown();
            searchInput.blur();
        }
    });
}
