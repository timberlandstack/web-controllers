import { Application as app } from "../app";
import { Controller } from "./controller";
import { selectController } from "../../test_mocks/helpers";

const partial = /*html*/ `
<div data-controller="main">
    <!-- this should be selected from app context -->
    <button data-ref="btn">
        Inc
    </button>
    <div>
        <!-- this should be selected from app context -->
        <button data-ref="btn">Text</button>
    </div>

    <div data-controller="inner">
        <span id="count">0</span>

        <!-- this should NOT be selected from app context -->
        <button data-ref="btn">sdf</button>
    </div>
</div>
`;
document.body.innerHTML = partial;

app.controller("main", class extends Controller {});
app.controller("inner", class extends Controller {});

const mainController = selectController("main");
const innerController = selectController("inner");

const mainCtx = app.registry.get(mainController);
const innerCtx = app.registry.get(innerController);

describe("context utilities", () => {
  describe("getQueryString method", () => {
    it("should return the correct query string", () => {
      expect(mainCtx.$getQueryString("button")).toBe(
        'button:not( [data-controller="inner"] * )'
      );

      expect(innerCtx.$getQueryString("button")).toBe("button");
    });
  });
  describe("select method", () => {
    it("should select elements only inside scope", () => {
      const foundElements = mainCtx.$select("button", { all: true });
      expect(foundElements.length).toBe(2);
    });

    it("should return a single element if only one element matches the selector", () => {
      const foundElement = mainCtx.$select("[data-controller=inner]");
      expect(foundElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe("refs proxy", () => {
    it("should select elements with data-ref attribute inside component scope", () => {
      const { $ } = mainCtx;
      expect($.btn.all().length).toBe(2);
    });

    it("should invalidate the query if the rest method is provided second argument", () => {
      const { $ } = mainCtx;
      $.btn.one();
      const newBtn = document.createElement("button");
      newBtn.dataset.ref = "btn";
      mainController.appendChild(newBtn);

      expect($.btn.one()).toBeInstanceOf(HTMLElement);
      expect($.btn.reset().all().length).toBe(3);
    });

    it("should automatically invalidate the references if all or one is accessed after the other", () => {
      const { $ } = mainCtx;
      $.btn.one();

      expect($.btn.one()).toBeInstanceOf(HTMLElement);
      expect($.btn.all().length).toBe(3);
    });

    it("should accept an object with attributes for hydrating ad-hoc", () => {
      const { $ } = mainCtx;
      let count = 0;

      $.btn
        .all({
          onclick: () => count++,
          "data-hello": "world",
          classList: "test-class",
          textContent: (el) => `I'm a ${el.tagName}`,
        })
        .forEach((btn, index) => {
          expect(count).toBe(index);
          btn.click();
          expect(btn.dataset.hello).toBe("world");
          expect(btn.classList.contains("test-class")).toBe(true);
          expect(btn.textContent).toBe(`I'm a BUTTON`);
        });

      const { $: inner$ } = innerCtx;
      let innerCount = 0;

      const { btn } = inner$;
      btn
        .one({
          onclick: {
            handleEvent: () => innerCount++,
            options: {
              once: true,
            },
          },
        })
        .click();

      expect(innerCount).toBe(1);
      btn.one().click();
      expect(innerCount).toBe(1);
    });
  });

  describe("mount method", () => {
    it("should assign a return value to a namespace", () => {
      mainCtx.$mount("test", () => ({ count: 0 }));

      expect(mainCtx.test).toBeDefined();
      expect(mainCtx.test.count).toBe(0);
    });
  });
});
