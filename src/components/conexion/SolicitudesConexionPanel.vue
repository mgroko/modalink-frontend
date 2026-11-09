<template>
  <div class="solicitudes-conexion">
    <FiltrosSolicitudesConexion
      :filtros="filtros"
      :profesiones="profesiones"
      :cargando-profesiones="cargandoProfesiones"
      :error-fechas="errorFechas"
      :mostrar-avanzado="mostrarAvanzado"
      @cambio="cambiar"
      @buscar-ahora="buscarAhora"
      @limpiar="limpiarFiltros"
      @toggle-avanzado="mostrarAvanzado = !mostrarAvanzado"
    />

    <div v-if="error" class="solicitudes-conexion__error">
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

    <div v-if="cargando" class="solicitudes-conexion__estado" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando solicitudes...
    </div>

    <template v-else-if="!error">
      <div v-if="!solicitudes.length" class="solicitudes-conexion__vacio">
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
        <div class="solicitudes-conexion__lista">
          <SolicitudConexionCard
            v-for="solicitud in solicitudes"
            :key="solicitud.idSolicitudConexion"
            :solicitud="solicitud"
            :cancelando="
              cancelando &&
              solicitudCancelar?.idSolicitudConexion ===
                solicitud.idSolicitudConexion
            "
            @cancelar="abrirCancelar"
            @ver-perfil="verPerfil"
          />
        </div>

        <PaginacionResultados
          :paginacion="paginacion"
          @cambiar="cambiarPagina"
        />
      </template>
    </template>

    <ModalCancelarSolicitudConexion
      :model-value="modalCancelar"
      :perfil="solicitudCancelar?.perfil || null"
      :cancelando="cancelando"
      :error="errorCancelar"
      @update:model-value="alCambiarModalCancelar"
      @confirmar="cancelarSolicitud"
    />
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import FiltrosSolicitudesConexion from "./FiltrosSolicitudesConexion.vue";
import SolicitudConexionCard from "./SolicitudConexionCard.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import ModalCancelarSolicitudConexion from "../perfil/ModalCancelarSolicitudConexion.vue";
import perfilService from "../../services/perfilService";
import solicitudConexionService from "../../services/solicitudConexionService";
import {
  DIRECCIONES_SOLICITUD,
  ESTADOS_SOLICITUD_CONEXION,
  mensajeErrorSolicitudesConexion,
} from "../../utils/solicitudesConexionConstants.js";
import {
  construirParamsSolicitudesConexion,
  validarRangoFechas,
  TAMANO_POR_DEFECTO,
} from "../../utils/parametrosSolicitudesConexion.js";
import {
  CODIGOS_ERROR_CONEXION,
  mensajeErrorCancelacionConexion,
} from "../../utils/conexionConstants.js";
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
  name: "SolicitudesConexionPanel",
  components: {
    BaseAlert,
    FiltrosSolicitudesConexion,
    SolicitudConexionCard,
    PaginacionResultados,
    ModalCancelarSolicitudConexion,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: {
        direccion: DIRECCIONES_SOLICITUD.RECIBIDA,
        estado: ESTADOS_SOLICITUD_CONEXION.PENDIENTE,
        nombre: "",
        apellido: "",
        nombreArtistico: "",
        idProfesion: null,
        fechaDesde: "",
        fechaHasta: "",
        tamano: TAMANO_POR_DEFECTO,
      },
      solicitudes: [],
      paginacion: paginacionInicial(),
      cargando: true,
      error: "",
      errorFechas: "",
      profesiones: [],
      cargandoProfesiones: false,
      mostrarAvanzado: false,
      controlador: null,
      idBusqueda: 0,
      debounceHandle: null,
      modalCancelar: false,
      solicitudCancelar: null,
      cancelando: false,
      errorCancelar: "",
    };
  },
  computed: {
    hayBusquedaActiva() {
      return Boolean(
        String(this.filtros.nombre || "").trim() ||
          String(this.filtros.apellido || "").trim() ||
          String(this.filtros.nombreArtistico || "").trim()
      );
    },
    hayFiltrosActivos() {
      return (
        this.hayBusquedaActiva ||
        this.filtros.idProfesion != null ||
        Boolean(this.filtros.fechaDesde) ||
        Boolean(this.filtros.fechaHasta)
      );
    },
    textoVacio() {
      if (this.hayFiltrosActivos) {
        return "No encontramos solicitudes que coincidan con tu búsqueda.";
      }
      if (this.filtros.estado === ESTADOS_SOLICITUD_CONEXION.ACEPTADA) {
        return "No hay solicitudes aceptadas.";
      }
      if (this.filtros.estado === ESTADOS_SOLICITUD_CONEXION.RECHAZADA) {
        return "No hay solicitudes rechazadas.";
      }
      if (this.filtros.direccion === DIRECCIONES_SOLICITUD.ENVIADA) {
        return "No tenés solicitudes enviadas pendientes.";
      }
      if (this.filtros.direccion === DIRECCIONES_SOLICITUD.RECIBIDA) {
        return "No tenés solicitudes recibidas pendientes.";
      }
      return "No tenés solicitudes pendientes.";
    },
  },
  watch: {
    "$route.query.direccion"(nuevo) {
      const direccion =
        nuevo === DIRECCIONES_SOLICITUD.RECIBIDA
          ? DIRECCIONES_SOLICITUD.RECIBIDA
          : nuevo === DIRECCIONES_SOLICITUD.ENVIADA
            ? DIRECCIONES_SOLICITUD.ENVIADA
            : null;
      if (direccion == null || direccion === this.filtros.direccion) return;
      this.filtros.direccion = direccion;
      this.buscarAhora();
    },
    "$route.query.estado"(nuevo) {
      const estados = Object.values(ESTADOS_SOLICITUD_CONEXION);
      if (!estados.includes(nuevo) || nuevo === this.filtros.estado) return;
      this.filtros.estado = nuevo;
      this.buscarAhora();
    },
  },
  mounted() {
    this.aplicarQueryInicial();
    this.cargarProfesiones();
    this.buscar(0);
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    this.abortarBusqueda();
  },
  methods: {
    aplicarQueryInicial() {
      const query = this.$route.query;
      if (
        query.direccion === DIRECCIONES_SOLICITUD.RECIBIDA ||
        query.direccion === DIRECCIONES_SOLICITUD.ENVIADA
      ) {
        this.filtros.direccion = query.direccion;
      }
      if (Object.values(ESTADOS_SOLICITUD_CONEXION).includes(query.estado)) {
        this.filtros.estado = query.estado;
      }
    },
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos)
          ? datos
          : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      } finally {
        this.cargandoProfesiones = false;
      }
    },
    abortarBusqueda() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    async buscar(pagina = 0) {
      clearTimeout(this.debounceHandle);
      this.abortarBusqueda();

      const errorFecha = validarRangoFechas(
        this.filtros.fechaDesde,
        this.filtros.fechaHasta
      );
      if (errorFecha) {
        this.errorFechas = errorFecha;
        this.cargando = false;
        return;
      }

      this.errorFechas = "";

      const controlador = new AbortController();
      this.controlador = controlador;
      const corrida = ++this.idBusqueda;
      this.cargando = true;
      this.error = "";

      try {
        const params = construirParamsSolicitudesConexion({
          ...this.filtros,
          pagina,
        });
        const response = await solicitudConexionService.buscar(
          params,
          controlador.signal
        );

        if (corrida !== this.idBusqueda) return;

        const data = response?.data || {};
        this.solicitudes = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = normalizarPagina(data);
      } catch (error) {
        if (
          corrida !== this.idBusqueda ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        this.solicitudes = [];
        this.paginacion = paginacionInicial();
        this.error = mensajeErrorSolicitudesConexion(error);
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
      if (["nombre", "apellido", "nombreArtistico"].includes(campo)) {
        this.programarBusqueda();
        return;
      }
      if (["fechaDesde", "fechaHasta"].includes(campo)) {
        this.errorFechas = "";
      }
      this.buscar(0);
    },
    limpiarFiltros() {
      this.filtros = {
        direccion: DIRECCIONES_SOLICITUD.RECIBIDA,
        estado: ESTADOS_SOLICITUD_CONEXION.PENDIENTE,
        nombre: "",
        apellido: "",
        nombreArtistico: "",
        idProfesion: null,
        fechaDesde: "",
        fechaHasta: "",
        tamano: TAMANO_POR_DEFECTO,
      };
      this.errorFechas = "";
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
      if (!this.solicitudes.length && pagina > 0) {
        await this.buscar(pagina - 1);
      }
    },
    verPerfil(perfil) {
      if (!perfil?.idPerfil) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: perfil.idPerfil },
      });
    },
    abrirCancelar(solicitud) {
      if (!solicitud?.puedeCancelar || this.cancelando) return;
      this.solicitudCancelar = solicitud;
      this.errorCancelar = "";
      this.modalCancelar = true;
    },
    alCambiarModalCancelar(valor) {
      if (this.cancelando && !valor) return;
      this.modalCancelar = valor;
      if (!valor) {
        this.solicitudCancelar = null;
        this.errorCancelar = "";
      }
    },
    async cancelarSolicitud() {
      if (this.cancelando) return;
      const idSolicitud = this.solicitudCancelar?.idSolicitudConexion;
      if (idSolicitud == null) return;

      this.cancelando = true;
      this.errorCancelar = "";
      try {
        await solicitudConexionService.cancelar(idSolicitud);
        this.modalCancelar = false;
        this.solicitudCancelar = null;

        await this.refrescarListado();

        this.toast.init({
          title: "Solicitud cancelada",
          message: "La solicitud de conexión se canceló correctamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esConflicto =
          codigo ===
          CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PENDIENTE;
        const esNoPermitida =
          codigo ===
          CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PERMITIDA;
        const esNoEncontrada = status === 404;

        if (esConflicto || esNoPermitida || esNoEncontrada) {
          this.modalCancelar = false;
          this.solicitudCancelar = null;
          await this.refrescarListado();
          this.toast.init({
            title: esConflicto
              ? "Solicitud de conexión"
              : "No se pudo cancelar",
            message: esConflicto
              ? "La solicitud ya fue gestionada por el destinatario."
              : mensajeErrorCancelacionConexion(error),
            color: esConflicto ? "info" : "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorCancelar = mensajeErrorCancelacionConexion(error);
      } finally {
        this.cancelando = false;
      }
    },
  },
};
</script>

<style scoped>
.solicitudes-conexion {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.solicitudes-conexion__lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.solicitudes-conexion__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.solicitudes-conexion__estado,
.solicitudes-conexion__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

.solicitudes-conexion__vacio {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.solicitudes-conexion__vacio p {
  margin: 0;
}

.solicitudes-conexion__estado .material-symbols-outlined,
.solicitudes-conexion__vacio .material-symbols-outlined {
  font-size: 2rem;
}
</style>
