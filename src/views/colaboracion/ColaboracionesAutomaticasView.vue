<template>
  <div class="colaboraciones-automaticas-view">
    <header class="colaboraciones-automaticas-view__cabecera">
      <h1 class="colaboraciones-automaticas-view__titulo">
        Colaboraciones automáticas
      </h1>
      <p class="colaboraciones-automaticas-view__subtitulo">
        Propuestas generadas cuando dos publicaciones comparten una imagen.
        La colaboración se activa solo si ambos dueños confirman.
      </p>
    </header>

    <SolicitudesTabs
      activa="automaticas"
      :invitaciones="invitacionesPendientes"
      :colaboraciones="colaboracionesPendientes"
      :automaticas="colaboracionesAutomaticasPendientes"
      @cambiar="cambiarTipo"
    />

    <ColaboracionesAutomaticasPanel @actualizada="alActualizar" />
  </div>
</template>

<script>
import SolicitudesTabs from "../../components/colaboracion/SolicitudesTabs.vue";
import ColaboracionesAutomaticasPanel from "../../components/colaboracion/ColaboracionesAutomaticasPanel.vue";
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
  name: "ColaboracionesAutomaticasView",
  components: {
    ColaboracionesAutomaticasPanel,
    SolicitudesTabs,
  },
  computed: {
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
      if (tipo === "automaticas") return;

      if (tipo === "colaboraciones") {
        this.$router.push({
          name: "solicitudes",
          query: { tipo: "colaboraciones" },
        });
        return;
      }

      this.$router.push({ name: "solicitudes" });
    },
    alActualizar() {
      this.cargarResumenes();
    },
  },
};
</script>

<style scoped>
.colaboraciones-automaticas-view {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
}

.colaboraciones-automaticas-view__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 2rem;
  font-weight: 800;
}

.colaboraciones-automaticas-view__subtitulo {
  max-width: 760px;
  margin: 0.35rem 0 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>
