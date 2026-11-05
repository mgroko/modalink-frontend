<template>
  <article
    class="proyecto-home-card"
    role="button"
    tabindex="0"
    @click="$emit('abrir', proyecto)"
    @keydown.enter="$emit('abrir', proyecto)"
    @keydown.space.prevent="$emit('abrir', proyecto)"
  >
    <div class="proyecto-home-card__cabecera">
      <h3 class="proyecto-home-card__nombre">{{ proyecto.nombre }}</h3>
      <EstadoProyectoBadge :estado="proyecto.estado" />
    </div>

    <div v-if="proyecto.nombreDirector" class="proyecto-home-card__director">
      <span class="proyecto-home-card__avatar" aria-hidden="true">{{ inicialDirector }}</span>
      <span>Dirige {{ proyecto.nombreDirector }}</span>
    </div>

    <p class="proyecto-home-card__descripcion">
      {{ proyecto.descripcion || "Sin descripción." }}
    </p>

    <div class="proyecto-home-card__pie">
      <span class="proyecto-home-card__meta">
        <span class="material-symbols-outlined" aria-hidden="true">event</span>
        {{ fechaInicio ? `Inicia ${fechaInicio}` : "Sin fecha de inicio" }}
      </span>
      <span v-if="etiquetaPrivacidad" class="proyecto-home-card__privacidad">
        {{ etiquetaPrivacidad }}
      </span>
    </div>
  </article>
</template>

<script>
import EstadoProyectoBadge from "../proyecto/EstadoProyectoBadge.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "ProyectoHomeCard",
  components: { EstadoProyectoBadge },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
  },
  emits: ["abrir"],
  computed: {
    inicialDirector() {
      return String(this.proyecto?.nombreDirector || "?").charAt(0).toUpperCase();
    },
    fechaInicio() {
      const fecha = this.proyecto?.fechaInicio;
      if (!fecha) return "";
      return formatearFechaCorta(fecha);
    },
    etiquetaPrivacidad() {
      const privacidad = String(this.proyecto?.privacidad || "").toUpperCase();
      if (privacidad === "PRIVADO") return "Privado";
      if (privacidad === "OCULTO") return "Oculto";
      if (privacidad === "PUBLICO") return "Público";
      return "";
    },
  },
};
</script>

<style scoped>
.proyecto-home-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.proyecto-home-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
}

.proyecto-home-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.proyecto-home-card__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.proyecto-home-card__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.proyecto-home-card__director {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.proyecto-home-card__avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  color: #ffffff;
  font-size: 0.66rem;
  font-weight: 700;
}

.proyecto-home-card__director > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proyecto-home-card__descripcion {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.proyecto-home-card__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  color: var(--color-text-muted);
  font-size: 0.7rem;
}

.proyecto-home-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.proyecto-home-card__meta .material-symbols-outlined {
  font-size: 0.95rem;
}

.proyecto-home-card__privacidad {
  flex: none;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 500;
}
</style>
