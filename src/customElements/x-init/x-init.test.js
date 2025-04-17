import { selectController } from "../../../test_mocks/helpers";
import { Application } from "../../app";
import { Controller } from "../../controller/controller";
import { XInit } from "./x-init";

const template = /*html*/ `
<div data-controller="app">
    <x-init :disconnected="onAppDestroyed"></x-init>

    <ul>
        <li data-test-id="1">
            <x-init :disconnected="onItemDestroyed"></x-init>
        </li>
        <li data-test-id="2">
            <x-init :disconnected="onItemDestroyed"></x-init>
        </li>
    </ul>
</div>
`;

const enteringVoidElement = /*html*/ `
<x-init :connected="inputEntered" :disconnected="onItemDestroyed" target="input"></x-init>
<input type="text" data-ref="input">
`;

document.body.innerHTML = template;

let isDestroyed = false;
const deletedItems = [];

Application.controller(
  "app",
  class extends Controller {
    onSpanAdded(el) {
      el.dataset.text = "I'm a span";
    }
    inputEntered(el) {
      el.dataset.text = "I'm an input";
    }
    onAppDestroyed = () => (isDestroyed = true);
    onItemDestroyed = (item) => deletedItems.push(item);
  }
);

Application.use(XInit);

const appRoot = selectController("app");

describe("XInit custom element", () => {
  describe("disconnected callback", () => {
    it("should trigger the callback provided in the attribute", () => {
      expect(isDestroyed).toBe(false);

      appRoot.querySelector("[data-test-id='1']").remove();
      appRoot.querySelector("[data-test-id='2']").remove();

      expect(deletedItems.length).toBe(2);
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
