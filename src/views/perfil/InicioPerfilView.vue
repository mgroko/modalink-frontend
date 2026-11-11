<template>
  <div class="inicio-perfil">
    <div v-if="mensajeExito" class="inicio-perfil__exito">
      <BaseAlert :message="mensajeExito" type="success" />
      <VaButton
        v-if="ultimaConexionId"
        preset="secondary"
        size="small"
        icon="mso-open_in_new"
        @click="irAConexionCreada"
      >
        Ver conexión
      </VaButton>
    </div>
    <div v-if="mensajeError" class="inicio-perfil__error">
      <BaseAlert :message="mensajeError" type="error" />
      <VaButton
        v-if="errorCarga"
        size="small"
        preset="secondary"
        icon="mso-refresh"
        @click="cargarDatos"
      >
        Reintentar
      </VaButton>
    </div>

    <SkeletonPerfil v-if="cargando" />

    <div v-else-if="noEncontrado" class="inicio-perfil__estado">
      <span class="material-symbols-outlined inicio-perfil__estado-icono">person_off</span>
      {{ mensajeNoEncontrado || "El perfil que buscas no está disponible o ha sido dado de baja." }}
      <VaButton preset="secondary" @click="$router.push({ name: 'buscar' })">
        Volver a la búsqueda
      </VaButton>
    </div>

    <div v-else-if="!perfil" class="inicio-perfil__estado">
      <span class="material-symbols-outlined inicio-perfil__estado-icono">person_off</span>
      No se encontró el perfil activo.
      <VaButton preset="secondary" @click="$router.push({ name: 'dashboard-usuario' })">
        Volver al dashboard
      </VaButton>
    </div>

    <template v-else>
      <VaAlert
        v-if="esPropio && perfil.estado === 'PendienteBaja'"
        color="warning"
        class="inicio-perfil__alerta-baja"
        icon="mso-warning"
      >
        <div class="inicio-perfil__alerta-baja-contenido">
          <span>{{ mensajeBaja }}</span>
          <VaButton
            size="small"
            color="success"
            :loading="reactivando"
            @click="reactivarPerfil"
          >
            Reactivar perfil
          </VaButton>
        </div>
      </VaAlert>

      <VaAlert
        v-if="esPropio && perfil.estado === 'Deshabilitado'"
        color="danger"
        class="inicio-perfil__alerta-baja"
        icon="mso-lock"
      >
        Tu perfil está deshabilitado. Podés verlo y editarlo, pero no será visible para la
        comunidad.
      </VaAlert>

      <div class="inicio-perfil__hero-cabecera">
        <PerfilHero
          :perfil="perfil"
          :es-propio="esPropio"
          @editar="irAEditar"
        />
      </div>

      <div class="inicio-perfil__layout">
        <div class="inicio-perfil__contenido">
          <!-- Sección: Calendario -->
          <template v-if="seccion === 'calendario'">
            <section class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Calendario profesional</h2>
              <div v-if="esPropio" class="inicio-perfil__calendario-wrap">
                <CalendarioProfesional mostrar-acciones @actualizado="refrescarEventos" />
              </div>
              <div v-else class="inicio-perfil__calendario-wrap">
                <CalendarioProfesional
                  :id-usuario="perfil.idUsuario || perfil.idPerfil"
                  solo-lectura
                />
              </div>
            </section>
          </template>

          <!-- Sección: Reseñas -->
          <template v-else-if="seccion === 'resenas'">
            <ResenaDetallePanel
              v-if="idResena != null"
              :id-perfil="perfil.idPerfil"
              :id-calificacion="idResena"
              @volver-listado="volverAlListadoResenas"
              @ver-perfil-autor="irAlPerfilAutor"
            />
            <ResenasListaPanel
              v-else
              :id-perfil="perfil.idPerfil"
              :nombre-perfil="perfil.nombreArtistico"
              :es-propio="esPropio"
              @ver-resena="abrirResena"
              @ver-perfil-autor="irAlPerfilAutor"
              @volver-perfil="volverAlPerfil"
            />
          </template>

          <!-- Sección: Términos y condiciones -->
          <TerminosCondicionesPanel
            v-else-if="seccion === 'terminos'"
            :terminos="terminos"
            :cargando="cargandoTerminos"
            :error="errorTerminos"
            :es-propio="esPropio"
            :puede-configurar="puedeConfigurarTerminos"
            @reintentar="cargarTerminos"
            @configurar="irAConfigurarTerminos"
          />

          <!-- Sección: Publicaciones -->
          <template v-else-if="seccion === 'publicaciones'">
            <section ref="publicacionesRef" class="inicio-perfil__panel">
              <div class="inicio-perfil__panel-header">
                <h2 class="inicio-perfil__panel-titulo">Publicaciones</h2>
                <VaButton
                  v-if="esPropio"
                  color="success"
                  size="small"
                  icon="mso-add"
                  @click="nuevaPublicacion"
                >
                  Nueva publicación
                </VaButton>
              </div>

              <FiltrosPublicaciones
                v-if="perfil"
                :filtros="filtrosPublicaciones"
                :proyectos="proyectosFiltroPublicaciones"
                :cargando-proyectos="cargandoProyectosPublicaciones"
                :error-proyectos="errorProyectosPublicaciones"
                :error-fechas="errorFechasPublicaciones"
                :hay-filtros="hayFiltrosPublicaciones"
                @cambio="cambiarFiltroPublicacion"
                @buscar="buscarPublicaciones"
                @limpiar="limpiarFiltrosPublicaciones"
              />

              <div
                v-if="cargandoPublicaciones"
                class="inicio-perfil__estado-publicaciones"
                role="status"
                aria-live="polite"
              >
                <span class="inicio-perfil__spinner" aria-hidden="true"></span>
                Cargando publicaciones...
              </div>

              <div
                v-else-if="errorPublicaciones"
                class="inicio-perfil__estado-publicaciones"
              >
                <p class="inicio-perfil__estado-publicaciones-texto">
                  {{ errorPublicaciones }}
                </p>
                <VaButton preset="secondary" icon="mso-refresh" @click="cargarPublicaciones()">
                  Reintentar
                </VaButton>
              </div>

              <p v-else-if="!publicaciones.length" class="inicio-perfil__vacio">
                {{ textoVacioPublicaciones }}
              </p>

              <div v-else class="inicio-perfil__publicaciones-lista">
                <PublicacionCardGaleria
                  v-for="publicacion in publicaciones"
                  :key="publicacion.idPublicacion"
                  :publicacion="publicacion"
                  :mostrar-acciones-baja="esPropio"
                  @eliminar="abrirEliminarPublicacion"
                />
              </div>

              <PaginacionResultados
                v-if="!cargandoPublicaciones && !errorPublicaciones && publicaciones.length"
                :paginacion="paginacionPublicaciones"
                @cambiar="cambiarPaginaPublicaciones"
              />
            </section>
          </template>

          <!-- Sección: Proyectos (historial completo) -->
          <template v-else-if="seccion === 'proyectos'">
            <section ref="historialRef" class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Historial de proyectos</h2>

              <HistorialProyectosLista
                :proyectos="historialProyectos"
                :cargando="cargandoHistorial"
                :error="errorHistorial"
                @abrir="abrirProyectoHistorial"
                @reintentar="cargarHistorialProyectos()"
              />

              <PaginacionResultados
                v-if="!cargandoHistorial && !errorHistorial && historialProyectos.length"
                :paginacion="paginacionHistorial"
                @cambiar="cambiarPaginaHistorial"
              />
            </section>
          </template>

          <!-- Sección: Perfil (default) -->
          <template v-else>
            <PolaroidsPerfilPanel
              v-if="mostrarPolaroids"
              :id-perfil="perfil.idPerfil"
              :es-propio="esPropio"
              :puede-gestionar="puedeGestionarPolaroids"
            />

            <section v-if="habilidades.length" class="inicio-perfil__panel">
              <h2 class="inicio-perfil__panel-titulo">Habilidades</h2>
              <div class="inicio-perfil__habilidades">
                <span
                  v-for="habilidad in habilidades"
                  :key="habilidad"
                  class="inicio-perfil__habilidad"
                >
                  {{ habilidad }}
                </span>
              </div>
            </section>

            <section class="inicio-perfil__panel">
              <div class="inicio-perfil__panel-header">
                <h2 class="inicio-perfil__panel-titulo">Publicaciones</h2>
              </div>

              <div
                v-if="cargandoPublicacionesPerfil"
                class="inicio-perfil__estado-publicaciones"
                role="status"
                aria-live="polite"
              >
                <span class="inicio-perfil__spinner" aria-hidden="true"></span>
                Cargando publicaciones...
              </div>

              <div
                v-else-if="errorPublicacionesPerfil"
                class="inicio-perfil__estado-publicaciones"
              >
                <p class="inicio-perfil__estado-publicaciones-texto">
                  {{ errorPublicacionesPerfil }}
                </p>
                <VaButton preset="secondary" icon="mso-refresh" @click="cargarPublicacionesPerfil()">
                  Reintentar
                </VaButton>
              </div>

              <p v-else-if="!publicacionesPerfil.length" class="inicio-perfil__vacio">
                Todavía no hay publicaciones.
              </p>

              <template v-else>
                <div class="inicio-perfil__publicaciones-lista">
                  <PublicacionCard
                    v-for="publicacion in publicacionesPerfil"
                    :key="publicacion.idPublicacion"
                    :publicacion="publicacion"
                    :mostrar-acciones-baja="esPropio"
                    @abrir-galeria="abrirGaleriaPublicacion"
                    @ver-proyecto="irAProyectoPublicacion"
                    @editar="editarPublicacion"
                    @invitar="abrirInvitarColaborador"
                    @eliminar="abrirEliminarPublicacion"
                  />
                </div>

                <div class="inicio-perfil__publicaciones-mas">
                  <VaButton
                    preset="secondary"
                    icon-right="mso-arrow_forward"
                    @click="irAPublicaciones"
                  >
                    Ver más
                  </VaButton>
                </div>
              </template>
            </section>

            <section class="inicio-perfil__panel">
              <div class="inicio-perfil__panel-header">
                <h2 class="inicio-perfil__panel-titulo">Historial de proyectos</h2>
                <VaButton
                  v-if="historialPreviewTotal > 0"
                  preset="secondary"
                  size="small"
                  icon-right="mso-arrow_forward"
                  @click="cambiarSeccion('proyectos')"
                >
                  Ver más
                </VaButton>
              </div>

              <HistorialProyectosLista
                :proyectos="historialPreview"
                :cargando="cargandoHistorialPreview"
                :error="errorHistorialPreview"
                @abrir="abrirProyectoHistorial"
                @reintentar="cargarHistorialPreview()"
              />
            </section>
          </template>
        </div>

        <aside class="inicio-perfil__sidebar">
          <template v-if="esPropio">
            <CaracteristicasTecnicasCard
              v-if="mostrarCaracteristicas"
              :caracteristicas="caracteristicas"
            />
            <ProximosEventos ref="proximosEventos" />
            <PerfilSidebarNav
              es-propio
              :seccion-activa="seccion"
              @cambiar-seccion="cambiarSeccion"
              @navegar-ruta="navegarRuta"
              @funcionalidad-no-disponible="noDisponible($event)"
              @cerrar-sesion="cerrarSesion"
            />
          </template>
          <template v-else>
            <CaracteristicasTecnicasCard
              v-if="mostrarCaracteristicas"
              :caracteristicas="caracteristicas"
            />
            <PerfilAccionesPublico
              :estado-conexion="estadoConexion"
              :mostrar-conexion="mostrarConexion"
              :cargando-conexion="enviandoConexion"
              :mostrar-cancelar="mostrarCancelarConexion"
              :cancelando-conexion="cancelandoConexion"
              :procesando-conexion="procesandoConexion"
              :accion-procesando-conexion="accionProcesandoConexion"
              @conectar="abrirModalConexion"
              @cancelar="abrirModalCancelarConexion"
              @aceptar="abrirGestionConexion('aceptar')"
              @rechazar="abrirGestionConexion('rechazar')"
              @eliminar="abrirEliminarConexion"
              @mensaje="abrirMensaje"
            />
            <PerfilSidebarNav
              :es-propio="false"
              :seccion-activa="seccion"
              @cambiar-seccion="cambiarSeccion"
              @navegar-ruta="navegarRuta"
              @funcionalidad-no-disponible="noDisponible($event)"
            />
            <ResenasCard
              :resumen="resenasResumen"
              :resenas="resenasDestacadas"
              :cargando="cargandoResenas"
              :error="errorResenas"
              @ver-todas="verTodasLasResenas"
              @ver-resena="abrirResena"
              @ver-perfil-autor="irAlPerfilAutor"
              @reintentar="cargarResenasDestacadas"
            />
            <VaButton
              v-if="!esAdministrador"
              color="danger"
              size="small"
              block
              icon="mso-flag"
              @click="modalReporte = true"
            >
              Reportar perfil
            </VaButton>
          </template>
        </aside>
      </div>

      <ReportarPerfilModal
        v-model="modalReporte"
        :perfil="perfil"
        @reportado="alReportar"
      />

      <ModalEnviarSolicitudConexion
        :model-value="modalConexion"
        :perfil="perfil"
        :nombre-remitente="nombreRemitente"
        :enviando="enviandoConexion"
        :error="errorConexion"
        @update:model-value="alCambiarModalConexion"
        @confirmar="enviarSolicitudConexion"
      />

      <ModalCancelarSolicitudConexion
        :model-value="modalCancelarConexion"
        :perfil="perfil"
        :cancelando="cancelandoConexion"
        :error="errorCancelarConexion"
        @update:model-value="alCambiarModalCancelarConexion"
        @confirmar="cancelarSolicitudConexion"
      />

      <ModalGestionSolicitudConexion
        :model-value="modalGestionConexion"
        :perfil="perfil"
        :modo="modoGestionConexion"
        :procesando="procesandoConexion"
        :error="errorGestionConexion"
        @update:model-value="alCambiarModalGestionConexion"
        @confirmar="confirmarGestionConexion"
      />

      <ModalEliminarConexion
        :model-value="modalEliminarConexion"
        :perfil="perfil"
        :eliminando="eliminandoConexion"
        :error="errorEliminarConexion"
        @update:model-value="alCambiarModalEliminarConexion"
        @confirmar="confirmarEliminarConexion"
      />

      <ModalNuevaPublicacion
        v-model="modalEditarPublicacionVisible"
        modo="editar"
        :publicacion="publicacionEditando"
        @actualizada="alActualizarPublicacion"
      />

      <ModalInvitarColaborador
        v-model="modalInvitarColaboradorVisible"
        :publicacion="publicacionInvitar"
        @enviada="alEnviarInvitacion"
      />

      <ModalEliminarPublicacion
        v-model="modalEliminarPublicacionVisible"
        :publicacion="publicacionEliminar"
        :modo="modoEliminarPublicacion"
        :eliminando="eliminandoPublicacion"
        :error="errorEliminarPublicacion"
        @confirmar="confirmarEliminarPublicacion"
      />

      <GaleriaPublicacionModal
        v-model="modalGaleriaPublicacionVisible"
        :imagenes="imagenesGaleria"
        :titulo="tituloGaleria"
      />

      <ModalNuevaPublicacion
        v-model="modalNuevaPublicacionVisible"
        @creada="alCrearPublicacion"
      />
    </template>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import publicacionService from "../../services/publicacionService";
