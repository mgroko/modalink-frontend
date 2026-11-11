<template>
  <div class="solicitudes-colaboracion">
    <div
      class="solicitudes-colaboracion__tabs"
      role="tablist"
      aria-label="Solicitudes de colaboración"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="solicitudes-colaboracion__tab"
        :class="{
          'solicitudes-colaboracion__tab--activa': tab.value === tabActual,
        }"
        role="tab"
        :aria-selected="tab.value === tabActual ? 'true' : 'false'"
        @click="cambiarTab(tab.value)"
      >
        {{ tab.label }}
        <span
          v-if="tab.total != null"
          class="solicitudes-colaboracion__contador"
        >
          {{ tab.total }}
        </span>
      </button>
    </div>

    <FiltrosSolicitudesColaboracion
      :filtros="filtros"
      :publicaciones="publicaciones"
      :cargando-publicaciones="cargandoPublicaciones"
      :cargando="cargando"
      :error-fechas="errorFechas"
      :mostrar-perfil="mostrarFiltroPerfil"
      :etiqueta-perfil="etiquetaFiltroPerfil"
      @cambio="cambiarFiltro"
      @buscar="buscar(0)"
      @limpiar="limpiarFiltros"
    />

    <BaseAlert :message="error" type="error" />

    <div
      v-if="cargando"
      class="solicitudes-colaboracion__estado"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando solicitudes...
    </div>

    <div
      v-else-if="!solicitudes.length"
      class="solicitudes-colaboracion__vacio"
    >
      <span class="material-symbols-outlined" aria-hidden="true">mail</span>
      <p>{{ textoVacio }}</p>
    </div>

    <template v-else>
      <p class="solicitudes-colaboracion__resumen">
        {{ textoResumen }}
      </p>

      <div class="solicitudes-colaboracion__lista">
        <SolicitudColaboracionCard
          v-for="solicitud in solicitudes"
          :key="solicitud.idSolicitudColaboracion"
          :solicitud="solicitud"
          :procesando="
            procesandoId === solicitud.idSolicitudColaboracion
          "
          :accion="accionProcesando"
          @aceptar="aceptar"
          @rechazar="rechazar"
          @ver-publicacion="verPublicacion"
        />
      </div>

      <PaginacionResultados
        :paginacion="paginacion"
        @cambiar="cambiarPagina"
      />
    </template>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import FiltrosSolicitudesColaboracion from "./FiltrosSolicitudesColaboracion.vue";
import SolicitudColaboracionCard from "./SolicitudColaboracionCard.vue";
import solicitudColaboracionService from "../../services/solicitudColaboracionService";
import { cargarResumenSolicitudesColaboracion } from "../../services/solicitudColaboracionState";
import {
  DIRECCIONES_SOLICITUD_COLABORACION,
  ESTADOS_SOLICITUD_COLABORACION,
  TAMANO_PAGINA_SOLICITUDES,
  mensajeErrorSolicitudColaboracion,
  normalizarPaginaSolicitudes,
  normalizarSolicitudColaboracion,
  paginacionSolicitudesInicial,
} from "../../utils/solicitudesColaboracionConstants.js";
import { validarRangoFechas } from "../../utils/parametrosPostulaciones.js";
import { useToast } from "vuestic-ui";

const TAB_TODAS = "todas";
const TAB_RECIBIDAS = "recibidas";
const TAB_ENVIADAS = "enviadas";
const TAB_RECHAZADAS = "rechazadas";

const TABS = [
  { value: TAB_TODAS, label: "Todas" },
  { value: TAB_RECIBIDAS, label: "Recibidas" },
  { value: TAB_ENVIADAS, label: "Enviadas" },
  { value: TAB_RECHAZADAS, label: "Rechazadas" },
];

function filtrosBase() {
  return {
    estado: ESTADOS_SOLICITUD_COLABORACION.PENDIENTE,
    fechaDesde: "",
    fechaHasta: "",
    idPerfil: null,
    idPublicacion: null,
    todosLosEstados: false,
    estadoForzado: false,
  };
}

