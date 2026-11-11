<template>
  <article
    class="proyecto-compacto"
    role="button"
    tabindex="0"
    :aria-label="`Abrir proyecto ${proyecto.nombre}`"
    @click="$emit('abrir', proyecto)"
    @keydown.enter="$emit('abrir', proyecto)"
    @keydown.space.prevent="$emit('abrir', proyecto)"
  >
    <header class="proyecto-compacto__cabecera">
      <h3 class="proyecto-compacto__nombre">{{ proyecto.nombre }}</h3>
      <EstadoProyectoBadge :estado="proyecto.estado" />
    </header>

    <p v-if="proyecto.nombreDirector" class="proyecto-compacto__director">
      <span class="material-symbols-outlined" aria-hidden="true">
        person
      </span>
      Dirige {{ proyecto.nombreDirector }}
    </p>
  </article>
</template>

<script>
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";

export default {
  name: "ProyectoHomeCardCompacto",
  components: { EstadoProyectoBadge },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
  },
  emits: ["abrir"],
};
</script>

<style scoped>
.proyecto-compacto {
  display: grid;
  gap: 0.35rem;
  padding: 0.8rem 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.proyecto-compacto:hover,
.proyecto-compacto:focus-visible {
  border-color: var(--color-primary-light);
  box-shadow: 0 0.35rem 1rem rgba(35, 33, 52, 0.08);
  outline: none;
}

.proyecto-compacto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.proyecto-compacto__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.proyecto-compacto__director {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proyecto-compacto__director .material-symbols-outlined {
  flex: 0 0 auto;
  font-size: 0.9rem;
}
</style>
