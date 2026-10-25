<template>
  <section class="reportes-admin">
    <span class="material-symbols-outlined reportes-admin__icon">description</span>
    <h1>Reportes</h1>
    <p>Los reportes administrativos todavía no están disponibles.</p>
    <small>El backend informa que esta funcionalidad aún no fue implementada.</small>
  </section>
</template>

<script>
export default {
  name: "ReportesAdminView",
};
</script>

<style scoped>
.reportes-admin {
  display: grid;
  max-width: 620px;
  margin: 8rem auto;
  padding: 3rem 2rem;
  place-items: center;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 1rem;
  text-align: center;
}

.reportes-admin__icon {
  color: var(--color-accent);
  font-size: 3rem;
}

.reportes-admin h1 {
  margin: 1rem 0 0.5rem;
}

.reportes-admin p,
.reportes-admin small {
  margin: 0;
  color: var(--color-text-muted);
}

.reportes-admin small {
  margin-top: 0.75rem;
}
</style>
