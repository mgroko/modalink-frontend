<template>
  <div class="gestion-unidades">
    <section class="gestion-unidades__encabezado">
      <h1>Unidades de medida</h1>
      <p class="gestion-unidades__subtitulo">
        Administrá las unidades de medida utilizadas en las características técnicas.
      </p>
    </section>

    <div class="gestion-unidades__toolbar">
      <VaInput
        v-model="busqueda"
        preset="bordered"
        placeholder="Buscar por nombre o símbolo"
        removable
        class="gestion-unidades__buscador"
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="grey" size="small" />
        </template>
      </VaInput>

      <div class="gestion-unidades__toolbar-acciones">
        <VaSelect
          v-model="filtroTipoDato"
          :options="opcionesTipoDato"
          value-by="value"
          text-by="text"
          placeholder="Tipo de dato"
          clearable
          class="gestion-unidades__select-tipo"
          @update:modelValue="cargarUnidades"
        />

        <VaButton
          preset="secondary"
          icon="mso-refresh"
          :loading="cargando"
          @click="cargarUnidades"
        >
          Actualizar
        </VaButton>

        <VaButton
          v-if="puedeCrear"
          color="primary"
          icon="mso-add"
          @click="abrirCrear"
        >
          Nueva unidad
        </VaButton>
      </div>
    </div>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <div v-if="!puedeVer" class="gestion-unidades__estado">
      <span class="material-symbols-outlined gestion-unidades__estado-icono">lock</span>
      No tenés permisos para ver las unidades de medida.
    </div>

    <div v-else-if="cargando" class="gestion-unidades__estado">
      <span class="material-symbols-outlined gestion-unidades__estado-icono">hourglass_empty</span>
      Cargando unidades...
    </div>

    <div v-else-if="unidadesFiltradas.length === 0" class="gestion-unidades__estado">
      <span class="material-symbols-outlined gestion-unidades__estado-icono">straighten</span>
      No hay unidades de medida registradas.
    </div>

    <VaDataTable
      v-else
      class="gestion-unidades__tabla"
      :items="unidadesFiltradas"
      :columns="columnas"
      :per-page="10"
      striped
      hoverable
    >
      <template #cell(idUnidad)="{ value }">
        <span class="gestion-unidades__id">{{ value }}</span>
      </template>

      <template #cell(tipoDatoPermitido)="{ value }">
        <VaBadge :text="value" :color="value === 'NUMERICO' ? 'info' : 'warning'" outline />
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="gestion-unidades__acciones">
          <VaButton
            v-if="puedeModificar"
            size="small"
            preset="primary"
            icon="mso-edit"
            @click="abrirEditar(rowData)"
          >
            Modificar
          </VaButton>
          <VaButton
            v-if="puedeEliminar"
            size="small"
            color="danger"
            icon="mso-delete"
            @click="confirmarEliminar(rowData)"
          >
            Eliminar
          </VaButton>
        </div>
      </template>
    </VaDataTable>

    <!-- Modal crear / editar unidad -->
    <VaModal
      v-model="modalVisible"
      :title="modoEdicion ? 'Modificar unidad de medida' : 'Nueva unidad de medida'"
      close-button
      hide-default-actions
      size="medium"
    >
      <VaForm ref="formUnidad" @submit.prevent="guardarUnidad">
        <div class="gestion-unidades__form">
          <VaInput
            v-model="form.nombre"
            :rules="[reglas.requerido, reglas.max50]"
            label="Nombre"
            placeholder="Ej: Kilogramos"
            :disabled="!puedeCrear && !puedeModificar"
          />

          <VaInput
            v-model="form.simbolo"
            :rules="[reglas.requerido, reglas.max50]"
            label="Símbolo"
            placeholder="Ej: kg"
            :disabled="!puedeCrear && !puedeModificar"
          />

          <VaSelect
            v-model="form.tipoDatoPermitido"
            :options="opcionesTipoDato"
            value-by="value"
            text-by="text"
            :rules="[reglas.requerido]"
            label="Tipo de dato permitido"
            placeholder="Seleccioná el tipo de dato"
            :disabled="!puedeCrear && !puedeModificar"
          />
        </div>
      </VaForm>

      <template #footer>
        <div class="gestion-unidades__modal-footer">
          <VaButton preset="secondary" @click="modalVisible = false">Cancelar</VaButton>
          <VaButton
            v-if="puedeCrear || puedeModificar"
            color="primary"
            :loading="guardando"
            @click="guardarUnidad"
          >
            {{ modoEdicion ? 'Guardar cambios' : 'Crear unidad' }}
          </VaButton>
        </div>
      </template>
    </VaModal>

    <!-- Modal confirmar eliminación -->
    <VaModal
      v-model="modalEliminarVisible"
      hide-default-actions
      blur
    >
      <h3 class="va-h5">¿Eliminar unidad de medida?</h3>
      <div v-if="unidadSeleccionada" class="gestion-unidades__confirmacion">
        <p>
          Vas a eliminar la unidad <strong>{{ unidadSeleccionada.nombre }}</strong>
          ({{ unidadSeleccionada.simbolo }}) de tipo {{ unidadSeleccionada.tipoDatoPermitido }}.
        </p>
        <p class="gestion-unidades__texto-muted">
          Esta acción es permanente: la unidad desaparece del sistema.
          Si está asociada a una característica técnica, el backend responderá con un error.
        </p>
      </div>

      <template #footer>
        <div class="gestion-unidades__modal-footer">
          <VaButton preset="secondary" @click="modalEliminarVisible = false">Cancelar</VaButton>
          <VaButton
            color="danger"
            :loading="eliminando"
            @click="eliminarSeleccionada"
          >
            Eliminar
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminUnidadesMedidaService from "../../services/adminUnidadesMedidaService";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

