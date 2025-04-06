export const BaseComponent = (appInstance) => class extends HTMLElement {
  constructor() {
    super();
    this.targetName = this.getAttribute("target");
    this.appInstance = appInstance;
  }
  connectedCallback() {
    this.style.display = "none";

    this.closestController = this.closest("[data-controller]");
    this.namespace = this.parentElement?.dataset?.scope ?? null

    if (this.parentElement.dataset.controller)
      this.appInstance.initializeComponent(this.closestController);
    
    this.context = this.appInstance.registry.get(this.closestController);
    this.target = this.targetName
      ? this.context.$[this.targetName].reset().one()
      : this.parentElement;
    
    this.namespace = this.target.dataset?.scope

    this.onConnected?.();
  }
  disconnectedCallback() {
    this.onDisconected?.();
  }
}
