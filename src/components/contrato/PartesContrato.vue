<template>
  <ul
    v-if="partes.length"
    class="partes-contrato"
    :class="{ 'partes-contrato--compacta': compacta }"
    aria-label="Partes del contrato"
  >
    <li
      v-for="parte in partes"
      :key="`${parte.idMiembro}-${parte.rolParte}`"
      class="partes-contrato__fila"
    >
      <span v-if="!compacta" class="partes-contrato__avatar" aria-hidden="true">
        {{ inicial(parte) }}
      </span>

      <span class="partes-contrato__datos">
        <span class="partes-contrato__nombre-linea">
          <span class="partes-contrato__nombre">
            {{ parte.nombre || parte.nombreArtistico || "Perfil sin nombre" }}
          </span>
          <span
            v-if="nombreArtisticoVisible(parte)"
            class="partes-contrato__artistico"
          >
            ({{ nombreArtisticoVisible(parte) }})
          </span>
          <template v-if="compacta">
            <span
              v-if="etiquetaRolParteContrato(parte.rolParte)"
              class="partes-contrato__separador"
              aria-hidden="true"
            >
              ·
            </span>
            <span class="partes-contrato__rol">
              {{ etiquetaRolParteContrato(parte.rolParte) }}
            </span>
          </template>
        </span>
        <span v-if="!compacta" class="partes-contrato__rol">
          {{ etiquetaRolParteContrato(parte.rolParte) }}
        </span>
        <span
          v-if="parte.estadoFirma === ESTADOS_FIRMA_CONTRATO.RECHAZADO && parte.motivoRechazo"
          class="partes-contrato__motivo"
        >
          Motivo: {{ parte.motivoRechazo }}
        </span>
      </span>

      <span class="partes-contrato__estado">
        <span
          class="partes-contrato__chip"
          :class="`partes-contrato__chip--${varianteEstado(parte.estadoFirma)}`"
        >
          {{ etiquetaEstadoFirmaContrato(parte.estadoFirma) || "Sin firma" }}
        </span>
        <span v-if="parte.fechaFirma" class="partes-contrato__fecha">
          {{ formatearFecha(parte.fechaFirma) }}
        </span>
        <span
          v-else-if="parte.estadoFirma === ESTADOS_FIRMA_CONTRATO.RECHAZADO && parte.fechaRechazo"
          class="partes-contrato__fecha"
        >
          {{ formatearFecha(parte.fechaRechazo) }}
        </span>
      </span>
    </li>
  </ul>

  <p v-else class="partes-contrato__vacio">Todavía no hay partes registradas.</p>
</template>

<script>
import {
  ESTADOS_FIRMA_CONTRATO,
  etiquetaEstadoFirmaContrato,
  etiquetaRolParteContrato,
} from "../../utils/contratoConstants.js";
import { formatearFecha } from "../../utils/fechas.js";

/*
 * Lista de partes y estado de firma. Presentacional: muestra exactamente lo
 * que devuelve el backend.
 */
export default {
  name: "PartesContrato",
  props: {
    partes: {
      type: Array,
      default: () => [],
    },
    /**
     * Vista compacta del detalle: nombre y rol en la misma línea, sin avatar.
     * El formulario de modificación usa la vista completa por defecto.
     */
    compacta: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return { ESTADOS_FIRMA_CONTRATO };
  },
  methods: {
    etiquetaRolParteContrato,
    etiquetaEstadoFirmaContrato,
    formatearFecha,
    inicial(parte) {
      const nombre = String(parte?.nombre || "").trim();
      return nombre.charAt(0).toUpperCase() || "?";
    },
    nombreArtisticoVisible(parte) {
      const artistico = String(parte?.nombreArtistico || "").trim();
      if (!artistico) return "";
      const nombre = String(parte?.nombre || "").trim();
      if (!nombre) return "";
      return artistico.toLowerCase() === nombre.toLowerCase() ? "" : artistico;
    },
    varianteEstado(estado) {
      switch (estado) {
        case ESTADOS_FIRMA_CONTRATO.FIRMADO:
          return "firmado";
        case ESTADOS_FIRMA_CONTRATO.RECHAZADO:
          return "rechazado";
        case ESTADOS_FIRMA_CONTRATO.CANCELADA:
        case ESTADOS_FIRMA_CONTRATO.INVALIDADA:
          return "cancelado";
        default:
          return "pendiente";
      }
    },
  },
};
</script>

<style scoped>
.partes-contrato {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.partes-contrato__fila {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.partes-contrato--compacta .partes-contrato__fila {
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.55rem;
}

.partes-contrato__fila:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.partes-contrato__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.partes-contrato__datos {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
  flex: 1;
}

.partes-contrato__nombre-linea {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.3rem;
  min-width: 0;
}

.partes-contrato__nombre {
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.partes-contrato__rol {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.partes-contrato__artistico {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.partes-contrato__separador {
  color: var(--color-text-subtle);
  font-size: 0.74rem;
}

.partes-contrato--compacta .partes-contrato__nombre {
  font-weight: 700;
}

.partes-contrato--compacta .partes-contrato__rol,
.partes-contrato--compacta .partes-contrato__separador {
  font-size: 0.8rem;
}

.partes-contrato__motivo {
  margin-top: 0.2rem;
  color: var(--color-danger-text);
  font-size: 0.74rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.partes-contrato__estado {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.18rem;
  flex: 0 0 auto;
}

.partes-contrato__chip {
  padding: 0.12rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  white-space: nowrap;
}

.partes-contrato__chip--pendiente {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.partes-contrato__chip--firmado {
  border-color: var(--color-success-border);
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.partes-contrato__chip--rechazado {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.partes-contrato__chip--cancelado {
  border-color: var(--color-border-strong);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.partes-contrato__fecha {
  color: var(--color-text-subtle);
  font-size: 0.68rem;
}

.partes-contrato__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}
</style>
