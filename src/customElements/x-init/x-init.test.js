import { App } from "../..";
import { XInitFactory } from "./x-init";

const template = /*html*/ `
<div data-controller="app">
    <x-init disconnected="onAppDestroyed"></x-init>

    <ul>
        <li data-test-id="1">
            <x-init disconnected="onItemDestroyed"></x-init>
        </li>
        <li data-test-id="2">
            <x-init disconnected="onItemDestroyed"></x-init>
        </li>
    </ul>
</div>
`;
const enteringController = /*html*/ `
<button data-controller="btn">
    <x-init></x-init>
</button>
`;
const enteringElement = /*html*/ `
<span>
    <x-init connected="onSpanAdded"></x-init>
</span>
`;

const enteringVoidElement = /*html*/ `
<x-init connected="inputEntered" disconnected="onItemDestroyed" target="input"></x-init>
<input type="text" data-ref="input">
`;

document.body.innerHTML = template;
let appInitialized = false;
let isDestroyed = false;
const deletedItems = [];
const app = new App();
app.controller("app", () => {
  appInitialized = true;
  return {
    onSpanAdded: (el) => {
      el.dataset.text = "I'm a span";
    },
    inputEntered: (el) => {
      el.dataset.text = "I'm an input";
    },
    onAppDestroyed: () => (isDestroyed = true),
    onItemDestroyed: (item) => deletedItems.push(item),
  };
});
app.controller("btn", ({ rootElement }) => {
  rootElement.dataset.text = "I'm a button";
});

app.init([XInitFactory]);

const appRoot = document.querySelector("[data-controller=app]");

describe("XInit custom element", () => {
  it("should initialize the controller when entering the DOM after the app has been initialized", () => {
    expect(appInitialized).toBe(true);

    document.body.insertAdjacentHTML("beforeend", enteringController);
    const btn = document.querySelector("[data-controller=btn]");
    expect(btn.dataset.text).toBe("I'm a button");

    appRoot.insertAdjacentHTML("beforeend", enteringElement);
    const span = document.querySelector("span");
    expect(span.dataset.text).toBe("I'm a span");
  });

  describe("disconnected callback", () => {
    it("should trigger the callback provided in the attribute", () => {
      expect(isDestroyed).toBe(false);

      appRoot.querySelector("[data-test-id='1']").remove();
      appRoot.querySelector("[data-test-id='2']").remove();

      expect(deletedItems.length).toBe(2)
      deletedItems.forEach((item, index) => {
        expect(item.dataset.testId).toBe(`${index + 1}`);
      });
    });
  });

  describe("target attribute", () => {
    it("should target the specified ref", () => {
      appRoot.insertAdjacentHTML("beforeend", enteringVoidElement);
      const input = appRoot.querySelector("input[type=text]");
      expect(input.dataset.text).toBe("I'm an input");
      appRoot.querySelector("[target=input]").remove();
      expect(deletedItems.length).toBe(3);
    });
  });
});
