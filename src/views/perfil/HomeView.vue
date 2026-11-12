<template>
  <div class="home-view">
    <BaseAlert
      v-if="mensajeError"
      :message="mensajeError"
      type="error"
      class="home-view__alerta"
    />

    <HomeFeed
      v-if="perfilActivo || cargando"
      :tab-activa="tabActiva"
      :proyectos="proyectos"
      :oportunidades="oportunidades"
      :total-proyectos="totalProyectos"
      :total-oportunidades="totalOportunidades"
      :cargando="cargando"
      :error-proyectos="errorProyectos"
      :publicaciones="publicacionesFeed"
      :cargando-publicaciones="cargandoPublicacionesFeed"
      :error-publicaciones="errorPublicacionesFeed"
      :hay-mas-publicaciones="hayMasPublicacionesFeed"
      :cargando-mas-publicaciones="cargandoMasPublicacionesFeed"
      @cambiar-tab="tabActiva = $event"
      @postular="abrirPostulacion"
      @abrir-oportunidad="abrirDetalleOportunidad"
      @abrir-proyecto="irAProyecto"
      @ver-todos-proyectos="irAProyectos"
      @ver-todas-oportunidades="irABuscarOportunidades"
      @nueva-publicacion="abrirNuevaPublicacion"
      @abrir-publicacion="abrirDetallePublicacion"
      @ver-comentarios="abrirComentariosPublicacion"
      @no-disponible="alPublicacionNoDisponible"
      @sin-perfil="alSinPerfilActivo"
      @perfil-inactivo="alPerfilInactivo"
      @ver-proyecto-publicacion="irAProyectoPublicacion"
      @editar-publicacion="editarPublicacion"
      @invitar-colaborador="abrirInvitarColaborador"
      @eliminar-publicacion="abrirEliminarPublicacion"
      @reintentar-publicaciones="cargarFeedPublicaciones()"
      @cargar-mas-publicaciones="cargarMasPublicaciones"
    />

    <div v-else-if="!mensajeError" class="home-view__estado">
      <span class="material-symbols-outlined home-view__estado-icono" aria-hidden="true">
        person_off
      </span>
      <p>Seleccioná un perfil desde el dashboard para ingresar al Home.</p>
      <VaButton preset="secondary" @click="$router.push({ name: 'dashboard-usuario' })">
        Ir al dashboard
      </VaButton>
    </div>

    <ModalPostulacion
      :model-value="modalPostulacion.visible"
      :id-proyecto="modalPostulacion.idProyecto"
      :tipo="modalPostulacion.tipo"
      :nombre-proyecto="modalPostulacion.nombreProyecto"
      :requerimiento="modalPostulacion.requerimiento"
      :actividad="modalPostulacion.actividad"
      :enviando="enviandoPostulacion"
      :error="errorPostulacion"
      :sugerir-calendario="errorPostulacionEsDisponibilidad"
      :sin-fecha-entrega="modalPostulacionSinFechaEntrega"
      @update:model-value="cerrarModalPostulacion"
      @confirmar="confirmarPostulacion"
      @revisar-calendario="irACalendario"
    />

    <ModalNuevaPublicacion
      v-model="modalNuevaPublicacionVisible"
      @creada="alCrearPublicacion"
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

    <PublicacionDetalleModal
      v-model="modalDetallePublicacionVisible"
      :publicacion="publicacionDetalle"
      :id-publicacion="publicacionDetalle?.idPublicacion"
      :indice-inicial="indiceDetallePublicacion"
      :enfocar-comentarios="enfocarComentariosDetalle"
      @ver-proyecto="irAProyectoPublicacion"
      @no-disponible="alPublicacionNoDisponible"
      @sin-perfil="alSinPerfilActivo"
      @perfil-inactivo="alPerfilInactivo"
    />

    <ModalDetalleOportunidad
      v-model="modalOportunidadVisible"
      :oportunidad="oportunidadSeleccionada"
      @ver-proyecto="verProyectoDesdeOportunidad"
    />
  </div>
