import { App as _App } from ".";

const App = new _App();
const partial = /*html*/ `
<app-controller>
  <x-test></x-test>
</app-controller>

`;

describe("App init method", () => {
  document.body.innerHTML = partial;

  it("should initialize the registered controllers", () => {
    App.controller("app", ({ $scope, rootElement }) => {
      window.didRun = !window.didRun;
      $scope({ test: true });
      expect(rootElement).toBeInstanceOf(HTMLElement);
    });
  });

  it("should register custom elements", () => {
    let customElementInitialized = false;

    const testCustomElementFacotry = (appInstance) =>
      class TestCustomElement extends HTMLElement {
        static selector = "x-test";
        constructor() {
          super();
          customElementInitialized = true;
        }
      };

    expect(customElementInitialized).toBe(false);
    App.use(testCustomElementFacotry);

    expect(customElementInitialized).toBe(true);
    expect(customElements.get("x-test")).toBeDefined();
  });
});
