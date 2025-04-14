import { App } from "../../app";
import { BaseComponent } from "./base-component";

const TestFactory = (appInstance) =>
  class Test extends BaseComponent(appInstance) {
    static selector = "x-test";

    onConnected() {
      this.textContent = "I'm initialized!";
    }
  };

const app = new App();

app.controller("app", () => {
  return {};
});

app.controller("nested", () => {
  return {};
});

app.controller("lazy", () => ({
  someValue: "hi",
}));

app.use(TestFactory);

document.body.innerHTML = /*html*/ `
    <app-controller>
      <x-test></x-test>

      <nested-controller>
        <x-test></x-test>
      </nested-controller>

      <x-test target="input"></x-test>
      <input type="text" data-ref="input" data-scope="inputComponent">
    </app-controller>

    <lazy-controller lazy>
      <x-test lazy></x-test>
    </lazy-controller>
`;

const appController = document.querySelector("app-controller");
const app_x_test = appController.querySelector("x-test");

const nestedController = appController.querySelector("nested-controller");
const nested_x_test = nestedController.querySelector("x-test");

const inputComponent = appController.querySelector('input[data-ref="input"]');
const target_x_test = appController.querySelector('x-test[target="input"]');

const lazyController = document.querySelector("lazy-controller");
const lazy_x_test = document.querySelector("x-test[lazy]");

describe("BaseComponent properties", () => {
  it("should have a display none style attribute", () => {
    expect(app_x_test.style.display).toBe("none");
  });
  it("should have an appInstance property", () => {
    expect(app_x_test.appInstance).toBeDefined();
    expect(app_x_test.appInstance).toBe(app);
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
  it("should have a namespace if the target has a data-scope attribute", () => {
    expect(app_x_test.namespace).toBeUndefined();
    expect(target_x_test.namespace).toBe("inputComponent");
  });
});

describe("Lazy initialization", () => {
  it("should enqueue its init method if the controller hasn't been initialized  ", () => {
    expect(lazyController.initialized).toBe(false);
    expect(lazyController.queue.has(lazy_x_test.init)).toBe(true);
    expect(lazy_x_test.closestController.scope).toBeUndefined();
    expect(lazy_x_test.textContent).toBe("");
  });
  it("should be initialized after his corresponding controller", () => {
    lazyController.init();

    expect(lazyController.initialized).toBe(true);
    expect(lazy_x_test.closestController.scope).toEqual({ someValue: "hi" });
    expect(lazy_x_test.textContent).toBe("I'm initialized!");
  });
});
