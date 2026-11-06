<template>
  <article
    class="calificacion-miembro"
    :class="{
      'calificacion-miembro--error': tieneError,
      'calificacion-miembro--completo': completo,
      'calificacion-miembro--solo-lectura': yaCalificado,
    }"
  >
    <div class="calificacion-miembro__cabecera">
      <span
        class="calificacion-miembro__avatar"
        :style="{ backgroundColor: colorAvatarMiembro(miembro?.idPerfil) }"
        aria-hidden="true"
      >
        {{ inicialesMiembro(miembro) }}
      </span>

      <div class="calificacion-miembro__datos">
        <p class="calificacion-miembro__nombre">{{ nombre }}</p>
        <p v-if="detalle" class="calificacion-miembro__detalle">
          {{ detalle }}
        </p>
      </div>

      <span v-if="yaCalificado" class="calificacion-miembro__chip">
        Ya calificado
      </span>
    </div>

    <div class="calificacion-miembro__calificacion">
      <div
        class="calificacion-miembro__estrellas"
        role="radiogroup"
        :aria-label="`Valoración para ${nombre}`"
      >
        <button
          v-for="numero in 5"
          :key="numero"
          type="button"
          class="calificacion-miembro__estrella"
          :class="{
            'calificacion-miembro__estrella--activa': numero <= valoracion,
          }"
          role="radio"
          :aria-checked="valoracion === numero"
          :aria-label="`${numero} de 5 estrellas: ${etiquetaValoracion(numero)}`"
          :disabled="disabled || yaCalificado"
          @click="seleccionar(numero)"
          @keydown.left.prevent="mover(-1)"
          @keydown.right.prevent="mover(1)"
        >
          <span class="material-symbols-outlined" aria-hidden="true">star</span>
        </button>
      </div>

      <span
        class="calificacion-miembro__etiqueta"
        :class="{
          'calificacion-miembro__etiqueta--activa': valoracion > 0,
        }"
      >
        {{ etiquetaMostrar }}
      </span>
    </div>

    <p v-if="errorValoracion" class="calificacion-miembro__error" role="alert">
      {{ errorValoracion }}
    </p>

    <template v-if="yaCalificado">
      <p class="calificacion-miembro__resena-lectura">
        {{ resenia || "Ya calificaste a este integrante." }}
      </p>
    </template>

    <VaTextarea
      v-else
      :model-value="resenia"
      label="Reseña obligatoria"
      placeholder="Contá cómo fue trabajar con esta persona"
      :max-length="LIMITE_RESENIA"
      counter
      :rows="2"
      :disabled="disabled"
      :error="!!errorResenia"
      :error-messages="errorResenia || undefined"
      @update:model-value="$emit('update:resenia', $event)"
      @blur="$emit('touch-resenia')"
    />
  </article>
</template>

<script>
import {
  LIMITE_RESENIA,
  etiquetaValoracion,
} from "../../utils/finalizacionConstants.js";
import {
  colorAvatarMiembro,
  inicialesMiembro,
  nombreCompletoMiembro,
  textoRolMiembro,
} from "../../utils/integranteConstants.js";

/*
 * Tarjeta de calificación de un integrante para UC-37.
 * La usa el modal de finalización del director y la vista de calificación
 * posterior entre participantes. No calcula permisos ni envía requests:
 * recibe el estado del formulario y emite los cambios al contenedor.
 */
export default {
  name: "CalificacionMiembroCard",
  props: {
    miembro: {
      type: Object,
      required: true,
    },
    valoracion: {
      type: Number,
      default: 0,
    },
    resenia: {
      type: String,
      default: "",
    },
    nombreProfesion: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    errorValoracion: {
      type: String,
      default: "",
    },
    errorResenia: {
      type: String,
      default: "",
    },
    yaCalificado: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "update:valoracion",
    "update:resenia",
    "touch-valoracion",
    "touch-resenia",
  ],
  data() {
    return {
      LIMITE_RESENIA,
    };
  },
  computed: {
    nombre() {
      return (
        this.miembro?.nombreArtistico ||
        nombreCompletoMiembro(this.miembro) ||
        "Integrante"
      );
    },
    detalle() {
      const rol = this.miembro?.rol ? textoRolMiembro(this.miembro) : "";
      return [this.nombreProfesion, rol].filter(Boolean).join(" · ");
    },
    completo() {
      return (
        this.yaCalificado ||
        (this.valoracion > 0 && String(this.resenia || "").trim().length > 0)
      );
    },
    etiquetaMostrar() {
      if (this.yaCalificado && !this.valoracion) return "Ya calificado";
      return etiquetaValoracion(this.valoracion);
    },
    tieneError() {
      return !!this.errorValoracion || !!this.errorResenia;
    },
  },
  methods: {
    etiquetaValoracion,
    colorAvatarMiembro,
    inicialesMiembro,
    seleccionar(valoracion) {
      if (this.disabled || this.yaCalificado) return;
      this.$emit("update:valoracion", valoracion);
      this.$emit("touch-valoracion");
    },
    mover(delta) {
      if (this.disabled || this.yaCalificado) return;
      const actual = Number(this.valoracion) || 0;
      const siguiente = Math.min(5, Math.max(1, actual + delta));
      this.seleccionar(siguiente);
    },
  },
};
</script>

<style scoped>
.calificacion-miembro {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.calificacion-miembro--error {
  border-color: var(--color-danger-border);
}

.calificacion-miembro--completo {
  border-color: var(--color-success-border, var(--color-border));
}

.calificacion-miembro--solo-lectura {
  background: var(--color-surface-soft);
}

.calificacion-miembro__cabecera {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.calificacion-miembro__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex: none;
}

.calificacion-miembro__datos {
  flex: 1;
  min-width: 0;
}

.calificacion-miembro__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.calificacion-miembro__detalle {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.calificacion-miembro__chip {
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.calificacion-miembro__calificacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.calificacion-miembro__estrellas {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.calificacion-miembro__estrella {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.05rem;
  border: 0;
  background: transparent;
  color: var(--color-border-strong);
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s ease, transform 0.1s ease;
}

.calificacion-miembro__estrella .material-symbols-outlined {
  font-size: 1.65rem;
}

.calificacion-miembro__estrella:hover:not(:disabled) {
  color: var(--color-warning);
  transform: scale(1.08);
}

.calificacion-miembro__estrella--activa {
  color: var(--color-warning);
}

.calificacion-miembro__estrella:disabled {
  cursor: default;
  opacity: 0.55;
}

.calificacion-miembro__estrella:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.calificacion-miembro__etiqueta {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 500;
}

.calificacion-miembro__etiqueta--activa {
  color: var(--color-warning-text);
}

.calificacion-miembro__error {
  margin: -0.25rem 0 0;
  color: var(--color-danger-text);
  font-size: 0.76rem;
  font-weight: 600;
}

.calificacion-miembro__resena-lectura {
  margin: 0;
  padding: 0.65rem 0.75rem;
  background: var(--color-surface-muted);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
</style>
