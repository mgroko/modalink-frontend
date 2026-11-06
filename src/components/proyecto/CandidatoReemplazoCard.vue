<template>
  <article class="candidato-reemplazo">
    <header class="candidato-reemplazo__cabecera">
      <span class="candidato-reemplazo__avatar" aria-hidden="true">
        <img
          v-if="fotoMostrar"
          :src="fotoMostrar"
          :alt="candidato.nombreArtistico || 'Candidato'"
          @error="fotoRota = true"
        />
        <template v-else>{{ iniciales }}</template>
      </span>

      <div class="candidato-reemplazo__identidad">
        <p class="candidato-reemplazo__nombre">
          {{ candidato.nombreArtistico || "Perfil" }}
          <span v-if="candidato.alternativo" class="candidato-reemplazo__chip">
            Alternativo
          </span>
        </p>
        <p class="candidato-reemplazo__secundario">
          <span v-if="nombreCompleto">{{ nombreCompleto }}</span>
          <span v-if="candidato.profesion">{{ candidato.profesion }}</span>
        </p>
      </div>

      <span
        class="candidato-reemplazo__estado"
        :class="`candidato-reemplazo__estado--${tonoEstado}`"
      >
        {{ etiquetaEstado }}
      </span>
    </header>

    <div class="candidato-reemplazo__meta">
      <span v-if="ubicacion" class="candidato-reemplazo__dato">
        {{ ubicacion }}
      </span>
      <span class="candidato-reemplazo__dato">
        Concordancia: {{ puntaje }}
      </span>
      <span
        v-if="candidato.nivelUbicacion"
        class="candidato-reemplazo__dato"
      >
        {{ etiquetaNivelUbicacion(candidato.nivelUbicacion) }}
      </span>
      <span
        v-if="mostrarDisponibilidad"
        class="candidato-reemplazo__dato"
        :class="{
          'candidato-reemplazo__dato--alerta':
            candidato.tipoDisponibilidad ===
            TIPOS_DISPONIBILIDAD_REEMPLAZO.CON_REPROGRAMACION,
        }"
      >
        {{ etiquetaDisponibilidad(candidato.tipoDisponibilidad) }}
      </span>
      <span v-if="fechaInvitacion" class="candidato-reemplazo__dato">
        Invitado: {{ fechaInvitacion }}
      </span>
      <span v-if="fechaRespuesta" class="candidato-reemplazo__dato">
        Respondió: {{ fechaRespuesta }}
      </span>
      <span v-if="fechaDecision" class="candidato-reemplazo__dato">
        Decisión: {{ fechaDecision }}
      </span>
    </div>

    <p v-if="rangoPropuesto" class="candidato-reemplazo__horario">
      Horario propuesto: {{ rangoPropuesto }}
    </p>

    <div
      v-if="(candidato.habilidades || []).length"
      class="candidato-reemplazo__bloque"
    >
      <span class="candidato-reemplazo__label">Habilidades</span>
      <div class="candidato-reemplazo__chips">
        <span
          v-for="habilidad in candidato.habilidades"
          :key="habilidad"
          class="candidato-reemplazo__chip-dato"
        >
          {{ habilidad }}
        </span>
      </div>
    </div>

    <div
      v-if="(candidato.caracteristicas || []).length"
      class="candidato-reemplazo__bloque"
    >
      <span class="candidato-reemplazo__label">Características</span>
      <div class="candidato-reemplazo__chips">
        <span
          v-for="caracteristica in candidato.caracteristicas"
          :key="caracteristica.idCaracteristica ?? caracteristica.codigo"
          class="candidato-reemplazo__chip-dato"
        >
          {{ etiquetaCaracteristicaReemplazo(caracteristica) }}:
          {{ valorCaracteristicaReemplazo(caracteristica) }}
        </span>
      </div>
    </div>

    <div v-if="faltantes.length" class="candidato-reemplazo__faltantes">
      <span class="candidato-reemplazo__label">Faltantes</span>
      <ul>
        <li v-for="faltante in faltantes" :key="faltante">{{ faltante }}</li>
      </ul>
    </div>

    <p v-if="candidato.motivoDecision" class="candidato-reemplazo__motivo">
      Motivo de la decisión: {{ candidato.motivoDecision }}
    </p>

    <div
      v-if="mostrarAccionesDecision"
      class="candidato-reemplazo__acciones"
    >
      <VaButton
        preset="secondary"
        color="danger"
        size="small"
        :disabled="procesando"
        @click="$emit('rechazar', candidato)"
      >
        Rechazar incorporación
      </VaButton>
      <VaButton
        preset="primary"
        size="small"
        :disabled="procesando"
        @click="$emit('aprobar', candidato)"
      >
        Aprobar incorporación
      </VaButton>
    </div>
  </article>
</template>

<script>
import { formatearFecha } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  TIPOS_DISPONIBILIDAD_REEMPLAZO,
  etiquetaCaracteristicaReemplazo,
  etiquetaDisponibilidad,
  etiquetaEstadoCandidatoReemplazo,
  etiquetaNivelUbicacion,
  formatearPuntajeReemplazo,
  tonoEstadoCandidatoReemplazo,
  valorCaracteristicaReemplazo,
} from "../../utils/reemplazoConstants.js";

