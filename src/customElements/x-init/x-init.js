import { resolveProperty } from "../../utils";
import { BaseComponent } from "../base-component/base-component";

export const XInitFactory = (appInstance) =>
  class XInit extends BaseComponent(appInstance) {
    static selector = "x-init";

    resolveMethod(name) {
      return resolveProperty({
        propertyName: this.getAttribute(name) ?? null,
        context: this.closestController.scope,
        namespace: this.namespace ?? null,
      });
    }
    onConnected() {
      this.onElementConnected = this.resolveMethod("connected");
      this.onElementDisconected = this.resolveMethod("disconnected");

      this.onElementConnected?.(this.target);
    }
    onDisconected() {
      this.onElementDisconected?.(this.target);
      this.target.remove();
    }
  };
