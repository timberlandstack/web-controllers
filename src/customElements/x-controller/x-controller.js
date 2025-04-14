import { Context } from "../../context";

export const XControllerFactory = (selector, controllerCallback) => {
  return class extends HTMLElement {
    constructor() {
      super();
      this.initialized = false;
      this.dataset.controller = selector;
      this.queue = new Set();
    }

    init = () => {
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
      if (typeof currentContext.scope?.disconnected === "function") {
        this.disconnected = currentContext.scope?.disconnected.bind(this);
        currentContext.scope.disconnected = undefined;
      }

      this.initialized = true;
      this.queue.forEach((cb) => cb());
    };

    connectedCallback() {
      if (!this.hasAttribute("lazy")) this.init();
    }
    disconnectedCallback() {
      this.disconnected?.(this);
    }
  };
};
