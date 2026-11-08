<template>
  <div class="gestion-tipos-contrato">
    <section class="gestion-tipos-contrato__encabezado">
      <h1>Tipos de contrato</h1>
      <p class="gestion-tipos-contrato__subtitulo">
        Administrá el catálogo de tipos de acuerdo disponibles para generar
        contratos. El código se genera automáticamente y no cambia.
      </p>
    </section>

    <div class="gestion-tipos-contrato__toolbar">
      <VaInput
        v-model="busqueda"
        preset="bordered"
        placeholder="Buscar por nombre, código o descripción"
        removable
        class="gestion-tipos-contrato__buscador"
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="grey" size="small" />
        </template>
      </VaInput>

      <div class="gestion-tipos-contrato__toolbar-acciones">
        <VaCheckbox
          v-model="incluirInactivos"
          label="Incluir inactivos"
          class="gestion-tipos-contrato__check"
        />

        <VaButton
          preset="secondary"
          icon="mso-refresh"
          :loading="cargando"
          @click="cargarTipos"
        >
          Actualizar
        </VaButton>

        <VaButton
          v-if="puedeCrear"
          color="primary"
          icon="mso-add"
          @click="abrirCrear"
        >
          Nuevo tipo
        </VaButton>
      </div>
    </div>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <div v-if="!puedeVer" class="gestion-tipos-contrato__estado">
      <span class="material-symbols-outlined gestion-tipos-contrato__estado-icono">lock</span>
      No tenés permisos para ver los tipos de contrato.
    </div>

    <div v-else-if="cargando" class="gestion-tipos-contrato__estado">
      <span class="material-symbols-outlined gestion-tipos-contrato__estado-icono">hourglass_empty</span>
      Cargando tipos de contrato...
    </div>

    <div
      v-else-if="tiposFiltrados.length === 0"
      class="gestion-tipos-contrato__estado"
    >
      <span class="material-symbols-outlined gestion-tipos-contrato__estado-icono">description</span>
      {{
        busqueda.trim()
          ? "No hay tipos de contrato que coincidan con la búsqueda."
          : "No hay tipos de contrato registrados."
      }}
    </div>

    <VaDataTable
      v-else
      class="gestion-tipos-contrato__tabla"
      :items="tiposFiltrados"
      :columns="columnas"
      :per-page="tiposFiltrados.length || 1"
      striped
      hoverable
    >
      <template #cell(nombre)="{ rowData }">
        <div class="gestion-tipos-contrato__celda-nombre">
          <strong>{{ rowData.nombre }}</strong>
          <small v-if="rowData.descripcion">{{ rowData.descripcion }}</small>
        </div>
      </template>

      <template #cell(codigo)="{ value }">
        <code class="gestion-tipos-contrato__codigo">{{ value || "—" }}</code>
      </template>

      <template #cell(estado)="{ rowData }">
        <VaBadge
          :text="rowData.activo ? 'Activo' : 'Inactivo'"
          :color="rowData.activo ? 'success' : 'secondary'"
        />
      </template>

      <template #cell(contratos)="{ rowData }">
        <span :title="textoContratos(rowData)">
          {{ rowData.contratosAsociados }}
        </span>
        <small v-if="rowData.contratosPendientes > 0" class="gestion-tipos-contrato__pendientes">
          {{ rowData.contratosPendientes }} pendiente(s)
        </small>
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="gestion-tipos-contrato__acciones">
          <VaButton
            v-if="puedeModificar"
            size="small"
            preset="primary"
            icon="mso-edit"
            :title="rowData.motivoNoEditable || 'Editar tipo de contrato'"
            @click="abrirEditar(rowData)"
          >
            Editar
          </VaButton>

          <VaButton
            v-if="puedeModificar"
            size="small"
            preset="secondary"
            :color="rowData.activo ? 'danger' : 'success'"
            :disabled="rowData.activo && !rowData.puedeDesactivar"
            :title="rowData.activo
              ? (rowData.motivoNoDesactivable || 'Desactivar tipo de contrato')
              : 'Activar tipo de contrato'"
            @click="confirmarEstado(rowData)"
          >
            {{ rowData.activo ? "Desactivar" : "Activar" }}
          </VaButton>

          <VaButton
            v-if="puedeEliminar"
            size="small"
            color="danger"
            icon="mso-delete"
            :disabled="!rowData.puedeEliminar"
            :title="rowData.motivoNoEliminable || 'Eliminar tipo de contrato'"
            @click="confirmarEliminar(rowData)"
          >
            Eliminar
          </VaButton>
        </div>
      </template>
    </VaDataTable>

    <!-- Alta / edición -->
    <VaModal
      v-model="modalVisible"
      :title="modoEdicion ? 'Editar tipo de contrato' : 'Nuevo tipo de contrato'"
      close-button
      hide-default-actions
      size="large"
      :no-dismiss="guardando"
    >
      <VaForm ref="formTipoContrato" @submit.prevent="guardar">
        <div class="gestion-tipos-contrato__form">
          <BaseAlert v-if="errorMessage" :message="errorMessage" type="error" />

          <VaInput
            v-model="form.nombre"
            :rules="[reglas.requerido, reglas.max100]"
            label="Nombre"
            placeholder="Ej: Acuerdo de confidencialidad"
            counter
            :max-length="100"
            :disabled="modoEdicion && form.puedeEditar === false"
            :error="!!errores.nombre"
            :error-messages="errores.nombre || undefined"
          />

          <VaInput
            v-model="form.descripcion"
            type="textarea"
            label="Descripción"
            placeholder="Descripción opcional del tipo de contrato"
            :max-length="200"
            counter
            :rows="3"
            :error="!!errores.descripcion"
            :error-messages="errores.descripcion || undefined"
          />

          <VaInput
            v-if="modoEdicion"
            v-model="form.codigo"
            label="Código"
            readonly
            disabled
            hint="El código se genera automáticamente y no cambia."
          />

          <div>
            <VaInput
              v-model="form.plantilla"
              type="textarea"
              label="Plantilla legal"
              placeholder="Escribí la plantilla del contrato..."
              :max-length="100000"
              counter
              :rows="14"
              :disabled="modoEdicion && form.puedeEditar === false"
              :error="!!errores.plantilla"
              :error-messages="errores.plantilla || undefined"
            />

            <div class="gestion-tipos-contrato__placeholders">
              <span class="gestion-tipos-contrato__placeholders-label">
                Insertar placeholder:
              </span>
              <VaButton
                v-for="placeholder in placeholders"
                :key="placeholder.token"
                size="small"
                preset="secondary"
                :disabled="modoEdicion && form.puedeEditar === false"
                @click="insertarPlaceholder(placeholder.token)"
              >
                {{ placeholder.token }}
              </VaButton>
            </div>
          </div>

          <p v-if="modoEdicion && form.puedeEditar === false" class="gestion-tipos-contrato__hint">
            Este tipo tiene contratos pendientes o activos asociados. Solo podés
            modificar la descripción.
          </p>

          <div class="gestion-tipos-contrato__validacion-acciones">
            <VaButton
              preset="secondary"
              :loading="validando"
              icon="mso-fact-check"
              @click="validarPlantilla"
            >
              Validar plantilla
            </VaButton>
          </div>

          <div v-if="validacion" class="gestion-tipos-contrato__validacion">
            <VaBadge
              :text="validacion.valido ? 'Plantilla válida' : 'Plantilla con errores'"
              :color="validacion.valido ? 'success' : 'danger'"
            />

            <ul v-if="validacion.placeholdersDesconocidos?.length" class="gestion-tipos-contrato__lista">
              <li v-for="item in validacion.placeholdersDesconocidos" :key="item">
                Placeholder desconocido: <code>{{ item }}</code>
              </li>
            </ul>

            <ul v-if="validacion.placeholdersConFormatoInvalido?.length" class="gestion-tipos-contrato__lista">
              <li v-for="item in validacion.placeholdersConFormatoInvalido" :key="item">
                Formato inválido: <code>{{ item }}</code>. Debe ser exactamente
                <code>{{ item.trim() }}</code>.
              </li>
            </ul>

            <ul v-if="validacion.advertencias?.length" class="gestion-tipos-contrato__lista gestion-tipos-contrato__lista--advertencia">
              <li v-for="item in validacion.advertencias" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </VaForm>

      <template #footer>
        <div class="gestion-tipos-contrato__modal-acciones">
          <VaButton
            preset="secondary"
            :disabled="guardando"
            @click="cerrarModal"
          >
            Cancelar
          </VaButton>
          <VaButton
            preset="primary"
            :loading="guardando"
            :disabled="modoEdicion && form.puedeEditar === false && !soloDescripcionCambiada"
            @click="guardar"
          >
            {{ modoEdicion ? "Guardar cambios" : "Crear tipo" }}
          </VaButton>
        </div>
      </template>
    </VaModal>

    <!-- Activar / desactivar -->
    <VaModal
      v-model="modalEstadoVisible"
      size="small"
      close-button
      hide-default-actions
      :no-dismiss="cambiandoEstado"
    >
      <template #header>
        <h3 class="va-h5">
          {{ nuevoEstado ? "Activar" : "Desactivar" }} tipo de contrato
        </h3>
      </template>

      <p>
        ¿Querés {{ nuevoEstado ? "activar" : "desactivar" }}
        <strong>{{ tipoEstado?.nombre }}</strong>?
      </p>
      <p v-if="!nuevoEstado" class="gestion-tipos-contrato__hint">
        El tipo dejará de aparecer en el desplegable de generación de contratos.
        Los contratos existentes no se modifican.
      </p>

      <template #footer>
        <div class="gestion-tipos-contrato__modal-acciones">
          <VaButton
            preset="secondary"
            :disabled="cambiandoEstado"
            @click="cerrarEstado"
          >
            Cancelar
          </VaButton>
          <VaButton
            :color="nuevoEstado ? 'success' : 'danger'"
            :loading="cambiandoEstado"
            @click="ejecutarCambioEstado"
          >
            {{ nuevoEstado ? "Activar" : "Desactivar" }}
          </VaButton>
        </div>
      </template>
    </VaModal>

    <!-- Eliminar -->
    <VaModal
      v-model="modalEliminarVisible"
      size="small"
      close-button
      hide-default-actions
      :no-dismiss="eliminando"
    >
      <template #header>
        <h3 class="va-h5">Eliminar tipo de contrato</h3>
      </template>

      <p>
        ¿Querés eliminar <strong>{{ tipoEliminar?.nombre }}</strong>?
        Esta acción es física y no se puede deshacer.
      </p>
      <p class="gestion-tipos-contrato__hint">
        Solo se permite si el tipo no tiene ningún contrato asociado. Si tiene
        contratos, usá “Desactivar” para retirarlo del catálogo de generación.
      </p>

      <template #footer>
        <div class="gestion-tipos-contrato__modal-acciones">
          <VaButton
            preset="secondary"
            :disabled="eliminando"
            @click="cerrarEliminar"
          >
            Cancelar
          </VaButton>
          <VaButton
            color="danger"
            :loading="eliminando"
            @click="ejecutarEliminar"
          >
            Eliminar tipo
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminTiposContratoService from "../../services/adminTiposContratoService";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

