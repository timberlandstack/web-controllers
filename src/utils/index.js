export const resolveProperty = ({ propertyName, context, namespace }) => {
  if (!context || !propertyName) return;
  if (namespace) propertyName = `${namespace}.${propertyName}`;

  const resolvedValue = propertyName.split(".").reduce((acc, current) => {
    return acc[current];
  }, context);

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
    if (
      typeof method === "function" ||
      typeof method?.handleEvent === "function"
    ) {
      return method;
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
