import { createElement, renderToDOM } from "../core/mini-react.js";
import { resetCursor } from "../core/state-store.js";
import { configureStateDispatcher, useState } from "../core/reactive-state.js";
import {
  attachRootEventDelegation,
  updateActionHandlers,
} from "../core/event-delegation.js";

const root = document.getElementById("app");

if (!root) {
  throw new Error('Mount element "#app" was not found');
}

let nextTaskId = 3;

const filters = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

function renderApp() {
  // Hook order must stay the same on every render.
  resetCursor();

  const [tasks, setTasks] = useState([
    { id: 1, title: "Review PR", completed: false },
    { id: 2, title: "Verify AST", completed: false },
  ]);
  const [filter, setFilter] = useState("ALL");

  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - activeCount;
  const visibleTasks = tasks.filter((task) => {
    if (filter === "ACTIVE") return !task.completed;
    if (filter === "COMPLETED") return task.completed;
    return true;
  });

  const appVNode = createElement(
    "main",
    { className: "app-container" },
    createElement(
      "header",
      { className: "app-header" },
      createElement("h1", null, `Tasks (${tasks.length})`),
      createElement(
        "p",
        null,
        `${activeCount} active Â· ${completedCount} completed`
      )
    ),
    createElement(
      "section",
      { className: "filters", "aria-label": "Filter tasks" },
      ...filters.map((option) =>
        createElement(
          "button",
          {
            type: "button",
            className: filter === option.value ? "filter active" : "filter",
            "data-action": "set-filter",
            "data-filter": option.value,
            "aria-pressed": filter === option.value,
          },
          option.label
        )
      )
    ),
    visibleTasks.length > 0
      ? createElement(
          "ul",
          { className: "task-list" },
          ...visibleTasks.map((task) =>
            createElement(
              "li",
              {
                className: task.completed ? "task completed" : "task",
              },
              createElement("span", { className: "task-title" }, task.title),
              createElement(
                "button",
                {
                  type: "button",
                  className: "task-toggle",
                  "data-action": "toggle-task",
                  "data-task-id": task.id,
                  "aria-pressed": task.completed,
                  "aria-label": `${task.completed ? "Reopen" : "Complete"} ${task.title}`,
                },
                task.completed ? "Reopen" : "Complete"
              )
            )
          )
        )
      : createElement("p", { className: "empty-state" }, "No tasks match this filter."),
    createElement(
      "button",
      {
        type: "button",
        className: "add-task",
        "data-action": "add-task",
      },
      "+ Add Task"
    )
  );

  // The existing Ex1 renderer builds DOM nodes; no child gets its own listener.
  root.replaceChildren(renderToDOM(appVNode));

  // Refresh handlers after each render. The root click listener stays unchanged.
  updateActionHandlers({
    "add-task": () => {
      const id = nextTaskId++;
      setTasks((currentTasks) => [
        ...currentTasks,
        { id, title: `Task ${id}`, completed: false },
      ]);
    },
    "set-filter": (_event, button) => {
      setFilter(button.dataset.filter);
    },
    "toggle-task": (_event, button) => {
      const taskId = Number(button.dataset.taskId);
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    },
  });
}

configureStateDispatcher(renderApp);
attachRootEventDelegation(root);
renderApp();

