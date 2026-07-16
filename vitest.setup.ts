import "@testing-library/jest-dom/vitest";

function createMediaQueryList(media: string): MediaQueryList {
  const eventTarget = new EventTarget();
  const legacyListeners = new Set<NonNullable<MediaQueryList["onchange"]>>();

  const isMediaQueryListEvent = (event: Event): event is MediaQueryListEvent =>
    "matches" in event && "media" in event;

  const mediaQueryList: MediaQueryList = {
    matches: false,
    media,
    onchange: null,
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    addListener: (listener: MediaQueryList["onchange"]) => {
      if (listener !== null) legacyListeners.add(listener);
    },
    removeListener: (listener: MediaQueryList["onchange"]) => {
      if (listener !== null) legacyListeners.delete(listener);
    },
    dispatchEvent: (event) => {
      const dispatched = eventTarget.dispatchEvent(event);
      if (event.type !== "change" || !isMediaQueryListEvent(event)) return dispatched;

      const onchange = mediaQueryList.onchange;
      if (onchange !== null) onchange.call(mediaQueryList, event);
      legacyListeners.forEach((listener) => listener.call(mediaQueryList, event));
      return dispatched;
    },
  };

  return mediaQueryList;
}

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: (query: string) => createMediaQueryList(query),
});
