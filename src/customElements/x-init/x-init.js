import { registry } from "../../app";
import { resolveProperty } from "../../utils";
import { BaseComponent } from "../base-component/base-component";

export class XInit extends BaseComponent {
  static selector = "x-init";
  static registry = new WeakSet();

  resolveMethod(name) {
    return resolveProperty({
      propertyName: this.getAttribute(name) ?? name.replace(":", "$"),
      context: this.context.scope,
      namespace: this.namespace ?? null,
    });
  }
  onConnected() {
    if (XInit.registry.has(this.target)) return;
    XInit.registry.add(this.target);

    this.onElementConnected = this.resolveMethod(":connected");
    this.onElementDisconnected = this.resolveMethod(":disconnected");
    this.onElementConnected?.(this.target);
  }
  onDisconnected() {
    this.onElementDisconnected?.(this.target);
    if (this.target.hasAttribute("data-controller")) {
      this.context._lifecycleMethods?.disconnected?.();
      this.context._lifecycleMethods = null;
      registry.delete(this.target);
    }
    this.target.remove();
  }
}
