<template>
  <div class="tabla-contratos__scroll">
    <table class="tabla-contratos" aria-label="Contratos">
      <thead>
        <tr>
          <th scope="col">Contrato</th>
          <th scope="col">Tipo</th>
          <th scope="col">Estado</th>
          <th scope="col">Emisión</th>
          <th scope="col">Firmas</th>
          <th scope="col">Mi firma</th>
          <th scope="col" class="tabla-contratos__th-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="contrato in contratos"
          :key="contrato.idContrato"
          class="tabla-contratos__fila"
        >
          <td data-label="Contrato">
            <button
              type="button"
              class="tabla-contratos__nombre"
              @click="$emit('ver', contrato)"
            >
              {{ contrato.nombre || `Contrato #${contrato.idContrato}` }}
            </button>
            <span class="tabla-contratos__secundario">
              {{ contrato.nombreProyecto || `Proyecto #${contrato.idProyecto}` }}
            </span>
          </td>

          <td data-label="Tipo">
            {{ contrato.nombreTipoAcuerdo || "—" }}
          </td>

          <td data-label="Estado">
            <EstadoContratoBadge :estado="contrato.estado" />
          </td>

          <td data-label="Emisión">
            {{ formatearFecha(contrato.fechaEmision) || "—" }}
          </td>

          <td data-label="Firmas">
            <span class="tabla-contratos__firmas">
              {{ contrato.firmados || 0 }} / {{ contrato.totalPartes || 0 }}
            </span>
            <span class="tabla-contratos__secundario">
              Versión {{ contrato.versionActual ?? "—" }}
            </span>
          </td>

          <td data-label="Mi firma">
            <span
              v-if="contrato.miEstadoFirma"
              class="tabla-contratos__mi-firma"
              :class="`tabla-contratos__mi-firma--${varianteMiFirma(contrato)}`"
            >
              {{ etiquetaEstadoFirmaContrato(contrato.miEstadoFirma) }}
            </span>
            <span
              v-else-if="contrato.puedeFirmar"
              class="tabla-contratos__mi-firma tabla-contratos__mi-firma--pendiente"
            >
              Pendiente de mi firma
            </span>
            <span v-else class="tabla-contratos__secundario">—</span>
          </td>

          <td data-label="Acciones" class="tabla-contratos__td-acciones">
            <div class="tabla-contratos__acciones">
              <VaButton
                preset="secondary"
                size="small"
                icon="mso-visibility"
                @click="$emit('ver', contrato)"
              >
                Ver
              </VaButton>

              <VaButton
                v-if="puedeModificarContrato(contrato)"
                preset="secondary"
                size="small"
                icon="mso-edit"
                @click="$emit('modificar', contrato)"
              >
                Modificar
              </VaButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import EstadoContratoBadge from "./EstadoContratoBadge.vue";
import { formatearFecha } from "../../utils/fechas.js";
import {
  etiquetaEstadoFirmaContrato,
  puedeModificarContrato,
} from "../../utils/contratoConstants.js";

/*
 * Tabla de contratos. Presentacional: los flags vienen del backend
 * (`puedeModificar`, `miEstadoFirma`, `puedeFirmar`) y no se recalculan acá.
 * Firmar y rechazar se realizan únicamente desde el detalle.
 */
export default {
  name: "TablaContratos",
  components: { EstadoContratoBadge },
  props: {
    contratos: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["ver", "modificar"],
  methods: {
    formatearFecha,
    etiquetaEstadoFirmaContrato,
    puedeModificarContrato,
    varianteMiFirma(contrato) {
      if (contrato?.miEstadoFirma === "FIRMADO") return "firmado";
      if (contrato?.miEstadoFirma === "RECHAZADO") return "rechazado";
      if (
        contrato?.miEstadoFirma === "CANCELADA" ||
        contrato?.miEstadoFirma === "INVALIDADA"
      ) {
        return "cancelado";
      }
      return "pendiente";
    },
  },
};
</script>

<style scoped>
.tabla-contratos__scroll {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.tabla-contratos {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.tabla-contratos th,
.tabla-contratos td {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: top;
}

.tabla-contratos th {
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tabla-contratos__fila:last-child td {
  border-bottom: 0;
}

.tabla-contratos__nombre {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.tabla-contratos__nombre:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.tabla-contratos__secundario {
  display: block;
  margin-top: 0.12rem;
  color: var(--color-text-muted);
  font-size: 0.73rem;
  line-height: 1.35;
}

.tabla-contratos__firmas {
  color: var(--color-text);
  font-weight: 600;
}

.tabla-contratos__mi-firma {
  display: inline-flex;
  align-items: center;
  padding: 0.12rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

.tabla-contratos__mi-firma--pendiente {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.tabla-contratos__mi-firma--firmado {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.tabla-contratos__mi-firma--rechazado {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.tabla-contratos__mi-firma--cancelado {
  border-color: var(--color-border-strong);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.tabla-contratos__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tabla-contratos__th-acciones {
  min-width: 150px;
}

@media (max-width: 900px) {
  .tabla-contratos__scroll {
    overflow: visible;
    border: 0;
    background: transparent;
  }

  .tabla-contratos,
  .tabla-contratos thead,
  .tabla-contratos tbody,
  .tabla-contratos tr,
  .tabla-contratos th,
  .tabla-contratos td {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .tabla-contratos thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .tabla-contratos__fila {
    margin-bottom: 0.75rem;
    padding: 0.85rem 0.95rem;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
  }

  .tabla-contratos td {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    gap: 0.5rem;
    padding: 0.28rem 0;
    border: 0;
  }

  .tabla-contratos td::before {
    content: attr(data-label);
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .tabla-contratos__td-acciones {
    display: block;
    padding-top: 0.55rem;
  }

  .tabla-contratos__td-acciones::before {
    display: block;
    margin-bottom: 0.35rem;
  }

  .tabla-contratos__acciones {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
