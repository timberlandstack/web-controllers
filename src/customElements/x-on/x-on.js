import { attachEvents } from "../../utils";
import { BaseComponent } from "../base-component/base-component";

export class XOn extends BaseComponent {
  static selector = "x-on";
  onConnected() {
    attachEvents({ customElement: this, target: this.target }, this.context);
    this.remove();
  }
}
