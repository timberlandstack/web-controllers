import {
  registry,
  elementsQueue,
  initializeController,
} from "../../app/index.js";
import { getQueryString } from "../../helpers";
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.targetName = this.getAttribute("target");
    this.isLazy = this.hasAttribute("lazy");
  }
  setupProperties() {
    this.style.display = "none";
    this.context = registry.get(this.closestController);
    this._target =
      this.targetName &&
      this.context.rootElement.querySelector(
        getQueryString(this.context)(`[data-ref="${this.targetName}"]`)
      );

    this.target = this._target ?? this.parentElement;

    this.namespace = this.target?.dataset?.namespace;
  }

  init = () => {
    this.setupProperties();
    this.onConnected?.();
  };

  connectedCallback() {
    this.closestController = this.closest("[data-controller]");
    // It hasn't been initialized because it's lazy
    if (elementsQueue.has(this.closestController)) {
      elementsQueue.get(this.closestController).add(this.init);
      return;
    }
    // It hasn't been initialized because it just entered the DOM
    if (!registry.has(this.closestController)) {
      initializeController(this.closestController);
    }

    this.init();
  }
  disconnectedCallback() {
    this.onDisconnected?.();
  }
}
