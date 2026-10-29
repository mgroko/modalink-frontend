<template>
  <li
    class="notificacion-item"
    :class="{ 'notificacion-item--no-leida': !notificacion.leida }"
  >
    <span
      class="notificacion-item__icono material-symbols-outlined"
      aria-hidden="true"
    >
      {{ icono }}
    </span>

    <div class="notificacion-item__contenido">
      <p class="notificacion-item__titulo">{{ titulo }}</p>
      <p class="notificacion-item__mensaje">{{ notificacion.mensaje }}</p>

      <div class="notificacion-item__pie">
        <span class="notificacion-item__fecha">{{ fecha }}</span>
        <a
          v-if="enlace"
          :href="enlace.href"
          class="notificacion-item__enlace"
          :class="{ 'notificacion-item__enlace--cargando': activando }"
          :aria-disabled="activando ? 'true' : 'false'"
          @click.prevent="alNavegar"
        >
          {{ enlace.etiqueta }}
          <span class="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </a>
      </div>
    </div>

    <button
      v-if="!notificacion.leida"
      type="button"
      class="notificacion-item__punto"
      :disabled="marcando"
      :aria-label="`Marcar ${titulo} como leída`"
      title="Marcar como leída"
      @click.stop="$emit('marcar-leida', notificacion)"
    ></button>
    <span v-else class="notificacion-item__punto-hueco" aria-hidden="true"></span>
  </li>
</template>

<script>
import {
  destinoNotificacion,
  etiquetaTipoNotificacion,
  iconoNotificacion,
} from "../../utils/notificacionConstants.js";
import { formatearFechaNotificacion } from "../../utils/fechas.js";
import { hrefNotificacion } from "../../utils/notificacionNavegacion.js";

export default {
  name: "NotificacionItem",
  props: {
    notificacion: {
      type: Object,
      required: true,
    },
    marcando: {
      type: Boolean,
      default: false,
    },
    activando: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["navegar", "marcar-leida"],
  computed: {
    titulo() {
      return (
        this.notificacion?.titulo ||
        etiquetaTipoNotificacion(this.notificacion?.tipo)
      );
    },
    icono() {
      return iconoNotificacion(this.notificacion?.tipo);
    },
    fecha() {
      return formatearFechaNotificacion(this.notificacion?.fechaGenerada);
    },
    destino() {
      return this.notificacion?.destino ?? destinoNotificacion(this.notificacion);
    },
    enlace() {
      if (!this.destino) return null;
      return {
        etiqueta: this.destino.etiqueta,
        href: hrefNotificacion(this.notificacion, this.$router),
      };
    },
  },
  methods: {
    alNavegar() {
      if (this.activando) return;
      this.$emit("navegar", this.notificacion);
    },
  },
};
</script>

<style scoped>
.notificacion-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border-soft);
  transition: background-color 0.15s ease;
}

.notificacion-item:last-child {
  border-bottom: 0;
}

.notificacion-item:hover {
  background: var(--color-bg);
}

.notificacion-item--no-leida {
  background: var(--color-surface-soft);
}

.notificacion-item--no-leida:hover {
  background: var(--color-bg);
}

.notificacion-item__icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 1.05rem;
}

.notificacion-item__contenido {
  min-width: 0;
}

.notificacion-item__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notificacion-item__mensaje {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.notificacion-item__pie {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.4rem;
}

.notificacion-item__fecha {
  color: var(--color-text-subtle);
  font-size: 0.7rem;
  white-space: nowrap;
}

.notificacion-item__enlace {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.notificacion-item__enlace:hover {
  text-decoration: underline;
}

.notificacion-item__enlace--cargando {
  cursor: wait;
  opacity: 0.6;
  pointer-events: none;
}

.notificacion-item__enlace .material-symbols-outlined {
  font-size: 0.9rem;
}

.notificacion-item__punto,
.notificacion-item__punto-hueco {
  width: 9px;
  height: 9px;
  margin-top: 0.3rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.notificacion-item__punto {
  padding: 0;
  border: 0;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 0 3px var(--color-info-soft);
}

.notificacion-item__punto:disabled {
  cursor: default;
  opacity: 0.5;
}

.notificacion-item__punto-hueco {
  background: transparent;
}
</style>
