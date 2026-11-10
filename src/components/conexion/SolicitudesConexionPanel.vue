<template>
  <div class="solicitudes-conexion">
    <FiltrosSolicitudesConexion
      :filtros="filtros"
      :conteos="conteos"
      @cambio="cambiar"
      @buscar-ahora="buscarAhora"
      @limpiar="limpiarFiltros"
    />

    <div v-if="mensajeExito" class="solicitudes-conexion__exito">
      <BaseAlert :message="mensajeExito" type="success" />
      <VaButton
        v-if="idConexionCreada"
        preset="secondary"
        size="small"
        icon="mso-open_in_new"
        @click="irAConexion"
      >
        Ver conexión
      </VaButton>
    </div>

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
            :en-linea="enLineaDe(solicitud)"
            :cancelando="
              cancelando &&
              solicitudCancelar?.idSolicitudConexion ===
                solicitud.idSolicitudConexion
            "
            :procesando="
              procesandoGestion &&
              solicitudGestion?.idSolicitudConexion ===
                solicitud.idSolicitudConexion
            "
            :accion-procesando="modoGestion"
            @cancelar="abrirCancelar"
            @aceptar="abrirGestion($event, 'aceptar')"
            @rechazar="abrirGestion($event, 'rechazar')"
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

    <ModalGestionSolicitudConexion
      :model-value="modalGestion"
      :perfil="solicitudGestion?.perfil || null"
      :modo="modoGestion"
      :procesando="procesandoGestion"
      :error="errorGestion"
      @update:model-value="alCambiarModalGestion"
      @confirmar="confirmarGestion"
    />
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import FiltrosSolicitudesConexion from "./FiltrosSolicitudesConexion.vue";
import SolicitudConexionCard from "./SolicitudConexionCard.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import ModalCancelarSolicitudConexion from "../perfil/ModalCancelarSolicitudConexion.vue";
import ModalGestionSolicitudConexion from "./ModalGestionSolicitudConexion.vue";
import solicitudConexionService from "../../services/solicitudConexionService";
import {
  state as solicitudConexionState,
  cargarConteosSolicitudesConexion,
} from "../../services/solicitudConexionState";
import {
  enLineaDe,
  desuscribirPerfiles,
  reconciliarSuscripciones,
} from "../../services/presenciaState";
import { idPerfilActivo } from "../../services/authState";
import { cargarResumenPerfil } from "../../services/notificacionState";
import {
  DIRECCIONES_SOLICITUD,
  ESTADOS_SOLICITUD_CONEXION,
  mensajeErrorSolicitudesConexion,
} from "../../utils/solicitudesConexionConstants.js";
import {
  construirParamsSolicitudesConexion,
  TAMANO_POR_DEFECTO,
} from "../../utils/parametrosSolicitudesConexion.js";
import {
  CODIGOS_ERROR_CONEXION,
  mensajeErrorCancelacionConexion,
  mensajeErrorGestionSolicitudConexion,
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
    ModalGestionSolicitudConexion,
  },
  props: {
    direccion: {
      type: String,
      required: true,
      validator: (valor) =>
        [
          DIRECCIONES_SOLICITUD.RECIBIDA,
          DIRECCIONES_SOLICITUD.ENVIADA,
        ].includes(valor),
    },
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: {
        estado: "",
        nombreArtistico: "",
        tamano: TAMANO_POR_DEFECTO,
      },
      solicitudes: [],
      paginacion: paginacionInicial(),
      cargando: true,
      error: "",
      controlador: null,
      idBusqueda: 0,
      debounceHandle: null,
      idsPresencia: [],
      modalCancelar: false,
      solicitudCancelar: null,
      cancelando: false,
      errorCancelar: "",
      modalGestion: false,
      solicitudGestion: null,
      modoGestion: "aceptar",
      procesandoGestion: false,
      errorGestion: "",
      mensajeExito: "",
      idConexionCreada: null,
    };
  },
  computed: {
    conteos() {
      return this.direccion === DIRECCIONES_SOLICITUD.RECIBIDA
        ? solicitudConexionState.conteosRecibidas
        : solicitudConexionState.conteosEnviadas;
    },
    hayFiltrosActivos() {
      return Boolean(
        String(this.filtros.nombreArtistico || "").trim() ||
          this.filtros.estado ||
          Number(this.filtros.tamano) !== TAMANO_POR_DEFECTO
      );
    },
    textoVacio() {
      const direccion =
        this.direccion === DIRECCIONES_SOLICITUD.RECIBIDA
          ? "recibidas"
          : "enviadas";

      if (String(this.filtros.nombreArtistico || "").trim()) {
        return "No encontramos solicitudes que coincidan con tu búsqueda.";
      }
      if (this.filtros.estado === ESTADOS_SOLICITUD_CONEXION.PENDIENTE) {
        return `No hay solicitudes ${direccion} pendientes.`;
      }
      if (this.filtros.estado === ESTADOS_SOLICITUD_CONEXION.ACEPTADA) {
        return `No hay solicitudes ${direccion} aceptadas.`;
      }
      if (this.filtros.estado === ESTADOS_SOLICITUD_CONEXION.RECHAZADA) {
        return `No hay solicitudes ${direccion} rechazadas.`;
      }
      return `No hay solicitudes ${direccion}.`;
    },
  },
  watch: {
    "$route.query.estado"(nuevo) {
      const estados = Object.values(ESTADOS_SOLICITUD_CONEXION);
      const estado = estados.includes(nuevo) ? nuevo : "";
      if (estado === this.filtros.estado) return;
      this.filtros.estado = estado;
      this.buscarAhora();
    },
  },
  mounted() {
    this.aplicarQueryInicial();
    this.buscar(0);
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    this.abortarBusqueda();
    this.desuscribirPresencia();
  },
  methods: {
    aplicarQueryInicial() {
      const estado = this.$route.query.estado;
      if (Object.values(ESTADOS_SOLICITUD_CONEXION).includes(estado)) {
        this.filtros.estado = estado;
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

      const controlador = new AbortController();
      this.controlador = controlador;
      const corrida = ++this.idBusqueda;
      this.cargando = true;
      this.error = "";

      try {
        const params = construirParamsSolicitudesConexion({
          direccion: this.direccion,
          estado: this.filtros.estado || undefined,
          todosLosEstados: this.filtros.estado === "",
          nombreArtistico: this.filtros.nombreArtistico,
          pagina,
          tamano: this.filtros.tamano,
        });
        const response = await solicitudConexionService.buscar(
          params,
          controlador.signal
        );

        if (corrida !== this.idBusqueda) return;

        const data = response?.data || {};
        this.solicitudes = Array.isArray(data.contenido) ? data.contenido : [];
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
        this.solicitudes = [];
        this.paginacion = paginacionInicial();
        this.desuscribirPresencia();
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
      if (campo === "nombreArtistico") {
        this.programarBusqueda();
        return;
      }
      this.buscar(0);
    },
    limpiarFiltros() {
      this.filtros = {
        estado: "",
        nombreArtistico: "",
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
      if (!this.solicitudes.length && pagina > 0) {
        await this.buscar(pagina - 1);
      }
    },
    actualizarSuscripcionPresencia() {
      const nuevos = this.solicitudes
        .map((solicitud) => solicitud?.perfil?.idPerfil)
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
    enLineaDe(solicitud) {
      return enLineaDe(
        solicitud?.perfil?.idPerfil,
        solicitud?.enLinea ?? solicitud?.perfil?.enLinea
      );
    },
    verPerfil(perfil) {
      if (!perfil?.idPerfil) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: perfil.idPerfil },
      });
    },
    async cargarConteos() {
      await cargarConteosSolicitudesConexion(this.direccion);
      try {
        await cargarResumenPerfil(idPerfilActivo());
      } catch {
        // El contador de notificaciones no debe romper la acción.
      }
    },
    irAConexion() {
      if (this.idConexionCreada == null) return;
      this.$router.push({
        name: "mi-red",
        query: {
          tab: "conexiones",
          idConexion: this.idConexionCreada,
        },
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
        await this.cargarConteos();
        this.$emit("actualizado", { conexionCreada: false });
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
          await this.cargarConteos();
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
    abrirGestion(solicitud, modo) {
      if (
        this.procesandoGestion ||
        !["aceptar", "rechazar"].includes(modo)
      ) {
        return;
      }
      this.solicitudGestion = solicitud;
      this.modoGestion = modo;
      this.errorGestion = "";
      this.modalGestion = true;
    },
    alCambiarModalGestion(valor) {
      if (this.procesandoGestion && !valor) return;
      this.modalGestion = valor;
      if (!valor) {
        this.solicitudGestion = null;
        this.errorGestion = "";
      }
    },
    async confirmarGestion() {
      if (this.procesandoGestion) return;
      const solicitud = this.solicitudGestion;
      const idSolicitud = solicitud?.idSolicitudConexion;
      if (idSolicitud == null) return;

      const modo = this.modoGestion;
      this.procesandoGestion = true;
      this.errorGestion = "";
      try {
        const response =
          modo === "aceptar"
            ? await solicitudConexionService.aceptar(idSolicitud)
            : await solicitudConexionService.rechazar(idSolicitud);
        const data = response?.data || {};

        this.modalGestion = false;
        this.solicitudGestion = null;
        this.mensajeExito =
          modo === "aceptar"
            ? "Solicitud aceptada. La conexión ya está activa."
            : "Solicitud rechazada.";
        this.idConexionCreada =
          modo === "aceptar" ? data.idConexion ?? null : null;

        await this.refrescarListado();
        await this.cargarConteos();
        this.$emit("actualizado", { conexionCreada: modo === "aceptar" });
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esConflicto =
          codigo ===
            CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PENDIENTE ||
          codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE;
        const esNoPermitida =
          codigo ===
            CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PERMITIDA ||
          status === 403;
        const esNoEncontrada = status === 404;

        if (esConflicto || esNoPermitida || esNoEncontrada) {
          this.modalGestion = false;
          this.solicitudGestion = null;
          await this.refrescarListado();
          await this.cargarConteos();
          this.$emit("actualizado", {
            conexionCreada: esConflicto,
          });
          this.toast.init({
            title: esConflicto
              ? "Solicitud de conexión"
              : "No se pudo gestionar",
            message: esConflicto
              ? "La solicitud ya fue gestionada."
              : mensajeErrorGestionSolicitudConexion(error),
            color: esConflicto ? "info" : "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorGestion = mensajeErrorGestionSolicitudConexion(error);
      } finally {
        this.procesandoGestion = false;
      }
    },
  },
};
</script>

<style scoped>
.solicitudes-conexion {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.solicitudes-conexion__exito {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.solicitudes-conexion__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.solicitudes-conexion__lista {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
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
