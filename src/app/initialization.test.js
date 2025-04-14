import { App as _App } from ".";

const App = new _App();
const partial = /*html*/ `
  <div data-controller="app">
  </div>
  <div data-controller="lazy">
  </div>
`;

describe("component registration", () => {
  document.body.innerHTML = partial;

  describe("app#controller method", () => {
    it("should register the component in the components property without triggering the callback", () => {
      let didRun = false;
      const controllerCallback = (_ctx) => {
        didRun = true;
      };
      App.controller("app", controllerCallback);

      expect(App.controllers.app).toEqual(controllerCallback);
      expect(didRun).toBe(false);
    });
  });

  describe("initializeController function", () => {
    const appRoot = document.querySelector("[data-controller=app]");

    it("should correctly run the component function passing down the context", () => {
      let didRun = false;

      App.controller("app", () => {
        didRun = true;
        return { test: true };
      });

      App.initializeController(appRoot);
      expect(didRun).toBe(true);
    });

    it("should store the element and its context in the App registry", () => {
      expect(App.registry.get(appRoot)).toBeDefined();
    });
  });
});

describe("Initializing lazy controller", () => {
  App.controller("lazy", () => {});
  const lazyController = document.querySelector('[data-controller="lazy"');
  it("should enqueue components wrapped around lazy function", () => {
    App.initializeController(lazyController, true);

    expect(App.scheduledRegistry.has(lazyController)).toBe(true);
    expect(App.registry.has(lazyController)).toBe(false);
  });

  it("should initialize the controller when the callback in the queue is called", () => {
    App.initializeScheduled(lazyController);

    expect(App.registry.has(lazyController)).toBe(true);
    expect(App.scheduledRegistry.has(lazyController)).toBe(false);
  });
});
