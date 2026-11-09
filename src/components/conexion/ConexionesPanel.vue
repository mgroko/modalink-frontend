<template>
  <div class="conexiones-panel">
    <FiltrosConexiones
      :filtros="filtros"
      :profesiones="profesiones"
      @cambio="cambiar"
      @buscar-ahora="buscarAhora"
      @limpiar="limpiarFiltros"
      @seleccionar-profesion="seleccionarProfesion"
    />

    <div v-if="error" class="conexiones-panel__error">
      <BaseAlert :message="error" type="error" />
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-refresh"
        @click="reintentar"
      >
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="conexiones-panel__estado" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando conexiones...
    </div>

    <template v-else-if="!error">
      <div v-if="!conexiones.length" class="conexiones-panel__vacio">
        <span class="material-symbols-outlined" aria-hidden="true">group_off</span>
        <p>{{ textoVacio }}</p>
        <VaButton
          v-if="hayFiltrosActivos"
          preset="secondary"
          size="small"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </VaButton>
      </div>

      <template v-else>
        <div class="conexiones-panel__grid">
          <ConexionCard
            v-for="conexion in conexiones"
            :key="conexion.idConexion"
            :conexion="conexion"
            :en-linea="enLineaDe(conexion)"
            :eliminando="
              eliminando &&
              conexionEliminar?.idConexion === conexion.idConexion
            "
            :destacada="esDestacada(conexion)"
            @ver-perfil="verPerfil"
            @mensaje="mensaje"
            @eliminar="abrirEliminar"
          />
        </div>

        <PaginacionResultados
          :paginacion="paginacion"
          @cambiar="cambiarPagina"
        />
      </template>
    </template>

    <ModalEliminarConexion
      :model-value="modalEliminar"
      :perfil="conexionEliminar?.perfil || null"
      :eliminando="eliminando"
      :error="errorEliminar"
      @update:model-value="alCambiarModalEliminar"
      @confirmar="eliminarConexion"
    />
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import FiltrosConexiones from "./FiltrosConexiones.vue";
import ConexionCard from "./ConexionCard.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import ModalEliminarConexion from "./ModalEliminarConexion.vue";
import conexionService from "../../services/conexionService";
import {
  enLineaDe,
  desuscribirPerfiles,
  reconciliarSuscripciones,
} from "../../services/presenciaState";
import {
  CODIGOS_ERROR_CONEXIONES,
  mensajeErrorConexiones,
  mensajeErrorEliminarConexion,
} from "../../utils/conexionesConstants.js";
import {
  construirParamsConexiones,
  TAMANO_POR_DEFECTO,
} from "../../utils/parametrosConexiones.js";
import { mostrarNoDisponible } from "../../utils/noDisponible.js";
import { useToast } from "vuestic-ui";

const DEBOUNCE_MS = 350;

