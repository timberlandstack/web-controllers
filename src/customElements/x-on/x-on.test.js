import { XOn } from "./x-on.js";
import { selectController } from "../../../test_mocks/helpers.js";
import { defineController, useElements } from "../../app/index.js";
import { ref } from "../../helpers/index.js";

const partial = /*html*/ `
<div data-controller="app">
    <h1 data-ref="count">0</h1>
    <button data-test-id="app-button">
      <x-on :click="increment" :mouseover="increment"></x-on>
      Click me!
    </button>

    <x-on target="input" :input="changeName"></x-on>
    <input type="text" data-ref="input" />

    <div data-controller="nested">
        <button data-test-id="nested-button">
          <x-on :click="increment, runCb, runOnce" :mouseover="increment"></x-on>
          Click me too!
        </button>
      </div>
    </div>
`;

document.body.innerHTML = partial;

defineController("app", {
  controller: (ctx) => {
    ctx.decorate({ $: ref });

    let count = 0;
    return {
      increment() {
        count++;
        ctx.$.count.one().textContent = count;
      },

      changeName() {},
    };
  },
});

let nestedCount = 0;
let didRun = false;
let runOnceCount = 0;

defineController("nested", {
  controller: (ctx) => ({
    increment() {
      nestedCount++;
    },
    runCb() {
      didRun = true;
    },

    runOnce: {
      handleEvent: () => runOnceCount++,
      options: {
        once: true,
      },
    },
  }),
});

useElements(XOn);

describe("Attaching event listeners", () => {
  const button = document.querySelector("[data-test-id='app-button']");
  const count = document.querySelector('[data-ref="count"]');

  it("should increment the counter when the button is clicked", () => {
    expect(count.textContent).toBe("0");
    button.click();
    expect(count.textContent).toBe("1");
  });

  it("should increment the counter with the button is hovered", () => {
    expect(count.textContent).toBe("1");
    button.dispatchEvent(new Event("mouseover"));
    expect(count.textContent).toBe("2");
  });

  // test if it works for several data-on elements

  it("should work with comma separated events", () => {
    const nested = selectController("nested");
    const nestedButton = nested.querySelector("button");
    nestedButton.click();
    expect(didRun).toBe(true);
    expect(nestedCount).toBe(1);
    nestedButton.dispatchEvent(new Event("mouseover"));
    expect(nestedCount).toBe(2);
  });

  it("should accept an object with handleEvent callback and options if provided", () => {
    expect(runOnceCount).toBe(1);
  });
});
