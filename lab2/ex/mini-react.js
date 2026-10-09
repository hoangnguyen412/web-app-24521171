const TEXT_ELEMENT = "TEXT_ELEMENT";

export function createTextElement(value) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: String(value),
      children: [],
    },
  };
}

export function createElement(type, props, ...children) {
  if (typeof type !== "string" || !type.trim()) {
    throw new TypeError("Element type must be a non-empty string");
  }

  const normalizedChildren = children
    .flat(Infinity)
    .filter(
      (child) =>
        child !== null &&
        child !== undefined &&
        typeof child !== "boolean"
    )
    .map((child) => {
      if (typeof child === "object" && "type" in child) {
        return child;
      }

      return createTextElement(child);
    });

  return {
    type,
    props: {
      ...(props ?? {}),
      children: normalizedChildren,
    },
  };
}