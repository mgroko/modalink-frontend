<template>
  <div class="gestion-caracteristicas">
    <section class="gestion-caracteristicas__encabezado">
      <h1>Características técnicas</h1>
      <p class="gestion-caracteristicas__subtitulo">
        Administrá las características técnicas y sus valores de catálogo por profesión.
      </p>
    </section>

    <div class="gestion-caracteristicas__toolbar">
      <VaInput
        v-model="busqueda"
        preset="bordered"
        placeholder="Buscar por código, unidad o profesión"
        removable
        class="gestion-caracteristicas__buscador"
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="grey" size="small" />
        </template>
      </VaInput>

      <div class="gestion-caracteristicas__toolbar-acciones">
        <VaButton
          preset="secondary"
          icon="mso-refresh"
          :loading="cargando"
          @click="cargarCaracteristicas"
        >
          Actualizar
        </VaButton>

        <VaButton
          v-if="puedeCrear"
          color="primary"
          icon="mso-add"
          @click="abrirCrear"
        >
          Nueva característica
        </VaButton>
      </div>
    </div>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <div v-if="!puedeVer" class="gestion-caracteristicas__estado">
      <span class="material-symbols-outlined gestion-caracteristicas__estado-icono">lock</span>
      No tenés permisos para ver las características técnicas.
    </div>

    <div v-else-if="cargando" class="gestion-caracteristicas__estado">
      <span class="material-symbols-outlined gestion-caracteristicas__estado-icono">hourglass_empty</span>
      Cargando características...
    </div>

    <div v-else-if="caracteristicas.length === 0" class="gestion-caracteristicas__estado">
      <span class="material-symbols-outlined gestion-caracteristicas__estado-icono">tune</span>
      No hay características técnicas registradas.
    </div>

    <VaDataTable
      v-else
      class="gestion-caracteristicas__tabla"
      :items="caracteristicasFiltradas"
      :columns="columnas"
      :per-page="10"
      striped
      hoverable
    >
      <template #cell(idCaracteristica)="{ value }">
        <span class="gestion-caracteristicas__id">{{ value }}</span>
      </template>

      <template #cell(codigo)="{ value }">
        <span :title="value">{{ labelCaracteristica(value) }}</span>
      </template>

      <template #cell(tipoDato)="{ value }">
        <VaBadge :text="value" :color="colorTipoDato(value)" outline />
      </template>

      <template #cell(cantValores)="{ rowData }">
        <span>{{ (rowData.valores || []).length }}</span>
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="gestion-caracteristicas__acciones">
          <div class="gestion-caracteristicas__acciones-col">
            <VaButton
              v-if="puedeModificar && rowData.tipoDato === 'ENUMERADO'"
              size="small"
              preset="secondary"
              icon="mso-format_list_numbered"
              @click="abrirValores(rowData)"
            >
              Valores
            </VaButton>
          </div>
          <div class="gestion-caracteristicas__acciones-col">
            <VaButton
              v-if="puedeModificar"
              size="small"
              preset="primary"
              icon="mso-edit"
              @click="abrirEditar(rowData)"
            >
              Editar
            </VaButton>
          </div>
          <div class="gestion-caracteristicas__acciones-col">
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
        </div>
      </template>
    </VaDataTable>

    <!-- Modal crear / editar característica -->
    <VaModal
      v-model="modalCaracteristicaVisible"
      :title="modoEdicion ? 'Editar característica' : 'Nueva característica'"
      close-button
      hide-default-actions
      size="large"
    >
      <VaForm ref="formCaracteristica" @submit.prevent="guardarCaracteristica">
        <div class="gestion-caracteristicas__form">
          <VaInput
            v-model="form.codigo"
            :rules="[reglas.requerido, reglas.max50]"
            label="Código"
            placeholder="Ej: color_ojos"
            :disabled="!puedeCrear && !puedeModificar"
          />

          <VaInput
            v-model="form.unidad"
            :rules="[reglas.max50]"
            label="Unidad (opcional)"
            placeholder="Ej: color, cm, kg"
            :disabled="!puedeCrear && !puedeModificar"
          />

          <VaSelect
            v-model="form.idProfesion"
            :options="profesiones"
            value-by="idProfesion"
            text-by="nombre"
            :rules="[reglas.requerido]"
            label="Profesión"
            placeholder="Seleccioná una profesión"
            :loading="cargandoProfesiones"
            :disabled="!puedeCrear && !puedeModificar"
          />

          <VaSelect
            v-model="form.tipoDato"
            :options="opcionesTipoDato"
            value-by="value"
            text-by="text"
            :rules="[reglas.requerido]"
            label="Tipo de dato"
            placeholder="Seleccioná el tipo de dato"
            :disabled="!puedeCrear && !puedeModificar"
          />

          <VaAlert
            v-if="modoEdicion && esEnumeradoOriginalYConValores && form.tipoDato !== 'ENUMERADO'"
            color="warning"
            class="mt-3"
          >
            Esta característica tiene valores en su catálogo. Para cambiar su tipo a
            TEXTO/NUMERICO primero debés eliminarlos (la operación devolverá un conflicto si se intenta).
          </VaAlert>

          <div v-if="!modoEdicion && form.tipoDato === 'ENUMERADO'" class="gestion-caracteristicas__valores-inline">
            <div class="gestion-caracteristicas__valores-inline-head">
              <span class="gestion-caracteristicas__valores-inline-titulo">Valores de catálogo</span>
              <VaButton
                size="small"
                preset="primary"
                icon="mso-add"
                @click="form.valores.push({ idValor: null, codigo: '', colorHex: '' })"
              >
                Agregar valor
              </VaButton>
            </div>

            <div
              v-for="(valor, i) in form.valores"
              :key="i"
              class="gestion-caracteristicas__valor-fila"
            >
              <input
                type="color"
                class="gestion-caracteristicas__color-picker"
                :value="valor.colorHex || '#000000'"
                :disabled="!puedeCrear && !puedeModificar"
                @input="valor.colorHex = $event.target.value"
              />
              <VaInput
                v-model="valor.codigo"
                :rules="[reglas.requerido, reglas.max50, reglas.hex(valor.colorHex)]"
                placeholder="Código del valor"
                class="gestion-caracteristicas__valor-codigo"
              />
              <VaInput
                v-model="valor.colorHex"
                :rules="[reglas.max50, reglas.hex(valor.colorHex)]"
                placeholder="#RRGGBB (opcional)"
                class="gestion-caracteristicas__valor-hex"
              />
              <VaButton
                preset="secondary"
                icon="mso-close"
                :disabled="form.valores.length === 1"
                @click="form.valores.splice(i, 1)"
              />
            </div>
          </div>
        </div>
      </VaForm>

      <template #footer>
        <div class="gestion-caracteristicas__modal-footer">
          <VaButton preset="secondary" @click="modalCaracteristicaVisible = false">Cancelar</VaButton>
          <VaButton
            v-if="puedeCrear || puedeModificar"
            color="primary"
            :loading="guardando"
            @click="guardarCaracteristica"
          >
            {{ modoEdicion ? 'Guardar cambios' : 'Crear característica' }}
          </VaButton>
        </div>
      </template>
    </VaModal>

    <!-- Modal gestor de valores -->
    <VaModal
      v-model="modalValoresVisible"
      :title="`Valores de ${caracteristicaValores?.codigo || ''}`"
      close-button
      hide-default-actions
      size="large"
    >
      <VaAlert v-if="errorValores" color="danger" class="mb-3">
        {{ errorValores }}
      </VaAlert>

      <VaButton
        v-if="puedeCrear"
        size="small"
        color="primary"
        icon="mso-add"
        class="mb-3"
        @click="abrirNuevoValor"
      >
        Agregar valor
      </VaButton>

      <div v-if="valorFormVisible" class="gestion-caracteristicas__valor-edicion">
        <input
          type="color"
          class="gestion-caracteristicas__color-picker"
          :value="valorForm.colorHex || '#000000'"
          @input="valorForm.colorHex = $event.target.value"
        />
        <VaInput
          v-model="valorForm.codigo"
          :rules="[reglas.requerido, reglas.max50]"
          placeholder="Código del valor"
          class="gestion-caracteristicas__valor-codigo"
        />
        <VaInput
          v-model="valorForm.colorHex"
          :rules="[reglas.max50, reglas.hex(valorForm.colorHex)]"
          placeholder="#RRGGBB (opcional)"
          class="gestion-caracteristicas__valor-hex"
        />
        <div class="gestion-caracteristicas__valor-edicion-acciones">
          <VaButton preset="secondary" size="small" @click="valorFormVisible = false">Cancelar</VaButton>
          <VaButton color="primary" size="small" :loading="guardandoValor" @click="guardarValor">
            {{ valorEditandoId ? 'Guardar' : 'Agregar' }}
          </VaButton>
        </div>
      </div>

      <div v-if="!caracteristicaValores || (caracteristicaValores.valores || []).length === 0" class="gestion-caracteristicas__estado">
        <span class="material-symbols-outlined gestion-caracteristicas__estado-icono">format_list_bulleted</span>
        No hay valores para esta característica.
      </div>

      <VaDataTable
        v-else
        :items="caracteristicaValores.valores"
        :columns="columnasValores"
        :per-page="10"
        striped
        hoverable
      >
        <template #cell(codigo)="{ value }">
          <span :title="value">{{ labelValor(value) }}</span>
        </template>

        <template #cell(colorHex)="{ value }">
          <span v-if="value" class="gestion-caracteristicas__valor-color">
            <span class="gestion-caracteristicas__swatch" :style="{ background: value }"></span>
            {{ value }}
          </span>
          <span v-else class="gestion-caracteristicas__texto-muted">—</span>
        </template>

        <template #cell(acciones)="{ rowData }">
          <div class="gestion-caracteristicas__acciones">
            <VaButton
              v-if="puedeModificar"
              size="small"
              preset="primary"
              icon="mso-edit"
              @click="abrirEditarValor(rowData)"
            />
            <VaButton
              v-if="puedeEliminar"
              size="small"
              color="danger"
              icon="mso-delete"
              @click="confirmarEliminarValor(rowData)"
            />
          </div>
        </template>
      </VaDataTable>
    </VaModal>
  </div>
