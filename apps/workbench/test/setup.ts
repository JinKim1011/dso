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
