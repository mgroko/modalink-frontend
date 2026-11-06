<template>
  <div class="campo-hora" :class="{ 'campo-hora--error': error }">
    <span v-if="label" class="campo-hora__label">{{ label }}</span>

    <div class="campo-hora__fila">
      <VaSelect
        class="campo-hora__select"
        :model-value="hora"
        :options="opcionesHora"
        placeholder="HH"
        aria-label="Hora"
        :error="error"
        :disabled="disabled"
        no-options-text="Sin horas"
        @update:model-value="onHora"
      />

      <span class="campo-hora__separador" aria-hidden="true">:</span>

      <VaSelect
        class="campo-hora__select"
        :model-value="minuto"
        :options="opcionesMinuto"
        placeholder="MM"
        aria-label="Minutos"
        :error="error"
        :disabled="disabled"
        no-options-text="Sin minutos"
        @update:model-value="onMinuto"
      />

      <button
        v-if="tieneValor && !disabled"
        type="button"
        class="campo-hora__limpiar"
        aria-label="Quitar horario"
        title="Quitar horario"
        @click="limpiar"
      >
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>

    <span v-if="error && errorMessage" class="campo-hora__mensaje campo-hora__mensaje--error">
      {{ errorMessage }}
    </span>
    <span v-else-if="hint" class="campo-hora__mensaje">
      {{ hint }}
    </span>
  </div>
</template>

<script>
const HORAS = Array.from({ length: 24 }, (_, indice) =>
  String(indice).padStart(2, "0")
);

const MINUTOS = Array.from({ length: 12 }, (_, indice) =>
  String(indice * 5).padStart(2, "0")
);

/**
 * Campo de hora `HH:mm` con dos desplegables (hora y minutos).
 * Evita el picker nativo de `input[type="time"]`.
 */
export default {
  name: "CampoHora",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
    hint: {
      type: String,
      default: "",
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      hora: null,
      minuto: null,
    };
  },
  computed: {
    opcionesHora() {
      return HORAS;
    },
    opcionesMinuto() {
      if (this.minuto && !MINUTOS.includes(this.minuto)) {
        return [...MINUTOS, this.minuto].sort((a, b) => Number(a) - Number(b));
      }
      return MINUTOS;
    },
    tieneValor() {
      return this.hora != null || this.minuto != null;
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(valor) {
        const { hora, minuto } = this.separarHora(valor);
        if (this.hora === hora && this.minuto === minuto) return;
        this.hora = hora;
        this.minuto = minuto;
      },
    },
  },
  methods: {
    separarHora(valor) {
      if (!valor) return { hora: null, minuto: null };
      const coincidencia = String(valor).match(/^(\d{1,2}):(\d{2})/);
      if (!coincidencia) return { hora: null, minuto: null };

      return {
        hora: coincidencia[1].padStart(2, "0"),
        minuto: coincidencia[2],
      };
    },
    onHora(valor) {
      this.hora = valor;
      if (valor != null && this.minuto == null) {
        this.minuto = "00";
      }
      this.emitir();
    },
    onMinuto(valor) {
      this.minuto = valor;
      this.emitir();
    },
    emitir() {
      if (this.hora == null || this.minuto == null) {
        this.$emit("update:modelValue", "");
        return;
      }
      this.$emit("update:modelValue", `${this.hora}:${this.minuto}`);
    },
    limpiar() {
      this.hora = null;
      this.minuto = null;
      this.$emit("update:modelValue", "");
    },
  },
};
</script>

<style scoped>
.campo-hora {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.campo-hora__label {
  color: var(--color-text-muted);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.6px;
  line-height: 1.2;
  text-transform: uppercase;
}

.campo-hora__fila {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.campo-hora__select {
  flex: 1 1 0;
  min-width: 0;
}

.campo-hora__separador {
  color: var(--color-text-muted);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

.campo-hora__limpiar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.campo-hora__limpiar:hover {
  background: var(--color-hover);
  color: var(--color-text);
}

.campo-hora__limpiar .material-symbols-outlined {
  font-size: 1.1rem;
}

.campo-hora__mensaje {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.campo-hora__mensaje--error {
  color: var(--color-danger-text);
}
</style>
