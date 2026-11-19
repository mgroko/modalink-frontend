<template>
  <div class="reportes-admin-page">
    <AdminVolver
      :to="{ name: 'dashboard-admin' }"
      texto="Volver al dashboard"
    />

    <section class="reportes-admin">
      <span class="material-symbols-outlined reportes-admin__icon">description</span>
      <h1>Reportes</h1>
      <p>Los reportes administrativos todavía no están disponibles.</p>
      <small>El sistema informa que esta funcionalidad aún no fue implementada.</small>
    </section>
  </div>
</template>

<script>
import AdminVolver from "../../components/admin/AdminVolver.vue";

export default {
  name: "ReportesAdminView",
  components: { AdminVolver },
};
</script>

<style scoped>
.reportes-admin-page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.reportes-admin {
  display: grid;
  max-width: 620px;
  margin: 2rem auto 0;
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
  margin: 0;
  color: var(--color-primary);
  font-size: 2.25rem;
  font-weight: 800;
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
