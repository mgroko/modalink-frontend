<template>
  <div class="gestion-habilidades">
    <section class="gestion-habilidades__encabezado">
      <h1>Habilidades</h1>
      <p class="gestion-habilidades__subtitulo">
        Administrá el catálogo global de habilidades profesionales.
      </p>
    </section>

    <div class="gestion-habilidades__toolbar">
      <VaInput
        v-model="busqueda"
        preset="bordered"
        placeholder="Buscar por nombre, código o descripción"
        removable
        class="gestion-habilidades__buscador"
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="grey" size="small" />
        </template>
      </VaInput>

      <div class="gestion-habilidades__toolbar-acciones">
        <VaButton
          preset="secondary"
          icon="mso-refresh"
          :loading="cargando"
          @click="cargarHabilidades"
        >
          Actualizar
        </VaButton>

        <VaButton
          v-if="puedeCrear"
          color="primary"
          icon="mso-add"
          @click="abrirCrear"
        >
          Nueva habilidad
        </VaButton>
      </div>
    </div>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <div v-if="!puedeVer" class="gestion-habilidades__estado">
      <span class="material-symbols-outlined gestion-habilidades__estado-icono">lock</span>
      No tenés permisos para ver las habilidades.
    </div>

    <div v-else-if="cargando" class="gestion-habilidades__estado">
      <span class="material-symbols-outlined gestion-habilidades__estado-icono">hourglass_empty</span>
      Cargando habilidades...
    </div>

    <div
      v-else-if="habilidadesFiltradas.length === 0"
      class="gestion-habilidades__estado"
    >
      <span class="material-symbols-outlined gestion-habilidades__estado-icono">auto_awesome</span>
      {{
        busqueda.trim()
          ? "No hay habilidades que coincidan con la búsqueda."
          : "No hay habilidades registradas."
      }}
    </div>

    <VaDataTable
      v-else
      class="gestion-habilidades__tabla"
      :items="habilidadesFiltradas"
      :columns="columnas"
      :per-page="habilidadesFiltradas.length || 1"
      striped
      hoverable
    >
      <template #cell(nombre)="{ value }">
        <span :title="value">{{ value || "—" }}</span>
      </template>

      <template #cell(descripcion)="{ value }">
        <span :title="value || ''">{{ value || "—" }}</span>
      </template>

      <template #cell(codigo)="{ value }">
        <code class="gestion-habilidades__codigo">{{ value || "—" }}</code>
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="gestion-habilidades__acciones">
          <VaButton
            v-if="puedeModificar"
            size="small"
            preset="primary"
            icon="mso-edit"
            @click="abrirEditar(rowData)"
          >
            Editar
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

    <VaModal
      v-model="modalVisible"
      :title="modoEdicion ? 'Editar habilidad' : 'Nueva habilidad'"
      close-button
      hide-default-actions
      size="large"
      :no-dismiss="guardando"
    >
      <VaForm ref="formHabilidad" @submit.prevent="guardar">
        <div class="gestion-habilidades__form">
          <BaseAlert v-if="errorMessage" :message="errorMessage" type="error" />

          <VaInput
            v-model="form.nombre"
            :rules="[reglas.requerido, reglas.max255]"
            label="Nombre"
            placeholder="Ej: Fotografía de Estudio"
            counter
            :max-length="255"
            :error="!!errores.nombre"
            :error-messages="errores.nombre || undefined"
          />

          <VaInput
            v-model="form.descripcion"
            type="textarea"
            label="Descripción"
            placeholder="Descripción opcional de la habilidad"
            :max-length="255"
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
          <p v-else class="gestion-habilidades__hint">
            El código se genera automáticamente a partir del nombre.
          </p>
        </div>
      </VaForm>

      <template #footer>
        <div class="gestion-habilidades__modal-acciones">
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
            @click="guardar"
          >
            {{ modoEdicion ? "Guardar cambios" : "Crear habilidad" }}
          </VaButton>
        </div>
      </template>
    </VaModal>

    <VaModal
      v-model="modalEliminarVisible"
      size="small"
      close-button
      hide-default-actions
      :no-dismiss="eliminando"
    >
      <template #header>
        <h3 class="va-h5">Eliminar habilidad</h3>
      </template>

      <p>
        ¿Querés eliminar <strong>{{ habilidadEliminar?.nombre }}</strong>?
        Esta acción es física y también quitará la habilidad de los perfiles
        asociados.
      </p>
      <p class="gestion-habilidades__hint">
        Si la habilidad está en uso por algún proyecto o actividad, el sistema
        rechazará la baja.
      </p>

      <template #footer>
        <div class="gestion-habilidades__modal-acciones">
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
            Eliminar habilidad
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminHabilidadesService from "../../services/adminHabilidadesService";
import habilidadService from "../../services/habilidadService";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

