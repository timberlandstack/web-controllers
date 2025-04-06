import { Ref } from "../ref";

export class Context {
  elementsCache = new Map();
  scope = null;
  #nestedComponent = null;

  constructor(rootElement) {
    this.rootElement = rootElement;
    this.#nestedComponent = this.rootElement.querySelector("[data-controller]");
  }

  $scope = (hydrationScope) => {
    if (!this.scope) this.scope = {};
    Object.assign(this.scope, hydrationScope);
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
        console.error("Cannot manually set properties on the $ object");
        return false;
      },
    },
  );

  $select = (selector, options = { invalidate: false, all: false }) => {
    const completeSelector = this.$getQueryString(selector);
    if (this.elementsCache.has(completeSelector) && !options.invalidate) {
      return this.elementsCache.get(completeSelector);
    }

    const foundElements = this.rootElement.querySelectorAll(completeSelector);
    this.elementsCache.set(
      completeSelector,
      options.all ? [...foundElements] : foundElements[0],
    );
    return this.elementsCache.get(completeSelector);
  };

  $getQueryString = (selector) => {
    let queryString = selector;
    if (this.#nestedComponent) {
      queryString += `:not( [data-controller="${this.#nestedComponent.dataset?.controller}"] * )`;
    }
    return queryString;
  };
}
