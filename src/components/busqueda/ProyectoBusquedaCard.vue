<template>
  <article
    class="proyecto-busqueda"
    role="button"
    tabindex="0"
    @click="$emit('abrir', proyecto)"
    @keydown.enter="$emit('abrir', proyecto)"
    @keydown.space.prevent="$emit('abrir', proyecto)"
  >
    <div class="proyecto-busqueda__cuerpo">
      <div class="proyecto-busqueda__header">
        <h3 class="proyecto-busqueda__nombre">{{ proyecto.nombre }}</h3>
        <EstadoProyectoBadge :estado="proyecto.estado" />
      </div>

      <p v-if="proyecto.descripcion" class="proyecto-busqueda__descripcion">
        {{ proyecto.descripcion }}
      </p>

      <p v-if="proyecto.nombreDirector" class="proyecto-busqueda__director">
        <span class="material-symbols-outlined">person</span>
        {{ proyecto.nombreDirector }}
      </p>

      <p v-if="ubicacion" class="proyecto-busqueda__ubicacion">
        <span class="material-symbols-outlined">location_on</span>
        {{ ubicacion }}
      </p>

      <p v-if="proyecto.fechaInicio" class="proyecto-busqueda__fecha">
        <span class="material-symbols-outlined">event</span>
        Inicia: {{ formatFecha(proyecto.fechaInicio) }}
      </p>

      <VaBadge
        v-if="proyecto.privacidad"
        :text="etiquetaPrivacidad(proyecto.privacidad)"
        color="secondary"
        outline
        class="proyecto-busqueda__privacidad"
      />
    </div>

    <div class="proyecto-busqueda__footer">
      <VaButton
        color="primary"
        size="small"
        @click.stop="$emit('abrir', proyecto)"
      >
        Ver proyecto
      </VaButton>
    </div>
  </article>
</template>

<script>
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";
import { ETIQUETAS_PRIVACIDAD } from "../../utils/proyectoConstants.js";
import { formatUbicacion } from "../../utils/ubicacion.js";

/*
 * Tarjeta de proyecto de la búsqueda unificada. Extraída de BuscarPerfilView
 * para reutilizarla en la grilla y en la sección "Todo".
 */
export default {
  name: "ProyectoBusquedaCard",
  components: { EstadoProyectoBadge },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
  },
  emits: ["abrir"],
  computed: {
    ubicacion() {
      return formatUbicacion(this.proyecto);
    },
  },
  methods: {
    formatFecha(fecha) {
      const partes = String(fecha || "").split("-");
      if (partes.length !== 3) return fecha;
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    },
    etiquetaPrivacidad(privacidad) {
      return ETIQUETAS_PRIVACIDAD[privacidad] || privacidad;
    },
  },
};
</script>

<style scoped>
.proyecto-busqueda {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    transform 0.15s,
    border-color 0.15s;
}

.proyecto-busqueda:hover {
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.proyecto-busqueda:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.proyecto-busqueda__cuerpo {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.proyecto-busqueda__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.proyecto-busqueda__nombre {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
  min-width: 0;
  overflow-wrap: break-word;
}

.proyecto-busqueda__descripcion {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.proyecto-busqueda__director,
.proyecto-busqueda__ubicacion,
.proyecto-busqueda__fecha {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.proyecto-busqueda__director .material-symbols-outlined,
.proyecto-busqueda__ubicacion .material-symbols-outlined,
.proyecto-busqueda__fecha .material-symbols-outlined {
  font-size: 1rem;
}

.proyecto-busqueda__privacidad {
  align-self: flex-start;
  font-size: 0.75rem;
}

.proyecto-busqueda__footer {
  margin-top: auto;
  padding-top: 0.5rem;
}
</style>
