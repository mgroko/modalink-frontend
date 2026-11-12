<template>
  <div
    v-if="cargando"
    class="historial-lista__estado"
    role="status"
    aria-live="polite"
  >
    <span class="historial-lista__spinner" aria-hidden="true"></span>
    Cargando historial...
  </div>

  <div v-else-if="error" class="historial-lista__estado">
    <p class="historial-lista__error">{{ error }}</p>
    <VaButton preset="secondary" icon="mso-refresh" @click="$emit('reintentar')">
      Reintentar
    </VaButton>
  </div>

  <p v-else-if="!proyectos.length" class="historial-lista__vacio">
    {{ textoVacio }}
  </p>

  <div v-else class="historial-lista">
    <article
      v-for="proyecto in proyectos"
      :key="proyecto.idProyecto"
      class="historial-lista__item"
      :class="{
        'historial-lista__item--clickeable': proyecto.puedeVerProyecto === true,
      }"
      :role="proyecto.puedeVerProyecto === true ? 'button' : undefined"
      :tabindex="proyecto.puedeVerProyecto === true ? 0 : undefined"
      @click="abrir(proyecto)"
      @keydown.enter.prevent="abrir(proyecto)"
      @keydown.space.prevent="abrir(proyecto)"
    >
      <div class="historial-lista__principal">
        <strong>{{ proyecto.nombre }}</strong>
        <EstadoProyectoBadge :estado="proyecto.estado" />
        <span
          v-if="proyecto.puedeVerProyecto === true"
          class="material-symbols-outlined historial-lista__chevron"
          aria-hidden="true"
        >
          chevron_right
        </span>
      </div>

      <p v-if="meta(proyecto)" class="historial-lista__meta">
        {{ meta(proyecto) }}
      </p>
    </article>
  </div>
</template>

<script>
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";
import { formatearMesAnio } from "../../utils/fechas.js";
import {
  ESTADOS_PROYECTO,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

/**
 * Lista presentacional del historial de proyectos de un perfil.
 * No conoce el perfil ni la paginación: sólo renderiza y emite acciones.
 */
export default {
  name: "HistorialProyectosLista",
  components: { EstadoProyectoBadge },
  props: {
    proyectos: {
      type: Array,
      default: () => [],
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    textoVacio: {
      type: String,
      default:
        "Todavía no hay proyectos finalizados o cancelados en este perfil.",
    },
  },
  emits: ["abrir", "reintentar"],
  methods: {
    abrir(proyecto) {
      if (proyecto?.puedeVerProyecto !== true) return;
      this.$emit("abrir", proyecto);
    },
    fechaCierre(proyecto) {
      const estado = normalizarEstadoProyecto(proyecto?.estado);
      const valor =
        estado === ESTADOS_PROYECTO.CANCELADO
          ? proyecto?.fechaCancelacion
          : proyecto?.fechaFinalizacion;
      return formatearMesAnio(valor);
    },
    meta(proyecto) {
      return [proyecto?.rol, this.fechaCierre(proyecto)]
        .filter(Boolean)
        .join(" · ");
    },
  },
};
</script>

<style scoped>
.historial-lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.historial-lista__item {
  padding: 0.75rem 0.85rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
}

.historial-lista__item--clickeable {
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.historial-lista__item--clickeable:hover,
.historial-lista__item--clickeable:focus-visible {
  background: var(--color-surface);
  border-color: var(--color-primary-light);
  outline: none;
}

.historial-lista__principal {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.historial-lista__principal strong {
  color: var(--color-text);
  font-size: 0.86rem;
}

.historial-lista__chevron {
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: 1.05rem;
}

.historial-lista__meta {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.historial-lista__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.historial-lista__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.historial-lista__error {
  max-width: 30rem;
  margin: 0;
  line-height: 1.5;
}

.historial-lista__spinner {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: historial-lista-girar 0.8s linear infinite;
}

@keyframes historial-lista-girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
