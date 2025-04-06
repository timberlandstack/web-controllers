import { Context } from "../context";

export class App {
  constructor() {
    this.registry = new WeakMap();
    this.controllers = {};
  }

  controller(selector, callback) {
    this.controllers[selector] = callback;
  }

  init(customElementsFactories = []) {
    document.querySelectorAll(`[data-controller]`).forEach((el) => {
      this.initializeComponent(el);
    });

    customElementsFactories.forEach((factory) => {
      const customElement = factory(this);
      if (customElement.selector && !customElements.get(customElement.selector))
        customElements.define(customElement.selector, customElement);
    });
  }

  initializeComponent(htmlElement) {
    if (this.registry.has(htmlElement)) return;

    const componentName = htmlElement.dataset?.controller;
    const component = this.controllers[componentName];

    const currentContext = new Context(htmlElement);
    const scope = component?.(currentContext);
    if (scope) {
      currentContext.$scope(scope);
    }

    this.registry.set(htmlElement, currentContext);
  }
}
