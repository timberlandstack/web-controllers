import { Application as app } from ".";
import { Controller } from "../controller/controller";
import { selectController } from "../../test_mocks/helpers";

const partial = /*html*/ `
<div data-controller="main">
    <x-test></x-test>
</div>
<div data-controller="lazy" data-load="visible"></div>
`;
document.body.innerHTML = partial;

class TestCustomElement extends HTMLElement {
  static selector = "x-test";
  constructor() {
    super();
    this.initialized = true;
  }
}

app.controller("main", class extends Controller {});
app.controller("lazy", class extends Controller {});
app.use(TestCustomElement);

const mainController = selectController("main");
const lazyController = selectController("lazy");

describe("App init method", () => {
  it("should initialize the registered controllers", () => {
    expect(app.registry.get(mainController)).toBeDefined();
  });

  it("should not initialize it if data-load is set to visible", () => {
    expect(app.registry.get(lazyController)).toBeUndefined();
    // app.initializeController(lazyController);
    // expect(app.registry.get(lazyController)).toBeDefined();
  });

  it("should create a queue with the element as its key", () => {
    expect(app.elementsQueue.get(lazyController)).toBeDefined();
  });

  it("should trigger all callbacks of the queue when initialized", () => {
    let count = 0;
    app.elementsQueue.get(lazyController).add(() => count++);
    app.elementsQueue.get(lazyController).add(() => count++);

    app.initializeController(lazyController);
    expect(count).toBe(2);
  });

  it("should delete the element from the queue once it has been initialized", () => {
    expect(app.elementsQueue.get(lazyController)).toBeUndefined();
  });

  it("should register custom elements", () => {
    expect(document.querySelector("x-test").initialized).toBe(true);
    expect(customElements.get("x-test")).toBeDefined();
  });
});
