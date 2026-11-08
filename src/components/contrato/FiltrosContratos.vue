<template>
  <section class="filtros-contratos" aria-label="Filtros de contratos">
    <div class="filtros-contratos__principal">
      <VaInput
        :model-value="filtros.nombreContrato"
        class="filtros-contratos__campo filtros-contratos__campo--texto"
        label="Contrato"
        placeholder="Nombre del contrato"
        clearable
        @update:model-value="cambiar('nombreContrato', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-contratos__icono">
            search
          </span>
        </template>
      </VaInput>

      <VaSelect
        v-if="mostrarFiltroProyecto"
        :model-value="filtros.idProyecto"
        class="filtros-contratos__campo"
        label="Proyecto"
        :options="proyectos"
        value-by="idProyecto"
        text-by="nombre"
        placeholder="Todos mis proyectos"
        clearable
        :loading="cargandoProyectos"
        @update:model-value="cambiar('idProyecto', $event)"
      />

      <VaInput
        :model-value="filtros.parte"
        class="filtros-contratos__campo"
        label="Parte"
        placeholder="Nombre o apellido"
        clearable
        @update:model-value="cambiar('parte', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      />

      <VaSelect
        :model-value="filtros.size"
        class="filtros-contratos__campo filtros-contratos__campo--tamano"
        label="Resultados"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        @update:model-value="cambiar('size', $event)"
      />

      <div class="filtros-contratos__acciones">
        <VaButton preset="primary" @click="$emit('buscar-ahora')">
          Buscar
        </VaButton>
        <VaButton
          preset="secondary"
          size="small"
          :icon="mostrarAvanzados ? 'mso-expand_less' : 'mso-expand_more'"
          @click="mostrarAvanzados = !mostrarAvanzados"
        >
          Más filtros
        </VaButton>
        <VaButton
          preset="secondary"
          size="small"
          :disabled="!hayFiltrosActivos"
          @click="$emit('limpiar')"
        >
          Limpiar filtros
        </VaButton>
      </div>
    </div>

    <div class="filtros-contratos__estados">
      <div class="filtros-contratos__chips" role="group" aria-label="Filtrar por estado">
        <button
          v-for="opcion in opcionesEstado"
          :key="opcion.value"
          type="button"
          class="filtros-contratos__chip"
          :class="{
            'filtros-contratos__chip--activo': estaSeleccionado(opcion.value),
          }"
          :aria-pressed="estaSeleccionado(opcion.value)"
          @click="alternarEstado(opcion.value)"
        >
          {{ opcion.text }}
        </button>
      </div>

      <label v-if="mostrarFiltroMiFirma" class="filtros-contratos__check">
        <input
          :checked="filtros.miFirmaPendiente"
          type="checkbox"
          @change="cambiar('miFirmaPendiente', $event.target.checked)"
        />
        <span>Solo pendientes de mi firma</span>
      </label>
    </div>

    <p
      v-if="!estadosSeleccionados.length"
      class="filtros-contratos__nota"
    >
      Sin estados seleccionados se aplican los estados predeterminados
      (pendiente de firma, activo, rechazado y cancelado).
    </p>

    <p v-if="errorFechas" class="filtros-contratos__error" role="alert">
      {{ errorFechas }}
    </p>

    <section v-if="mostrarAvanzados" class="filtros-contratos__avanzados">
      <div class="filtros-contratos__rango">
        <span class="filtros-contratos__rango-titulo">Emisión</span>
        <VaInput
          :model-value="filtros.fechaEmisionDesde"
          class="filtros-contratos__campo"
          label="Desde"
          type="date"
          @update:model-value="cambiar('fechaEmisionDesde', $event)"
        />
        <VaInput
          :model-value="filtros.fechaEmisionHasta"
          class="filtros-contratos__campo"
          label="Hasta"
          type="date"
          @update:model-value="cambiar('fechaEmisionHasta', $event)"
        />
      </div>

      <div class="filtros-contratos__rango">
        <span class="filtros-contratos__rango-titulo">Firma</span>
        <VaInput
          :model-value="filtros.fechaFirmaDesde"
          class="filtros-contratos__campo"
          label="Desde"
          type="date"
          @update:model-value="cambiar('fechaFirmaDesde', $event)"
        />
        <VaInput
          :model-value="filtros.fechaFirmaHasta"
          class="filtros-contratos__campo"
          label="Hasta"
          type="date"
          @update:model-value="cambiar('fechaFirmaHasta', $event)"
        />
      </div>

      <div class="filtros-contratos__avanzados-estados">
        <span class="filtros-contratos__rango-titulo">Estados avanzados</span>
        <div class="filtros-contratos__chips">
          <button
            v-for="opcion in opcionesEstadoAvanzado"
            :key="opcion.value"
            type="button"
            class="filtros-contratos__chip filtros-contratos__chip--avanzado"
            :class="{
              'filtros-contratos__chip--activo': estaSeleccionado(opcion.value),
            }"
            :aria-pressed="estaSeleccionado(opcion.value)"
            @click="alternarEstado(opcion.value)"
          >
            {{ opcion.text }}
          </button>
        </div>
        <p class="filtros-contratos__nota">
          La selección de estados es excluyente: si elegís solo un estado
          avanzado, dejás de ver los estados habituales.
        </p>
      </div>
    </section>
  </section>
