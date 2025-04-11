export class Ref {
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
            attributes[attribute]?.options ?? {}
          )
        : typeof attributes[attribute] === "function"
        ? (element[attribute] = attributes[attribute](element))
        : attribute in element
        ? (element[attribute] = attributes[attribute])
        : element.setAttribute(attribute, attributes[attribute]);
    }
  }
}
