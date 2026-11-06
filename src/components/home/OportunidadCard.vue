<template>
  <article class="oportunidad-card">
    <div class="oportunidad-card__cabecera">
      <div class="oportunidad-card__titulo-grupo">
        <h3 class="oportunidad-card__titulo">{{ titulo }}</h3>
        <p v-if="tituloActividad" class="oportunidad-card__actividad">
          {{ tituloActividad }}
        </p>
      </div>

      <button
        v-if="puedePostular"
        type="button"
        class="oportunidad-card__postular"
        @click="$emit('postular', oportunidad)"
      >
        Postular
      </button>
      <EstadoPostulacionBadge
        v-else-if="yaPostulado"
        :estado="estadoPostulacion"
      />
      <span v-else class="oportunidad-card__no-disponible">No disponible</span>
    </div>

    <p class="oportunidad-card__descripcion">{{ descripcion }}</p>

    <div class="oportunidad-card__pie">
      <span class="oportunidad-card__meta">
        <span class="material-symbols-outlined" aria-hidden="true">work</span>
        <span class="oportunidad-card__profesion">{{ profesion }}</span>
        <span aria-hidden="true">·</span>
        <span>{{ metaFecha }}</span>
      </span>
      <b v-if="cuposTexto" class="oportunidad-card__cupos">{{ cuposTexto }}</b>
    </div>

    <p v-if="motivo" class="oportunidad-card__motivo">{{ motivo }}</p>
  </article>
</template>

<script>
import EstadoPostulacionBadge from "../proyecto/EstadoPostulacionBadge.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { TIPOS_POSTULACION } from "../../utils/postulacionConstants.js";

const MOTIVOS_NO_POSTULABLE = {
  PROYECTO_NO_HABILITADO: "El proyecto no está habilitado para postulaciones.",
  PROYECTO_NO_ACEPTA_GENERAL: "El proyecto no acepta postulaciones generales.",
  ACTIVIDAD_NO_PENDIENTE: "La actividad ya no está pendiente.",
  MIEMBRO_ACTIVO: "Ya sos miembro activo de este proyecto.",
  DIRECTOR: "Sos director de este proyecto.",
  PROFESION: "Tu profesión no coincide con este requerimiento.",
  CUPO: "El cupo está completo.",
};

export default {
  name: "OportunidadCard",
  components: { EstadoPostulacionBadge },
  props: {
    oportunidad: {
      type: Object,
      required: true,
    },
  },
  emits: ["postular"],
  computed: {
    esActividad() {
      return (
        String(this.oportunidad?.tipo || "").toUpperCase() ===
        TIPOS_POSTULACION.ACTIVIDAD
      );
    },
    titulo() {
      return this.oportunidad?.nombreProyecto || "Proyecto";
    },
    tituloActividad() {
      return this.esActividad ? this.oportunidad?.nombreActividad || "" : "";
    },
    descripcion() {
      const texto = String(this.oportunidad?.descripcion || "").trim();
      if (texto) return texto;
      return `Requerimiento de ${String(this.profesion).toLowerCase()}.`;
    },
    profesion() {
      return this.oportunidad?.nombreProfesion || "Perfil";
    },
    metaFecha() {
      const fecha = this.esActividad
        ? this.oportunidad?.fechaHoraInicioActividad
        : this.oportunidad?.fechaEntrega;
      if (!fecha) return "Fecha a definir";
      return `${this.esActividad ? "Inicia" : "Hasta"} ${formatearFechaCorta(fecha)}`;
    },
    cuposTexto() {
      if (this.oportunidad?.satisfecho === true) return "Cupo completo";
      const faltantes = Number(this.oportunidad?.faltantes);
      if (Number.isFinite(faltantes)) {
        if (faltantes <= 0) return "Cupo completo";
        return `${faltantes} cupo${faltantes === 1 ? "" : "s"} disponible${
          faltantes === 1 ? "" : "s"
        }`;
      }
      const cantidad = Number(this.oportunidad?.cantidad);
      if (Number.isFinite(cantidad) && cantidad > 0) {
        return `${cantidad} cupo${cantidad === 1 ? "" : "s"}`;
      }
      return "";
    },
    yaPostulado() {
      return this.oportunidad?.yaPostulado === true;
    },
    puedePostular() {
      return this.oportunidad?.puedePostularse === true && !this.yaPostulado;
    },
    estadoPostulacion() {
      return this.oportunidad?.estadoPostulacion || "PENDIENTE";
    },
    motivo() {
      if (this.puedePostular || this.yaPostulado) return "";
      const codigo = String(this.oportunidad?.motivoNoPostulable || "").toUpperCase();
      return (
        MOTIVOS_NO_POSTULABLE[codigo] ||
        "Este requerimiento no está disponible para tu perfil."
      );
    },
  },
};
</script>

<style scoped>
.oportunidad-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}

.oportunidad-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
}

.oportunidad-card__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.oportunidad-card__titulo-grupo {
  min-width: 0;
}

.oportunidad-card__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.oportunidad-card__actividad {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  line-height: 1.3;
}

.oportunidad-card__postular {
  flex: none;
  padding: 0.28rem 0.75rem;
  border: 0;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.oportunidad-card__postular:hover {
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}

.oportunidad-card__postular:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.oportunidad-card__no-disponible {
  flex: none;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  white-space: nowrap;
}

.oportunidad-card__descripcion {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.oportunidad-card__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.oportunidad-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.oportunidad-card__meta .material-symbols-outlined {
  font-size: 0.95rem;
}

.oportunidad-card__profesion {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.oportunidad-card__cupos {
  flex: none;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 600;
}

.oportunidad-card__motivo {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.7rem;
  line-height: 1.4;
}
</style>