</template>

<script>
import {
  OPCIONES_ESTADO_CONTRATO,
  OPCIONES_ESTADO_CONTRATO_AVANZADO,
  ESTADOS_CONTRATO_POR_DEFECTO,
} from "../../utils/contratoConstants.js";
import {
  OPCIONES_TAMANO_CONTRATOS,
  mismosEstados,
} from "../../utils/parametrosContratos.js";

/*
 * Barra de filtros de UC-68. Es presentacional: el contenedor mantiene el
 * estado, el debounce y la paginación. Los chips principales muestran los
 * estados por defecto; BORRADOR y ELIMINADO viven en filtros avanzados.
 */
export default {
  name: "FiltrosContratos",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    proyectos: {
      type: Array,
      default: () => [],
    },
    cargandoProyectos: {
      type: Boolean,
      default: false,
    },
    mostrarFiltroProyecto: {
      type: Boolean,
      default: true,
    },
    mostrarFiltroMiFirma: {
      type: Boolean,
      default: true,
    },
    errorFechas: {
      type: String,
      default: "",
    },
  },
  emits: ["cambio", "limpiar", "buscar-ahora"],
  data() {
    return {
      mostrarAvanzados: false,
      opcionesEstado: OPCIONES_ESTADO_CONTRATO,
      opcionesEstadoAvanzado: OPCIONES_ESTADO_CONTRATO_AVANZADO,
      opcionesTamano: OPCIONES_TAMANO_CONTRATOS,
    };
  },
  computed: {
    estadosSeleccionados() {
      return Array.isArray(this.filtros.estados) ? this.filtros.estados : [];
    },
    hayFiltrosActivos() {
      return (
        String(this.filtros.nombreContrato || "").trim() !== "" ||
        String(this.filtros.parte || "").trim() !== "" ||
        (this.mostrarFiltroProyecto && this.filtros.idProyecto != null) ||
        (this.mostrarFiltroMiFirma && this.filtros.miFirmaPendiente === true) ||
        this.filtros.fechaEmisionDesde ||
        this.filtros.fechaEmisionHasta ||
        this.filtros.fechaFirmaDesde ||
        this.filtros.fechaFirmaHasta ||
        Number(this.filtros.size) !== 20 ||
        !mismosEstados(this.estadosSeleccionados, ESTADOS_CONTRATO_POR_DEFECTO)
      );
    },
  },
  methods: {
    cambiar(clave, valor) {
      this.$emit("cambio", { clave, valor });
    },
    estaSeleccionado(estado) {
      return this.estadosSeleccionados.includes(estado);
    },
    alternarEstado(estado) {
      const actuales = new Set(this.estadosSeleccionados);
      if (actuales.has(estado)) actuales.delete(estado);
      else actuales.add(estado);
      this.cambiar("estados", [...actuales]);
    },
  },
};
</script>

<style scoped>
.filtros-contratos {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.filtros-contratos__principal {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.filtros-contratos__campo {
  min-width: 150px;
  flex: 1 1 170px;
}

.filtros-contratos__campo--texto {
  flex: 2 1 240px;
}

.filtros-contratos__campo--tamano {
  flex: 0 1 150px;
}

.filtros-contratos__icono {
  font-size: 1.1rem;
}

.filtros-contratos__acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filtros-contratos__estados {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.filtros-contratos__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filtros-contratos__chip {
  padding: 0.28rem 0.65rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-contratos__chip:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
}

.filtros-contratos__chip--activo {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.filtros-contratos__chip--avanzado {
  border-style: dashed;
}

.filtros-contratos__check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
}

.filtros-contratos__check input {
  accent-color: var(--color-primary);
}

.filtros-contratos__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
  font-weight: 600;
}

.filtros-contratos__avanzados {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-soft);
}

.filtros-contratos__rango {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.filtros-contratos__rango-titulo {
  flex: 0 0 7.5rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filtros-contratos__avanzados-estados {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filtros-contratos__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  line-height: 1.4;
}

@media (max-width: 720px) {
  .filtros-contratos__principal,
  .filtros-contratos__acciones {
    align-items: stretch;
  }

  .filtros-contratos__campo,
  .filtros-contratos__campo--texto,
  .filtros-contratos__campo--tamano {
    flex: 1 1 100%;
  }

  .filtros-contratos__rango-titulo {
    flex: 1 1 100%;
  }
}
</style>
