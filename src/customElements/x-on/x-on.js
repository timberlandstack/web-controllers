import { attachEvents } from "../../utils";
import { BaseComponent } from "../base-component/base-component";

export const XOnFactory = (appInstance) =>
  class XOn extends BaseComponent(appInstance) {
    static selector = "x-on";
    constructor() {
      super();
    }
    onConnected() {
      attachEvents({ customElement: this, target: this.target }, this.context.scope);
      this.remove();
    }
  };
