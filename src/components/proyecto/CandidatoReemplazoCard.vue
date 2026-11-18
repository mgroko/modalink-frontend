<template>
  <article
    class="candidato-reemplazo"
    :class="[
      `candidato-reemplazo--${colorPuntaje}`,
      {
        'candidato-reemplazo--mejor': mejorOpcion,
        'candidato-reemplazo--seleccionado': seleccionado,
      },
    ]"
  >
    <span v-if="mejorOpcion" class="candidato-reemplazo__mejor">
      <span class="material-symbols-outlined" aria-hidden="true">star</span>
      Mejor opción
    </span>

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
        <div class="candidato-reemplazo__nombre-linea">
          <p class="candidato-reemplazo__nombre">
            {{ candidato.nombreArtistico || "Perfil" }}
          </p>
          <span
            v-if="candidato.alternativo"
            class="candidato-reemplazo__chip-alternativo"
          >
            Alternativo
          </span>
          <span
            v-if="mostrarEstado"
            class="candidato-reemplazo__estado"
            :class="`candidato-reemplazo__estado--${tonoEstado}`"
          >
            {{ etiquetaEstado }}
          </span>
        </div>
        <p class="candidato-reemplazo__secundario">
          <span v-if="nombreCompleto">{{ nombreCompleto }}</span>
          <span v-if="candidato.profesion">{{ candidato.profesion }}</span>
        </p>
      </div>

      <div
        class="candidato-reemplazo__score"
        :class="`candidato-reemplazo__score--${colorPuntaje}`"
      >
        <div class="candidato-reemplazo__score-numero">
          {{ puntajeCompacto }}
          <span>/ 100</span>
        </div>
        <div class="candidato-reemplazo__score-label">Concordancia</div>
        <div
          class="candidato-reemplazo__barra"
          role="progressbar"
          :aria-valuenow="porcentaje"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Concordancia ${puntajeCompacto} de 100`"
        >
          <span
            class="candidato-reemplazo__barra-relleno"
            :style="{ width: `${porcentaje}%` }"
          />
        </div>
        <div class="candidato-reemplazo__score-resumen">
          {{ resumenRequisitos.texto }}
        </div>
      </div>
    </header>

    <div class="candidato-reemplazo__meta">
      <span
        v-if="ubicacionDetalle"
        class="candidato-reemplazo__meta-chip"
        :class="`candidato-reemplazo__meta-chip--${claseUbicacion}`"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          {{ iconoUbicacion }}
        </span>
        {{ ubicacionDetalle }}
      </span>

      <span
        v-if="mostrarDisponibilidad"
        class="candidato-reemplazo__meta-chip"
        :class="`candidato-reemplazo__meta-chip--${claseDisponibilidad}`"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          {{ iconoDisponibilidad }}
        </span>
        {{ textoDisponibilidad }}
      </span>
    </div>

    <section v-if="habilidades.length" class="candidato-reemplazo__bloque">
      <p class="candidato-reemplazo__label">Habilidades</p>
      <div class="candidato-reemplazo__chips">
        <span
          v-for="habilidad in habilidades"
          :key="habilidad.nombre"
          class="candidato-reemplazo__chip-dato"
          :class="`candidato-reemplazo__chip-dato--${claseHabilidad(habilidad)}`"
        >
          <span
            v-if="claseHabilidad(habilidad) === 'success'"
            class="material-symbols-outlined"
            aria-hidden="true"
          >
            check_circle
          </span>
          <span
            v-else-if="claseHabilidad(habilidad) === 'warning'"
            class="material-symbols-outlined"
            aria-hidden="true"
          >
            warning
          </span>
          <span v-if="claseHabilidad(habilidad) === 'warning'" class="candidato-reemplazo__falta">
            Falta:
          </span>
          {{ habilidad.nombre }}
        </span>
      </div>
    </section>

    <section v-if="caracteristicas.length" class="candidato-reemplazo__bloque">
      <p class="candidato-reemplazo__label">Características</p>
      <div class="candidato-reemplazo__caracteristicas">
        <div
          v-for="caracteristica in caracteristicas"
          :key="caracteristica.idCaracteristica ?? caracteristica.codigo"
          class="candidato-reemplazo__caracteristica"
          :class="`candidato-reemplazo__caracteristica--${claseCaracteristica(caracteristica)}`"
        >
          <div class="candidato-reemplazo__caracteristica-cabecera">
            <span class="candidato-reemplazo__caracteristica-label">
              {{ caracteristica.etiqueta }}
            </span>
            <span
              v-if="claseCaracteristica(caracteristica) === 'success'"
              class="material-symbols-outlined"
              aria-hidden="true"
            >
              check_circle
            </span>
            <span
              v-else-if="claseCaracteristica(caracteristica) === 'warning'"
              class="material-symbols-outlined"
              aria-hidden="true"
            >
              warning
            </span>
          </div>
          <strong class="candidato-reemplazo__caracteristica-valor">
            {{ caracteristica.valor }}
          </strong>
          <span
            v-if="claseCaracteristica(caracteristica) === 'warning'"
            class="candidato-reemplazo__caracteristica-pedido"
          >
            {{ textoPedidoCaracteristica(caracteristica) }}
          </span>
        </div>
      </div>
    </section>

    <div
      v-if="faltantes.length"
      class="candidato-reemplazo__banner candidato-reemplazo__banner--warning"
    >
      <span class="material-symbols-outlined" aria-hidden="true">warning</span>
      <div>
        <strong>Diferencias con lo pedido</strong>
        <ul>
          <li v-for="faltante in faltantes" :key="faltante">{{ faltante }}</li>
        </ul>
      </div>
    </div>
    <div
      v-else-if="evaluado && cumpleTodo && colorPuntaje === 'success'"
      class="candidato-reemplazo__banner candidato-reemplazo__banner--success"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        check_circle
      </span>
      <div>
        <strong>Cumple todo lo pedido para el puesto</strong>
      </div>
    </div>

    <div
      v-if="fechasHistorial.length || candidato.motivoDecision"
      class="candidato-reemplazo__historial"
    >
      <span v-for="item in fechasHistorial" :key="item.label">
        {{ item.label }}: {{ item.value }}
      </span>
      <span v-if="candidato.motivoDecision">
        Motivo de la decisión: {{ candidato.motivoDecision }}
      </span>
    </div>

    <footer
      v-if="seleccionable || mostrarAccionesDecision"
      class="candidato-reemplazo__acciones"
    >
      <VaButton
        v-if="seleccionable"
        preset="primary"
        size="small"
        :icon="seleccionado ? 'mso-check' : undefined"
        :disabled="procesando"
        :aria-pressed="seleccionado ? 'true' : 'false'"
        @click="$emit('seleccionar', candidato)"
      >
        {{ seleccionado ? "Seleccionado" : "Seleccionar" }}
      </VaButton>

      <template v-if="mostrarAccionesDecision">
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
      </template>
    </footer>
  </article>
</template>

<script>
import {
  formatearFecha,
  formatearFechaCorta,
  formatearHora,
} from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  ESTADOS_CANDIDATO_REEMPLAZO,
  NIVELES_UBICACION_REEMPLAZO,
  TIPOS_DISPONIBILIDAD_REEMPLAZO,
  candidatoCumpleTodo,
  caracteristicasCandidatoReemplazo,
  colorPuntajeReemplazo,
  estadoRequisitoReemplazo,
  etiquetaDisponibilidad,
  etiquetaEstadoCandidatoReemplazo,
  etiquetaNivelUbicacion,
  formatearPuntajeCompactoReemplazo,
  habilidadesCandidatoReemplazo,
  porcentajeConcordanciaReemplazo,
  resumenRequisitosCandidato,
  textoPedidoCaracteristica,
  tonoEstadoCandidatoReemplazo,
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
    mejorOpcion: {
      type: Boolean,
      default: false,
    },
    seleccionable: {
      type: Boolean,
      default: false,
    },
    seleccionado: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["aprobar", "rechazar", "seleccionar"],
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
    ubicacionDetalle() {
      const nivel = this.candidato?.nivelUbicacion
        ? etiquetaNivelUbicacion(this.candidato.nivelUbicacion)
        : "";
      return [nivel, this.ubicacion].filter(Boolean).join(" · ");
    },
    claseUbicacion() {
      if (
        [
          NIVELES_UBICACION_REEMPLAZO.MISMA_CIUDAD,
          NIVELES_UBICACION_REEMPLAZO.MISMA_PROVINCIA,
        ].includes(this.candidato?.nivelUbicacion)
      ) {
        return "success";
      }
      if (
        this.candidato?.nivelUbicacion === NIVELES_UBICACION_REEMPLAZO.OTRA
      ) {
        return "warning";
      }
      return "neutral";
    },
    iconoUbicacion() {
      return this.claseUbicacion === "success" ? "check_circle" : "location_on";
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
      const inicio = this.candidato.inicioPropuesto;
      const fin = this.candidato.finPropuesto;
      const fechaInicio = formatearFechaCorta(inicio);
      const horaInicio = formatearHora(inicio);

      if (!fin) return `${fechaInicio} ${horaInicio}`;

      const fechaFin = formatearFechaCorta(fin);
      const horaFin = formatearHora(fin);
      if (fechaInicio === fechaFin) {
        return `${fechaInicio} ${horaInicio} – ${horaFin}`;
      }
      return `${fechaInicio} ${horaInicio} – ${fechaFin} ${horaFin}`;
    },
    textoDisponibilidad() {
      return [
        etiquetaDisponibilidad(this.candidato?.tipoDisponibilidad),
        this.rangoPropuesto,
      ]
        .filter(Boolean)
        .join(" · ");
    },
    claseDisponibilidad() {
      switch (this.candidato?.tipoDisponibilidad) {
        case TIPOS_DISPONIBILIDAD_REEMPLAZO.EXACTA:
          return "success";
        case TIPOS_DISPONIBILIDAD_REEMPLAZO.CON_REPROGRAMACION:
          return "warning";
        case TIPOS_DISPONIBILIDAD_REEMPLAZO.NO_DISPONIBLE:
          return "danger";
        default:
          return "neutral";
      }
    },
    iconoDisponibilidad() {
      if (this.claseDisponibilidad === "success") return "check_circle";
      if (this.claseDisponibilidad === "danger") return "block";
      return "schedule";
    },
    puntajeCompacto() {
      return formatearPuntajeCompactoReemplazo(this.candidato);
    },
    porcentaje() {
      return porcentajeConcordanciaReemplazo(this.candidato);
    },
    colorPuntaje() {
      return colorPuntajeReemplazo(this.candidato);
    },
    resumenRequisitos() {
      return resumenRequisitosCandidato(this.candidato);
    },
    habilidades() {
      return habilidadesCandidatoReemplazo(this.candidato);
    },
    caracteristicas() {
      return caracteristicasCandidatoReemplazo(this.candidato);
    },
    faltantes() {
      return Array.isArray(this.candidato?.faltantes)
        ? this.candidato.faltantes.filter(Boolean)
        : [];
    },
    evaluado() {
      return (
        this.candidato?.puntaje != null ||
        this.habilidades.length > 0 ||
        this.caracteristicas.length > 0 ||
        this.faltantes.length > 0
      );
    },
    cumpleTodo() {
      return candidatoCumpleTodo(this.candidato);
    },
    etiquetaEstado() {
      return etiquetaEstadoCandidatoReemplazo(this.candidato?.estado);
    },
    tonoEstado() {
      return tonoEstadoCandidatoReemplazo(this.candidato?.estado);
    },
    mostrarEstado() {
      return (
        !!this.candidato?.estado &&
        this.candidato.estado !== ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO
      );
    },
    fechasHistorial() {
      const items = [];
      if (this.candidato?.fechaInvitacion) {
        items.push({
          label: "Invitado",
          value: formatearFecha(this.candidato.fechaInvitacion),
        });
      }
      if (this.candidato?.fechaRespuesta) {
        items.push({
          label: "Respondió",
          value: formatearFecha(this.candidato.fechaRespuesta),
        });
      }
      if (this.candidato?.fechaDecision) {
        items.push({
          label: "Decisión",
          value: formatearFecha(this.candidato.fechaDecision),
        });
      }
      return items;
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
    textoPedidoCaracteristica,
    claseHabilidad(habilidad) {
      return estadoRequisitoReemplazo(habilidad);
    },
    claseCaracteristica(caracteristica) {
      return estadoRequisitoReemplazo(caracteristica);
    },
  },
};
</script>

<style scoped>
.candidato-reemplazo {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.candidato-reemplazo--mejor {
  margin-top: 0.35rem;
  border-color: var(--color-success-border);
  box-shadow: 0 0 0 1px var(--color-success-border) inset;
}

.candidato-reemplazo--seleccionado {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light) inset;
}

.candidato-reemplazo__mejor {
  position: absolute;
  top: -0.7rem;
  left: 1rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem 0.55rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

.candidato-reemplazo__mejor .material-symbols-outlined {
  font-size: 0.85rem;
}

.candidato-reemplazo__cabecera {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}

.candidato-reemplazo__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 54px;
  height: 54px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary, #fff);
  font-size: 0.95rem;
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

.candidato-reemplazo__nombre-linea {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.candidato-reemplazo__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.candidato-reemplazo__secundario {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.55rem;
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.candidato-reemplazo__chip-alternativo {
  padding: 0.08rem 0.45rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.64rem;
  font-weight: 700;
}

.candidato-reemplazo__estado {
  padding: 0.08rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.64rem;
  font-weight: 700;
  line-height: 1.5;
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

.candidato-reemplazo__score {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  min-width: 150px;
}

.candidato-reemplazo__score-numero {
  color: var(--color-text-muted);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.candidato-reemplazo__score-numero span {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.candidato-reemplazo__score--success .candidato-reemplazo__score-numero {
  color: var(--color-success-text);
}

.candidato-reemplazo__score--warning .candidato-reemplazo__score-numero {
  color: var(--color-warning-text);
}

.candidato-reemplazo__score--primary .candidato-reemplazo__score-numero {
  color: var(--color-primary);
}

.candidato-reemplazo__score-label {
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.candidato-reemplazo__barra {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.candidato-reemplazo__barra-relleno {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.candidato-reemplazo__score--success .candidato-reemplazo__barra-relleno {
  background: var(--color-success-text);
}

.candidato-reemplazo__score--warning .candidato-reemplazo__barra-relleno {
  background: var(--color-warning-text);
}

.candidato-reemplazo__score--primary .candidato-reemplazo__barra-relleno {
  background: var(--color-primary);
}

.candidato-reemplazo__score-resumen {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  text-align: right;
}

.candidato-reemplazo__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.candidato-reemplazo__meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 600;
}

.candidato-reemplazo__meta-chip .material-symbols-outlined {
  font-size: 1rem;
}

.candidato-reemplazo__meta-chip--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.candidato-reemplazo__meta-chip--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.candidato-reemplazo__meta-chip--danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.candidato-reemplazo__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.candidato-reemplazo__label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.candidato-reemplazo__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.candidato-reemplazo__chip-dato {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.28rem 0.65rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 500;
}

.candidato-reemplazo__chip-dato .material-symbols-outlined {
  font-size: 0.95rem;
}

.candidato-reemplazo__chip-dato--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.candidato-reemplazo__chip-dato--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.candidato-reemplazo__falta {
  font-weight: 700;
}

.candidato-reemplazo__caracteristicas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.45rem;
}

.candidato-reemplazo__caracteristica {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface-soft);
}

.candidato-reemplazo__caracteristica--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
}

.candidato-reemplazo__caracteristica--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
}

.candidato-reemplazo__caracteristica-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
}

.candidato-reemplazo__caracteristica-cabecera .material-symbols-outlined {
  font-size: 0.95rem;
}

.candidato-reemplazo__caracteristica--success
  .candidato-reemplazo__caracteristica-cabecera
  .material-symbols-outlined {
  color: var(--color-success-text);
}

.candidato-reemplazo__caracteristica--warning
  .candidato-reemplazo__caracteristica-cabecera
  .material-symbols-outlined {
  color: var(--color-warning-text);
}

.candidato-reemplazo__caracteristica-label {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidato-reemplazo__caracteristica--warning
  .candidato-reemplazo__caracteristica-label,
.candidato-reemplazo__caracteristica--warning
  .candidato-reemplazo__caracteristica-valor {
  color: var(--color-warning-text);
}

.candidato-reemplazo__caracteristica-valor {
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: 0.86rem;
}

.candidato-reemplazo__caracteristica-pedido {
  margin-top: 0.1rem;
  color: var(--color-warning-text);
  font-size: 0.7rem;
  line-height: 1.35;
}

.candidato-reemplazo__banner {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 0.78rem;
  line-height: 1.45;
}

.candidato-reemplazo__banner .material-symbols-outlined {
  flex: 0 0 auto;
  font-size: 1.1rem;
}

.candidato-reemplazo__banner strong {
  display: block;
}

.candidato-reemplazo__banner ul {
  margin: 0.2rem 0 0;
  padding-left: 1.1rem;
}

.candidato-reemplazo__banner--success {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.candidato-reemplazo__banner--warning {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.candidato-reemplazo__historial {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.8rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--color-border-soft);
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.candidato-reemplazo__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 0.1rem;
}

@media (max-width: 760px) {
  .candidato-reemplazo__cabecera {
    flex-wrap: wrap;
  }

  .candidato-reemplazo__score {
    flex-basis: 100%;
    align-items: flex-start;
    min-width: 0;
  }

  .candidato-reemplazo__score-resumen {
    text-align: left;
  }

  .candidato-reemplazo__acciones {
    flex-direction: column-reverse;
  }

  .candidato-reemplazo__acciones > * {
    width: 100%;
  }
}
</style>
