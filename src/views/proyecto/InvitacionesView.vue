<template>
  <div class="invitaciones">
    <header class="invitaciones__cabecera">
      <h1 class="invitaciones__titulo">Invitaciones</h1>
      <p class="invitaciones__subtitulo">
        Revisá las invitaciones a proyectos y las invitaciones de reemplazo.
      </p>
    </header>

    <div class="invitaciones__tabs" role="tablist" aria-label="Invitaciones y reemplazos">
      <button
        v-for="tab in tabs"
        :key="tab.value || 'todas'"
        type="button"
        class="invitaciones__tab"
        :class="{ 'invitaciones__tab--activa': tabActual === tab.value }"
        role="tab"
        :aria-selected="tabActual === tab.value ? 'true' : 'false'"
        @click="cambiarTab(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.total != null" class="invitaciones__tab-contador">
          {{ tab.total }}
        </span>
      </button>
    </div>

    <FiltrosInvitaciones
      v-if="!esSeccionReemplazos"
      :filtros="filtros"
      :error-fechas="errorFechas"
      :etiqueta-perfil="etiquetaPerfil"
      :mostrar-estado="!esSeccionRechazadas"
      @cambio="cambiarFiltro"
      @buscar="buscar(0)"
      @limpiar="limpiarFiltros"
    />

    <BaseAlert
      v-if="!esSeccionReemplazos && mensajeError"
      :message="mensajeError"
      type="error"
    />

    <div
      v-if="!esSeccionReemplazos && puedeReintentar && !cargando"
      class="invitaciones__reintento"
    >
      <VaButton preset="primary" icon="mso-refresh" @click="buscar(paginacion.paginaActual)">
        Reintentar
      </VaButton>
    </div>

    <div v-if="!esSeccionReemplazos && cargando" class="invitaciones__estado">
      <span class="material-symbols-outlined invitaciones__estado-icono">
        hourglass_empty
      </span>
      Cargando invitaciones...
    </div>

    <template v-else-if="!esSeccionReemplazos && !mensajeError">
      <div
        v-if="
          paginacion.totalElementos > 0 ||
          (esSeccionRechazadas && reemplazosRechazadosFiltrados.length)
        "
        class="invitaciones__resultado-cabecera"
      >
        <span class="invitaciones__resultado-total">
          {{ textoResumen }}
        </span>

        <button
          v-if="paginacion.totalElementos > 0"
          type="button"
          class="invitaciones__orden"
          :aria-sort="ordenFecha === 'desc' ? 'descending' : 'ascending'"
          @click="alternarOrden"
        >
          Fecha de envío
          <span class="material-symbols-outlined" aria-hidden="true">
            {{ ordenFecha === "desc" ? "arrow_downward" : "arrow_upward" }}
          </span>
        </button>
      </div>

      <div v-if="invitaciones.length" class="invitaciones__lista">
        <InvitacionCard
          v-for="invitacion in invitaciones"
          :key="invitacion.idInvitacion"
          :invitacion="invitacion"
          :mostrar-direccion="
            tabActual === DIRECCIONES_INVITACION.TODAS || esSeccionRechazadas
          "
          :id-perfil-activo="idPerfilActivo"
          :eliminacion-bloqueada="estaEliminacionBloqueada(invitacion)"
          :gestion-bloqueada="estaGestionBloqueada(invitacion)"
          @abrir="abrirDetalle"
          @ver-proyecto="verProyecto"
          @eliminar="abrirModalEliminar"
          @aceptar="abrirGestionInvitacion($event, ACCIONES_GESTION_INVITACION.ACEPTAR)"
          @rechazar="abrirGestionInvitacion($event, ACCIONES_GESTION_INVITACION.RECHAZAR)"
        />
      </div>

      <div
        v-else-if="!esSeccionRechazadas || !reemplazosRechazadosFiltrados.length"
        class="invitaciones__vacio"
      >
        <span class="material-symbols-outlined" aria-hidden="true">mail</span>
        <p>{{ textoVacio }}</p>
      </div>

      <div
        v-if="paginacion.totalPaginas > 1"
        class="invitaciones__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="irAPagina(-1)"
        >
          Anterior
        </VaButton>
        <span class="invitaciones__pagina">
          Página {{ paginacion.paginaActual + 1 }} de
          {{ paginacion.totalPaginas }}
        </span>
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="irAPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>

    <section
      v-if="esSeccionRechazadas"
      class="invitaciones__rechazos-reemplazo"
    >
      <h2 class="invitaciones__subtitulo-seccion">
        Invitaciones de reemplazo rechazadas
      </h2>

      <BaseAlert
        v-if="errorReemplazosRechazados"
        :message="errorReemplazosRechazados"
        type="error"
      />

      <div
        v-if="errorReemplazosRechazados && puedeReintentarReemplazosRechazados"
        class="invitaciones__reintento"
      >
        <VaButton
          preset="primary"
          icon="mso-refresh"
          @click="cargarReemplazosRechazados"
        >
          Reintentar
        </VaButton>
      </div>

      <div
        v-if="cargandoReemplazosRechazados && !reemplazosRechazados.length"
        class="invitaciones__estado"
      >
        <span class="material-symbols-outlined invitaciones__estado-icono">
          hourglass_empty
        </span>
        Cargando invitaciones de reemplazo rechazadas...
      </div>

      <template v-else-if="!errorReemplazosRechazados">
        <div
          v-if="reemplazosRechazadosFiltrados.length"
          class="invitaciones__lista"
        >
          <InvitacionReemplazoCard
            v-for="invitacion in reemplazosRechazadosFiltrados"
            :key="invitacion.idCandidato"
            :invitacion="invitacion"
            @abrir="abrirDetalleReemplazo"
          />
        </div>

        <div v-else class="invitaciones__vacio">
          <span class="material-symbols-outlined" aria-hidden="true">mail</span>
          <p>No tenés invitaciones de reemplazo rechazadas.</p>
        </div>
      </template>
    </section>

    <template v-if="esSeccionReemplazos">
      <BaseAlert v-if="errorReemplazos" :message="errorReemplazos" type="error" />

      <div
        v-if="errorReemplazos && puedeReintentarReemplazos"
        class="invitaciones__reintento"
      >
        <VaButton preset="primary" icon="mso-refresh" @click="cargarReemplazos">
          Reintentar
        </VaButton>
      </div>

      <div
        v-if="cargandoReemplazos && !reemplazos.length"
        class="invitaciones__estado"
      >
        <span class="material-symbols-outlined invitaciones__estado-icono">
          hourglass_empty
        </span>
        Cargando invitaciones de reemplazo...
      </div>

      <template v-else-if="!errorReemplazos">
        <div
          v-if="reemplazos.length"
          class="invitaciones__resultado-cabecera"
        >
          <span class="invitaciones__resultado-total">
            {{ textoResumenReemplazos }}
          </span>

          <button
            type="button"
            class="invitaciones__orden"
            :disabled="cargandoReemplazos"
            @click="cargarReemplazos"
          >
            Actualizar
            <span class="material-symbols-outlined" aria-hidden="true">
              refresh
            </span>
          </button>
        </div>

        <div v-if="reemplazos.length" class="invitaciones__lista">
          <InvitacionReemplazoCard
            v-for="invitacion in reemplazos"
            :key="invitacion.idCandidato"
            :invitacion="invitacion"
            @abrir="abrirDetalleReemplazo"
            @aceptar="
              abrirGestionReemplazo(
                $event,
                ACCIONES_GESTION_REEMPLAZO.ACEPTAR
              )
            "
            @rechazar="
              abrirGestionReemplazo(
                $event,
                ACCIONES_GESTION_REEMPLAZO.RECHAZAR
              )
            "
          />
        </div>

        <div v-else class="invitaciones__vacio">
          <span class="material-symbols-outlined" aria-hidden="true">mail</span>
          <p>No tenés invitaciones de reemplazo activas.</p>
        </div>
      </template>
    </template>

    <ModalDetalleInvitacion
      :model-value="modalDetalle.visible"
      :invitacion="modalDetalle.invitacion"
      :eliminacion-bloqueada="
        estaEliminacionBloqueada(modalDetalle.invitacion)
      "
      :gestion-bloqueada="estaGestionBloqueada(modalDetalle.invitacion)"
      @update:model-value="onCambioVisibilidadDetalle"
      @ver-proyecto="verProyecto"
      @eliminar="onEliminarDesdeDetalle"
      @aceptar="onGestionDesdeDetalle($event, ACCIONES_GESTION_INVITACION.ACEPTAR)"
      @rechazar="onGestionDesdeDetalle($event, ACCIONES_GESTION_INVITACION.RECHAZAR)"
    />

    <ModalEliminarInvitacion
      :model-value="modalEliminar.visible"
      :invitacion="modalEliminar.invitacion"
      :eliminando="eliminando"
      :error="errorEliminar"
      @update:model-value="onCambioVisibilidadEliminar"
      @confirmar="confirmarEliminarInvitacion"
    />

    <ModalGestionInvitacion
      :model-value="modalGestion.visible"
      :invitacion="modalGestion.invitacion"
      :accion="modalGestion.accion"
      :gestionando="gestionando"
      :error="errorGestion"
      :mostrar-rechazo="mostrarRechazoTrasError"
      @update:model-value="onCambioVisibilidadGestion"
      @confirmar="confirmarGestionInvitacion"
      @rechazar="rechazarDesdeErrorGestion"
    />

    <ModalDetalleInvitacionReemplazo
      :model-value="modalDetalleReemplazo.visible"
      :invitacion="modalDetalleReemplazo.invitacion"
      @update:model-value="onCambioVisibilidadDetalleReemplazo"
      @aceptar="
        onGestionDesdeDetalleReemplazo(
          $event,
          ACCIONES_GESTION_REEMPLAZO.ACEPTAR
        )
      "
      @rechazar="
        onGestionDesdeDetalleReemplazo(
          $event,
          ACCIONES_GESTION_REEMPLAZO.RECHAZAR
        )
      "
    />

    <ModalGestionInvitacionReemplazo
      :model-value="modalGestionReemplazo.visible"
      :invitacion="modalGestionReemplazo.invitacion"
      :accion="modalGestionReemplazo.accion"
      :gestionando="gestionandoReemplazo"
      :error="errorGestionReemplazo"
      :mostrar-rechazo="mostrarRechazoReemplazo"
      @update:model-value="onCambioVisibilidadGestionReemplazo"
      @confirmar="confirmarGestionReemplazo"
      @rechazar="rechazarDesdeErrorReemplazo"
    />
  </div>
