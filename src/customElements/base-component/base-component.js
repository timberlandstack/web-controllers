import { Application } from "../../app";
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.targetName = this.getAttribute("target");
    this.isLazy = this.hasAttribute("lazy");
  }
  setupProperties() {
    this.style.display = "none";
    this.context = Application.registry.get(this.closestController);

    this.target = this.targetName
      ? this.context.$[this.targetName].reset().one()
      : this.parentElement;

    this.namespace = this.target?.dataset?.namespace;
  }

  init = () => {
    this.setupProperties();
    this.onConnected?.();
  };

  connectedCallback() {
    this.closestController = this.closest("[data-controller]");
    // It hasn't been initialized because it's lazy
    if (Application.elementsQueue.has(this.closestController)) {
      Application.elementsQueue.get(this.closestController).add(this.init);
      return;
    }
    // It hasn't been initialized because it just entered the DOM
    if (!Application.registry.has(this.closestController)) {
      Application.initializeController(this.closestController);
    }

    this.init();
  }
  disconnectedCallback() {
    this.onDisconnected?.();
  }
}