</template>

<script>
import homeService from "../../services/homeService.js";
import proyectoService from "../../services/proyectoService.js";
import publicacionService from "../../services/publicacionService.js";
import BaseAlert from "../../components/AlertaBase.vue";
import HomeFeed from "../../components/home/HomeFeed.vue";
import ModalDetalleOportunidad from "../../components/home/ModalDetalleOportunidad.vue";
import ModalPostulacion from "../../components/proyecto/ModalPostulacion.vue";
import ModalNuevaPublicacion from "../../components/perfil/ModalNuevaPublicacion.vue";
import ModalInvitarColaborador from "../../components/perfil/ModalInvitarColaborador.vue";
import ModalEliminarPublicacion from "../../components/perfil/ModalEliminarPublicacion.vue";
import PublicacionDetalleModal from "../../components/perfil/PublicacionDetalleModal.vue";
import {
  accionBajaPublicacion,
  normalizarPublicacion,
} from "../../utils/publicacionConstants.js";
import {
  marcarNoDisponible,
  sincronizarPublicacion,
  sincronizarPublicaciones,
} from "../../services/publicacionInteraccionState.js";
import {
  idPerfilActivo,
  setPerfilActivo,
  refrescarSesion,
} from "../../services/authState.js";
import { cargarResumenColaboracionesAutomaticas } from "../../services/colaboracionAutomaticaState";
import { useToast } from "vuestic-ui";
import {
  clasificarErrorPublicacion,
  mensajeErrorApi,
} from "../../utils/apiError";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { ordenarProyectosInicio } from "../../utils/proyectoConstants.js";
import {
  AVISO_DISPONIBILIDAD_PROVISORIA,
  TIPOS_POSTULACION,
  esErrorCupoCompleto,
  esErrorDisponibilidad,
  esErrorPostulacionDuplicada,
  mensajeExitoPostulacion,
} from "../../utils/postulacionConstants.js";

function modalPostulacionVacio() {
  return {
    visible: false,
    tipo: TIPOS_POSTULACION.GENERAL,
    idProyecto: null,
    nombreProyecto: "",
    requerimiento: null,
    actividad: null,
    fechaEntrega: null,
  };
}

