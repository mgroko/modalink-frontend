<template>
  <article class="oportunidad-busqueda">
    <header class="oportunidad-busqueda__cabecera">
      <div class="oportunidad-busqueda__titulo-grupo">
        <span class="oportunidad-busqueda__tipo">{{ tipoEtiqueta }}</span>
        <h3 class="oportunidad-busqueda__titulo">{{ nombreProyecto }}</h3>
        <p v-if="nombreActividad" class="oportunidad-busqueda__actividad">
          {{ nombreActividad }}
        </p>
      </div>

      <div class="oportunidad-busqueda__estados">
        <EstadoProyectoBadge
          v-if="oportunidad.estadoProyecto"
          :estado="oportunidad.estadoProyecto"
        />
        <span
          v-if="yaPostulado"
          class="oportunidad-busqueda__chip-estado oportunidad-busqueda__chip-estado--postulado"
        >
          Ya postulado
        </span>
        <span
          v-else-if="hayCupo"
          class="oportunidad-busqueda__chip-estado oportunidad-busqueda__chip-estado--cupo"
        >
          Con cupo
        </span>
        <span v-else class="oportunidad-busqueda__chip-estado">
          Sin cupo
        </span>
        <span
          v-if="estadoActividadTexto"
          class="oportunidad-busqueda__chip-estado"
        >
          Actividad {{ estadoActividadTexto }}
        </span>
      </div>
    </header>

    <div class="oportunidad-busqueda__meta">
      <span class="oportunidad-busqueda__profesion">
        <span class="material-symbols-outlined" aria-hidden="true">work</span>
        {{ profesion }}
      </span>
      <span v-if="ubicacion" class="oportunidad-busqueda__ubicacion">
        <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
        {{ ubicacion }}
      </span>
      <span>{{ cantidadTexto }}</span>
      <b class="oportunidad-busqueda__cupos">{{ cupoTexto }}</b>
    </div>

    <p class="oportunidad-busqueda__descripcion">{{ descripcion }}</p>

    <template v-if="chipsCaracteristicas.length">
      <p class="oportunidad-busqueda__label">Características técnicas</p>
      <div class="oportunidad-busqueda__chips">
        <span
          v-for="(chip, indice) in chipsCaracteristicas"
          :key="`caracteristica-${indice}`"
          class="oportunidad-busqueda__chip"
        >
          {{ chip }}
        </span>
      </div>
    </template>

    <template v-if="chipsHabilidades.length">
      <p class="oportunidad-busqueda__label">Habilidades</p>
      <div class="oportunidad-busqueda__chips">
        <span
          v-for="habilidad in chipsHabilidades"
          :key="habilidad"
          class="oportunidad-busqueda__chip oportunidad-busqueda__chip--habilidad"
        >
          {{ habilidad }}
        </span>
      </div>
    </template>

    <dl class="oportunidad-busqueda__fechas">
      <div v-if="fechaInicioProyecto" class="oportunidad-busqueda__fecha">
        <dt>Inicia el proyecto</dt>
        <dd>{{ fechaInicioProyecto }}</dd>
      </div>
      <div v-if="fechaActividad" class="oportunidad-busqueda__fecha">
        <dt>Actividad</dt>
        <dd>{{ fechaActividad }}</dd>
      </div>
      <div v-if="fechaEntrega" class="oportunidad-busqueda__fecha">
        <dt>Entrega del proyecto</dt>
        <dd>{{ fechaEntrega }}</dd>
      </div>
    </dl>

    <p
      v-if="esActividad && oportunidad.requiereVerificacionDisponibilidad"
      class="oportunidad-busqueda__nota"
    >
      <span class="material-symbols-outlined" aria-hidden="true">info</span>
      La disponibilidad se confirmará al postularte.
    </p>

    <footer class="oportunidad-busqueda__pie">
      <span v-if="motivo" class="oportunidad-busqueda__motivo">
        {{ motivo }}
      </span>

      <EstadoPostulacionBadge
        v-if="yaPostulado"
        :estado="estadoPostulacion"
      />

      <VaButton
        preset="secondary"
        size="small"
        @click="$emit('ver-detalle', oportunidad)"
      >
        Ver detalle
      </VaButton>

      <VaButton
        v-if="puedePostular"
        preset="primary"
        size="small"
        @click="$emit('postular', oportunidad)"
      >
        Postularme
      </VaButton>

      <span
        v-else-if="!yaPostulado"
        class="oportunidad-busqueda__no-disponible"
      >
        No disponible
      </span>
    </footer>
  </article>
