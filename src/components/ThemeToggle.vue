<template>
  <div class="theme-toggle" role="group" aria-label="Tema de la interfaz">
    <button
      type="button"
      class="theme-toggle__option"
      :class="{ 'theme-toggle__option--active': !isDark }"
      :aria-pressed="!isDark"
      aria-label="Tema claro"
      title="Tema claro"
      @click="setThemeMode('light')"
    >
      <span class="material-symbols-outlined">light_mode</span>
    </button>
    <button
      type="button"
      class="theme-toggle__option"
      :class="{ 'theme-toggle__option--active': isDark }"
      :aria-pressed="isDark"
      aria-label="Tema oscuro"
      title="Tema oscuro"
      @click="setThemeMode('dark')"
    >
      <span class="material-symbols-outlined">dark_mode</span>
    </button>
  </div>
</template>

<script setup>
import { isDark, setThemeMode } from "../services/themeState";
</script>

<style scoped>
.theme-toggle {
  --tt-bg: var(--color-toggle-bg);
  --tt-border: var(--color-toggle-border);
  --tt-active-bg: var(--color-toggle-active-bg);
  --tt-icon: var(--color-toggle-icon);
  --tt-active-icon: var(--color-toggle-active-icon);
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 4px;
  border: 1px solid var(--tt-border);
  border-radius: 999px;
  background: var(--tt-bg);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.theme-toggle__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--tt-icon);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.theme-toggle__option:hover:not(.theme-toggle__option--active) {
  color: var(--tt-active-icon);
}

.theme-toggle__option--active {
  background: var(--tt-active-bg);
  color: var(--tt-active-icon);
}

.theme-toggle__option .material-symbols-outlined {
  font-size: 1.25rem;
  font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
}
</style>
