<template>
  <div class="selector-miembro">
    <div class="selector-miembro__filtros">
      <VaInput
        :model-value="filtros.nombre"
        class="selector-miembro__nombre"
        label="Buscar miembro"
        placeholder="Nombre, apellido o nombre artístico..."
        clearable
        :disabled="deshabilitado"
        @update:model-value="onNombre"
      >
        <template #prependInner>
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
        </template>
      </VaInput>

      <VaSelect
        :model-value="filtros.rol"
        class="selector-miembro__rol"
        :options="OPCIONES_ROL"
        value-by="value"
        text-by="text"
        label="Rol"
        placeholder="Todos los roles"
        clearable
        :disabled="deshabilitado"
        @update:model-value="onRol"
      />

      <VaButton
        preset="secondary"
        class="selector-miembro__limpiar"
        :disabled="deshabilitado || !hayFiltros"
        @click="limpiar"
      >
        Limpiar
      </VaButton>
    </div>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="selector-miembro__reintento">
      <VaButton preset="primary" size="small" @click="cargar(0)">
        Reintentar
      </VaButton>
    </div>

    <p v-if="cargando && !miembros.length" class="selector-miembro__nota">
      Cargando miembros...
    </p>
    <p v-else-if="cargando" class="selector-miembro__nota">
      Actualizando miembros...
    </p>

    <p
      v-else-if="!error && !miembros.length"
      class="selector-miembro__vacio"
    >
      {{
        hayFiltros
          ? "No hay miembros que coincidan con los filtros."
          : "Este proyecto todavía no tiene miembros activos."
      }}
    </p>

    <div
      v-else-if="!error"
      class="selector-miembro__lista"
      role="listbox"
      aria-label="Miembros activos del proyecto"
      :aria-busy="cargando ? 'true' : 'false'"
    >
      <button
        v-for="miembro in miembros"
        :key="claveMiembro(miembro)"
        type="button"
        class="selector-miembro__item"
        :class="{
          'selector-miembro__item--seleccionado': estaSeleccionado(miembro),
          'selector-miembro__item--asignado': estaAsignado(miembro),
        }"
        role="option"
        :aria-selected="estaSeleccionado(miembro) ? 'true' : 'false'"
        :disabled="deshabilitado || estaAsignado(miembro)"
        @click="seleccionar(miembro)"
      >
        <span class="selector-miembro__avatar" aria-hidden="true">
          {{ iniciales(miembro) }}
        </span>

        <span class="selector-miembro__datos">
          <span class="selector-miembro__nombre-principal">
            {{ miembro.nombreArtistico || "Perfil" }}
          </span>

          <span class="selector-miembro__secundario">
            {{ nombreCompleto(miembro) || `Usuario #${miembro.idUsuario}` }}
            <template v-if="miembro.nombreProfesion">
              · {{ miembro.nombreProfesion }}
            </template>
          </span>

          <span class="selector-miembro__chips">
            <span class="selector-miembro__chip">
              {{ etiquetaRolProyecto(miembro.rol) || "Miembro" }}
            </span>
            <span v-if="esDirector(miembro)" class="selector-miembro__chip">
              No consume cupo
            </span>
            <span
              v-if="estaAsignado(miembro)"
              class="selector-miembro__chip selector-miembro__chip--asignado"
            >
              Ya asignado
            </span>
          </span>
        </span>

        <span
          v-if="estaSeleccionado(miembro)"
          class="material-symbols-outlined selector-miembro__check"
          aria-hidden="true"
        >
          check_circle
        </span>
      </button>
    </div>

    <div
      v-if="mostrarPaginacion && !error"
      class="selector-miembro__paginacion"
    >
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_left"
        :disabled="deshabilitado || paginacion.primera || cargando"
        @click="irAPagina(-1)"
      >
        Anterior
      </VaButton>

      <span class="selector-miembro__pagina">
        Página {{ paginacion.paginaActual + 1 }} de
        {{ paginacion.totalPaginas }}
        <template v-if="paginacion.totalElementos">
          · {{ paginacion.totalElementos }} miembro(s)
        </template>
      </span>

      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_right"
        :disabled="deshabilitado || paginacion.ultima || cargando"
        @click="irAPagina(1)"
      >
        Siguiente
      </VaButton>
    </div>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import proyectoService from "../../services/proyectoService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import { etiquetaRolProyecto } from "../../utils/proyectoConstants.js";

const TAMANO_PAGINA = 20;
const DEBOUNCE_BUSQUEDA_MS = 350;

const OPCIONES_ROL = [
  { value: "DIRECTOR", text: "Directores" },
  { value: "MIEMBRO", text: "Miembros" },
];

/*
 * Selector de destinatario de UC-70. Consume GET /proyectos/{id}/miembros con
 * búsqueda, filtro por rol y paginación en servidor. El backend devuelve sólo
 * miembros ACTIVOS; acá no se duplican reglas de negocio.
 */
