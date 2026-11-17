<template>
  <article class="carac-card">
    <header class="carac-card__cabecera">
      <h4 class="carac-card__titulo">{{ titulo }}</h4>
      <button
        v-if="!soloLectura"
        type="button"
        class="carac-card__quitar"
        :title="`Quitar ${titulo}`"
        :aria-label="`Quitar ${titulo}`"
        @click="$emit('quitar')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </header>

    <p v-if="error" class="carac-card__error">{{ error }}</p>

    <p v-if="!catalogo" class="carac-card__hint">Cargando característica…</p>

    <template v-else-if="numerica">
      <div class="carac-card__rango">
        <div class="carac-card__campo">
          <span class="carac-card__label">Mínimo</span>
          <VaInput
            v-model="caracteristica.valorMin"
            type="number"
            inputmode="decimal"
            :disabled="soloLectura"
            :rules="[reglas.numerico, reglas.noNegativo]"
            :input-aria-label="`Valor mínimo de ${titulo}`"
          >
            <template v-if="unidad" #appendInner>
              <span class="carac-card__unidad">{{ unidad }}</span>
            </template>
          </VaInput>
        </div>

        <div class="carac-card__campo">
          <span class="carac-card__label">Máximo</span>
          <VaInput
            v-model="caracteristica.valorMax"
            type="number"
            inputmode="decimal"
            :disabled="soloLectura"
            :rules="[reglas.numerico, reglas.noNegativo]"
            :input-aria-label="`Valor máximo de ${titulo}`"
          >
            <template v-if="unidad" #appendInner>
              <span class="carac-card__unidad">{{ unidad }}</span>
            </template>
          </VaInput>
        </div>
      </div>
      <p class="carac-card__ayuda">
        Completá el mínimo y el máximo. El mínimo no puede superar al máximo.
      </p>
    </template>

    <template v-else-if="enumerada">
      <p v-if="!valores.length" class="carac-card__hint">
        Esta característica no tiene valores de catálogo cargados.
      </p>

      <div
        v-else
        class="carac-card__valores"
        :class="{ 'carac-card__valores--colores': usaColores }"
      >
        <button
          v-for="valor in valores"
          :key="valor.idValor"
          type="button"
          :class="
            usaColores
              ? ['carac-card__color', { 'carac-card__color--activo': estaSeleccionado(valor.idValor) }]
              : ['carac-card__opcion', { 'carac-card__opcion--activa': estaSeleccionado(valor.idValor) }]
          "
          :disabled="soloLectura"
          :aria-pressed="estaSeleccionado(valor.idValor)"
          @click="alternar(valor.idValor)"
        >
          <span
            v-if="usaColores"
            class="carac-card__circulo"
            :class="{ 'carac-card__circulo--otro': !valor.colorHex }"
            :style="valor.colorHex ? { background: valor.colorHex } : null"
            aria-hidden="true"
          />
          <span class="carac-card__valor-texto">{{ etiquetaValor(valor) }}</span>
        </button>
      </div>
    </template>

    <p v-else class="carac-card__hint">Sin configuración adicional.</p>
  </article>
</template>

<script>
import { reglasProyecto } from "../../utils/reglas.js";
import { esEnumerado, esNumerico } from "../../utils/proyectoConstants.js";
import {
  etiquetaCaracteristica,
  etiquetaValor,
  unidadCaracteristica,
} from "../../utils/requerimientoUi.js";

/*
 * Tarjeta de una característica técnica agregada al requerimiento.
 * Renderiza según el tipoDato del catálogo: rango numérico con unidad,
 * valores enumerados como píldoras o como muestras de color (colorHex).
 */
export default {
  name: "CaracteristicaRequerimientoCard",
  props: {
    caracteristica: {
      type: Object,
      required: true,
    },
    catalogo: {
      type: Object,
      default: null,
    },
    soloLectura: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  emits: ["quitar"],
  data() {
    return {
      reglas: reglasProyecto,
    };
  },
  computed: {
    titulo() {
      return etiquetaCaracteristica(this.catalogo) || "Característica";
    },
    numerica() {
      return esNumerico(this.catalogo?.tipoDato);
    },
    enumerada() {
      return esEnumerado(this.catalogo?.tipoDato);
    },
    unidad() {
      return unidadCaracteristica(this.catalogo);
    },
    valores() {
      return Array.isArray(this.catalogo?.valores) ? this.catalogo.valores : [];
    },
    usaColores() {
      return this.valores.some((valor) => !!valor.colorHex);
    },
  },
  methods: {
    etiquetaValor,
    estaSeleccionado(idValor) {
      return (this.caracteristica.valores || []).includes(idValor);
    },
    alternar(idValor) {
      if (this.soloLectura) return;
      const seleccionados = Array.isArray(this.caracteristica.valores)
        ? [...this.caracteristica.valores]
        : [];
      const indice = seleccionados.indexOf(idValor);
      if (indice >= 0) seleccionados.splice(indice, 1);
      else seleccionados.push(idValor);
      this.caracteristica.valores = seleccionados;
    },
  },
};
</script>

<style scoped>
.carac-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.carac-card__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.carac-card__titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.carac-card__quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--color-danger-text);
  cursor: pointer;
  transition: background 0.15s ease;
}

.carac-card__quitar:hover {
  background: var(--color-danger-soft);
}

.carac-card__quitar:focus-visible {
  outline: 2px solid var(--color-danger);
  outline-offset: 1px;
}

.carac-card__quitar .material-symbols-outlined {
  font-size: 1.1rem;
}

.carac-card__error {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-danger-text);
}

.carac-card__hint,
.carac-card__ayuda {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.carac-card__rango {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.carac-card__campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.carac-card__label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.carac-card__unidad {
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  background: var(--color-surface-muted);
  font-size: 0.78rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ── Valores enumerados: píldoras ── */
.carac-card__valores {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.carac-card__opcion {
  padding: 0.45rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.carac-card__opcion:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background: var(--color-surface-soft);
}

.carac-card__opcion:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.carac-card__opcion--activa {
  border-color: var(--color-primary-fill);
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}

.carac-card__opcion:disabled {
  cursor: default;
  opacity: 0.85;
}

/* ── Valores enumerados: muestras de color ── */
.carac-card__valores--colores {
  gap: 1rem 1.15rem;
}

.carac-card__color {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 68px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.72rem;
  line-height: 1.2;
  cursor: pointer;
}

.carac-card__circulo {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface-muted);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.carac-card__circulo--otro {
  border: 1px dashed var(--color-border-strong);
  background: transparent;
}

.carac-card__color--activo .carac-card__circulo {
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 4px var(--color-text);
}

.carac-card__color:hover:not(:disabled) .carac-card__circulo {
  transform: scale(1.06);
}

.carac-card__color:focus-visible {
  outline: none;
}

.carac-card__color:focus-visible .carac-card__circulo {
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 4px var(--color-primary);
}

.carac-card__color:disabled {
  cursor: default;
}

.carac-card__valor-texto {
  text-align: center;
  overflow-wrap: anywhere;
}

@media (max-width: 520px) {
  .carac-card__rango {
    grid-template-columns: 1fr;
  }
}
</style>