export default {
  name: "SolicitudesColaboracionPanel",
  components: {
    BaseAlert,
    FiltrosSolicitudesColaboracion,
    PaginacionResultados,
    SolicitudColaboracionCard,
  },
  emits: ["actualizada"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      tabActual: TAB_RECIBIDAS,
      filtros: filtrosBase(),
      publicaciones: [],
      solicitudes: [],
      paginacion: paginacionSolicitudesInicial(),
      cargando: true,
      cargandoPublicaciones: false,
      error: "",
      errorFechas: "",
      controlador: null,
      controladorPublicaciones: null,
      procesandoId: null,
      accionProcesando: "",
      conteos: {
        [TAB_TODAS]: null,
        [TAB_RECIBIDAS]: null,
        [TAB_ENVIADAS]: null,
        [TAB_RECHAZADAS]: null,
      },
    };
  },
  computed: {
    tabs() {
      return TABS.map((tab) => ({
        ...tab,
        total: this.conteos[tab.value],
      }));
    },
    direccionActual() {
      if (this.tabActual === TAB_RECIBIDAS) {
        return DIRECCIONES_SOLICITUD_COLABORACION.RECIBIDA;
      }
      if (this.tabActual === TAB_ENVIADAS) {
        return DIRECCIONES_SOLICITUD_COLABORACION.ENVIADA;
      }
      return null;
    },
    mostrarFiltroPerfil() {
      return this.direccionActual != null;
    },
    etiquetaFiltroPerfil() {
      return this.direccionActual ===
        DIRECCIONES_SOLICITUD_COLABORACION.RECIBIDA
        ? "Perfil remitente"
        : "Perfil destinatario";
    },
    textoVacio() {
      if (this.errorFechas) {
        return "Revisá el rango de fechas para buscar solicitudes.";
      }
      if (this.tabActual === TAB_RECHAZADAS) {
        return "Todavía no tenés solicitudes de colaboración rechazadas.";
      }
      if (this.tabActual === TAB_RECIBIDAS) {
        return "Todavía no tenés solicitudes de colaboración recibidas.";
      }
      if (this.tabActual === TAB_ENVIADAS) {
        return "Todavía no enviaste solicitudes de colaboración.";
      }
      return "Todavía no tenés solicitudes de colaboración.";
    },
    textoResumen() {
      const total = this.paginacion.totalElementos;
      const palabra = total === 1 ? "solicitud" : "solicitudes";
      return `${total} ${palabra} de colaboración`;
    },
  },
  mounted() {
    this.cargarPublicaciones();
    this.buscar(0);
    this.cargarConteos();
  },
  beforeUnmount() {
    this.abortar();
    if (this.controladorPublicaciones) {
      this.controladorPublicaciones.abort();
      this.controladorPublicaciones = null;
    }
  },
  methods: {
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    construirParams(pagina = 0) {
      const params = {
        page: pagina,
        size: TAMANO_PAGINA_SOLICITUDES,
      };
      const direccion = this.direccionActual;
      if (direccion) params.direccion = direccion;

      if (this.tabActual === TAB_RECHAZADAS) {
        params.estado = ESTADOS_SOLICITUD_COLABORACION.RECHAZADA;
      } else if (this.filtros.todosLosEstados) {
        params.todosLosEstados = true;
      } else {
        params.estado =
          this.filtros.estado || ESTADOS_SOLICITUD_COLABORACION.PENDIENTE;
      }

      if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
      if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;
      if (this.filtros.idPublicacion != null) {
        params.idPublicacion = this.filtros.idPublicacion;
      }
      if (this.filtros.idPerfil != null && direccion) {
        if (direccion === DIRECCIONES_SOLICITUD_COLABORACION.RECIBIDA) {
          params.idPerfilEmisor = this.filtros.idPerfil;
        } else {
          params.idPerfilReceptor = this.filtros.idPerfil;
        }
      }

      return params;
    },
    async cargarPublicaciones() {
      if (this.controladorPublicaciones) {
        this.controladorPublicaciones.abort();
      }
      const controller = new AbortController();
      this.controladorPublicaciones = controller;
      this.cargandoPublicaciones = true;

      try {
        const response = await solicitudColaboracionService.listarPublicaciones(
          this.direccionActual,
          controller.signal
        );
        if (this.controladorPublicaciones !== controller) return;

        const lista = Array.isArray(response?.data) ? response.data : [];
        this.publicaciones = lista;

        if (this.filtros.idPublicacion != null) {
          const existe = lista.some(
            (publicacion) =>
              String(publicacion.idPublicacion) ===
              String(this.filtros.idPublicacion)
          );
          if (!existe) {
            this.filtros = { ...this.filtros, idPublicacion: null };
          }
        }
      } catch (error) {
        if (
          this.controladorPublicaciones !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.publicaciones = [];
      } finally {
        if (this.controladorPublicaciones === controller) {
          this.cargandoPublicaciones = false;
          this.controladorPublicaciones = null;
        }
      }
    },
    async cargarConteos() {
      const consultas = [
        solicitudColaboracionService.listar({
          estado: ESTADOS_SOLICITUD_COLABORACION.PENDIENTE,
          size: 1,
        }),
        solicitudColaboracionService.listar({
          direccion: DIRECCIONES_SOLICITUD_COLABORACION.RECIBIDA,
          estado: ESTADOS_SOLICITUD_COLABORACION.PENDIENTE,
          size: 1,
        }),
        solicitudColaboracionService.listar({
          direccion: DIRECCIONES_SOLICITUD_COLABORACION.ENVIADA,
          estado: ESTADOS_SOLICITUD_COLABORACION.PENDIENTE,
          size: 1,
        }),
        solicitudColaboracionService.listar({
          estado: ESTADOS_SOLICITUD_COLABORACION.RECHAZADA,
          size: 1,
        }),
      ];

      const resultados = await Promise.allSettled(consultas);
      const totalDe = (resultado) =>
        resultado.status === "fulfilled"
          ? Number(resultado.value?.data?.totalElementos) || 0
          : 0;

      this.conteos = {
        [TAB_TODAS]: totalDe(resultados[0]),
        [TAB_RECIBIDAS]: totalDe(resultados[1]),
        [TAB_ENVIADAS]: totalDe(resultados[2]),
        [TAB_RECHAZADAS]: totalDe(resultados[3]),
      };
    },
    async buscar(pagina = 0) {
      const errorFechas = validarRangoFechas(
        this.filtros.fechaDesde,
        this.filtros.fechaHasta
      );
      if (errorFechas) {
        this.errorFechas = errorFechas;
        return;
      }
      this.errorFechas = "";

      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;
      this.cargando = true;
      this.error = "";

      try {
        const response = await solicitudColaboracionService.listar(
          this.construirParams(pagina),
          controller.signal
        );
        if (this.controlador !== controller) return;

        const data = response?.data || {};
        const lista = (Array.isArray(data.contenido) ? data.contenido : [])
          .map(normalizarSolicitudColaboracion)
          .filter(Boolean);

        if (!lista.length && pagina > 0) {
          this.cargando = false;
          this.controlador = null;
          await this.buscar(pagina - 1);
          return;
        }

        this.solicitudes = lista;
        this.paginacion = normalizarPaginaSolicitudes(data);
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        if (error?.response?.status === 400) {
          this.errorFechas = mensajeErrorSolicitudColaboracion(
            error,
            "Revisá los filtros ingresados."
          );
        } else {
          this.solicitudes = [];
          this.paginacion = paginacionSolicitudesInicial();
          this.error = mensajeErrorSolicitudColaboracion(
            error,
            "No se pudieron cargar las solicitudes."
          );
        }
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    cambiarTab(tab) {
      if (tab === this.tabActual) return;

      this.tabActual = tab;
      this.solicitudes = [];
      this.filtros = filtrosBase();

      if (tab === TAB_RECHAZADAS) {
        this.filtros.estado = ESTADOS_SOLICITUD_COLABORACION.RECHAZADA;
        this.filtros.estadoForzado = true;
      }

      this.cargarPublicaciones();
      this.buscar(0);
    },
    cambiarFiltro({ campo, valor }) {
      const filtros = { ...this.filtros };

      if (campo === "idPublicacion" || campo === "idPerfil") {
        filtros[campo] = valor == null || valor === "" ? null : valor;
      } else if (campo === "todosLosEstados") {
        filtros.todosLosEstados = !!valor;
        filtros.estado = valor
          ? ""
          : ESTADOS_SOLICITUD_COLABORACION.PENDIENTE;
      } else if (campo === "estado") {
        filtros.estado =
          valor ||
          (filtros.todosLosEstados
            ? ""
            : ESTADOS_SOLICITUD_COLABORACION.PENDIENTE);
      } else {
        filtros[campo] = valor;
      }

      this.filtros = filtros;
      this.errorFechas = "";
    },
    limpiarFiltros() {
      this.filtros = filtrosBase();
      if (this.tabActual === TAB_RECHAZADAS) {
        this.filtros.estado = ESTADOS_SOLICITUD_COLABORACION.RECHAZADA;
        this.filtros.estadoForzado = true;
      }
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
    },
    verPublicacion(solicitud) {
      const idPublicacion = solicitud?.publicacion?.idPublicacion;
      if (idPublicacion == null) return;
      this.$router.push({
        name: "publicacion-detalle",
        params: { idPublicacion },
      });
    },
    async aceptar(solicitud) {
      await this.gestionar(solicitud, "aceptar");
    },
    async rechazar(solicitud) {
      await this.gestionar(solicitud, "rechazar");
    },
    async gestionar(solicitud, accion) {
      if (this.procesandoId != null) return;

      const mensaje =
        accion === "aceptar"
          ? "¿Aceptar esta solicitud y agregar al perfil como colaborador?"
          : "¿Rechazar esta solicitud de colaboración?";
      if (!window.confirm(mensaje)) return;

      this.error = "";
      this.procesandoId = solicitud.idSolicitudColaboracion;
      this.accionProcesando = accion;

      try {
        if (accion === "aceptar") {
          await solicitudColaboracionService.aceptar(
            solicitud.idSolicitudColaboracion
          );
        } else {
          await solicitudColaboracionService.rechazar(
            solicitud.idSolicitudColaboracion
          );
        }

        this.toast.init({
          title:
            accion === "aceptar"
              ? "Solicitud aceptada"
              : "Solicitud rechazada",
          message:
            accion === "aceptar"
              ? "El perfil ya forma parte de los colaboradores."
              : "La solicitud fue rechazada.",
          color: accion === "aceptar" ? "success" : "warning",
          position: "top-right",
          duration: 5000,
        });

        await Promise.all([
          this.buscar(this.paginacion.paginaActual),
          this.cargarConteos(),
        ]);
        cargarResumenSolicitudesColaboracion();
        this.$emit("actualizada");
      } catch (error) {
        if (error?.response?.status === 409) {
          await Promise.all([
            this.buscar(this.paginacion.paginaActual),
            this.cargarConteos(),
          ]);
        }
        this.error = mensajeErrorSolicitudColaboracion(
          error,
          "No se pudo gestionar la solicitud."
        );
      } finally {
        this.procesandoId = null;
        this.accionProcesando = "";
      }
    },
  },
};
</script>

<style scoped>
.solicitudes-colaboracion {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.solicitudes-colaboracion__tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.solicitudes-colaboracion__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.75rem;
  color: var(--color-text-muted);
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
}

.solicitudes-colaboracion__tab--activa {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.solicitudes-colaboracion__contador {
  display: inline-flex;
  min-width: 1.15rem;
  height: 1.15rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.65rem;
}

.solicitudes-colaboracion__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.solicitudes-colaboracion__lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.solicitudes-colaboracion__estado,
.solicitudes-colaboracion__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.solicitudes-colaboracion__vacio .material-symbols-outlined {
  font-size: 2rem;
}
</style>
