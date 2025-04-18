import { Application as app } from ".";
import { Controller } from "../controller/controller";
import { selectController } from "../../test_mocks/helpers";

const partial = /*html*/ `
<div data-controller="main" data-date="10/10/1995" data-some-value="hello">
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

const MainValues = {
  count: {
    transformer: Number,
    default: 0,
  },
  date: {
    transformer: (val) => new Date(val),
    default: new Date("1/1/2025"),
  },
  someValue: {
    transformer: String,
    default: "no message :(",
  },
};

app.controller(
  "main",
  class Main extends Controller {
    static values = MainValues;
  }
);
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

describe("Reactive values", () => {
  const mainInstance = app.registry.get(mainController);

  it("should assign the values to the instance", () => {
    expect(mainInstance.values).toBeDefined();
  });

  it("should assign the default value if no attributes have been provided", () => {
    expect(mainInstance.values.count).toBe(0);
  });

  it("should assign the value retrieved from the [name]-values custom element", () => {
    expect(mainInstance.values.date.getFullYear()).toBe(1995);
  });

  it("should trigger a custom event with the format [controllerName].[valueName]", () => {
    let message = "";
    window.addEventListener("main.someValue", (e) => {
      message = e.detail;
    });
    mainInstance.values.someValue = "it changed again";
    expect(message).toBe("it changed again");
  });

  it("should respect the transformer when emitting the event", () => {
    let newDate;
    window.addEventListener("main.date", (e) => {
      newDate = e.detail;
    });
    mainInstance.values.date = new Date("3/7/1991");
    expect(newDate).toBeInstanceOf(Date);
    expect(newDate.getFullYear()).toBe(1991);
  });
});
