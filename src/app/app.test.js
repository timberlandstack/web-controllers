import { selectController } from "../../test_mocks/helpers.js";
import {
  defineController,
  useElements,
  registry,
  elementsQueue,
  initializeController,
} from "./index.js";

const partial = /*html*/ `
<div data-controller="main" data-date="10/10/1995" data-some-value="hello">
    <x-test></x-test>
</div>
<div data-controller="lazy" data-load="visible"></div>
<div data-controller="event" data-load="on:element-connected"></div>
`;
document.body.innerHTML = partial;

class TestCustomElement extends HTMLElement {
  static selector = "x-test";
  constructor() {
    super();
    this.initialized = true;
  }
  connectedCallback() {
    this.dispatchEvent(new CustomEvent("element-connected", { bubbles: true }));
  }
}

defineController("main", {
  controller: () => {},
});

defineController("lazy", {
  controller: () => {},
});

defineController("event", {
  controller: () => {},
});

useElements(TestCustomElement);

const mainController = selectController("main");
const lazyController = selectController("lazy");
const eventController = selectController("event");

describe("App init method", () => {
  it("should initialize the registered controllers", () => {
    expect(registry.get(mainController)).toBeDefined();
  });

  it("should not initialize it if data-load is set", () => {
    expect(registry.get(lazyController)).toBeUndefined();
  });

  it("should create a queue with the element as its key", () => {
    expect(elementsQueue.get(lazyController)).toBeDefined();
  });

  it("should trigger all callbacks of the queue when initialized", () => {
    let count = 0;
    elementsQueue.get(lazyController).add(() => count++);
    elementsQueue.get(lazyController).add(() => count++);

    initializeController(lazyController);
    expect(count).toBe(2);
  });

  it("should delete the element from the queue once it has been initialized", () => {
    expect(elementsQueue.get(lazyController)).toBeUndefined();
  });

  it("should register custom elements", () => {
    expect(document.querySelector("x-test").initialized).toBe(true);
    expect(customElements.get("x-test")).toBeDefined();
  });

  it('should initialize the controller with an event when the data-load value starts with "on:"', () => {
    expect(registry.get(eventController)).toBeUndefined();
    eventController.appendChild(document.createElement("x-test"));
    expect(registry.get(eventController)).toBeDefined();
  });
});
