import { resolveProperty } from "../../utils";
import { BaseComponent } from "../base-component/base-component";

export class XInit extends BaseComponent {
  static selector = "x-init";

  resolveMethod(name) {
    return resolveProperty({
      propertyName: this.getAttribute(name) ?? name.replace(":", "$"),
      context: this.context.scope,
      namespace: this.namespace ?? null,
    });
  }
  onConnected() {
    this.onElementConnected = this.resolveMethod(":connected");
    this.onElementDisconnected = this.resolveMethod(":disconnected");
    this.onElementConnected?.(this.target);
  }
  onDisconnected() {
    this.onElementDisconnected?.(this.target);
    this.target.remove();
  }
}
