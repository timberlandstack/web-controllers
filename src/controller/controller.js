import { Ref } from "../ref";

export class Controller {
  elementsCache = new Map();
  #nestedController = null;

  constructor(rootElement) {
    this.rootElement = rootElement;
    this.#nestedController =
      this.rootElement.querySelector("[data-controller]");
  }

  $mount = (namespace, componentCallback) => {
    this[namespace] = componentCallback(this);
  };

  $ = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        target[prop] = new Ref(prop, this);
        return target[prop];
      },
      set: () => {
        return false;
      },
    }
  );

  $select = (selector, options = { invalidate: false, all: false }) => {
    const completeSelector = this.$getQueryString(selector);
    if (this.elementsCache.has(completeSelector) && !options.invalidate) {
      return this.elementsCache.get(completeSelector);
    }

    const foundElements = this.rootElement.querySelectorAll(completeSelector);
    this.elementsCache.set(
      completeSelector,
      options.all ? [...foundElements] : foundElements[0]
    );
    return this.elementsCache.get(completeSelector);
  };

  $getQueryString = (selector) => {
    let queryString = selector;
    if (this.#nestedController) {
      queryString += `:not( [data-controller="${this.#nestedController.getAttribute(
        "data-controller"
      )}"] * )`;
    }
    return queryString;
  };
}
