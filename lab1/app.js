/* FILE: app.js */

const THEME_KEY = "theme";

const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const stateAnnouncement = document.getElementById("state-announcement");
const stateStack = document.querySelector(".state-stack");

const states = {
    loading: document.getElementById("loading-state"),
    live: document.getElementById("live-state"),
    empty: document.getElementById("empty-state"),
    error: document.getElementById("error-state")
};

function getStoredTheme() {
    try {
        const storedTheme = localStorage.getItem(THEME_KEY);

        return storedTheme === "dark" || storedTheme === "light"
            ? storedTheme
            : "light";
    } catch {
        return "light";
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Persistence is unavailable; theme still changes for the current session.
    }
}

function updateThemeButton(theme) {
    const darkModeEnabled = theme === "dark";

    themeToggle.setAttribute(
        "aria-pressed",
        String(darkModeEnabled)
    );

    themeToggle.setAttribute(
        "aria-label",
        darkModeEnabled
            ? "Switch to light theme"
            : "Switch to dark theme"
    );

    themeToggle.textContent =
        darkModeEnabled
            ? "Light mode"
            : "Dark mode";
}

function applyTheme(theme) {
    root.dataset.theme = theme;
    updateThemeButton(theme);
}

function toggleTheme() {
    const currentTheme = root.dataset.theme === "dark"
        ? "dark"
        : "light";

    const nextTheme = currentTheme === "dark"
        ? "light"
        : "dark";

    applyTheme(nextTheme);
    saveTheme(nextTheme);
}

function announceState(state) {
    const messages = {
        loading: "Loading portfolio data.",
        live: "Portfolio data loaded successfully.",
        empty: "No portfolio data found.",
        error: "Unable to load portfolio data."
    };

    stateAnnouncement.textContent = messages[state];
}

function renderState(nextState) {
    if (!states[nextState]) {
        return;
    }

    Object.entries(states).forEach(([stateName, stateElement]) => {
        stateElement.hidden = stateName !== nextState;
    });

    const isLoading = nextState === "loading";

    stateStack.setAttribute(
        "aria-busy",
        String(isLoading)
    );

    announceState(nextState);
}

function attachStateControls() {
    document
        .querySelectorAll("[data-state-target]")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const targetState = button.dataset.stateTarget;

                if (!states[targetState]) {
                    return;
                }

                renderState(targetState);
            });
        });
}

function initialiseTheme() {
    const initialTheme = getStoredTheme();

    applyTheme(initialTheme);

    themeToggle.addEventListener("click", toggleTheme);
}

function simulateDataFetch() {
    renderState("loading");

    window.setTimeout(() => {
        renderState("live");
    }, 600);
}

function initialiseResilientStateMachine() {
    attachStateControls();

    const retryButton = document.getElementById("retry-button");

    retryButton.addEventListener("click", simulateDataFetch);

    simulateDataFetch();
}

document.addEventListener("DOMContentLoaded", () => {
    initialiseTheme();
    initialiseResilientStateMachine();
});