</template>

<script>
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import FiltrosInvitaciones from "../../components/invitacion/FiltrosInvitaciones.vue";
import InvitacionCard from "../../components/invitacion/InvitacionCard.vue";
import ModalDetalleInvitacion from "../../components/invitacion/ModalDetalleInvitacion.vue";
import ModalEliminarInvitacion from "../../components/invitacion/ModalEliminarInvitacion.vue";
import ModalGestionInvitacion from "../../components/invitacion/ModalGestionInvitacion.vue";
import InvitacionReemplazoCard from "../../components/invitacion/InvitacionReemplazoCard.vue";
import ModalDetalleInvitacionReemplazo from "../../components/invitacion/ModalDetalleInvitacionReemplazo.vue";
import ModalGestionInvitacionReemplazo from "../../components/invitacion/ModalGestionInvitacionReemplazo.vue";
import invitacionService from "../../services/invitacionService.js";
import reemplazoService from "../../services/reemplazoService.js";
import { cargarResumenInvitaciones } from "../../services/invitacionState.js";
import {
  actualizarResumenReemplazos,
} from "../../services/reemplazoState.js";
import { idPerfilActivo, refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  ACCIONES_GESTION_INVITACION,
  DIRECCIONES_INVITACION,
  ESTADOS_INVITACION,
  ORDEN_FECHA_INVITACION,
  TAMANO_PAGINA_INVITACIONES,
  TIPOS_ERROR_ELIMINAR_INVITACION,
  TIPOS_ERROR_GESTION_INVITACION,
  TIPOS_ERROR_INVITACIONES,
  clasificarErrorEliminarInvitacion,
  clasificarErrorGestionInvitacion,
  clasificarErrorInvitaciones,
  construirParamsInvitaciones,
  normalizarInvitacionBusqueda,
  ordenarInvitacionesPorFecha,
  validarRangoFechasInvitaciones,
} from "../../utils/invitacionBusquedaConstants.js";
import { TIPOS_INVITACION } from "../../utils/invitacionConstants.js";
import { mensajeMotivo } from "../../utils/disponibilidadConstants.js";
import {
  ACCIONES_GESTION_REEMPLAZO,
  ESTADOS_CANDIDATO_REEMPLAZO,
  TIPOS_ERROR_REEMPLAZO,
  clasificarErrorReemplazo,
  puedeGestionarInvitacionReemplazo,
} from "../../utils/reemplazoConstants.js";

const FILTROS_INICIALES = {
  nombreProyecto: "",
  fechaDesde: "",
  fechaHasta: "",
  nombrePerfil: "",
  estado: "",
  tipo: "",
};

const SECCION_REEMPLAZOS = "REEMPLAZOS";
const SECCION_RECHAZADAS = "RECHAZADAS";

let controlador = null;
let controladorEliminar = null;
let controladorGestion = null;
let controladorReemplazos = null;
let controladorReemplazosRechazados = null;
let controladorGestionReemplazo = null;

/*
 * UC-30: invitaciones recibidas o enviadas por el perfil activo.
 * El backend ordena por fecha descendente; el orden ascendente se resuelve en
 * el cliente sobre la lista filtrada (`todos=true`) para que también afecte a
 * todas las páginas.
 */