import proyectoService from "../../services/proyectoService";
import authService from "../../services/authService";
import calificacionPerfilService from "../../services/calificacionPerfilService";
import solicitudConexionService from "../../services/solicitudConexionService";
import conexionService from "../../services/conexionService";
import { cargarResumenPerfil } from "../../services/notificacionState";
import { cargarConteosSolicitudesConexion } from "../../services/solicitudConexionState";
import PaginacionResultados from "../../components/busqueda/PaginacionResultados.vue";
import FiltrosPublicaciones from "../../components/perfil/FiltrosPublicaciones.vue";
import PublicacionCard from "../../components/perfil/PublicacionCard.vue";
import PublicacionCardGaleria from "../../components/perfil/PublicacionCardGaleria.vue";
import GaleriaPublicacionModal from "../../components/perfil/GaleriaPublicacionModal.vue";
import ModalNuevaPublicacion from "../../components/perfil/ModalNuevaPublicacion.vue";
import ModalInvitarColaborador from "../../components/perfil/ModalInvitarColaborador.vue";
import ModalEliminarPublicacion from "../../components/perfil/ModalEliminarPublicacion.vue";
import {
  esAdmin,
  idPerfilActivo,
  limpiarSesion,
  state as authState,
} from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import CalendarioProfesional from "../../components/calendario/CalendarioProfesional.vue";
import CaracteristicasTecnicasCard from "../../components/perfil/CaracteristicasTecnicasCard.vue";
import HistorialProyectosLista from "../../components/perfil/HistorialProyectosLista.vue";
import PerfilAccionesPublico from "../../components/perfil/PerfilAccionesPublico.vue";
import PerfilHero from "../../components/perfil/PerfilHero.vue";
import PolaroidsPerfilPanel from "../../components/perfil/PolaroidsPerfilPanel.vue";
import PerfilSidebarNav from "../../components/perfil/PerfilSidebarNav.vue";
import ProximosEventos from "../../components/perfil/ProximosEventos.vue";
import ResenaDetallePanel from "../../components/perfil/ResenaDetallePanel.vue";
import ResenasCard from "../../components/perfil/ResenasCard.vue";
import ResenasListaPanel from "../../components/perfil/ResenasListaPanel.vue";
import ReportarPerfilModal from "../../components/perfil/ReportarPerfilModal.vue";
import ModalEnviarSolicitudConexion from "../../components/perfil/ModalEnviarSolicitudConexion.vue";
import ModalCancelarSolicitudConexion from "../../components/perfil/ModalCancelarSolicitudConexion.vue";
import ModalGestionSolicitudConexion from "../../components/conexion/ModalGestionSolicitudConexion.vue";
import ModalEliminarConexion from "../../components/conexion/ModalEliminarConexion.vue";
import SkeletonPerfil from "../../components/perfil/SkeletonPerfil.vue";
import TerminosCondicionesPanel from "../../components/perfil/TerminosCondicionesPanel.vue";
import { diasRestantes, fechaExpiracionBaja, formatearFecha } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  CODIGOS_ERROR_CONEXION,
  ESTADOS_CONEXION,
  mensajeErrorCancelacionConexion,
  mensajeErrorConexion,
  mensajeErrorGestionSolicitudConexion,
  normalizarEstadoConexion,
} from "../../utils/conexionConstants.js";
import {
  CODIGOS_ERROR_CONEXIONES,
  mensajeErrorEliminarConexion,
} from "../../utils/conexionesConstants.js";
import { normalizarResena, normalizarResumen } from "../../utils/resenasConstants";
import { normalizarTerminos } from "../../utils/terminosCondiciones.js";
import { mostrarNoDisponible } from "../../utils/noDisponible.js";
import {
  accionBajaPublicacion,
  construirQueryPublicaciones,
  filtrosPublicacionVacios,
  firmarFiltrosPublicacion,
  hayFiltrosPublicacion,
  leerFiltrosPublicacionQuery,
  normalizarProyectoFiltro,
  normalizarPublicacion,
} from "../../utils/publicacionConstants.js";
import {
  esPerfilActivo,
  esPerfilModelo,
} from "../../utils/polaroidConstants.js";
import { validarRangoFechas } from "../../utils/parametrosPostulaciones.js";
import { useToast } from "vuestic-ui";

