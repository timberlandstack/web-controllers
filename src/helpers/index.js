import { Ref } from "./ref";

export const mount = (context) => {
  context.scope._namespaces ??= {};
  return (namespace, callback) => {
    context.scope._namespaces[namespace] = callback(context);
  };
};

export const lifecycle = (context) => {
  context._lifecycleMethods ??= {};
  const $connected = (callback) => {
    context._lifecycleMethods.connected = callback;
  };
  const $disconnected = (callback) => {
    context._lifecycleMethods.disconnected = callback;
  };
  return {
    $connected,
    $disconnected,
  };
};

export const viewport = (context) => {
  context._viewportMethods ??= {};
  const $inViewport = (callback) => {
    context._viewportMethods.inViewport = callback;
  };
  const $offViewport = (callback) => {
    context._viewportMethods.offViewport = callback;
  };
  return {
    $inViewport,
    $offViewport,
  };
};

export const getQueryString = (context) => {
  context.nestedController ??=
    context.rootElement.querySelector("[data-controller]");

  return (selector) => {
    let queryString = selector;
    if (context.nestedController) {
      queryString += `:not( [data-controller="${context.nestedController.getAttribute(
        "data-controller"
      )}"] * )`;
    }
    return queryString;
  };
};

export const select = (context) => {
  context.elementsCache ??= new Map();

  return (selector, options = { invalidate: false, all: false }) => {
    const completeSelector = getQueryString(context)(selector);
    if (context.elementsCache.has(completeSelector) && !options.invalidate) {
      return context.elementsCache.get(completeSelector);
    }

    const foundElements =
      context.rootElement.querySelectorAll(completeSelector);
    context.elementsCache.set(
      completeSelector,
      options.all ? [...foundElements] : foundElements[0]
    );
    return context.elementsCache.get(completeSelector);
  };
};

export const ref = (context) => {
  context.elementsCache ??= new Map();

  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        target[prop] = new Ref(prop, {
          elementsCache: context.elementsCache,
          $select: select(context),
        });
        return target[prop];
      },
      set: () => {
        return false;
      },
    }
  );
};

export const values = ({ rootElement, valuesSchema }) => {
  if (!valuesSchema) return;

  return Object.entries(valuesSchema).reduce((acc, [key, value]) => {
    const attributeValue = rootElement.dataset[`${key}Value`];

    acc[key] = attributeValue
      ? value.transformer?.(attributeValue)
      : value.default;

    return acc;
  }, {});
};