export default {
  name: "SelectorMiembroProyecto",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    modelValue: {
      type: [Number, String],
      default: null,
    },
    idPerfilesAsignados: {
      type: Array,
      default: () => [],
    },
    deshabilitado: {
      type: Boolean,
      default: false,
    },
    /** Cambia para forzar una recarga del listado (p. ej. tras un 409). */
    tokenRefresco: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue", "seleccionado"],
  data() {
    return {
      OPCIONES_ROL,
      filtros: {
        nombre: "",
        rol: "",
      },
      miembros: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: TAMANO_PAGINA,
        totalElementos: 0,
        totalPaginas: 1,
        primera: true,
        ultima: true,
      },
      cargando: false,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  computed: {
    hayFiltros() {
      return (
        String(this.filtros.nombre || "").trim() !== "" ||
        !!this.filtros.rol
      );
    },
    mostrarPaginacion() {
      return this.paginacion.totalPaginas > 1;
    },
    idsAsignados() {
      return new Set(
        (this.idPerfilesAsignados || [])
          .filter((id) => id != null && id !== "")
          .map((id) => String(id))
      );
    },
  },
  watch: {
    idProyecto() {
      this.$emit("update:modelValue", null);
      this.$emit("seleccionado", null);
      this.cargar(0);
    },
    tokenRefresco() {
      this.cargar(this.paginacion.paginaActual);
    },
  },
  created() {
    this.controlador = null;
    this.temporizador = null;
  },
  mounted() {
    this.cargar(0);
  },
  beforeUnmount() {
    clearTimeout(this.temporizador);
    this.abortar();
  },
  methods: {
    etiquetaRolProyecto,
    claveMiembro(miembro) {
      return `${miembro.idPerfil ?? "perfil"}-${miembro.idUsuario ?? "usuario"}`;
    },
    nombreCompleto(miembro) {
      return [miembro?.nombreUsuario, miembro?.apellidoUsuario]
        .filter(Boolean)
        .join(" ");
    },
    iniciales(miembro) {
      const base = String(
        miembro?.nombreArtistico ||
          miembro?.nombreUsuario ||
          miembro?.apellidoUsuario ||
          "?"
      ).trim();
      const partes = base.split(/\s+/).filter(Boolean).slice(0, 2);
      return partes.map((parte) => parte[0]).join("").toUpperCase() || "?";
    },
    esDirector(miembro) {
      return String(miembro?.rol || "").toUpperCase() === "DIRECTOR";
    },
    estaAsignado(miembro) {
      return this.idsAsignados.has(String(miembro?.idPerfil));
    },
    estaSeleccionado(miembro) {
      return (
        this.modelValue != null &&
        String(this.modelValue) === String(miembro?.idPerfil)
      );
    },
    seleccionar(miembro) {
      if (this.deshabilitado || this.estaAsignado(miembro)) return;
      this.$emit("update:modelValue", miembro.idPerfil);
      this.$emit("seleccionado", miembro);
    },
    onNombre(valor) {
      this.filtros = { ...this.filtros, nombre: valor || "" };
      this.programarBusqueda();
    },
    onRol(valor) {
      this.filtros = { ...this.filtros, rol: valor || "" };
      clearTimeout(this.temporizador);
      this.cargar(0);
    },
    limpiar() {
      clearTimeout(this.temporizador);
      this.filtros = { nombre: "", rol: "" };
      this.cargar(0);
    },
    programarBusqueda() {
      clearTimeout(this.temporizador);
      this.temporizador = setTimeout(() => this.cargar(0), DEBOUNCE_BUSQUEDA_MS);
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.cargar(destino);
    },
    async cargar(pagina = 0) {
      if (this.idProyecto == null || this.idProyecto === "") return;

      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.listarMiembros(
          this.idProyecto,
          {
            nombre: this.filtros.nombre,
            rol: this.filtros.rol,
            page: pagina,
            size: TAMANO_PAGINA,
          },
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        this.miembros = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: Number(data.paginaActual) || 0,
          tamanoPagina: Number(data.tamanoPagina) || TAMANO_PAGINA,
          totalElementos: Number(data.totalElementos) || 0,
          totalPaginas: Number(data.totalPaginas) || 1,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.miembros = [];
      this.error = "";
      this.puedeReintentar = false;

      if (status === 401) {
        this.error = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 403) {
        this.error =
          mensaje ||
          "No tenés permiso para ver los miembros de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.error =
          mensaje || "El proyecto ya no está disponible o no tenés acceso.";
        return;
      }

      if (status === 400) {
        this.error = mensaje || "Revisá los filtros de búsqueda.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar los miembros. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar los miembros del proyecto."
      );
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
  },
};
</script>

<style scoped>
.selector-miembro {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.selector-miembro__filtros {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.selector-miembro__nombre {
  flex: 1 1 220px;
  min-width: 180px;
}

.selector-miembro__rol {
  flex: 0 1 170px;
  min-width: 150px;
}

.selector-miembro__limpiar {
  margin-bottom: 0.05rem;
}

.selector-miembro__nota,
.selector-miembro__pagina {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.selector-miembro__reintento {
  display: flex;
  justify-content: flex-start;
}

.selector-miembro__vacio {
  margin: 0;
  padding: 1.5rem 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  text-align: center;
}

.selector-miembro__lista {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.selector-miembro__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.selector-miembro__item:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-surface-muted);
}

.selector-miembro__item--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.selector-miembro__item--asignado {
  opacity: 0.65;
  cursor: not-allowed;
}

.selector-miembro__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-primary-soft, var(--color-info-soft));
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
}

.selector-miembro__datos {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.selector-miembro__nombre-principal {
  overflow: hidden;
  font-size: 0.86rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-miembro__secundario {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-miembro__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.15rem;
}

.selector-miembro__chip {
  display: inline-block;
  padding: 0.08rem 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.66rem;
  font-weight: 600;
  white-space: nowrap;
}

.selector-miembro__chip--asignado {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.selector-miembro__check {
  color: var(--color-primary);
  font-size: 1.2rem;
}

.selector-miembro__paginacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 0.2rem;
}

@media (max-width: 600px) {
  .selector-miembro__filtros {
    align-items: stretch;
  }

  .selector-miembro__nombre,
  .selector-miembro__rol {
    flex-basis: 100%;
  }
}
</style>