function paginacionInicial() {
  return {
    paginaActual: 0,
    tamanoPagina: TAMANO_POR_DEFECTO,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

function normalizarPagina(data) {
  return {
    paginaActual: data?.paginaActual ?? 0,
    tamanoPagina: data?.tamanoPagina ?? TAMANO_POR_DEFECTO,
    totalElementos: data?.totalElementos ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
    primera: data?.primera ?? true,
    ultima: data?.ultima ?? true,
  };
}

export default {
  name: "ConexionesPanel",
  components: {
    BaseAlert,
    FiltrosConexiones,
    ConexionCard,
    PaginacionResultados,
    ModalEliminarConexion,
  },
  props: {
    resumen: {
      type: Object,
      default: null,
    },
    idConexionDestacada: {
      type: [Number, String],
      default: null,
    },
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: {
        texto: "",
        idProfesion: null,
        estadoPresencia: "",
        tamano: TAMANO_POR_DEFECTO,
      },
      conexiones: [],
      paginacion: paginacionInicial(),
      cargando: true,
      error: "",
      controlador: null,
      idBusqueda: 0,
      debounceHandle: null,
      idsPresencia: [],
      modalEliminar: false,
      conexionEliminar: null,
      eliminando: false,
      errorEliminar: "",
    };
  },
  computed: {
    profesiones() {
      return Array.isArray(this.resumen?.profesiones)
        ? this.resumen.profesiones
        : [];
    },
    hayFiltrosActivos() {
      return Boolean(
        String(this.filtros.texto || "").trim() ||
          this.filtros.idProfesion != null ||
          this.filtros.estadoPresencia ||
          Number(this.filtros.tamano) !== TAMANO_POR_DEFECTO
      );
    },
    textoVacio() {
      if (this.hayFiltrosActivos) {
        return "Ninguna conexión coincide con los filtros.";
      }
      return "Todavía no tenés conexiones. Enviá solicitudes desde la búsqueda de perfiles.";
    },
  },
  mounted() {
    this.buscar(0);
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    this.abortarBusqueda();
    this.desuscribirPresencia();
  },
  methods: {
    abortarBusqueda() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    async buscar(pagina = 0) {
      clearTimeout(this.debounceHandle);
      this.abortarBusqueda();

      const controlador = new AbortController();
      this.controlador = controlador;
      const corrida = ++this.idBusqueda;
      this.cargando = true;
      this.error = "";

      try {
        const params = construirParamsConexiones({
          ...this.filtros,
          pagina,
        });
        const response = await conexionService.listar(
          params,
          controlador.signal
        );

        if (corrida !== this.idBusqueda) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido)
          ? data.contenido
          : [];
        const listado = this.filtros.estadoPresencia
          ? contenido
          : [...contenido].sort(
              (a, b) => Number(this.enLineaDe(b)) - Number(this.enLineaDe(a))
            );

        this.conexiones = listado;
        this.paginacion = normalizarPagina(data);
        this.actualizarSuscripcionPresencia();
      } catch (error) {
        if (
          corrida !== this.idBusqueda ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        this.conexiones = [];
        this.paginacion = paginacionInicial();
        this.desuscribirPresencia();
        this.error = mensajeErrorConexiones(error);
      } finally {
        if (corrida === this.idBusqueda) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },
    cambiar(campo, valor) {
      this.filtros[campo] = valor;
      if (campo === "texto") {
        this.programarBusqueda();
        return;
      }
      this.buscar(0);
    },
    seleccionarProfesion(idProfesion) {
      this.filtros.idProfesion =
        this.filtros.idProfesion === idProfesion ? null : idProfesion;
      this.buscar(0);
    },
    limpiarFiltros() {
      this.filtros = {
        texto: "",
        idProfesion: null,
        estadoPresencia: "",
        tamano: TAMANO_POR_DEFECTO,
      };
      this.buscarAhora();
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
    async refrescarListado() {
      const pagina = this.paginacion.paginaActual;
      await this.buscar(pagina);
      if (!this.conexiones.length && pagina > 0) {
        await this.buscar(pagina - 1);
      }
    },
    actualizarSuscripcionPresencia() {
      const nuevos = this.conexiones
        .map((conexion) => conexion?.perfil?.idPerfil)
        .filter((id) => id != null);
      const previos = this.idsPresencia;
      this.idsPresencia = nuevos;
      reconciliarSuscripciones(previos, nuevos);
    },
    desuscribirPresencia() {
      if (this.idsPresencia.length) {
        desuscribirPerfiles(this.idsPresencia);
        this.idsPresencia = [];
      }
    },
    enLineaDe(conexion) {
      return enLineaDe(
        conexion?.perfil?.idPerfil,
        conexion?.enLinea ?? conexion?.perfil?.enLinea
      );
    },
    esDestacada(conexion) {
      return (
        this.idConexionDestacada != null &&
        String(conexion?.idConexion) === String(this.idConexionDestacada)
      );
    },
    verPerfil(conexion) {
      const idPerfil = conexion?.perfil?.idPerfil;
      if (idPerfil == null) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: idPerfil },
      });
    },
    mensaje() {
      mostrarNoDisponible(this.toast, "Mensaje");
    },
    abrirEliminar(conexion) {
      if (this.eliminando || conexion?.idConexion == null) return;
      this.conexionEliminar = conexion;
      this.errorEliminar = "";
      this.modalEliminar = true;
    },
    alCambiarModalEliminar(valor) {
      if (this.eliminando && !valor) return;
      this.modalEliminar = valor;
      if (!valor) {
        this.conexionEliminar = null;
        this.errorEliminar = "";
      }
    },
    async eliminarConexion() {
      if (this.eliminando) return;
      const idConexion = this.conexionEliminar?.idConexion;
      if (idConexion == null) return;

      this.eliminando = true;
      this.errorEliminar = "";
      try {
        await conexionService.eliminar(idConexion);
        this.modalEliminar = false;
        this.conexionEliminar = null;
        await this.refrescarListado();
        this.$emit("actualizado");
        this.toast.init({
          title: "Conexión eliminada",
          message: "La conexión se eliminó correctamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esNoActiva =
          codigo === CODIGOS_ERROR_CONEXIONES.CONEXION_NO_ACTIVA;
        const esNoEncontrada = status === 404;

        if (esNoActiva || esNoEncontrada) {
          this.modalEliminar = false;
          this.conexionEliminar = null;
          await this.refrescarListado();
          this.$emit("actualizado");
          this.toast.init({
            title: "No se pudo eliminar",
            message: mensajeErrorEliminarConexion(error),
            color: "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorEliminar = mensajeErrorEliminarConexion(error);
      } finally {
        this.eliminando = false;
      }
    },
  },
};
</script>

<style scoped>
.conexiones-panel {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.conexiones-panel__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.conexiones-panel__estado,
.conexiones-panel__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

.conexiones-panel__vacio {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.conexiones-panel__vacio p {
  margin: 0;
}

.conexiones-panel__estado .material-symbols-outlined,
.conexiones-panel__vacio .material-symbols-outlined {
  font-size: 2rem;
}

.conexiones-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 0.9rem;
}
</style>
