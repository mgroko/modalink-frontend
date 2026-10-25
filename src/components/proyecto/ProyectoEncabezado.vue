<template>
  <section class="proyecto-encabezado">
    <div class="proyecto-encabezado__hero">
      <div class="proyecto-encabezado__cuerpo">
        <div class="proyecto-encabezado__titular">
          <h1 class="proyecto-encabezado__nombre">{{ proyecto.nombre }}</h1>
          <EstadoProyectoBadge :estado="proyecto.estado" />
        </div>

        <p v-if="proyecto.descripcion" class="proyecto-encabezado__descripcion">
          {{ proyecto.descripcion }}
        </p>

        <p class="proyecto-encabezado__subtitulo">{{ subtituloMostrar }}</p>
      </div>

      <div v-if="$slots.acciones" class="proyecto-encabezado__acciones">
        <slot name="acciones" />
      </div>
    </div>

    <nav
      class="proyecto-encabezado__tabs"
      role="tablist"
      aria-label="Secciones del proyecto"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="proyecto-encabezado__tab"
        :class="{ 'proyecto-encabezado__tab--activa': tabActiva === tab.id }"
        :aria-selected="tabActiva === tab.id"
        @click="$emit('cambiar-tab', tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>
  </section>
</template>

<script>
import EstadoProyectoBadge from "./EstadoProyectoBadge.vue";
import { formatearFechaCorta } from "../../utils/fechas.js";
import {
  ESTADOS_PROYECTO,
  ETIQUETAS_PRIVACIDAD,
  ROLES_PROYECTO,
  etiquetaRolProyecto,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

export default {
  name: "ProyectoEncabezado",
  components: { EstadoProyectoBadge },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
    tabActiva: {
      type: String,
      default: "informacion",
    },
    mostrarPlanificacion: {
      type: Boolean,
      default: true,
    },
    /** Texto opcional; si no llega, se compone con rol, privacidad, ubicación y entrega. */
    subtitulo: {
      type: String,
      default: "",
    },
  },
  emits: ["cambiar-tab"],
  computed: {
    tabs() {
      const tabs = [{ id: "informacion", label: "Información general" }];
      if (this.mostrarPlanificacion) {
        tabs.push({ id: "planificacion", label: "Planificación" });
      }
      return tabs;
    },
    subtituloMostrar() {
      if (this.subtitulo) return this.subtitulo;

      const partes = [];
      if (this.proyecto?.esMiembro) {
        partes.push(`Tu rol: ${etiquetaRolProyecto(this.proyecto.rolUsuario)} de proyecto`);

        if (
          normalizarEstadoProyecto(this.proyecto.estado) ===
          ESTADOS_PROYECTO.BORRADOR
        ) {
          partes.push(
            this.proyecto.rolUsuario === ROLES_PROYECTO.DIRECTOR
              ? "Solo vos podés ver el borrador hasta publicarlo"
              : "Este proyecto está en borrador: aún no es visible para otros perfiles"
          );
        }
      } else {
        partes.push("Vista pública del proyecto");
      }

      if (this.proyecto?.privacidad) {
        partes.push(
          ETIQUETAS_PRIVACIDAD[this.proyecto.privacidad] || this.proyecto.privacidad
        );
      }

      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      if (ciudad && provincia) partes.push(`${ciudad}, ${provincia}`);
      else if (ciudad || provincia) partes.push(ciudad || provincia);

      if (this.proyecto?.fechaEntregaEstipulada) {
        partes.push(`Entrega: ${formatearFechaCorta(this.proyecto.fechaEntregaEstipulada)}`);
      }

      return partes.join(" · ");
    },
  },
};
</script>

<style scoped>
.proyecto-encabezado {
  padding: 1.35rem 1.5rem 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.proyecto-encabezado__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.proyecto-encabezado__cuerpo {
  flex: 1;
  min-width: 260px;
}

.proyecto-encabezado__titular {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.proyecto-encabezado__nombre {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.proyecto-encabezado__descripcion {
  margin: 0.6rem 0 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-text);
}

.proyecto-encabezado__subtitulo {
  margin: 0.7rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.proyecto-encabezado__acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.proyecto-encabezado__tabs {
  display: flex;
  gap: 1.75rem;
  margin: 1.1rem -1.5rem 0;
  padding: 0 1.5rem;
  border-top: 1px solid var(--color-border-soft);
  overflow-x: auto;
}

.proyecto-encabezado__tab {
  padding: 0.8rem 0.1rem 0.7rem;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.proyecto-encabezado__tab:hover {
  color: var(--color-text);
}

.proyecto-encabezado__tab--activa {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 700;
}

.proyecto-encabezado__tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
