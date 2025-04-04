import { Context } from "../src";
import { setDocument } from "./utils/lib";

const partialName = "context";

describe("context utilities", () => {
  setDocument(partialName);
  const appRoot = document.querySelector("[data-controller=app]");

  describe("getQueryString method", () => {
    it("should return the correct query string", () => {
      const appCtx = new Context(appRoot);
      expect(appCtx.$getQueryString("button")).toBe(
        'button:not( [data-controller="inner"] * )',
      );

      const innerCtx = new Context(
        document.querySelector("[data-controller=inner]"),
      );
      expect(innerCtx.$getQueryString("button")).toBe("button");
    });
  });
  describe("select method", () => {
    it("should select elements only inside scope", () => {
      const appCtx = new Context(appRoot);

      const foundElements = appCtx.$select("button", { all: true });
      expect(foundElements.length).toBe(2);
    });

    it("should return a single element if only one element matches the selector", () => {
      const appCtx = new Context(appRoot);

      const foundElement = appCtx.$select("[data-controller=inner]");
      expect(foundElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe("refs proxy", () => {
    setDocument(partialName);
    const appRoot = document.querySelector("[data-controller=app]");

    it("should select elements with data-ref attribute inside component scope", () => {
      const { $ } = new Context(appRoot);
      expect($.btn.all().length).toBe(2);
    });

    it("should invalidate the query if the rest method is provided second argument", () => {
      const { $ } = new Context(appRoot);
      $.btn.one();
      const newBtn = document.createElement("button");
      newBtn.dataset.ref = "btn";
      appRoot.appendChild(newBtn);

      expect($.btn.one()).toBeInstanceOf(HTMLElement);
      expect($.btn.reset().all().length).toBe(3);
    });

    it("should automatically invalidate the references if all or one is accessed after the other", () => {
      setDocument(partialName);
      const appRoot = document.querySelector("[data-controller=app]");

      const { $ } = new Context(appRoot);
      $.btn.one();

      expect($.btn.one()).toBeInstanceOf(HTMLElement);
      expect($.btn.all().length).toBe(2);
    });

    it("should accept an object with attributes for hydrating ad-hoc", () => {
      setDocument(partialName);
      const appRoot = document.querySelector("[data-controller=app]");

      const { $, $select } = new Context(appRoot);
      let count = 0;

      $.btn
        .all({
          onclick: () => count++,
          "data-hello": "world",
          class: "test-class",
        })
        .forEach((btn, i) => {
          expect(count).toBe(i);
          btn.click();
          expect(btn.dataset.hello).toBe("world");
          expect(btn.classList.contains("test-class")).toBe(true);
        });

      const innerController = $select("[data-controller=inner]");
      const { $: inner$ } = new Context(innerController);
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
      const ctx = new Context(appRoot);

      ctx.$scope({
        count: 0,
      });

      expect(ctx.scope.count).toBe(0);
    });

    it("should bind the methods to the scope", () => {
      const ctx = new Context(appRoot);

      ctx.$scope({
        count: 0,
        inc() {
          this.count++;
        },
      });

      ctx.scope.inc();
      expect(ctx.scope.count).toBe(1);
    });
  });
});