</template>

<script>
import adminCaracteristicasService from "../../services/adminCaracteristicasService";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

const TIPOS = ["ENUMERADO", "TEXTO", "NUMERICO"];

const ETIQUETAS_CARACTERISTICAS = {
  altura: "Altura",
  peso: "Peso",
  color_piel: "Color de piel",
  color_ojos: "Color de ojos",
  color_cabello: "Color de cabello",
  talle: "Talle",
  talle_calzado: "Talle de calzado",
  medidas: "Medidas",
};

function etiquetaValor(codigo) {
  const sinonimos = {
    marron: "Marrón",
    negro: "Negro",
    caoba: "Caoba",
    castanio: "Castaño",
    castano: "Castaño",
    rubio: "Rubio",
    rubia: "Rubia",
    pelirrojo: "Pelirrojo",
    otto: "Otro",
    otro: "Otro",
    celeste: "Celeste",
    verde: "Verde",
    azul: "Azul",
    gris: "Gris",
    blanco: "Blanco",
  };
  return sinonimos[codigo] || codigo;
}

export default {
  name: "GestionarCaracteristicasView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      cargando: false,
      guardando: false,
      cargandoProfesiones: false,
      caracteristicas: [],
      profesiones: [],
      busqueda: "",
      successMessage: "",
      errorMessage: "",

      columnas: [
        { key: "idCaracteristica", label: "ID" },
        { key: "codigo", label: "Código", sortable: true },
        { key: "unidad", label: "Unidad" },
        { key: "profesion", label: "Profesión", sortable: true },
        { key: "tipoDato", label: "Tipo" },
        { key: "cantValores", label: "Cant." },
        { key: "acciones", label: "ACCIONES" },
      ],

      columnasValores: [
        { key: "idValor", label: "ID" },
        { key: "codigo", label: "Código", sortable: true },
        { key: "colorHex", label: "Color" },
        { key: "acciones", label: "Acciones" },
      ],

      opcionesTipoDato: TIPOS.map((t) => ({ text: t, value: t })),

      modalCaracteristicaVisible: false,
      modoEdicion: false,
      esEnumeradoOriginal: false,
      form: {
        idCaracteristica: null,
        codigo: "",
        unidad: "",
        idProfesion: null,
        tipoDato: null,
        valores: [],
      },

      modalValoresVisible: false,
      caracteristicaValores: null,
      errorValores: "",
      valorFormVisible: false,
      valorEditandoId: null,
      valorForm: { codigo: "", colorHex: "" },
      guardandoValor: false,

      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        max50: (v) => !v || String(v).length <= 50 || "Máximo 50 caracteres",
        hex: (v) => {
          if (!v) return true;
          return /^#[0-9A-Fa-f]{6}$/.test(v) || "Formato inválido (#RRGGBB)";
        },
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
    caracteristicasFiltradas() {
      const texto = this.busqueda.trim().toLowerCase();
      if (!texto) return this.caracteristicas;
      return this.caracteristicas.filter((c) =>
        [c.codigo, c.unidad, c.profesion].some((v) =>
          String(v || "").toLowerCase().includes(texto)
        )
      );
    },
    esEnumeradoOriginalYConValores() {
      return this.esEnumeradoOriginal && (this.form.valores || []).length > 0;
    },
  },
  async mounted() {
    await Promise.all([this.cargarCaracteristicas(), this.cargarProfesiones()]);
  },
  methods: {
    colorTipoDato(tipo) {
      if (tipo === "ENUMERADO") return "success";
      if (tipo === "NUMERICO") return "info";
      return "warning";
    },

    labelCaracteristica(codigo) {
      if (!codigo) return codigo;
      return ETIQUETAS_CARACTERISTICAS[codigo] || codigo;
    },

    labelValor(codigo) {
      if (!codigo) return codigo;
      return etiquetaValor(codigo);
    },

    async cargarCaracteristicas() {
      if (!this.puedeVer) return;
      this.cargando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminCaracteristicasService.listar();
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : datos?.caracteristicas || [];
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudieron cargar las características.";
      } finally {
        this.cargando = false;
      }
    },

    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await adminCaracteristicasService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        // la profesión se muestra en la tabla desde la lista; el selector usa esta carga
      } finally {
        this.cargandoProfesiones = false;
      }
    },

    abrirCrear() {
      this.modoEdicion = false;
      this.esEnumeradoOriginal = false;
      this.form = {
        idCaracteristica: null,
        codigo: "",
        unidad: "",
        idProfesion: null,
        tipoDato: null,
        valores: [],
      };
      this.successMessage = "";
      this.errorMessage = "";
      this.modalCaracteristicaVisible = true;
    },

    abrirEditar(carac) {
      this.modoEdicion = true;
      this.esEnumeradoOriginal = carac.tipoDato === "ENUMERADO";
      this.form = {
        idCaracteristica: carac.idCaracteristica,
        codigo: carac.codigo || "",
        unidad: carac.unidad || "",
        idProfesion: carac.idProfesion,
        tipoDato: carac.tipoDato,
        valores: (carac.valores || []).map((v) => ({ ...v })),
      };
      this.successMessage = "";
      this.errorMessage = "";
      this.modalCaracteristicaVisible = true;
    },

    buildRequest() {
      const request = {
        codigo: this.form.codigo?.trim(),
        unidad: this.form.unidad?.trim() || null,
        idProfesion: this.form.idProfesion,
        tipoDato: this.form.tipoDato,
      };
      if (!this.modoEdicion && this.form.tipoDato === "ENUMERADO") {
        request.valores = this.form.valores
          .filter((v) => v.codigo && v.codigo.trim())
          .map((v) => ({
            idValor: v.idValor || null,
            codigo: v.codigo.trim(),
            colorHex: v.colorHex && /^#[0-9A-Fa-f]{6}$/.test(v.colorHex) ? v.colorHex : null,
          }));
      }
      return request;
    },

    async guardarCaracteristica() {
      const valid = this.$refs.formCaracteristica?.validate();
      if (!valid) return;

      this.guardando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        if (this.modoEdicion) {
          await adminCaracteristicasService.actualizar(this.form.idCaracteristica, this.buildRequest());
          this.successMessage = "Característica actualizada correctamente.";
        } else {
          await adminCaracteristicasService.crear(this.buildRequest());
          this.successMessage = "Característica creada correctamente.";
        }
        this.modalCaracteristicaVisible = false;
        await this.cargarCaracteristicas();
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo guardar la característica.";
      } finally {
        this.guardando = false;
      }
    },

    confirmarEliminar(carac) {
      if (!window.confirm(`¿Eliminar la característica "${carac.codigo}"? Esta acción no se puede deshacer.`)) return;
      this.eliminarCaracteristica(carac);
    },

    async eliminarCaracteristica(carac) {
      this.successMessage = "";
      this.errorMessage = "";
      try {
        await adminCaracteristicasService.eliminar(carac.idCaracteristica);
        this.successMessage = "Característica eliminada.";
        await this.cargarCaracteristicas();
      } catch (error) {
        const status = error?.response?.status;
        const mensaje =
          status === 409
            ? "No se puede eliminar: la característica está en uso por uno o más perfiles."
            : error?.response?.data?.message || "No se pudo eliminar la característica.";
        this.errorMessage = mensaje;
      }
    },

    // ---- Gestión de valores ----
    abrirValores(carac) {
      this.caracteristicaValores = { ...carac, valores: (carac.valores || []).map((v) => ({ ...v })) };
      this.errorValores = "";
      this.valorFormVisible = false;
      this.modalValoresVisible = true;
    },

    abrirNuevoValor() {
      this.valorEditandoId = null;
      this.valorForm = { codigo: "", colorHex: "" };
      this.valorFormVisible = true;
    },

    abrirEditarValor(valor) {
      this.valorEditandoId = valor.idValor;
      this.valorForm = { codigo: valor.codigo || "", colorHex: valor.colorHex || "" };
      this.valorFormVisible = true;
    },

    async guardarValor() {
      if (!this.valorForm.codigo || !this.valorForm.codigo.trim()) {
        this.errorValores = "El código del valor es requerido.";
        return;
      }
      const colorHex = this.valorForm.colorHex && /^#[0-9A-Fa-f]{6}$/.test(this.valorForm.colorHex)
        ? this.valorForm.colorHex
        : null;

      this.guardandoValor = true;
      this.errorValores = "";
      try {
        if (this.valorEditandoId) {
          await adminCaracteristicasService.actualizarValor(this.valorEditandoId, {
            idValor: null,
            codigo: this.valorForm.codigo.trim(),
            colorHex,
          });
        } else {
          await adminCaracteristicasService.agregarValor(this.caracteristicaValores.idCaracteristica, {
            idValor: null,
            codigo: this.valorForm.codigo.trim(),
            colorHex,
          });
        }
        this.valorFormVisible = false;
        await this.cargarCaracteristicas();
        await this.recargarValoresModal();
      } catch (error) {
        const status = error?.response?.status;
        const mensaje =
          status === 409
            ? "No se pudo guardar: el código ya existe o el valor está en uso."
            : error?.response?.data?.message || "No se pudo guardar el valor.";
        this.errorValores = mensaje;
      } finally {
        this.guardandoValor = false;
      }
    },

    async recargarValoresModal() {
      const id = this.caracteristicaValores?.idCaracteristica;
      if (id == null) return;
      const actualizada = this.caracteristicas.find((c) => c.idCaracteristica === id);
      if (actualizada) {
        this.caracteristicaValores = {
          ...actualizada,
          valores: (actualizada.valores || []).map((v) => ({ ...v })),
        };
      }
    },

    confirmarEliminarValor(valor) {
      if (!window.confirm(`¿Eliminar el valor "${valor.codigo}"? Esta acción no se puede deshacer.`)) return;
      this.eliminarValor(valor);
    },

    async eliminarValor(valor) {
      this.errorValores = "";
      try {
        await adminCaracteristicasService.eliminarValor(valor.idValor);
        await this.cargarCaracteristicas();
        await this.recargarValoresModal();
      } catch (error) {
        const status = error?.response?.status;
        const mensaje =
          status === 409
            ? "No se puede eliminar: el valor está en uso por uno o más perfiles."
            : error?.response?.data?.message || "No se pudo eliminar el valor.";
        this.errorValores = mensaje;
      }
    },
  },
};
</script>