const PLACEHOLDERS = [
  { token: "{{proyecto}}", descripcion: "Nombre y descripción del proyecto" },
  { token: "{{director}}", descripcion: "Director que emite el contrato" },
  { token: "{{partes}}", descripcion: "Destinatarios del contrato" },
  { token: "{{clausulas_adicionales}}", descripcion: "Cláusulas adicionales" },
  { token: "{{tipo}}", descripcion: "Nombre del tipo de contrato" },
];

const COLUMNAS = [
  { key: "nombre", label: "Nombre", sortable: true, width: "28%" },
  { key: "codigo", label: "Código", sortable: true, width: "18%" },
  { key: "estado", label: "Estado", sortable: true, width: "10%" },
  { key: "contratos", label: "Contratos", sortable: true, width: "12%" },
  { key: "acciones", label: "Acciones", sortable: false, width: "32%" },
];

export default {
  name: "GestionTiposContratoView",
  components: { BaseAlert },
  data() {
    return {
      tipos: [],
      busqueda: "",
      incluirInactivos: true,
      cargando: false,
      successMessage: "",
      errorMessage: "",
      columnas: COLUMNAS,
      placeholders: PLACEHOLDERS,
      modalVisible: false,
      modoEdicion: false,
      form: {
        idTipoAcuerdo: null,
        codigo: "",
        nombre: "",
        descripcion: "",
        plantilla: "",
        puedeEditar: true,
      },
      formOriginal: null,
      errores: {},
      guardando: false,
      validando: false,
      validacion: null,
      modalEstadoVisible: false,
      tipoEstado: null,
      nuevoEstado: false,
      cambiandoEstado: false,
      modalEliminarVisible: false,
      tipoEliminar: null,
      eliminando: false,
      reglas: {
        requerido: (v) => !!String(v || "").trim() || "Este campo es requerido.",
        max100: (v) =>
          !v || String(v).length <= 100 || "Máximo 100 caracteres.",
        max200: (v) =>
          !v || String(v).length <= 200 || "Máximo 200 caracteres.",
      },
    };
  },
  computed: {
    puedeVer() {
      return tienePermiso("VER_TIPOS_CONTRATO");
    },
    puedeCrear() {
      return tienePermiso("CREAR_TIPO_CONTRATO");
    },
    puedeModificar() {
      return tienePermiso("MODIFICAR_TIPO_CONTRATO");
    },
    puedeEliminar() {
      return tienePermiso("ELIMINAR_TIPO_CONTRATO");
    },
    tiposFiltrados() {
      const texto = this.busqueda.trim().toLowerCase();
      return this.tipos.filter((tipo) => {
        if (!this.incluirInactivos && !tipo.activo) return false;
        if (!texto) return true;
        return [tipo.nombre, tipo.codigo, tipo.descripcion].some((valor) =>
          String(valor || "").toLowerCase().includes(texto)
        );
      });
    },
    soloDescripcionCambiada() {
      if (!this.modoEdicion || !this.formOriginal) return false;
      const original = this.formOriginal;
      return (
        String(this.form.descripcion || "") !== String(original.descripcion || "")
      );
    },
  },
  watch: {
    busqueda() {
      this.successMessage = "";
    },
    "form.plantilla"() {
      this.validacion = null;
    },
  },
  async mounted() {
    await this.cargarTipos();
  },
  methods: {
    async cargarTipos() {
      if (!this.puedeVer) return;
      this.cargando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminTiposContratoService.listar({
          incluirInactivos: true,
        });
        const datos = response?.data;
        this.tipos = Array.isArray(datos) ? datos : datos?.tipos || [];
      } catch (error) {
        this.tipos = [];
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudieron cargar los tipos de contrato.";
      } finally {
        this.cargando = false;
      }
    },
    abrirCrear() {
      if (!this.puedeCrear) return;
      this.modoEdicion = false;
      this.form = {
        idTipoAcuerdo: null,
        codigo: "",
        nombre: "",
        descripcion: "",
        plantilla: "",
        puedeEditar: true,
      };
      this.formOriginal = null;
      this.errores = {};
      this.validacion = null;
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
    },
    abrirEditar(tipo) {
      if (!this.puedeModificar) return;
      this.modoEdicion = true;
      this.form = {
        idTipoAcuerdo: tipo?.idTipoAcuerdo ?? null,
        codigo: tipo?.codigo || "",
        nombre: tipo?.nombre || "",
        descripcion: tipo?.descripcion || "",
        plantilla: "",
        puedeEditar: tipo?.puedeEditar !== false,
      };
      this.formOriginal = {
        nombre: tipo?.nombre || "",
        descripcion: tipo?.descripcion || "",
        plantilla: "",
      };
      this.errores = {};
      this.validacion = null;
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
      this.cargarPlantilla(tipo.idTipoAcuerdo);
    },
    async cargarPlantilla(idTipoAcuerdo) {
      try {
        const response = await adminTiposContratoService.obtener(idTipoAcuerdo);
        const detalle = response?.data;
        if (!detalle) return;
        this.form.plantilla = detalle.plantilla || "";
        this.form.puedeEditar = detalle.puedeEditar !== false;
        this.formOriginal = {
          nombre: detalle.nombre || "",
          descripcion: detalle.descripcion || "",
          plantilla: detalle.plantilla || "",
        };
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo cargar la plantilla del tipo de contrato.";
      }
    },
    cerrarModal() {
      if (this.guardando) return;
      this.modalVisible = false;
      this.errores = {};
      this.validacion = null;
    },
    insertarPlaceholder(token) {
      if (this.guardando) return;
      if (this.modoEdicion && this.form.puedeEditar === false) return;
      const texto = String(this.form.plantilla || "");
      const separador = texto && !texto.endsWith(" ") && !texto.endsWith("\n") ? " " : "";
      this.form.plantilla = `${texto}${separador}${token}`;
    },
    async validarPlantilla() {
      if (this.validando) return;
      const plantilla = String(this.form.plantilla || "").trim();
      if (!plantilla) {
        this.errores = { ...this.errores, plantilla: "La plantilla es obligatoria." };
        return;
      }
      this.validando = true;
      this.errorMessage = "";
      try {
        const response = await adminTiposContratoService.validarPlantilla(plantilla);
        this.validacion = response?.data || null;
      } catch (error) {
        this.validacion = null;
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo validar la plantilla.";
      } finally {
        this.validando = false;
      }
    },
    async guardar() {
      if (this.guardando) return;
      if (!this.modoEdicion && !this.puedeCrear) return;
      if (this.modoEdicion && !this.puedeModificar) return;

      const nombre = String(this.form.nombre || "").trim();
      const descripcion = String(this.form.descripcion || "").trim();
      const plantilla = String(this.form.plantilla || "").trim();

      if (!nombre) {
        this.errores = { ...this.errores, nombre: "El nombre es obligatorio." };
        return;
      }
      if (nombre.length > 100) {
        this.errores = {
          ...this.errores,
          nombre: "El nombre no puede superar los 100 caracteres.",
        };
        return;
      }
      if (descripcion.length > 200) {
        this.errores = {
          ...this.errores,
          descripcion: "La descripción no puede superar los 200 caracteres.",
        };
        return;
      }
      if (!plantilla) {
        this.errores = {
          ...this.errores,
          plantilla: "La plantilla es obligatoria.",
        };
        return;
      }

      const contenidoCambiado =
        !this.modoEdicion ||
        nombre !== this.formOriginal?.nombre ||
        plantilla !== String(this.formOriginal?.plantilla || "").trim();
      if (this.modoEdicion && this.form.puedeEditar === false && contenidoCambiado) {
        this.errorMessage =
          "Este tipo tiene contratos pendientes o activos asociados. Solo podés modificar la descripción.";
        return;
      }

      this.guardando = true;
      this.errores = {};
      this.errorMessage = "";

      try {
        if (this.modoEdicion) {
          await adminTiposContratoService.actualizar(this.form.idTipoAcuerdo, {
            nombre,
            descripcion: descripcion || null,
            plantilla,
          });
          this.successMessage = "Tipo de contrato actualizado correctamente.";
        } else {
          await adminTiposContratoService.crear({
            nombre,
            descripcion: descripcion || null,
            plantilla,
            activo: true,
          });
          this.successMessage = "Tipo de contrato creado correctamente.";
        }

        this.modalVisible = false;
        this.validacion = null;
        await this.cargarTipos();
      } catch (error) {
        this.manejarErrorGuardado(error);
      } finally {
        this.guardando = false;
      }
    },
    manejarErrorGuardado(error) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      const mensaje = data.message || data.mensaje || "";

      if (data.validacion) {
        this.validacion = data.validacion;
      }

      if (status === 400) {
        if (data.errores && typeof data.errores === "object" && !Array.isArray(data.errores)) {
          this.errores = { ...data.errores };
          this.errorMessage = "Revisá los datos marcados.";
        } else {
          this.errorMessage = mensaje || "Revisá los datos del tipo de contrato.";
        }
        return;
      }

      if (status === 403) {
        this.errorMessage =
          mensaje || "No tenés permiso para realizar esta acción.";
        return;
      }

      if (status === 404) {
        this.errorMessage = mensaje || "El tipo de contrato ya no existe.";
        this.modalVisible = false;
        this.cargarTipos();
        return;
      }

      if (status === 409) {
        this.errorMessage =
          mensaje || "El tipo de contrato no se puede modificar en este momento.";
        this.cargarTipos();
        return;
      }

      if (!status || status >= 500) {
        this.errorMessage =
          "Ocurrió un error al guardar el tipo de contrato. Inténtalo nuevamente.";
        return;
      }

      this.errorMessage = mensaje || "No se pudo guardar el tipo de contrato.";
    },
    confirmarEstado(tipo) {
      if (!this.puedeModificar) return;
      this.tipoEstado = tipo;
      this.nuevoEstado = !tipo.activo;
      this.modalEstadoVisible = true;
      this.errorMessage = "";
      this.successMessage = "";
    },
    cerrarEstado() {
      if (this.cambiandoEstado) return;
      this.modalEstadoVisible = false;
      this.tipoEstado = null;
    },
    async ejecutarCambioEstado() {
      if (this.cambiandoEstado || !this.tipoEstado) return;
      this.cambiandoEstado = true;
      this.errorMessage = "";
      this.successMessage = "";
      try {
        await adminTiposContratoService.cambiarEstado(
          this.tipoEstado.idTipoAcuerdo,
          this.nuevoEstado
        );
        this.modalEstadoVisible = false;
        this.tipoEstado = null;
        await this.cargarTipos();
        this.successMessage = this.nuevoEstado
          ? "Tipo de contrato activado correctamente."
          : "Tipo de contrato desactivado correctamente.";
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";
        if (status === 409) {
          this.errorMessage =
            mensaje || "El tipo de contrato no se puede cambiar de estado.";
        } else if (status === 403) {
          this.errorMessage =
            mensaje || "No tenés permiso para cambiar el estado.";
        } else {
          this.errorMessage =
            mensaje || "No se pudo cambiar el estado del tipo de contrato.";
        }
        this.modalEstadoVisible = false;
        this.tipoEstado = null;
      } finally {
        this.cambiandoEstado = false;
      }
    },
    confirmarEliminar(tipo) {
      if (!this.puedeEliminar || !tipo?.puedeEliminar) return;
      this.tipoEliminar = tipo;
      this.modalEliminarVisible = true;
      this.errorMessage = "";
      this.successMessage = "";
    },
    cerrarEliminar() {
      if (this.eliminando) return;
      this.modalEliminarVisible = false;
      this.tipoEliminar = null;
    },
    async ejecutarEliminar() {
      if (this.eliminando || !this.tipoEliminar) return;
      this.eliminando = true;
      this.errorMessage = "";
      this.successMessage = "";
      try {
        await adminTiposContratoService.eliminar(this.tipoEliminar.idTipoAcuerdo);
        this.modalEliminarVisible = false;
        this.tipoEliminar = null;
        await this.cargarTipos();
        this.successMessage = "Tipo de contrato eliminado correctamente.";
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";
        if (status === 409) {
          this.errorMessage =
            mensaje ||
            "El tipo de contrato tiene contratos asociados y no se puede eliminar.";
        } else if (status === 404) {
          this.errorMessage = mensaje || "El tipo de contrato ya no existe.";
          await this.cargarTipos();
        } else if (status === 403) {
          this.errorMessage =
            mensaje || "No tenés permiso para eliminar tipos de contrato.";
        } else {
          this.errorMessage =
            mensaje || "No se pudo eliminar el tipo de contrato.";
        }
        this.modalEliminarVisible = false;
        this.tipoEliminar = null;
      } finally {
        this.eliminando = false;
      }
    },
    textoContratos(tipo) {
      return `${tipo.contratosAsociados} contrato(s) asociado(s), `
        + `${tipo.contratosVivos} vivo(s) y ${tipo.contratosPendientes} pendiente(s).`;
    },
  },
};
</script>

