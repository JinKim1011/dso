import "@testing-library/jest-dom";

class ResizeObserver {
  observer() {}
  unobserver() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserver,
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  value: () => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1024,
    bottom: 768,
    width: 1024,
    height: 768,
    toJSON: () => {},
  }),
});
