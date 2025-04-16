import { App as _App } from ".";

const partial = /*html*/ `
<x-controller name="app">
  <x-test></x-test>
</x-controller>
`;
document.body.innerHTML = partial;

const testCustomElementFacotry = (appInstance) =>
  class TestCustomElement extends HTMLElement {
    static selector = "x-test";
    constructor() {
      super();
      this.initialized = true;
    }
  };

const App = new _App();

App.controller("app", () => {});
App.use(testCustomElementFacotry);

describe("App init method", () => {
  it("should initialize the registered controllers", () => {
    expect(document.querySelector('x-controller[name="app"').initialized).toBe(
      true
    );
  });

  it("should register custom elements", () => {
    expect(document.querySelector("x-test").initialized).toBe(true);
    expect(customElements.get("x-test")).toBeDefined();
  });
});
