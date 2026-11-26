<template>
  <div
    v-if="message"
    class="alerta-base mt-4"
    :class="`alerta-base--${type}`"
    role="alert"
  >
    <span class="material-symbols-outlined alerta-base__icono" aria-hidden="true">
      {{ config.icon }}
    </span>
    <span class="alerta-base__texto">{{ message }}</span>
    <button
      v-if="hayAyuda"
      type="button"
      class="alerta-base__ayuda"
      @click="abrirAyuda"
    >
      ¿Qué significa?
    </button>
  </div>
</template>

<script>
import { state as authState } from "../services/authState";
import { consultar, abrir } from "../services/errorAssistantState";

export default {
  name: "BaseAlert",
  props: {
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ["success", "error", "warning"].includes(value),
    },
  },
  data() {
    return {
      hayAyuda: false,
      coincidencias: [],
      tokenAyuda: 0,
    };
  },
  computed: {
    config() {
      if (this.type === "success") {
        return { icon: "check_circle" };
      }
      if (this.type === "warning") {
        return { icon: "warning" };
      }
      return { icon: "error" };
    },
  },
  watch: {
    message() {
      this.actualizarAyuda();
    },
    type() {
      this.actualizarAyuda();
    },
  },
  mounted() {
    this.actualizarAyuda();
  },
  methods: {
    async actualizarAyuda() {
      const token = ++this.tokenAyuda;
      this.hayAyuda = false;
      this.coincidencias = [];

      if (this.type !== "error" || !this.message || !authState.usuario) {
        return;
      }
      if (/sesi[oó]n|csrf|seguridad de la sesi[oó]n/i.test(this.message)) {
        return;
      }

      const coincidencias = await consultar(this.message);
      if (token !== this.tokenAyuda) return;

      this.coincidencias = coincidencias;
      this.hayAyuda = coincidencias.length > 0;
    },
    abrirAyuda() {
      abrir(this.message, this.coincidencias);
    },
  },
};
</script>

<style scoped>
.alerta-base {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
}

.alerta-base--success {
  color: var(--color-success-text);
  background: var(--color-success-soft);
}

.alerta-base--error {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
}

.alerta-base--warning {
  color: var(--color-warning-text);
  background: var(--color-warning-soft);
}

.alerta-base__icono {
  flex-shrink: 0;
  font-size: 1.15rem;
}

.alerta-base__texto {
  min-width: 0;
  flex: 1;
}

.alerta-base__ayuda {
  flex-shrink: 0;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
}

.alerta-base__ayuda:hover {
  opacity: 0.8;
}
</style>
