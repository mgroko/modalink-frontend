<template>
  <div class="calendario-view">
    <div class="calendario-view__tabs">
      <button
        class="calendario-view__tab"
        @click="$router.push({ name: 'dashboard-usuario' })"
      >
        Perfiles
      </button>
      <button
        class="calendario-view__tab calendario-view__tab--active"
      >
        Calendario
      </button>
    </div>

    <CalendarioProfesional mostrar-acciones />
  </div>
</template>

<script>
import CalendarioProfesional from "../../components/calendario/CalendarioProfesional.vue";

export default {
  name: "CalendarioView",
  components: {
    CalendarioProfesional,
  },
};
</script>

<style scoped>
.calendario-view {
  width: 100%;
}

/* Tabs */
.calendario-view__tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.25rem;
}

.calendario-view__tab {
  background: none;
  border: none;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.calendario-view__tab:hover {
  color: var(--color-text);
}

.calendario-view__tab--active {
  color: var(--color-text);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
}
</style>