<template>
  <section class="home-feed-section">
    <header class="home-feed-section__cabecera">
      <h2 class="home-feed-section__titulo">{{ titulo }}</h2>
      <button
        v-if="verTodo"
        type="button"
        class="home-feed-section__enlace"
        @click="$emit('ver-todo')"
      >
        {{ textoVerTodo }}
      </button>
    </header>

    <div v-if="hayItems" class="home-feed-section__grilla">
      <slot />
    </div>
    <p v-else-if="textoVacio" class="home-feed-section__vacio">
      {{ textoVacio }}
    </p>
  </section>
</template>

<script>
export default {
  name: "HomeFeedSection",
  props: {
    titulo: {
      type: String,
      required: true,
    },
    hayItems: {
      type: Boolean,
      default: false,
    },
    textoVacio: {
      type: String,
      default: "",
    },
    verTodo: {
      type: Boolean,
      default: false,
    },
    textoVerTodo: {
      type: String,
      default: "Ver todo",
    },
  },
  emits: ["ver-todo"],
};
</script>

<style scoped>
.home-feed-section {
  margin-top: 1.5rem;
}

.home-feed-section:first-of-type {
  margin-top: 0;
}

.home-feed-section__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.home-feed-section__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.home-feed-section__enlace {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
}

.home-feed-section__enlace:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.home-feed-section__enlace:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.home-feed-section__grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.home-feed-section__vacio {
  margin: 0;
  padding: 1.25rem;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

@media (max-width: 640px) {
  .home-feed-section__grilla {
    grid-template-columns: 1fr;
  }
}
</style>
