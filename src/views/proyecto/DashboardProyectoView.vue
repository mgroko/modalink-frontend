<template>
  <div class="dashboard-proyecto">
    <div v-if="cargando" class="dashboard-proyecto__estado">
      <span class="material-symbols-outlined dashboard-proyecto__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <template v-else>
      <BaseAlert v-if="mensajeError && !estadoNoEncontrado" :message="mensajeError" type="error" />

      <div v-if="puedeReintentar" class="dashboard-proyecto__reintento">
        <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
          Reintentar
        </VaButton>
      </div>

      <section v-if="estadoNoEncontrado" class="dashboard-proyecto__estado">
        <span class="material-symbols-outlined dashboard-proyecto__estado-icono">folder_open</span>
        <p class="dashboard-proyecto__estado-titulo">Proyecto no encontrado</p>
        <p class="dashboard-proyecto__estado-texto">
          {{ mensajeError || "No encontramos el proyecto que estás buscando." }}
        </p>
        <VaButton preset="secondary" @click="irAProyectos">Volver a Proyectos</VaButton>
      </section>

      <div v-else-if="mostrarVolver && !proyecto" class="dashboard-proyecto__reintento">
        <VaButton preset="secondary" @click="irAProyectos">Volver a Proyectos</VaButton>
      </div>

      <template v-if="proyecto">
        <ProyectoEncabezado
          :proyecto="proyecto"
          :tab-activa="tabActiva"
          :mostrar-planificacion="esMiembro"
          @cambiar-tab="cambiarTab"
        >
          <template #acciones>
            <VaButton
              v-if="puedeEditar"
              preset="secondary"
              :disabled="!puedeModificar"
              :title="puedeModificar ? 'Modificar proyecto' : motivoNoEditable"
              @click="irAModificar"
            >
              Editar
            </VaButton>
            <VaButton
              v-if="puedePublicar"
              preset="primary"
              class="btn-publicar"
              :disabled="publicando || !tieneFechaEntrega"
              :loading="publicando"
              :title="
                tieneFechaEntrega
                  ? 'Publicar proyecto'
                  : 'Definí la fecha de entrega para publicar el proyecto'
              "
              @click="abrirPublicacion"
            >
              Publicar
            </VaButton>
            <VaButton
              v-if="puedeConfirmarProyecto"
              preset="primary"
              :disabled="confirmandoProyecto"
              :loading="confirmandoProyecto"
              @click="abrirConfirmacion"
            >
              Confirmar proyecto
            </VaButton>
          </template>
        </ProyectoEncabezado>

        <BaseAlert
          v-if="esCancelado"
          :message="mensajeCancelacion"
          type="error"
          class="dashboard-proyecto__banner-cancelado"
        />

        <template v-if="tabActiva === 'informacion'">
          <section class="dashboard-proyecto__panel">
            <h2 class="dashboard-proyecto__titulo">Datos generales</h2>
            <p class="dashboard-proyecto__parrafo">{{ proyecto.descripcion }}</p>

            <div class="dashboard-proyecto__grilla">
              <div class="dashboard-proyecto__dato">
                <span class="dashboard-proyecto__dato-label">Privacidad</span>
                <span class="dashboard-proyecto__dato-valor">
                  {{ ETIQUETAS_PRIVACIDAD[proyecto.privacidad] || proyecto.privacidad }}
                </span>
                <span v-if="esPrivado" class="dashboard-proyecto__dato-hint">
                  Visible solo para tus perfiles miembros
                </span>
              </div>

              <div class="dashboard-proyecto__dato">
                <span class="dashboard-proyecto__dato-label">Ubicación</span>
                <span class="dashboard-proyecto__dato-valor">{{ ubicacionTexto }}</span>
              </div>

              <div class="dashboard-proyecto__dato">
                <span class="dashboard-proyecto__dato-label">Fecha de entrega</span>
                <span class="dashboard-proyecto__dato-valor">
                  {{ formatearFechaCorta(proyecto.fechaEntregaEstipulada) }}
                </span>
              </div>

              <div class="dashboard-proyecto__dato">
                <span class="dashboard-proyecto__dato-label">Fecha de inicio</span>
                <span class="dashboard-proyecto__dato-valor">
                  {{ formatearFechaCorta(proyecto.fechaInicio) }}
                </span>
              </div>

              <div class="dashboard-proyecto__dato">
                <span class="dashboard-proyecto__dato-label">Director</span>
                <span class="dashboard-proyecto__dato-valor">
                  {{ proyecto.nombreDirector || "—" }}
                </span>
              </div>

              <div v-if="proyecto.aceptaPostulacionGral" class="dashboard-proyecto__dato">
                <span class="dashboard-proyecto__dato-label">Postulaciones</span>
                <span class="dashboard-proyecto__chip-postulaciones">Acepta postulaciones</span>
              </div>
            </div>
          </section>

          <section class="dashboard-proyecto__panel">
            <h2 class="dashboard-proyecto__titulo">Objetivos</h2>
            <div
              v-if="(proyecto.objetivos || []).length"
              class="dashboard-proyecto__objetivos"
            >
              <article
                v-for="objetivo in proyecto.objetivos"
                :key="objetivo.idObjetivo"
                class="dashboard-proyecto__objetivo"
              >
                <p class="dashboard-proyecto__objetivo-nombre">{{ objetivo.nombre }}</p>
                <p v-if="objetivo.descripcion" class="dashboard-proyecto__objetivo-desc">
                  {{ objetivo.descripcion }}
                </p>
              </article>
            </div>
            <p v-else class="dashboard-proyecto__vacio">
              Este proyecto no tiene objetivos cargados.
            </p>
          </section>

          <section class="dashboard-proyecto__panel">
            <h2 class="dashboard-proyecto__titulo">Personal requerido</h2>
            <div
              v-if="(proyecto.requerimientosGral || []).length"
              class="dashboard-proyecto__requerimientos"
            >
              <RequerimientoCard
                v-for="requerimiento in proyecto.requerimientosGral"
                :key="requerimiento.idRequerimientoGral"
                :requerimiento="requerimiento"
                :habilidades="habilidades"
                :catalogo-caracteristicas="catalogosCaracteristicas[requerimiento.idProfesion] || null"
              />
            </div>
            <p v-else class="dashboard-proyecto__vacio">
              Este proyecto no tiene personal requerido cargado.
            </p>
          </section>

          <section v-if="proyecto.moodboard" class="dashboard-proyecto__panel">
            <h2 class="dashboard-proyecto__titulo">Moodboard</h2>

            <CollageMoodboard
              v-if="imagenesMoodboard.length"
              :imagenes="imagenesMoodboard"
              solo-lectura
              @ampliar="galeriaAbierta = true"
            />
            <p v-else class="dashboard-proyecto__contador">
              0 de {{ MOODBOARD_IMAGENES.MAX_IMAGENES }} imágenes
            </p>

            <p v-if="proyecto.moodboard.descripcion" class="dashboard-proyecto__parrafo">
              {{ proyecto.moodboard.descripcion }}
            </p>
          </section>

          <section
            v-if="puedeCancelar"
            class="dashboard-proyecto__panel dashboard-proyecto__peligro"
          >
            <h2 class="dashboard-proyecto__titulo">Zona de peligro</h2>
            <p class="dashboard-proyecto__parrafo">
              Cancelar el proyecto es irreversible: se cancelarán las actividades
              pendientes o en curso y se rechazarán las postulaciones e
              invitaciones pendientes.
            </p>
            <VaButton
              color="danger"
              class="dashboard-proyecto__peligro-boton"
              @click="abrirCancelacion"
            >
              Cancelar proyecto
            </VaButton>
          </section>
        </template>

        <PlanificacionProyecto
          v-else-if="tabActiva === 'planificacion' && esMiembro"
          :proyecto="proyecto"
          :id-actividad-resaltada="idActividadResaltada"
          :token-refresco="tokenRefrescoPlanificacion"
          @crear-actividad="irACrearActividad"
          @editar-actividad="irAEditarActividad"
          @ir-modificar-proyecto="irAModificar"
          @limpiar-resaltado="limpiarActividadResaltada"
          @eliminar-actividad="abrirModalEliminarActividad"
          @asignar-actividad="abrirModalAsignar"
        />

        <template v-else-if="tabActiva === 'postulaciones'">
          <template v-if="puedeGestionarPostulaciones">
            <h2 class="dashboard-proyecto__titulo">Postulaciones del proyecto</h2>
            <GestionPostulaciones
              :id-proyecto="idProyecto"
              :nombre-proyecto="proyecto.nombre"
              :sin-fecha-entrega="!tieneFechaEntrega"
              @gestionada="cargar"
            />
          </template>

          <PersonalRequerido
            v-else
            ref="personalRequerido"
            :proyecto="proyecto"
            :id-proyecto="idProyecto"
            :habilidades="habilidades"
            :catalogos-caracteristicas="catalogosCaracteristicas"
            :postulaciones-enviadas="postulacionesEnviadas"
            :requerimientos-sin-cupo="requerimientosSinCupo"
            :enviando-clave="claveEnviando"
            :puede-postular="tieneFechaEntrega"
            @postular="abrirPostulacion"
            @ver-actividad="irADetalleActividad"
          />
        </template>

        <ModalEliminarActividad
          :model-value="modalEliminarActividadVisible"
          :actividad="actividadEliminar"
          :eliminando="eliminandoActividad"
          :error="errorEliminarActividad"
          @update:modelValue="onCambioVisibilidadEliminar"
          @limpiar-error="errorEliminarActividad = ''"
          @confirmar="confirmarEliminarActividad"
        />

        <ModalGaleriaMoodboard
          :model-value="galeriaAbierta"
          :imagenes="imagenesMoodboard"
          solo-lectura
          @update:modelValue="galeriaAbierta = $event"
        />

        <ModalPublicarProyecto
          :model-value="modalPublicarVisible"
          :privacidad="proyecto.privacidad"
          :publicando="publicando"
          :error="errorPublicacion"
          @update:modelValue="modalPublicarVisible = $event"
          @confirmar="confirmarPublicacion"
        />

        <ModalConfirmarProyecto
          :model-value="modalConfirmacionVisible"
          :preview="previewConfirmacion"
          :cargando-preview="cargandoPreviewConfirmacion"
          :actualizando-preview="actualizandoPreviewConfirmacion"
          :error-preview="errorPreviewConfirmacion"
          :puede-reintentar-preview="puedeReintentarPreviewConfirmacion"
          :confirmando="confirmandoProyecto"
          :error-confirmacion="errorConfirmacion"
          @update:modelValue="onCambioVisibilidadConfirmacion"
          @confirmar="confirmarProyecto"
          @reintentar="reintentarPreviewConfirmacion"
        />

        <ModalCancelarProyecto
          :model-value="modalCancelarVisible"
          :nombre-proyecto="proyecto.nombre"
          :cancelando="cancelando"
          :error="errorCancelacion"
          @update:modelValue="modalCancelarVisible = $event"
          @confirmar="confirmarCancelacion"
        />

        <ModalAsignarActividad
          :model-value="modalAsignarVisible"
          :id-proyecto="idProyecto"
          :actividad="actividadAsignar"
          :nombre-proyecto="proyecto.nombre"
          :id-perfiles-asignados="perfilesAsignadosActividad"
          :tiene-fecha-entrega="tieneFechaEntrega"
          :asignando="asignando"
          :error="errorAsignar"
          :token-refresco-miembros="tokenRefrescoMiembros"
          :token-refresco-disponibilidad="tokenRefrescoDisponibilidad"
          @update:model-value="onCambioVisibilidadAsignar"
          @confirmar="confirmarAsignacion"
        />

        <ModalPostulacion
          :model-value="modalPostulacion.visible"
          :id-proyecto="idProyecto"
          :tipo="modalPostulacion.tipo"
          :nombre-proyecto="proyecto.nombre"
          :requerimiento="modalPostulacion.requerimiento"
          :actividad="modalPostulacion.actividad"
          :sin-fecha-entrega="!tieneFechaEntrega"
          :enviando="enviandoPostulacion"
          :error="errorPostulacion"
          :sugerir-calendario="errorPostulacionEsDisponibilidad"
          @update:model-value="modalPostulacion.visible = $event"
          @confirmar="confirmarPostulacion"
          @revisar-calendario="irACalendario"
        />
      </template>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService";
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import { idPerfilActivo, refrescarSesion } from "../../services/authState";
import { cargarResumenPerfil } from "../../services/notificacionState";
import BaseAlert from "../../components/AlertaBase.vue";
import ProyectoEncabezado from "../../components/proyecto/ProyectoEncabezado.vue";
import PlanificacionProyecto from "../../components/proyecto/PlanificacionProyecto.vue";
import PersonalRequerido from "../../components/proyecto/PersonalRequerido.vue";
import RequerimientoCard from "../../components/proyecto/RequerimientoCard.vue";
import GestionPostulaciones from "../../components/proyecto/GestionPostulaciones.vue";
import CollageMoodboard from "../../components/proyecto/CollageMoodboard.vue";
import ModalGaleriaMoodboard from "../../components/proyecto/ModalGaleriaMoodboard.vue";
import ModalPublicarProyecto from "../../components/proyecto/ModalPublicarProyecto.vue";
import ModalConfirmarProyecto from "../../components/proyecto/ModalConfirmarProyecto.vue";
import ModalCancelarProyecto from "../../components/proyecto/ModalCancelarProyecto.vue";
import ModalEliminarActividad from "../../components/proyecto/ModalEliminarActividad.vue";
import ModalAsignarActividad from "../../components/proyecto/ModalAsignarActividad.vue";
import ModalPostulacion from "../../components/proyecto/ModalPostulacion.vue";
import actividadService from "../../services/actividadService.js";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  TIPOS_ERROR_ASIGNACION,
  clasificarErrorAsignacion,
  mensajeExitoAsignacion,
  perfilesAsignadosDe,
  puedeAsignarActividad,
} from "../../utils/asignacionConstants.js";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  CODIGOS_CONFIRMACION,
  clasificarErrorConfirmacion,
  normalizarPreview,
} from "../../utils/confirmacionConstants.js";
import {
  AVISO_DISPONIBILIDAD_PROVISORIA,
  TIPOS_POSTULACION,
  clavePostulacion,
  esErrorCupoCompleto,
  esErrorDisponibilidad,
  esErrorPostulacionDuplicada,
  mensajeExitoPostulacion,
  puedePostularActividad as esActividadPostulable,
  puedePostularGeneral as esElegibleParaPostularGeneral,
} from "../../utils/postulacionConstants.js";
import {
  ETIQUETAS_PRIVACIDAD,
  ESTADOS_PROYECTO,
  MOODBOARD_IMAGENES,
  PRIVACIDADES,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

// Cancela la request en vuelo si cambia el id o se reintenta
// (no reactivo a propósito: AbortController no debe pasar por reactive()).
let controladorCarga = null;
let controladorPublicacion = null;
let controladorCancelacion = null;
let controladorEliminacion = null;
let controladorDetalleEliminacion = null;
let controladorAsignacion = null;
let controladorPostulacion = null;
let controladorConfirmacion = null;

export default {
  name: "DashboardProyectoView",
  components: {
    BaseAlert,
    ProyectoEncabezado,
    PlanificacionProyecto,
    PersonalRequerido,
    RequerimientoCard,
    GestionPostulaciones,
    CollageMoodboard,
    ModalGaleriaMoodboard,
    ModalPublicarProyecto,
    ModalConfirmarProyecto,
    ModalCancelarProyecto,
    ModalEliminarActividad,
    ModalAsignarActividad,
    ModalPostulacion,
  },
  setup() {
    return { toast: useToast() };
  },
data() {
    return {
      ETIQUETAS_PRIVACIDAD,
      MOODBOARD_IMAGENES,
      TIPOS_POSTULACION,
      proyecto: null,
      cargando: true,
      mensajeError: "",
      podeReintentar: false,
      estadoNoEncontrado: false,
      mostrarVolver: false,
      habilidades: [],
      catalogosCaracteristicas: {},
      galeriaAbierta: false,
      modalPublicarVisible: false,
      publicando: false,
      errorPublicacion: "",
      modalCancelarVisible: false,
      cancelando: false,
      errorCancelacion: "",
      modalConfirmacionVisible: false,
      previewConfirmacion: null,
      cargandoPreviewConfirmacion: false,
      actualizandoPreviewConfirmacion: false,
      errorPreviewConfirmacion: "",
      puedeReintentarPreviewConfirmacion: false,
      confirmandoProyecto: false,
      errorConfirmacion: "",
      fechaInicioConfirmacion: null,
      idCargaPreviewConfirmacion: 0,
      modalPostulacion: {
        visible: false,
        tipo: TIPOS_POSTULACION.GENERAL,
        requerimiento: null,
        actividad: null,
      },
      enviandoPostulacion: false,
      claveEnviando: "",
      errorPostulacion: "",
      errorPostulacionEsDisponibilidad: false,
      postulacionesEnviadas: {},
      /** Requerimientos marcados sin cupo tras un 409 de cupo completo. */
      requerimientosSinCupo: {},
      idCarga: 0,
      tabActiva: "informacion",
      idActividadResaltada: null,
      modalEliminarActividadVisible: false,
      actividadEliminar: {},
      eliminandoActividad: false,
      errorEliminarActividad: "",
      idCargaDetalleEliminacion: 0,
      modalAsignarVisible: false,
      actividadAsignar: null,
      perfilesAsignadosActividad: [],
      asignando: false,
      errorAsignar: "",
      tokenRefrescoMiembros: 0,
      tokenRefrescoDisponibilidad: 0,
      tokenRefrescoPlanificacion: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    permisos() {
      return this.proyecto?.permisos || [];
    },
    esMiembro() {
      return !!this.proyecto?.esMiembro;
    },
    esBorrador() {
      return normalizarEstadoProyecto(this.proyecto?.estado) === ESTADOS_PROYECTO.BORRADOR;
    },
    esPrivado() {
      return this.proyecto?.privacidad === PRIVACIDADES.PRIVADO;
    },
    /** La fecha de entrega es obligatoria para publicar y calcular CPM. */
    tieneFechaEntrega() {
      return !!this.proyecto?.fechaEntregaEstipulada;
    },
    puedeEditar() {
      return this.permisos.includes("MODIFICAR_PROYECTO");
    },
    estadoModificable() {
      const estado = normalizarEstadoProyecto(this.proyecto?.estado);
      return ![ESTADOS_PROYECTO.FINALIZADO, ESTADOS_PROYECTO.CANCELADO].includes(estado);
    },
    puedeModificar() {
      return this.esMiembro && this.puedeEditar && this.estadoModificable;
    },
    motivoNoEditable() {
      return this.estadoModificable
        ? "No tenés permiso para modificar este proyecto."
        : `El proyecto ${normalizarEstadoProyecto(this.proyecto?.estado)?.toLowerCase()} no se puede modificar.`;
    },
    puedePublicar() {
      return this.permisos.includes("PUBLICAR_PROYECTO") && this.esBorrador;
    },
    /** UC-60 §5.2: el sistema valida permiso y director; acá se combina con estado. */
    puedeConfirmarProyecto() {
      return (
        this.esMiembro &&
        this.permisos.includes("CONFIRMAR_PROYECTO") &&
        normalizarEstadoProyecto(this.proyecto?.estado) ===
          ESTADOS_PROYECTO.PUBLICADO
      );
    },
    esCancelado() {
      return normalizarEstadoProyecto(this.proyecto?.estado) === ESTADOS_PROYECTO.CANCELADO;
    },
    /** UC-35 §8.1: combinar permiso con estado (los permisos son del rol). */
    puedeCancelar() {
      const estado = normalizarEstadoProyecto(this.proyecto?.estado);
      return (
        this.permisos.includes("CANCELAR_PROYECTO") &&
        [ESTADOS_PROYECTO.PUBLICADO, ESTADOS_PROYECTO.CONFIRMADO].includes(estado)
      );
    },
    mensajeCancelacion() {
      const motivo = String(this.proyecto?.motivoCancelacion || "").trim();
      return motivo
        ? `Proyecto cancelado. Motivo: ${motivo}`
        : "Proyecto cancelado. Sin motivo registrado.";
    },
    /** UC-34: sólo el director con GESTIONAR_POSTULACIONES gestiona postulaciones. */
    puedeGestionarPostulaciones() {
      return (
        this.proyecto?.rolUsuario === ROLES_PROYECTO.DIRECTOR &&
        this.permisos.includes("GESTIONAR_POSTULACIONES")
      );
    },
    ubicacionTexto() {
      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      if (ciudad && provincia) return `${ciudad}, ${provincia}`;
      return ciudad || provincia || "—";
    },
    /** Items del wizard ({id, nombre, preview}) desde las imágenes de la API. */
    imagenesMoodboard() {
      const imagenes = this.proyecto?.moodboard?.imagenes || [];
      return imagenes.map((imagen, indice) => ({
        id: imagen.idImagen,
        nombre: `Imagen ${indice + 1}`,
        preview: resolverFotoUrl(imagen.url),
      }));
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.proyecto = null;
      this.postulacionesEnviadas = {};
      this.requerimientosSinCupo = {};
      this.modalPostulacion = {
        visible: false,
        tipo: TIPOS_POSTULACION.GENERAL,
        requerimiento: null,
        actividad: null,
      };
      this.enviandoPostulacion = false;
      this.claveEnviando = "";
      this.errorPostulacion = "";
      this.errorPostulacionEsDisponibilidad = false;
      if (controladorPostulacion) {
        controladorPostulacion.abort();
        controladorPostulacion = null;
      }
      this.modalAsignarVisible = false;
      this.actividadAsignar = null;
      this.perfilesAsignadosActividad = [];
      this.asignando = false;
      this.errorAsignar = "";
      this.modalEliminarActividadVisible = false;
      this.actividadEliminar = {};
      this.eliminandoActividad = false;
      this.errorEliminarActividad = "";
      this.idCargaDetalleEliminacion++;
      if (controladorDetalleEliminacion) {
        controladorDetalleEliminacion.abort();
        controladorDetalleEliminacion = null;
      }
      if (controladorEliminacion) {
        controladorEliminacion.abort();
        controladorEliminacion = null;
      }
      this.tokenRefrescoMiembros = 0;
      this.tokenRefrescoDisponibilidad = 0;
      if (controladorAsignacion) {
        controladorAsignacion.abort();
        controladorAsignacion = null;
      }
      this.modalConfirmacionVisible = false;
      this.previewConfirmacion = null;
      this.cargandoPreviewConfirmacion = false;
      this.actualizandoPreviewConfirmacion = false;
      this.errorPreviewConfirmacion = "";
      this.puedeReintentarPreviewConfirmacion = false;
      this.confirmandoProyecto = false;
      this.errorConfirmacion = "";
      this.fechaInicioConfirmacion = null;
      this.idCargaPreviewConfirmacion++;
      if (controladorConfirmacion) {
        controladorConfirmacion.abort();
        controladorConfirmacion = null;
      }
      this.cargar();
    },
    "$route.query.tab"() {
      this.aplicarTabDesdeQuery();
    },
    "$route.query.nueva"() {
      this.actualizarActividadResaltada();
    },
    "$route.query.editada"() {
      this.actualizarActividadResaltada();
    },
    "$route.query.actividad"() {
      this.actualizarActividadResaltada();
    },
    esMiembro(valor) {
      if (!valor) {
        if (this.tabActiva === "planificacion") this.tabActiva = "informacion";
        this.aplicarTabDesdeQuery();
        return;
      }
      this.aplicarTabDesdeQuery();
    },
  },
  created() {
    // Pintado inmediato opcional desde history.state (CrearProyectoView);
    // la fuente sigue siendo el fetch de cargar() — ver ficha §7.2.
    const estado = window.history.state || {};
    if (estado.proyecto && String(estado.proyecto.idProyecto) === String(this.idProyecto)) {
      this.proyecto = estado.proyecto;
      this.cargando = false;
    }
    this.aplicarTabDesdeQuery();
    this.actualizarActividadResaltada();
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    formatearFechaCorta,
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      // Con precarga visible no se tapa con spinner; sin datos, spinner.
      this.cargando = !this.proyecto;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.estadoNoEncontrado = false;
      this.mostrarVolver = false;

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;
        this.proyecto = response?.data || null;
        if (!this.proyecto) {
          this.estadoNoEncontrado = true;
          this.mostrarVolver = true;
          return;
        }
        await this.cargarCatalogos(this.proyecto, corrida);
      } catch (error) {
        if (
          corrida !== this.idCarga ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    /**
     * Catálogos para traducir ids → nombres (ficha §3.2): habilidades y
     * características por profesión. Si un catálogo no está disponible la vista
     * degrada (chips sin traducir) sin bloquear la carga del proyecto.
     */
    async cargarCatalogos(proyecto, corrida) {
      const requerimientos = Array.isArray(proyecto.requerimientosGral)
        ? proyecto.requerimientosGral
        : [];
      const idsProfesion = [
        ...new Set(requerimientos.map((r) => r?.idProfesion).filter(Boolean)),
      ];

      const resultados = await Promise.allSettled([
        habilidadService.listar(),
        ...idsProfesion.map((id) => perfilService.caracteristicasPorProfesion(id)),
      ]);
      // La navegación pudo cambiar el id mientras cargaban los catálogos.
      if (corrida !== this.idCarga) return;

      const habilidadesRes = resultados[0];
      const datosHabilidades =
        habilidadesRes.status === "fulfilled" ? habilidadesRes.value?.data : null;
      this.habilidades = Array.isArray(datosHabilidades)
        ? datosHabilidades
        : datosHabilidades?.habilidades || [];

      const catalogos = {};
      idsProfesion.forEach((id, i) => {
        const resultado = resultados[i + 1];
        if (resultado?.status !== "fulfilled") {
          catalogos[id] = null;
          return;
        }
        const datos = resultado.value?.data;
        catalogos[id] = Array.isArray(datos) ? datos : datos?.caracteristicas || [];
      });
      this.catalogosCaracteristicas = catalogos;
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.proyecto = null;

      const clasificacion = clasificarErrorProyecto(error);

      if (clasificacion?.tipo === "perfil-activo") {
        this.mensajeError =
          "No hay un perfil activo seleccionado. Elegí un perfil para ver el proyecto.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion?.tipo === "perfil-no-encontrado") {
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (status === 403) {
        this.mensajeError = /perfil/i.test(mensaje)
          ? "El perfil no se encuentra activo."
          : "No tenés acceso a este proyecto: es privado o está en borrador y no sos miembro del equipo.";
        this.mostrarVolver = true;
        return;
      }

      if (status === 404) {
        if (/proyecto/i.test(mensaje)) {
          this.estadoNoEncontrado = true;
          this.mensajeError = mensaje;
          this.mostrarVolver = true;
          return;
        }
        this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el proyecto.");
        return;
      }

      if (status === 409 || clasificacion?.tipo === "perfil-baja") {
        this.mensajeError = "El perfil no se encuentra activo.";
        this.mostrarVolver = true;
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError = "Ocurrió un error al cargar el proyecto. Inténtalo nuevamente.";
        this.toast.init({
          title: "Error del servidor",
          message: "No se pudo cargar el proyecto. Usá el botón de reintento.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar el proyecto."
      );
      this.mostrarVolver = true;
    },
    reintentar() {
      this.cargar();
    },
    aplicarTabDesdeQuery() {
      const solicitada = this.$route.query.tab;
      const permitidas = ["informacion", "planificacion", "postulaciones"];
      const tab = permitidas.includes(solicitada) ? solicitada : "informacion";

      if (tab === "planificacion" && !this.esMiembro) {
        this.tabActiva = "informacion";
        return;
      }
      this.tabActiva = tab;
    },
    actualizarActividadResaltada() {
      const valor = Number(
        this.$route.query.nueva ??
          this.$route.query.editada ??
          this.$route.query.actividad
      );
      this.idActividadResaltada =
        Number.isFinite(valor) && valor > 0 ? valor : null;
    },
    reemplazarQuery(query) {
      this.$router
        .replace({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
          query,
        })
        .catch(() => {});
    },
    cambiarTab(tab) {
      if (tab === "planificacion" && !this.esMiembro) return;
      if (this.tabActiva === tab) return;

      this.tabActiva = tab;
      const query = { ...this.$route.query };
      if (tab === "informacion") delete query.tab;
      else query.tab = tab;
      this.reemplazarQuery(query);
    },
    limpiarActividadResaltada() {
      this.idActividadResaltada = null;

      // Limpiar las tres claves, no solo nueva/editada: las notificaciones de
      // actividad llegan con `?actividad=...` y también deben quedar limpias.
      const claves = ["nueva", "editada", "actividad"];
      if (!claves.some((clave) => this.$route.query[clave] !== undefined)) {
        return;
      }

      const query = { ...this.$route.query };
      claves.forEach((clave) => delete query[clave]);
      this.reemplazarQuery(query);
    },
    irACrearActividad() {
      if (!this.esMiembro) return;
      this.$router.push({
        name: "crear-actividad",
        params: { id: this.idProyecto },
      });
    },
    irAEditarActividad(actividad) {
      if (
        !this.esMiembro ||
        !this.permisos.includes("MODIFICAR_ACTIVIDAD") ||
        !actividad?.idActividad
      ) {
        return;
      }
      this.$router.push({
        name: "modificar-actividad",
        params: {
          id: this.idProyecto,
          idActividad: actividad.idActividad,
        },
      });
    },
    irAModificar() {
      if (!this.puedeModificar) return;
      this.$router.push({
        name: "modificar-proyecto",
        params: { id: this.idProyecto },
      });
    },
    abrirPublicacion() {
      if (!this.tieneFechaEntrega) return;
      this.errorPublicacion = "";
      this.modalPublicarVisible = true;
    },
    /** UC-25: confirma la publicación desde el modal. */
    async confirmarPublicacion() {
      if (this.publicando) return;
      this.publicando = true;
      this.errorPublicacion = "";
      if (controladorPublicacion) controladorPublicacion.abort();
      controladorPublicacion = new AbortController();
      try {
        const response = await proyectoService.publicar(
          this.idProyecto,
          controladorPublicacion.signal
        );
        this.modalPublicarVisible = false;
        // Reemplaza los datos locales con la respuesta (§4.2): estado → Publicado
        // y el botón Publicar desaparece.
        this.proyecto = response?.data || this.proyecto;
        this.toast.init({
          title: "Proyecto publicado",
          message: "El proyecto ya está visible según su privacidad.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        this.manejarErrorPublicacion(error);
      } finally {
        this.publicando = false;
      }
    },
    manejarErrorPublicacion(error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      // 400: información básica incompleta — el modal permanece abierto
      // mostrando el detalle de campos faltantes.
      if (status === 400) {
        const partes = [];
        const mensaje = data?.mensaje || data?.message;
        if (mensaje) partes.push(mensaje);
        const campos = Array.isArray(data?.campos) ? data.campos : [];
        if (campos.length) partes.push(`Faltan completar: ${campos.join(", ")}.`);
        const errores = data?.errores && typeof data.errores === "object" ? data.errores : null;
        if (errores) partes.push(Object.values(errores).join(" "));
        this.errorPublicacion =
          partes.join(" ") || "La información básica del proyecto está incompleta.";
        return;
      }

      // 409: estado ≠ Borrador (o perfil en baja) — refrescar los datos.
      if (status === 409) {
        this.modalPublicarVisible = false;
        this.cargar();
        return;
      }

      if (!status || status >= 500) {
        this.modalPublicarVisible = false;
        this.toast.init({
          title: "Error del servidor",
          message: "No se pudo publicar el proyecto. Inténtalo nuevamente.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      this.errorPublicacion = mensajeErrorApi(error, "No se pudo publicar el proyecto.");
    },
    abrirCancelacion() {
      this.errorCancelacion = "";
      this.modalCancelarVisible = true;
    },
    /** UC-35: confirma la cancelación desde el modal. */
    async confirmarCancelacion(motivo) {
      if (this.cancelando) return;
      this.cancelando = true;
      this.errorCancelacion = "";
      if (controladorCancelacion) controladorCancelacion.abort();
      controladorCancelacion = new AbortController();
      try {
        const response = await proyectoService.cancelar(
          this.idProyecto,
          motivo,
          controladorCancelacion.signal
        );
        // §8.3: reemplaza el estado local con la respuesta (estado Cancelado
        // y motivo). La zona de peligro desaparece y se muestra el banner.
        this.proyecto = response?.data || this.proyecto;
        this.modalCancelarVisible = false;
        this.toast.init({
          title: "Proyecto cancelado",
          message: "El proyecto fue cancelado correctamente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        await this.manejarErrorCancelacion(error);
      } finally {
        this.cancelando = false;
      }
    },
    async manejarErrorCancelacion(error) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const mensaje = data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      // §7.3 / §8.2: el modal sigue abierto y conserva el motivo.
      if (status === 400) {
        const errores = data?.errores && typeof data.errores === "object" ? data.errores : null;
        this.errorCancelacion =
          errores?.motivoCancelacion ||
          mensaje ||
          "El motivo de cancelación es obligatorio.";
        return;
      }

      if (status === 403) {
        this.modalCancelarVisible = false;
        this.toast.init({
          title: "No se pudo cancelar",
          message: /perfil/i.test(mensaje)
            ? "El perfil no se encuentra activo."
            : mensaje ||
              "No tenés permiso para cancelar este proyecto o no sos miembro activo.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.cargar();
        return;
      }

      if (status === 404) {
        this.modalCancelarVisible = false;

        if (clasificacion?.tipo === "perfil-activo") {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (clasificacion?.tipo === "perfil-no-encontrado") {
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (/proyecto/i.test(mensaje)) {
          this.proyecto = null;
          this.estadoNoEncontrado = true;
          this.mensajeError = mensaje;
          this.mostrarVolver = true;
          return;
        }

        this.errorCancelacion = mensajeErrorApi(error, "No se pudo cancelar el proyecto.");
        return;
      }

      if (status === 409) {
        // §8.4: cerrar el modal, mostrar el mensaje y refrescar el proyecto.
        this.modalCancelarVisible = false;
        this.toast.init({
          title: /perfil/i.test(mensaje) ? "Perfil inactivo" : "No se pudo cancelar",
          message:
            mensaje ||
            (clasificacion?.tipo === "estado-no-cancelable"
              ? "El proyecto ya no se encuentra en un estado cancelable."
              : "El proyecto ya no se puede cancelar."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.cargar();
        return;
      }

      if (!status || status >= 500) {
        this.errorCancelacion =
          "Ocurrió un error al cancelar el proyecto. Inténtalo nuevamente.";
        return;
      }

      this.errorCancelacion = mensajeErrorApi(
        error,
        "No se pudo cancelar el proyecto."
      );
    },
    /** UC-60 §5.1: abre el diálogo y consulta el preview (solo lectura). */
    abrirConfirmacion() {
      if (!this.puedeConfirmarProyecto || this.confirmandoProyecto) return;
      this.errorConfirmacion = "";
      this.modalConfirmacionVisible = true;
      this.cargarPreviewConfirmacion("inicial");
    },
    onCambioVisibilidadConfirmacion(valor) {
      if (valor) {
        this.modalConfirmacionVisible = true;
        return;
      }
      if (this.confirmandoProyecto) return;

      this.modalConfirmacionVisible = false;
      this.idCargaPreviewConfirmacion++;
      if (controladorConfirmacion) {
        controladorConfirmacion.abort();
        controladorConfirmacion = null;
      }
      this.previewConfirmacion = null;
      this.cargandoPreviewConfirmacion = false;
      this.actualizandoPreviewConfirmacion = false;
      this.errorPreviewConfirmacion = "";
      this.puedeReintentarPreviewConfirmacion = false;
      this.errorConfirmacion = "";
    },
    reintentarPreviewConfirmacion() {
      this.cargarPreviewConfirmacion("inicial");
    },
    /**
     * GET /proyectos/{id}/confirmacion. Con `modo = "refresco"` reconsulta sin
     * vaciar el contenido: se usa después de un 409 de bloqueo para que el
     * modal siga mostrando los bloqueos mientras se actualiza.
     */
    async cargarPreviewConfirmacion(modo = "inicial") {
      if (this.confirmandoProyecto) return;
      const inicial = modo === "inicial";
      const corrida = ++this.idCargaPreviewConfirmacion;

      if (controladorConfirmacion) controladorConfirmacion.abort();
      controladorConfirmacion = new AbortController();

      if (inicial) {
        this.previewConfirmacion = null;
        this.cargandoPreviewConfirmacion = true;
      } else {
        this.actualizandoPreviewConfirmacion = true;
      }
      this.errorPreviewConfirmacion = "";
      this.puedeReintentarPreviewConfirmacion = false;

      try {
        const response = await proyectoService.previsualizarConfirmacion(
          this.idProyecto,
          controladorConfirmacion.signal
        );
        if (corrida !== this.idCargaPreviewConfirmacion) return;
        this.previewConfirmacion = normalizarPreview(response?.data);
        this.errorConfirmacion = "";
      } catch (error) {
        if (
          corrida !== this.idCargaPreviewConfirmacion ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.manejarErrorPreviewConfirmacion(error);
      } finally {
        if (corrida === this.idCargaPreviewConfirmacion) {
          this.cargandoPreviewConfirmacion = false;
          this.actualizandoPreviewConfirmacion = false;
        }
      }
    },
    manejarErrorPreviewConfirmacion(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorConfirmacion(error);
      const mensaje = clasificacion.mensaje;

      if (status === 403) {
        this.modalConfirmacionVisible = false;
        this.toast.init({
          title: "No se pudo verificar",
          message:
            mensaje ||
            "No tenés permiso para confirmar este proyecto o no sos miembro activo.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.cargar();
        return;
      }

      if (status === 404) {
        this.modalConfirmacionVisible = false;

        if (
          clasificacion.codigo ===
            CODIGOS_CONFIRMACION.PERFIL_ACTIVO_NO_SELECCIONADO ||
          /perfil\s*activo/i.test(mensaje)
        ) {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (
          clasificacion.codigo ===
            CODIGOS_CONFIRMACION.PROYECTO_NO_ENCONTRADO ||
          /proyecto/i.test(mensaje)
        ) {
          this.proyecto = null;
          this.estadoNoEncontrado = true;
          this.mensajeError = mensaje || "El proyecto no existe.";
          this.mostrarVolver = true;
          return;
        }
      }

      // 500/red o 404 no contemplado: el modal queda abierto con reintento.
      this.errorPreviewConfirmacion = mensajeErrorApi(
        error,
        "No se pudo verificar el proyecto. Inténtalo nuevamente."
      );
      this.puedeReintentarPreviewConfirmacion = true;
    },
    /** UC-60: confirma y reemplaza el proyecto con la respuesta completa. */
    async confirmarProyecto() {
      if (this.confirmandoProyecto) return;
      if (this.previewConfirmacion?.puedeConfirmar !== true) return;

      this.confirmandoProyecto = true;
      this.errorConfirmacion = "";
      if (controladorConfirmacion) controladorConfirmacion.abort();
      controladorConfirmacion = new AbortController();

      try {
        const response = await proyectoService.confirmar(
          this.idProyecto,
          controladorConfirmacion.signal
        );
        const data = response?.data || {};
        this.fechaInicioConfirmacion = data.fechaInicioConfirmada || null;

        if (data.proyecto) {
          // Q1: la ficha devuelve un ProyectoResponse completo. Se conserva el
          // contexto del consultante por si el DTO del POST lo omite.
          this.proyecto = {
            ...data.proyecto,
            esMiembro: data.proyecto.esMiembro ?? this.proyecto?.esMiembro ?? false,
            rolUsuario: data.proyecto.rolUsuario ?? this.proyecto?.rolUsuario ?? null,
            permisos: Array.isArray(data.proyecto.permisos)
              ? data.proyecto.permisos
              : this.proyecto?.permisos || [],
          };
        } else {
          await this.cargar();
        }

        this.modalConfirmacionVisible = false;
        this.previewConfirmacion = null;
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion++;
        });
        this.refrescarNotificacionesPerfil();
        this.refrescarPersonalRequerido();

        const inicio = this.fechaInicioConfirmacion
          ? formatearFecha(this.fechaInicioConfirmacion)
          : "";
        this.toast.init({
          title: "Proyecto confirmado",
          message: inicio
            ? `El proyecto se confirmó y las actividades quedaron agendadas. Inicio: ${inicio}.`
            : "El proyecto se confirmó y las actividades quedaron agendadas.",
          color: "success",
          position: "top-right",
          duration: 6000,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorConfirmacion(error);
      } finally {
        this.confirmandoProyecto = false;
      }
    },
    async manejarErrorConfirmacion(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorConfirmacion(error);
      const mensaje = clasificacion.mensaje;

      if (status === 403) {
        this.modalConfirmacionVisible = false;
        this.toast.init({
          title: "No se pudo confirmar",
          message:
            mensaje ||
            "No tenés permiso para confirmar este proyecto o no sos miembro activo.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (status === 404) {
        this.modalConfirmacionVisible = false;

        if (
          clasificacion.codigo ===
            CODIGOS_CONFIRMACION.PERFIL_ACTIVO_NO_SELECCIONADO ||
          /perfil\s*activo/i.test(mensaje)
        ) {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (
          clasificacion.codigo ===
            CODIGOS_CONFIRMACION.PROYECTO_NO_ENCONTRADO ||
          /proyecto/i.test(mensaje)
        ) {
          this.proyecto = null;
          this.estadoNoEncontrado = true;
          this.mensajeError = mensaje || "El proyecto no existe.";
          this.mostrarVolver = true;
          return;
        }

        this.errorConfirmacion = mensajeErrorApi(
          error,
          "No se pudo confirmar el proyecto."
        );
        return;
      }

      if (status === 409) {
        // §5.3: cambio de estado → cerrar, avisar y refrescar proyecto/cronograma.
        if (clasificacion.esEstado) {
          this.modalConfirmacionVisible = false;
          this.toast.init({
            title: "No se pudo confirmar",
            message:
              mensaje ||
              "El proyecto ya no se encuentra en un estado confirmable.",
            color: "danger",
            position: "top-right",
            duration: 6000,
          });
          await this.cargar();
          await this.$nextTick(() => {
            this.tokenRefrescoPlanificacion++;
          });
          return;
        }

        // Bloqueo corregible: el modal sigue abierto y se reconsulta el preview.
        this.errorConfirmacion =
          mensaje || "El proyecto todavía no se puede confirmar.";
        const base = this.previewConfirmacion || normalizarPreview({});
        this.previewConfirmacion = {
          ...base,
          puedeConfirmar: false,
          bloqueos: clasificacion.bloqueos.length
            ? clasificacion.bloqueos
            : base.bloqueos,
        };
        // El POST ya terminó: liberar el guard antes de reconsultar.
        this.confirmandoProyecto = false;
        await this.cargarPreviewConfirmacion("refresco");
        return;
      }

      if (!status || status >= 500) {
        this.errorConfirmacion =
          "Ocurrió un error al confirmar el proyecto. Inténtalo nuevamente.";
        return;
      }

      this.errorConfirmacion = mensajeErrorApi(
        error,
        "No se pudo confirmar el proyecto."
      );
    },
    refrescarNotificacionesPerfil() {
      const idPerfil = idPerfilActivo();
      if (idPerfil == null) return;
      cargarResumenPerfil(idPerfil);
    },
    /** UC-26: despacha la postulación emitida por PersonalRequerido. */
    abrirPostulacion({ tipo, requerimiento, actividad } = {}) {
      if (tipo === TIPOS_POSTULACION.ACTIVIDAD) {
        this.abrirPostulacionActividad({ actividad, requerimiento });
        return;
      }
      this.abrirPostulacionGeneral(requerimiento);
    },
    /** UC-26: abre la confirmación de postulación a un requerimiento general. */
    abrirPostulacionGeneral(requerimiento) {
      if (!this.tieneFechaEntrega) return;
      const idRequerimiento = requerimiento?.idRequerimientoGral;
      if (idRequerimiento == null) return;
      if (this.estaSinCupo(TIPOS_POSTULACION.GENERAL, idRequerimiento)) return;
      if (!esElegibleParaPostularGeneral(this.proyecto, requerimiento)) return;

      const clave = clavePostulacion(
        TIPOS_POSTULACION.GENERAL,
        idRequerimiento
      );
      if (this.postulacionesEnviadas[clave]) return;

      this.errorPostulacion = "";
      this.errorPostulacionEsDisponibilidad = false;
      this.modalPostulacion = {
        visible: true,
        tipo: TIPOS_POSTULACION.GENERAL,
        requerimiento,
        actividad: null,
      };
    },
    /** UC-26: abre la confirmación de postulación a un requerimiento de actividad. */
    abrirPostulacionActividad({ actividad, requerimiento } = {}) {
      if (!this.tieneFechaEntrega) return;
      if (!esActividadPostulable(this.proyecto, actividad, requerimiento)) return;
      if (!requerimiento?.idRequerimiento) return;
      if (
        this.estaSinCupo(
          TIPOS_POSTULACION.ACTIVIDAD,
          requerimiento.idRequerimiento
        )
      ) {
        return;
      }

      const clave = clavePostulacion(
        TIPOS_POSTULACION.ACTIVIDAD,
        requerimiento.idRequerimiento
      );
      if (this.postulacionesEnviadas[clave]) return;

      this.errorPostulacion = "";
      this.errorPostulacionEsDisponibilidad = false;
      this.modalPostulacion = {
        visible: true,
        tipo: TIPOS_POSTULACION.ACTIVIDAD,
        requerimiento,
        actividad,
      };
    },
    /** Abre el detalle de la actividad desde el link "Ver actividad". */
    irADetalleActividad({ actividad } = {}) {
      if (!actividad?.idActividad) return;
      this.$router.push({
        name: "actividad-detalle",
        params: {
          id: this.idProyecto,
          idActividad: actividad.idActividad,
        },
      });
    },
    estaSinCupo(tipo, idRequerimiento) {
      const clave = clavePostulacion(tipo, idRequerimiento);
      return !!clave && !!this.requerimientosSinCupo[clave];
    },
    registrarPostulacionEnviada(tipo, idRequerimiento) {
      const clave = clavePostulacion(tipo, idRequerimiento);
      if (!clave) return;
      this.postulacionesEnviadas = {
        ...this.postulacionesEnviadas,
        [clave]: true,
      };
    },
    /**
     * Oculta la acción cuando el sistema respondió cupo completo aunque la
     * respuesta recargada todavía no traiga `satisfecho` (actividades).
     * La marca dura la sesión de la vista y se limpia al cambiar de proyecto.
     */
    registrarSinCupo(tipo, idRequerimiento) {
      const clave = clavePostulacion(tipo, idRequerimiento);
      if (!clave) return;
      this.requerimientosSinCupo = {
        ...this.requerimientosSinCupo,
        [clave]: true,
      };
    },
    /** UC-26: confirma la postulación del modal activo. */
    async confirmarPostulacion() {
      if (this.enviandoPostulacion) return;

      const { tipo, requerimiento, actividad } = this.modalPostulacion || {};
      if (!requerimiento) return;

      const idRequerimiento =
        tipo === TIPOS_POSTULACION.GENERAL
          ? requerimiento.idRequerimientoGral
          : requerimiento.idRequerimiento;
      if (idRequerimiento == null) return;

      this.enviandoPostulacion = true;
      this.claveEnviando = clavePostulacion(tipo, idRequerimiento);
      this.errorPostulacion = "";
      this.errorPostulacionEsDisponibilidad = false;

      if (controladorPostulacion) controladorPostulacion.abort();
      controladorPostulacion = new AbortController();

      try {
        const response =
          tipo === TIPOS_POSTULACION.GENERAL
            ? await proyectoService.postularARequerimientoGeneral(
                this.idProyecto,
                idRequerimiento,
                controladorPostulacion.signal
              )
            : await proyectoService.postularARequerimientoActividad(
                this.idProyecto,
                idRequerimiento,
                controladorPostulacion.signal
              );

        const data = response?.data || {};
        this.registrarPostulacionEnviada(tipo, idRequerimiento);
        this.modalPostulacion.visible = false;

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
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorPostulacion(error);
      } finally {
        this.enviandoPostulacion = false;
        this.claveEnviando = "";
      }
    },
    async manejarErrorPostulacion(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      // 400: error de negocio (por ejemplo, proyecto sin fecha de entrega).
      if (status === 400) {
        this.errorPostulacion =
          mensaje ||
          "No se pudo enviar la postulación. Revisá los datos e intentá nuevamente.";
        return;
      }

      // 401: el proyecto mantiene el comportamiento actual (cuenta no activa).
      if (status === 401) {
        this.modalPostulacion.visible = false;
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
          this.modalPostulacion.visible = false;
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (clasificacion?.tipo === "perfil-no-encontrado") {
          this.modalPostulacion.visible = false;
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        // Requerimiento inexistente o de otro proyecto: refrescar sin reintentar.
        this.modalPostulacion.visible = false;
        this.toast.init({
          title: "No se pudo postular",
          message: mensaje || "El requerimiento ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        this.refrescarPersonalRequerido();
        return;
      }

      if (status === 409) {
        // Sin disponibilidad: el modal queda abierto para leer el mensaje.
        if (esErrorDisponibilidad(error)) {
          this.errorPostulacion = mensaje;
          this.errorPostulacionEsDisponibilidad = true;
          this.refrescarPersonalRequerido();
          return;
        }

        if (esErrorPostulacionDuplicada(error)) {
          const { tipo, requerimiento } = this.modalPostulacion || {};
          const idRequerimiento =
            tipo === TIPOS_POSTULACION.GENERAL
              ? requerimiento?.idRequerimientoGral
              : requerimiento?.idRequerimiento;
          if (idRequerimiento != null) {
            this.registrarPostulacionEnviada(tipo, idRequerimiento);
          }
        }

        if (esErrorCupoCompleto(error)) {
          const { tipo, requerimiento } = this.modalPostulacion || {};
          const idRequerimiento =
            tipo === TIPOS_POSTULACION.GENERAL
              ? requerimiento?.idRequerimientoGral
              : requerimiento?.idRequerimiento;
          if (idRequerimiento != null) {
            this.registrarSinCupo(tipo, idRequerimiento);
          }
        }

        this.modalPostulacion.visible = false;
        const esPerfilInactivo =
          /perfil/i.test(mensaje) && /inactiv/i.test(mensaje);
        this.toast.init({
          title: esPerfilInactivo ? "Perfil inactivo" : "No se pudo postular",
          message: mensaje || "La postulación no se pudo completar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });

        if (esPerfilInactivo) {
          await refrescarSesion();
        }

        await this.cargar();
        this.refrescarPersonalRequerido();
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
    refrescarPersonalRequerido() {
      const componente = this.$refs.personalRequerido;
      if (componente?.refrescar) componente.refrescar();
    },
    irACalendario() {
      this.modalPostulacion.visible = false;
      this.$router.push({ name: "calendario" });
    },
    irAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
    async abrirModalAsignar(actividad) {
      if (!actividad?.idActividad || this.asignando) return;
      if (
        !puedeAsignarActividad({
          proyecto: this.proyecto,
          actividad,
          tieneFechaEntrega: this.tieneFechaEntrega,
        })
      ) {
        return;
      }

      this.actividadAsignar = { ...actividad };
      this.perfilesAsignadosActividad = perfilesAsignadosDe(actividad);
      this.errorAsignar = "";
      this.modalAsignarVisible = true;
    },
    onCambioVisibilidadAsignar(valor) {
      if (this.asignando && !valor) return;
      if (valor) {
        this.modalAsignarVisible = true;
        return;
      }
      this.cerrarModalAsignar();
    },
    cerrarModalAsignar() {
      if (this.asignando) return;
      this.modalAsignarVisible = false;
      this.actividadAsignar = null;
      this.perfilesAsignadosActividad = [];
      this.errorAsignar = "";
      if (controladorAsignacion) {
        controladorAsignacion.abort();
        controladorAsignacion = null;
      }
    },
    async confirmarAsignacion({ idPerfil, miembro } = {}) {
      if (this.asignando) return;
      const actividad = this.actividadAsignar;
      if (!actividad?.idActividad || idPerfil == null || idPerfil === "") {
        return;
      }

      this.asignando = true;
      this.errorAsignar = "";
      if (controladorAsignacion) controladorAsignacion.abort();
      controladorAsignacion = new AbortController();

      try {
        const response = await actividadService.asignar(
          this.idProyecto,
          actividad.idActividad,
          idPerfil,
          controladorAsignacion.signal
        );
        const data = response?.data || {};

        this.modalAsignarVisible = false;
        this.actividadAsignar = null;
        this.perfilesAsignadosActividad = [];

        this.toast.init({
          title: "Actividad asignada",
          message: mensajeExitoAsignacion(data, miembro, actividad),
          color: "success",
          position: "top-right",
          duration: 7000,
        });

        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });

        if (String(idPerfil) === String(idPerfilActivo())) {
          this.refrescarNotificacionesPerfil();
        }
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorAsignacion(error);
      } finally {
        this.asignando = false;
      }
    },
    async manejarErrorAsignacion(error) {
      const clasificacion = clasificarErrorAsignacion(error);
      const { tipo, mensaje } = clasificacion;

      const cerrar = () => {
        this.modalAsignarVisible = false;
        this.actividadAsignar = null;
        this.perfilesAsignadosActividad = [];
        this.errorAsignar = "";
      };

      if (tipo === TIPOS_ERROR_ASIGNACION.SESION) {
        cerrar();
        await refrescarSesion();
        this.mensajeError = "Tu sesión expiró. Volvé a iniciar sesión.";
        this.$router.push({ name: "login" });
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.CUENTA) {
        cerrar();
        this.toast.init({
          title: "No se pudo asignar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.CSRF) {
        this.errorAsignar = mensaje;
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.SIN_PERMISO) {
        cerrar();
        this.toast.init({
          title: "Sin permiso",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.PERFIL_ACTIVO_NO_ENCONTRADO) {
        cerrar();
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.PERFIL_NO_ENCONTRADO) {
        cerrar();
        this.toast.init({
          title: "No se pudo asignar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.PROYECTO_NO_ENCONTRADO) {
        cerrar();
        this.toast.init({
          title: "No se pudo asignar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.RECURSO_NO_ENCONTRADO) {
        cerrar();
        this.toast.init({
          title: "No se pudo asignar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        return;
      }

      if (
        tipo === TIPOS_ERROR_ASIGNACION.PERFIL_INVALIDO ||
        tipo === TIPOS_ERROR_ASIGNACION.VALIDACION ||
        tipo === TIPOS_ERROR_ASIGNACION.SIN_FECHA_ENTREGA ||
        tipo === TIPOS_ERROR_ASIGNACION.SIN_AGENDA ||
        tipo === TIPOS_ERROR_ASIGNACION.CONFLICTO ||
        tipo === TIPOS_ERROR_ASIGNACION.DESCONOCIDO
      ) {
        this.errorAsignar = mensaje;
        return;
      }

      if (
        tipo === TIPOS_ERROR_ASIGNACION.MIEMBRO_INACTIVO ||
        tipo === TIPOS_ERROR_ASIGNACION.PERFIL_INACTIVO
      ) {
        this.errorAsignar = mensaje;
        this.tokenRefrescoMiembros += 1;
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.DUPLICADO) {
        this.errorAsignar = mensaje;
        this.tokenRefrescoMiembros += 1;
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.ESTADO_INVALIDO) {
        cerrar();
        this.toast.init({
          title: "No se pudo asignar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        return;
      }

      if (tipo === TIPOS_ERROR_ASIGNACION.SIN_DISPONIBILIDAD) {
        this.errorAsignar = mensaje;
        this.tokenRefrescoDisponibilidad += 1;
        return;
      }

      this.errorAsignar = mensaje || "No se pudo asignar la actividad.";
    },
    async abrirModalEliminarActividad(actividad) {
      const idProyecto = this.idProyecto;
      const idActividad = actividad?.idActividad;
      if (!idProyecto || !idActividad) return;

      // El listado de Planificación no incluye `idProyecto` ni el detalle.
      // Abrimos el modal de inmediato con los datos disponibles y usamos el
      // proyecto de la ruta como fuente de verdad.
      this.actividadEliminar = {
        ...actividad,
        idProyecto,
        requerimientos: Array.isArray(actividad.requerimientos)
          ? actividad.requerimientos
          : [],
        profesionalesAsignados: Array.isArray(actividad.profesionalesAsignados)
          ? actividad.profesionalesAsignados
          : [],
      };
      this.errorEliminarActividad = "";
      this.modalEliminarActividadVisible = true;

      // Cancelar cualquier detalle previo antes de abrir otro modal.
      const corrida = ++this.idCargaDetalleEliminacion;
      if (controladorDetalleEliminacion) {
        controladorDetalleEliminacion.abort();
        controladorDetalleEliminacion = null;
      }

      // El detalle es complementario (profesionales asignados, etc.): si falla
      // el modal sigue siendo utilizable con los datos del listado. Sólo se pide
      // cuando el perfil puede leerlo (GET exige MODIFICAR_ACTIVIDAD).
      if (!this.permisos.includes("MODIFICAR_ACTIVIDAD")) return;

      controladorDetalleEliminacion = new AbortController();

      try {
        const response = await actividadService.obtener(
          idProyecto,
          idActividad,
          controladorDetalleEliminacion.signal
        );
        if (corrida !== this.idCargaDetalleEliminacion) return;
        if (String(this.actividadEliminar?.idActividad) !== String(idActividad)) {
          return;
        }

        const detalle = response?.data;
        if (!detalle || typeof detalle !== "object") return;
        if (
          detalle.idActividad != null &&
          String(detalle.idActividad) !== String(idActividad)
        ) {
          return;
        }

        this.actividadEliminar = {
          ...this.actividadEliminar,
          ...detalle,
          idProyecto,
          requerimientos: Array.isArray(detalle.requerimientos)
            ? detalle.requerimientos
            : this.actividadEliminar.requerimientos,
          profesionalesAsignados: Array.isArray(detalle.profesionalesAsignados)
            ? detalle.profesionalesAsignados
            : this.actividadEliminar.profesionalesAsignados,
        };
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        // Silencioso: el detalle no es necesario para confirmar la eliminación.
      }
    },
    onCambioVisibilidadEliminar(valor) {
      if (this.eliminandoActividad && !valor) return;
      if (valor) {
        this.modalEliminarActividadVisible = true;
        return;
      }
      this.cerrarModalEliminarActividad();
    },
    cerrarModalEliminarActividad() {
      this.modalEliminarActividadVisible = false;
      this.errorEliminarActividad = "";
      this.idCargaDetalleEliminacion += 1;
      if (controladorDetalleEliminacion) {
        controladorDetalleEliminacion.abort();
        controladorDetalleEliminacion = null;
      }
      this.actividadEliminar = {};
    },
    async confirmarEliminarActividad({ idActividad, motivo } = {}) {
      if (this.eliminandoActividad) return;

      // El id del proyecto sale de la ruta (el item del listado no lo trae).
      const idProyecto = this.idProyecto;
      const idActividadFinal = idActividad ?? this.actividadEliminar?.idActividad;
      const motivoFinal = String(motivo ?? "").trim();

      if (!idProyecto || !idActividadFinal) {
        this.errorEliminarActividad =
          "No se pudo identificar la actividad a eliminar. Recargá la página e intentá nuevamente.";
        return;
      }
      if (!motivoFinal) {
        this.errorEliminarActividad = "El motivo de la eliminación es obligatorio.";
        return;
      }
      if (motivoFinal.length > 200) {
        this.errorEliminarActividad =
          "El motivo de la eliminación no puede superar los 200 caracteres.";
        return;
      }

      this.eliminandoActividad = true;
      this.errorEliminarActividad = "";
      if (controladorEliminacion) controladorEliminacion.abort();
      controladorEliminacion = new AbortController();

      try {
        await actividadService.eliminar(
          idProyecto,
          idActividadFinal,
          motivoFinal,
          controladorEliminacion.signal
        );
        // Refrescar la planificación y el proyecto
        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion++;
        });
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "Actividad eliminada",
          message: "La actividad fue eliminada correctamente y el cronograma se recalculó.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        await this.manejarErrorEliminarActividad(error);
      } finally {
        this.eliminandoActividad = false;
      }
    },
    async manejarErrorEliminarActividad(error) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const mensaje = data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      if (status === 400) {
        this.errorEliminarActividad =
          mensaje ||
          data?.motivo ||
          "No se pudo eliminar la actividad: el motivo es obligatorio o no es válido.";
        // El modal se mantiene abierto para que el usuario corrija el motivo.
        return;
      }

      if (status === 401) {
        this.errorEliminarActividad = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 403) {
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "No se pudo eliminar",
          message: mensajeErrorApi(
            error,
            "No tenés permiso para eliminar esta actividad."
          ),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (status === 404) {
        if (clasificacion?.tipo === "perfil-activo") {
          this.cerrarModalEliminarActividad();
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        if (clasificacion?.tipo === "perfil-no-encontrado") {
          this.cerrarModalEliminarActividad();
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        if (/proyecto/i.test(mensaje)) {
          this.cerrarModalEliminarActividad();
          this.proyecto = null;
          this.estadoNoEncontrado = true;
          this.mensajeError = mensaje;
          this.mostrarVolver = true;
          return;
        }
        // Actividad o planificación inexistente: cerrar y refrescar el listado.
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "No se pudo eliminar",
          message: mensajeErrorApi(
            error,
            "La actividad ya no existe o no está disponible."
          ),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        return;
      }

      if (status === 409) {
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "No se pudo eliminar",
          message:
            mensaje ||
            (clasificacion?.tipo === "estado-no-cancelable"
              ? "La actividad no se puede eliminar (estado FINALIZADA o CANCELADA)."
              : "El proyecto no admite la operación."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        return;
      }

      if (!status || status >= 500) {
        this.errorEliminarActividad =
          "Ocurrió un error al eliminar la actividad. Inténtalo nuevamente.";
        // Mantener el modal abierto ante errores de red/servidor.
        return;
      }

      this.errorEliminarActividad = mensajeErrorApi(
        error,
        "No se pudo eliminar la actividad."
      );
    },
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
    if (controladorPublicacion) controladorPublicacion.abort();
    if (controladorCancelacion) controladorCancelacion.abort();
    if (controladorEliminacion) controladorEliminacion.abort();
    if (controladorDetalleEliminacion) controladorDetalleEliminacion.abort();
    if (controladorAsignacion) controladorAsignacion.abort();
    if (controladorPostulacion) controladorPostulacion.abort();
    if (controladorConfirmacion) controladorConfirmacion.abort();
  },
};
</script>

<style scoped>
.dashboard-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 2000px;
  margin: 0 auto;
}

.dashboard-proyecto__panel {
  padding: 1.35rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.dashboard-proyecto__titulo {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.dashboard-proyecto__parrafo {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-text);
}

.dashboard-proyecto__vacio {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.dashboard-proyecto__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-proyecto__hero-cuerpo {
  flex: 1;
  min-width: 260px;
}

.dashboard-proyecto__hero-titular {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dashboard-proyecto__nombre {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__hero-descripcion {
  margin: 0.6rem 0 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-text);
}

.dashboard-proyecto__hero-rol {
  margin: 0.7rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__hero-acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.dashboard-proyecto__grilla {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.1rem;
}

.dashboard-proyecto__dato {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dashboard-proyecto__dato-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__dato-valor {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__dato-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__chip-postulaciones {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 500;
}

.dashboard-proyecto__objetivos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.dashboard-proyecto__objetivo {
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.dashboard-proyecto__objetivo-nombre {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__objetivo-desc {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.dashboard-proyecto__requerimientos {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dashboard-proyecto__contador {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__proximamente {
  border-style: dashed;
}

.dashboard-proyecto__banner-cancelado {
  margin-top: 0 !important;
}

.dashboard-proyecto__peligro {
  border-color: var(--color-danger-border);
}

.dashboard-proyecto__peligro-boton {
  margin-top: 1rem;
}

.dashboard-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.dashboard-proyecto__estado-icono {
  font-size: 2.5rem;
}

.dashboard-proyecto__estado-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.dashboard-proyecto__estado-texto {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
}

.dashboard-proyecto__reintento {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

@media (max-width: 900px) {
  .dashboard-proyecto__grilla,
  .dashboard-proyecto__objetivos {
    grid-template-columns: 1fr;
  }
}

.btn-publicar {
  --va-background-color: #1e40af !important;
  --va-color: #ffffff !important;
  --va-background-opacity: 1 !important;
  background: #1e40af !important;
  color: #ffffff !important;
  border: none !important;
}

.btn-publicar :deep(.va-button__content) {
  color: #ffffff !important;
}

.btn-publicar:hover:not(:disabled) {
  --va-background-color: #1e3a8a !important;
  background: #1e3a8a !important;
}

.btn-publicar:disabled {
  opacity: 0.5;
}

[data-theme="dark"] .btn-publicar {
  --va-background-color: #93c5fd !important;
  --va-color: #1e3a8a !important;
  background: #93c5fd !important;
  color: #1e3a8a !important;
}

[data-theme="dark"] .btn-publicar :deep(.va-button__content) {
  color: #1e3a8a !important;
}

[data-theme="dark"] .btn-publicar:hover:not(:disabled) {
  --va-background-color: #bfdbfe !important;
  background: #bfdbfe !important;
}
</style>
