import { Context } from "../../context";

export const XControllerFactory = (appInstance) => {
  return class extends HTMLElement {
    constructor() {
      super();
      this.initialized = false;
      this.queue = new Set();
      this.name = this.getAttribute("name");
    }

    init = () => {
      if (this.initialized) return;
      const currentContext = new Context(this);
      const scope = appInstance.registry[this.name]?.(currentContext);
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
