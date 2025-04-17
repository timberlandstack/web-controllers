import { selectController } from "../../../test_mocks/helpers";
import { Application } from "../../app";
import { Controller } from "../../controller/controller";
import { BaseComponent } from "./base-component";

document.body.innerHTML = /*html*/ `
    <div data-controller="app">
        <x-test></x-test>

        <div data-controller="nested">
          <x-test></x-test>
        </div>

        <x-test target="input"></x-test>
        <input type="text" data-ref="input" data-namespace="inputComponent">
    </div>

    <div data-controller="lazy" data-load="visible">
        <x-test></x-test>
    </div>
`;

class Test extends BaseComponent {
  static selector = "x-test";

  onConnected() {
    this.textContent = "I'm initialized!";
  }
}

Application.controller("app", class extends Controller {});

Application.controller("nested", class extends Controller {});

Application.controller(
  "entry-later",
  class extends Controller {
    $connected() {}
  }
);

Application.controller(
  "lazy",
  class extends Controller {
    someValue = "hi";
  }
);

Application.use(Test);

const appController = selectController("app");
const app_x_test = appController.querySelector("x-test");

const nestedController = selectController("nested");
const nested_x_test = nestedController.querySelector("x-test");

const inputComponent = appController.querySelector('input[data-ref="input"]');
const target_x_test = appController.querySelector('x-test[target="input"]');

const lazyController = selectController("lazy");
const lazy_x_test = lazyController.querySelector("x-test");

describe("BaseComponent properties", () => {
  it("should have a display none style attribute", () => {
    expect(app_x_test.style.display).toBe("none");
  });
  it("should correctly get the closest controller", () => {
    expect(app_x_test.closestController).toBe(appController);
    expect(nested_x_test.closestController).toBe(nestedController);
    expect(target_x_test.closestController).toBe(appController);
  });
  it("should have the correct target", () => {
    expect(app_x_test.target).toBe(appController);
    expect(nested_x_test.target).toBe(nestedController);
    expect(target_x_test.target).toBe(inputComponent);
  });
  it("should have a namespace if the target has a data-namespace attribute", () => {
    expect(app_x_test.namespace).toBeUndefined();
    expect(target_x_test.namespace).toBe("inputComponent");
  });

  it("should initialize the closest controller when entering the DOM", () => {
    const partial = /*html*/ `
      <div data-controller="entry-later">
        <x-test></x-test>
      </div>
     `;
    document.body.insertAdjacentHTML("beforeend", partial);
    const entryLaterController = selectController("entry-later");
    expect(Application.registry.has(entryLaterController)).toBe(true);
  });
});

describe("Lazy initialization", () => {
  it("should enqueue its init method if the controller hasn't been initialized  ", () => {
    expect(Application.registry.has(lazyController)).toBe(false);
    expect(
      Application.elementsQueue.get(lazyController).has(lazy_x_test.init)
    ).toBe(true);
    expect(lazy_x_test.textContent).toBe("");
  });
  it("should be initialized after his corresponding controller", () => {
    Application.initializeController(lazyController);

    expect(lazy_x_test.context.someValue).toEqual("hi");
    expect(lazy_x_test.textContent).toBe("I'm initialized!");
  });
});
