<template>
  <div class="tabla-actividades">
    <table class="tabla-actividades__tabla">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Actividad</th>
          <th scope="col">Responsables</th>
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
            'tabla-actividades__fila--cancelada':
              actividad.estado === 'CANCELADA',
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
            <div v-if="responsables(actividad).length" class="tabla-actividades__chips">
              <span
                v-for="responsable in responsables(actividad)"
                :key="responsable.clave"
                class="tabla-actividades__chip"
                :class="{
                  'tabla-actividades__chip--historico': responsable.historico,
                }"
                :title="responsable.etiqueta || undefined"
              >
                <span class="tabla-actividades__chip-texto">
                  {{ responsable.texto }}
                </span>
                <small
                  v-if="responsable.historico"
                  class="tabla-actividades__chip-estado"
                >
                  {{ responsable.etiqueta }}
                </small>
                <button
                  v-if="puedeDesasignarResponsable(actividad, responsable)"
                  type="button"
                  class="tabla-actividades__chip-quitar"
                  :title="motivoNoDesasignableResponsable(actividad, responsable)"
                  :aria-label="`Quitar a ${responsable.texto} de la actividad`"
                  @click.stop="
                    $emit('desasignar-actividad', {
                      actividad,
                      responsable,
                    })
                  "
                >
                  <span class="material-symbols-outlined" aria-hidden="true">
                    person_remove
                  </span>
                </button>
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
          </td>

          <td>
            <div class="tabla-actividades__estado-celda">
              <span class="tabla-actividades__estado" :style="estiloEstado(actividad.estado)">
                {{ etiquetaEstadoActividad(actividad.estado) }}
              </span>
              <ChipOrigenInicio :origen="actividad.origenInicio" />
            </div>
          </td>

          <td>
            <div class="tabla-actividades__acciones">
              <button
                type="button"
                class="tabla-actividades__accion"
                :class="{ 'tabla-actividades__accion--habilitada': puedeAsignarFila(actividad) }"
                :disabled="!puedeAsignarFila(actividad)"
                :title="motivoNoAsignableFila(actividad)"
                aria-label="Asignar miembro"
                @click="$emit('asignar-actividad', actividad)"
              >
                <span class="material-symbols-outlined">person_add</span>
              </button>
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
  esProfesionalHistorico,
  etiquetaEstadoActividad,
  etiquetaParticipacionProfesional,
  formatearDuracionMinutos,
  mostrarHistoricosEnActividad,
  profesionalesActuales,
  puedeEditarActividad,
} from "../../utils/actividadConstants.js";
import { idPerfilActivo } from "../../services/authState";
import { formatearFechaCorta } from "../../utils/fechas.js";
import ChipOrigenInicio from "./ChipOrigenInicio.vue";
import {
  motivoNoEliminableActividad,
  puedeEliminarActividad,
} from "../../utils/eliminacionActividadConstants.js";