</template>

<script>
import EstadoPostulacionBadge from "./EstadoPostulacionBadge.vue";
import EstadoProyectoBadge from "./EstadoProyectoBadge.vue";
import {
  ETIQUETAS_TIPO_OPORTUNIDAD,
  chipsCaracteristicas,
  chipsHabilidades,
  esOportunidadActividad,
  etiquetaMotivoNoPostulable,
  puedePostularOportunidad,
  textoCupoOportunidad,
} from "../../utils/requerimientoAbiertoConstants.js";
import {
  ESTADOS_ACTIVIDAD,
  ETIQUETAS_ESTADO_ACTIVIDAD,
  normalizarEstadoActividad,
} from "../../utils/actividadConstants.js";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";
import { formatUbicacion } from "../../utils/ubicacion.js";

/*
 * Tarjeta de resultado del buscador UC-72/UC-73.
 * La habilitación de "Postularme" sale exclusivamente de
 * `puedePostularse && !yaPostulado`; el resto de los motivos sólo se explica.
 */
export default {
  name: "OportunidadBusquedaCard",
  components: { EstadoPostulacionBadge, EstadoProyectoBadge },
  props: {
    oportunidad: {
      type: Object,
      required: true,
    },
    habilidadesCatalogo: {
      type: Array,
      default: () => [],
    },
    caracteristicasCatalogo: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["postular", "ver-detalle"],
  computed: {
    hayCupo() {
      if (this.oportunidad?.satisfecho === true) return false;
      const faltantes = Number(this.oportunidad?.faltantes);
      if (Number.isFinite(faltantes)) return faltantes > 0;
      return this.puedePostular;
    },
    esActividad() {
      return esOportunidadActividad(this.oportunidad);
    },
    tipoEtiqueta() {
      return (
        ETIQUETAS_TIPO_OPORTUNIDAD[
          this.esActividad ? "ACTIVIDAD" : "GENERAL"
        ] || "Oportunidad"
      );
    },
    nombreProyecto() {
      return this.oportunidad?.nombreProyecto || "Proyecto";
    },
    nombreActividad() {
      return this.esActividad ? this.oportunidad?.nombreActividad || "" : "";
    },
    profesion() {
      return this.oportunidad?.nombreProfesion || "Perfil";
    },
    ubicacion() {
      return formatUbicacion(this.oportunidad);
    },
    cantidad() {
      const cantidad = Number(this.oportunidad?.cantidad);
      return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : null;
    },
    cantidadTexto() {
      if (!this.cantidad) return "";
      return `${this.cantidad} requerido${this.cantidad === 1 ? "" : "s"}`;
    },
    cupoTexto() {
      return textoCupoOportunidad(this.oportunidad);
    },
    descripcion() {
      const texto = String(this.oportunidad?.descripcion || "").trim();
      if (texto) return texto;
      return this.esActividad
        ? "La actividad busca cubrir este requerimiento."
        : "El proyecto busca cubrir este requerimiento.";
    },
    estadoActividadTexto() {
      const estado = normalizarEstadoActividad(
        this.oportunidad?.estadoActividad
      );
      if (!this.oportunidad?.estadoActividad) return "";
      if (estado === ESTADOS_ACTIVIDAD.PENDIENTE) return "";
      return ETIQUETAS_ESTADO_ACTIVIDAD[estado] || estado;
    },
    chipsCaracteristicas() {
      return chipsCaracteristicas(
        this.oportunidad?.caracteristicas,
        this.caracteristicasCatalogo
      );
    },
    chipsHabilidades() {
      return chipsHabilidades(
        this.oportunidad?.habilidades,
        this.habilidadesCatalogo
      );
    },
    fechaInicioProyecto() {
      return this.oportunidad?.fechaInicioProyecto
        ? formatearFechaCorta(this.oportunidad.fechaInicioProyecto)
        : "";
    },
    fechaEntrega() {
      return this.oportunidad?.fechaEntrega
        ? formatearFechaCorta(this.oportunidad.fechaEntrega)
        : "";
    },
    fechaActividad() {
      if (!this.esActividad) return "";
      const inicio = this.oportunidad?.fechaHoraInicioActividad;
      const fin = this.oportunidad?.fechaHoraFinActividad;
      if (!inicio) return "";
      return fin
        ? `${formatearFecha(inicio)} – ${formatearFecha(fin)}`
        : formatearFecha(inicio);
    },
    yaPostulado() {
      return this.oportunidad?.yaPostulado === true;
    },
    puedePostular() {
      return puedePostularOportunidad(this.oportunidad);
    },
    estadoPostulacion() {
      return this.oportunidad?.estadoPostulacion || "PENDIENTE";
    },
    motivo() {
      if (this.yaPostulado) return "";
      if (this.puedePostular) return "";
      if (this.oportunidad?.satisfecho === true) return "Cupo completo.";
      if (this.oportunidad?.motivoNoPostulable) {
        return etiquetaMotivoNoPostulable(
          this.oportunidad.motivoNoPostulable
        );
      }
      return "Este requerimiento no está disponible para tu perfil.";
    },
  },
};
</script>

<style scoped>
.oportunidad-busqueda {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  height: 100%;
  padding: 1.1rem 1.2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}

.oportunidad-busqueda:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
}

