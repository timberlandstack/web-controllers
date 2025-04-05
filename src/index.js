const XInitFactory = (appInstance) =>
  class XInit extends HTMLElement {
    rootElement = null;

    connectedCallback() {
      this.rootElement = this.closest("[data-controller]");
      appInstance.initializeComponent(this.rootElement);
    }

    disconnectedCallback() {
      appInstance.registry.delete(this.rootElement);
    }
  };

export const resolveProperty = (propertyName, context) => {
  const resolvedValue = propertyName.split(".").reduce((acc, current) => {
    return acc[current];
  }, context);

  return resolvedValue;
};

class Ref {
  constructor(name, context) {
    this.name = name;
    this.context = context;
    this.invalidate = false;
    this.lastAccessed = null;
  }

  all = (attributes) => {
    if (this.lastAccessed === "one") {
      this.context.elementsCache.delete(this.name);
      this.invalidate = true;
    }
    const query = this.context.$select(`[data-ref="${this.name}"]`, {
      all: true,
      invalidate: this.invalidate,
    });
    if (attributes) {
      query.forEach((element) => this.#hydrate(attributes, element));
    }
    this.invalidate = false;
    this.lastAccessed = "all";
    return query;
  };

  one = (attributes) => {
    if (this.lastAccessed === "all") {
      this.context.elementsCache.delete(this.name);
      this.invalidate = true;
    }
    this.lastAccessed = "one";
    const query = this.context.$select(`[data-ref="${this.name}"]`, {
      all: false,
      invalidate: this.invalidate,
    });
    if (attributes) this.#hydrate(attributes, query);
    this.invalidate = false;
    return query;
  };

  reset = () => {
    this.context.elementsCache.delete(this.name);
    this.invalidate = true;
    this.lastAccessed = null;
    return this;
  };

  #hydrate(attributes, element) {
    for (const attribute in attributes) {
      attribute.startsWith("on")
        ? element.addEventListener(
            attribute.slice(2),
            attributes[attribute],
            attributes[attribute]?.options ?? {},
          )
        : element.setAttribute(attribute, attributes[attribute]);
    }
  }
}

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

export const getEventsMap = (string) => {
  const handlersList = string.replaceAll(" ", "").split("|");

  return handlersList.reduce((events, handler) => {
    const [rawEventName, rawMethodsList] = handler.split(":");

    const eventsList = rawEventName.slice(1, -1).split(",");
    const methodsList = rawMethodsList.split(",");

    eventsList.forEach((eventName) => {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName].push(...methodsList);
    });
    return events;
  }, {});
};

const unpackMethods = (methodsArray, context) => {
  return methodsArray.map((methodName) => {
    const method = resolveProperty(methodName, context.scope);
    if (
      typeof method === "function" ||
      typeof method.handleEvent === "function"
    ) {
      return method;
    }
  });
};

const attachEvents = (element, context) => {
  const eventsMap = getEventsMap(element.dataset.on);

  Object.entries(eventsMap).forEach(([eventName, methodsArray]) => {
    const callbacks = unpackMethods(methodsArray, context);

    callbacks.forEach((callback) => {
      element.addEventListener(eventName, callback, callback.options ?? {});
    });
  });
};

const hydrate = (context) => {
  const eventsQuery = context.$select("[data-on]", { all: true });
  eventsQuery.forEach((el) => attachEvents(el, context));
};

export default class {
  constructor(options = { initializerElementTag: "x-init" }) {
    this.registry = new WeakMap();
    this.controllers = {};
    this.initializerElement = XInitFactory(this);
    this.initializerElementTag = options.initializerElementTag;
  }

  controller(selector, callback) {
    this.controllers[selector] = callback;
  }

  init() {
    if (!customElements.get(this.initializerElementTag)) {
      customElements.define(
        this.initializerElementTag,
        this.initializerElement,
      );
    }
  }

  initializeComponent(htmlElement) {
    if (this.registry.has(htmlElement)) return;

    const componentName = htmlElement.dataset?.controller;
    const component = this.controllers[componentName];

    const currentContext = new Context(htmlElement);
    const scope = component?.(currentContext);
    if (scope) {
      currentContext.$scope(scope);
    }

    this.registry.set(htmlElement, currentContext);
    if (!currentContext.scope) return;
    hydrate(currentContext);
  }
}
