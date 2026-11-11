<template>
  <section class="home-aside">
    <header class="home-aside__cabecera">
      <h2 class="home-aside__titulo">{{ titulo }}</h2>
      <button
        v-if="verTodo"
        type="button"
        class="home-aside__enlace"
        @click="$emit('ver-todo')"
      >
        {{ textoVerTodo }}
      </button>
    </header>

    <div v-if="hayItems" class="home-aside__lista">
      <slot />
    </div>
    <p v-else-if="textoVacio" class="home-aside__vacio">
      {{ textoVacio }}
    </p>
  </section>
</template>

<script>
export default {
  name: "HomeAsideSection",
  props: {
    titulo: {
      type: String,
      required: true,
    },
    hayItems: {
      type: Boolean,
      default: false,
    },
    verTodo: {
      type: Boolean,
      default: true,
    },
    textoVerTodo: {
      type: String,
      default: "Ver todo",
    },
    textoVacio: {
      type: String,
      default: "",
    },
  },
  emits: ["ver-todo"],
};
</script>

<style scoped>
.home-aside {
  display: grid;
  gap: 0.65rem;
}

.home-aside__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.home-aside__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.home-aside__enlace {
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
}

.home-aside__enlace:hover {
  text-decoration: underline;
}

.home-aside__lista {
  display: grid;
  gap: 0.6rem;
}

.home-aside__vacio {
  margin: 0;
  padding: 0.85rem;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  font-size: 0.78rem;
  line-height: 1.45;
}
</style>
