<template>
  <div class="dashboard-admin">
    <section class="dashboard-admin__encabezado">
      <h1>Panel de administración</h1>
      <p class="dashboard-admin__subtitulo">
        Bienvenido/a, {{ usuario?.nombre || 'Administrador' }}.
      </p>
    </section>
  </div>
</template>

<script>
import { state } from "../../services/authState";

export default {
  name: "DashboardAdminView",
  computed: {
    usuario() {
      return state.usuario;
    },
  },
};
</script>

<style scoped>
.dashboard-admin {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.dashboard-admin__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff512f 0%, #b865a4 50%, #240b36 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dashboard-admin__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: #6a7385;
}
</style>
