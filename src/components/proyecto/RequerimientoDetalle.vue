<template>
  <article class="req-detalle">
    <div class="req-detalle__cabecera">
      <span class="req-detalle__cantidad">{{ requerimiento.cantidad }}</span>
      <span class="req-detalle__profesion">{{ requerimiento.nombreProfesion }}</span>
      <span v-if="textoCupo" class="req-detalle__cupo">{{ textoCupo }}</span>
    </div>

    <p v-if="cupoCompleto" class="req-detalle__satisfecho">
      <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
      Cupo completo
    </p>

    <template v-if="chipsCaracteristicas.length">
      <p class="req-detalle__label">Características técnicas</p>
      <div class="req-detalle__chips">
        <span
          v-for="(chip, i) in chipsCaracteristicas"
          :key="`caracteristica-${i}`"
          class="req-detalle__chip"
        >
          {{ chip }}
        </span>
      </div>
    </template>

    <template v-if="chipsHabilidades.length">
      <p class="req-detalle__label">Habilidades</p>
      <div class="req-detalle__chips">
        <span
          v-for="habilidad in chipsHabilidades"
          :key="habilidad"
          class="req-detalle__chip"
        >
          {{ habilidad }}
        </span>
      </div>
    </template>

    <p v-if="requerimiento.descripcion" class="req-detalle__descripcion">
      {{ requerimiento.descripcion }}
    </p>

    <div v-if="mostrarAccion" class="req-detalle__accion">
      <slot name="accion" />
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
import { textoCupo as textoCupoRequerimiento } from "../../utils/postulacionConstants.js";

/*
 * Requerimiento general en modo lectura (ficha ver-proyecto §5.4): hoy sólo
 * existe el form editable RequerimientoForm.vue, así que éste renderiza el
 * mismo dato para el dashboard. Traduce ids de valores enumerados y de
 * habilidades contra los catálogos que carga la vista; si un catálogo no está
 * disponible degrada a la etiqueta de la característica (nunca muestra ids
 * crudos).
 */
export default {
  name: "RequerimientoDetalle",
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
    /** Reserva espacio para el slot `accion` (botón Postularme). */
    mostrarAccion: {
      type: Boolean,
      default: false,
    },
    /** Marca local de cupo completo tras un 409 (la respuesta puede no traerlo). */
    sinCupo: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    cupoCompleto() {
      return this.sinCupo || this.requerimiento?.satisfecho === true;
    },
    textoCupo() {
      return textoCupoRequerimiento(this.requerimiento);
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
.req-detalle {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.req-detalle__cabecera {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.req-detalle__cantidad {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.req-detalle__profesion {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.req-detalle__cupo {
  margin-left: auto;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.req-detalle__satisfecho {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.3rem;
  margin: 0;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.76rem;
  font-weight: 600;
}

.req-detalle__satisfecho .material-symbols-outlined {
  font-size: 0.95rem;
}

.req-detalle__label {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.req-detalle__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.req-detalle__chip {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 500;
}

.req-detalle__descripcion {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.req-detalle__accion {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
}
</style>
