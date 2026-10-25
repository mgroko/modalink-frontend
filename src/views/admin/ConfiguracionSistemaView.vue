<template>
  <div class="configuracion-sistema">
    <header class="configuracion-sistema__header">
      <div>
        <h1>Configuración del sistema</h1>
        <p>Administrá las tareas automáticas que ejecuta ModaLink.</p>
      </div>
    </header>

    <section class="configuracion-sistema__grid" aria-label="Opciones de configuración">
      <RouterLink
        to="/admin/configuracion-scheduler"
        class="configuracion-sistema__card"
      >
        <span class="configuracion-sistema__icon material-symbols-outlined">schedule</span>
        <span class="configuracion-sistema__card-content">
          <strong>Scheduler de deshabilitación</strong>
          <span>
            Configurá la hora en que el sistema reactiva automáticamente las
            cuentas cuya suspensión temporal finalizó.
          </span>
        </span>
        <span class="configuracion-sistema__arrow material-symbols-outlined">chevron_right</span>
      </RouterLink>

      <RouterLink
        to="/admin/configuracion-scheduler/baja"
        class="configuracion-sistema__card"
      >
        <span class="configuracion-sistema__icon material-symbols-outlined">event_available</span>
        <span class="configuracion-sistema__card-content">
          <strong>Scheduler de bajas</strong>
          <span>
            Configurá el horario y el plazo para procesar cuentas y perfiles
            cuya solicitud de baja venció.
          </span>
        </span>
        <span class="configuracion-sistema__arrow material-symbols-outlined">chevron_right</span>
      </RouterLink>
    </section>
  </div>
</template>

<script>
export default {
  name: "ConfiguracionSistemaView",
};
</script>

<style scoped>
.configuracion-sistema {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.configuracion-sistema__header {
  margin-bottom: 1.75rem;
}

.configuracion-sistema__header h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.configuracion-sistema__header p {
  margin: 0.4rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.configuracion-sistema__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.configuracion-sistema__card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 1rem;
  min-height: 170px;
  padding: 1.5rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 1rem;
  box-shadow: 0 0.3rem 1.3rem rgba(35, 33, 52, 0.04);
  text-decoration: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.configuracion-sistema__card:hover,
.configuracion-sistema__card:focus-visible {
  border-color: var(--color-primary-light);
  box-shadow: 0 0.5rem 1.5rem rgba(35, 33, 52, 0.1);
  outline: none;
  transform: translateY(-2px);
}

.configuracion-sistema__icon {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 0.75rem;
  font-size: 1.45rem;
}

.configuracion-sistema__card-content {
  display: grid;
  gap: 0.6rem;
}

.configuracion-sistema__card-content strong {
  font-size: 1rem;
}

.configuracion-sistema__card-content span {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

.configuracion-sistema__arrow {
  color: var(--color-text-muted);
  font-size: 1.3rem;
}

.configuracion-sistema__card:hover .configuracion-sistema__arrow,
.configuracion-sistema__card:focus-visible .configuracion-sistema__arrow {
  color: var(--color-primary);
}

@media (max-width: 720px) {
  .configuracion-sistema__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .configuracion-sistema__card {
    grid-template-columns: auto 1fr;
  }

  .configuracion-sistema__arrow {
    display: none;
  }
}
</style>
