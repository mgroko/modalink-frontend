<template>
  <article class="solicitud-conexion-card">
    <AvatarPresencia
      :nombre="nombreArtistico"
      :foto-url="perfil?.fotoUrl"
      :en-linea="enLinea"
      :tamano="56"
    />

    <div class="solicitud-conexion-card__contenido">
      <div class="solicitud-conexion-card__encabezado">
        <button
          type="button"
          class="solicitud-conexion-card__nombre"
          @click="$emit('ver-perfil', perfil)"
        >
          {{ nombreArtistico }}
        </button>
        <span class="solicitud-conexion-card__direccion">
          {{ direccion }}
        </span>
        <span
          class="solicitud-conexion-card__estado"
          :class="claseEstado"
        >
          {{ estado }}
        </span>
      </div>

      <p class="solicitud-conexion-card__profesion">{{ profesion }}</p>
      <p v-if="nombreReal" class="solicitud-conexion-card__nombre-real">
        {{ nombreReal }}
      </p>
      <div class="solicitud-conexion-card__presencia">
        <IndicadorPresencia :en-linea="enLinea" />
      </div>
      <p class="solicitud-conexion-card__fecha">
        <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
        {{ fecha }}
      </p>
      <p v-if="fechaRespuesta" class="solicitud-conexion-card__fecha">
        <span class="material-symbols-outlined" aria-hidden="true">event_available</span>
        Respondida el {{ fechaRespuesta }}
      </p>
    </div>

    <div class="solicitud-conexion-card__acciones">
      <VaButton
        v-if="solicitud?.puedeCancelar"
        preset="secondary"
        color="danger"
        size="small"
        icon="mso-close"
        :loading="cancelando"
        :disabled="cancelando"
        @click="$emit('cancelar', solicitud)"
      >
        Cancelar solicitud
      </VaButton>

      <VaButton
        v-if="solicitud?.puedeRechazar"
        preset="secondary"
        color="danger"
        size="small"
        icon="mso-close"
        :loading="procesando && accionProcesando === 'rechazar'"
        :disabled="procesando"
        @click="$emit('rechazar', solicitud)"
      >
        Rechazar
      </VaButton>

      <VaButton
        v-if="solicitud?.puedeAceptar"
        color="#5CA4A9"
        size="small"
        icon="mso-check"
        :loading="procesando && accionProcesando === 'aceptar'"
        :disabled="procesando"
        @click="$emit('aceptar', solicitud)"
      >
        Aceptar
      </VaButton>
    </div>
  </article>
</template>

<script>
import AvatarPresencia from "./AvatarPresencia.vue";
import IndicadorPresencia from "./IndicadorPresencia.vue";
import {
  claseEstadoSolicitud,
  etiquetaDireccion,
  etiquetaEstado,
} from "../../utils/solicitudesConexionConstants.js";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "SolicitudConexionCard",
  components: {
    AvatarPresencia,
    IndicadorPresencia,
  },
  props: {
    solicitud: {
      type: Object,
      required: true,
    },
    enLinea: {
      type: Boolean,
      default: false,
    },
    cancelando: {
      type: Boolean,
      default: false,
    },
    procesando: {
      type: Boolean,
      default: false,
    },
    accionProcesando: {
      type: String,
      default: "",
    },
  },
  emits: ["cancelar", "aceptar", "rechazar", "ver-perfil"],
  computed: {
    perfil() {
      return this.solicitud?.perfil || null;
    },
    nombreArtistico() {
      return this.perfil?.nombreArtistico || "Perfil";
    },
    nombreReal() {
      const nombre = String(this.perfil?.nombre || "").trim();
      const apellido = String(this.perfil?.apellido || "").trim();
      return [nombre, apellido].filter(Boolean).join(" ");
    },
    profesion() {
      return this.perfil?.nombreProfesion || "Profesión";
    },
    direccion() {
      return etiquetaDireccion(this.solicitud?.direccion);
    },
    estado() {
      return etiquetaEstado(this.solicitud?.estado);
    },
    claseEstado() {
      return claseEstadoSolicitud(this.solicitud?.estado);
    },
    fecha() {
      return formatearFecha(this.solicitud?.fechaEnvio);
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
.solicitud-conexion-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.solicitud-conexion-card__contenido {
  flex: 1 1 220px;
  min-width: 0;
}

.solicitud-conexion-card__encabezado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.solicitud-conexion-card__nombre {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.solicitud-conexion-card__nombre:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.solicitud-conexion-card__direccion {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.solicitud-conexion-card__estado {
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
}

.solicitud-badge--pendiente {
  background: var(--color-chip);
  color: var(--color-primary);
}

.solicitud-badge--aceptada {
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.solicitud-badge--rechazada {
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.solicitud-conexion-card__profesion,
.solicitud-conexion-card__nombre-real,
.solicitud-conexion-card__fecha {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.4;
}

.solicitud-conexion-card__nombre-real {
  font-size: 0.78rem;
}

.solicitud-conexion-card__presencia {
  display: flex;
  width: fit-content;
  margin-top: 0.3rem;
}

.solicitud-conexion-card__fecha {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.35rem;
  font-size: 0.75rem;
}

.solicitud-conexion-card__fecha .material-symbols-outlined {
  font-size: 0.95rem;
}

.solicitud-conexion-card__acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
}

@media (max-width: 640px) {
  .solicitud-conexion-card__acciones {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
}
</style>
