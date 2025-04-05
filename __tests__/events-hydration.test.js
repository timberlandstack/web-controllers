import _App from "../src/main.js";
import { setDocument } from "./utils/lib.js";

const App = new _App();
const partialName = "events-hydration";

describe("Attaching events listeners", () => {
  setDocument(partialName);

  App.controller("app", ({ $ }) => {
    let count = 0;
    const increment = () => {
      count++;
      $.count.one().textContent = count;
    };

    return { increment };
  });

  let nestedCount = 0;
  let didRun = false;
  let runOnceCount = 0;
  App.controller("nested", () => {
    const increment = () => {
      nestedCount++;
    };
    const runCb = () => {
      didRun = true;
    };
    const runOnce = {
      handleEvent: () => runOnceCount++,
      options: {
        once: true,
      },
    };
    return { increment, runCb, runOnce };
  });

  App.init();

  const button = document.querySelector("[data-on]");
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
    const nested = document.querySelector('[data-controller="nested"]');
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
