<template>
  <div class="solicitudes-view">
    <header class="solicitudes-view__cabecera">
      <h1 class="solicitudes-view__titulo">Solicitudes</h1>
      <p class="solicitudes-view__subtitulo">
        Gestioná las invitaciones a proyectos y las solicitudes de colaboración
        en tus publicaciones.
      </p>
    </header>

    <div
      class="solicitudes-view__tabs"
      role="tablist"
      aria-label="Solicitudes"
    >
      <button
        type="button"
        class="solicitudes-view__tab"
        :class="{
          'solicitudes-view__tab--activa': tipoActual === 'invitaciones',
        }"
        role="tab"
        :aria-selected="tipoActual === 'invitaciones' ? 'true' : 'false'"
        @click="cambiarTipo('invitaciones')"
      >
        Invitaciones
        <span class="solicitudes-view__contador">
          {{ invitacionesPendientes }}
        </span>
      </button>
      <button
        type="button"
        class="solicitudes-view__tab"
        :class="{
          'solicitudes-view__tab--activa': tipoActual === 'colaboraciones',
        }"
        role="tab"
        :aria-selected="tipoActual === 'colaboraciones' ? 'true' : 'false'"
        @click="cambiarTipo('colaboraciones')"
      >
        Colaboraciones
        <span class="solicitudes-view__contador">
          {{ colaboracionesPendientes }}
        </span>
      </button>
    </div>

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

export default {
  name: "SolicitudesView",
  components: {
    InvitacionesView,
    SolicitudesColaboracionPanel,
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
  },
  mounted() {
    this.cargarResumenes();
  },
  methods: {
    cargarResumenes() {
      cargarResumenInvitaciones(idPerfilActivo());
      cargarResumenReemplazos(idPerfilActivo());
      cargarResumenSolicitudesColaboracion();
    },
    cambiarTipo(tipo) {
      if (tipo === this.tipoActual) return;

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

.solicitudes-view__tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  margin-bottom: 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.solicitudes-view__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.9rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.solicitudes-view__tab--activa {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.solicitudes-view__contador {
  display: inline-flex;
  min-width: 1.2rem;
  height: 1.2rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border-radius: 999px;
  font-size: 0.65rem;
}

.solicitudes-view__tab--activa .solicitudes-view__contador {
  color: var(--color-primary);
  background: var(--color-on-primary);
}
</style>
