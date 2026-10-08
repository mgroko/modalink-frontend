<template>
  <section class="home-section">
    <div class="home-section__encabezado">
      <h2>Proyectos destacados</h2>
    </div>

    <div v-if="proyectos.length" class="home-section__grid">
      <article v-for="proyecto in proyectos" :key="proyecto.idProyecto" class="home-card">
        <h3>{{ proyecto.nombre }}</h3>
        <p v-if="proyecto.descripcion">{{ proyecto.descripcion }}</p>
      </article>
    </div>
    <p v-else class="home-section__vacio">Todavia no hay proyectos destacados para mostrar.</p>
  </section>
</template>

<script>
export default {
  name: "ProyectosSection",
  props: {
    proyectos: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
.home-section {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.home-section__encabezado h2 {
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 1rem;
}

.home-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.home-card {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.home-card h3 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.home-card p,
.home-section__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>
