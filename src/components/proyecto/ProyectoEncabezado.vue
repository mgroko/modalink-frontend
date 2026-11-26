<template>
  <section class="proyecto-encabezado">
    <div class="proyecto-encabezado__hero">
      <div class="proyecto-encabezado__cuerpo">
        <div class="proyecto-encabezado__titular">
          <h1 class="proyecto-encabezado__nombre">{{ proyecto.nombre }}</h1>
          <EstadoProyectoBadge :estado="proyecto.estado" />
          <span
            v-if="proyecto.finalizacionPrematura"
            class="proyecto-encabezado__badge-prematura"
          >
            Finalizado anticipadamente
          </span>
        </div>

        <p
          v-if="mostrarDescripcion && proyecto.descripcion"
          class="proyecto-encabezado__descripcion"
        >
          {{ proyecto.descripcion }}
        </p>

        <p v-if="subtitulo" class="proyecto-encabezado__subtitulo">
          {{ subtitulo }}
        </p>

        <div v-else-if="chips.length" class="proyecto-encabezado__chips">
          <span
            v-for="chip in chips"
            :key="chip.texto"
            class="proyecto-encabezado__chip"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              {{ chip.icono }}
            </span>
            {{ chip.texto }}
          </span>
        </div>

        <p v-if="notaEstado" class="proyecto-encabezado__nota">
          {{ notaEstado }}
        </p>
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
        <span v-if="tab.badge" class="proyecto-encabezado__badge">
          {{ tab.badge }}
        </span>
        <span
          v-if="tab.alerta"
          class="proyecto-encabezado__alerta"
          title="Hay procesos de reemplazo sin candidatos"
          aria-label="Hay procesos de reemplazo sin candidatos"
        ></span>
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
    /** Pestaña de postulaciones: personal requerido o gestión según el rol. */
    mostrarPostulaciones: {
      type: Boolean,
      default: true,
    },
    /** Pestaña Miembros (UC-38/UC-40). Sólo miembros activos. */
    mostrarIntegrantes: {
      type: Boolean,
      default: false,
    },
    /** Pestaña Chat grupal (UC-41). Sólo miembros activos. */
    mostrarChat: {
      type: Boolean,
      default: false,
    },
    /** Pestaña Historial. Visible para miembros activos del proyecto. */
    mostrarHistorial: {
      type: Boolean,
      default: false,
    },
    /** Pestaña Reemplazos. Sólo para el Director activo. */
    mostrarReemplazos: {
      type: Boolean,
      default: false,
    },
    /** Pestaña Contratos (UC-68). Visible para miembros; el backend filtra. */
    mostrarContratos: {
      type: Boolean,
      default: false,
    },
    /** Procesos que requieren una acción del director. */
    reemplazosPendientes: {
      type: Number,
      default: 0,
    },
    /** Procesos sin candidatos: aviso separado del badge de acciones. */
    reemplazosSinCandidatos: {
      type: Number,
      default: 0,
    },
    /** Texto opcional; si no llega, se compone con rol, privacidad, ubicación y entrega. */
    subtitulo: {
      type: String,
      default: "",
    },
    /**
     * La descripción puede ocultarse del encabezado cuando la pestaña activa
     * ya la muestra en su propio panel (Información general).
     */
    mostrarDescripcion: {
      type: Boolean,
      default: true,
    },
    /**
     * Los detalles de privacidad, ubicación y entrega pueden omitirse del
     * subtítulo cuando la pestaña activa ya los muestra en un panel propio.
     */
    mostrarDetalles: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["cambiar-tab"],
  computed: {
    tabs() {
      const tabs = [{ id: "informacion", label: "Información general" }];
      if (this.mostrarPlanificacion) {
        tabs.push({ id: "planificacion", label: "Planificación" });
      }
      if (this.mostrarIntegrantes) {
        tabs.push({ id: "integrantes", label: "Miembros" });
      }
      if (this.mostrarChat) {
        tabs.push({ id: "chat", label: "Chat grupal" });
      }
      if (this.mostrarHistorial) {
        tabs.push({ id: "historial", label: "Historial" });
      }
      if (this.mostrarReemplazos) {
        tabs.push({
          id: "reemplazos",
          label: "Reemplazos",
          badge: this.reemplazosPendientes || null,
          alerta: this.reemplazosSinCandidatos > 0,
        });
      }
      if (this.mostrarPostulaciones) {
        tabs.push({
          id: "postulaciones",
          label: "Postulaciones",
          badge: this.proyecto?.postulacionesPendientes,
        });
      }
      if (this.mostrarContratos) {
        tabs.push({ id: "contratos", label: "Contratos" });
      }
      return tabs;
    },
    /**
     * Chips de contexto del proyecto: visibilidad/rol, privacidad, ubicación y
     * entrega. En la pestaña Información general los dos últimos se omiten
     * porque el panel ya los muestra.
     */
    chips() {
      const chips = [];
      const privacidad =
        ETIQUETAS_PRIVACIDAD[this.proyecto?.privacidad] ||
        this.proyecto?.privacidad ||
        "";

      if (this.proyecto?.esMiembro) {
        chips.push({
          icono: "badge",
          texto: `Tu rol: ${etiquetaRolProyecto(this.proyecto.rolUsuario)} de proyecto`,
        });
      } else {
        chips.push({
          icono: "public",
          texto: privacidad ? `Vista pública · ${privacidad}` : "Vista pública",
        });
      }

      if (!this.mostrarDetalles) return chips;

      if (this.proyecto?.esMiembro && privacidad) {
        chips.push({ icono: "visibility", texto: privacidad });
      }

      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      if (ciudad && provincia) chips.push({ icono: "location_on", texto: `${ciudad}, ${provincia}` });
      else if (ciudad || provincia) chips.push({ icono: "location_on", texto: ciudad || provincia });

      if (this.proyecto?.fechaEntregaEstipulada) {
        chips.push({
          icono: "calendar_month",
          texto: `Entrega: ${formatearFechaCorta(this.proyecto.fechaEntregaEstipulada)}`,
        });
      }

      return chips;
    },
    /** Aclaración extra sólo para borradores vistos por sus miembros. */
    notaEstado() {
      if (
        !this.proyecto?.esMiembro ||
        normalizarEstadoProyecto(this.proyecto.estado) !== ESTADOS_PROYECTO.BORRADOR
      ) {
        return "";
      }
      return this.proyecto.rolUsuario === ROLES_PROYECTO.DIRECTOR
        ? "Solo vos podés ver el borrador hasta publicarlo"
        : "Este proyecto está en borrador: aún no es visible para otros perfiles";
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
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}

.proyecto-encabezado__badge-prematura {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-warning-border, var(--color-border));
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
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

.proyecto-encabezado__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.proyecto-encabezado__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.4;
}

.proyecto-encabezado__chip .material-symbols-outlined {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.proyecto-encabezado__nota {
  margin: 0.6rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
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
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
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

.proyecto-encabezado__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.32rem;
  border-radius: 999px;
  background: var(--color-danger-fill);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
}

.proyecto-encabezado__alerta {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-warning-text);
  box-shadow: 0 0 0 2px var(--color-warning-soft);
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

@media (max-width: 640px) {
  .proyecto-encabezado {
    padding: 1rem 1rem 0;
  }

  .proyecto-encabezado__cuerpo {
    min-width: 0;
  }

  .proyecto-encabezado__nombre {
    font-size: 1.25rem;
  }

  .proyecto-encabezado__tabs {
    gap: 1rem;
    margin-right: -1rem;
    margin-left: -1rem;
    padding: 0 1rem;
  }
}
</style>
