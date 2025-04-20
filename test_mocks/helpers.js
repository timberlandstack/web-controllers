export const selectController = (name) => {
  return document.querySelector(`[data-controller="${name}"]`);
};
