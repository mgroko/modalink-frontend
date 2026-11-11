<template>
  <article class="solicitud-colaboracion-card">
    <div class="solicitud-colaboracion-card__portada">
      <img
        v-if="portada"
        :src="portada"
        :alt="publicacion?.titulo || 'Publicación'"
      />
      <span v-else class="material-symbols-outlined" aria-hidden="true">
        image
      </span>
    </div>

    <div class="solicitud-colaboracion-card__cuerpo">
      <div class="solicitud-colaboracion-card__cabecera">
        <strong class="solicitud-colaboracion-card__titulo">
          {{ publicacion?.titulo || "Publicación" }}
        </strong>
        <span
          class="solicitud-colaboracion-card__estado"
          :style="estiloEstado"
        >
          {{ etiquetaEstado }}
        </span>
      </div>

      <p class="solicitud-colaboracion-card__credito">
        <span
          class="solicitud-colaboracion-card__avatar"
          aria-hidden="true"
        >
          <img
            v-if="fotoContraparte"
            :src="fotoContraparte"
            :alt="nombreContraparte"
          />
          <template v-else>{{ inicialContraparte }}</template>
        </span>

        <template v-if="esRecibida">
          <strong>{{ nombreContraparte }}</strong> se acreditó como
        </template>
        <template v-else>
          Le enviaste una solicitud a
          <strong>{{ nombreContraparte }}</strong> para colaborar como
        </template>

        <span class="solicitud-colaboracion-card__rol">
          {{ profesionContraparte }}
        </span>
        <span>en esta publicación.</span>
      </p>

      <p
        v-if="solicitud.fechaEnvio"
        class="solicitud-colaboracion-card__meta"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          calendar_today
        </span>
        Enviada el {{ fechaEnvio }}
      </p>
      <p v-if="fechaRespuesta" class="solicitud-colaboracion-card__meta">
        <span class="material-symbols-outlined" aria-hidden="true">
          event_available
        </span>
        Respondida el {{ fechaRespuesta }}
      </p>
    </div>

    <div class="solicitud-colaboracion-card__acciones">
      <VaButton
        v-if="solicitud.puedeAceptar"
        color="primary"
        size="small"
        :loading="procesando && accion === 'aceptar'"
        :disabled="procesando"
        @click="$emit('aceptar', solicitud)"
      >
        Aceptar
      </VaButton>
      <VaButton
        v-if="solicitud.puedeRechazar"
        preset="secondary"
        size="small"
        :loading="procesando && accion === 'rechazar'"
        :disabled="procesando"
        @click="$emit('rechazar', solicitud)"
      >
        Rechazar
      </VaButton>

      <button
        type="button"
        class="solicitud-colaboracion-card__ver"
        @click="$emit('ver-publicacion', solicitud)"
      >
        Ver publicación
      </button>
    </div>
  </article>
</template>

<script>
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  COLORES_ESTADO_SOLICITUD_COLABORACION,
  DIRECCIONES_SOLICITUD_COLABORACION,
  ESTADOS_SOLICITUD_COLABORACION,
  ETIQUETAS_ESTADO_SOLICITUD_COLABORACION,
  normalizarEstadoSolicitudColaboracion,
} from "../../utils/solicitudesColaboracionConstants.js";

export default {
  name: "SolicitudColaboracionCard",
  props: {
    solicitud: {
      type: Object,
      required: true,
    },
    procesando: {
      type: Boolean,
      default: false,
    },
    accion: {
      type: String,
      default: "",
    },
  },
  emits: ["aceptar", "rechazar", "ver-publicacion"],
  computed: {
    publicacion() {
      return this.solicitud?.publicacion || null;
    },
    portada() {
      return resolverFotoUrl(this.publicacion?.portadaUrl);
    },
    estado() {
      return (
        normalizarEstadoSolicitudColaboracion(this.solicitud?.estado) ||
        this.solicitud?.estado
      );
    },
    etiquetaEstado() {
      return (
        ETIQUETAS_ESTADO_SOLICITUD_COLABORACION[this.estado] ||
        this.estado ||
        ""
      );
    },
    estiloEstado() {
      const colores =
        COLORES_ESTADO_SOLICITUD_COLABORACION[this.estado] ||
        COLORES_ESTADO_SOLICITUD_COLABORACION[
          ESTADOS_SOLICITUD_COLABORACION.PENDIENTE
        ];
      return {
        color: colores.texto,
        backgroundColor: colores.fondo,
        borderColor: colores.borde,
      };
    },
    esRecibida() {
      return (
        this.solicitud?.direccion ===
        DIRECCIONES_SOLICITUD_COLABORACION.RECIBIDA
      );
    },
    contraparte() {
      return this.esRecibida
        ? this.solicitud?.remitente
        : this.solicitud?.destinatario;
    },
    nombreContraparte() {
      return (
        this.contraparte?.nombreArtistico ||
        this.solicitud?.remitente?.nombreArtistico ||
        "El perfil"
      );
    },
    profesionContraparte() {
      return this.contraparte?.profesion || "profesional";
    },
    fotoContraparte() {
      return resolverFotoUrl(this.contraparte?.fotoUrl);
    },
    inicialContraparte() {
      return (
        String(this.nombreContraparte).trim().charAt(0).toUpperCase() || "?"
      );
    },
    fechaEnvio() {
      return formatearFechaCorta(this.solicitud?.fechaEnvio);
    },
    fechaRespuesta() {
      return this.solicitud?.fechaRespuesta
        ? formatearFechaCorta(this.solicitud.fechaRespuesta)
        : "";
    },
  },
};
</script>

<style scoped>
.solicitud-colaboracion-card {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) minmax(150px, 180px);
  align-items: center;
  gap: 1.1rem;
  padding: 1rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(35, 33, 52, 0.03);
}

.solicitud-colaboracion-card__portada {
  display: grid;
  width: 140px;
  height: 110px;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-subtle);
  background: var(--color-chip);
  border-radius: 10px;
}

.solicitud-colaboracion-card__portada img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.solicitud-colaboracion-card__cuerpo {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.solicitud-colaboracion-card__cabecera {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.solicitud-colaboracion-card__titulo {
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
}

.solicitud-colaboracion-card__estado {
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.solicitud-colaboracion-card__credito {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.solicitud-colaboracion-card__credito strong {
  color: var(--color-text);
  font-weight: 700;
}

.solicitud-colaboracion-card__avatar {
  display: inline-grid;
  width: 1.45rem;
  height: 1.45rem;
  flex: 0 0 1.45rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.58rem;
  font-weight: 700;
}

.solicitud-colaboracion-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.solicitud-colaboracion-card__rol {
  display: inline-flex;
  align-items: center;
  padding: 0.08rem 0.45rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.solicitud-colaboracion-card__meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.solicitud-colaboracion-card__meta .material-symbols-outlined {
  font-size: 0.9rem;
  color: var(--color-text-subtle);
}

.solicitud-colaboracion-card__acciones {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.45rem;
}

.solicitud-colaboracion-card__ver {
  align-self: center;
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: 760px) {
  .solicitud-colaboracion-card {
    grid-template-columns: 90px minmax(0, 1fr);
  }

  .solicitud-colaboracion-card__portada {
    width: 90px;
    height: 90px;
  }

  .solicitud-colaboracion-card__acciones {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .solicitud-colaboracion-card__ver {
    margin-left: auto;
  }
}

@media (max-width: 520px) {
  .solicitud-colaboracion-card {
    grid-template-columns: 1fr;
  }

  .solicitud-colaboracion-card__portada {
    width: 100%;
    height: 160px;
  }
}
</style>