const SECCIONES_NO_DISPONIBLES = {
  participaciones: "Participaciones",
};

const PUBLICACIONES_PERFIL_PREVIEW = 2;
const HISTORIAL_PREVIEW_SIZE = 3;
const HISTORIAL_PAGE_SIZE = 10;
const PUBLICACIONES_PAGE_SIZE = 10;
const PUBLICACIONES_TEXTO_QUERY_SIZE = 50;
const PUBLICACIONES_TEXTO_MAX_PAGINAS = 20;
const DEBOUNCE_FILTROS_PUBLICACIONES = 400;

export default {
  name: "InicioPerfilView",
  components: {
    BaseAlert,
    CalendarioProfesional,
    CaracteristicasTecnicasCard,
    FiltrosPublicaciones,
    GaleriaPublicacionModal,
    HistorialProyectosLista,
    ModalEliminarPublicacion,
    ModalInvitarColaborador,
    ModalNuevaPublicacion,
    PaginacionResultados,
    PerfilAccionesPublico,
    PerfilHero,
    PerfilSidebarNav,
    PolaroidsPerfilPanel,
    ProximosEventos,
    PublicacionCard,
    PublicacionCardGaleria,
    ReportarPerfilModal,
    ModalEnviarSolicitudConexion,
    ModalCancelarSolicitudConexion,
    ModalGestionSolicitudConexion,
    ModalEliminarConexion,
    ResenaDetallePanel,
    ResenasCard,
    ResenasListaPanel,
    SkeletonPerfil,
    TerminosCondicionesPanel,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      perfil: null,
      publicaciones: [],
      publicacionesPerfil: [],
      cargandoPublicacionesPerfil: false,
      errorPublicacionesPerfil: "",
      controladorPublicacionesPerfil: null,
      historialPreview: [],
      historialPreviewTotal: 0,
      cargandoHistorialPreview: false,
      errorHistorialPreview: "",
      controladorHistorialPreview: null,
      historialProyectos: [],
      paginacionHistorial: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      cargandoHistorial: false,
      errorHistorial: "",
      controladorHistorial: null,
      filtrosPublicaciones: filtrosPublicacionVacios(),
      proyectosFiltroPublicaciones: [],
      cargandoProyectosPublicaciones: false,
      errorProyectosPublicaciones: "",
      cargandoPublicaciones: false,
      errorPublicaciones: "",
      errorFechasPublicaciones: "",
      paginacionPublicaciones: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      controladorPublicaciones: null,
      controladorProyectosPublicaciones: null,
      temporalizadorFiltrosPublicaciones: null,
      sincronizandoQueryPublicaciones: false,
      modalNuevaPublicacionVisible: false,
      modalEditarPublicacionVisible: false,
      publicacionEditando: null,
      modalInvitarColaboradorVisible: false,
      publicacionInvitar: null,
      modalEliminarPublicacionVisible: false,
      publicacionEliminar: null,
      modoEliminarPublicacion: "",
      eliminandoPublicacion: false,
      errorEliminarPublicacion: "",
      modalGaleriaPublicacionVisible: false,
      imagenesGaleria: [],
      tituloGaleria: "",
      resenasResumen: null,
      resenasDestacadas: [],
      cargandoResenas: false,
      errorResenas: "",
      controladorResenas: null,
      cargando: true,
      noEncontrado: false,
      mensajeNoEncontrado: "",
      errorCarga: false,
      mensajeExito: "",
      modalReporte: false,
      modalConexion: false,
      enviandoConexion: false,
      errorConexion: "",
      modalCancelarConexion: false,
      cancelandoConexion: false,
      errorCancelarConexion: "",
      modalGestionConexion: false,
      modoGestionConexion: "aceptar",
      procesandoConexion: false,
      accionProcesandoConexion: "",
      errorGestionConexion: "",
      modalEliminarConexion: false,
      eliminandoConexion: false,
      errorEliminarConexion: "",
      ultimaConexionId: null,
      reactivando: false,
      mensajeError: "",
      contadorBaja: { expiracion: null, restante: null },
      intervaloContador: null,
      terminos: null,
      terminosCargados: false,
      cargandoTerminos: false,
      errorTerminos: "",
    };
  },
  computed: {
    idResena() {
      const id = this.$route.params.idCalificacion;
      if (id == null || id === "") return null;
      const numero = Number(id);
      return Number.isFinite(numero) ? numero : null;
    },
    seccion() {
      if (this.idResena != null) return "resenas";

      const seccionRuta = this.$route.params.seccion;
      const validas = [
        "perfil",
        "publicaciones",
        "proyectos",
        "calendario",
        "resenas",
        "terminos",
      ];
      return validas.includes(seccionRuta) ? seccionRuta : "perfil";
    },
    hayFiltrosPublicaciones() {
      return hayFiltrosPublicacion(this.filtrosPublicaciones);
    },
    textoVacioPublicaciones() {
      return this.hayFiltrosPublicaciones
        ? "No se encontraron publicaciones con esos filtros."
        : "Todavía no hay publicaciones.";
    },
    puedeConfigurarTerminos() {
      return (
        this.esPropio &&
        this.perfil?.idPerfil != null &&
        this.perfil.idPerfil === idPerfilActivo() &&
        this.perfil?.estado === "Activo"
      );
    },
    esPropio() {
      if (this.perfil?.esPropietario != null) return this.perfil.esPropietario === true;
      return this.perfil?.idPerfil != null && this.perfil.idPerfil === idPerfilActivo();
    },
    esModelo() {
      return esPerfilModelo(this.perfil);
    },
    perfilActivo() {
      return esPerfilActivo(this.perfil);
    },
    mostrarPolaroids() {
      return this.esModelo && this.perfilActivo;
    },
    mostrarCaracteristicas() {
      return this.caracteristicas.length > 0 && this.perfilActivo;
    },
    puedeGestionarPolaroids() {
      return this.esPropio && this.perfilActivo;
    },
    esAdministrador() {
      return esAdmin();
    },
    estadoConexion() {
      return normalizarEstadoConexion(this.perfil?.estadoConexion);
    },
    mostrarConexion() {
      return (
        !this.esPropio &&
        (this.estadoConexion !== ESTADOS_CONEXION.NINGUNA ||
          this.perfil?.estado === "Activo")
      );
    },
    mostrarCancelarConexion() {
      return (
        !this.esPropio &&
        this.estadoConexion === ESTADOS_CONEXION.SOLICITUD_ENVIADA &&
        this.perfil?.idSolicitudConexion != null
      );
    },
    nombreRemitente() {
      return authState.usuario?.nombreArtisticoActivo || "tu perfil activo";
    },
    mensajeBaja() {
      const { expiracion, restante } = this.contadorBaja;
      const base = "Este perfil tiene una solicitud de baja pendiente.";
      if (!expiracion) {
        return `${base} Podés reactivarlo mientras el plazo esté vigente.`;
      }
      const plazo =
        restante == null
          ? "El plazo venció: el perfil quedará en estado Baja."
          : restante === 1
            ? "Queda 1 día para reactivarlo."
            : `Quedan ${restante} días para reactivarlo.`;
      return `${base} El ${expiracion} pasará al estado Baja y quedará inaccesible para la comunidad. ${plazo}`;
    },
    habilidades() {
      const lista = Array.isArray(this.perfil?.habilidades) ? this.perfil.habilidades : [];
      return lista.filter(Boolean).slice().sort((a, b) => String(a).localeCompare(String(b), "es"));
    },
    caracteristicas() {
      return this.perfil?.caracteristicas || [];
    },
  },
  async mounted() {
    this.avisarSeccionNoDisponible();
    await this.cargarDatos();
    this.intervaloContador = setInterval(() => this.actualizarContadorBaja(), 60 * 60 * 1000);
  },
  beforeUnmount() {
    if (this.intervaloContador) clearInterval(this.intervaloContador);
    if (this.temporalizadorFiltrosPublicaciones) {
      clearTimeout(this.temporalizadorFiltrosPublicaciones);
    }
    this.abortarTerminos();
    this.abortarResenasDestacadas();
    this.abortarPublicaciones();
    this.abortarProyectosPublicaciones();
    this.abortarPublicacionesPerfil();
    this.abortarHistorialPreview();
    this.abortarHistorialProyectos();
  },
  watch: {
    "$route.params.id"() {
      this.resetearTerminos();
      this.cargarDatos();
    },
    "$route.params.seccion"() {
      window.scrollTo({ top: 0, behavior: "smooth" });
      this.avisarSeccionNoDisponible();
      if (this.seccion === "terminos") this.cargarTerminos();
      if (this.seccion === "proyectos") this.cargarHistorialProyectos();
    },
    "$route.params.idCalificacion"() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    "$route.query"() {
      this.sincronizarPublicacionesDesdeRuta();
    },
  },
  methods: {
    async cargarDatos() {
      this.cargando = true;
      this.mensajeError = "";
      this.mensajeExito = "";
      this.modalConexion = false;
      this.errorConexion = "";
      this.modalCancelarConexion = false;
      this.errorCancelarConexion = "";
      this.modalGestionConexion = false;
      this.errorGestionConexion = "";
      this.modalEliminarConexion = false;
      this.errorEliminarConexion = "";
      this.ultimaConexionId = null;
      this.noEncontrado = false;
      this.mensajeNoEncontrado = "";
      this.errorCarga = false;
      this.resetearTerminos();
      this.abortarResenasDestacadas();
      this.abortarPublicaciones();
      this.abortarProyectosPublicaciones();
      this.abortarPublicacionesPerfil();
      this.abortarHistorialPreview();
      this.abortarHistorialProyectos();
      this.publicaciones = [];
      this.publicacionesPerfil = [];
      this.cargandoPublicacionesPerfil = false;
      this.errorPublicacionesPerfil = "";
      this.historialPreview = [];
      this.historialPreviewTotal = 0;
      this.cargandoHistorialPreview = false;
      this.errorHistorialPreview = "";
      this.historialProyectos = [];
      this.paginacionHistorial = {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      };
      this.cargandoHistorial = false;
      this.errorHistorial = "";
      this.cargandoPublicaciones = false;
      this.errorPublicaciones = "";
      this.errorFechasPublicaciones = "";
      this.cargandoProyectosPublicaciones = false;
      this.errorProyectosPublicaciones = "";
      this.proyectosFiltroPublicaciones = [];
      this.paginacionPublicaciones = {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      };
      this.resenasResumen = null;
      this.resenasDestacadas = [];
      this.cargandoResenas = false;
      this.errorResenas = "";

      const idDeRuta = this.$route.params.id;
      const id = idDeRuta != null ? Number(idDeRuta) : idPerfilActivo();
      if (id == null || Number.isNaN(id)) {
        this.cargando = false;
        this.perfil = null;
        return;
      }

      try {
        const perfilRes = await perfilService.obtener(id);

        this.perfil = perfilRes?.data || null;
        if (!this.perfil) {
          this.noEncontrado = true;
          return;
        }
        this.actualizarContadorBaja();
        this.aplicarTerminosPerfil();

        // La tarjeta lateral de reseñas solo se muestra en perfiles ajenos.
        // Es best-effort: un fallo no debe romper la carga del perfil.
        if (!this.esPropio) {
          this.cargarResenasDestacadas();
        }

        // Contrato UC-23: GET /perfiles/{id} siempre incluye
        // terminosCondiciones. El endpoint dedicado queda como respaldo
        // defensivo si la propiedad no viniera en la respuesta.
        if (this.seccion === "terminos" && !this.terminosCargados) {
          await this.cargarTerminos();
        }

        const consultaPublicaciones = leerFiltrosPublicacionQuery(
          this.$route.query
        );
        this.filtrosPublicaciones = consultaPublicaciones.filtros;
        this.paginacionPublicaciones = {
          ...this.paginacionPublicaciones,
          paginaActual: consultaPublicaciones.pagina,
        };
        this.cargarPublicaciones({ pagina: consultaPublicaciones.pagina });
        this.cargarPublicacionesPerfil();
        this.cargarProyectosFiltroPublicaciones();
        this.cargarHistorialPreview();
        if (this.seccion === "proyectos") this.cargarHistorialProyectos();
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          // Spec UC-14 §6: sesión inválida o cuenta inactiva → volver al login
          // conservando la ruta de origen para regresar tras re-autenticarse.
          this.$router.push({ name: "login", query: { redirect: this.$route.fullPath } });
          return;
        }
        if (status === 404) {
          this.noEncontrado = true;
          this.mensajeNoEncontrado =
            error?.response?.data?.message ||
            "El perfil que buscas no está disponible o ha sido dado de baja.";
        } else {
          this.errorCarga = true;
          this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el perfil. Intentá nuevamente.");
        }
      } finally {
        this.cargando = false;
      }
    },
    abortarPublicaciones() {
      if (this.controladorPublicaciones) {
        this.controladorPublicaciones.abort();
        this.controladorPublicaciones = null;
      }
    },
    abortarProyectosPublicaciones() {
      if (this.controladorProyectosPublicaciones) {
        this.controladorProyectosPublicaciones.abort();
        this.controladorProyectosPublicaciones = null;
      }
    },
    abortarPublicacionesPerfil() {
      if (this.controladorPublicacionesPerfil) {
        this.controladorPublicacionesPerfil.abort();
        this.controladorPublicacionesPerfil = null;
      }
    },
    async cargarPublicacionesPerfil() {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarPublicacionesPerfil();
      const controller = new AbortController();
      this.controladorPublicacionesPerfil = controller;
      this.cargandoPublicacionesPerfil = true;
      this.errorPublicacionesPerfil = "";

      try {
        const response = await publicacionService.listarPorPerfil(
          idPerfil,
          { page: 0, size: PUBLICACIONES_PERFIL_PREVIEW },
          controller.signal
        );
        if (this.controladorPublicacionesPerfil !== controller) return;

        const contenido = Array.isArray(response?.data?.contenido)
          ? response.data.contenido
          : [];
        this.publicacionesPerfil = contenido
          .map(normalizarPublicacion)
          .filter(Boolean);
      } catch (error) {
        if (
          this.controladorPublicacionesPerfil !== controller ||
          this.esCancelacion(error)
        ) {
          return;
        }
        this.publicacionesPerfil = [];
        this.errorPublicacionesPerfil = mensajeErrorApi(
          error,
          "No se pudieron cargar las publicaciones."
        );
      } finally {
        if (this.controladorPublicacionesPerfil === controller) {
          this.cargandoPublicacionesPerfil = false;
          this.controladorPublicacionesPerfil = null;
        }
      }
    },
    abortarHistorialPreview() {
      if (this.controladorHistorialPreview) {
        this.controladorHistorialPreview.abort();
        this.controladorHistorialPreview = null;
      }
    },
    abortarHistorialProyectos() {
      if (this.controladorHistorial) {
        this.controladorHistorial.abort();
        this.controladorHistorial = null;
      }
    },
    mensajeErrorHistorial(error) {
      const status = error?.response?.status;
      if (status === 401) return "";
      if (status === 403) {
        return "No tenés permisos para ver el historial de este perfil.";
      }
      if (status === 404) {
        return "El perfil no está disponible o no tenés acceso a su historial.";
      }
      return mensajeErrorApi(
        error,
        "No se pudo cargar el historial de proyectos."
      );
    },
    async cargarHistorialPreview() {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarHistorialPreview();
      const controller = new AbortController();
      this.controladorHistorialPreview = controller;
      this.cargandoHistorialPreview = true;
      this.errorHistorialPreview = "";

      try {
        const response = await proyectoService.historialPerfil(
          idPerfil,
          { page: 0, size: HISTORIAL_PREVIEW_SIZE },
          controller.signal
        );
        if (this.controladorHistorialPreview !== controller) return;

        const data = response?.data || {};
        this.historialPreview = Array.isArray(data.contenido)
          ? data.contenido
          : [];
        this.historialPreviewTotal = Number(data.totalElementos) || 0;
      } catch (error) {
        if (
          this.controladorHistorialPreview !== controller ||
          this.esCancelacion(error)
        ) {
          return;
        }
        this.historialPreview = [];
        this.historialPreviewTotal = 0;
        this.errorHistorialPreview = this.mensajeErrorHistorial(error);
      } finally {
        if (this.controladorHistorialPreview === controller) {
          this.cargandoHistorialPreview = false;
          this.controladorHistorialPreview = null;
        }
      }
    },
    async cargarHistorialProyectos({
      pagina = this.paginacionHistorial.paginaActual || 0,
    } = {}) {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarHistorialProyectos();
      const controller = new AbortController();
      this.controladorHistorial = controller;
      this.cargandoHistorial = true;
      this.errorHistorial = "";

      try {
        const response = await proyectoService.historialPerfil(
          idPerfil,
          { page: pagina, size: HISTORIAL_PAGE_SIZE },
          controller.signal
        );
        if (this.controladorHistorial !== controller) return;

        const data = response?.data || {};
        this.historialProyectos = Array.isArray(data.contenido)
          ? data.contenido
          : [];
        this.paginacionHistorial = {
          paginaActual: Number(data.paginaActual) || 0,
          totalPaginas: Number(data.totalPaginas) || 1,
          totalElementos: Number(data.totalElementos) || 0,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };
      } catch (error) {
        if (this.controladorHistorial !== controller || this.esCancelacion(error)) {
          return;
        }
        this.historialProyectos = [];
        this.errorHistorial = this.mensajeErrorHistorial(error);
      } finally {
        if (this.controladorHistorial === controller) {
          this.cargandoHistorial = false;
          this.controladorHistorial = null;
        }
      }
    },
    cambiarPaginaHistorial(delta) {
      const paginaActual = Number(this.paginacionHistorial.paginaActual) || 0;
      const destino = paginaActual + Number(delta || 0);
      const totalPaginas = Number(this.paginacionHistorial.totalPaginas) || 1;
      if (destino < 0 || destino >= totalPaginas) return;

      this.cargarHistorialProyectos({ pagina: destino });
      this.$nextTick(() => {
        this.$refs.historialRef?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    abrirProyectoHistorial(proyecto) {
      if (proyecto?.puedeVerProyecto !== true || proyecto.idProyecto == null) {
        return;
      }
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: proyecto.idProyecto },
      });
    },
    irAPublicaciones() {
      this.cambiarSeccion("publicaciones");
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async cargarPublicaciones({
      pagina = this.paginacionPublicaciones.paginaActual || 0,
    } = {}) {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarPublicaciones();
      const controller = new AbortController();
      this.controladorPublicaciones = controller;
      this.cargandoPublicaciones = true;
      this.errorPublicaciones = "";
      this.errorFechasPublicaciones = "";

      try {
        const filtros = { ...this.filtrosPublicaciones };
        const texto = String(filtros.texto || "").trim();

        if (texto) {
          const resultado = await this.cargarPublicacionesPorTexto(
            idPerfil,
            filtros,
            texto,
            pagina,
            controller.signal
          );
          if (this.controladorPublicaciones !== controller) return;

          this.publicaciones = resultado.publicaciones;
          this.paginacionPublicaciones = resultado.paginacion;
        } else {
          const response = await publicacionService.listarPorPerfil(
            idPerfil,
            {
              page: pagina,
              size: PUBLICACIONES_PAGE_SIZE,
              fechaDesde: filtros.fechaDesde,
              fechaHasta: filtros.fechaHasta,
              idProyecto: filtros.idProyecto,
            },
            controller.signal
          );

          if (this.controladorPublicaciones !== controller) return;

          const data = response?.data || {};
          const contenido = Array.isArray(data.contenido)
            ? data.contenido
            : [];
          this.publicaciones = contenido
            .map(normalizarPublicacion)
            .filter(Boolean);
          this.paginacionPublicaciones = {
            paginaActual: Number(data.paginaActual) || 0,
            totalPaginas: Number(data.totalPaginas) || 1,
            totalElementos: Number(data.totalElementos) || 0,
            primera: data.primera !== false,
            ultima: data.ultima !== false,
          };
        }
      } catch (error) {
        if (
          this.controladorPublicaciones !== controller ||
          this.esCancelacion(error)
        ) {
          return;
        }

        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";

        if (status === 400) {
          this.errorFechasPublicaciones =
            mensaje || "El rango de fechas no es válido.";
          return;
        }

        if (status === 404) {
          this.errorPublicaciones =
            mensaje || "El perfil ya no está disponible.";
          return;
        }

        this.errorPublicaciones = mensajeErrorApi(
          error,
          "No se pudieron cargar las publicaciones."
        );
      } finally {
        if (this.controladorPublicaciones === controller) {
          this.cargandoPublicaciones = false;
          this.controladorPublicaciones = null;
        }
      }
    },
    async cargarPublicacionesPorTexto(
      idPerfil,
      filtros,
      texto,
      pagina,
      signal
    ) {
      const base = {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        idProyecto: filtros.idProyecto,
      };

      const [porTitulo, porDescripcion] = await Promise.all([
        this.listarTodasLasPublicaciones(
          idPerfil,
          { ...base, titulo: texto },
          signal
        ),
        this.listarTodasLasPublicaciones(
          idPerfil,
          { ...base, descripcion: texto },
          signal
        ),
      ]);

      const publicacionesPorId = new Map();
      for (const item of [...porTitulo, ...porDescripcion]) {
        const normalizada = normalizarPublicacion(item);
        if (normalizada?.idPublicacion != null) {
          publicacionesPorId.set(
            String(normalizada.idPublicacion),
            normalizada
          );
        }
      }

      const lista = [...publicacionesPorId.values()].sort((a, b) => {
        const fecha = String(b.fechaPublicacion || "").localeCompare(
          String(a.fechaPublicacion || "")
        );
        if (fecha !== 0) return fecha;
        return (
          (Number(b.idPublicacion) || 0) - (Number(a.idPublicacion) || 0)
        );
      });

      const totalElementos = lista.length;
      const totalPaginas = Math.max(
        1,
        Math.ceil(totalElementos / PUBLICACIONES_PAGE_SIZE)
      );
      const paginaActual = Math.min(
        Math.max(0, Number(pagina) || 0),
        totalPaginas - 1
      );
      const inicio = paginaActual * PUBLICACIONES_PAGE_SIZE;

      return {
        publicaciones: lista.slice(
          inicio,
          inicio + PUBLICACIONES_PAGE_SIZE
        ),
        paginacion: {
          paginaActual,
          totalPaginas,
          totalElementos,
          primera: paginaActual === 0,
          ultima: paginaActual >= totalPaginas - 1,
        },
      };
    },
    async listarTodasLasPublicaciones(idPerfil, params, signal) {
      const acumulado = [];
      let pagina = 0;
      let totalPaginas = 1;

      do {
        const response = await publicacionService.listarPorPerfil(
          idPerfil,
          {
            ...params,
            page: pagina,
            size: PUBLICACIONES_TEXTO_QUERY_SIZE,
          },
          signal
        );
        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido) ? data.contenido : [];
        acumulado.push(...contenido);
        totalPaginas = Number(data.totalPaginas) || 1;
        pagina += 1;
      } while (
        pagina < totalPaginas &&
        pagina < PUBLICACIONES_TEXTO_MAX_PAGINAS
      );

      return acumulado;
    },
    async cargarProyectosFiltroPublicaciones() {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarProyectosPublicaciones();
      const controller = new AbortController();
      this.controladorProyectosPublicaciones = controller;
      this.cargandoProyectosPublicaciones = true;
      this.errorProyectosPublicaciones = "";

      try {
        const response = await publicacionService.listarProyectosFiltro(
          idPerfil,
          controller.signal
        );
        if (this.controladorProyectosPublicaciones !== controller) return;

        const data = response?.data;
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : Array.isArray(data?.proyectos)
              ? data.proyectos
              : [];
        const proyectos = new Map();

        for (const item of lista) {
          const normalizado = normalizarProyectoFiltro(item);
          if (normalizado) {
            proyectos.set(String(normalizado.idProyecto), normalizado);
          }
        }

        this.proyectosFiltroPublicaciones = [...proyectos.values()];
      } catch (error) {
        if (
          this.controladorProyectosPublicaciones !== controller ||
          this.esCancelacion(error)
        ) {
          return;
        }

        this.proyectosFiltroPublicaciones = [];
        this.errorProyectosPublicaciones = mensajeErrorApi(
          error,
          "No se pudieron cargar los proyectos para filtrar."
        );
      } finally {
        if (this.controladorProyectosPublicaciones === controller) {
          this.cargandoProyectosPublicaciones = false;
          this.controladorProyectosPublicaciones = null;
        }
      }
    },
    sincronizarPublicacionesDesdeRuta() {
      if (this.sincronizandoQueryPublicaciones || this.cargando || !this.perfil) {
        return;
      }

      const { filtros, pagina } = leerFiltrosPublicacionQuery(this.$route.query);
      const firmaRuta = firmarFiltrosPublicacion(filtros, pagina);
      const firmaActual = firmarFiltrosPublicacion(
        this.filtrosPublicaciones,
        this.paginacionPublicaciones.paginaActual
      );
      if (firmaRuta === firmaActual) return;

      this.filtrosPublicaciones = filtros;
      this.paginacionPublicaciones = {
        ...this.paginacionPublicaciones,
        paginaActual: pagina,
      };
      this.cargarPublicaciones({ pagina });
    },
    actualizarQueryPublicaciones(pagina) {
      const query = construirQueryPublicaciones(
        this.$route.query,
        this.filtrosPublicaciones,
        pagina
      );

      if (JSON.stringify(query) === JSON.stringify(this.$route.query || {})) {
        return;
      }

      this.sincronizandoQueryPublicaciones = true;
      this.$router
        .replace({ query })
        .catch(() => {})
        .finally(() => {
          this.sincronizandoQueryPublicaciones = false;
        });
    },
    cambiarFiltroPublicacion({ campo, valor }) {
      this.filtrosPublicaciones = {
        ...this.filtrosPublicaciones,
        [campo]:
          campo === "idProyecto"
            ? valor == null || valor === ""
              ? null
              : valor
            : valor || "",
      };
      if (campo === "fechaDesde" || campo === "fechaHasta") {
        this.errorFechasPublicaciones = "";
      }
      this.programarBusquedaPublicaciones();
    },
    cancelarBusquedaProgramada() {
      if (this.temporalizadorFiltrosPublicaciones) {
        clearTimeout(this.temporalizadorFiltrosPublicaciones);
        this.temporalizadorFiltrosPublicaciones = null;
      }
    },
    programarBusquedaPublicaciones() {
      this.cancelarBusquedaProgramada();
      this.temporalizadorFiltrosPublicaciones = setTimeout(() => {
        this.temporalizadorFiltrosPublicaciones = null;
        this.buscarPublicaciones();
      }, DEBOUNCE_FILTROS_PUBLICACIONES);
    },
    buscarPublicaciones() {
      this.cancelarBusquedaProgramada();

      const errorFechas = validarRangoFechas(
        this.filtrosPublicaciones.fechaDesde,
        this.filtrosPublicaciones.fechaHasta
      );
      if (errorFechas) {
        this.errorFechasPublicaciones = errorFechas;
        return;
      }

      this.errorFechasPublicaciones = "";
      this.paginacionPublicaciones = {
        ...this.paginacionPublicaciones,
        paginaActual: 0,
      };
      this.actualizarQueryPublicaciones(0);
      this.cargarPublicaciones({ pagina: 0 });
    },
    limpiarFiltrosPublicaciones() {
      this.cancelarBusquedaProgramada();
      this.filtrosPublicaciones = filtrosPublicacionVacios();
      this.errorFechasPublicaciones = "";
      this.paginacionPublicaciones = {
        ...this.paginacionPublicaciones,
        paginaActual: 0,
      };
      this.actualizarQueryPublicaciones(0);
      this.cargarPublicaciones({ pagina: 0 });
    },
    cambiarPaginaPublicaciones(delta) {
      this.cancelarBusquedaProgramada();
      const paginaActual =
        Number(this.paginacionPublicaciones.paginaActual) || 0;
      const destino = paginaActual + Number(delta || 0);
      const totalPaginas = Number(this.paginacionPublicaciones.totalPaginas) || 1;

      if (destino < 0 || destino >= totalPaginas) return;

      this.paginacionPublicaciones = {
        ...this.paginacionPublicaciones,
        paginaActual: destino,
      };
      this.actualizarQueryPublicaciones(destino);
      this.cargarPublicaciones({ pagina: destino });
      this.$nextTick(() => {
        this.$refs.publicacionesRef?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    abrirGaleriaPublicacion(publicacion) {
      if (!Array.isArray(publicacion?.imagenes) || !publicacion.imagenes.length) {
        return;
      }
      this.imagenesGaleria = publicacion.imagenes;
      this.tituloGaleria = publicacion.titulo;
      this.modalGaleriaPublicacionVisible = true;
    },
    irAProyectoPublicacion(proyecto) {
      if (proyecto?.idProyecto == null) return;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: proyecto.idProyecto },
      });
    },
    alCrearPublicacion() {
      this.modalNuevaPublicacionVisible = false;
      this.toast.init({
        title: "Publicación creada",
        message: "La publicación ya está visible en el portfolio.",
        color: "success",
        position: "top-right",
        duration: 5000,
      });
      this.limpiarFiltrosPublicaciones();
      this.cargarPublicacionesPerfil();
    },
    editarPublicacion(publicacion) {
      if (!publicacion?.idPublicacion) return;
      this.publicacionEditando = publicacion;
      this.modalEditarPublicacionVisible = true;
    },
    abrirInvitarColaborador(publicacion) {
      if (!publicacion?.idPublicacion) return;
      this.publicacionInvitar = publicacion;
      this.modalInvitarColaboradorVisible = true;
    },
    alEnviarInvitacion(invitacion) {
      this.modalInvitarColaboradorVisible = false;
      this.toast.init({
        title: "Solicitud enviada",
        message: `Se invitó a ${
          invitacion?.nombre || "el contacto"
        } a colaborar.`,
        color: "success",
        position: "top-right",
        duration: 5000,
      });
    },
    abrirEliminarPublicacion(publicacion) {
      if (!publicacion?.idPublicacion) return;
      const modo = accionBajaPublicacion(publicacion, idPerfilActivo());
      if (!modo) return;

      this.publicacionEliminar = publicacion;
      this.modoEliminarPublicacion = modo;
      this.errorEliminarPublicacion = "";
      this.modalEliminarPublicacionVisible = true;
    },
    quitarPublicacionDeListas(idPublicacion) {
      const coincide = (publicacion) =>
        String(publicacion?.idPublicacion) === String(idPublicacion);
      this.publicaciones = this.publicaciones.filter(
        (publicacion) => !coincide(publicacion)
      );
      this.publicacionesPerfil = this.publicacionesPerfil.filter(
        (publicacion) => !coincide(publicacion)
      );
    },
    async confirmarEliminarPublicacion() {
      const publicacion = this.publicacionEliminar;
      if (!publicacion?.idPublicacion || this.eliminandoPublicacion) return;

      this.eliminandoPublicacion = true;
      this.errorEliminarPublicacion = "";

      try {
        await publicacionService.eliminar(publicacion.idPublicacion);

        this.modalEliminarPublicacionVisible = false;
        this.quitarPublicacionDeListas(publicacion.idPublicacion);

        const esDueno = this.modoEliminarPublicacion === "dueno";
        this.toast.init({
          title: esDueno
            ? "Publicación eliminada"
            : "Publicación quitada de tu perfil",
          message: esDueno
            ? "La publicación se eliminó definitivamente."
            : "La publicación sigue disponible para el dueño y los demás colaboradores.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        const pagina = this.paginacionPublicaciones.paginaActual || 0;
        await this.cargarPublicaciones({ pagina });
        if (!this.publicaciones.length && pagina > 0) {
          await this.cargarPublicaciones({ pagina: pagina - 1 });
        }
        await this.cargarPublicacionesPerfil();
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = mensajeErrorApi(
          error,
          "No se pudo eliminar la publicación."
        );

        if (status === 404) {
          this.modalEliminarPublicacionVisible = false;
          this.quitarPublicacionDeListas(publicacion.idPublicacion);
          this.toast.init({
            title: "Publicación no disponible",
            message:
              error?.response?.data?.message ||
              "La publicación ya no existe o ya no está asociada a tu perfil.",
            color: "info",
            position: "top-right",
            duration: 5000,
          });
          await this.cargarPublicaciones({
            pagina: this.paginacionPublicaciones.paginaActual || 0,
          });
          await this.cargarPublicacionesPerfil();
        } else {
          this.errorEliminarPublicacion = mensaje;
        }
      } finally {
        this.eliminandoPublicacion = false;
      }
    },
    alActualizarPublicacion() {
      this.modalEditarPublicacionVisible = false;
      this.toast.init({
        title: "Publicación actualizada",
        message: "Los cambios se guardaron correctamente.",
        color: "success",
        position: "top-right",
        duration: 5000,
      });
      this.cargarPublicaciones();
      this.cargarPublicacionesPerfil();
    },
    resetearTerminos() {
      this.abortarTerminos();
      this.terminos = null;
      this.terminosCargados = false;
      this.cargandoTerminos = false;
      this.errorTerminos = "";
    },
    abortarTerminos() {
      if (this.controladorTerminos) {
        this.controladorTerminos.abort();
        this.controladorTerminos = null;
      }
    },
    async cargarResenasDestacadas() {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.abortarResenasDestacadas();
      this.cargandoResenas = true;
      this.errorResenas = "";

      const controller = new AbortController();
      this.controladorResenas = controller;

      try {
        const response = await calificacionPerfilService.listar(idPerfil, {
          page: 0,
          size: 2,
          signal: controller.signal,
        });

        if (this.controladorResenas !== controller) return;

        const data = response?.data || {};
        this.resenasResumen = normalizarResumen(data.resumen);
        const contenido = Array.isArray(data.calificaciones?.contenido)
          ? data.calificaciones.contenido
          : [];
        this.resenasDestacadas = contenido.map(normalizarResena);
      } catch (error) {
        if (this.controladorResenas !== controller) return;
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        this.errorResenas = mensajeErrorApi(
          error,
          "No se pudieron cargar las reseñas."
        );
      } finally {
        if (this.controladorResenas === controller) {
          this.cargandoResenas = false;
        }
      }
    },
    abortarResenasDestacadas() {
      if (this.controladorResenas) {
        this.controladorResenas.abort();
        this.controladorResenas = null;
      }
    },
    verTodasLasResenas() {
      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({
          name: "ver-perfil-seccion",
          params: { id: idDeRuta, seccion: "resenas" },
        });
        return;
      }
      this.$router.push({
        name: "inicioperfil-seccion",
        params: { seccion: "resenas" },
      });
    },
    abrirResena(idCalificacion) {
      if (idCalificacion == null) return;

      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({
          name: "ver-perfil-resena",
          params: { id: idDeRuta, idCalificacion },
        });
        return;
      }
      this.$router.push({
        name: "inicioperfil-resena",
        params: { idCalificacion },
      });
    },
    volverAlListadoResenas() {
      this.verTodasLasResenas();
    },
    volverAlPerfil() {
      const idDeRuta = this.$route.params.id;
      if (idDeRuta) {
        this.$router.push({ name: "ver-perfil", params: { id: idDeRuta } });
        return;
      }
      this.$router.push({ name: "inicioperfil" });
    },
    irAlPerfilAutor(idPerfil) {
      if (idPerfil == null) return;

      if (Number(idPerfil) === Number(idPerfilActivo())) {
        this.$router.push({ name: "inicioperfil" });
        return;
      }
      this.$router.push({ name: "ver-perfil", params: { id: idPerfil } });
    },
    aplicarTerminosPerfil() {
      if (!this.perfil || !this.perfil.terminosCondiciones) return;
      this.terminos = normalizarTerminos(this.perfil.terminosCondiciones);
      this.terminosCargados = true;
      this.errorTerminos = "";
    },
    async cargarTerminos() {
      if (this.cargandoTerminos || this.terminosCargados) return;

      const id = this.perfil?.idPerfil;
      if (id == null) return;

      this.abortarTerminos();
      this.controladorTerminos = new AbortController();
      this.cargandoTerminos = true;
      this.errorTerminos = "";

      try {
        const response = await perfilService.obtenerTerminos(
          id,
          this.controladorTerminos.signal
        );
        this.terminos = normalizarTerminos(response?.data);
        this.terminosCargados = true;
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          return;
        }
        const status = error?.response?.status;
        if (status === 401) {
          this.$router.push({
            name: "login",
            query: { redirect: this.$route.fullPath },
          });
          return;
        }
        this.errorTerminos = mensajeErrorApi(
          error,
          "No se pudieron cargar los términos y condiciones."
        );
      } finally {
        this.cargandoTerminos = false;
      }
    },
    irAConfigurarTerminos() {
      this.$router.push({ name: "configurar-terminos-perfil" });
    },
    actualizarContadorBaja() {
      // Prioriza la fecha exacta del sistema (fechaLimite) si el endpoint la
      // incluye. El contrato actual (UC-14 §2) solo envía fechaSolicitudBaja,
      // por lo que la expiración se calcula con DIAS_REACTIVACION (debe
      // coincidir con la configuración diasBaja del sistema).
      const fechaLimite = this.perfil?.fechaLimite;
      const iso = this.perfil?.fechaSolicitudBaja;
      const expira = fechaLimite || (iso ? fechaExpiracionBaja(iso) : null);
      this.contadorBaja = {
        expiracion: expira ? formatearFecha(expira) : null,
        restante: expira ? diasRestantes(expira) : null,
      };
    },
    async reactivarPerfil() {
      if (!this.perfil?.idPerfil) return;
      this.reactivando = true;
      this.mensajeError = "";
      try {
        await perfilService.reactivar(this.perfil.idPerfil);
        await this.cargarDatos();
      } catch (error) {
        const status = error?.response?.status;
        this.mensajeError =
          error?.response?.data?.message ||
          (status === 409
            ? "El plazo de reactivación venció: el perfil ya está en estado Baja."
            : "No se pudo reactivar el perfil.");
      } finally {
        this.reactivando = false;
      }
    },
    cambiarSeccion(seccion) {
      const noDisponible = SECCIONES_NO_DISPONIBLES[seccion];
      if (noDisponible) {
        this.noDisponible(noDisponible);
        return;
      }

      const idDeRuta = this.$route.params.id;
      if (seccion === "perfil") {
        if (idDeRuta) {
          this.$router.push({ name: "ver-perfil", params: { id: idDeRuta } });
        } else {
          this.$router.push({ name: "inicioperfil" });
        }
        return;
      }

      if (idDeRuta) {
        this.$router.push({ name: "ver-perfil-seccion", params: { id: idDeRuta, seccion } });
      } else {
        this.$router.push({ name: "inicioperfil-seccion", params: { seccion } });
      }
    },
    navegarRuta(ruta) {
      if (ruta === "editar-perfil-inicio") {
        if (!this.perfil?.idPerfil) return;
        this.$router.push({
          name: ruta,
          params: { id: this.perfil.idPerfil },
        });
        return;
      }
      if (ruta) {
        this.$router.push({ name: ruta });
      }
    },
    avisarSeccionNoDisponible() {
      const seccion = this.$route.params.seccion;
      const nombre = SECCIONES_NO_DISPONIBLES[seccion];
      if (!nombre) return;

      this.noDisponible(nombre);
      const id = this.$route.params.id;
      this.$router.replace(
        id ? { name: "ver-perfil", params: { id } } : { name: "inicioperfil" }
      );
    },
    refrescarEventos() {
      this.$refs.proximosEventos?.cargar();
    },
    noDisponible(nombre) {
      mostrarNoDisponible(this.toast, nombre);
    },
    abrirMensaje() {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      if (this.estadoConexion !== ESTADOS_CONEXION.CONECTADO) {
        this.toast.init({
          title: "Mensajes",
          message: "Necesitás una conexión activa para enviar mensajes.",
          color: "warning",
          position: "top-right",
          duration: 5000,
        });
        return;
      }

      this.$router.push({
        name: "mensajes",
        query: { perfil: idPerfil },
      });
    },
    alReportar() {
      this.mensajeExito = "Reporte enviado. Gracias por ayudarnos a mantener la comunidad.";
    },
    abrirModalConexion() {
      if (
        this.esPropio ||
        !this.mostrarConexion ||
        this.estadoConexion !== ESTADOS_CONEXION.NINGUNA ||
        this.enviandoConexion
      ) {
        return;
      }
      this.errorConexion = "";
      this.modalConexion = true;
    },
    alCambiarModalConexion(valor) {
      if (this.enviandoConexion && !valor) return;
      this.modalConexion = valor;
      if (!valor) this.errorConexion = "";
    },
    async enviarSolicitudConexion() {
      if (this.enviandoConexion) return;
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return;

      this.enviandoConexion = true;
      this.errorConexion = "";
      try {
        const response = await solicitudConexionService.enviar(idPerfil);
        const data = response?.data || {};
        this.modalConexion = false;
        this.perfil = {
          ...this.perfil,
          estadoConexion: ESTADOS_CONEXION.SOLICITUD_ENVIADA,
          idSolicitudConexion:
            data.idSolicitudConexion ?? this.perfil.idSolicitudConexion ?? null,
          idConexion: null,
        };
        this.mensajeExito = `Solicitud de conexión enviada a ${
          this.perfil.nombreArtistico || "este perfil"
        }.`;
      } catch (error) {
        const codigo = error?.response?.data?.codigo;
        const esConflictoDeEstado =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_PENDIENTE ||
          codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE;

        if (esConflictoDeEstado) {
          this.modalConexion = false;
          const actualizado = await this.refrescarPerfilConexion();
          if (actualizado) {
            this.toast.init({
              title: "Conexión",
              message:
                codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE
                  ? "Ya tenés una conexión activa con este perfil."
                  : "Ya existe una solicitud de conexión pendiente con este perfil.",
              color: "info",
              position: "top-right",
              duration: 5000,
            });
          }
          return;
        }

        this.errorConexion = mensajeErrorConexion(error);
      } finally {
        this.enviandoConexion = false;
      }
    },
    abrirModalCancelarConexion() {
      if (!this.mostrarCancelarConexion || this.cancelandoConexion) return;
      this.errorCancelarConexion = "";
      this.modalCancelarConexion = true;
    },
    alCambiarModalCancelarConexion(valor) {
      if (this.cancelandoConexion && !valor) return;
      this.modalCancelarConexion = valor;
      if (!valor) this.errorCancelarConexion = "";
    },
    async cancelarSolicitudConexion() {
      if (this.cancelandoConexion) return;
      const idSolicitud = this.perfil?.idSolicitudConexion;
      if (idSolicitud == null) return;

      this.cancelandoConexion = true;
      this.errorCancelarConexion = "";
      try {
        await solicitudConexionService.cancelar(idSolicitud);
        this.modalCancelarConexion = false;
        this.perfil = {
          ...this.perfil,
          estadoConexion: ESTADOS_CONEXION.NINGUNA,
          idSolicitudConexion: null,
          idConexion: null,
        };
        this.mensajeExito = "Solicitud de conexión cancelada.";
        await this.refrescarPerfilConexion({ silencioso: true });
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esConflicto =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PENDIENTE;
        const esNoPermitida =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_NO_PERMITIDA ||
          status === 403;
        const esNoEncontrada = status === 404;

        if (esConflicto || esNoPermitida || esNoEncontrada) {
          this.modalCancelarConexion = false;
          const actualizado = await this.refrescarPerfilConexion({
            silencioso: true,
          });

          if (!actualizado || esNoPermitida || esNoEncontrada) {
            this.perfil = {
              ...this.perfil,
              idSolicitudConexion: null,
            };
          }

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

        this.errorCancelarConexion = mensajeErrorCancelacionConexion(error);
      } finally {
        this.cancelandoConexion = false;
      }
    },
    abrirGestionConexion(modo) {
      if (
        this.esPropio ||
        this.estadoConexion !== ESTADOS_CONEXION.SOLICITUD_RECIBIDA ||
        this.perfil?.idSolicitudConexion == null ||
        this.procesandoConexion
      ) {
        return;
      }
      this.modoGestionConexion = modo === "rechazar" ? "rechazar" : "aceptar";
      this.errorGestionConexion = "";
      this.modalGestionConexion = true;
    },
    alCambiarModalGestionConexion(valor) {
      if (this.procesandoConexion && !valor) return;
      this.modalGestionConexion = valor;
      if (!valor) this.errorGestionConexion = "";
    },
    async confirmarGestionConexion() {
      if (this.procesandoConexion) return;
      const idSolicitud = this.perfil?.idSolicitudConexion;
      if (idSolicitud == null) return;

      const modo = this.modoGestionConexion;
      this.procesandoConexion = true;
      this.accionProcesandoConexion = modo;
      this.errorGestionConexion = "";
      try {
        const response =
          modo === "aceptar"
            ? await solicitudConexionService.aceptar(idSolicitud)
            : await solicitudConexionService.rechazar(idSolicitud);
        const data = response?.data || {};

        this.modalGestionConexion = false;
        this.ultimaConexionId =
          modo === "aceptar" ? data.idConexion ?? null : null;
        this.mensajeExito =
          modo === "aceptar"
            ? "Solicitud aceptada. La conexión ya está activa."
            : "Solicitud rechazada.";
        this.perfil = {
          ...this.perfil,
          estadoConexion:
            modo === "aceptar"
              ? ESTADOS_CONEXION.CONECTADO
              : ESTADOS_CONEXION.NINGUNA,
          idConexion:
            modo === "aceptar" ? data.idConexion ?? null : null,
          idSolicitudConexion: null,
        };

        await this.refrescarPerfilConexion({ silencioso: true });
        await cargarConteosSolicitudesConexion("RECIBIDA");
        await cargarResumenPerfil(idPerfilActivo());
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
          this.modalGestionConexion = false;
          await this.refrescarPerfilConexion({ silencioso: true });
          await cargarConteosSolicitudesConexion("RECIBIDA");
          this.toast.init({
            title: esConflicto
              ? "Solicitud de conexión"
              : "No se pudo gestionar",
            message: mensajeErrorGestionSolicitudConexion(error),
            color: esConflicto ? "info" : "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorGestionConexion =
          mensajeErrorGestionSolicitudConexion(error);
      } finally {
        this.procesandoConexion = false;
        this.accionProcesandoConexion = "";
      }
    },
    abrirEliminarConexion() {
      if (
        this.esPropio ||
        this.estadoConexion !== ESTADOS_CONEXION.CONECTADO ||
        this.perfil?.idConexion == null ||
        this.eliminandoConexion
      ) {
        return;
      }
      this.errorEliminarConexion = "";
      this.modalEliminarConexion = true;
    },
    alCambiarModalEliminarConexion(valor) {
      if (this.eliminandoConexion && !valor) return;
      this.modalEliminarConexion = valor;
      if (!valor) this.errorEliminarConexion = "";
    },
    async confirmarEliminarConexion() {
      if (this.eliminandoConexion) return;
      const idConexion = this.perfil?.idConexion;
      if (idConexion == null) return;

      this.eliminandoConexion = true;
      this.procesandoConexion = true;
      this.accionProcesandoConexion = "eliminar";
      this.errorEliminarConexion = "";
      try {
        await conexionService.eliminar(idConexion);
        this.modalEliminarConexion = false;
        this.ultimaConexionId = null;
        this.mensajeExito = "Conexión eliminada.";
        this.perfil = {
          ...this.perfil,
          estadoConexion: ESTADOS_CONEXION.NINGUNA,
          idConexion: null,
          idSolicitudConexion: null,
        };
        await this.refrescarPerfilConexion({ silencioso: true });
        await cargarResumenPerfil(idPerfilActivo());
      } catch (error) {
        const status = error?.response?.status;
        const codigo = error?.response?.data?.codigo;
        const esNoActiva =
          codigo === CODIGOS_ERROR_CONEXIONES.CONEXION_NO_ACTIVA;
        const esNoEncontrada = status === 404;

        if (esNoActiva || esNoEncontrada) {
          this.modalEliminarConexion = false;
          await this.refrescarPerfilConexion({ silencioso: true });
          this.toast.init({
            title: "No se pudo eliminar",
            message: mensajeErrorEliminarConexion(error),
            color: "danger",
            position: "top-right",
            duration: 5000,
          });
          return;
        }

        this.errorEliminarConexion = mensajeErrorEliminarConexion(error);
      } finally {
        this.eliminandoConexion = false;
        this.procesandoConexion = false;
        this.accionProcesandoConexion = "";
      }
    },
    irAConexionCreada() {
      if (this.ultimaConexionId == null) return;
      this.$router.push({
        name: "mi-red",
        query: {
          tab: "conexiones",
          idConexion: this.ultimaConexionId,
        },
      });
    },
    async refrescarPerfilConexion({ silencioso = false } = {}) {
      const idPerfil = this.perfil?.idPerfil;
      if (idPerfil == null) return false;

      try {
        const response = await perfilService.obtener(idPerfil);
        if (response?.data) {
          this.perfil = response.data;
          return true;
        }
      } catch (error) {
        if (!silencioso) {
          this.toast.init({
            title: "No se pudo actualizar el perfil",
            message: mensajeErrorApi(
              error,
              "Recargá la página para ver el estado actualizado de la conexión."
            ),
            color: "danger",
            position: "top-right",
            duration: 5000,
          });
        }
      }
      return false;
    },
    nuevaPublicacion() {
      if (!this.esPropio) return;
      this.modalNuevaPublicacionVisible = true;
    },
    irAEditar() {
      if (this.perfil?.idPerfil) {
        this.$router.push({
          name: "editar-perfil-inicio",
          params: { id: this.perfil.idPerfil },
        });
      }
    },
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
      } catch {
        // ignore
      } finally {
        limpiarSesion();
        this.$router.push({ name: "login" });
      }
    },
    capitalizar(texto) {
      const palabras = String(texto || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ");
    },
  },
};
</script>