export default {
  name: "TablaActividades",
  components: { ChipOrigenInicio },
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
    /** Estado del proyecto en forma legible ("Confirmado", "Borrador", ...). */
    estadoProyecto: {
      type: String,
      default: "",
    },
    puedeAsignar: {
      type: Boolean,
      default: false,
    },
    motivoNoAsignar: {
      type: String,
      default: "No podés asignar miembros a esta actividad.",
    },
    puedeDesasignar: {
      type: Boolean,
      default: false,
    },
    motivoNoDesasignar: {
      type: String,
      default: "No podés desasignar miembros de esta actividad.",
    },
  },
  emits: [
    "editar-actividad",
    "eliminar-actividad",
    "asignar-actividad",
    "desasignar-actividad",
  ],
  methods: {
    formatearDuracionMinutos,
    etiquetaEstadoActividad,
    puedeAsignarFila(actividad) {
      return this.puedeAsignar && puedeEditarActividad(actividad?.estado);
    },
    motivoNoAsignableFila(actividad) {
      if (!this.puedeAsignar) {
        return this.motivoNoAsignar;
      }
      if (!puedeEditarActividad(actividad?.estado)) {
        return `La actividad está ${etiquetaEstadoActividad(actividad?.estado).toLowerCase()} y no se puede asignar.`;
      }
      return "Asignar miembro";
    },
    puedeDesasignarResponsable(actividad, responsable) {
      return (
        this.puedeDesasignar &&
        puedeEditarActividad(actividad?.estado) &&
        responsable?.idAsignacionActividad != null &&
        !responsable?.historico &&
        responsable?.activo !== false
      );
    },
    motivoNoDesasignableResponsable(actividad, responsable) {
      if (!this.puedeDesasignar) return this.motivoNoDesasignar;
      if (!puedeEditarActividad(actividad?.estado)) {
        return `La actividad está ${etiquetaEstadoActividad(actividad?.estado).toLowerCase()} y no se puede desasignar.`;
      }
      if (responsable?.historico || responsable?.activo === false) {
        return "El miembro ya no está activo en el proyecto.";
      }
      return `Quitar a ${responsable?.texto || "este miembro"} de la actividad`;
    },
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
      return puedeEliminarActividad({
        tienePermiso: this.puedeEliminar,
        estadoProyecto: this.estadoProyecto,
        estadoActividad: actividad?.estado,
      });
    },
    motivoNoEliminable(actividad) {
      return motivoNoEliminableActividad({
        tienePermiso: this.puedeEliminar,
        estadoProyecto: this.estadoProyecto,
        estadoActividad: actividad?.estado,
      });
    },
    responsables(actividad) {
      const activo = idPerfilActivo();
      const lista = Array.isArray(actividad?.responsables)
        ? actividad.responsables
        : [];
      const visibles = mostrarHistoricosEnActividad(actividad?.estado)
        ? lista
        : profesionalesActuales(lista);

      return visibles.map((responsable, indice) => {
        const esVos =
          activo != null && String(responsable?.idPerfil) === String(activo);
        const historico = esProfesionalHistorico(responsable);
        return {
          clave: `${responsable?.idPerfil ?? "s"}-${responsable?.idUsuario ?? indice}`,
          texto: `${responsable?.nombreArtistico || "Perfil"}${esVos ? " (Vos)" : ""}`,
          historico,
          etiqueta: historico
            ? etiquetaParticipacionProfesional(responsable)
            : "",
          idAsignacionActividad: responsable?.idAsignacionActividad ?? null,
          idPerfil: responsable?.idPerfil ?? null,
          idUsuario: responsable?.idUsuario ?? null,
          activo: responsable?.activo,
          estadoParticipacion: responsable?.estadoParticipacion ?? null,
        };
      });
    },
    rangoFechas(actividad) {
      const inicio = formatearFechaCorta(actividad?.fechaHoraInicio);
      const fin = formatearFechaCorta(actividad?.fechaHoraFin);
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

.tabla-actividades__fila--cancelada {
  opacity: 0.6;
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

.tabla-actividades__chip--historico {
  border-style: dashed;
  border-color: var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
}

.tabla-actividades__chip-estado {
  margin-left: 0.3rem;
  font-size: 0.64rem;
  font-style: italic;
  font-weight: 600;
}

.tabla-actividades__chip-texto {
  vertical-align: middle;
}

.tabla-actividades__chip-quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  margin-left: 0.2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  vertical-align: middle;
}

.tabla-actividades__chip-quitar:hover,
.tabla-actividades__chip-quitar:focus-visible {
  background: color-mix(in srgb, currentColor 18%, transparent);
  outline: none;
}

.tabla-actividades__chip-quitar .material-symbols-outlined {
  font-size: 0.88rem;
}

.tabla-actividades__duracion,
.tabla-actividades__fechas {
  white-space: nowrap;
}

.tabla-actividades__estado-celda {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
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
