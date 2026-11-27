<template>
  <article class="req-card">
    <div v-if="contextoActividad" class="req-card__contexto">
      <span class="req-card__actividad-grupo">
        <span class="req-card__actividad">
          Actividad · {{ contextoActividad }}
        </span>
        <ChipOrigenInicio :origen="origenActividad" />
      </span>
      <button
        v-if="mostrarVerActividad"
        type="button"
        class="req-card__ver-actividad"
        @click="$emit('ver-actividad')"
      >
        Ver actividad
        <span class="material-symbols-outlined" aria-hidden="true">
          arrow_forward
        </span>
      </button>
    </div>

    <div class="req-card__cabecera">
      <span v-if="cantidadMostrar" class="req-card__cantidad" aria-hidden="true">
        {{ cantidadMostrar }}
      </span>
      <div class="req-card__identidad">
        <h3 class="req-card__profesion">{{ nombreProfesion }}</h3>
        <p v-if="subtitulo" class="req-card__subtitulo">{{ subtitulo }}</p>
      </div>
      <div v-if="protegido || cupoCompleto" class="req-card__estados">
        <span
          v-if="protegido"
          class="req-card__badge req-card__badge--protegido"
          :title="textoProteccion"
        >
          Protegido
        </span>
        <span v-if="cupoCompleto" class="req-card__badge">
          {{ textos.CUPO_COMPLETO }}
        </span>
      </div>
    </div>

    <div class="req-card__cobertura">
      <div class="req-card__cobertura-fila">
        <span class="req-card__cobertura-label">Cobertura</span>
        <span class="req-card__cobertura-valor">{{ textoCupo }}</span>
      </div>
      <div
        class="req-card__barra"
        role="progressbar"
        :aria-valuenow="porcentaje"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="textoCupo"
      >
        <span
          class="req-card__barra-relleno"
          :style="{ width: `${porcentaje}%` }"
        />
      </div>
    </div>

    <p v-if="requerimiento.descripcion" class="req-card__descripcion">
      {{ requerimiento.descripcion }}
    </p>

    <section v-if="gruposCaracteristicas.length" class="req-card__seccion">
      <p class="req-card__label">Características técnicas</p>
      <div class="req-card__grupos">
        <div
          v-for="(grupo, i) in gruposCaracteristicas"
          :key="`caracteristica-${i}`"
          class="req-card__grupo"
        >
          <p v-if="grupo.etiqueta" class="req-card__grupo-label">
            {{ grupo.etiqueta }}
          </p>
          <div class="req-card__chips">
            <span
              v-for="(valor, j) in valoresDeGrupo(grupo)"
              :key="`valor-${i}-${j}`"
              class="req-card__chip"
            >
              {{ valor }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="chipsHabilidades.length" class="req-card__seccion">
      <p class="req-card__label">Habilidades</p>
      <div class="req-card__chips">
        <span
          v-for="habilidad in chipsHabilidades"
          :key="habilidad"
          class="req-card__chip"
        >
          {{ habilidad }}
        </span>
      </div>
    </section>

    <div v-if="mostrarAccion || motivo" class="req-card__pie">
      <span v-if="motivo && !mostrarAccion" class="req-card__motivo">
        {{ motivo }}
      </span>
      <div v-if="mostrarAccion" class="req-card__accion">
        <slot name="accion" />
      </div>
    </div>
  </article>
</template>

<script>
import {
  esNumerico as esTipoNumerico,
  esEnumerado as esTipoEnumerado,
} from "../../utils/proyectoConstants.js";
import {
  ETIQUETAS_CARACTERISTICAS,
  UNIDADES_POR_CODIGO,
  normCodigo,
  simboloUnidad,
} from "../../utils/perfilConstants.js";
import {
  TEXTOS_POSTULACIONES,
  porcentajeCupo,
  textoCupoCubiertos,
} from "../../utils/postulacionConstants.js";
import ChipOrigenInicio from "./ChipOrigenInicio.vue";
import {
  esRequerimientoProtegido,
  mensajeProteccionRequerimiento,
} from "../../utils/requerimientoProyectoConstants.js";

/*
 * Requerimiento en modo lectura (general o de actividad). Conserva la
 * traducción de características/habilidades y muestra el cupo "X de Y
 * cubiertos" con barra de progreso, el badge "Cupo completo", el contexto de
 * actividad y el link "Ver actividad".
 *
 * Las características se agrupan por característica (etiqueta + valores) para
 * que el listado se lea como una ficha técnica y no como una nube de chips.
 */
export default {
  name: "RequerimientoCard",
  components: { ChipOrigenInicio },
  props: {
    requerimiento: {
      type: Object,
      required: true,
    },
    /** Catálogo [{idHabilidad, nombre}] (habilidadService.listar). */
    habilidades: {
      type: Array,
      default: () => [],
    },
    /**
     * Catálogo de características de la profesión del requerimiento
     * (perfilService.caracteristicasPorProfesion), con `valores`
     * [{idValor, codigo}]. null si no se pudo cargar.
     */
    catalogoCaracteristicas: {
      type: Array,
      default: null,
    },
    /** Nombre de la actividad cuando el requerimiento es de actividad. */
    contextoActividad: {
      type: String,
      default: "",
    },
    /** `origenInicio` de la actividad, para el chip de solo lectura. */
    origenActividad: {
      type: String,
      default: null,
    },
    /** Línea secundaria debajo de la profesión (p. ej. "Requisito del proyecto"). */
    subtitulo: {
      type: String,
      default: "",
    },
    /** Muestra el link "Ver actividad". */
    mostrarVerActividad: {
      type: Boolean,
      default: false,
    },
    /** Reserva espacio para el slot `accion` (botón Postularme). */
    mostrarAccion: {
      type: Boolean,
      default: false,
    },
    /** Texto que explica por qué no hay acción. */
    motivo: {
      type: String,
      default: "",
    },
    /** Marca local de cupo completo tras un 409 (la respuesta puede no traerlo). */
    sinCupo: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["ver-actividad"],
  data() {
    return { textos: TEXTOS_POSTULACIONES };
  },
  computed: {
    protegido() {
      return esRequerimientoProtegido(this.requerimiento);
    },
    textoProteccion() {
      return mensajeProteccionRequerimiento(this.requerimiento);
    },
    cantidadMostrar() {
      const valor =
        this.requerimiento?.cantidad ?? this.requerimiento?.cantidadRequerida;
      const cantidad = Number(valor);
      return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : null;
    },
    nombreProfesion() {
      return this.requerimiento?.nombreProfesion || "Requerimiento";
    },
    cupoCompleto() {
      return this.sinCupo || this.requerimiento?.satisfecho === true;
    },
    textoCupo() {
      return textoCupoCubiertos(this.requerimiento);
    },
    porcentaje() {
      return porcentajeCupo(this.requerimiento);
    },
    /**
     * Características agrupadas: `{ etiqueta, valores }`. Si la característica
     * no tiene valores enumerados/rango, la etiqueta se muestra como chip
     * suelto dentro del grupo.
     */
    gruposCaracteristicas() {
      const grupos = [];
      for (const carac of this.requerimiento?.caracteristicas || []) {
        const etiqueta = this.etiquetaCaracteristica(carac);
        if (!etiqueta) continue;

        if (esTipoNumerico(carac.tipoDato)) {
          const rango = this.textoRango(carac);
          grupos.push({
            etiqueta: rango ? etiqueta : "",
            valores: rango ? [rango] : [etiqueta],
          });
          continue;
        }

        if (esTipoEnumerado(carac.tipoDato)) {
          const valores = Array.isArray(carac.valores) ? carac.valores : [];
          const chips = valores
            .map((idValor) => this.codigoDeValor(carac, idValor))
            .filter(Boolean)
            .map((codigo) => this.capitalizar(codigo));
          grupos.push({
            etiqueta: chips.length ? etiqueta : "",
            valores: chips.length ? chips : [etiqueta],
          });
          continue;
        }

        grupos.push({ etiqueta: "", valores: [etiqueta] });
      }
      return grupos;
    },
    chipsHabilidades() {
      const ids = this.requerimiento?.habilidades || [];
      if (!ids.length || !this.habilidades.length) return [];
      return ids
        .map((id) => this.habilidades.find((h) => h.idHabilidad === id)?.nombre)
        .filter(Boolean);
    },
  },
  methods: {
    valoresDeGrupo(grupo) {
      return grupo?.valores?.length ? grupo.valores : [];
    },
    etiquetaCaracteristica(carac) {
      if (!carac) return "";
      const etiqueta = ETIQUETAS_CARACTERISTICAS[normCodigo(carac.codigo)];
      return etiqueta || this.capitalizar(carac.codigo);
    },
    /** "170 cm o más" / "1,7 – 2 m" / "hasta 42" (ficha: chip min–max). */
    textoRango(carac) {
      const min = carac.valorMin;
      const max = carac.valorMax;
      const unidad = simboloUnidad(UNIDADES_POR_CODIGO[normCodigo(carac.codigo)]);
      const sufijo = unidad ? ` ${unidad}` : "";

      if (min != null && max != null) {
        return `${this.formatearNumero(min)}${sufijo} – ${this.formatearNumero(max)}${sufijo}`;
      }
      if (min != null) return `${this.formatearNumero(min)}${sufijo} o más`;
      if (max != null) return `hasta ${this.formatearNumero(max)}${sufijo}`;
      return "";
    },
    codigoDeValor(carac, idValor) {
      const catalogo = (this.catalogoCaracteristicas || []).find(
        (c) => c.idCaracteristica === carac.idCaracteristica
      );
      return catalogo?.valores?.find((v) => v.idValor === idValor)?.codigo || null;
    },
    formatearNumero(valor) {
      const numero = Number(valor);
      if (Number.isNaN(numero)) return String(valor);
      return numero.toLocaleString("es-AR", { maximumFractionDigits: 2 });
    },
    capitalizar(texto) {
      if (!texto) return "";
      return String(texto)
        .toLowerCase()
        .split(/[_\-.]+/)
        .filter(Boolean)
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    },
  },
};
</script>

<style scoped>
.req-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.35rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 14px;
}

.req-card__contexto {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.req-card__actividad-grupo {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.req-card__actividad {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.req-card__ver-actividad {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.req-card__ver-actividad:hover {
  text-decoration: underline;
}

.req-card__ver-actividad .material-symbols-outlined {
  font-size: 1rem;
}

.req-card__cabecera {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.req-card__cantidad {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  background: var(--color-chip);
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1;
}

.req-card__identidad {
  min-width: 0;
  padding-top: 0.15rem;
}

.req-card__profesion {
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
}

.req-card__subtitulo {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.req-card__estados {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.req-card__badge {
  padding: 0.2rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.req-card__badge--protegido {
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  border-color: var(--color-warning-border);
}

.req-card__cobertura {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.req-card__cobertura-fila {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.req-card__cobertura-label {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.req-card__cobertura-valor {
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.req-card__barra {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.req-card__barra-relleno {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.req-card__descripcion {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.req-card__seccion {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.req-card__label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.req-card__grupos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.85rem 1.25rem;
  align-items: start;
}

.req-card__grupo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.req-card__grupo-label {
  margin: 0;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 600;
}

.req-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.req-card__chip {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 500;
}

.req-card__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.1rem;
}

.req-card__motivo {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.req-card__accion {
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
}

@media (max-width: 640px) {
  .req-card {
    padding: 1.1rem 1rem;
  }

  .req-card__cantidad {
    width: 2.6rem;
    height: 2.6rem;
    font-size: 1.25rem;
  }

  .req-card__estados {
    width: 100%;
    margin-left: 0;
  }

  .req-card__accion {
    width: 100%;
  }
}
</style>
