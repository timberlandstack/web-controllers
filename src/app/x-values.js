export const setValues = ({ htmlElement, controller }) => {
  if (!controller.values) return;
  const controllerName = htmlElement.dataset.controller;

  const emit = (propertyName, propertyValue) => {
    htmlElement.dispatchEvent(
      new CustomEvent(`${controllerName}.${propertyName}`, {
        detail: propertyValue,
        bubbles: true,
      })
    );
  };

  const getInstanceValues = (element) => {
    return Object.entries(controller.values).reduce((acc, [key, value]) => {
      const attributeValue = element.dataset[key];

      acc[key] = attributeValue
        ? value.transformer?.(attributeValue)
        : value.default;

      setTimeout(() => emit(key, acc[key]));

      return acc;
    }, {});
  };

  return new Proxy(getInstanceValues(htmlElement), {
    get: (target, property) => {
      return target[property];
    },
    set: (target, property, newValue) => {
      target[property] = newValue;
      emit(property, newValue);
      return true;
    },
  });
};