export default {
  name: "HomeView",
  components: {
    BaseAlert,
    HomeFeed,
    ModalDetalleOportunidad,
    ModalEliminarPublicacion,
    ModalInvitarColaborador,
    ModalNuevaPublicacion,
    ModalPostulacion,
    PublicacionDetalleModal,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      perfilActivo: null,
      proyectos: [],
      oportunidades: [],
      totalProyectos: 0,
      totalOportunidades: 0,
      cargando: true,
      mensajeError: "",
      errorProyectos: "",
      tabActiva: "todo",
      modalPostulacion: modalPostulacionVacio(),
      enviandoPostulacion: false,
      errorPostulacion: "",
      errorPostulacionEsDisponibilidad: false,
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
      publicacionesFeed: [],
      cargandoPublicacionesFeed: false,
      errorPublicacionesFeed: "",
      paginaPublicacionesFeed: 0,
      hayMasPublicacionesFeed: false,
      cargandoMasPublicacionesFeed: false,
      controladorFeedPublicaciones: null,
      modalDetallePublicacionVisible: false,
      publicacionDetalle: null,
      indiceDetallePublicacion: 0,
      enfocarComentariosDetalle: false,
      modalOportunidadVisible: false,
      oportunidadSeleccionada: null,
    };
  },
  computed: {
    modalPostulacionSinFechaEntrega() {
      return !this.modalPostulacion.fechaEntrega;
    },
    idPerfilActivoActual() {
      return idPerfilActivo();
    },
  },
  watch: {
    idPerfilActivoActual() {
      this.cargarFeedPublicaciones();
    },
  },
  mounted() {
    this.cargarHome();
  },
  beforeUnmount() {
    this.abortarFeedPublicaciones();
  },
  methods: {
    async cargarHome() {
      this.cargando = true;
      this.mensajeError = "";
      this.errorProyectos = "";

      try {
        const [resumenResultado, proyectosResultado] = await Promise.allSettled([
          homeService.obtenerResumen(20),
          proyectoService.buscar({ page: 0, size: 12 }),
        ]);

        await this.procesarResumen(resumenResultado);
        this.procesarProyectos(proyectosResultado);

        if (this.perfilActivo) {
          setPerfilActivo(this.perfilActivo);
          this.cargarFeedPublicaciones();
        }
      } finally {
        this.cargando = false;
      }
    },
    async procesarResumen(resultado) {
      if (resultado.status === "fulfilled") {
        const resumen = resultado.value?.data || {};
        this.perfilActivo = resumen.perfilActivo || null;
        this.oportunidades = Array.isArray(resumen.oportunidades)
          ? resumen.oportunidades
          : [];
        this.totalOportunidades = this.sumarOportunidades(resumen);
        return;
      }

      const error = resultado.reason;
      if (error?.response?.status === 404) {
        try {
          const response = await homeService.obtenerPerfilActivo();
          this.perfilActivo = response?.data || null;
          if (this.perfilActivo) setPerfilActivo(this.perfilActivo);
        } catch {
          this.mensajeError = "No se pudo cargar el perfil activo.";
        }
        return;
      }

      this.mensajeError = "No se pudo cargar el inicio. Intentá nuevamente.";
    },
    procesarProyectos(resultado) {
      if (resultado.status === "fulfilled") {
        const data = resultado.value?.data || {};
        const proyectos = Array.isArray(data.contenido) ? data.contenido : [];
        this.proyectos = ordenarProyectosInicio(proyectos);
        this.totalProyectos =
          Number(data.totalElementos) || this.proyectos.length;
        return;
      }

      const error = resultado.reason;
      this.proyectos = [];
      this.totalProyectos = 0;

      if (error?.response?.status === 404) {
        this.errorProyectos =
          "No hay un perfil activo seleccionado para cargar los proyectos.";
        return;
      }
      if (error?.response?.status === 403) {
        this.errorProyectos = "No tenés acceso a los proyectos visibles.";
        return;
      }

      this.errorProyectos = mensajeErrorApi(
        error,
        "No se pudieron cargar los proyectos."
      );
    },
    sumarOportunidades(resumen, oportunidades = this.oportunidades) {
      const generales = Number(resumen?.totalOportunidadesGenerales) || 0;
      const actividades = Number(resumen?.totalOportunidadesActividad) || 0;
      const total = generales + actividades;
      return total || oportunidades.length;
    },
    abrirNuevaPublicacion() {
      if (!this.perfilActivo) return;
      this.modalNuevaPublicacionVisible = true;
    },
    alCrearPublicacion() {
      this.modalNuevaPublicacionVisible = false;
      this.toast.init({
        title: "Publicación creada",
        message: "La publicación ya está visible en tu portfolio.",
        color: "success",
        position: "top-right",
        duration: 5000,
      });
      cargarResumenColaboracionesAutomaticas();
      this.$router.push({ name: "inicioperfil" });
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
      const modo = accionBajaPublicacion(
        publicacion,
        this.perfilActivo?.idPerfil
      );
      if (!modo) return;

      this.publicacionEliminar = publicacion;
      this.modoEliminarPublicacion = modo;
      this.errorEliminarPublicacion = "";
      this.modalEliminarPublicacionVisible = true;
    },
    quitarPublicacionDelFeed(idPublicacion) {
      this.publicacionesFeed = this.publicacionesFeed.filter(
        (publicacion) =>
          String(publicacion.idPublicacion) !== String(idPublicacion)
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
        this.quitarPublicacionDelFeed(publicacion.idPublicacion);
        this.toast.init({
          title: "Publicación eliminada",
          message: "La publicación se eliminó definitivamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        cargarResumenColaboracionesAutomaticas();
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404) {
          this.modalEliminarPublicacionVisible = false;
          this.quitarPublicacionDelFeed(publicacion.idPublicacion);
          cargarResumenColaboracionesAutomaticas();
          this.toast.init({
            title: "Publicación no disponible",
            message:
              error?.response?.data?.message ||
              "La publicación ya no existe.",
            color: "info",
            position: "top-right",
            duration: 5000,
          });
        } else {
          this.errorEliminarPublicacion = mensajeErrorApi(
            error,
            "No se pudo eliminar la publicación."
          );
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
      cargarResumenColaboracionesAutomaticas();
      this.cargarFeedPublicaciones();
    },
    abortarFeedPublicaciones() {
      if (this.controladorFeedPublicaciones) {
        this.controladorFeedPublicaciones.abort();
        this.controladorFeedPublicaciones = null;
      }
    },
    async cargarFeedPublicaciones({ pagina = 0, append = false } = {}) {
      this.abortarFeedPublicaciones();
      const controller = new AbortController();
      this.controladorFeedPublicaciones = controller;

      if (append) this.cargandoMasPublicacionesFeed = true;
      else this.cargandoPublicacionesFeed = true;
      this.errorPublicacionesFeed = "";

      try {
        const response = await publicacionService.listarFeed(
          { page: pagina, size: 10, incluirPropias: true },
          controller.signal
        );
        if (this.controladorFeedPublicaciones !== controller) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido) ? data.contenido : [];
        const normalizadas = contenido
          .map(normalizarPublicacion)
          .filter(Boolean);

        this.publicacionesFeed = append
          ? [...this.publicacionesFeed, ...normalizadas]
          : normalizadas;
        sincronizarPublicaciones(normalizadas);
        this.paginaPublicacionesFeed = Number(data.paginaActual) || pagina;
        this.hayMasPublicacionesFeed = data.ultima === false;
      } catch (error) {
        if (
          this.controladorFeedPublicaciones !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        const status = error?.response?.status;
        const mensaje = error?.response?.data?.message || "";
        const tipo = clasificarErrorPublicacion(error);
        if (tipo === "SIN_PERFIL") {
          this.alSinPerfilActivo();
          return;
        }
        if (tipo === "PERFIL_INACTIVO") {
          await this.alPerfilInactivo();
          return;
        }
        if (status === 404) {
          this.errorPublicacionesFeed =
            mensaje || "No hay un perfil activo para cargar el feed.";
        } else if (status === 409) {
          this.errorPublicacionesFeed =
            mensaje || "El perfil no está activo para cargar el feed.";
        } else {
          this.errorPublicacionesFeed = mensajeErrorApi(
            error,
            "No se pudieron cargar las publicaciones."
          );
        }
      } finally {
        if (this.controladorFeedPublicaciones === controller) {
          this.cargandoPublicacionesFeed = false;
          this.cargandoMasPublicacionesFeed = false;
          this.controladorFeedPublicaciones = null;
        }
      }
    },
    cargarMasPublicaciones() {
      if (
        !this.hayMasPublicacionesFeed ||
        this.cargandoPublicacionesFeed ||
        this.cargandoMasPublicacionesFeed
      ) {
        return;
      }
      this.cargarFeedPublicaciones({
        pagina: this.paginaPublicacionesFeed + 1,
        append: true,
      });
    },
    abrirDetallePublicacion(payload) {
      const publicacion = payload?.publicacion || payload;
      if (!publicacion?.idPublicacion) return;

      this.publicacionDetalle = publicacion;
      this.indiceDetallePublicacion = Number(payload?.indice) || 0;
      this.enfocarComentariosDetalle = false;
      sincronizarPublicacion(publicacion);
      this.modalDetallePublicacionVisible = true;
    },
    abrirComentariosPublicacion(publicacion) {
      this.abrirDetallePublicacion({ publicacion, indice: 0 });
      this.enfocarComentariosDetalle = true;
    },
    alPublicacionNoDisponible(publicacion) {
      const id = publicacion?.idPublicacion;
      if (id != null) {
        marcarNoDisponible(id);
        this.quitarPublicacionDelFeed(id);
      }
      this.modalDetallePublicacionVisible = false;
      this.publicacionDetalle = null;
      this.enfocarComentariosDetalle = false;
      this.toast.init({
        title: "Publicación no disponible",
        message: "La publicación fue eliminada o ya no está visible.",
        color: "info",
        position: "top-right",
        duration: 5000,
      });
    },
    alSinPerfilActivo() {
      this.modalDetallePublicacionVisible = false;
      this.publicacionDetalle = null;
      this.enfocarComentariosDetalle = false;
      this.toast.init({
        title: "Seleccioná un perfil",
        message: "Para interactuar con publicaciones necesitás un perfil activo.",
        color: "warning",
        position: "top-right",
        duration: 5000,
      });
      this.$router.push({ name: "dashboard-usuario" });
    },
    async alPerfilInactivo() {
      this.modalDetallePublicacionVisible = false;
      this.publicacionDetalle = null;
      this.enfocarComentariosDetalle = false;
      await refrescarSesion();
      this.toast.init({
        title: "Perfil no disponible",
        message: "El perfil activo se encuentra en baja. Elegí otro perfil.",
        color: "warning",
        position: "top-right",
        duration: 5000,
      });
      this.$router.push({ name: "dashboard-usuario" });
    },
    irAProyectoPublicacion(proyecto) {
      if (proyecto?.idProyecto == null) return;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: proyecto.idProyecto },
      });
    },
    async refrescarResumen() {
      const postuladas = new Set(
        this.oportunidades
          .filter((oportunidad) => oportunidad.yaPostulado === true)
          .map((oportunidad) => this.claveOportunidad(oportunidad))
      );
      const sinCupo = new Set(
        this.oportunidades
          .filter(
            (oportunidad) =>
              oportunidad.satisfecho === true ||
              oportunidad.motivoNoPostulable === "CUPO"
          )
          .map((oportunidad) => this.claveOportunidad(oportunidad))
      );

      try {
        const response = await homeService.obtenerResumen(20);
        const resumen = response?.data || {};
        const lista = Array.isArray(resumen.oportunidades)
          ? resumen.oportunidades
          : [];

        this.oportunidades = lista.map((oportunidad) => {
          const clave = this.claveOportunidad(oportunidad);
          if (postuladas.has(clave)) {
            return {
              ...oportunidad,
              yaPostulado: true,
              estadoPostulacion:
                oportunidad.estadoPostulacion || "PENDIENTE",
              puedePostularse: false,
            };
          }
          if (sinCupo.has(clave)) {
            return {
              ...oportunidad,
              satisfecho: true,
              faltantes: 0,
              puedePostularse: false,
              motivoNoPostulable: "CUPO",
            };
          }
          return oportunidad;
        });
        this.totalOportunidades = this.sumarOportunidades(
          resumen,
          this.oportunidades
        );
      } catch {
        // El estado local ya refleja la postulación; el refresco es best-effort.
      }
    },
    claveOportunidad(oportunidad) {
      return `${String(oportunidad?.tipo || "").toUpperCase()}:${
        oportunidad?.idRequerimiento
      }`;
    },
    irAProyecto(proyecto) {
      if (!proyecto?.idProyecto) return;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: proyecto.idProyecto },
      });
    },
    abrirDetalleOportunidad(oportunidad) {
      if (!oportunidad) return;
      this.oportunidadSeleccionada = oportunidad;
      this.modalOportunidadVisible = true;
    },
    verProyectoDesdeOportunidad(payload) {
      const idProyecto =
        payload?.idProyecto ?? this.oportunidadSeleccionada?.idProyecto;
      if (idProyecto == null) return;
      this.modalOportunidadVisible = false;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: idProyecto },
      });
    },
    irAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
    /**
     * UC-72/UC-73: "Ver todas" abre el buscador con la pestaña correspondiente
     * y la profesión del perfil activo precargada (la vista la resuelve si no
     * viaja en la query).
     */
    irABuscarOportunidades() {
      const tipos = this.oportunidades.map((oportunidad) =>
        String(oportunidad?.tipo || "").toUpperCase()
      );
      const todasActividades =
        tipos.length > 0 && tipos.every((tipo) => tipo === "ACTIVIDAD");
      const idProfesion = Number(this.perfilActivo?.idProfesion);

      this.$router.push({
        name: "buscar",
        query: {
          tab: "oportunidades",
          ...(todasActividades ? { subtab: "actividades" } : {}),
          ...(Number.isFinite(idProfesion) && idProfesion > 0
            ? { idProfesion }
            : {}),
        },
      });
    },
    abrirPostulacion(oportunidad) {
      if (!oportunidad) return;
      if (
        oportunidad.puedePostularse !== true ||
        oportunidad.yaPostulado === true ||
        oportunidad.idProyecto == null ||
        oportunidad.idRequerimiento == null
      ) {
        return;
      }

      const tipo =
        String(oportunidad.tipo || "").toUpperCase() ===
        TIPOS_POSTULACION.ACTIVIDAD
          ? TIPOS_POSTULACION.ACTIVIDAD
          : TIPOS_POSTULACION.GENERAL;

      this.errorPostulacion = "";
      this.errorPostulacionEsDisponibilidad = false;
      this.modalPostulacion = {
        visible: true,
        tipo,
        idProyecto: oportunidad.idProyecto,
        nombreProyecto: oportunidad.nombreProyecto || "",
        requerimiento: {
          idRequerimiento: oportunidad.idRequerimiento,
          cantidad: oportunidad.cantidad,
          nombreProfesion: oportunidad.nombreProfesion,
          descripcion: oportunidad.descripcion,
        },
        actividad:
          tipo === TIPOS_POSTULACION.ACTIVIDAD
            ? {
                idActividad: oportunidad.idActividad,
                nombre: oportunidad.nombreActividad,
                fechaHoraInicio: oportunidad.fechaHoraInicioActividad,
                fechaHoraFin: oportunidad.fechaHoraFinActividad,
                duracionMinutos: oportunidad.duracionMinutos,
              }
            : null,
        fechaEntrega: oportunidad.fechaEntrega || null,
      };
    },
    cerrarModalPostulacion(visible) {
      this.modalPostulacion.visible = visible;
      if (!visible) {
        this.errorPostulacion = "";
        this.errorPostulacionEsDisponibilidad = false;
      }
    },
    async confirmarPostulacion() {
      if (this.enviandoPostulacion) return;

      const { tipo, idProyecto, requerimiento, actividad } =
        this.modalPostulacion;
      const idRequerimiento = requerimiento?.idRequerimiento;
      if (idProyecto == null || idRequerimiento == null) return;

      this.enviandoPostulacion = true;
      this.errorPostulacion = "";
      this.errorPostulacionEsDisponibilidad = false;

      try {
        const response =
          tipo === TIPOS_POSTULACION.ACTIVIDAD
            ? await proyectoService.postularARequerimientoActividad(
                idProyecto,
                idRequerimiento
              )
            : await proyectoService.postularARequerimientoGeneral(
                idProyecto,
                idRequerimiento
              );

        const data = response?.data || {};
        this.marcarPostulado(tipo, idRequerimiento);
        this.cerrarModalPostulacion(false);

        this.toast.init({
          title: "Postulación enviada",
          message: mensajeExitoPostulacion(tipo, actividad?.nombre),
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        if (data.tentativa === true) {
          this.toast.init({
            title: "Disponibilidad provisoria",
            message: AVISO_DISPONIBILIDAD_PROVISORIA,
            color: "primary",
            position: "top-right",
            duration: 8000,
          });
        }

        await this.refrescarResumen();
      } catch (error) {
        await this.manejarErrorPostulacion(error);
      } finally {
        this.enviandoPostulacion = false;
      }
    },
    async manejarErrorPostulacion(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      if (status === 400) {
        this.errorPostulacion =
          mensaje ||
          "No se pudo enviar la postulación. Revisá los datos e intentá nuevamente.";
        return;
      }

      if (status === 401) {
        this.cerrarModalPostulacion(false);
        this.toast.init({
          title: "No se pudo postular",
          message: mensajeErrorApi(error, "Tu cuenta no se encuentra activa."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (status === 404) {
        if (clasificacion?.tipo === "perfil-activo") {
          this.cerrarModalPostulacion(false);
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (clasificacion?.tipo === "perfil-no-encontrado") {
          this.cerrarModalPostulacion(false);
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        this.cerrarModalPostulacion(false);
        this.toast.init({
          title: "No se pudo postular",
          message: mensaje || "El requerimiento ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.refrescarResumen();
        return;
      }

      if (status === 409) {
        if (esErrorDisponibilidad(error)) {
          this.errorPostulacion = mensaje;
          this.errorPostulacionEsDisponibilidad = true;
          return;
        }

        const { tipo, requerimiento } = this.modalPostulacion;
        const idRequerimiento = requerimiento?.idRequerimiento;

        if (esErrorPostulacionDuplicada(error) && idRequerimiento != null) {
          this.marcarPostulado(tipo, idRequerimiento);
        }

        if (esErrorCupoCompleto(error) && idRequerimiento != null) {
          this.marcarSinCupo(tipo, idRequerimiento);
        }

        this.cerrarModalPostulacion(false);
        this.toast.init({
          title: "No se pudo postular",
          message: mensaje || "La postulación no se pudo completar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.refrescarResumen();
        return;
      }

      if (!status || status >= 500) {
        this.errorPostulacion =
          "Ocurrió un error al enviar la postulación. Inténtalo nuevamente.";
        return;
      }

      this.errorPostulacion = mensajeErrorApi(
        error,
        "No se pudo enviar la postulación."
      );
    },
    marcarPostulado(tipo, idRequerimiento) {
      this.actualizarOportunidad(tipo, idRequerimiento, {
        yaPostulado: true,
        estadoPostulacion: "PENDIENTE",
        puedePostularse: false,
      });
    },
    marcarSinCupo(tipo, idRequerimiento) {
      this.actualizarOportunidad(tipo, idRequerimiento, {
        satisfecho: true,
        faltantes: 0,
        puedePostularse: false,
        motivoNoPostulable: "CUPO",
      });
    },
    actualizarOportunidad(tipo, idRequerimiento, cambios) {
      const claveBuscada = this.claveOportunidad({ tipo, idRequerimiento });
      const indice = this.oportunidades.findIndex(
        (oportunidad) => this.claveOportunidad(oportunidad) === claveBuscada
      );
      if (indice === -1) return;
      this.oportunidades.splice(indice, 1, {
        ...this.oportunidades[indice],
        ...cambios,
      });
    },
    irACalendario() {
      this.cerrarModalPostulacion(false);
      this.$router.push({
        name: "inicioperfil-seccion",
        params: { seccion: "calendario" },
      });
    },
  },
};
</script>

<style scoped>
.home-view {
  display: grid;
  gap: 1rem;
}

.home-view__alerta {
  margin: 0;
}

.home-view__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.home-view__estado p {
  margin: 0;
}

.home-view__estado-icono {
  font-size: 2.5rem;
}
</style>
