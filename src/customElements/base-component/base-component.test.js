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

app.controller("nested-controller", () => {
  return {};
});

app.controller("lazy", () => ({
  someValue: "hi",
}));

app.use(TestFactory);

document.body.innerHTML = /*html*/ `
    <div data-controller="app">
        <x-test></x-test>

        <div data-controller="nested-controller">
            <x-test></x-test>
        </div>

        <x-test target="input"></x-test>
        <input type="text" data-ref="input" data-scope="inputComponent">
    </div>
    <div data-controller="lazy">
        <x-test lazy></x-test>
    </div>
`;

const appController = document.querySelector('[data-controller="app"]');
const app_x_test = appController.querySelector("x-test");

const nestedController = appController.querySelector(
  '[data-controller="nested-controller"]'
);
const nested_x_test = nestedController.querySelector("x-test");

const inputComponent = appController.querySelector('input[data-ref="input"]');
const target_x_test = appController.querySelector('x-test[target="input"]');

const lazyController = document.querySelector('[data-controller="lazy"]');
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
  it("should initialize the closest controller if it has not been initialized", () => {
    app.controller("later-controller", () => {});
    document.body.insertAdjacentHTML(
      "beforeend",
      /*html*/ `
            <div data-controller="later-controller"></div>
        `
    );
    const laterController = document.querySelector(
      '[data-controller="later-controller"]'
    );

    expect(app.registry.get(laterController)).toBeUndefined();
    laterController.appendChild(document.createElement("x-test"));
    expect(app.registry.get(laterController)).toBeDefined();
  });
  it("should have the correct context", () => {
    expect(app_x_test.context).toBe(app.registry.get(appController));
    expect(nested_x_test.context).toBe(app.registry.get(nestedController));
    expect(target_x_test.context).toBe(app.registry.get(appController));
  });
});

describe("Lazy initialization", () => {
  it("should schedule the intialization of the controller", () => {
    expect(app.registry.has(lazyController)).toBe(false);
    expect(app.scheduledRegistry.has(lazy_x_test)).toBe(true);
    expect(lazy_x_test.context).toBeUndefined();
  });
  it("should register the controller when initialized from scheduler", () => {
    app.initializeScheduled(lazy_x_test);

    expect(app.registry.has(lazyController)).toBe(true);
    expect(lazy_x_test.context).toBeDefined();
    expect(lazy_x_test.context.scope).toEqual({ someValue: "hi" });
  });

  it("should trigger the onConnected method when initialized", () => {
    expect(lazy_x_test.textContent).toBe("I'm initialized!");
  });
});
