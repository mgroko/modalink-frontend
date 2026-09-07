<template>
  <section class="home-section">
    <div class="home-section__encabezado">
      <h2>Publicaciones recientes</h2>
    </div>

    <div v-if="publicaciones.length" class="home-section__lista">
      <article v-for="publicacion in publicaciones" :key="publicacion.idPublicacion" class="publicacion">
        <p>{{ publicacion.contenido || publicacion.texto }}</p>
      </article>
    </div>
    <p v-else class="home-section__vacio">Todavia no hay publicaciones recientes.</p>
  </section>
</template>

<script>
export default {
  name: "PublicacionesFeed",
  props: {
    publicaciones: {
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

.home-section__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.home-section__lista {
  display: grid;
  gap: 0.75rem;
}

.publicacion {
  padding: 0.9rem;
  border-bottom: 1px solid #e5e7eb;
}

.publicacion:last-child {
  border-bottom: 0;
}

.publicacion p {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
}
</style>
