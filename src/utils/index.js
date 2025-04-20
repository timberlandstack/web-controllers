export const mergeNamespace = (context, namespace) => {
  const { _namespaces: ns } = context;
  return ns?.[namespace]
    ? { ...context, [namespace]: ns[namespace] }
    : { ...context };
};

export const resolveProperty = ({ propertyName, context, namespace }) => {
  const hydrationContext = mergeNamespace(context, namespace);
  if (!hydrationContext || !propertyName) return;
  if (namespace && !propertyName.startsWith("controller#"))
    propertyName = `${namespace}.${propertyName}`;

  const resolvedValue = propertyName
    .replace("controller#", "")
    .split(".")
    .reduce((acc, current) => {
      return acc[current];
    }, hydrationContext);

  return resolvedValue;
};

export const getEventsMap = (namedNodeMap) => {
  return Object.values(namedNodeMap).reduce((acc, attr) => {
    if (!attr.name.startsWith(":")) return acc;
    acc[attr.name.slice(1)] = attr.value.replaceAll(" ", "").split(",");
    return acc;
  }, {});
};

const unpackMethods = (methodsArray, context, namespace) => {
  return methodsArray.map((methodName) => {
    const method = resolveProperty({
      propertyName: methodName,
      context,
      namespace,
    });
    if (typeof method?.handleEvent === "function") {
      method.handleEvent = method.handleEvent.bind(context);
      return method;
    }
    if (typeof method === "function") {
      return method.bind(context);
    }
  });
};

export const attachEvents = ({ customElement, target }, context) => {
  const eventsMap = getEventsMap(customElement.attributes);

  Object.entries(eventsMap).forEach(([eventName, methodsArray]) => {
    const callbacks = unpackMethods(
      methodsArray,
      context,
      customElement.namespace
    );

    callbacks.forEach((callback) => {
      target.addEventListener(eventName, callback, callback?.options ?? {});
    });
  });
};

export const jsonParse = (...values) => {
  return values.reduce((acc, current) => {
    let currentValue;
    try {
      currentValue = JSON.parse(current);
    } catch (_) {
      currentValue = current;
    }
    acc.push(currentValue);
    return acc;
  }, []);
};
