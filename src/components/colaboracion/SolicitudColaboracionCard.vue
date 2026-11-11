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

      <p class="solicitud-colaboracion-card__texto">
        {{ textoSolicitud }}
      </p>

      <p
        v-if="solicitud.fechaEnvio"
        class="solicitud-colaboracion-card__meta"
      >
        Enviada el {{ fechaEnvio }}
      </p>
      <p v-if="fechaRespuesta" class="solicitud-colaboracion-card__meta">
        Respondida el {{ fechaRespuesta }}
      </p>
    </div>

    <div class="solicitud-colaboracion-card__acciones">
      <template v-if="solicitud.puedeRechazar || solicitud.puedeAceptar">
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
      </template>

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
    textoSolicitud() {
      if (this.esRecibida) {
        const profesion =
          this.solicitud?.destinatario?.profesion || "profesional";
        return `${this.nombreContraparte} te acreditó como ${profesion} en esta publicación.`;
      }
      return `Le enviaste una solicitud a ${this.nombreContraparte} para colaborar en esta publicación.`;
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
  grid-template-columns: 116px minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.solicitud-colaboracion-card__portada {
  display: grid;
  width: 116px;
  height: 96px;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-subtle);
  background: var(--color-surface-muted);
  border-radius: 8px;
}

.solicitud-colaboracion-card__portada img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.solicitud-colaboracion-card__cuerpo {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.solicitud-colaboracion-card__cabecera {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.solicitud-colaboracion-card__titulo {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.solicitud-colaboracion-card__estado {
  padding: 0.12rem 0.5rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
}

.solicitud-colaboracion-card__texto {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.solicitud-colaboracion-card__meta {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.73rem;
}

.solicitud-colaboracion-card__acciones {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
  min-width: 112px;
}

.solicitud-colaboracion-card__ver {
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

@media (max-width: 680px) {
  .solicitud-colaboracion-card {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .solicitud-colaboracion-card__portada {
    width: 80px;
    height: 80px;
  }

  .solicitud-colaboracion-card__acciones {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
