<template>
  <article class="req-card">
    <div v-if="contextoActividad" class="req-card__contexto">
      <span class="req-card__actividad">
        Actividad · {{ contextoActividad }}
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
      <span class="req-card__cantidad">{{ requerimiento.cantidad }}</span>
      <span class="req-card__profesion">{{ requerimiento.nombreProfesion }}</span>
      <span v-if="cupoCompleto" class="req-card__badge">
        {{ textos.CUPO_COMPLETO }}
      </span>
      <span v-else class="req-card__cupo">{{ textoCupo }}</span>
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

    <template v-if="chipsCaracteristicas.length">
      <p class="req-card__label">Características técnicas</p>
      <div class="req-card__chips">
        <span
          v-for="(chip, i) in chipsCaracteristicas"
          :key="`caracteristica-${i}`"
          class="req-card__chip"
        >
          {{ chip }}
        </span>
      </div>
    </template>

    <template v-if="chipsHabilidades.length">
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
    </template>

    <p v-if="requerimiento.descripcion" class="req-card__descripcion">
      {{ requerimiento.descripcion }}
    </p>

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

/*
 * Requerimiento en modo lectura (general o de actividad). Reemplaza a
 * RequerimientoDetalle: conserva la traducción de características/habilidades
 * y agrega el cupo "X de Y cubiertos", la barra de progreso, el badge
 * "Cupo completo", el contexto de actividad y el link "Ver actividad".
 */
export default {
  name: "RequerimientoCard",
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
    cupoCompleto() {
      return this.sinCupo || this.requerimiento?.satisfecho === true;
    },
    textoCupo() {
      return textoCupoCubiertos(this.requerimiento);
    },
    porcentaje() {
      return porcentajeCupo(this.requerimiento);
    },
    chipsCaracteristicas() {
      const chips = [];
      for (const carac of this.requerimiento?.caracteristicas || []) {
        const etiqueta = this.etiquetaCaracteristica(carac);
        if (!etiqueta) continue;

        if (esTipoNumerico(carac.tipoDato)) {
          const rango = this.textoRango(carac);
          chips.push(rango ? `${etiqueta}: ${rango}` : etiqueta);
          continue;
        }

        if (esTipoEnumerado(carac.tipoDato)) {
          const valores = Array.isArray(carac.valores) ? carac.valores : [];
          if (!valores.length) continue;
          for (const idValor of valores) {
            const codigo = this.codigoDeValor(carac, idValor);
            chips.push(codigo ? `${etiqueta}: ${this.capitalizar(codigo)}` : etiqueta);
          }
          continue;
        }

        chips.push(etiqueta);
      }
      return chips;
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
  gap: 0.6rem;
  padding: 1rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.req-card__contexto {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.req-card__actividad {
  color: var(--color-text-muted);
  font-size: 0.78rem;
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
  font-size: 0.8rem;
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
  align-items: baseline;
  gap: 0.5rem;
}

.req-card__cantidad {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.req-card__profesion {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.req-card__cupo {
  margin-left: auto;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.req-card__badge {
  margin-left: auto;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}

.req-card__barra {
  width: 100%;
  height: 6px;
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

.req-card__label {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.req-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.req-card__chip {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 500;
}

.req-card__descripcion {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.req-card__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
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
</style>
