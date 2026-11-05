<template>
  <article
    class="invitacion-card"
    role="button"
    tabindex="0"
    :aria-label="`Ver detalle de la invitación a ${invitacion.nombreProyecto}`"
    @click="$emit('abrir', invitacion)"
    @keydown.enter="$emit('abrir', invitacion)"
    @keydown.space.prevent="$emit('abrir', invitacion)"
  >
    <span class="invitacion-card__avatar" aria-hidden="true">
      <img
        v-if="fotoContraparte && !fotoRota"
        :src="fotoContraparte"
        :alt="nombreContraparte"
        @error="fotoRota = true"
      />
      <template v-else>{{ inicialContraparte }}</template>
    </span>

    <div class="invitacion-card__cuerpo">
      <p class="invitacion-card__titulo">
        <template v-if="esRecibida">
          <strong>{{ nombreRemitente }}</strong> te invitó a
          <strong>{{ invitacion.nombreProyecto }}</strong>
        </template>
        <template v-else>
          Invitaste a <strong>{{ nombreDestinatario }}</strong> a
          <strong>{{ invitacion.nombreProyecto }}</strong>
        </template>
      </p>

      <div class="invitacion-card__meta">
        <span
          class="invitacion-card__chip"
          :class="`invitacion-card__chip--${tipoClase}`"
        >
          {{ etiquetaTipoInvitacion(invitacion.tipo) }}
        </span>

        <span
          v-if="mostrarDireccion"
          class="invitacion-card__chip invitacion-card__chip--direccion"
        >
          {{ etiquetaDireccion }}
        </span>

        <span v-if="esActividad && invitacion.nombreActividad">
          Actividad: {{ invitacion.nombreActividad }}
        </span>

        <span class="invitacion-card__fecha">
          Enviada el {{ fechaEnvio }}
        </span>
      </div>

      <p v-if="invitacion.mensaje" class="invitacion-card__mensaje">
        {{ invitacion.mensaje }}
      </p>
    </div>

    <div class="invitacion-card__lateral">
      <EstadoInvitacionBadge :estado="invitacion.estado" />

      <div
        v-if="esPendienteRecibida"
        class="invitacion-card__acciones"
        @click.stop
      >
        <VaButton
          preset="secondary"
          size="small"
          disabled
          :title="textoAccionDeshabilitada"
          @click.stop
        >
          Rechazar
        </VaButton>
        <VaButton
          preset="primary"
          size="small"
          disabled
          :title="textoAccionDeshabilitada"
          @click.stop
        >
          Aceptar
        </VaButton>
      </div>

      <div
        v-else-if="puedeEliminarInvitacion"
        class="invitacion-card__acciones"
        @click.stop
      >
        <VaButton
          preset="secondary"
          color="danger"
          size="small"
          @click.stop="$emit('eliminar', invitacion)"
        >
          Eliminar
        </VaButton>
      </div>

      <div
        v-else-if="puedeVerProyecto"
        class="invitacion-card__acciones"
        @click.stop
      >
        <VaButton
          preset="secondary"
          size="small"
          @click.stop="$emit('ver-proyecto', invitacion)"
        >
          Ver proyecto
        </VaButton>
      </div>
    </div>
  </article>
</template>

<script>
import EstadoInvitacionBadge from "./EstadoInvitacionBadge.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  DIRECCIONES_INVITACION,
  ESTADOS_INVITACION,
  ETIQUETAS_DIRECCION,
  contraparteInvitacion,
  etiquetaTipoInvitacion,
} from "../../utils/invitacionBusquedaConstants.js";
import { TIPOS_INVITACION } from "../../utils/invitacionConstants.js";

export default {
  name: "InvitacionCard",
  components: { EstadoInvitacionBadge },
  props: {
    invitacion: {
      type: Object,
      required: true,
    },
    /** Muestra el chip Recibida/Enviada cuando el tab activo es "Todas". */
    mostrarDireccion: {
      type: Boolean,
      default: false,
    },
    idPerfilActivo: {
      type: [Number, String],
      default: null,
    },
    /** Se activa si un 403 ya ocultó la acción para este ítem. */
    eliminacionBloqueada: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["abrir", "ver-proyecto", "eliminar"],
  data() {
    return {
      fotoRota: false,
    };
  },
  computed: {
    esRecibida() {
      return this.invitacion.direccion === DIRECCIONES_INVITACION.RECIBIDA;
    },
    esActividad() {
      return this.invitacion.tipo === TIPOS_INVITACION.ACTIVIDAD;
    },
    esPendienteRecibida() {
      return (
        this.esRecibida &&
        this.invitacion.estado === ESTADOS_INVITACION.PENDIENTE
      );
    },
    puedeVerProyecto() {
      return this.invitacion.estado === ESTADOS_INVITACION.ACEPTADA;
    },
    puedeEliminarInvitacion() {
      return (
        !this.eliminacionBloqueada &&
        this.invitacion.direccion === DIRECCIONES_INVITACION.ENVIADA &&
        this.invitacion.estado === ESTADOS_INVITACION.PENDIENTE &&
        this.invitacion.puedeEliminar === true
      );
    },
    nombreRemitente() {
      return (
        this.invitacion.remitente?.nombreArtistico || "Un perfil"
      );
    },
    nombreDestinatario() {
      return (
        this.invitacion.destinatario?.nombreArtistico || "un perfil"
      );
    },
    contraparte() {
      return contraparteInvitacion(this.invitacion, this.idPerfilActivo);
    },
    nombreContraparte() {
      return this.contraparte?.nombreArtistico || "Perfil";
    },
    inicialContraparte() {
      return (
        String(this.nombreContraparte).trim().charAt(0).toUpperCase() || "?"
      );
    },
    fotoContraparte() {
      return resolverFotoUrl(this.contraparte?.fotoUrl);
    },
    fechaEnvio() {
      return formatearFechaCorta(this.invitacion.fechaEnvio);
    },
    etiquetaDireccion() {
      return ETIQUETAS_DIRECCION[this.invitacion.direccion] || "";
    },
    tipoClase() {
      return this.esActividad ? "actividad" : "general";
    },
    textoAccionDeshabilitada() {
      return "La gestión de invitaciones estará disponible próximamente (UC-28).";
    },
  },
  watch: {
    "invitacion.idInvitacion"() {
      this.fotoRota = false;
    },
    "contraparte.fotoUrl"() {
      this.fotoRota = false;
    },
  },
  methods: {
    etiquetaTipoInvitacion,
  },
};
</script>

<style scoped>
.invitacion-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.invitacion-card:hover,
.invitacion-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 4px 14px rgba(35, 33, 52, 0.08);
  outline: none;
}

.invitacion-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary, #fff);
  font-size: 0.9rem;
  font-weight: 700;
}

.invitacion-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invitacion-card__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.invitacion-card__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.4;
}

.invitacion-card__titulo strong {
  font-weight: 700;
}

.invitacion-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.55rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.invitacion-card__chip {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.invitacion-card__chip--general {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.invitacion-card__chip--actividad {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.invitacion-card__chip--direccion {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.invitacion-card__fecha {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.invitacion-card__mensaje {
  margin: 0.15rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: 7px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invitacion-card__lateral {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
  min-width: 150px;
}

.invitacion-card__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 760px) {
  .invitacion-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .invitacion-card__lateral {
    grid-column: 2;
    align-items: flex-start;
    min-width: 0;
  }
}
</style>
