<template>
  <RouterLink :to="to" class="admin-volver">
    <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
    <span>{{ texto }}</span>
  </RouterLink>
</template>

<script>
export default {
  name: "AdminVolver",
  props: {
    /** Ruta de destino: nombre de ruta o path. */
    to: {
      type: [String, Object],
      required: true,
    },
    /** Texto visible, por ejemplo "Volver a configuración". */
    texto: {
      type: String,
      default: "Volver",
    },
  },
};
</script>

<style scoped>
.admin-volver {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  align-self: flex-start;
  margin-bottom: 0.9rem;
  padding: 0;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.admin-volver:hover {
  text-decoration: underline;
}

.admin-volver .material-symbols-outlined {
  font-size: 1rem;
}
</style>
