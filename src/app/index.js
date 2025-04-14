import { XControllerFactory } from "../customElements/x-controller/x-controller";

export class App {
  controller(selector, controllerCallback) {
    if (customElements.get(`${selector}-controller`)) {
      console.error(`${selector} controller has already been registered`);
      return;
    }

    customElements.define(
      `${selector}-controller`,
      XControllerFactory(selector, controllerCallback)
    );
  }

  use(...customElementsFactories) {
    customElementsFactories.forEach((factory) => {
      const customElement = factory(this);
      if (customElement.selector && !customElements.get(customElement.selector))
        customElements.define(customElement.selector, customElement);
    });
  }
}
