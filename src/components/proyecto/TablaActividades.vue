<template>
  <div class="tabla-actividades">
    <table class="tabla-actividades__tabla">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Actividad</th>
          <th scope="col">Requerimientos</th>
          <th scope="col">Dur.</th>
          <th scope="col">Depende de</th>
          <th scope="col">Inicio – Fin</th>
          <th scope="col">Estado</th>
          <th scope="col"><span class="tabla-actividades__sr">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!actividades.length">
          <td colspan="8" class="tabla-actividades__vacio">
            {{ mensajeVacio }}
          </td>
        </tr>

        <tr
          v-for="(actividad, indice) in actividades"
          :key="actividad.idActividad"
          class="tabla-actividades__fila"
          :class="{
            'tabla-actividades__fila--resaltada':
              String(actividad.idActividad) === String(idActividadResaltada),
          }"
        >
          <td>{{ indice + 1 }}</td>

          <td>
            <span class="tabla-actividades__nombre">{{ actividad.nombre }}</span>
            <span v-if="actividad.descripcion" class="tabla-actividades__descripcion">
              {{ actividad.descripcion }}
            </span>
          </td>

          <td>
            <div v-if="resumenRequerimientos(actividad).length" class="tabla-actividades__chips">
              <span
                v-for="requerimiento in resumenRequerimientos(actividad)"
                :key="requerimiento"
                class="tabla-actividades__chip"
              >
                {{ requerimiento }}
              </span>
            </div>
            <span v-else class="tabla-actividades__vacio-celda">—</span>
          </td>

          <td class="tabla-actividades__duracion">
            {{ formatearDuracionMinutos(actividad.duracionMinutos) }}
          </td>

          <td>
            <div
              v-if="(actividad.predecesoras || []).length"
              class="tabla-actividades__chips"
            >
              <span
                v-for="predecesora in actividad.predecesoras"
                :key="predecesora.idActividad"
                class="tabla-actividades__chip tabla-actividades__chip--suave"
              >
                {{ predecesora.nombre }}
              </span>
            </div>
            <span v-else class="tabla-actividades__vacio-celda">—</span>
          </td>

          <td class="tabla-actividades__fechas">
            <span>{{ rangoFechas(actividad) }}</span>
            <small
              v-if="!actividad.fechaHoraInicio && actividad.inicioProyectado"
              class="tabla-actividades__fecha-proyectada"
            >
              Proyectada
            </small>
          </td>

          <td>
            <span class="tabla-actividades__estado" :style="estiloEstado(actividad.estado)">
              {{ etiquetaEstadoActividad(actividad.estado) }}
            </span>
          </td>

          <td>
            <div class="tabla-actividades__acciones">
              <button
                type="button"
                class="tabla-actividades__accion"
                :class="{ 'tabla-actividades__accion--habilitada': puedeEditarFila(actividad) }"
                :disabled="!puedeEditarFila(actividad)"
                :title="motivoNoEditable(actividad)"
                aria-label="Editar actividad"
                @click="$emit('editar-actividad', actividad)"
              >
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button
                type="button"
                class="tabla-actividades__accion tabla-actividades__accion--peligro"
                :class="{ 'tabla-actividades__accion--habilitada': puedeEliminarFila(actividad) }"
                :disabled="!puedeEliminarFila(actividad)"
                :title="motivoNoEliminable(actividad)"
                aria-label="Eliminar actividad"
                @click="$emit('eliminar-actividad', actividad)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import {
  coloresEstadoActividad,
  etiquetaEstadoActividad,
  formatearDuracionMinutos,
  puedeEditarActividad,
} from "../../utils/actividadConstants.js";
import { formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "TablaActividades",
  props: {
    actividades: {
      type: Array,
      default: () => [],
    },
    idActividadResaltada: {
      type: [Number, String],
      default: null,
    },
    mensajeVacio: {
      type: String,
      default: "Todavía no hay actividades en este proyecto.",
    },
    puedeEditar: {
      type: Boolean,
      default: false,
    },
    puedeEliminar: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["editar-actividad", "eliminar-actividad"],
  methods: {
    formatearDuracionMinutos,
    etiquetaEstadoActividad,
    puedeEditarFila(actividad) {
      return this.puedeEditar && puedeEditarActividad(actividad?.estado);
    },
    motivoNoEditable(actividad) {
      if (!this.puedeEditar) {
        return "No tenés permiso para modificar actividades en este proyecto.";
      }
      if (!puedeEditarActividad(actividad?.estado)) {
        return `La actividad está ${etiquetaEstadoActividad(actividad?.estado).toLowerCase()} y no se puede modificar.`;
      }
      return "Editar actividad";
    },
    puedeEliminarFila(actividad) {
      return this.puedeEliminar && puedeEditarActividad(actividad?.estado);
    },
    motivoNoEliminable(actividad) {
      if (!this.puedeEliminar) {
        return "No tenés permiso para eliminar actividades en este proyecto.";
      }
      if (!puedeEditarActividad(actividad?.estado)) {
        return `La actividad está ${etiquetaEstadoActividad(actividad?.estado).toLowerCase()} y no se puede eliminar.`;
      }
      return "Eliminar actividad";
    },
    resumenRequerimientos(actividad) {
      return (actividad?.requerimientos || []).map(
        (requerimiento) =>
          `${requerimiento.cantidad} × ${requerimiento.nombreProfesion}`
      );
    },
    rangoFechas(actividad) {
      const inicio = formatearFechaCorta(
        actividad?.fechaHoraInicio || actividad?.inicioProyectado
      );
      const fin = formatearFechaCorta(
        actividad?.fechaHoraFin || actividad?.finProyectado
      );
      if (inicio === "—" && fin === "—") return "—";
      return `${inicio} – ${fin}`;
    },
    estiloEstado(estado) {
      const colores = coloresEstadoActividad(estado);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
  },
};
</script>

<style scoped>
.tabla-actividades {
  width: 100%;
  overflow-x: auto;
}

.tabla-actividades__tabla {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.tabla-actividades__tabla th {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.tabla-actividades__tabla td {
  padding: 0.8rem 0.6rem;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text);
  font-size: 0.84rem;
  vertical-align: middle;
}

.tabla-actividades__fila--resaltada {
  background: var(--color-info-soft);
}

.tabla-actividades__fila--resaltada td:first-child {
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.tabla-actividades__nombre {
  display: block;
  font-weight: 600;
}

.tabla-actividades__descripcion {
  display: block;
  margin-top: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.35;
}

.tabla-actividades__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tabla-actividades__chip {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
}

.tabla-actividades__chip--suave {
  border-color: var(--color-border);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.tabla-actividades__duracion,
.tabla-actividades__fechas {
  white-space: nowrap;
}

.tabla-actividades__estado {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.tabla-actividades__vacio-celda {
  color: var(--color-text-muted);
}

.tabla-actividades__vacio {
  padding: 2.5rem 1rem !important;
  color: var(--color-text-muted) !important;
  font-style: italic;
  text-align: center;
}

.tabla-actividades__acciones {
  display: flex;
  gap: 0.35rem;
}

.tabla-actividades__accion {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.55;
}

.tabla-actividades__accion--habilitada {
  cursor: pointer;
  opacity: 1;
}

.tabla-actividades__accion--habilitada:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tabla-actividades__accion--peligro {
  color: var(--color-danger-text);
}

.tabla-actividades__accion .material-symbols-outlined {
  font-size: 1.05rem;
}

.tabla-actividades__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
