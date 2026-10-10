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
function setProps(dom, props) {
  for (const [name, value] of Object.entries(props)) {
    if (name === "children" || value == null) {
      continue;
    }

    const lowerName = name.toLowerCase();

    // Event handler: onClick, onInput, ...
    // Không gắn event handler dạng chuỗi không an toàn.
    if (lowerName.startsWith("on")) {
      if (typeof value === "function") {
        dom.addEventListener(lowerName.slice(2), value);
      }
      continue;
    }

    // React dùng className, HTML dùng class.
    if (name === "className") {
      dom.setAttribute("class", value);
      continue;
    }

    // Hỗ trợ style dạng object.
    if (name === "style" && typeof value === "object") {
      Object.assign(dom.style, value);
      continue;
    }

    // Xử lý thuộc tính boolean.
    if (typeof value === "boolean") {
      if (name in dom) {
        dom[name] = value;
      } else if (
        name.startsWith("aria-") ||
        name.startsWith("data-")
      ) {
        dom.setAttribute(name, String(value));
      } else if (value) {
        dom.setAttribute(name, "");
      }
      continue;
    }

    dom.setAttribute(name, String(value));
  }
}

export function renderToDOM(vnode) {
  if (!vnode || typeof vnode !== "object" ||
      typeof vnode.type !== "string") {
    throw new TypeError("Invalid VNode");
  }

  // Nếu là text node thì tạo text node thật.
  if (vnode.type === TEXT_ELEMENT) {
    return document.createTextNode(vnode.props.nodeValue);
  }

  // Tạo phần tử HTML thật.
  const dom = document.createElement(vnode.type);

  // Gắn attributes và event listeners.
  setProps(dom, vnode.props ?? {});

  // Render lần lượt các phần tử con.
  for (const child of vnode.props?.children ?? []) {
    dom.appendChild(renderToDOM(child));
  }

  return dom;
}