<template>
  <div class="home-feed-tabs" role="tablist" aria-label="Filtrar el inicio">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      ref="chips"
      type="button"
      role="tab"
      class="home-feed-tabs__chip"
      :class="{ 'home-feed-tabs__chip--activa': tab.id === activa }"
      :aria-selected="tab.id === activa ? 'true' : 'false'"
      :tabindex="tab.id === activa ? 0 : -1"
      aria-controls="home-feed-panel"
      @click="$emit('cambiar', tab.id)"
      @keydown.right.prevent="mover(index, 1)"
      @keydown.left.prevent="mover(index, -1)"
      @keydown.home.prevent="irA(0)"
      @keydown.end.prevent="irA(tabs.length - 1)"
    >
      <span>{{ tab.label }}</span>
      <template v-if="tab.count > 0">
        <span class="home-feed-tabs__separador" aria-hidden="true">·</span>
        <span class="home-feed-tabs__contador">{{ tab.count }}</span>
      </template>
    </button>
  </div>
</template>

<script>
export default {
  name: "HomeFeedTabs",
  props: {
    tabs: {
      type: Array,
      default: () => [],
    },
    activa: {
      type: String,
      default: "todo",
    },
  },
  emits: ["cambiar"],
  methods: {
    mover(index, delta) {
      if (!this.tabs.length) return;
      const siguiente = (index + delta + this.tabs.length) % this.tabs.length;
      this.irA(siguiente);
    },
    irA(index) {
      const tab = this.tabs[index];
      if (!tab) return;
      this.$emit("cambiar", tab.id);
      this.$nextTick(() => {
        const refs = this.$refs.chips;
        const chip = Array.isArray(refs) ? refs[index] : refs;
        chip?.focus();
      });
    },
  },
};
</script>

<style scoped>
.home-feed-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0 1.25rem;
  padding: 2px 0 4px;
  scrollbar-width: none;
}

.home-feed-tabs::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.home-feed-tabs__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.4rem;
  min-height: 34px;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.home-feed-tabs__chip:hover {
  background: var(--color-surface-soft);
  color: var(--color-text);
}

.home-feed-tabs__chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.home-feed-tabs__chip--activa {
  --chip-start: var(--color-accent-dark);
  --chip-end: var(--color-primary);
  --chip-fg: #ffffff;
  border-color: transparent;
  background: linear-gradient(90deg, var(--chip-start), var(--chip-end));
  color: var(--chip-fg);
  box-shadow: 0 4px 12px rgba(73, 71, 118, 0.18);
}

.home-feed-tabs__chip--activa:hover {
  background: linear-gradient(90deg, var(--chip-start), var(--chip-end));
  color: var(--chip-fg);
  filter: brightness(1.05);
}

:root[data-theme="dark"] .home-feed-tabs__chip--activa {
  --chip-start: var(--color-primary-fill);
  --chip-end: var(--color-primary-dark);
  --chip-fg: #17161f;
  color: #17161f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}

.home-feed-tabs__chip .material-symbols-outlined {
  font-size: 1rem;
  line-height: 1;
}

.home-feed-tabs__separador {
  opacity: 0.65;
}

.home-feed-tabs__contador {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .home-feed-tabs {
    margin-bottom: 1rem;
  }

  .home-feed-tabs__chip {
    font-size: 0.78rem;
  }
}
</style>
