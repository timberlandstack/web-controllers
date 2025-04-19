import { Ref } from "../ref";

export const mount = (context) => {
  context.scope._namespaces ??= {};
  return (namespace, callback) => {
    context.scope._namespaces[namespace] = callback(context);
  };
};

export const getQueryString = (context) => {
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
