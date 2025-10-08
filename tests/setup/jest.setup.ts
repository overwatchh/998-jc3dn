import "@testing-library/jest-dom";

process.env.NODE_ENV = process.env.NODE_ENV || "test";

// Polyfills for jsdom environment
class ResizeObserverPolyfill {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error - define in jsdom
global.ResizeObserver = global.ResizeObserver || (ResizeObserverPolyfill as any);

// @ts-expect-error - define in jsdom
window.matchMedia =
  window.matchMedia ||
  (() => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
