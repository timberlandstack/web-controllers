import { ComputedEmitter, Emitter } from "@timberland/emitters/src";
import { Application } from ".";
import { Controller } from "../controller/controller";
import { selectController } from "../../test_mocks/helpers";

document.body.innerHTML = /*html*/ `
<article data-controller="main" data-count="0" data-message="hello world">
    <h1 data-ref="computed"></h1>
    <span data-ref="count"></span>
    <span data-ref="message"></span>
</article>
`;

class Main extends Controller {
  static values = {
    count: {
      transformer: (val) => new Emitter(Number(val)),
    },
    message: {
      transformer: (val) => new Emitter(String(val)),
    },
  };

  $computedMessage = new ComputedEmitter(
    () => `${this.values.message.value} ${this.values.count.value}`,
    [this.values.count, this.values.message]
  );

  $connected() {
    const { count, message } = this.values;
    this.$computedMessage.subscribe(
      (val) => this.$.computed.one({ textContent: val }),
      { lazy: false }
    );
    count.subscribe(
      (val) => {
        this.$.count.one({ textContent: val });
      },
      { lazy: false }
    );
    message.subscribe(
      (val) => {
        this.$.message.one({ textContent: val });
      },
      { lazy: false }
    );
  }
}

Application.controller("main", Main);

const controller = selectController("main");
const context = Application.registry.get(controller);

describe("Usage with Emitters package", () => {
  it("should set the text content of the elements on init", () => {
    expect(controller.querySelector('[data-ref="computed"]').textContent).toBe(
      "hello world 0"
    );
    expect(controller.querySelector('[data-ref="count"]').textContent).toBe(
      "0"
    );
    expect(controller.querySelector('[data-ref="message"]').textContent).toBe(
      "hello world"
    );
  });

  it("should correctly updated after changing the values", () => {
    const { count } = context.values;

    count.next(count.value + 1);
    expect(controller.querySelector('[data-ref="computed"]').textContent).toBe(
      "hello world 1"
    );
    expect(controller.querySelector('[data-ref="count"]').textContent).toBe(
      "1"
    );
  });
});
