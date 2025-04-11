import { App as _App } from "../../index.js";
import { XOnFactory } from "./x-on.js";

const App = new _App();
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
App.controller("app", ({ $ }) => {
  let count = 0;
  const increment = () => {
    count++;
    $.count.one().textContent = count;
  };
  const changeName = () => {};
  return { increment, changeName };
});

let nestedCount = 0;
let didRun = false;
let runOnceCount = 0;
App.controller("nested", ({ $scope }) => {
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

App.use(XOnFactory);

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
