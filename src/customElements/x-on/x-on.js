import { attachEvents } from "../../utils";
import { BaseComponent } from "../base-component/base-component";

export class XOn extends BaseComponent {
  static selector = "x-on";
  static registry = new WeakSet();

  onConnected() {
    if (XOn.registry.has(this.target)) return;
    XOn.registry.add(this.target);

    attachEvents(
      { customElement: this, target: this.target },
      this.context.scope
    );
    this.remove();
  }
}
