import { getQueryString, ref, select, mount, values } from ".";
import { selectController } from "../../test_mocks/helpers";
import { defineController, defineGlobals, registry } from "../app";

const partial = /*html*/ `
<div data-controller="main" data-date-value="10/10/1995" data-some-value="hello">
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

defineGlobals({
  helpers: [
    { fn: getQueryString, alias: "$getQueryString" },
    { fn: select, alias: "$select" },
    { fn: ref, alias: "$" },
  ],
});

const MainValues = {
  count: {
    transformer: Number,
    default: 0,
  },
  date: {
    transformer: (val) => new Date(val),
    default: new Date("1/1/2025"),
  },
  some: {
    transformer: String,
    default: "no message :(",
  },
};

defineController("main", {
  values: MainValues,
  controller: (ctx) => {
    ctx.use({ fn: mount, alias: "$mount" }, { fn: values });
  },
});
defineController("inner", {
  controller: () => {},
});

const mainController = selectController("main");
const innerController = selectController("inner");

const mainCtx = registry.get(mainController);
const innerCtx = registry.get(innerController);

describe("Context helpers", () => {
  describe("getQueryString function", () => {
    it("should return the correct query string", () => {
      expect(mainCtx.$getQueryString("button")).toBe(
        'button:not( [data-controller="inner"] * )'
      );

      expect(innerCtx.$getQueryString("button")).toBe("button");
    });
  });

  describe("select function", () => {
    it("should select elements only inside scope", () => {
      const foundElements = mainCtx.$select("button", { all: true });
      expect(foundElements.length).toBe(2);
    });

    it("should return a single element if only one element matches the selector", () => {
      const foundElement = mainCtx.$select("[data-controller=inner]");
      expect(foundElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe("refs function", () => {
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

  describe("mount function", () => {
    it("should assign a return value to a namespace", () => {
      mainCtx.$mount("test", () => ({ count: 0 }));

      expect(mainCtx.scope._namespaces.test).toBeDefined();
      expect(mainCtx.scope._namespaces.test.count).toBe(0);
    });
  });

  describe("Values from dataset", () => {
    const mainInstance = registry.get(mainController);

    it("should return the values as provided in the schema", () => {
      expect(mainInstance.values.some).toBe("hello");
    });

    it("should assign the default value if no attributes have been provided", () => {
      expect(mainInstance.values.count).toBe(0);
    });

    it("should correctly transform the values", () => {
      expect(mainInstance.values.date.getFullYear()).toBe(1995);
    });
  });
});