<style scoped>
.inicio-perfil {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.inicio-perfil__hero-cabecera {
  margin-bottom: 1rem;
}

.inicio-perfil__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;
}

.inicio-perfil__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.inicio-perfil__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1rem;
}

.inicio-perfil__panel {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.inicio-perfil__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.inicio-perfil__panel-titulo {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.inicio-perfil__panel-header .inicio-perfil__panel-titulo {
  margin: 0;
}

.inicio-perfil__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.inicio-perfil__publicaciones-lista {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.inicio-perfil__publicaciones-lista :deep(.publicacion-galeria__miniatura) {
  flex: 0 0 72px;
  width: 72px;
}

.inicio-perfil__publicaciones-mas {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.inicio-perfil__estado-publicaciones {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.inicio-perfil__estado-publicaciones-texto {
  max-width: 30rem;
  margin: 0;
  line-height: 1.5;
}

.inicio-perfil__spinner {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: inicio-perfil-girar 0.8s linear infinite;
}

@keyframes inicio-perfil-girar {
  to {
    transform: rotate(360deg);
  }
}

.inicio-perfil__carac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.inicio-perfil__carac-grid:last-child {
  margin-bottom: 0;
}

.inicio-perfil__campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text);
}

.inicio-perfil__label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.inicio-perfil__valor {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.inicio-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.inicio-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.inicio-perfil__estado-icono {
  font-size: 2.5rem;
}

.inicio-perfil__habilidades {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.inicio-perfil__habilidad {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

.inicio-perfil__exito {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.inicio-perfil__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.inicio-perfil__alerta-baja {
  margin-bottom: 1rem;
}

.inicio-perfil__alerta-baja-contenido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;
}

.inicio-perfil__calendario-wrap {
  overflow-x: auto;
  max-width: 100%;
}

@media (max-width: 900px) {
  .inicio-perfil__layout {
    grid-template-columns: 1fr;
  }

  .inicio-perfil__sidebar {
    position: static;
    order: -1;
  }
}

@media (max-width: 700px) {
  .inicio-perfil__publicaciones-lista {
    gap: 0.75rem;
  }
}
</style>
