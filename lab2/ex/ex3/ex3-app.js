import { createElement, renderToDOM } from "../core/mini-react.js";
import { resetCursor } from "../core/state-store.js";
import {
  configureStateDispatcher,
  useState,
} from "../core/reactive-state.js";
import {
  attachRootEventDelegation,
  updateActionHandlers,
} from "../core/event-delegation.js";
import {
  STATUS,
  transitionViewState,
} from "./state-machine.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error('Mount element "#app" was not found');
}

const API_URL =
  "https://jsonplaceholder.typicode.com/posts?_limit=5";

let activeController = null;
let latestRequestId = 0;

function createButton(label, action) {
  return createElement(
    "button",
    {
      type: "button",
      className: "button",
      "data-action": action,
    },
    label
  );
}

function createSkeletonCard() {
  return createElement(
    "article",
    {
      className: "skeleton-card",
      "aria-hidden": true,
    },
    createElement("div", {
      className: "skeleton skeleton-title",
    }),
    createElement("div", {
      className: "skeleton skeleton-line",
    }),
    createElement("div", {
      className: "skeleton skeleton-line short",
    })
  );
}

async function loadFeed(setViewState) {
  const requestId = ++latestRequestId;

  // Há»§y request cÅ© Ä‘á»ƒ trÃ¡nh xá»­ lÃ½ song song khÃ´ng cáº§n thiáº¿t.
  activeController?.abort();

  const controller = new AbortController();
  activeController = controller;

  transitionViewState(
    { status: STATUS.LOADING },
    setViewState
  );

  try {
    const response = await fetch(API_URL, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const items = await response.json();

    // Bá» qua káº¿t quáº£ náº¿u Ä‘Ã£ cÃ³ request má»›i hÆ¡n.
    if (requestId !== latestRequestId) {
      return;
    }

    if (!Array.isArray(items)) {
      throw new Error("Invalid API response");
    }

    transitionViewState(
      {
        status: STATUS.SUCCESS,
        data: items,
      },
      setViewState
    );
  } catch (error) {
    // Request cÅ© hoáº·c request bá»‹ há»§y khÃ´ng Ä‘Æ°á»£c ghi Ä‘Ã¨ state.
    if (
      requestId !== latestRequestId ||
      error.name === "AbortError"
    ) {
      return;
    }

    const message = !navigator.onLine
      ? "You appear to be offline. Check your internet connection."
      : "We couldn't load the feed. Check your connection and try again.";

    transitionViewState(
      {
        status: STATUS.ERROR,
        message,
      },
      setViewState
    );
  } finally {
    if (requestId === latestRequestId) {
      activeController = null;
    }
  }
}

function renderApp() {
  // Thá»© tá»± useState pháº£i giá»‘ng nhau á»Ÿ má»—i láº§n render.
  resetCursor();

  const [viewState, setViewState] = useState({
    status: STATUS.IDLE,
  });

  let content;

  switch (viewState.status) {
    case STATUS.IDLE:
      content = createElement(
        "section",
        { className: "state-panel" },
        createElement("h2", null, "Ready to load"),
        createElement(
          "p",
          null,
          "Load the feed to retrieve the latest posts."
        ),
        createButton("Load Feed", "load-feed")
      );
      break;

    case STATUS.LOADING:
      content = createElement(
        "section",
        {
          className: "state-panel",
          "aria-busy": true,
        },
        createElement(
          "p",
          { role: "status" },
          "Loading feed..."
        ),
        createElement(
          "div",
          { className: "skeleton-list" },
          ...Array.from(
            { length: 5 },
            () => createSkeletonCard()
          )
        )
      );
      break;

    case STATUS.SUCCESS:
      content = createElement(
        "section",
        { className: "state-panel" },
        createElement(
          "div",
          { className: "feed-toolbar" },
          createElement(
            "h2",
            null,
            `Loaded ${viewState.data.length} posts`
          ),
          createButton("Refresh Feed", "load-feed")
        ),
        viewState.data.length > 0
          ? createElement(
              "ul",
              { className: "feed-list" },
              ...viewState.data.map((item) =>
                createElement(
                  "li",
                  { className: "feed-card" },
                  createElement("h3", null, item.title),
                  createElement("p", null, item.body)
                )
              )
            )
          : createElement(
              "p",
              null,
              "No posts available."
            )
      );
      break;

    case STATUS.ERROR:
      content = createElement(
        "section",
        { className: "state-panel" },
        createElement("h2", null, "Unable to load feed"),
        createElement(
          "p",
          {
            className: "error-message",
            role: "alert",
          },
          viewState.message
        ),
        createButton("Retry Connection", "retry-feed")
      );
      break;
  }

  const appVNode = createElement(
    "main",
    { className: "app-container" },
    createElement(
      "header",
      { className: "app-header" },
      createElement("h1", null, "Data Feed"),
      createElement(
        "p",
        null,
        "Exercise 3 â€” Resilient State Machine"
      )
    ),
    content
  );

  root.replaceChildren(renderToDOM(appVNode));

  // Event handlers Ä‘Æ°á»£c quáº£n lÃ½ táº­p trung táº¡i root.
  updateActionHandlers({
    "load-feed": () => loadFeed(setViewState),
    "retry-feed": () => loadFeed(setViewState),
  });
}

attachRootEventDelegation(root);
configureStateDispatcher(renderApp);
renderApp();
