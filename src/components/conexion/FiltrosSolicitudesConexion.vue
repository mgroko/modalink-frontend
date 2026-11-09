<template>
  <section class="filtros-solicitudes" aria-label="Filtros de solicitudes de conexión">
    <div class="filtros-solicitudes__fila">
      <div
        class="filtros-solicitudes__direccion"
        role="group"
        aria-label="Dirección de la solicitud"
      >
        <button
          v-for="opcion in opcionesDireccion"
          :key="opcion.value || 'todas'"
          type="button"
          class="filtros-solicitudes__segmento"
          :class="{
            'filtros-solicitudes__segmento--activo':
              filtros.direccion === opcion.value,
          }"
          :aria-pressed="filtros.direccion === opcion.value"
          @click="cambiar('direccion', opcion.value)"
        >
          {{ opcion.text }}
        </button>
      </div>

      <button
        type="button"
        class="filtros-solicitudes__limpiar"
        :disabled="!hayFiltrosActivos"
        @click="$emit('limpiar')"
      >
        <span class="material-symbols-outlined" aria-hidden="true">
          filter_alt_off
        </span>
        Limpiar filtros
      </button>
    </div>

    <div
      class="filtros-solicitudes__estados"
      role="tablist"
      aria-label="Estado de la solicitud"
    >
      <button
        v-for="opcion in opcionesEstado"
        :key="opcion.value"
        type="button"
        class="filtros-solicitudes__estado"
        :class="{
          'filtros-solicitudes__estado--activo':
            filtros.estado === opcion.value,
        }"
        role="tab"
        :aria-selected="filtros.estado === opcion.value"
        @click="cambiar('estado', opcion.value)"
      >
        {{ opcion.text }}
      </button>
    </div>

    <div class="filtros-solicitudes__busqueda">
      <VaInput
        class="filtros-solicitudes__campo filtros-solicitudes__campo--buscar"
        :model-value="filtros.nombreArtistico"
        placeholder="Buscar por nombre artístico…"
        aria-label="Buscar por nombre artístico"
        clearable
        @update:modelValue="cambiar('nombreArtistico', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      >
        <template #prependInner>
          <span class="material-symbols-outlined filtros-solicitudes__icono">
            search
          </span>
        </template>
      </VaInput>

      <VaButton
        preset="secondary"
        size="small"
        :icon="mostrarAvanzado ? 'mso-expand_less' : 'mso-expand_more'"
        :aria-expanded="mostrarAvanzado ? 'true' : 'false'"
        @click="$emit('toggle-avanzado')"
      >
        Filtros
      </VaButton>

      <VaSelect
        class="filtros-solicitudes__campo filtros-solicitudes__campo--tamano"
        :model-value="filtros.tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        aria-label="Resultados por página"
        @update:modelValue="cambiar('tamano', $event)"
      />
    </div>

    <div v-if="mostrarAvanzado" class="filtros-solicitudes__avanzado">
      <VaInput
        class="filtros-solicitudes__campo"
        :model-value="filtros.nombre"
        label="Nombre"
        placeholder="Nombre de la contraparte"
        clearable
        @update:modelValue="cambiar('nombre', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      />

      <VaInput
        class="filtros-solicitudes__campo"
        :model-value="filtros.apellido"
        label="Apellido"
        placeholder="Apellido de la contraparte"
        clearable
        @update:modelValue="cambiar('apellido', $event)"
        @keyup.enter="$emit('buscar-ahora')"
      />

      <VaSelect
        class="filtros-solicitudes__campo"
        :model-value="filtros.idProfesion"
        label="Profesión"
        :options="profesiones"
        value-by="idProfesion"
        :text-by="(opcion) => opcion.nombre"
        placeholder="Todas"
        clearable
        :loading="cargandoProfesiones"
        @update:modelValue="cambiar('idProfesion', $event)"
      />

      <VaInput
        class="filtros-solicitudes__campo"
        :model-value="filtros.fechaDesde"
        label="Desde"
        type="date"
        @update:modelValue="cambiar('fechaDesde', $event)"
      />

      <VaInput
        class="filtros-solicitudes__campo"
        :model-value="filtros.fechaHasta"
        label="Hasta"
        type="date"
        @update:modelValue="cambiar('fechaHasta', $event)"
      />
    </div>

    <p v-if="errorFechas" class="filtros-solicitudes__error" role="alert">
      {{ errorFechas }}
    </p>
  </section>
</template>

<script>
import {
  DIRECCIONES_SOLICITUD,
  ESTADOS_SOLICITUD_CONEXION,
  OPCIONES_DIRECCION,
  OPCIONES_ESTADO,
  OPCIONES_TAMANO,
} from "../../utils/solicitudesConexionConstants.js";

export default {
  name: "FiltrosSolicitudesConexion",
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
    mostrarAvanzado: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["cambio", "buscar-ahora", "limpiar", "toggle-avanzado"],
  data() {
    return {
      opcionesDireccion: OPCIONES_DIRECCION,
      opcionesEstado: OPCIONES_ESTADO,
      opcionesTamano: OPCIONES_TAMANO,
    };
  },
  computed: {
    hayFiltrosActivos() {
      const filtros = this.filtros || {};
      return (
        filtros.direccion !== DIRECCIONES_SOLICITUD.RECIBIDA ||
        filtros.estado !== ESTADOS_SOLICITUD_CONEXION.PENDIENTE ||
        Boolean(String(filtros.nombre || "").trim()) ||
        Boolean(String(filtros.apellido || "").trim()) ||
        Boolean(String(filtros.nombreArtistico || "").trim()) ||
        filtros.idProfesion != null ||
        Boolean(filtros.fechaDesde) ||
        Boolean(filtros.fechaHasta) ||
        Number(filtros.tamano) !== 20
      );
    },
  },
  methods: {
    cambiar(campo, valor) {
      this.$emit("cambio", campo, valor);
    },
  },
};
</script>

<style scoped>
.filtros-solicitudes {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.filtros-solicitudes__fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filtros-solicitudes__direccion {
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 10px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
}

.filtros-solicitudes__segmento {
  min-height: 34px;
  padding: 0 0.8rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-solicitudes__segmento:hover {
  color: var(--color-text);
}

.filtros-solicitudes__segmento--activo {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(20, 20, 43, 0.08);
}

.filtros-solicitudes__limpiar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-solicitudes__limpiar:disabled {
  opacity: 0.45;
  cursor: default;
}

.filtros-solicitudes__limpiar .material-symbols-outlined {
  font-size: 1rem;
}

.filtros-solicitudes__estados {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  border-bottom: 1px solid var(--color-border);
}

.filtros-solicitudes__estado {
  min-height: 38px;
  padding: 0 0.9rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.filtros-solicitudes__estado:hover {
  color: var(--color-primary);
}

.filtros-solicitudes__estado--activo {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.filtros-solicitudes__busqueda {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filtros-solicitudes__campo {
  min-width: 0;
}

.filtros-solicitudes__campo--buscar {
  flex: 1 1 260px;
}

.filtros-solicitudes__campo--tamano {
  flex: 0 1 170px;
}

.filtros-solicitudes__icono {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.filtros-solicitudes__avanzado {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 0.9rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.filtros-solicitudes__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
