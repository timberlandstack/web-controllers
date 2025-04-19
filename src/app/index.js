export const controllers = {};
export const registry = new WeakMap();
export const elementsQueue = new WeakMap();
export let observer = null;

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
    nestedController: htmlElement.querySelector("[data-controller]"),
    rootElement: htmlElement,
    use: (...helpers) => {
      helpers.forEach(
        (helper) =>
          (currentContext[helper.alias ?? helper.fn.name] =
            helper.fn(currentContext))
      );
    },
  };

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
        if (!entry.isIntersecting) return;
        initializeController(entry.target);
        if (!htmlElement.hasAttribute("data-repeat"))
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