<style scoped>
.gestion-caracteristicas {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.gestion-caracteristicas__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #ff512f 0%, #b865a4 50%, #240b36 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gestion-caracteristicas__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: #6a7385;
}

.gestion-caracteristicas__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1.25rem 0 1rem;
}

.gestion-caracteristicas__buscador {
  width: 100%;
  max-width: 320px;
}

.gestion-caracteristicas__toolbar-acciones {
  display: flex;
  gap: 0.5rem;
}

.gestion-caracteristicas__tabla {
  --va-table-padding: 0.5rem;
}

.gestion-caracteristicas__id {
  font-family: monospace;
  font-size: 0.85rem;
  color: #6a7385;
}

.gestion-caracteristicas__acciones {
  display: grid;
  grid-template-columns: 90px 90px 90px;
  gap: 0.4rem;
  align-items: center;
  justify-items: center;
}

.gestion-caracteristicas__acciones-col {
  width: 90px;
  display: flex;
  justify-content: center;
}

.gestion-caracteristicas__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.gestion-caracteristicas__estado-icono {
  font-size: 2.5rem;
}

/* Form */
.gestion-caracteristicas__form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.gestion-caracteristicas__modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
}

/* Valores inline (creación) */
.gestion-caracteristicas__valores-inline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.gestion-caracteristicas__valores-inline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gestion-caracteristicas__valores-inline-titulo {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1f2937;
}

.gestion-caracteristicas__valor-fila {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.gestion-caracteristicas__valor-codigo {
  flex: 1;
}

.gestion-caracteristicas__valor-hex {
  flex: 1;
}

.gestion-caracteristicas__color-picker {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: #fff;
  flex-shrink: 0;
}

/* Gestor de valores */
.gestion-caracteristicas__valor-edicion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.gestion-caracteristicas__valor-edicion-acciones {
  display: flex;
  gap: 0.4rem;
}

.gestion-caracteristicas__valor-color {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.gestion-caracteristicas__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.gestion-caracteristicas__texto-muted {
  color: #9ca3af;
}
</style>
