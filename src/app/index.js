import { Context } from "../context";

export class App {
  constructor() {
    this.registry = new WeakMap();
    this.controllers = {};
    this.scheduledRegistry = new WeakMap();
  }

  controller(selector, controllerCallback) {
    this.controllers[selector] = controllerCallback;
  }

  init() {
    document.querySelectorAll("[data-controller]").forEach((el) => {
      this.initializeController(el);
    });
  }

  use(...customElementsFactories) {
    customElementsFactories.forEach((factory) => {
      const customElement = factory(this);
      if (customElement.selector && !customElements.get(customElement.selector))
        customElements.define(customElement.selector, customElement);
    });
  }

  initializeScheduled(htmlElement) {
    const queue = this.scheduledRegistry.get(htmlElement);
    queue?.forEach((cb) => cb?.());
    this.scheduledRegistry.delete(htmlElement);
  }

  initializeController(htmlElement, lazy = false) {
    if (this.registry.has(htmlElement)) return;

    const controllerName = htmlElement.dataset?.controller;
    const controller = this.controllers[controllerName];

    const register = () => {
      const currentContext = new Context(htmlElement);
      const scope = controller?.(currentContext);
      if (scope) {
        currentContext.$scope(scope);
      }

      this.registry.set(htmlElement, currentContext);
    };

    if (lazy) {
      this.scheduledRegistry.set(htmlElement, new Set([register]));
      return;
    }

    register();
  }
}