<style scoped>
.gestion-tipos-contrato {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-tipos-contrato__encabezado h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
}

.gestion-tipos-contrato__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.gestion-tipos-contrato__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.gestion-tipos-contrato__buscador {
  max-width: 420px;
  min-width: 240px;
  flex: 1 1 280px;
}

.gestion-tipos-contrato__toolbar-acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.gestion-tipos-contrato__check {
  margin-right: 0.25rem;
}

.gestion-tipos-contrato__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.gestion-tipos-contrato__estado-icono {
  font-size: 2.5rem;
}

.gestion-tipos-contrato__tabla {
  width: 100%;
  max-width: 1200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  --va-data-table-cell-padding: 0.65rem 0.8rem;
}

.gestion-tipos-contrato__tabla :deep(.va-data-table__table) {
  table-layout: fixed;
  white-space: normal;
}

.gestion-tipos-contrato__tabla :deep(.va-data-table__table-th) {
  white-space: normal;
}

.gestion-tipos-contrato__tabla :deep(.va-data-table__table td) {
  overflow-wrap: anywhere;
}

.gestion-tipos-contrato__celda-nombre {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.gestion-tipos-contrato__celda-nombre small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.gestion-tipos-contrato__codigo {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.gestion-tipos-contrato__pendientes {
  display: block;
  color: var(--color-warning);
  font-size: 0.7rem;
}

.gestion-tipos-contrato__acciones {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.gestion-tipos-contrato__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-tipos-contrato__placeholders {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.gestion-tipos-contrato__placeholders-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.gestion-tipos-contrato__validacion-acciones {
  display: flex;
  justify-content: flex-start;
}

.gestion-tipos-contrato__validacion {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.gestion-tipos-contrato__lista {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.gestion-tipos-contrato__lista--advertencia {
  color: var(--color-warning);
}

.gestion-tipos-contrato__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.gestion-tipos-contrato__modal-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}
</style>