.oportunidad-busqueda__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.oportunidad-busqueda__titulo-grupo {
  min-width: 0;
}

.oportunidad-busqueda__tipo {
  display: inline-flex;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.oportunidad-busqueda__titulo {
  margin: 0.3rem 0 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.oportunidad-busqueda__actividad {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
}

.oportunidad-busqueda__estados {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  flex: none;
}

.oportunidad-busqueda__chip-estado {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.oportunidad-busqueda__chip-estado--cupo {
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.oportunidad-busqueda__chip-estado--postulado {
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.oportunidad-busqueda__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.oportunidad-busqueda__profesion {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text);
  font-weight: 600;
}

.oportunidad-busqueda__profesion .material-symbols-outlined {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.oportunidad-busqueda__ubicacion {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-text-muted);
}

.oportunidad-busqueda__ubicacion .material-symbols-outlined {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.oportunidad-busqueda__cupos {
  margin-left: auto;
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 700;
}

.oportunidad-busqueda__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.83rem;
  line-height: 1.5;
}

.oportunidad-busqueda__label {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.oportunidad-busqueda__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: -0.35rem;
}

.oportunidad-busqueda__chip {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 500;
}

.oportunidad-busqueda__chip--habilidad {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.oportunidad-busqueda__fechas {
  display: grid;
  gap: 0.3rem;
  margin: 0;
}

.oportunidad-busqueda__fecha {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.74rem;
}

.oportunidad-busqueda__fecha dt {
  color: var(--color-text-muted);
}

.oportunidad-busqueda__fecha dd {
  margin: 0;
  color: var(--color-text);
  font-weight: 600;
}

.oportunidad-busqueda__nota {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.4;
}

.oportunidad-busqueda__nota .material-symbols-outlined {
  flex: none;
  font-size: 0.95rem;
}

.oportunidad-busqueda__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.35rem;
}

.oportunidad-busqueda__motivo {
  margin-right: auto;
  color: var(--color-warning-text);
  font-size: 0.74rem;
  line-height: 1.4;
}

.oportunidad-busqueda__no-disponible {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 600;
}
</style>
