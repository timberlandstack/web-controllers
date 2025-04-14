import { Context } from "../context";
import { BaseComponent } from "../customElements/base-component/base-component";

export class App {
  constructor() {
    this.registry = new WeakMap();
    this.controllers = {};
    this.scheduledRegistry = new WeakMap();
  }

  controller(selector, controllerCallback) {
    this.controllers[selector] = controllerCallback;
  }
  _controller(selector, controllerCallback) {
    if (customElements.get(`${selector}-controller`)) return;

    customElements.define(
      `${selector}-controller`,
      class extends HTMLElement {
        constructor() {
          super();
          this.initialized = false;
        }
        connectedCallback() {
          this.init = () => {
            if (this.initialized) return;
            const currentContext = new Context(this);
            const scope = controllerCallback(currentContext);
            if (scope) {
              currentContext.$scope(scope);
            }

            Object.assign(this, currentContext);
            if (typeof currentContext.scope?.connected === "function") {
              currentContext.scope?.connected?.(this);
              currentContext.scope.connected = undefined;
            }

            this.initialized = true;
          };
          this.setAttribute("data-controller", selector);

          if (!this.hasAttribute("lazy")) this.init();
        }
      }
    );
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
