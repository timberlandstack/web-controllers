export const controllers = {};
export const registry = new WeakMap();
export const elementsQueue = new WeakMap();
export let observer = null;
const appGlobals = {
  helpers: {},
};

export const defineGlobals = (globals) => {
  for (const global in globals) {
    appGlobals[global] = globals[global];
  }
};

export const observers = {
  lazy: null,
  visible: null,
};

export const initializeController = (htmlElement) => {
  if (registry.has(htmlElement)) return;
  if (
    htmlElement.hasAttribute("data-load") &&
    !elementsQueue.has(htmlElement)
  ) {
    observe(htmlElement);
    elementsQueue.set(htmlElement, new Set());
    return;
  }

  const controllerName = htmlElement.dataset?.controller;
  const { callback, valuesSchema = {} } = controllers[controllerName];

  const currentContext = {
    valuesSchema,
    scope: {},
    rootElement: htmlElement,
    ...appGlobals.helpers,
    decorate: (helpers) => {
      for (const helper in helpers) {
        currentContext[helper] = helpers[helper]?.(currentContext);
      }
    },
  };
  for (const helper in appGlobals.helpers) {
    currentContext[helper] = appGlobals.helpers[helper]?.(currentContext);
  }

  // Just in case we want to manipulate the scope from the controller
  Object.assign(currentContext.scope, callback(currentContext) ?? {});

  const cleanup = currentContext.$connected?.();
  if (typeof cleanup === "function") currentContext.$disconnected = cleanup;
  registry.set(htmlElement, currentContext);
  elementsQueue.get(htmlElement)?.forEach((cb) => cb());
  elementsQueue.delete(htmlElement);
};

export const observe = (htmlElement) => {
  const type = htmlElement.dataset.load;
  observers[type] ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && !registry.has(entry.target)) return;

        if (!entry.isIntersecting && registry.has(entry.target)) {
          registry.get(entry.target).$offViewport?.();
        }

        if (entry.isIntersecting && !registry.has(entry.target)) {
          initializeController(entry.target);
          registry.get(entry.target).$inViewport?.();
        }
        if (entry.isIntersecting && registry.has(entry.target)) {
          registry.get(entry.target).$inViewport?.();
        }
        if (!entry.target.hasAttribute("data-load-repeat"))
          observers[type].unobserve(entry.target);
      });
    },
    { threshold: type === "lazy" ? 0.0 : 1 }
  );
  observers[type].observe(htmlElement);
};

export const defineController = (selector, { values, controller }) => {
  controllers[selector] = {
    valuesSchema: values,
    callback: controller,
  };

  document
    .querySelectorAll(`[data-controller="${selector}"]`)
    .forEach((element) => {
      initializeController(element);
    });
};

export const useElements = (...elements) => {
  elements.forEach((element) => {
    if (element.selector && !customElements.get(element.selector))
      customElements.define(element.selector, element);
  });
};
