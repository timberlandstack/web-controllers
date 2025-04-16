import { XControllerFactory } from "../customElements/x-controller/x-controller";

export class App {
  registry = {};
  observer = null;

  constructor() {
    setTimeout(() => {
      if (!customElements.get("x-controller"))
        customElements.define("x-controller", XControllerFactory(this));
    });
  }

  observe(htmlElement) {
    this.observer ??= new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting)
          entry.target.init() && this.observer.unobserve(htmlElement);
      });
    });
    this.observer.observe(htmlElement);
  }

  controller(selector, controllerCallback) {
    if (this.registry[selector]) {
      console.error(`${selector} controller has already been registered`);
      return;
    }

    this.registry[selector] = controllerCallback;
  }

  use(...customElementsFactories) {
    setTimeout(() => {
      customElementsFactories.forEach((factory) => {
        const customElement = factory(this);
        if (
          customElement.selector &&
          !customElements.get(customElement.selector)
        )
          customElements.define(customElement.selector, customElement);
      });
    });
  }
}
