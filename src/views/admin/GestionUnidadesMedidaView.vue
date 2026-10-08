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
            :loading="precargando && filaEditando === rowData.idUnidad"
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
      <BaseAlert :message="errorMessage" type="error" />

      <VaForm ref="formUnidad" @submit.prevent="guardarUnidad">
        <div class="gestion-unidades__form">
          <VaInput
            ref="inputNombre"
            v-model="form.nombre"
            :rules="[reglas.requerido, reglas.max50]"
            :error="errorCampo('nombre')"
            :error-messages="mensajeCampo('nombre')"
            label="Nombre"
            placeholder="Ej: Kilogramos"
            :disabled="modoEdicion ? !puedeModificar : !puedeCrear"
            @update:modelValue="limpiarErrorCampo('nombre')"
          />

          <VaInput
            ref="inputSimbolo"
            v-model="form.simbolo"
            :rules="[reglas.requerido, reglas.max50]"
            :error="errorCampo('simbolo')"
            :error-messages="mensajeCampo('simbolo')"
            label="Símbolo"
            placeholder="Ej: kg"
            :disabled="modoEdicion ? !puedeModificar : !puedeCrear"
            @update:modelValue="limpiarErrorCampo('simbolo')"
          />

          <VaSelect
            v-model="form.tipoDatoPermitido"
            :options="opcionesTipoDato"
            value-by="value"
            text-by="text"
            :rules="[reglas.requerido]"
            :error="errorCampo('tipoDatoPermitido')"
            :error-messages="mensajeCampo('tipoDatoPermitido')"
            label="Tipo de dato permitido"
            placeholder="Seleccioná el tipo de dato"
            :disabled="modoEdicion ? !puedeModificar : !puedeCrear"
            @update:modelValue="limpiarErrorCampo('tipoDatoPermitido')"
          />
        </div>
      </VaForm>

      <template #footer>
        <div class="gestion-unidades__modal-footer">
          <VaButton preset="secondary" @click="modalVisible = false">Cancelar</VaButton>
          <VaButton
            v-if="modoEdicion ? puedeModificar : puedeCrear"
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
import { mensajeErrorApi } from "../../utils/apiError";
import BaseAlert from "../../components/AlertaBase.vue";

const TIPOS_DATO = ["NUMERICO", "TEXTO"];
const CAMPOS_FORM = ["nombre", "simbolo", "tipoDatoPermitido"];

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
      precargando: false,
      filaEditando: null,
      erroresBackend: {},
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
  watch: {
    modalVisible(abierto) {
      if (!abierto) {
        this.erroresBackend = {};
        this.errorMessage = "";
      }
    },
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
        this.errorMessage = mensajeErrorApi(error, "No se pudieron cargar las unidades de medida.");
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
      this.erroresBackend = {};
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
    },

    async abrirEditar(unidad) {
      this.precargando = true;
      this.filaEditando = unidad.idUnidad;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminUnidadesMedidaService.obtener(unidad.idUnidad);
        const detalle = response?.data || {};
        this.modoEdicion = true;
        this.form = {
          idUnidad: detalle.idUnidad ?? unidad.idUnidad,
          nombre: detalle.nombre || "",
          simbolo: detalle.simbolo || "",
          tipoDatoPermitido: detalle.tipoDatoPermitido || null,
        };
        this.erroresBackend = {};
        this.modalVisible = true;
      } catch (error) {
        const mensaje = mensajeErrorApi(error, "No se pudo cargar la unidad de medida.");
        if (error?.response?.status === 404) {
          await this.cargarUnidades();
        }
        this.errorMessage = mensaje;
      } finally {
        this.precargando = false;
        this.filaEditando = null;
      }
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
      this.erroresBackend = {};
      try {
        const enModoEdicion = this.modoEdicion;
        if (enModoEdicion) {
          await adminUnidadesMedidaService.actualizar(this.form.idUnidad, this.buildRequest());
        } else {
          await adminUnidadesMedidaService.crear(this.buildRequest());
        }
        this.modalVisible = false;
        await this.cargarUnidades();
        this.successMessage = enModoEdicion
          ? "Unidad de medida actualizada correctamente."
          : "Unidad de medida creada correctamente.";
      } catch (error) {
        await this.manejarErrorGuardado(error);
      } finally {
        this.guardando = false;
      }
    },

    async manejarErrorGuardado(error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 400 && this.mapearErroresCampo(data?.errores)) {
        return;
      }

      if (status === 409) {
        this.errorMessage = data?.message || "Ya existe una unidad de medida con esos datos.";
        this.enfocarCampoDuplicado(data?.message);
        return;
      }

      const mensaje = mensajeErrorApi(error, "No se pudo guardar la unidad de medida.");
      if (status === 404) {
        this.modalVisible = false;
        await this.cargarUnidades();
      }
      this.errorMessage = mensaje;
    },

    mapearErroresCampo(errores) {
      if (!errores || typeof errores !== "object") return false;
      const relevantes = {};
      for (const campo of CAMPOS_FORM) {
        if (errores[campo]) relevantes[campo] = errores[campo];
      }
      if (Object.keys(relevantes).length === 0) return false;
      this.erroresBackend = relevantes;
      return true;
    },

    enfocarCampoDuplicado(mensaje) {
      const texto = String(mensaje || "").toLowerCase();
      let ref = null;
      if (texto.includes("símbolo") || texto.includes("simbolo")) {
        ref = this.$refs.inputSimbolo;
      } else if (texto.includes("nombre")) {
        ref = this.$refs.inputNombre;
      }
      if (ref) this.$nextTick(() => ref.focus());
    },

    errorCampo(campo) {
      return !!this.erroresBackend[campo] || undefined;
    },

    mensajeCampo(campo) {
      return this.erroresBackend[campo] || undefined;
    },

    limpiarErrorCampo(campo) {
      if (this.erroresBackend[campo]) {
        const errores = { ...this.erroresBackend };
        delete errores[campo];
        this.erroresBackend = errores;
      }
    },

    confirmarEliminar(unidad) {
      this.unidadSeleccionada = unidad;
      this.successMessage = "";
      this.errorMessage = "";
      this.modalEliminarVisible = true;
    },

    async eliminarSeleccionada() {
      if (!this.unidadSeleccionada) return;
      this.eliminando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        await adminUnidadesMedidaService.eliminar(this.unidadSeleccionada.idUnidad);
        this.modalEliminarVisible = false;
        this.unidadSeleccionada = null;
        await this.cargarUnidades();
        this.successMessage = "La unidad de medida fue eliminada.";
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = mensajeErrorApi(error, "No se pudo eliminar la unidad de medida.");
        if (status === 404) {
          this.modalEliminarVisible = false;
          this.unidadSeleccionada = null;
          await this.cargarUnidades();
        } else if (status === 409) {
          this.modalEliminarVisible = false;
          this.unidadSeleccionada = null;
        }
        this.errorMessage = mensaje;
      } finally {
        this.eliminando = false;
      }
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
