import _App from "../src";
import { setDocument } from "./utils/lib";

const App = new _App();
const partialName = "initialization";

describe("component registration", () => {
  setDocument(partialName);

  describe("app#component method", () => {
    it("should register the component in the components property without triggering the callback", () => {
      let didRun = false;
      const componentCallback = (_ctx) => {
        didRun = true;
      };
      App.controller("app", componentCallback);

      expect(App.controllers["app"]).toBe(componentCallback);
      expect(didRun).toBe(false);
    });
  });

  describe("initializeComponent function", () => {
    const appRoot = document.querySelector("[data-controller=app]");

    it("should correctly run the component function passing down the context", () => {
      let didRun = false;

      App.controller("app", () => {
        didRun = true;
        return { test: true };
      });

      App.initializeComponent(appRoot);
      expect(didRun).toBe(true);
    });

    it("should store the element and its context in the App registry", () => {
      expect(App.registry.get(appRoot)).toBeDefined();
    });
  });
});
