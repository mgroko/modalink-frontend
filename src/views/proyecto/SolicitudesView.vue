<template>
  <div class="solicitudes-view">
    <header class="solicitudes-view__cabecera">
      <h1 class="solicitudes-view__titulo">Solicitudes</h1>
      <p class="solicitudes-view__subtitulo">
        Gestioná las invitaciones a proyectos y las solicitudes de colaboración
        en tus publicaciones.
      </p>
    </header>

    <SolicitudesTabs
      :activa="tipoActual"
      :invitaciones="invitacionesPendientes"
      :colaboraciones="colaboracionesPendientes"
      :automaticas="colaboracionesAutomaticasPendientes"
      @cambiar="cambiarTipo"
    />

    <InvitacionesView v-if="tipoActual === 'invitaciones'" embebido />

    <SolicitudesColaboracionPanel
      v-else
      @actualizada="alActualizarColaboraciones"
    />
  </div>
</template>

<script>
import InvitacionesView from "./InvitacionesView.vue";
import SolicitudesColaboracionPanel from "../../components/colaboracion/SolicitudesColaboracionPanel.vue";
import SolicitudesTabs from "../../components/colaboracion/SolicitudesTabs.vue";
import { idPerfilActivo } from "../../services/authState";
import {
  state as invitacionState,
  cargarResumenInvitaciones,
} from "../../services/invitacionState";
import {
  state as reemplazoState,
  cargarResumenReemplazos,
} from "../../services/reemplazoState";
import {
  state as solicitudColaboracionState,
  cargarResumenSolicitudesColaboracion,
} from "../../services/solicitudColaboracionState";
import {
  state as colaboracionAutomaticaState,
  cargarResumenColaboracionesAutomaticas,
} from "../../services/colaboracionAutomaticaState";

export default {
  name: "SolicitudesView",
  components: {
    InvitacionesView,
    SolicitudesColaboracionPanel,
    SolicitudesTabs,
  },
  computed: {
    tipoActual() {
      return this.$route.query.tipo === "colaboraciones"
        ? "colaboraciones"
        : "invitaciones";
    },
    invitacionesPendientes() {
      return (
        (invitacionState.pendientesRecibidas || 0) +
        (reemplazoState.pendientes || 0)
      );
    },
    colaboracionesPendientes() {
      return solicitudColaboracionState.pendientesRecibidas || 0;
    },
    colaboracionesAutomaticasPendientes() {
      return colaboracionAutomaticaState.pendientes || 0;
    },
  },
  mounted() {
    this.cargarResumenes();
  },
  methods: {
    cargarResumenes() {
      cargarResumenInvitaciones(idPerfilActivo());
      cargarResumenReemplazos(idPerfilActivo());
      cargarResumenSolicitudesColaboracion();
      cargarResumenColaboracionesAutomaticas();
    },
    cambiarTipo(tipo) {
      if (tipo === this.tipoActual) return;

      if (tipo === "automaticas") {
        this.$router.push({ name: "colaboraciones-automaticas" }).catch(() => {});
        return;
      }

      const query = { ...this.$route.query };
      if (tipo === "colaboraciones") query.tipo = "colaboraciones";
      else delete query.tipo;

      this.$router.replace({ name: "solicitudes", query }).catch(() => {});
    },
    alActualizarColaboraciones() {
      this.cargarResumenes();
    },
  },
};
</script>

<style scoped>
.solicitudes-view {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
}

.solicitudes-view__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 2rem;
  font-weight: 800;
}

.solicitudes-view__subtitulo {
  margin: 0.35rem 0 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

</style>
