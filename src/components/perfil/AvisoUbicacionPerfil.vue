<template>
  <aside
    class="aviso-ubicacion-perfil"
    role="note"
    aria-label="Aviso para completar la ubicación del perfil"
  >
    <span
      class="aviso-ubicacion-perfil__icono material-symbols-outlined"
      aria-hidden="true"
    >
      location_on
    </span>

    <div class="aviso-ubicacion-perfil__texto">
      <strong class="aviso-ubicacion-perfil__titulo">
        Agregá tu ubicación al perfil
      </strong>
      <p class="aviso-ubicacion-perfil__descripcion">
        Así te encuentran más fácil quienes buscan profesionales de tu zona.
        <RouterLink
          :to="{ name: 'modificar-datos', query: { volver: 'perfil' } }"
          class="aviso-ubicacion-perfil__enlace"
        >
          Completar ubicación
        </RouterLink>
      </p>
    </div>

    <button
      type="button"
      class="aviso-ubicacion-perfil__cerrar"
      aria-label="Cerrar aviso"
      @click="$emit('cerrar')"
    >
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
  </aside>
</template>

<script>
export default {
  name: "AvisoUbicacionPerfil",
  emits: ["cerrar"],
};
</script>

<style scoped>
.aviso-ubicacion-perfil {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: var(--color-chip);
}

.aviso-ubicacion-perfil__icono {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 1.25rem;
}

.aviso-ubicacion-perfil__texto {
  flex: 1 1 auto;
  min-width: 0;
}

.aviso-ubicacion-perfil__titulo {
  display: block;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
}

.aviso-ubicacion-perfil__descripcion {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.aviso-ubicacion-perfil__enlace {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: underline;
}

.aviso-ubicacion-perfil__enlace:hover {
  color: var(--color-primary-dark);
}

.aviso-ubicacion-perfil__cerrar {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.aviso-ubicacion-perfil__cerrar:hover {
  background: var(--color-hover);
  color: var(--color-text);
}

.aviso-ubicacion-perfil__cerrar .material-symbols-outlined {
  font-size: 1.2rem;
}

@media (max-width: 640px) {
  .aviso-ubicacion-perfil {
    align-items: flex-start;
  }
}
</style>
