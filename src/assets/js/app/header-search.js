/**
 * @file Header product search.
 *
 * Debounced live search against the product API, rendered into the animated
 * dropdown. Popular searches are shown while the field is empty.
 */

/** @type {HTMLFormElement|null} Form wrapper; its submit is suppressed. */
const searchForm = document.querySelector(".header-search");

/** @type {HTMLInputElement|null} */
const searchInput = document.querySelector("#header-search");

/** @type {HTMLElement|null} Animated panel. */
const searchDropdown = document.querySelector(".search-dropdown");

/** @type {HTMLElement|null} The pill, which focuses the input on click. */
const searchInside = document.querySelector(".header-search_inside");

/** @type {HTMLElement|null} */
const searchPopular = document.querySelector(".search-dropdown__popular");

/** @type {HTMLElement|null} Live region for results and status messages. */
const searchResults = document.querySelector(".search-dropdown__results");

/** @type {string} */
const SEARCH_API = "https://dummyapi.codesmash.in/api/products/search";

/**
 * Milliseconds before an unanswered request is abandoned. Without this a
 * request that never settles would leave "Searching..." on screen forever.
 *
 * @type {number}
 */
const SEARCH_TIMEOUT = 8000;

if (searchInput && searchDropdown && searchInside && searchPopular && searchResults) {

    /**
     * Set while picking a result so the refocus that immediately follows does
     * not reopen the dropdown on the way out.
     *
     * @type {boolean}
     */
    let suppressOpen = false;

    /** @type {ReturnType<typeof setTimeout>|undefined} Debounce handle. */
    let searchTimer;

    /**
     * Aborts the in-flight request when the user keeps typing.
     *
     * @type {AbortController|null}
     */
    let currentController = null;

    /**
     * Incremented per search. Guards against a slow response resolving after a
     * newer query started, which would otherwise repaint the panel with stale
     * results.
     *
     * @type {number}
     */
    let latestQuery = 0;

    /**
     * Reveals the dropdown, honouring the guard set while selecting a result.
     *
     * @returns {void}
     */
    const openDropdown = () => {
        if (suppressOpen) {
            suppressOpen = false;
            return;
        }

        searchDropdown.classList.add("is-open");
    };

    /**
     * Hides the dropdown.
     *
     * @returns {void}
     */
    const closeDropdown = () => {
        searchDropdown.classList.remove("is-open");
    };

    /**
     * Shows exactly one of the two panels, hiding the other.
     *
     * @param {HTMLElement} panel - Panel that should become visible.
     * @returns {void}
     */
    const showPanel = (panel) => {
        searchPopular.hidden = panel !== searchPopular;
        searchResults.hidden = panel !== searchResults;
    };

    /**
     * Clears any results and restores the popular-search chips.
     *
     * @returns {void}
     */
    const showPopularSearches = () => {
        searchResults.textContent = "";
        showPanel(searchPopular);
    };

    /**
     * Replaces the results with a single status line.
     *
     * @param {string} text - Message shown to the shopper.
     * @param {boolean} [isError] - Renders the failure colour when true.
     * @returns {void}
     */
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

    /**
     * Renders one button per product. Nodes are built with the DOM API and
     * filled through `textContent`, so product data is never parsed as HTML.
     *
     * @param {object[]} products - Products from the search response.
     * @returns {void}
     */
    const renderProducts = (products) => {
        searchResults.textContent = "";
        showPanel(searchResults);

        /**
         * The panel is a fixed-height scroll area, so a short cap keeps it
         * from becoming a full catalogue.
         *
         * @type {number}
         */
        const RESULT_LIMIT = 5;

        products.slice(0, RESULT_LIMIT).forEach((product) => {
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

                /**
                 * focus() fires its event synchronously, so the guard is
                 * consumed by this call instead of leaking into the next one.
                 *
                 * @type {boolean}
                 */
                const suppressWhileClosing = true;

                suppressOpen = suppressWhileClosing;
                searchInput.focus();
                suppressOpen = false;
            });

            searchResults.appendChild(row);
        });
    };

    /**
     * Turns whatever fetch threw into a message the shopper can act on.
     *
     * @param {Error & {status?: number}} error - Rejection from fetch or JSON parsing.
     * @returns {string} Message to display in place of results.
     */
    const describeFailure = (error) => {
        if (!navigator.onLine) {
            return "You appear to be offline. Check your connection.";
        }

        if (error instanceof TypeError) {
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

    /**
     * Runs a search and paints the outcome.
     *
     * Every call takes a ticket and only the newest one may paint, which
     * prevents an out-of-order response from overwriting newer results.
     *
     * @param {string} query - Trimmed search text.
     * @returns {Promise<void>} Resolves once the panel has settled.
     */
    const searchProducts = async (query) => {
        const ticket = ++latestQuery;

        if (currentController) {
            currentController.abort();
        }

        const controller = new AbortController();
        currentController = controller;

        /** @type {boolean} Set by the timeout below to tell our abort from the user's. */
        let timedOut = false;

        /** @type {ReturnType<typeof setTimeout>} */
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
                /** @type {Error & {status?: number}} */
                const httpError = new Error(`HTTP error: ${response.status}`);
                httpError.status = response.status;
                throw httpError;
            }

            const data = await response.json();

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

            if (ticket !== latestQuery) {
                return;
            }

            if (timedOut) {
                showMessage("Search took too long. Please try again.", true);
                return;
            }

            if (error.name === "AbortError") {
                return;
            }

            console.error("Product search failed:", error);
            showMessage(describeFailure(error), true);
        } finally {
            clearTimeout(timer);

            /**
             * Only clear the reference when it is still ours, so the next
             * search does not abort a request that already finished.
             */
            if (currentController === controller) {
                currentController = null;
            }
        }
    };

    if (searchForm) {
        /**
         * Enter must not submit the form and reload the page, so the default is
         * suppressed and the current query is run directly.
         *
         * @param {SubmitEvent} event - Native form submission.
         * @returns {void}
         */
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const query = searchInput.value.trim();

            clearTimeout(searchTimer);

            if (query) {
                searchProducts(query);
            }
        });
    }

    /**
     * Clicking anywhere on the pill focuses the input, which opens the panel.
     *
     * @returns {void}
     */
    searchInside.addEventListener("click", () => {
        if (document.activeElement !== searchInput) {
            searchInput.focus();
        }
    });

    /**
     * Opens on focus and falls back to the popular searches when empty.
     *
     * @returns {void}
     */
    searchInput.addEventListener("focus", () => {
        openDropdown();

        if (!searchInput.value.trim()) {
            showPopularSearches();
        }
    });

    /**
     * Debounces typing and, on an empty field, invalidates any request that is
     * still in flight so a stale response cannot repopulate the panel.
     *
     * @param {InputEvent} event - Native input event.
     * @returns {void}
     */
    searchInput.addEventListener("input", (event) => {
        const query = event.target.value.trim();

        clearTimeout(searchTimer);

        if (!query) {
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

    /**
     * Picking a chip searches for it rather than only filling the field.
     *
     * @param {MouseEvent} event - Click bubbling up from a chip.
     * @returns {void}
     */
    searchPopular.addEventListener("click", (event) => {
        const item = event.target.closest(".search-dropdown__item");

        if (!item) {
            return;
        }

        searchInput.value = item.textContent.trim();

        clearTimeout(searchTimer);
        searchProducts(searchInput.value);
    });

    /**
     * Drops any pending search. Bumping the ticket and aborting means a
     * response already on its way cannot reopen the panel after it was
     * dismissed.
     *
     * @returns {void}
     */
    const cancelPendingSearch = () => {
        clearTimeout(searchTimer);

        latestQuery++;

        if (currentController) {
            currentController.abort();
            currentController = null;
        }
    };

    /**
     * Dismisses the panel when the click lands outside the search component.
     *
     * @param {MouseEvent} event - Document-level click.
     * @returns {void}
     */
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".header-search")) {
            cancelPendingSearch();
            closeDropdown();
        }
    });

    /**
     * Escape closes the panel, cancels any pending search and releases focus.
     *
     * @param {KeyboardEvent} event - Native keydown.
     * @returns {void}
     */
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            cancelPendingSearch();
            closeDropdown();
            searchInput.blur();
        }
    });
}