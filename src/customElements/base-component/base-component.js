export const BaseComponent = (appInstance) =>
  class extends HTMLElement {
    constructor() {
      super();
      this.targetName = this.getAttribute("target");
      this.appInstance = appInstance;
      this.isLazy = this.hasAttribute("lazy");
    }

    baseActions = () =>
      new Set([
        this.initializeClosestController.bind(this),
        this.setupProperties.bind(this),
        this.onConnected?.bind(this),
      ]);

    setupProperties() {
      this.style.display = "none";
      this.context = this.appInstance.registry.get(this.closestController);
      this.target = this.targetName
        ? this.context.$[this.targetName].reset().one()
        : this.parentElement;

      this.namespace = this.target.dataset?.scope;
    }

    initializeClosestController() {
      if (!this.appInstance.registry.has(this.closestController))
        this.appInstance.initializeController(this.closestController, false);
    }

    connectedCallback() {
      this.closestController = this.closest("[data-controller]");
      this.isLazy
        ? this.appInstance.scheduledRegistry.set(this, this.baseActions())
        : this.baseActions().forEach((action) => action());
    }
    disconnectedCallback() {
      this.onDisconected?.();
    }
  };