const TIPOS_DATO = ["NUMERICO", "TEXTO"];

export default {
  name: "GestionUnidadesMedidaView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      cargando: false,
      guardando: false,
      eliminando: false,
      unidades: [],
      busqueda: "",
      filtroTipoDato: null,
      successMessage: "",
      errorMessage: "",

      columnas: [
        { key: "idUnidad", label: "ID" },
        { key: "nombre", label: "Nombre", sortable: true },
        { key: "simbolo", label: "Símbolo", sortable: true },
        { key: "tipoDatoPermitido", label: "Tipo de dato" },
        { key: "acciones", label: "ACCIONES" },
      ],

      opcionesTipoDato: TIPOS_DATO.map((t) => ({ text: t, value: t })),

      modalVisible: false,
      modoEdicion: false,
      form: {
        idUnidad: null,
        nombre: "",
        simbolo: "",
        tipoDatoPermitido: null,
      },

      modalEliminarVisible: false,
      unidadSeleccionada: null,

      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        max50: (v) => !v || String(v).length <= 50 || "Máximo 50 caracteres",
      },
    };
  },
  computed: {
    puedeVer() {
      return tienePermiso("VER_CARACTERISTICAS");
    },
    puedeCrear() {
      return tienePermiso("CREAR_CARACTERISTICA");
    },
    puedeModificar() {
      return tienePermiso("MODIFICAR_CARACTERISTICA");
    },
    puedeEliminar() {
      return tienePermiso("ELIMINAR_CARACTERISTICA");
    },
    unidadesFiltradas() {
      const texto = this.busqueda.trim().toLowerCase();
      if (!texto) return this.unidades;
      return this.unidades.filter((u) =>
        [u.nombre, u.simbolo].some((v) =>
          String(v || "").toLowerCase().includes(texto)
        )
      );
    },
  },
  async mounted() {
    await this.cargarUnidades();
  },
  methods: {
    async cargarUnidades() {
      if (!this.puedeVer) return;
      this.cargando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const tipoDato = this.filtroTipoDato || undefined;
        const response = await adminUnidadesMedidaService.listar(tipoDato);
        const datos = response?.data;
        this.unidades = Array.isArray(datos) ? datos : datos?.unidades || [];
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudieron cargar las unidades de medida.";
      } finally {
        this.cargando = false;
      }
    },

    abrirCrear() {
      this.modoEdicion = false;
      this.form = {
        idUnidad: null,
        nombre: "",
        simbolo: "",
        tipoDatoPermitido: null,
      };
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
    },

    abrirEditar(unidad) {
      this.modoEdicion = true;
      this.form = {
        idUnidad: unidad.idUnidad,
        nombre: unidad.nombre || "",
        simbolo: unidad.simbolo || "",
        tipoDatoPermitido: unidad.tipoDatoPermitido || null,
      };
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
    },

    buildRequest() {
      return {
        nombre: this.form.nombre?.trim(),
        simbolo: this.form.simbolo?.trim(),
        tipoDatoPermitido: this.form.tipoDatoPermitido,
      };
    },

    async guardarUnidad() {
      const valid = this.$refs.formUnidad?.validate();
      if (!valid) return;

      this.guardando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        if (this.modoEdicion) {
          await adminUnidadesMedidaService.actualizar(this.form.idUnidad, this.buildRequest());
          this.successMessage = "Unidad de medida actualizada correctamente.";
        } else {
          await adminUnidadesMedidaService.crear(this.buildRequest());
          this.successMessage = "Unidad de medida creada correctamente.";
        }
        this.modalVisible = false;
        await this.cargarUnidades();
      } catch (error) {
        this.errorMessage = this.mensajeError(error, "No se pudo guardar la unidad de medida.");
      } finally {
        this.guardando = false;
      }
    },

    confirmarEliminar(unidad) {
      this.unidadSeleccionada = unidad;
      this.modalEliminarVisible = true;
    },

    async eliminarSeleccionada() {
      if (!this.unidadSeleccionada) return;
      this.eliminando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        await adminUnidadesMedidaService.eliminar(this.unidadSeleccionada.idUnidad);
        this.successMessage = `La unidad "${this.unidadSeleccionada.nombre}" fue eliminada.`;
        this.modalEliminarVisible = false;
        this.unidadSeleccionada = null;
        await this.cargarUnidades();
      } catch (error) {
        this.errorMessage = this.mensajeError(error, "No se pudo eliminar la unidad de medida.");
      } finally {
        this.eliminando = false;
      }
    },

    mensajeError(error, fallback) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      if (status === 409) {
        return data?.message ||
          "No se puede eliminar o modificar: la unidad está asociada a una característica técnica.";
      }
      if (status === 400) {
        return data?.message || "Datos inválidos. Verificá los campos del formulario.";
      }
      if (status === 404) {
        return data?.message || "La unidad de medida no existe.";
      }
      return data?.message || fallback;
    },
  },
};
</script>

<style scoped>
.gestion-unidades {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.gestion-unidades__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gestion-unidades__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.gestion-unidades__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1.25rem 0 1rem;
}

.gestion-unidades__buscador {
  width: 100%;
  max-width: 320px;
}

.gestion-unidades__toolbar-acciones {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gestion-unidades__select-tipo {
  min-width: 180px;
}

.gestion-unidades__tabla {
  --va-table-padding: 0.5rem;
}

.gestion-unidades__id {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.gestion-unidades__acciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.gestion-unidades__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.gestion-unidades__estado-icono {
  font-size: 2.5rem;
}

.gestion-unidades__form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.gestion-unidades__modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
}

.gestion-unidades__confirmacion {
  margin-top: 0.75rem;
}

.gestion-unidades__texto-muted {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  margin-top: 0.5rem;
}
</style>
