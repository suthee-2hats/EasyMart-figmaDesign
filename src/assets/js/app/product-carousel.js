// Builds one category group - its own heading, prev/next arrows and scrolling
// card row - and keeps that row positioned within its own limits
const measure = (row) => {
    // Measured, not hardcoded, because the card is fluid across breakpoints
    const card = row.querySelector(".product-card");
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;

    return { cardWidth: card ? card.offsetWidth : 0, gap };
};

const getBounds = (ref) => {
    const cards = ref.track.querySelectorAll(".product-card:not(.product-card--loading)");

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

// Each group is clamped to its own end, so one short row cannot block another
const updateGroup = (ref) => {
    const bounds = getBounds(ref);

    if (!bounds) {
        ref.previous.disabled = true;
        ref.next.disabled = true;
        return;
    }

    const index = Math.min(Number(ref.track.dataset.index) || 0, bounds.maxIndex);

    ref.track.dataset.index = String(index);
    ref.track.style.transform = `translateX(-${index * (bounds.cardWidth + bounds.gap)}px)`;

    ref.previous.disabled = index === 0;
    ref.next.disabled = index >= bounds.maxIndex;
};

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

    return { group, viewport, track, previous, next };
};

const fillRow = (row, cards) => {
    row.textContent = "";
    cards.forEach((card) => row.appendChild(card));
};

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

const ProductCarousel = {
    createGroup: createGroup,
    updateGroup: updateGroup,
    stepGroup: stepGroup,
    renderCards: fillRow,
    renderMessage: showMessageIn
};
