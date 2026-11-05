<template>
  <div class="invitaciones">
    <header class="invitaciones__cabecera">
      <h1 class="invitaciones__titulo">Invitaciones</h1>
      <p class="invitaciones__subtitulo">
        Revisá las invitaciones a proyectos que recibiste o enviaste.
      </p>
    </header>

    <div class="invitaciones__tabs" role="tablist" aria-label="Dirección de invitaciones">
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
      :filtros="filtros"
      :error-fechas="errorFechas"
      :etiqueta-perfil="etiquetaPerfil"
      @cambio="cambiarFiltro"
      @buscar="buscar(0)"
      @limpiar="limpiarFiltros"
    />

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div
      v-if="puedeReintentar && !cargando"
      class="invitaciones__reintento"
    >
      <VaButton preset="primary" icon="mso-refresh" @click="buscar(paginacion.paginaActual)">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="invitaciones__estado">
      <span class="material-symbols-outlined invitaciones__estado-icono">
        hourglass_empty
      </span>
      Cargando invitaciones...
    </div>

    <template v-else-if="!mensajeError">
      <div
        v-if="paginacion.totalElementos > 0"
        class="invitaciones__resultado-cabecera"
      >
        <span class="invitaciones__resultado-total">
          {{ textoResumen }}
        </span>

        <button
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
          :mostrar-direccion="tabActual === DIRECCIONES_INVITACION.TODAS"
          :id-perfil-activo="idPerfilActivo"
          :eliminacion-bloqueada="estaEliminacionBloqueada(invitacion)"
          @abrir="abrirDetalle"
          @ver-proyecto="verProyecto"
          @eliminar="abrirModalEliminar"
        />
      </div>

      <div v-else class="invitaciones__vacio">
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

    <ModalDetalleInvitacion
      :model-value="modalDetalle.visible"
      :invitacion="modalDetalle.invitacion"
      :eliminacion-bloqueada="
        estaEliminacionBloqueada(modalDetalle.invitacion)
      "
      @update:model-value="onCambioVisibilidadDetalle"
      @ver-proyecto="verProyecto"
      @eliminar="onEliminarDesdeDetalle"
    />

    <ModalEliminarInvitacion
      :model-value="modalEliminar.visible"
      :invitacion="modalEliminar.invitacion"
      :eliminando="eliminando"
      :error="errorEliminar"
      @update:model-value="onCambioVisibilidadEliminar"
      @confirmar="confirmarEliminarInvitacion"
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
import invitacionService from "../../services/invitacionService.js";
import { cargarResumenInvitaciones } from "../../services/invitacionState.js";
import { idPerfilActivo, refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  DIRECCIONES_INVITACION,
  ORDEN_FECHA_INVITACION,
  TAMANO_PAGINA_INVITACIONES,
  TIPOS_ERROR_ELIMINAR_INVITACION,
  TIPOS_ERROR_INVITACIONES,
  clasificarErrorEliminarInvitacion,
  clasificarErrorInvitaciones,
  construirParamsInvitaciones,
  normalizarInvitacionBusqueda,
  ordenarInvitacionesPorFecha,
  validarRangoFechasInvitaciones,
} from "../../utils/invitacionBusquedaConstants.js";
import { TIPOS_INVITACION } from "../../utils/invitacionConstants.js";

const FILTROS_INICIALES = {
  nombreProyecto: "",
  fechaDesde: "",
  fechaHasta: "",
  nombrePerfil: "",
  estado: "",
  tipo: "",
};

let controlador = null;
let controladorEliminar = null;

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
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      DIRECCIONES_INVITACION,
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
      idCarga: 0,
    };
  },
  computed: {
    idPerfilActivo() {
      return idPerfilActivo();
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
        !!this.filtros.estado ||
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
      ];
    },
    textoResumen() {
      const total = this.paginacion.totalElementos;
      const palabra = total === 1 ? "invitación" : "invitaciones";
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
      if (this.tabActual === DIRECCIONES_INVITACION.RECIBIDA) {
        return "Todavía no tenés invitaciones recibidas.";
      }
      if (this.tabActual === DIRECCIONES_INVITACION.ENVIADA) {
        return "Todavía no tenés invitaciones enviadas.";
      }
      return "Todavía no tenés invitaciones.";
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.buscar(0);
    cargarResumenInvitaciones(this.idPerfilActivo);
  },
  beforeUnmount() {
    this.abortar();
    if (controladorEliminar) controladorEliminar.abort();
  },
  methods: {
    cambiarTab(direccion) {
      if (this.tabActual === direccion) return;
      this.tabActual = direccion;
      this.buscar(0);
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
      return construirParamsInvitaciones(
        { ...this.filtros, direccion: this.tabActual },
        { todos: true }
      );
    },
    paramsConteo(direccion) {
      return construirParamsInvitaciones(
        { ...this.filtros, direccion },
        { pagina: 0, tamano: 1 }
      );
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

      try {
        const [listaResultado, ...conteosResultado] = await Promise.allSettled([
          invitacionService.buscar(this.paramsLista(), signal),
          ...direccionesConteo.map((direccion) =>
            invitacionService.buscar(this.paramsConteo(direccion), signal)
          ),
        ]);

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

        this.aplicarOrdenYPagina(pagina);
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
  gap: 1.4rem;
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
