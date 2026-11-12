<template>
  <section class="filtros-invitaciones" aria-label="Filtros de invitaciones">
    <div class="filtros-invitaciones__grilla">
      <VaInput
        :model-value="filtros.nombreProyecto"
        class="filtros-invitaciones__campo"
        placeholder="Buscar por proyecto"
        aria-label="Buscar por proyecto"
        clearable
        @update:model-value="cambiar('nombreProyecto', $event)"
        @keyup.enter="$emit('buscar')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-invitaciones__icono">
            search
          </span>
        </template>
      </VaInput>

      <VaInput
        :model-value="filtros.nombrePerfil"
        class="filtros-invitaciones__campo"
        :placeholder="placeholderPerfil"
        :aria-label="placeholderPerfil"
        clearable
        @update:model-value="cambiar('nombrePerfil', $event)"
        @keyup.enter="$emit('buscar')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-invitaciones__icono">
            person_search
          </span>
        </template>
      </VaInput>

      <div class="filtros-invitaciones__fechas">
        <VaInput
          :model-value="filtros.fechaDesde"
          class="filtros-invitaciones__fecha"
          type="date"
          aria-label="Fecha desde"
          @update:model-value="cambiar('fechaDesde', $event)"
          @keyup.enter="$emit('buscar')"
        />
        <span class="filtros-invitaciones__separador" aria-hidden="true">—</span>
        <VaInput
          :model-value="filtros.fechaHasta"
          class="filtros-invitaciones__fecha"
          type="date"
          aria-label="Fecha hasta"
          @update:model-value="cambiar('fechaHasta', $event)"
          @keyup.enter="$emit('buscar')"
        />
      </div>
    </div>

    <div class="filtros-invitaciones__secundarios">
      <div v-if="mostrarEstado" class="filtros-invitaciones__estados">
        <span class="filtros-invitaciones__estado-label">Estado</span>
        <button
          v-for="opcion in opcionesEstado"
          :key="opcion.value"
          type="button"
          class="filtros-invitaciones__chip"
          :class="{
            'filtros-invitaciones__chip--activo':
              filtros.estado === opcion.value,
          }"
          @click="cambiarEstado(opcion.value)"
        >
          {{ opcion.text }}
        </button>
      </div>

      <VaSelect
        :model-value="filtros.tipo"
        class="filtros-invitaciones__tipo"
        placeholder="Tipo"
        aria-label="Tipo de invitación"
        :options="opcionesTipo"
        value-by="value"
        text-by="text"
        clearable
        @update:model-value="cambiar('tipo', $event)"
      />

      <button
        type="button"
        class="filtros-invitaciones__limpiar"
        @click="$emit('limpiar')"
      >
        Limpiar
      </button>
    </div>

    <p v-if="errorFechas" class="filtros-invitaciones__error" role="alert">
      {{ errorFechas }}
    </p>
  </section>
</template>

<script>
import {
  ESTADOS_INVITACION,
  TIPOS_INVITACION_BUSQUEDA,
} from "../../utils/invitacionBusquedaConstants.js";

export default {
  name: "FiltrosInvitaciones",
  props: {
    filtros: {
      type: Object,
      required: true,
    },
    errorFechas: {
      type: String,
      default: "",
    },
    etiquetaPerfil: {
      type: String,
      default: "Perfil",
    },
    /** En la pestaña Rechazadas el estado ya está fijado por la pestaña. */
    mostrarEstado: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["cambio", "buscar", "limpiar"],
  data() {
    return {
      opcionesEstado: [
        { value: ESTADOS_INVITACION.PENDIENTE, text: "Pendiente" },
        { value: ESTADOS_INVITACION.ACEPTADA, text: "Aceptada" },
        { value: ESTADOS_INVITACION.RECHAZADA, text: "Rechazada" },
      ],
      opcionesTipo: [
        { value: "", text: "Todos" },
        { value: TIPOS_INVITACION_BUSQUEDA.GENERAL, text: "General" },
        { value: TIPOS_INVITACION_BUSQUEDA.ACTIVIDAD, text: "Por actividad" },
      ],
    };
  },
  computed: {
    placeholderPerfil() {
      return `Buscar por ${String(this.etiquetaPerfil || "perfil").toLowerCase()}`;
    },
  },
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", { campo, valor });
    },
    cambiarEstado(valor) {
      this.cambiar("estado", this.filtros.estado === valor ? "" : valor);
    },
  },
};
</script>

<style scoped>
.filtros-invitaciones {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.filtros-invitaciones__grilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.65rem;
  align-items: center;
}

.filtros-invitaciones__campo {
  min-width: 0;
}

.filtros-invitaciones__icono {
  color: var(--color-text-subtle);
  font-size: 1.05rem;
}

.filtros-invitaciones__fechas {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.filtros-invitaciones__fecha {
  flex: 1;
  min-width: 0;
}

.filtros-invitaciones__separador {
  color: var(--color-text-subtle);
  font-size: 0.8rem;
}

.filtros-invitaciones__secundarios {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filtros-invitaciones__estados {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.filtros-invitaciones__estado-label {
  margin-right: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filtros-invitaciones__chip {
  padding: 0.3rem 0.75rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.filtros-invitaciones__chip:hover,
.filtros-invitaciones__chip:focus-visible {
  background: var(--color-surface);
  border-color: var(--color-border);
  outline: none;
}

.filtros-invitaciones__chip--activo {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.filtros-invitaciones__tipo {
  width: 170px;
  margin-left: auto;
}

.filtros-invitaciones__limpiar {
  padding: 0;
  color: var(--color-primary);
  background: none;
  border: 0;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-invitaciones__limpiar:hover {
  text-decoration: underline;
}

.filtros-invitaciones__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .filtros-invitaciones__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .filtros-invitaciones__grilla {
    grid-template-columns: 1fr;
  }

  .filtros-invitaciones__fechas {
    flex-wrap: wrap;
  }

  .filtros-invitaciones__fecha {
    flex: 1 1 120px;
  }

  .filtros-invitaciones__tipo {
    width: 100%;
    margin-left: 0;
  }
}
</style>
