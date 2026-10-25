import { computed, reactive } from "vue";

const STORAGE_KEY = "modalink-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const MODES = ["light", "dark"];

function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function getStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (MODES.includes(stored)) return stored;
  } catch {
  }
  return getSystemTheme();
}

export const themeState = reactive({
  mode: getStoredMode(),
});

export const resolvedTheme = computed(() => themeState.mode);

export const isDark = computed(() => themeState.mode === "dark");

function persistMode() {
  try {
    localStorage.setItem(STORAGE_KEY, themeState.mode);
  } catch {
  }
}

export function applyDomTheme() {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolvedTheme.value);
}

export function setThemeMode(mode) {
  if (!MODES.includes(mode)) return;
  themeState.mode = mode;
  persistMode();
  applyDomTheme();
}

export function toggleTheme() {
  setThemeMode(isDark.value ? "light" : "dark");
}

export function initTheme() {
  applyDomTheme();
}