const COLUMNAS = [
  { key: "nombre", label: "Nombre", sortable: true },
  { key: "descripcion", label: "Descripción" },
  { key: "codigo", label: "Código", sortable: true },
  { key: "acciones", label: "Acciones", sortable: false },
];

export default {
  name: "GestionHabilidadesView",
  components: { BaseAlert },
  data() {
    return {
      habilidades: [],
      busqueda: "",
      cargando: false,
      successMessage: "",
      errorMessage: "",
      columnas: COLUMNAS,
      modalVisible: false,
      modoEdicion: false,
      form: {
        idHabilidad: null,
        nombre: "",
        descripcion: "",
        codigo: "",
      },
      errores: {},
      guardando: false,
      modalEliminarVisible: false,
      habilidadEliminar: null,
      eliminando: false,
      reglas: {
        requerido: (v) => !!String(v || "").trim() || "Este campo es requerido.",
        max255: (v) =>
          !v || String(v).length <= 255 || "Máximo 255 caracteres.",
      },
    };
  },
  computed: {
    puedeVer() {
      return tienePermiso("VER_HABILIDADES");
    },
    puedeCrear() {
      return tienePermiso("CREAR_HABILIDAD");
    },
    puedeModificar() {
      return tienePermiso("MODIFICAR_HABILIDAD");
    },
    puedeEliminar() {
      return tienePermiso("ELIMINAR_HABILIDAD");
    },
    habilidadesFiltradas() {
      const texto = this.busqueda.trim().toLowerCase();
      if (!texto) return this.habilidades;
      return this.habilidades.filter((habilidad) =>
        [habilidad.nombre, habilidad.codigo, habilidad.descripcion].some(
          (valor) => String(valor || "").toLowerCase().includes(texto)
        )
      );
    },
  },
  watch: {
    busqueda() {
      this.successMessage = "";
    },
  },
  async mounted() {
    await this.cargarHabilidades();
  },
  methods: {
    async cargarHabilidades() {
      if (!this.puedeVer) return;

      this.cargando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminHabilidadesService.listar();
        const datos = response?.data;
        this.habilidades = Array.isArray(datos)
          ? datos
          : datos?.habilidades || [];
      } catch (error) {
        this.habilidades = [];
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudieron cargar las habilidades.";
      } finally {
        this.cargando = false;
      }
    },
    abrirCrear() {
      if (!this.puedeCrear) return;
      this.modoEdicion = false;
      this.form = {
        idHabilidad: null,
        nombre: "",
        descripcion: "",
        codigo: "",
      };
      this.errores = {};
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
    },
    abrirEditar(habilidad) {
      if (!this.puedeModificar) return;
      this.modoEdicion = true;
      this.form = {
        idHabilidad: habilidad?.idHabilidad ?? null,
        nombre: habilidad?.nombre || "",
        descripcion: habilidad?.descripcion || "",
        codigo: habilidad?.codigo || "",
      };
      this.errores = {};
      this.successMessage = "";
      this.errorMessage = "";
      this.modalVisible = true;
    },
    cerrarModal() {
      if (this.guardando) return;
      this.modalVisible = false;
      this.errores = {};
    },
    async guardar() {
      if (this.guardando) return;
      if (!this.modoEdicion && !this.puedeCrear) return;
      if (this.modoEdicion && !this.puedeModificar) return;

      const nombre = String(this.form.nombre || "").trim();
      const descripcion = String(this.form.descripcion || "").trim();

      if (!nombre) {
        this.errores = { nombre: "El nombre es obligatorio." };
        return;
      }
      if (nombre.length > 255) {
        this.errores = { nombre: "El nombre no puede superar los 255 caracteres." };
        return;
      }
      if (descripcion.length > 255) {
        this.errores = {
          descripcion: "La descripción no puede superar los 255 caracteres.",
        };
        return;
      }

      this.guardando = true;
      this.errores = {};
      this.errorMessage = "";

      try {
        if (this.modoEdicion) {
          await adminHabilidadesService.actualizar(this.form.idHabilidad, {
            nombre,
            descripcion: descripcion || null,
          });
          this.successMessage = "Habilidad actualizada correctamente.";
        } else {
          await adminHabilidadesService.crear({
            nombre,
            descripcion: descripcion || null,
          });
          this.successMessage = "Habilidad creada correctamente.";
        }

        habilidadService.invalidarCache();
        this.modalVisible = false;
        await this.cargarHabilidades();
        this.successMessage = this.modoEdicion
          ? "Habilidad actualizada correctamente."
          : "Habilidad creada correctamente.";
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

      if (status === 400) {
        if (data.errores && typeof data.errores === "object") {
          this.errores = { ...data.errores };
          this.errorMessage = "Revisá los datos marcados.";
        } else {
          this.errorMessage = mensaje || "Revisá los datos de la habilidad.";
        }
        return;
      }

      if (status === 403) {
        this.errorMessage =
          mensaje || "No tenés permiso para realizar esta acción.";
        return;
      }

      if (status === 404) {
        this.errorMessage = mensaje || "La habilidad ya no existe.";
        this.modalVisible = false;
        this.cargarHabilidades();
        return;
      }

      if (status === 409) {
        const esNombre =
          /nombre|duplicad|existe/i.test(mensaje) ||
          Boolean(data.errores?.nombre);
        if (esNombre) {
          this.errores = {
            ...this.errores,
            nombre:
              data.errores?.nombre ||
              mensaje ||
              "Ya existe una habilidad con ese nombre.",
          };
          this.errorMessage = "Revisá el nombre de la habilidad.";
          return;
        }

        this.errorMessage =
          mensaje ||
          "La habilidad está en uso por requerimientos de proyectos o actividades.";
        return;
      }

      if (!status || status >= 500) {
        this.errorMessage =
          "Ocurrió un error al guardar la habilidad. Inténtalo nuevamente.";
        return;
      }

      this.errorMessage = mensaje || "No se pudo guardar la habilidad.";
    },
    confirmarEliminar(habilidad) {
      if (!this.puedeEliminar) return;
      this.habilidadEliminar = habilidad;
      this.modalEliminarVisible = true;
      this.errorMessage = "";
      this.successMessage = "";
    },
    cerrarEliminar() {
      if (this.eliminando) return;
      this.modalEliminarVisible = false;
      this.habilidadEliminar = null;
    },
    async ejecutarEliminar() {
      if (this.eliminando || !this.habilidadEliminar) return;

      this.eliminando = true;
      this.errorMessage = "";
      this.successMessage = "";
      try {
        await adminHabilidadesService.eliminar(
          this.habilidadEliminar.idHabilidad
        );
        habilidadService.invalidarCache();
        this.modalEliminarVisible = false;
        this.habilidadEliminar = null;
        await this.cargarHabilidades();
        this.successMessage = "Habilidad eliminada correctamente.";
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";

        if (status === 409) {
          this.errorMessage =
            mensaje ||
            "La habilidad está en uso por proyectos o actividades y no se puede eliminar.";
        } else if (status === 404) {
          this.errorMessage = mensaje || "La habilidad ya no existe.";
          await this.cargarHabilidades();
        } else if (status === 403) {
          this.errorMessage =
            mensaje || "No tenés permiso para eliminar habilidades.";
        } else {
          this.errorMessage =
            mensaje || "No se pudo eliminar la habilidad.";
        }
        this.modalEliminarVisible = false;
        this.habilidadEliminar = null;
      } finally {
        this.eliminando = false;
      }
    },
  },
};
</script>

<style scoped>
.gestion-habilidades {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-habilidades__encabezado h1 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
}

.gestion-habilidades__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.gestion-habilidades__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.gestion-habilidades__buscador {
  max-width: 420px;
  min-width: 240px;
  flex: 1 1 280px;
}

.gestion-habilidades__toolbar-acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.gestion-habilidades__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.gestion-habilidades__estado-icono {
  font-size: 2.5rem;
}

.gestion-habilidades__tabla {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.gestion-habilidades__codigo {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.gestion-habilidades__acciones {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.gestion-habilidades__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-habilidades__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.gestion-habilidades__modal-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}
</style>
