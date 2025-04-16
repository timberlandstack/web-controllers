export const BaseComponent = (appInstance) =>
  class extends HTMLElement {
    constructor() {
      super();
      this.targetName = this.getAttribute("target");
      this.appInstance = appInstance;
      this.isLazy = this.hasAttribute("lazy");
    }

    setupProperties() {
      this.style.display = "none";

      this.target = this.targetName
        ? this.closestController.$[this.targetName].reset().one()
        : this.parentElement;

      this.namespace = this.target?.dataset?.scope;
    }

    init = () => {
      this.setupProperties(this);
      this.onConnected?.(this);
    };

    connectedCallback() {
      this.closestController = this.closest("x-controller");
      if (!this.closestController.initialized) {
        this.closestController.queue.add(this.init);
        return;
      }

      if (!this.isLazy) this.init();
    }
    disconnectedCallback() {
      this.onDisconected?.();
    }
  };
