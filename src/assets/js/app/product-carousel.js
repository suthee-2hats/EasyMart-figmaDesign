/**
 * @file Category carousel.
 *
 * Builds one category group - its own heading, prev/next arrows and scrolling
 * card row - and keeps that row positioned within its own limits.
 */

/**
 * Selector for cards that count towards scroll bounds.
 *
 * Filtered-out cards are `display: none`, so they must not be counted or
 * measured, and skeletons are skipped because they carry no filter data.
 *
 * @type {string}
 */
const VISIBLE_CARD = ".product-card:not(.product-card--loading):not(.is-filtered)";

/**
 * Collects the cards currently occupying space in a group row.
 *
 * @param {HTMLElement} row - The group's scroll track.
 * @returns {NodeListOf<Element>} Matching cards in document order.
 */
const getVisibleCards = (row) => row.querySelectorAll(VISIBLE_CARD);

/**
 * Measures one card plus the row gap.
 *
 * Sizes are read rather than hardcoded because the card is fluid across
 * breakpoints. A visible card is measured because a filtered one reports a
 * width of 0.
 *
 * @param {HTMLElement} row - The group's scroll track.
 * @returns {{cardWidth: number, gap: number}} Measured card width and gap.
 */
const measure = (row) => {
    const card = row.querySelector(VISIBLE_CARD);
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;

    return { cardWidth: card ? card.offsetWidth : 0, gap };
};

/**
 * Works out how far a group can scroll, given what is currently visible.
 *
 * @param {object} ref - Group reference, as returned by `createGroup`.
 * @returns {{cardWidth: number, gap: number, count: number, maxIndex: number}|null}
 *   Scroll bounds, or null when the row has nothing measurable to show.
 */
const getBounds = (ref) => {
    const cards = getVisibleCards(ref.track);

    if (!cards.length) {
        return null;
    }

    const { cardWidth, gap } = measure(ref.track);

    if (!cardWidth) {
        return null;
    }

    const visibleCards = Math.max(1, Math.floor(ref.viewport.clientWidth / (cardWidth + gap)));

    return { cardWidth, gap, count: cards.length, maxIndex: Math.max(0, cards.length - visibleCards) };
};

/**
 * Clamps a group to its own end and updates both arrow states.
 *
 * Clamping per group means one short row cannot block another.
 *
 * @param {object} ref - Group reference, as returned by `createGroup`.
 * @returns {void}
 */
const updateGroup = (ref) => {
    const bounds = getBounds(ref);

    if (!bounds) {
        ref.previous.disabled = true;
        ref.next.disabled = true;

        ref.track.style.transform = "translateX(0)";

        return;
    }

    const index = Math.min(Number(ref.track.dataset.index) || 0, bounds.maxIndex);

    ref.track.dataset.index = String(index);
    ref.track.style.transform = `translateX(-${index * (bounds.cardWidth + bounds.gap)}px)`;

    ref.previous.disabled = index === 0;
    ref.next.disabled = index >= bounds.maxIndex;
};

/**
 * Scrolls a group forwards or backwards by one card, staying in bounds.
 *
 * @param {object} ref - Group reference, as returned by `createGroup`.
 * @param {number} direction - Positive to advance, negative to go back.
 * @returns {void}
 */
const stepGroup = (ref, direction) => {
    const bounds = getBounds(ref);

    if (!bounds) {
        return;
    }

    const index = Number(ref.track.dataset.index) || 0;

    ref.track.dataset.index = String(
        Math.max(0, Math.min(bounds.maxIndex, index + direction))
    );

    updateGroup(ref);
};

/**
 * Builds one prev/next arrow button.
 *
 * @param {string} direction - Either `"prev"` or `"next"`.
 * @param {string} label - Accessible name, including the category.
 * @returns {HTMLButtonElement} The arrow button.
 */
const createControl = (direction, label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product-section__control";
    button.dataset.direction = direction;
    button.setAttribute("aria-label", label);

    const glyph = document.createElement("span");
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = direction === "prev" ? "\u2039" : "\u203a";

    button.appendChild(glyph);

    return button;
};

/**
 * Builds a complete category group: header, arrows, scroll viewport and its own
 * live region.
 *
 * @param {string} label - Category name, used as heading and arrow labels.
 * @returns {{group: HTMLElement, viewport: HTMLElement, track: HTMLElement,
 *   previous: HTMLButtonElement, next: HTMLButtonElement, status: HTMLElement}}
 *   Group reference used by the scroll and announcement logic.
 */
const createGroup = (label) => {
    const group = document.createElement("section");
    group.className = "product-section__group";

    const header = document.createElement("div");
    header.className = "product-section__header";

    const heading = document.createElement("h2");
    heading.className = "product-section__title";
    heading.textContent = label;

    const controls = document.createElement("div");
    controls.className = "product-section__controls";
    controls.setAttribute("aria-label", `${label} navigation`);

    const previous = createControl("prev", `Previous ${label} products`);
    const next = createControl("next", `Next ${label} products`);

    controls.appendChild(previous);
    controls.appendChild(next);

    header.appendChild(heading);
    header.appendChild(controls);

    const viewport = document.createElement("div");
    viewport.className = "product-section__viewport";

    const track = document.createElement("div");
    track.className = "product-section__group-track";
    track.dataset.index = "0";

    viewport.appendChild(track);

    group.appendChild(header);
    group.appendChild(viewport);

    /**
     * Per-group live region, so each category announces itself without
     * overwriting the message belonging to another group.
     *
     * @type {HTMLElement}
     */
    const status = document.createElement("span");
    status.className = "sr-only product-section__group-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    group.appendChild(status);

    return { group, viewport, track, previous, next, status };
};

/**
 * Replaces a row's contents with the given cards.
 *
 * @param {HTMLElement} row - The group's scroll track.
 * @param {HTMLElement[]} cards - Cards to append, in order.
 * @returns {void}
 */
const fillRow = (row, cards) => {
    row.textContent = "";
    cards.forEach((card) => row.appendChild(card));
};

/**
 * Replaces a row's contents with a standalone message, used for load failures
 * and empty categories.
 *
 * @param {HTMLElement} row - The group's scroll track.
 * @param {string} text - Message shown in place of cards.
 * @param {string} [role] - ARIA role for the message wrapper.
 * @returns {void}
 */
const showMessageIn = (row, text, role) => {
    row.textContent = "";

    const message = document.createElement("div");
    message.className = "product-section__message";

    if (role) {
        message.setAttribute("role", role);
    }

    const copy = document.createElement("p");
    copy.textContent = text;

    message.appendChild(copy);
    row.appendChild(message);
};

/**
 * Public carousel API, namespaced as a `window` global because the bundle
 * concatenates every file into one shared top-level scope.
 *
 * @type {{
 *   createGroup: typeof createGroup,
 *   updateGroup: typeof updateGroup,
 *   stepGroup: typeof stepGroup,
 *   renderCards: typeof fillRow,
 *   renderMessage: typeof showMessageIn
 * }}
 */
const ProductCarousel = {
    createGroup: createGroup,
    updateGroup: updateGroup,
    stepGroup: stepGroup,
    renderCards: fillRow,
    renderMessage: showMessageIn
};