import { createElement, renderToDOM } from "../core/mini-react.js";

const app = createElement(
  "main",
  { id: "root-view", role: "main" },

  createElement(
    "section",
    { className: "hero" },
    createElement("h1", null, "Mini React Engine"),
    createElement(
      "p",
      null,
      "Security test: <script>alert(1)</script> should appear as plain text."
    )
  ),

  createElement(
    "button",
    {
      type: "button",
      onClick: () => console.log("Ping"),
    },
    "Click me"
  )
);

const root = document.getElementById("app");

if (!root) {
  throw new Error("Root element #app not found");
}

root.replaceChildren(renderToDOM(app));

// Kiá»ƒm tra mount.
console.assert(
  root.querySelector("button") !== null,
  "Mount Failed"
);

// Kiá»ƒm tra HTML semantic.
console.assert(
  root.querySelector("main") !== null &&
    root.querySelector("section") !== null,
  "Semantic HTML check failed"
);

// Kiá»ƒm tra XSS.
console.assert(
  root.querySelector("p")?.textContent ===
    "Security test: <script>alert(1)</script> should appear as plain text.",
  "XSS text check failed"
);

console.assert(
  root.querySelector("p script") === null,
  "XSS check failed: unexpected script element"
);

console.log("Exercise 1 checks finished.");
