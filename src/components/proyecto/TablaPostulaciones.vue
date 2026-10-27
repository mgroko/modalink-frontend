<template>
  <div class="tabla-postulaciones__scroll">
    <table class="tabla-postulaciones" aria-label="Postulaciones del proyecto">
      <thead>
        <tr>
          <th scope="col">Postulante</th>
          <th scope="col">Profesión</th>
          <th scope="col">Tipo</th>
          <th scope="col">Requerimiento</th>
          <th scope="col">Cupo</th>
          <th scope="col">Postulación</th>
          <th scope="col">Estado</th>
          <th scope="col" class="tabla-postulaciones__th-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="postulacion in postulaciones"
          :key="`${postulacion.tipo}:${postulacion.idPostulacion}`"
          class="tabla-postulaciones__fila"
        >
          <td data-label="Postulante">
            <span class="tabla-postulaciones__postulante">
              {{ postulacion.nombreArtistico || "—" }}
            </span>
            <span class="tabla-postulaciones__secundario">
              Perfil #{{ postulacion.idPerfil }}
            </span>
          </td>

          <td data-label="Profesión">
            {{ postulacion.nombreProfesion || "—" }}
          </td>

          <td data-label="Tipo">
            {{ etiquetaTipoPostulacion(postulacion.tipo) }}
          </td>

          <td data-label="Requerimiento">
            <span class="tabla-postulaciones__requerimiento">
              {{ postulacion.descripcionRequerimiento || "Sin descripción" }}
            </span>
            <span
              v-if="postulacion.tipo === 'ACTIVIDAD'"
              class="tabla-postulaciones__secundario"
            >
              Actividad: {{ postulacion.nombreActividad || "—" }}
            </span>
          </td>

          <td data-label="Cupo">
            <span class="tabla-postulaciones__cupo">
              {{ textoCupo(postulacion) }}
            </span>
            <span
              v-if="postulacion.satisfecho"
              class="tabla-postulaciones__cupo-completo"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                check_circle
              </span>
              Cupo completo
            </span>
            <span
              v-else-if="Number(postulacion.faltantes) > 0"
              class="tabla-postulaciones__secundario"
            >
              {{ postulacion.faltantes }} disponible(s)
            </span>
          </td>

          <td data-label="Postulación">
            {{ formatearFecha(postulacion.fechaPostulacion) }}
          </td>

          <td data-label="Estado">
            <EstadoPostulacionBadge :estado="postulacion.estado" />
            <span
              v-if="
                postulacion.estado === 'ACEPTADA' && !postulacion.aportaCupo
              "
              class="tabla-postulaciones__cupo-liberado"
            >
              Cupo liberado
            </span>
          </td>

          <td data-label="Acciones" class="tabla-postulaciones__td-acciones">
            <div class="tabla-postulaciones__acciones">
              <VaButton
                v-if="postulacion.puedeAceptar"
                preset="primary"
                size="small"
                icon="mso-check"
                :disabled="accionEnCurso"
                :aria-label="`Aceptar la postulación de ${postulacion.nombreArtistico}`"
                @click="$emit('aceptar', postulacion)"
              >
                Aceptar
              </VaButton>
              <VaButton
                v-if="postulacion.puedeRechazar"
                preset="secondary"
                color="danger"
                size="small"
                icon="mso-close"
                :disabled="accionEnCurso"
                :aria-label="`Rechazar la postulación de ${postulacion.nombreArtistico}`"
                @click="$emit('rechazar', postulacion)"
              >
                Rechazar
              </VaButton>
              <span
                v-if="!postulacion.puedeAceptar && !postulacion.puedeRechazar"
                class="tabla-postulaciones__sin-accion"
              >
                —
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import EstadoPostulacionBadge from "./EstadoPostulacionBadge.vue";
import { formatearFecha } from "../../utils/fechas.js";
import { etiquetaTipoPostulacion } from "../../utils/postulacionConstants.js";

/*
 * Tabla de UC-74. Presentacional: no decide permisos, recibe
 * `puedeAceptar`/`puedeRechazar` del backend y deshabilita las acciones
 * mientras hay una gestión en vuelo.
 */
export default {
  name: "TablaPostulaciones",
  components: { EstadoPostulacionBadge },
  props: {
    postulaciones: {
      type: Array,
      default: () => [],
    },
    accionEnCurso: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["aceptar", "rechazar"],
  methods: {
    etiquetaTipoPostulacion,
    formatearFecha,
    textoCupo(postulacion) {
      const cubiertos = Number(postulacion?.cubiertos);
      const cantidad = Number(postulacion?.cantidadRequerida);
      if (!Number.isFinite(cubiertos) || !Number.isFinite(cantidad)) return "—";
      return `${cubiertos} / ${cantidad}`;
    },
  },
};
</script>

<style scoped>
.tabla-postulaciones__scroll {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.tabla-postulaciones {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  font-size: 0.84rem;
}

.tabla-postulaciones th,
.tabla-postulaciones td {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: top;
}

.tabla-postulaciones th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.tabla-postulaciones__fila:last-child td {
  border-bottom: none;
}

.tabla-postulaciones__fila:hover {
  background: var(--color-surface-muted);
}

.tabla-postulaciones__postulante {
  display: block;
  color: var(--color-text);
  font-weight: 600;
}

.tabla-postulaciones__secundario {
  display: block;
  margin-top: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.tabla-postulaciones__requerimiento {
  display: block;
  max-width: 22rem;
  line-height: 1.4;
}

.tabla-postulaciones__cupo {
  display: block;
  color: var(--color-text);
  font-weight: 600;
}

.tabla-postulaciones__cupo-completo,
.tabla-postulaciones__cupo-liberado {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  padding: 0.12rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.tabla-postulaciones__cupo-completo {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.tabla-postulaciones__cupo-liberado {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.tabla-postulaciones__cupo-completo .material-symbols-outlined {
  font-size: 0.9rem;
}

.tabla-postulaciones__td-acciones {
  width: 1%;
  white-space: nowrap;
}

.tabla-postulaciones__acciones {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tabla-postulaciones__sin-accion {
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .tabla-postulaciones__scroll {
    overflow-x: visible;
    border: none;
    background: transparent;
  }

  .tabla-postulaciones {
    min-width: 0;
  }

  .tabla-postulaciones thead {
    display: none;
  }

  .tabla-postulaciones,
  .tabla-postulaciones tbody,
  .tabla-postulaciones tr,
  .tabla-postulaciones td {
    display: block;
    width: 100%;
  }

  .tabla-postulaciones__fila {
    margin-bottom: 0.75rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
  }

  .tabla-postulaciones td {
    position: relative;
    display: block;
    padding: 0.35rem 0 0.35rem 8.25rem;
    border: none;
    text-align: left;
  }

  .tabla-postulaciones td::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    top: 0.35rem;
    width: 7.5rem;
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .tabla-postulaciones__requerimiento {
    max-width: none;
  }

  .tabla-postulaciones__td-acciones {
    width: 100%;
  }

  .tabla-postulaciones__acciones {
    justify-content: flex-start;
  }
}
</style>
