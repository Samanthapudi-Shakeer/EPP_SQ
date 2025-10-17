const DEFAULT_ATTEMPTS = 10;
const DEFAULT_DELAY = 120;

const sleep = (duration = 0) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

export const waitForElement = async (
  selector,
  { attempts = DEFAULT_ATTEMPTS, delay = DEFAULT_DELAY } = {}
) => {
  if (!selector) {
    return null;
  }

  let remaining = attempts;

  while (remaining > 0) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }

    remaining -= 1;
    if (remaining > 0) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
    }
  }

  return null;
};

export const scrollToAndHighlight = (
  element,
  { message, focusSelector } = {}
) => {
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add("search-result-highlight");

  window.setTimeout(() => {
    element.classList.remove("search-result-highlight");
  }, 2600);

  if (focusSelector) {
    const focusTarget = element.querySelector(focusSelector);
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus({ preventScroll: true });
    }
  }

  if (!message) {
    return;
  }

  const tooltip = document.createElement("div");
  tooltip.className = "search-result-tooltip";
  tooltip.textContent = message;
  document.body.appendChild(tooltip);

  const { top, left, width } = element.getBoundingClientRect();
  tooltip.style.top = `${window.scrollY + top - 36}px`;
  tooltip.style.left = `${window.scrollX + left + width / 2}px`;

  window.requestAnimationFrame(() => {
    tooltip.classList.add("is-visible");
  });

  window.setTimeout(() => {
    tooltip.classList.remove("is-visible");
    tooltip.addEventListener(
      "transitionend",
      () => {
        tooltip.remove();
      },
      { once: true }
    );
  }, 2200);
};

export const createRowMessage = (rowNumber) =>
  typeof rowNumber === "number" ? `Row #${rowNumber} found` : "Row found";
