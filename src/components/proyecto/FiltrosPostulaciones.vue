<template>
  <section class="filtros-postulaciones" aria-label="Filtros de postulaciones">
    <div class="filtros-postulaciones__estados">
      <div
        class="filtros-postulaciones__chips"
        role="group"
        aria-label="Filtrar por estado"
      >
        <button
          v-for="opcion in opcionesEstadoConConteo"
          :key="opcion.value || 'todas'"
          type="button"
          class="filtros-postulaciones__chip"
          :class="{
            'filtros-postulaciones__chip--activo':
              filtros.estado === opcion.value,
          }"
          :aria-pressed="filtros.estado === opcion.value"
          @click="cambiar('estado', opcion.value)"
        >
          {{ opcion.text }}
          <span v-if="opcion.total !== null" class="filtros-postulaciones__conteo">
            · {{ opcion.total }}
          </span>
        </button>
      </div>

      <button
        type="button"
        class="filtros-postulaciones__limpiar"
        :disabled="!hayFiltrosActivos"
        @click="$emit('limpiar')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          filter_alt_off
        </span>
        Limpiar filtros
      </button>
    </div>

    <div class="filtros-postulaciones__grilla">
      <VaInput
        :model-value="filtros.nombrePerfil"
        class="filtros-postulaciones__campo"
        label="Postulante"
        placeholder="Nombre artístico"
        clearable
        @update:modelValue="cambiar('nombrePerfil', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      />

      <VaSelect
        :model-value="filtros.tipo"
        class="filtros-postulaciones__campo"
        label="Tipo"
        :options="opcionesTipo"
        value-by="value"
        text-by="text"
        @update:modelValue="cambiar('tipo', $event)"
      />

      <VaSelect
        :model-value="filtros.idProfesion"
        class="filtros-postulaciones__campo"
        label="Profesión"
        :options="opcionesProfesion"
        value-by="value"
        text-by="text"
        :disabled="cargandoProfesiones"
        @update:modelValue="cambiar('idProfesion', $event)"
      />

      <VaInput
        :model-value="filtros.fechaDesde"
        class="filtros-postulaciones__campo"
        label="Desde"
        type="date"
        @update:modelValue="cambiar('fechaDesde', $event)"
      />

      <VaInput
        :model-value="filtros.fechaHasta"
        class="filtros-postulaciones__campo"
        label="Hasta"
        type="date"
        @update:modelValue="cambiar('fechaHasta', $event)"
      />

      <VaSelect
        :model-value="filtros.tamano"
        class="filtros-postulaciones__campo filtros-postulaciones__campo--tamano"
        label="Resultados"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        @update:modelValue="cambiar('tamano', $event)"
      />
    </div>

    <p v-if="errorFechas" class="filtros-postulaciones__error" role="alert">
      {{ errorFechas }}
    </p>
  </section>
</template>

<script>
import { OPCIONES_TAMANO, TAMANO_POR_DEFECTO } from "../../utils/parametrosPostulaciones.js";
import {
  ESTADOS_POSTULACION,
  TIPOS_POSTULACION,
} from "../../utils/postulacionConstants.js";

/*
 * Barra de filtros de UC-74. Es presentacional: mantiene el estado en el
 * contenedor (`GestionPostulaciones`) y emite el cambio campo a campo.
 * El debounce del nombre y el reinicio de página los resuelve el contenedor.
 */
export default {
  name: "FiltrosPostulaciones",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    profesiones: {
      type: Array,
      default: () => [],
    },
    cargandoProfesiones: {
      type: Boolean,
      default: false,
    },
    errorFechas: {
      type: String,
      default: "",
    },
    /**
     * Conteos por estado que devuelve `postulaciones/buscar` cuando el
     * contrato los expone: `{ PENDIENTE, ACEPTADA, RECHAZADA }`. Si llega
     * vacío, las tabs se muestran sin número.
     */
    conteos: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["cambio", "limpiar", "buscar-ahora"],
  data() {
    return {
      opcionesEstado: [
        { value: ESTADOS_POSTULACION.PENDIENTE, text: "Pendientes" },
        { value: ESTADOS_POSTULACION.ACEPTADA, text: "Aceptadas" },
        { value: ESTADOS_POSTULACION.RECHAZADA, text: "Rechazadas" },
        { value: "", text: "Todas" },
      ],
      opcionesTipo: [
        { value: "", text: "Todos" },
        { value: TIPOS_POSTULACION.GENERAL, text: "General" },
        { value: TIPOS_POSTULACION.ACTIVIDAD, text: "Actividad" },
      ],
      opcionesTamano: OPCIONES_TAMANO,
    };
  },
  computed: {
    opcionesEstadoConConteo() {
      return this.opcionesEstado.map((opcion) => ({
        ...opcion,
        total: this.totalDeEstado(opcion.value),
      }));
    },
    opcionesProfesion() {
      return [
        { text: "Todas", value: "" },
        ...(this.profesiones || []).map((profesion) => ({
          text: profesion.nombre,
          value: profesion.idProfesion,
        })),
      ];
    },
    hayFiltrosActivos() {
      return (
        this.filtros.estado !== ESTADOS_POSTULACION.PENDIENTE ||
        !!this.filtros.tipo ||
        !!String(this.filtros.nombrePerfil || "").trim() ||
        (this.filtros.idProfesion !== "" &&
          this.filtros.idProfesion != null) ||
        !!this.filtros.fechaDesde ||
        !!this.filtros.fechaHasta ||
        Number(this.filtros.tamano) !== TAMANO_POR_DEFECTO
      );
    },
  },
  methods: {
    /** Sin contrato de conteos: no se muestra número. */
    totalDeEstado(estado) {
      const valor = estado ? this.conteos?.[estado] : this.conteos?.TOTAL;
      if (valor === null || valor === undefined) return null;
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero : null;
    },
    cambiar(campo, valor) {
      this.$emit("cambio", { campo, valor });
    },
  },
};
</script>

<style scoped>
.filtros-postulaciones {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.filtros-postulaciones__estados {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.filtros-postulaciones__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.filtros-postulaciones__chip {
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.filtros-postulaciones__chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filtros-postulaciones__chip--activo {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.filtros-postulaciones__limpiar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-postulaciones__limpiar:disabled {
  color: var(--color-text-muted);
  cursor: default;
  opacity: 0.6;
}

.filtros-postulaciones__limpiar .material-symbols-outlined {
  font-size: 1rem;
}

.filtros-postulaciones__grilla {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.filtros-postulaciones__campo--tamano {
  max-width: 220px;
}

.filtros-postulaciones__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .filtros-postulaciones__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .filtros-postulaciones__grilla {
    grid-template-columns: 1fr;
  }

  .filtros-postulaciones__campo--tamano {
    max-width: none;
  }
}
</style>
