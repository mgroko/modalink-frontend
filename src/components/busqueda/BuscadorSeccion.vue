<template>
  <section class="buscador-seccion">
    <header class="buscador-seccion__cabecera">
      <h2 class="buscador-seccion__titulo">{{ titulo }}</h2>
      <button
        v-if="verTodos"
        type="button"
        class="buscador-seccion__enlace"
        @click="$emit('ver-todos')"
      >
        {{ textoVerTodos }}
      </button>
    </header>

    <div v-if="hayItems" class="buscador-seccion__grilla">
      <slot />
    </div>
    <p v-else class="buscador-seccion__vacio">{{ textoVacio }}</p>
  </section>
</template>

<script>
/*
 * Sección de la pestaña "Todo" del buscador unificado. Reutiliza el patrón
 * visual de las secciones del Home para no introducir una estructura nueva.
 */
export default {
  name: "BuscadorSeccion",
  props: {
    titulo: {
      type: String,
      required: true,
    },
    hayItems: {
      type: Boolean,
      default: false,
    },
    verTodos: {
      type: Boolean,
      default: false,
    },
    textoVerTodos: {
      type: String,
      default: "Ver todos",
    },
    textoVacio: {
      type: String,
      default: "Sin resultados.",
    },
  },
  emits: ["ver-todos"],
};
</script>

<style scoped>
.buscador-seccion {
  margin-top: 1.5rem;
}

.buscador-seccion:first-of-type {
  margin-top: 0;
}

.buscador-seccion__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.buscador-seccion__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.buscador-seccion__enlace {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
}

.buscador-seccion__enlace:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.buscador-seccion__enlace:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.buscador-seccion__grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.buscador-seccion__vacio {
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
  .buscador-seccion__grilla {
    grid-template-columns: 1fr;
  }
}
</style>