export default {
  name: "CandidatoReemplazoCard",
  props: {
    candidato: {
      type: Object,
      required: true,
    },
    mostrarAccionesDecision: {
      type: Boolean,
      default: false,
    },
    procesando: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["aprobar", "rechazar"],
  data() {
    return {
      TIPOS_DISPONIBILIDAD_REEMPLAZO,
      fotoRota: false,
    };
  },
  computed: {
    fotoMostrar() {
      if (this.fotoRota) return null;
      return resolverFotoUrl(this.candidato?.fotoUrl);
    },
    iniciales() {
      const nombre = String(this.candidato?.nombreArtistico || "").trim();
      if (!nombre) return "?";
      return nombre
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
    nombreCompleto() {
      return [this.candidato?.nombre, this.candidato?.apellido]
        .filter(Boolean)
        .join(" ");
    },
    ubicacion() {
      const ciudad = this.candidato?.ciudad?.nombre;
      const provincia = this.candidato?.ciudad?.provincia?.nombre;
      if (ciudad && provincia) return `${ciudad}, ${provincia}`;
      return ciudad || provincia || "";
    },
    puntaje() {
      return formatearPuntajeReemplazo(this.candidato?.puntaje);
    },
    etiquetaEstado() {
      return etiquetaEstadoCandidatoReemplazo(this.candidato?.estado);
    },
    tonoEstado() {
      return tonoEstadoCandidatoReemplazo(this.candidato?.estado);
    },
    mostrarDisponibilidad() {
      return (
        this.candidato?.tipoDisponibilidad &&
        this.candidato.tipoDisponibilidad !==
          TIPOS_DISPONIBILIDAD_REEMPLAZO.NO_APLICA
      );
    },
    rangoPropuesto() {
      if (!this.candidato?.inicioPropuesto) return "";
      if (!this.candidato?.finPropuesto) {
        return formatearFecha(this.candidato.inicioPropuesto);
      }
      return `${formatearFecha(this.candidato.inicioPropuesto)} – ${formatearFecha(
        this.candidato.finPropuesto
      )}`;
    },
    fechaInvitacion() {
      return this.candidato?.fechaInvitacion
        ? formatearFecha(this.candidato.fechaInvitacion)
        : "";
    },
    fechaRespuesta() {
      return this.candidato?.fechaRespuesta
        ? formatearFecha(this.candidato.fechaRespuesta)
        : "";
    },
    fechaDecision() {
      return this.candidato?.fechaDecision
        ? formatearFecha(this.candidato.fechaDecision)
        : "";
    },
    faltantes() {
      return Array.isArray(this.candidato?.faltantes)
        ? this.candidato.faltantes.filter(Boolean)
        : [];
    },
  },
  watch: {
    "candidato.idCandidato"() {
      this.fotoRota = false;
    },
    "candidato.fotoUrl"() {
      this.fotoRota = false;
    },
  },
  methods: {
    etiquetaCaracteristicaReemplazo,
    etiquetaDisponibilidad,
    etiquetaNivelUbicacion,
    valorCaracteristicaReemplazo,
  },
};
</script>

<style scoped>
.candidato-reemplazo {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.candidato-reemplazo__cabecera {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.candidato-reemplazo__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary, #fff);
  font-size: 0.8rem;
  font-weight: 700;
}

.candidato-reemplazo__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.candidato-reemplazo__identidad {
  flex: 1 1 auto;
  min-width: 0;
}

.candidato-reemplazo__nombre {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.candidato-reemplazo__secundario {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.7rem;
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.candidato-reemplazo__estado {
  flex: 0 0 auto;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.6;
  white-space: nowrap;
}

.candidato-reemplazo__estado--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.candidato-reemplazo__estado--info {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.candidato-reemplazo__estado--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.candidato-reemplazo__estado--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.candidato-reemplazo__estado--neutral {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.candidato-reemplazo__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.8rem;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.candidato-reemplazo__dato--alerta {
  color: var(--color-warning-text);
  font-weight: 600;
}

.candidato-reemplazo__horario {
  margin: 0;
  color: var(--color-text);
  font-size: 0.76rem;
}

.candidato-reemplazo__bloque,
.candidato-reemplazo__faltantes {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.candidato-reemplazo__label {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.candidato-reemplazo__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.candidato-reemplazo__chip {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.62rem;
  font-weight: 700;
}

.candidato-reemplazo__chip-dato {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-text-muted);
  font-size: 0.68rem;
  line-height: 1.5;
}

.candidato-reemplazo__faltantes ul {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-warning-text);
  font-size: 0.74rem;
  line-height: 1.5;
}

.candidato-reemplazo__motivo {
  margin: 0;
  padding: 0.45rem 0.6rem;
  border-radius: 7px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.candidato-reemplazo__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 0.15rem;
}

@media (max-width: 560px) {
  .candidato-reemplazo__cabecera {
    flex-wrap: wrap;
  }

  .candidato-reemplazo__estado {
    order: 3;
  }

  .candidato-reemplazo__acciones {
    flex-direction: column-reverse;
  }
}
</style>