export default {
  name: "InvitacionesView",
  components: {
    BaseAlert,
    FiltrosInvitaciones,
    InvitacionCard,
    ModalDetalleInvitacion,
    ModalEliminarInvitacion,
    ModalGestionInvitacion,
    InvitacionReemplazoCard,
    ModalDetalleInvitacionReemplazo,
    ModalGestionInvitacionReemplazo,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      DIRECCIONES_INVITACION,
      ACCIONES_GESTION_INVITACION,
      ACCIONES_GESTION_REEMPLAZO,
      tabActual: DIRECCIONES_INVITACION.RECIBIDA,
      ordenFecha: ORDEN_FECHA_INVITACION.DESC,
      filtros: { ...FILTROS_INICIALES },
      listaCompleta: [],
      invitaciones: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: TAMANO_PAGINA_INVITACIONES,
        totalElementos: 0,
        totalPaginas: 1,
        primera: true,
        ultima: true,
      },
      conteos: {
        [DIRECCIONES_INVITACION.TODAS]: null,
        [DIRECCIONES_INVITACION.RECIBIDA]: null,
        [DIRECCIONES_INVITACION.ENVIADA]: null,
      },
      conteoInvitacionesRechazadas: null,
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      modalDetalle: {
        visible: false,
        invitacion: null,
      },
      modalEliminar: {
        visible: false,
        invitacion: null,
      },
      eliminando: false,
      errorEliminar: "",
      idsNoEliminables: [],
      modalGestion: {
        visible: false,
        accion: ACCIONES_GESTION_INVITACION.ACEPTAR,
        invitacion: null,
      },
      gestionando: false,
      errorGestion: "",
      mostrarRechazoTrasError: false,
      idsNoGestionables: [],
      idCarga: 0,
      reemplazos: [],
      cargandoReemplazos: false,
      errorReemplazos: "",
      puedeReintentarReemplazos: false,
      reemplazosRechazados: [],
      cargandoReemplazosRechazados: false,
      errorReemplazosRechazados: "",
      puedeReintentarReemplazosRechazados: false,
      modalDetalleReemplazo: {
        visible: false,
        invitacion: null,
      },
      modalGestionReemplazo: {
        visible: false,
        accion: ACCIONES_GESTION_REEMPLAZO.ACEPTAR,
        invitacion: null,
      },
      gestionandoReemplazo: false,
      errorGestionReemplazo: "",
      mostrarRechazoReemplazo: false,
      idCargaReemplazos: 0,
      idCargaReemplazosRechazados: 0,
    };
  },
  computed: {
    idPerfilActivo() {
      return idPerfilActivo();
    },
    esSeccionReemplazos() {
      return this.tabActual === SECCION_REEMPLAZOS;
    },
    esSeccionRechazadas() {
      return this.tabActual === SECCION_RECHAZADAS;
    },
    totalRechazadas() {
      return (
        this.paginacion.totalElementos +
        this.reemplazosRechazadosFiltrados.length
      );
    },
    reemplazosRechazadosFiltrados() {
      const filtros = this.filtros;
      const idProyecto = filtros.idProyecto;
      const nombreProyecto = String(filtros.nombreProyecto || "")
        .trim()
        .toLowerCase();
      const tipo = String(filtros.tipo || "").toUpperCase();
      const desde = filtros.fechaDesde;
      const hasta = filtros.fechaHasta;

      return this.reemplazosRechazados.filter((item) => {
        if (
          idProyecto != null &&
          idProyecto !== "" &&
          String(item.idProyecto) !== String(idProyecto)
        ) {
          return false;
        }
        if (
          nombreProyecto &&
          !String(item.nombreProyecto || "")
            .toLowerCase()
            .includes(nombreProyecto)
        ) {
          return false;
        }
        if (tipo && String(item.tipo || "").toUpperCase() !== tipo) {
          return false;
        }
        if (desde && item.fechaInvitacion) {
          if (String(item.fechaInvitacion).slice(0, 10) < desde) return false;
        }
        if (hasta && item.fechaInvitacion) {
          if (String(item.fechaInvitacion).slice(0, 10) > hasta) return false;
        }
        return true;
      });
    },
    errorFechas() {
      return validarRangoFechasInvitaciones(
        this.filtros.fechaDesde,
        this.filtros.fechaHasta
      );
    },
    hayFiltrosActivos() {
      return (
        !!String(this.filtros.nombreProyecto || "").trim() ||
        !!this.filtros.fechaDesde ||
        !!this.filtros.fechaHasta ||
        !!String(this.filtros.nombrePerfil || "").trim() ||
        (!this.esSeccionRechazadas && !!this.filtros.estado) ||
        !!this.filtros.tipo
      );
    },
    etiquetaPerfil() {
      if (this.tabActual === DIRECCIONES_INVITACION.RECIBIDA) {
        return "Perfil remitente";
      }
      if (this.tabActual === DIRECCIONES_INVITACION.ENVIADA) {
        return "Perfil destinatario";
      }
      return "Perfil";
    },
    tabs() {
      return [
        {
          value: DIRECCIONES_INVITACION.TODAS,
          label: "Todas",
          total: this.conteos[DIRECCIONES_INVITACION.TODAS],
        },
        {
          value: DIRECCIONES_INVITACION.RECIBIDA,
          label: "Recibidas",
          total: this.conteos[DIRECCIONES_INVITACION.RECIBIDA],
        },
        {
          value: DIRECCIONES_INVITACION.ENVIADA,
          label: "Enviadas",
          total: this.conteos[DIRECCIONES_INVITACION.ENVIADA],
        },
        {
          value: SECCION_RECHAZADAS,
          label: "Rechazadas",
          total:
            this.conteoInvitacionesRechazadas == null &&
            !this.reemplazosRechazadosFiltrados.length
              ? null
              : (this.conteoInvitacionesRechazadas || 0) +
                this.reemplazosRechazadosFiltrados.length,
        },
        {
          value: SECCION_REEMPLAZOS,
          label: "Reemplazos",
          total: this.reemplazos.length,
        },
      ];
    },
    textoResumen() {
      const total = this.paginacion.totalElementos;
      const palabra = total === 1 ? "invitación" : "invitaciones";
      if (this.esSeccionRechazadas) {
        const totalRechazadas = this.totalRechazadas;
        const palabraRechazadas =
          totalRechazadas === 1 ? "invitación rechazada" : "invitaciones rechazadas";
        return `${totalRechazadas} ${palabraRechazadas}`;
      }
      if (this.tabActual === DIRECCIONES_INVITACION.RECIBIDA) {
        return `${total} ${palabra} recibida${total === 1 ? "" : "s"}`;
      }
      if (this.tabActual === DIRECCIONES_INVITACION.ENVIADA) {
        return `${total} ${palabra} enviada${total === 1 ? "" : "s"}`;
      }
      return `${total} ${palabra}`;
    },
    textoVacio() {
      if (this.hayFiltrosActivos) {
        return "No tenés invitaciones que coincidan con los filtros.";
      }
      if (this.esSeccionRechazadas) {
        return "Todavía no tenés invitaciones a proyectos rechazadas.";
      }
      if (this.tabActual === DIRECCIONES_INVITACION.RECIBIDA) {
        return "Todavía no tenés invitaciones recibidas.";
      }
      if (this.tabActual === DIRECCIONES_INVITACION.ENVIADA) {
        return "Todavía no tenés invitaciones enviadas.";
      }
      return "Todavía no tenés invitaciones.";
    },
    textoResumenReemplazos() {
      const total = this.reemplazos.length;
      const pendientes = this.reemplazos.filter(
        (invitacion) =>
          invitacion?.estado === ESTADOS_CANDIDATO_REEMPLAZO.INVITADO
      ).length;
      const palabra = total === 1 ? "invitación" : "invitaciones";
      if (!total) return "";
      return `${total} ${palabra} de reemplazo · ${pendientes} pendiente${
        pendientes === 1 ? "" : "s"
      } de respuesta`;
    },
  },
  watch: {
    "$route.query.seccion"(nuevo, anterior) {
      if (nuevo === anterior) return;
      if (nuevo === "reemplazos") {
        if (this.tabActual !== SECCION_REEMPLAZOS) {
          this.tabActual = SECCION_REEMPLAZOS;
          this.cargarReemplazos();
        }
        return;
      }
      if (nuevo === "rechazadas") {
        if (this.tabActual !== SECCION_RECHAZADAS) {
          this.tabActual = SECCION_RECHAZADAS;
          this.buscar(0);
          this.cargarReemplazosRechazados();
        }
        return;
      }
      if (
        this.tabActual === SECCION_REEMPLAZOS ||
        this.tabActual === SECCION_RECHAZADAS
      ) {
        this.tabActual = DIRECCIONES_INVITACION.RECIBIDA;
        this.buscar(0);
      }
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.aplicarSeccionDesdeQuery();
    this.cargarReemplazos();
    this.cargarReemplazosRechazados();
    if (!this.esSeccionReemplazos) this.buscar(0);
    cargarResumenInvitaciones(this.idPerfilActivo);
  },
  beforeUnmount() {
    this.abortar();
    if (controladorEliminar) controladorEliminar.abort();
    if (controladorGestion) controladorGestion.abort();
    if (controladorReemplazos) controladorReemplazos.abort();
    if (controladorReemplazosRechazados) controladorReemplazosRechazados.abort();
    if (controladorGestionReemplazo) controladorGestionReemplazo.abort();
  },
  methods: {
    aplicarSeccionDesdeQuery() {
      if (this.$route.query.seccion === "reemplazos") {
        this.tabActual = SECCION_REEMPLAZOS;
      } else if (this.$route.query.seccion === "rechazadas") {
        this.tabActual = SECCION_RECHAZADAS;
      }
    },
    cambiarTab(direccion) {
      if (this.tabActual === direccion) return;
      this.tabActual = direccion;

      const query = { ...this.$route.query };
      if (direccion === SECCION_REEMPLAZOS) query.seccion = "reemplazos";
      else if (direccion === SECCION_RECHAZADAS) query.seccion = "rechazadas";
      else delete query.seccion;
      this.$router.replace({ name: "invitaciones", query }).catch(() => {});

      if (direccion === SECCION_REEMPLAZOS) {
        this.cargarReemplazos();
      } else {
        this.buscar(0);
        if (direccion === SECCION_RECHAZADAS) {
          this.cargarReemplazosRechazados();
        }
      }
    },
    cambiarFiltro({ campo, valor }) {
      this.filtros = { ...this.filtros, [campo]: valor ?? "" };
      if (campo === "estado" || campo === "tipo") {
        this.buscar(0);
      }
    },
    limpiarFiltros() {
      this.filtros = { ...FILTROS_INICIALES };
      this.buscar(0);
    },
    alternarOrden() {
      this.ordenFecha =
        this.ordenFecha === ORDEN_FECHA_INVITACION.DESC
          ? ORDEN_FECHA_INVITACION.ASC
          : ORDEN_FECHA_INVITACION.DESC;
      this.aplicarOrdenYPagina(0);
    },
    paginar(listado, pagina) {
      const totalElementos = listado.length;
      const totalPaginas = Math.max(
        1,
        Math.ceil(totalElementos / TAMANO_PAGINA_INVITACIONES)
      );
      const actual = Math.min(Math.max(Number(pagina) || 0, 0), totalPaginas - 1);

      return {
        contenido: listado.slice(
          actual * TAMANO_PAGINA_INVITACIONES,
          (actual + 1) * TAMANO_PAGINA_INVITACIONES
        ),
        paginaActual: actual,
        totalElementos,
        totalPaginas,
        primera: actual === 0,
        ultima: actual >= totalPaginas - 1,
      };
    },
    aplicarOrdenYPagina(pagina = 0) {
      const ordenada = ordenarInvitacionesPorFecha(
        this.listaCompleta,
        this.ordenFecha
      );
      const paginaActual = this.paginar(ordenada, pagina);
      this.invitaciones = paginaActual.contenido;
      this.paginacion = {
        paginaActual: paginaActual.paginaActual,
        tamanoPagina: TAMANO_PAGINA_INVITACIONES,
        totalElementos: paginaActual.totalElementos,
        totalPaginas: paginaActual.totalPaginas,
        primera: paginaActual.primera,
        ultima: paginaActual.ultima,
      };
      this.conteos = {
        ...this.conteos,
        [this.tabActual]: paginaActual.totalElementos,
      };
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.aplicarOrdenYPagina(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    paramsLista() {
      const filtros = { ...this.filtros, direccion: this.tabActual };
      if (this.esSeccionRechazadas) {
        filtros.direccion = DIRECCIONES_INVITACION.TODAS;
        filtros.estado = ESTADOS_INVITACION.RECHAZADA;
      }
      return construirParamsInvitaciones(filtros, { todos: true });
    },
    paramsConteo(direccion) {
      const filtros = { ...this.filtros, direccion };
      if (direccion === SECCION_RECHAZADAS) {
        filtros.direccion = DIRECCIONES_INVITACION.TODAS;
        filtros.estado = ESTADOS_INVITACION.RECHAZADA;
      }
      return construirParamsInvitaciones(filtros, {
        pagina: 0,
        tamano: 1,
      });
    },
    async buscar(pagina = 0) {
      if (this.errorFechas) {
        this.idCarga += 1;
        this.abortar();
        this.cargando = false;
        return;
      }

      const corrida = ++this.idCarga;
      this.abortar();
      controlador = new AbortController();
      const signal = controlador.signal;

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      const direccionesConteo = [
        DIRECCIONES_INVITACION.TODAS,
        DIRECCIONES_INVITACION.RECIBIDA,
        DIRECCIONES_INVITACION.ENVIADA,
      ].filter((direccion) => direccion !== this.tabActual);

      const peticiones = [
        invitacionService.buscar(this.paramsLista(), signal),
        ...direccionesConteo.map((direccion) =>
          invitacionService.buscar(this.paramsConteo(direccion), signal)
        ),
      ];

      if (!this.esSeccionRechazadas) {
        peticiones.push(
          invitacionService.buscar(
            this.paramsConteo(SECCION_RECHAZADAS),
            signal
          )
        );
      }

      try {
        const [listaResultado, ...conteosResultado] =
          await Promise.allSettled(peticiones);

        if (corrida !== this.idCarga) return;

        if (listaResultado.status === "rejected") {
          throw listaResultado.reason;
        }

        const contenido = listaResultado.value?.data?.contenido;
        this.listaCompleta = (Array.isArray(contenido) ? contenido : [])
          .map(normalizarInvitacionBusqueda)
          .filter((item) => item.idInvitacion != null);

        const nuevosConteos = { ...this.conteos };
        direccionesConteo.forEach((direccion, indice) => {
          const resultado = conteosResultado[indice];
          if (resultado?.status === "fulfilled") {
            const total = Number(resultado.value?.data?.totalElementos);
            nuevosConteos[direccion] = Number.isFinite(total) ? total : null;
          } else {
            nuevosConteos[direccion] = null;
          }
        });
        this.conteos = nuevosConteos;

        if (!this.esSeccionRechazadas) {
          const resultadoRechazadas =
            conteosResultado[direccionesConteo.length];
          if (resultadoRechazadas?.status === "fulfilled") {
            const total = Number(
              resultadoRechazadas.value?.data?.totalElementos
            );
            this.conteoInvitacionesRechazadas = Number.isFinite(total)
              ? total
              : null;
          } else {
            this.conteoInvitacionesRechazadas = null;
          }
        }

        this.aplicarOrdenYPagina(pagina);

        if (this.esSeccionRechazadas) {
          this.conteoInvitacionesRechazadas = this.paginacion.totalElementos;
        }
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarError(error) {
      const clasificacion = clasificarErrorInvitaciones(error);
      const { tipo, mensaje } = clasificacion;

      this.listaCompleta = [];
      this.invitaciones = [];
      this.paginacion = {
        paginaActual: 0,
        tamanoPagina: TAMANO_PAGINA_INVITACIONES,
        totalElementos: 0,
        totalPaginas: 1,
        primera: true,
        ultima: true,
      };
      this.conteos = {
        [DIRECCIONES_INVITACION.TODAS]: null,
        [DIRECCIONES_INVITACION.RECIBIDA]: null,
        [DIRECCIONES_INVITACION.ENVIADA]: null,
      };
      this.conteoInvitacionesRechazadas = null;
      this.mensajeError = "";
      this.puedeReintentar = false;

      if (tipo === TIPOS_ERROR_INVITACIONES.SESION) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACIONES.PERFIL_ACTIVO) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACIONES.FECHAS) {
        this.mensajeError =
          mensaje ||
          "La fecha desde no puede ser posterior a la fecha hasta.";
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACIONES.CUENTA) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACIONES.PERMISO) {
        this.mensajeError =
          mensaje || "No tenés permiso para consultar invitaciones.";
        return;
      }

      if (tipo === TIPOS_ERROR_INVITACIONES.NO_ENCONTRADO) {
        this.mensajeError = mensaje || "No se encontraron las invitaciones.";
        return;
      }

      this.puedeReintentar = true;
      this.mensajeError =
        mensaje ||
        "Ocurrió un error al cargar las invitaciones. Inténtalo nuevamente.";
    },
    async cargarReemplazos() {
      if (this.cargandoReemplazos) {
        if (controladorReemplazos) controladorReemplazos.abort();
      }
      const corrida = ++this.idCargaReemplazos;
      if (controladorReemplazos) controladorReemplazos.abort();
      controladorReemplazos = new AbortController();

      this.cargandoReemplazos = true;
      this.errorReemplazos = "";
      this.puedeReintentarReemplazos = false;

      try {
        const response = await reemplazoService.listarInvitaciones(
          controladorReemplazos.signal
        );
        if (corrida !== this.idCargaReemplazos) return;
        const data = response?.data;
        this.reemplazos = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : [];
        actualizarResumenReemplazos(this.reemplazos);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCargaReemplazos) {
          return;
        }
        await this.manejarErrorReemplazos(error);
      } finally {
        if (corrida === this.idCargaReemplazos) {
          this.cargandoReemplazos = false;
        }
      }
    },
    async cargarReemplazosRechazados() {
      const corrida = ++this.idCargaReemplazosRechazados;
      if (controladorReemplazosRechazados) {
        controladorReemplazosRechazados.abort();
      }
      controladorReemplazosRechazados = new AbortController();

      this.cargandoReemplazosRechazados = true;
      this.errorReemplazosRechazados = "";
      this.puedeReintentarReemplazosRechazados = false;

      try {
        const response = await reemplazoService.listarInvitacionesRechazadas(
          controladorReemplazosRechazados.signal
        );
        if (corrida !== this.idCargaReemplazosRechazados) return;
        const data = response?.data;
        this.reemplazosRechazados = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : [];
      } catch (error) {
        if (
          this.esCancelacion(error) ||
          corrida !== this.idCargaReemplazosRechazados
        ) {
          return;
        }
        this.reemplazosRechazados = [];
        this.errorReemplazosRechazados = mensajeErrorApi(
          error,
          "No se pudieron cargar las invitaciones de reemplazo rechazadas."
        );
        this.puedeReintentarReemplazosRechazados = true;
      } finally {
        if (corrida === this.idCargaReemplazosRechazados) {
          this.cargandoReemplazosRechazados = false;
        }
      }
    },
    async manejarErrorReemplazos(error) {
      const clasificacion = clasificarErrorReemplazo(error);
      const mensaje = mensajeErrorApi(
        error,
        "No se pudieron cargar las invitaciones de reemplazo."
      );

      this.reemplazos = [];
      this.errorReemplazos = "";
      this.puedeReintentarReemplazos = false;
      actualizarResumenReemplazos([]);

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.SESION) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_ACTIVO) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.CUENTA) {
        this.errorReemplazos = mensaje;
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERMISO) {
        this.errorReemplazos =
          clasificacion.mensaje ||
          "No tenés permiso para consultar invitaciones de reemplazo.";
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.NO_ENCONTRADO) {
        this.errorReemplazos =
          clasificacion.mensaje ||
          "Las invitaciones de reemplazo ya no están disponibles.";
        return;
      }

      this.errorReemplazos = mensaje;
      this.puedeReintentarReemplazos = true;
    },
    abrirDetalleReemplazo(invitacion) {
      if (!invitacion?.idCandidato) return;
      this.modalDetalleReemplazo = { visible: true, invitacion };
    },
    onCambioVisibilidadDetalleReemplazo(valor) {
      if (!valor) {
        this.modalDetalleReemplazo = { visible: false, invitacion: null };
        return;
      }
      this.modalDetalleReemplazo = {
        ...this.modalDetalleReemplazo,
        visible: true,
      };
    },
    onGestionDesdeDetalleReemplazo(invitacion, accion) {
      this.modalDetalleReemplazo = { visible: false, invitacion: null };
      this.$nextTick(() => {
        this.abrirGestionReemplazo(invitacion, accion);
      });
    },
    puedeGestionarInvitacionReemplazo,
    abrirGestionReemplazo(invitacion, accion) {
      if (
        this.gestionandoReemplazo ||
        !puedeGestionarInvitacionReemplazo(invitacion)
      ) {
        return;
      }
      this.modalGestionReemplazo = {
        visible: true,
        accion,
        invitacion,
      };
      this.errorGestionReemplazo = "";
      this.mostrarRechazoReemplazo = false;
    },
    onCambioVisibilidadGestionReemplazo(valor) {
      if (!valor) {
        this.cerrarModalGestionReemplazo();
        return;
      }
      this.modalGestionReemplazo = {
        ...this.modalGestionReemplazo,
        visible: true,
      };
    },
    cerrarModalGestionReemplazo(forzar = false) {
      if (this.gestionandoReemplazo && !forzar) return;
      this.modalGestionReemplazo = {
        visible: false,
        accion: ACCIONES_GESTION_REEMPLAZO.ACEPTAR,
        invitacion: null,
      };
      this.errorGestionReemplazo = "";
      this.mostrarRechazoReemplazo = false;
    },
    rechazarDesdeErrorReemplazo() {
      if (this.gestionandoReemplazo) return;
      this.modalGestionReemplazo = {
        ...this.modalGestionReemplazo,
        accion: ACCIONES_GESTION_REEMPLAZO.RECHAZAR,
      };
      this.errorGestionReemplazo = "";
      this.mostrarRechazoReemplazo = false;
    },
    async confirmarGestionReemplazo(motivo) {
      if (this.gestionandoReemplazo) return;

      const { accion, invitacion } = this.modalGestionReemplazo;
      if (!invitacion || !puedeGestionarInvitacionReemplazo(invitacion)) {
        return;
      }

      const esAceptar = accion === ACCIONES_GESTION_REEMPLAZO.ACEPTAR;
      this.gestionandoReemplazo = true;
      this.errorGestionReemplazo = "";
      this.mostrarRechazoReemplazo = false;
      if (controladorGestionReemplazo) controladorGestionReemplazo.abort();
      controladorGestionReemplazo = new AbortController();

      try {
        if (esAceptar) {
          await reemplazoService.aceptarInvitacion(
            invitacion.idCandidato,
            controladorGestionReemplazo.signal
          );
        } else {
          await reemplazoService.rechazarInvitacion(
            invitacion.idCandidato,
            motivo,
            controladorGestionReemplazo.signal
          );
        }

        this.cerrarModalGestionReemplazo(true);
        this.toast.init({
          title: esAceptar
            ? "Invitación aceptada"
            : "Invitación rechazada",
          message: esAceptar
            ? "Tu aceptación quedó pendiente de aprobación del director."
            : "La invitación de reemplazo quedó rechazada.",
          color: "success",
          position: "top-right",
          duration: 6000,
        });
        await this.cargarReemplazos();
        await this.cargarReemplazosRechazados();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorGestionReemplazo(error, esAceptar);
      } finally {
        this.gestionandoReemplazo = false;
      }
    },
    async manejarErrorGestionReemplazo(error, esAceptar) {
      const clasificacion = clasificarErrorReemplazo(error);
      const { tipo, mensaje, codigo } = clasificacion;
      const invitacion = this.modalGestionReemplazo.invitacion;

      if (tipo === TIPOS_ERROR_REEMPLAZO.SESION) {
        this.cerrarModalGestionReemplazo(true);
        return;
      }

      if (tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_ACTIVO) {
        this.cerrarModalGestionReemplazo(true);
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO) {
        this.cerrarModalGestionReemplazo(true);
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      const codigosConRechazo = [
        "CANDIDATO_SIN_DISPONIBILIDAD",
        "VACANTE_YA_CUBIERTA",
        "ACTIVIDAD_NO_GESTIONABLE",
        "REQUERIMIENTO_NO_ACTIVO",
      ];

      if (esAceptar && codigosConRechazo.includes(codigo)) {
        this.errorGestionReemplazo =
          mensaje ||
          "No se pudo aceptar la invitación. Podés rechazarla para cerrar la gestión.";
        this.mostrarRechazoReemplazo = true;
        return;
      }

      if (
        tipo === TIPOS_ERROR_REEMPLAZO.NO_ENCONTRADO ||
        tipo === TIPOS_ERROR_REEMPLAZO.PROYECTO_NO_ENCONTRADO ||
        tipo === TIPOS_ERROR_REEMPLAZO.CONFLICTO
      ) {
        this.cerrarModalGestionReemplazo(true);
        this.toast.init({
          title: "La invitación ya no está disponible",
          message:
            mensaje ||
            "La invitación cambió de estado. Actualizamos el listado.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargarReemplazos();
        return;
      }

      if (tipo === TIPOS_ERROR_REEMPLAZO.CUENTA) {
        this.cerrarModalGestionReemplazo(true);
        this.toast.init({
          title: "Cuenta no habilitada",
          message: mensajeErrorApi(error, "Tu cuenta no se encuentra activa."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (tipo === TIPOS_ERROR_REEMPLAZO.PERMISO) {
        this.cerrarModalGestionReemplazo(true);
        if (invitacion?.idCandidato != null) {
          this.reemplazos = this.reemplazos.filter(
            (item) => item.idCandidato !== invitacion.idCandidato
          );
          actualizarResumenReemplazos(this.reemplazos);
        }
        this.toast.init({
          title: "Sin permiso",
          message:
            mensaje ||
            "La invitación no pertenece al perfil activo o ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      this.errorGestionReemplazo = mensajeErrorApi(
        error,
        "No se pudo gestionar la invitación de reemplazo."
      );
      this.mostrarRechazoReemplazo = false;
    },
    abrirDetalle(invitacion) {
      if (!invitacion) return;
      this.modalDetalle = { visible: true, invitacion };
    },
    onCambioVisibilidadDetalle(valor) {
      if (!valor) {
        this.modalDetalle = { visible: false, invitacion: null };
        return;
      }
      this.modalDetalle.visible = true;
    },
    verProyecto(invitacion) {
      const idProyecto = invitacion?.idProyecto;
      if (idProyecto == null) return;
      this.modalDetalle = { visible: false, invitacion: null };
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: idProyecto },
      });
    },
    estaGestionBloqueada(invitacion) {
      const id = invitacion?.idInvitacion;
      if (id == null) return false;
      return this.idsNoGestionables.some(
        (existente) => String(existente) === String(id)
      );
    },
    puedeGestionarInvitacion(invitacion) {
      return (
        !!invitacion &&
        invitacion.direccion === DIRECCIONES_INVITACION.RECIBIDA &&
        invitacion.estado === "PENDIENTE" &&
        !this.estaGestionBloqueada(invitacion)
      );
    },
    abrirGestionInvitacion(invitacion, accion) {
      if (this.gestionando || !this.puedeGestionarInvitacion(invitacion)) {
        return;
      }
      this.modalGestion = {
        visible: true,
        accion,
        invitacion,
      };
      this.errorGestion = "";
      this.mostrarRechazoTrasError = false;
    },
    onGestionDesdeDetalle(invitacion, accion) {
      this.modalDetalle = { visible: false, invitacion: null };
      this.$nextTick(() => this.abrirGestionInvitacion(invitacion, accion));
    },
    onCambioVisibilidadGestion(valor) {
      if (!valor) {
        this.cerrarModalGestion();
        return;
      }
      this.modalGestion.visible = true;
    },
    cerrarModalGestion() {
      if (this.gestionando) return;
      this.modalGestion = {
        visible: false,
        accion: ACCIONES_GESTION_INVITACION.ACEPTAR,
        invitacion: null,
      };
      this.errorGestion = "";
      this.mostrarRechazoTrasError = false;
    },
    async confirmarGestionInvitacion() {
      if (this.gestionando) return;

      const { accion, invitacion } = this.modalGestion;
      if (!invitacion || !this.puedeGestionarInvitacion(invitacion)) return;

      const esAceptar = accion === ACCIONES_GESTION_INVITACION.ACEPTAR;
      const esActividad = invitacion.tipo === TIPOS_INVITACION.ACTIVIDAD;

      this.gestionando = true;
      this.errorGestion = "";
      this.mostrarRechazoTrasError = false;
      if (controladorGestion) controladorGestion.abort();
      controladorGestion = new AbortController();

      try {
        const response = esAceptar
          ? esActividad
            ? await invitacionService.aceptarActividad(
                invitacion.idInvitacion,
                controladorGestion.signal
              )
            : await invitacionService.aceptarGeneral(
                invitacion.idInvitacion,
                controladorGestion.signal
              )
          : esActividad
            ? await invitacionService.rechazarActividad(
                invitacion.idInvitacion,
                controladorGestion.signal
              )
            : await invitacionService.rechazarGeneral(
                invitacion.idInvitacion,
                controladorGestion.signal
              );

        const data = response?.data || {};
        this.gestionando = false;
        this.modalGestion = {
          visible: false,
          accion: ACCIONES_GESTION_INVITACION.ACEPTAR,
          invitacion: null,
        };
        this.modalDetalle = { visible: false, invitacion: null };
        this.errorGestion = "";
        this.mostrarRechazoTrasError = false;

        await cargarResumenInvitaciones(idPerfilActivo());

        if (esAceptar) {
          this.toast.init({
            title: "Invitación aceptada",
            message: esActividad
              ? "La invitación fue aceptada y quedaste asignado a la actividad."
              : "La invitación fue aceptada. Ya sos miembro del proyecto.",
            color: "success",
            position: "top-right",
            duration: 6000,
          });
          this.mostrarAdvertenciasAceptacion(data.advertencias);
          if (invitacion.idProyecto != null) {
            this.$router.push({
              name: "dashboard-proyecto",
              params: { id: invitacion.idProyecto },
            });
          }
          return;
        }

        this.toast.init({
          title: "Invitación rechazada",
          message: "La invitación quedó en estado RECHAZADA.",
          color: "success",
          position: "top-right",
          duration: 6000,
        });
        this.tabActual = DIRECCIONES_INVITACION.RECIBIDA;
        await this.buscar(0);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorGestion(error);
      } finally {
        this.gestionando = false;
      }
    },
    async rechazarDesdeErrorGestion() {
      if (this.gestionando) return;
      const invitacion = this.modalGestion.invitacion;
      if (!invitacion) return;

      this.modalGestion = {
        ...this.modalGestion,
        accion: ACCIONES_GESTION_INVITACION.RECHAZAR,
      };
      this.errorGestion = "";
      this.mostrarRechazoTrasError = false;
      await this.confirmarGestionInvitacion();
    },
    mostrarAdvertenciasAceptacion(advertencias) {
      const lista = Array.isArray(advertencias) ? advertencias : [];
      if (!lista.length) return;

      const nombres = lista.slice(0, 3).map((advertencia) => {
        const actividad = advertencia?.nombreActividad || "una actividad";
        return advertencia?.nombreProyecto
          ? `${actividad} (${advertencia.nombreProyecto})`
          : actividad;
      });
      const restantes = lista.length - nombres.length;
      const detalle = `${nombres.join(", ")}${
        restantes > 0 ? ` y ${restantes} más` : ""
      }`;

      this.toast.init({
        title: "Posible superposición de agenda",
        message: `El perfil tiene actividades que podrían superponerse: ${detalle}.`,
        color: "warning",
        position: "top-right",
        duration: 9000,
      });
    },
    async manejarErrorGestion(error) {
      const clasificacion = clasificarErrorGestionInvitacion(error);
      const { tipo, mensaje, codigoMotivo } = clasificacion;
      const invitacion = this.modalGestion.invitacion;

      const cerrar = () => {
        this.modalGestion = {
          visible: false,
          accion: ACCIONES_GESTION_INVITACION.ACEPTAR,
          invitacion: null,
        };
        this.errorGestion = "";
        this.mostrarRechazoTrasError = false;
      };

      if (tipo === TIPOS_ERROR_GESTION_INVITACION.SESION) {
        cerrar();
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (tipo === TIPOS_ERROR_GESTION_INVITACION.PERFIL_ACTIVO) {
        cerrar();
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_GESTION_INVITACION.NO_ENCONTRADA) {
        cerrar();
        this.toast.init({
          title: "Invitación no disponible",
          message: mensaje || "La invitación ya no existe.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (tipo === TIPOS_ERROR_GESTION_INVITACION.SIN_PERMISO) {
        cerrar();
        if (invitacion?.idInvitacion != null) {
          this.idsNoGestionables = [
            ...this.idsNoGestionables,
            invitacion.idInvitacion,
          ];
        }
        this.toast.init({
          title: "Sin permiso",
          message:
            mensaje || "La invitación no pertenece al perfil activo.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (tipo === TIPOS_ERROR_GESTION_INVITACION.NO_PENDIENTE) {
        cerrar();
        this.toast.init({
          title: "La invitación ya no está pendiente",
          message:
            mensaje ||
            "La invitación cambió de estado. Actualizamos el listado.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      const motivo =
        tipo === TIPOS_ERROR_GESTION_INVITACION.SIN_DISPONIBILIDAD &&
        codigoMotivo
          ? mensajeMotivo(codigoMotivo, mensaje)
          : mensaje;

      const tiposConRechazo = [
        TIPOS_ERROR_GESTION_INVITACION.SIN_DISPONIBILIDAD,
        TIPOS_ERROR_GESTION_INVITACION.CUPO,
        TIPOS_ERROR_GESTION_INVITACION.PROFESION,
        TIPOS_ERROR_GESTION_INVITACION.PROYECTO_ESTADO,
        TIPOS_ERROR_GESTION_INVITACION.ACTIVIDAD_INVALIDA,
        TIPOS_ERROR_GESTION_INVITACION.YA_MIEMBRO,
        TIPOS_ERROR_GESTION_INVITACION.YA_ASIGNADO,
        TIPOS_ERROR_GESTION_INVITACION.DIRECTOR,
        TIPOS_ERROR_GESTION_INVITACION.CONFLICTO,
      ];

      this.errorGestion = motivo;
      this.mostrarRechazoTrasError =
        tiposConRechazo.includes(tipo) &&
        this.modalGestion.accion === ACCIONES_GESTION_INVITACION.ACEPTAR;
    },
    estaEliminacionBloqueada(invitacion) {
      const id = invitacion?.idInvitacion;
      if (id == null) return false;
      return this.idsNoEliminables.some(
        (existente) => String(existente) === String(id)
      );
    },
    puedeEliminarInvitacion(invitacion) {
      return (
        !!invitacion &&
        invitacion.direccion === DIRECCIONES_INVITACION.ENVIADA &&
        invitacion.estado === "PENDIENTE" &&
        invitacion.puedeEliminar === true &&
        !this.estaEliminacionBloqueada(invitacion)
      );
    },
    abrirModalEliminar(invitacion) {
      if (this.eliminando || !this.puedeEliminarInvitacion(invitacion)) {
        return;
      }
      this.modalEliminar = { visible: true, invitacion };
      this.errorEliminar = "";
    },
    onEliminarDesdeDetalle(invitacion) {
      this.modalDetalle = { visible: false, invitacion: null };
      this.$nextTick(() => this.abrirModalEliminar(invitacion));
    },
    onCambioVisibilidadEliminar(valor) {
      if (!valor) {
        this.cerrarModalEliminar();
        return;
      }
      this.modalEliminar.visible = true;
    },
    cerrarModalEliminar() {
      if (this.eliminando) return;
      this.modalEliminar = { visible: false, invitacion: null };
      this.errorEliminar = "";
    },
    async confirmarEliminarInvitacion() {
      if (this.eliminando) return;

      const invitacion = this.modalEliminar.invitacion;
      if (!invitacion || !this.puedeEliminarInvitacion(invitacion)) return;

      this.eliminando = true;
      this.errorEliminar = "";
      if (controladorEliminar) controladorEliminar.abort();
      controladorEliminar = new AbortController();

      try {
        if (invitacion.tipo === TIPOS_INVITACION.ACTIVIDAD) {
          await invitacionService.eliminarActividad(
            invitacion.idProyecto,
            invitacion.idInvitacion,
            controladorEliminar.signal
          );
        } else {
          await invitacionService.eliminarGeneral(
            invitacion.idProyecto,
            invitacion.idInvitacion,
            controladorEliminar.signal
          );
        }

        this.eliminando = false;
        this.modalEliminar = { visible: false, invitacion: null };
        this.toast.init({
          title: "Invitación eliminada",
          message: "La invitación se eliminó correctamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.buscar(this.paginacion.paginaActual);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorEliminar(error);
      } finally {
        this.eliminando = false;
      }
    },
    async manejarErrorEliminar(error) {
      const { tipo, mensaje } = clasificarErrorEliminarInvitacion(error);
      const invitacion = this.modalEliminar.invitacion;

      const cerrar = () => {
        this.modalEliminar = { visible: false, invitacion: null };
        this.errorEliminar = "";
      };

      if (tipo === TIPOS_ERROR_ELIMINAR_INVITACION.SESION) {
        cerrar();
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INVITACION.PERFIL_ACTIVO) {
        cerrar();
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INVITACION.NO_ENCONTRADA) {
        cerrar();
        this.toast.init({
          title: "Invitación no disponible",
          message: mensaje || "La invitación ya no existe.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INVITACION.SIN_PERMISO) {
        cerrar();
        if (invitacion?.idInvitacion != null) {
          this.idsNoEliminables = [
            ...this.idsNoEliminables,
            invitacion.idInvitacion,
          ];
        }
        this.toast.init({
          title: "Sin permiso",
          message:
            mensaje || "No tenés permiso para eliminar esta invitación.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INVITACION.NO_PENDIENTE) {
        cerrar();
        this.toast.init({
          title: "La invitación ya no está pendiente",
          message:
            mensaje ||
            "La invitación cambió de estado. Actualizamos el listado.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      // CUENTA, CONFLICTO y DESCONOCIDO: mantener el modal para reintentar.
      this.errorEliminar = mensaje;
    },
    abortar() {
      if (controlador) {
        controlador.abort();
        controlador = null;
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
.invitaciones {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.invitaciones__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.35rem;
}

.invitaciones__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.2;
}

.invitaciones__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.invitaciones__tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 1.4rem;
  border-bottom: 1px solid var(--color-border);
}

.invitaciones__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.7rem 0 0.6rem;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.invitaciones__tab:hover {
  color: var(--color-primary);
}

.invitaciones__tab--activa {
  border-bottom-color: var(--color-primary);
  color: var(--color-text);
}

.invitaciones__tab-contador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
}

.invitaciones__tab--activa .invitaciones__tab-contador {
  background: var(--color-primary);
  color: #fff;
}

.invitaciones__rechazos-reemplazo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.invitaciones__subtitulo-seccion {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.invitaciones__resultado-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.invitaciones__orden {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.35rem;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  cursor: pointer;
}

.invitaciones__orden:hover {
  color: var(--color-primary);
}

.invitaciones__orden .material-symbols-outlined {
  font-size: 1rem;
}

.invitaciones__lista {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.invitaciones__estado,
.invitaciones__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.invitaciones__estado-icono {
  font-size: 1.6rem;
}

.invitaciones__vacio .material-symbols-outlined {
  font-size: 1.8rem;
}

.invitaciones__vacio p {
  margin: 0;
}

.invitaciones__reintento {
  display: flex;
  justify-content: center;
}

.invitaciones__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

.invitaciones__pagina {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .invitaciones__resultado-cabecera {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>
