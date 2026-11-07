<template>
  <section class="filtros-invitaciones" aria-label="Filtros de invitaciones">
    <div class="filtros-invitaciones__grilla">
      <VaInput
        :model-value="filtros.nombreProyecto"
        class="filtros-invitaciones__campo"
        label="Nombre de proyecto"
        placeholder="Nombre del proyecto"
        clearable
        @update:model-value="cambiar('nombreProyecto', $event)"
        @keyup.enter="$emit('buscar')"
      />

      <div class="filtros-invitaciones__fechas">
        <span class="filtros-invitaciones__grupo-label">Fecha de envío</span>
        <div class="filtros-invitaciones__fechas-campos">
          <VaInput
            :model-value="filtros.fechaDesde"
            class="filtros-invitaciones__fecha"
            label="Desde"
            type="date"
            @update:model-value="cambiar('fechaDesde', $event)"
            @keyup.enter="$emit('buscar')"
          />
          <VaInput
            :model-value="filtros.fechaHasta"
            class="filtros-invitaciones__fecha"
            label="Hasta"
            type="date"
            @update:model-value="cambiar('fechaHasta', $event)"
            @keyup.enter="$emit('buscar')"
          />
        </div>
      </div>

      <VaInput
        :model-value="filtros.nombrePerfil"
        class="filtros-invitaciones__campo"
        :label="etiquetaPerfil"
        placeholder="Nombre artístico o nombre"
        clearable
        @update:model-value="cambiar('nombrePerfil', $event)"
        @keyup.enter="$emit('buscar')"
      />

      <div class="filtros-invitaciones__acciones">
        <VaButton preset="primary" @click="$emit('buscar')">
          Buscar
        </VaButton>
        <VaButton preset="secondary" @click="$emit('limpiar')">
          Limpiar
        </VaButton>
      </div>
    </div>

    <div class="filtros-invitaciones__secundarios">
      <VaSelect
        v-if="mostrarEstado"
        :model-value="filtros.estado"
        class="filtros-invitaciones__select"
        label="Estado"
        :options="opcionesEstado"
        value-by="value"
        text-by="text"
        @update:model-value="cambiar('estado', $event)"
      />

      <VaSelect
        :model-value="filtros.tipo"
        class="filtros-invitaciones__select"
        label="Tipo"
        :options="opcionesTipo"
        value-by="value"
        text-by="text"
        @update:model-value="cambiar('tipo', $event)"
      />
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
        { value: "", text: "Todos" },
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
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", { campo, valor });
    },
  },
};
</script>

<style scoped>
.filtros-invitaciones {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.filtros-invitaciones__grilla {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(240px, 1fr) minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: end;
}

.filtros-invitaciones__campo {
  min-width: 0;
}

.filtros-invitaciones__fechas {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.filtros-invitaciones__grupo-label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 600;
}

.filtros-invitaciones__fechas-campos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.filtros-invitaciones__fecha {
  min-width: 0;
}

.filtros-invitaciones__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.05rem;
}

.filtros-invitaciones__secundarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 220px));
  gap: 0.75rem;
}

.filtros-invitaciones__select {
  min-width: 0;
}

.filtros-invitaciones__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

@media (max-width: 1050px) {
  .filtros-invitaciones__grilla {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filtros-invitaciones__acciones {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .filtros-invitaciones__grilla,
  .filtros-invitaciones__fechas-campos,
  .filtros-invitaciones__secundarios {
    grid-template-columns: 1fr;
  }
}
</style>
