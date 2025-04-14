import { App } from "../../app";
import { Context } from "../../context";

const template = /*html*/ `
    <app-controller>
        <button>Hi</button>

        <nested-controller lazy>
            <button>Hi</button>
        </nested-controller>
    </app-controller>
`;

const app = new App();

document.body.innerHTML = template;

const appController = document.querySelector("app-controller");
const nestedController = document.querySelector("nested-controller");

describe("App#_controller method", () => {
  it('should register a custom element starting with the controller name and the word "controller"', () => {
    app.controller("app", (ctx) => {
      ctx.$scope({
        connected: (element) => {
          element.dataset.hello = "world";
        },
      });

      return {
        hello: "world",
      };
    });

    expect(appController.scope).toEqual({ hello: "world" });
    expect(appController.dataset.hello).toBe("world");
    expect(appController.initialized).toBe(true);
  });

  it("should respect the lazy attribute", () => {
    app.controller("nested", () => {
      return {
        nested: true,
      };
    });
    expect(nestedController.initialized).toBe(false);
    expect(nestedController.scope).toBeUndefined();
  });

  it("should register the lazy controller when the init method is invoked", () => {
    nestedController.init();
    expect(nestedController.scope).toEqual({ nested: true });
    expect(nestedController.initialized).toBe(true);
  });

  it("should assign to the controller all the methods from the Context class", () => {
    const testContext = new Context(appController);
    for (const property of Object.keys(testContext)) {
      expect(property in appController).toBe(true);
    }
  });
});
