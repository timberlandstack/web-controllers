export const Application = {
  controllers: {},
  registry: new WeakMap(),
  elementsQueue: new WeakMap(),
  observer: null,

  observe(htmlElement) {
    Application.observer ??= new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting)
          Application.initializeController(entry.target) &&
            Application.observer.unobserve(entry.target);
      });
    });
    Application.observer.observe(htmlElement);
  },

  controller(selector, controller) {
    Application.controllers[selector] = controller;
    document
      .querySelectorAll(`[data-controller="${selector}"]`)
      .forEach((element) => {
        Application.initializeController(element);
      });
  },

  initializeController(htmlElement) {
    if (Application.registry.has(htmlElement)) return;
    if (
      htmlElement.dataset?.load === "visible" &&
      !Application.elementsQueue.has(htmlElement)
    ) {
      Application.observe(htmlElement);
      Application.elementsQueue.set(htmlElement, new Set());
      return;
    } // observe it

    const controllerName = htmlElement.dataset?.controller;
    const controller = Application.controllers[controllerName];
    const controllerInstance = new controller(htmlElement);
    const cleanup = controllerInstance.$connected?.();
    if (typeof cleanup === "function")
      controllerInstance.$disconnected = cleanup;
    Application.registry.set(htmlElement, controllerInstance);
    Application.elementsQueue.get(htmlElement)?.forEach((cb) => cb());
    Application.elementsQueue.delete(htmlElement);
  },

  use(...customElementsFactories) {
    customElementsFactories.forEach((element) => {
      if (element.selector && !customElements.get(element.selector))
        customElements.define(element.selector, element);
    });
  },
};
