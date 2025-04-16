import { App } from "../app";

const partial = /*html*/ `
<x-controller name="app">
    <!-- this should be selected from app context -->
    <button data-ref="btn">
        Inc
    </button>
    <div>
        <!-- this should be selected from app context -->
        <button data-ref="btn">Text</button>
    </div>

    <x-controller name="inner">
        <span id="count">0</span>

        <!-- this should NOT be selected from app context -->
        <button data-ref="btn">sdf</button>
    </x-controller>
</x-controller>
`;

const app = new App();
let appCtx;
let innerCtx;
app.controller("app", (ctx) => (appCtx = ctx));
app.controller("inner", (ctx) => (innerCtx = ctx));
document.body.innerHTML = partial;

const appRoot = document.querySelector("x-controller[name='app']");

describe("context utilities", () => {
  describe("getQueryString method", () => {
    it("should return the correct query string", () => {
      expect(appCtx.$getQueryString("button")).toBe(
        'button:not( x-controller[name="inner"] * )'
      );

      expect(innerCtx.$getQueryString("button")).toBe("button");
    });
  });
  describe("select method", () => {
    it("should select elements only inside scope", () => {
      const foundElements = appCtx.$select("button", { all: true });
      expect(foundElements.length).toBe(2);
    });

    it("should return a single element if only one element matches the selector", () => {
      const foundElement = appCtx.$select("x-controller[name=inner]");
      expect(foundElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe("refs proxy", () => {
    it("should select elements with data-ref attribute inside component scope", () => {
      const { $ } = appCtx;
      expect($.btn.all().length).toBe(2);
    });

    it("should invalidate the query if the rest method is provided second argument", () => {
      const { $ } = appCtx;
      $.btn.one();
      const newBtn = document.createElement("button");
      newBtn.dataset.ref = "btn";
      appRoot.appendChild(newBtn);

      expect($.btn.one()).toBeInstanceOf(HTMLElement);
      expect($.btn.reset().all().length).toBe(3);
    });

    it("should automatically invalidate the references if all or one is accessed after the other", () => {
      const { $ } = appCtx;
      $.btn.one();

      expect($.btn.one()).toBeInstanceOf(HTMLElement);
      expect($.btn.all().length).toBe(3);
    });

    it("should accept an object with attributes for hydrating ad-hoc", () => {
      const { $ } = appCtx;
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

  describe("scope method", () => {
    it("should accept a hydration context", () => {
      appCtx.$scope({
        count: 0,
      });

      expect(appCtx.scope.count).toBe(0);
    });

    it("should bind the methods to the scope", () => {
      appCtx.$scope({
        count: 0,
        inc() {
          this.count++;
        },
      });

      appCtx.scope.inc();
      expect(appCtx.scope.count).toBe(1);
    });
  });
});
