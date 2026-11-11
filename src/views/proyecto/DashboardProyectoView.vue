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
          :mostrar-descripcion="tabActiva !== 'informacion'"
          :mostrar-detalles="tabActiva !== 'informacion'"
          :mostrar-planificacion="esMiembro"
          :mostrar-integrantes="esMiembro"
          :mostrar-chat="esMiembro"
          :mostrar-historial="puedeVerHistorial"
          :mostrar-reemplazos="esDirector"
          :mostrar-contratos="puedeVerContratos"
          :reemplazos-pendientes="reemplazosPendientes"
          :reemplazos-sin-candidatos="reemplazosSinCandidatos"
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
            <VaButton
              v-if="puedeFinalizarProyecto"
              preset="primary"
              :disabled="cargandoPreviewFinalizacion || finalizandoProyecto"
              :loading="cargandoPreviewFinalizacion || finalizandoProyecto"
              @click="abrirFinalizacion"
            >
              Finalizar proyecto
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
          <InformacionGeneralProyecto
            :proyecto="proyecto"
            :id-proyecto="idProyecto"
            :puede-modificar="puedeModificar"
          />

          <section
            v-if="puedeCancelar || puedeDarseDeBaja"
            class="dashboard-proyecto__panel dashboard-proyecto__peligro"
          >
            <h2 class="dashboard-proyecto__titulo">Zona de peligro</h2>

            <template v-if="puedeCancelar">
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
            </template>

            <template v-if="puedeDarseDeBaja">
              <p class="dashboard-proyecto__parrafo">
                Darte de baja te desvincula del proyecto. Tus asignaciones
                quedarán como historial y las vacantes se reabrirán
                automáticamente.
              </p>
              <VaButton
                color="danger"
                preset="secondary"
                class="dashboard-proyecto__peligro-boton"
                @click="abrirDarseDeBaja"
              >
                Darse de baja
              </VaButton>
            </template>
          </section>

          <section
            v-if="esFinalizado && esMiembro"
            class="dashboard-proyecto__panel"
          >
            <h2 class="dashboard-proyecto__titulo">Calificaciones del equipo</h2>
            <p class="dashboard-proyecto__parrafo">
              El proyecto finalizó. Si todavía te falta calificar a algún
              integrante, podés hacerlo desde acá.
            </p>
            <VaButton preset="primary" @click="irACalificaciones">
              Calificar equipo
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
          @desasignar-actividad="abrirModalDesasignar"
        />

        <IntegrantesProyecto
          v-else-if="tabActiva === 'integrantes' && esMiembro"
          ref="integrantes"
          :id-proyecto="idProyecto"
          :token-refresco="tokenRefrescoIntegrantes"
          :puede-invitar="puedeInvitarIntegrante"
          :id-perfil-activo="idPerfilActivoSesion"
          @eliminar="abrirEliminarIntegrante"
          @invitar="irAInvitarProyecto"
        />

        <ChatGrupalProyecto
          v-else-if="tabActiva === 'chat' && esMiembro"
          :id-proyecto="idProyecto"
          :nombre-proyecto="proyecto.nombre"
          @ir-miembros="cambiarTab('integrantes')"
        />

        <HistorialProyecto
          v-else-if="tabActiva === 'historial' && puedeVerHistorial"
          :id-proyecto="idProyecto"
          :es-director="esDirector"
        />

        <ReemplazosProyecto
          v-else-if="tabActiva === 'reemplazos' && esDirector"
          :id-proyecto="idProyecto"
          @resumen="actualizarResumenReemplazos"
          @actualizado="refrescarTrasReemplazo"
        />

        <ContratosProyecto
          v-else-if="tabActiva === 'contratos' && puedeVerContratos"
          :id-proyecto="idProyecto"
          :puede-generar="puedeCrearContrato"
          @nuevo-contrato="irANuevoContrato"
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
          :id-proyecto="idProyecto"
          :actividad="actividadEliminar"
          :nombre-proyecto="proyecto?.nombre || ''"
          :eliminando="eliminandoActividad"
          :error="errorEliminarActividad"
          :error-motivo="errorMotivoEliminarActividad"
          :errores-por-miembro="erroresMiembroEliminarActividad"
          :conflicto-en-curso="conflictoEliminarActividadEnCurso"
          :puede-ir-actividad="puedeIrActividadEliminacion"
          :token-refresco-exclusivos="tokenRefrescoExclusivos"
          @update:modelValue="onCambioVisibilidadEliminar"
          @limpiar-error="limpiarErroresEliminarActividad"
          @limpiar-errores-filas="erroresMiembroEliminarActividad = {}"
          @ir-actividad="irActividadDesdeEliminacion"
          @recargar="refrescarTrasEliminar"
          @confirmar="confirmarEliminarActividad"
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

        <ModalFinalizarProyecto
          :model-value="modalFinalizacionVisible"
          :nombre-proyecto="proyecto.nombre"
          :preview="previewFinalizacion"
          :profesiones="profesionesFinalizacion"
          :cargando-preview="cargandoPreviewFinalizacion"
          :error-preview="errorPreviewFinalizacion"
          :puede-reintentar-preview="puedeReintentarPreviewFinalizacion"
          :finalizando="finalizandoProyecto"
          :error-finalizacion="errorFinalizacion"
          :faltantes="faltantesFinalizacion"
          @update:modelValue="onCambioVisibilidadFinalizacion"
          @confirmar="confirmarFinalizacion"
          @reintentar="reintentarPreviewFinalizacion"
        />

        <ModalCancelarProyecto
          :model-value="modalCancelarVisible"
          :nombre-proyecto="proyecto.nombre"
          :cancelando="cancelando"
          :error="errorCancelacion"
          @update:modelValue="modalCancelarVisible = $event"
          @confirmar="confirmarCancelacion"
        />

        <ModalEliminarIntegrante
          :model-value="modalEliminarIntegranteVisible"
          :miembro="integranteEliminar"
          :nombre-proyecto="proyecto.nombre"
          :eliminando="eliminandoIntegrante"
          :error="errorEliminarIntegrante"
          :error-motivo="errorMotivoEliminarIntegrante"
          @update:model-value="onCambioVisibilidadEliminarIntegrante"
          @confirmar="confirmarEliminarIntegrante"
        />

        <ModalDarseDeBajaProyecto
          :model-value="modalDarseDeBajaVisible"
          :nombre-proyecto="proyecto.nombre"
          :dando-de-baja="dandoDeBaja"
          :error="errorDarseDeBaja"
          :error-motivo="errorMotivoDarseDeBaja"
          @update:model-value="onCambioVisibilidadDarseDeBaja"
          @confirmar="confirmarDarseDeBaja"
        />

        <ModalAsignarActividad
          :model-value="modalAsignarVisible"
          :id-proyecto="idProyecto"
          :actividad="actividadAsignar"
          :nombre-proyecto="proyecto.nombre"
          :id-perfiles-asignados="perfilesAsignadosActividad"
          :id-usuarios-asignados="usuariosAsignadosActividad"
          :tiene-fecha-entrega="tieneFechaEntrega"
          :asignando="asignando"
          :error="errorAsignar"
          :bloqueos="bloqueosAsignar"
          :miembros-bloqueantes="miembrosBloqueantesAsignar"
          :es-borrador="esBorrador"
          :token-refresco-miembros="tokenRefrescoMiembros"
          :token-refresco-disponibilidad="tokenRefrescoDisponibilidad"
          @update:model-value="onCambioVisibilidadAsignar"
          @confirmar="confirmarAsignacion"
        />

        <ModalDesasignarActividad
          :model-value="modalDesasignarVisible"
          :actividad="actividadDesasignar"
          :responsable="responsableDesasignar"
          :nombre-proyecto="proyecto.nombre"
          :proyecto-confirmado="proyectoConfirmado"
          :desasignando="desasignando"
          :error="errorDesasignar"
          @update:model-value="onCambioVisibilidadDesasignar"
          @confirmar="confirmarDesasignacion"
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
import reemplazoService from "../../services/reemplazoService.js";
import { idPerfilActivo, refrescarSesion } from "../../services/authState";
import { cargarResumenPerfil } from "../../services/notificacionState";
import BaseAlert from "../../components/AlertaBase.vue";
import ProyectoEncabezado from "../../components/proyecto/ProyectoEncabezado.vue";
import PlanificacionProyecto from "../../components/proyecto/PlanificacionProyecto.vue";
import IntegrantesProyecto from "../../components/proyecto/IntegrantesProyecto.vue";
import ChatGrupalProyecto from "../../components/proyecto/ChatGrupalProyecto.vue";
import HistorialProyecto from "../../components/proyecto/HistorialProyecto.vue";
import ReemplazosProyecto from "../../components/proyecto/ReemplazosProyecto.vue";
import ContratosProyecto from "../../components/proyecto/ContratosProyecto.vue";
import PersonalRequerido from "../../components/proyecto/PersonalRequerido.vue";
import InformacionGeneralProyecto from "../../components/proyecto/InformacionGeneralProyecto.vue";
import GestionPostulaciones from "../../components/proyecto/GestionPostulaciones.vue";
import ModalPublicarProyecto from "../../components/proyecto/ModalPublicarProyecto.vue";
import ModalConfirmarProyecto from "../../components/proyecto/ModalConfirmarProyecto.vue";
import ModalFinalizarProyecto from "../../components/proyecto/ModalFinalizarProyecto.vue";
import ModalCancelarProyecto from "../../components/proyecto/ModalCancelarProyecto.vue";
import ModalEliminarIntegrante from "../../components/proyecto/ModalEliminarIntegrante.vue";
import ModalDarseDeBajaProyecto from "../../components/proyecto/ModalDarseDeBajaProyecto.vue";
import ModalEliminarActividad from "../../components/proyecto/ModalEliminarActividad.vue";
import ModalAsignarActividad from "../../components/proyecto/ModalAsignarActividad.vue";
import ModalDesasignarActividad from "../../components/proyecto/ModalDesasignarActividad.vue";
import ModalPostulacion from "../../components/proyecto/ModalPostulacion.vue";
import actividadService from "../../services/actividadService.js";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  TIPOS_ERROR_ASIGNACION,
  clasificarErrorAsignacion,
  clasificarErrorDesasignacion,
  mensajeExitoAsignacion,
  mensajeExitoDesasignacion,
  perfilesAsignadosDe,
  usuariosAsignadosDe,
  puedeAsignarActividad,
  puedeDesasignarActividad,
} from "../../utils/asignacionConstants.js";
import {
  MENSAJE_USUARIO_YA_ASIGNADO_POSTULACION,
  esConflictoAsignacionUnica,
} from "../../utils/asignacionUnicaConstants.js";
import { puedeInvitarProyecto } from "../../utils/invitacionConstants.js";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import {
  LIMITE_MOTIVO_BAJA,
  TIPOS_ERROR_ELIMINAR_INTEGRANTE,
  clasificarErrorEliminarIntegrante,
} from "../../utils/integranteConstants.js";
import {
  TIPOS_ERROR_DARSE_DE_BAJA,
  clasificarErrorDarseDeBaja,
} from "../../utils/bajaProyectoConstants.js";
import {
  TIPOS_ERROR_ELIMINAR_ACTIVIDAD,
  clasificarErrorEliminarActividad,
  idsEliminarSinMotivo,
  mensajeExitoEliminarActividad,
} from "../../utils/eliminacionActividadConstants.js";
import { formatearFecha } from "../../utils/fechas.js";
import {
  CODIGOS_CONFIRMACION,
  clasificarErrorConfirmacion,
  normalizarPreview,
} from "../../utils/confirmacionConstants.js";
import { puedeGenerarContrato } from "../../utils/contratoConstants.js";
import {
  clasificarErrorFinalizacion,
  indexarProfesionesPorPerfil,
  normalizarPreviewFinalizacion,
} from "../../utils/finalizacionConstants.js";
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
  ESTADOS_PROYECTO,
  ROLES_PROYECTO,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";
import { calcularResumenReemplazos } from "../../utils/reemplazoConstants.js";

// Cancela la request en vuelo si cambia el id o se reintenta
// (no reactivo a propósito: AbortController no debe pasar por reactive()).
let controladorCarga = null;
let controladorPublicacion = null;
let controladorCancelacion = null;
let controladorEliminarIntegrante = null;
let controladorDarseDeBaja = null;
let controladorEliminacion = null;
let controladorAsignacion = null;
let controladorDesasignacion = null;
let controladorPostulacion = null;
let controladorConfirmacion = null;
let controladorFinalizacion = null;
let controladorResumenReemplazos = null;

export default {
  name: "DashboardProyectoView",
  components: {
    BaseAlert,
    ProyectoEncabezado,
    PlanificacionProyecto,
    IntegrantesProyecto,
    ChatGrupalProyecto,
    HistorialProyecto,
    ReemplazosProyecto,
    ContratosProyecto,
    PersonalRequerido,
    InformacionGeneralProyecto,
    GestionPostulaciones,
    ModalPublicarProyecto,
    ModalConfirmarProyecto,
    ModalFinalizarProyecto,
    ModalCancelarProyecto,
    ModalEliminarIntegrante,
    ModalDarseDeBajaProyecto,
    ModalEliminarActividad,
    ModalAsignarActividad,
    ModalDesasignarActividad,
    ModalPostulacion,
  },
  setup() {
    return { toast: useToast() };
  },
data() {
    return {
      TIPOS_POSTULACION,
      proyecto: null,
      cargando: true,
      mensajeError: "",
      podeReintentar: false,
      estadoNoEncontrado: false,
      mostrarVolver: false,
      habilidades: [],
      catalogosCaracteristicas: {},
      modalPublicarVisible: false,
      publicando: false,
      errorPublicacion: "",
      modalCancelarVisible: false,
      cancelando: false,
      errorCancelacion: "",
      modalEliminarIntegranteVisible: false,
      integranteEliminar: null,
      eliminandoIntegrante: false,
      errorEliminarIntegrante: "",
      errorMotivoEliminarIntegrante: "",
      tokenRefrescoIntegrantes: 0,
      modalDarseDeBajaVisible: false,
      dandoDeBaja: false,
      errorDarseDeBaja: "",
      errorMotivoDarseDeBaja: "",
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
      modalFinalizacionVisible: false,
      previewFinalizacion: null,
      profesionesFinalizacion: {},
      cargandoPreviewFinalizacion: false,
      errorPreviewFinalizacion: "",
      puedeReintentarPreviewFinalizacion: false,
      finalizandoProyecto: false,
      errorFinalizacion: "",
      faltantesFinalizacion: [],
      idCargaPreviewFinalizacion: 0,
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
      errorMotivoEliminarActividad: "",
      erroresMiembroEliminarActividad: {},
      conflictoEliminarActividadEnCurso: false,
      tokenRefrescoExclusivos: 0,
      modalAsignarVisible: false,
      actividadAsignar: null,
      perfilesAsignadosActividad: [],
      usuariosAsignadosActividad: [],
      asignando: false,
      errorAsignar: "",
      bloqueosAsignar: [],
      miembrosBloqueantesAsignar: [],
      tokenRefrescoMiembros: 0,
      modalDesasignarVisible: false,
      actividadDesasignar: null,
      responsableDesasignar: null,
      desasignando: false,
      errorDesasignar: "",
      tokenRefrescoDisponibilidad: 0,
      tokenRefrescoPlanificacion: 0,
      reemplazosPendientes: 0,
      reemplazosSinCandidatos: 0,
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
    /** El rol Director habilita la seccion de miembros y la vista global. */
    esDirector() {
      return (
        this.esMiembro &&
        String(this.proyecto?.rolUsuario || "").toUpperCase() ===
          ROLES_PROYECTO.DIRECTOR
      );
    },
    /** Historial visible para cualquier miembro activo. */
    puedeVerHistorial() {
      return this.esMiembro;
    },
    esBorrador() {
      return normalizarEstadoProyecto(this.proyecto?.estado) === ESTADOS_PROYECTO.BORRADOR;
    },
    /** La fecha de entrega es obligatoria para publicar y calcular CPM. */
    tieneFechaEntrega() {
      return !!this.proyecto?.fechaEntregaEstipulada;
    },
    puedeEditar() {
      return this.permisos.includes("MODIFICAR_PROYECTO");
    },
    /** CTA de UC-51: cancelar la actividad requiere poder modificarla. */
    puedeIrActividadEliminacion() {
      return this.permisos.includes("MODIFICAR_ACTIVIDAD");
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
    /** UC-37: el preview de finalización decide los bloqueos reales. */
    puedeFinalizarProyecto() {
      return (
        this.esMiembro &&
        this.permisos.includes("FINALIZAR_PROYECTO") &&
        this.esConfirmado
      );
    },
    esFinalizado() {
      return (
        normalizarEstadoProyecto(this.proyecto?.estado) ===
        ESTADOS_PROYECTO.FINALIZADO
      );
    },
    esCancelado() {
      return normalizarEstadoProyecto(this.proyecto?.estado) === ESTADOS_PROYECTO.CANCELADO;
    },
    esConfirmado() {
      return normalizarEstadoProyecto(this.proyecto?.estado) === ESTADOS_PROYECTO.CONFIRMADO;
    },
    proyectoConfirmado() {
      return (
        normalizarEstadoProyecto(this.proyecto?.estado) ===
        ESTADOS_PROYECTO.CONFIRMADO
      );
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
    /**
     * UC-40: el backend es la fuente de verdad. Sólo se muestra la acción si
     * `puedeDarseDeBaja` es exactamente true; no se recalcula estado,
     * membresía ni regla del último Director en el frontend.
     */
    puedeDarseDeBaja() {
      return this.proyecto?.puedeDarseDeBaja === true;
    },
    /** UC-34: sólo el director con GESTIONAR_POSTULACIONES gestiona postulaciones. */
    puedeGestionarPostulaciones() {
      return (
        this.proyecto?.rolUsuario === ROLES_PROYECTO.DIRECTOR &&
        this.permisos.includes("GESTIONAR_POSTULACIONES")
      );
    },
    /** UC-31: Director con `INVITAR_MIEMBRO` en proyecto Publicado/Confirmado. */
    puedeInvitarIntegrante() {
      return puedeInvitarProyecto(this.proyecto);
    },
    /**
     * UC-68: la pestaña Contratos se muestra a cualquier miembro activo. El
     * backend filtra qué contratos ve cada perfil (Director: todos; firmante:
     * los suyos; sin contratos: página vacía). También queda visible en
     * proyectos Finalizados/Cancelados.
     */
    puedeVerContratos() {
      return this.esMiembro;
    },
    /** UC-39: sólo el Director activo en Publicado/Confirmado puede generar. */
    puedeCrearContrato() {
      return puedeGenerarContrato(this.proyecto);
    },
    /** Perfil activo de la sesión: habilita el chip "Vos" en el listado. */
    idPerfilActivoSesion() {
      return idPerfilActivo();
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
      this.usuariosAsignadosActividad = [];
      this.asignando = false;
      this.errorAsignar = "";
      this.bloqueosAsignar = [];
      this.miembrosBloqueantesAsignar = [];
      this.modalDesasignarVisible = false;
      this.actividadDesasignar = null;
      this.responsableDesasignar = null;
      this.desasignando = false;
      this.errorDesasignar = "";
      if (controladorDesasignacion) {
        controladorDesasignacion.abort();
        controladorDesasignacion = null;
      }
      this.modalEliminarIntegranteVisible = false;
      this.integranteEliminar = null;
      this.eliminandoIntegrante = false;
      this.errorEliminarIntegrante = "";
      this.errorMotivoEliminarIntegrante = "";
      this.tokenRefrescoIntegrantes = 0;
      if (controladorEliminarIntegrante) {
        controladorEliminarIntegrante.abort();
        controladorEliminarIntegrante = null;
      }
      this.modalDarseDeBajaVisible = false;
      this.dandoDeBaja = false;
      this.errorDarseDeBaja = "";
      this.errorMotivoDarseDeBaja = "";
      if (controladorDarseDeBaja) {
        controladorDarseDeBaja.abort();
        controladorDarseDeBaja = null;
      }
      this.reemplazosPendientes = 0;
      this.reemplazosSinCandidatos = 0;
      if (controladorResumenReemplazos) {
        controladorResumenReemplazos.abort();
        controladorResumenReemplazos = null;
      }
      this.modalEliminarActividadVisible = false;
      this.actividadEliminar = {};
      this.eliminandoActividad = false;
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
      this.erroresMiembroEliminarActividad = {};
      this.conflictoEliminarActividadEnCurso = false;
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
      this.modalFinalizacionVisible = false;
      this.previewFinalizacion = null;
      this.profesionesFinalizacion = {};
      this.cargandoPreviewFinalizacion = false;
      this.errorPreviewFinalizacion = "";
      this.puedeReintentarPreviewFinalizacion = false;
      this.finalizandoProyecto = false;
      this.errorFinalizacion = "";
      this.faltantesFinalizacion = [];
      this.idCargaPreviewFinalizacion++;
      if (controladorFinalizacion) {
        controladorFinalizacion.abort();
        controladorFinalizacion = null;
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
        this.limpiarResumenReemplazos();
        if (
          ["planificacion", "integrantes", "chat", "historial", "reemplazos", "contratos"].includes(
            this.tabActiva
          )
        ) {
          this.tabActiva = "informacion";
        }
        this.aplicarTabDesdeQuery();
        return;
      }
      this.aplicarTabDesdeQuery();
    },
    esDirector(valor) {
      if (!valor) {
        this.limpiarResumenReemplazos();
        if (["reemplazos", "contratos"].includes(this.tabActiva)) {
          this.tabActiva = "informacion";
          this.aplicarTabDesdeQuery();
        }
        return;
      }
      this.cargarResumenReemplazos();
    },
    puedeVerContratos(valor) {
      if (!valor && this.tabActiva === "contratos") {
        this.tabActiva = "informacion";
        this.aplicarTabDesdeQuery();
      }
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
    formatearFecha,
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
        // Reaplicar la tab de la URL una vez conocido el rol del proyecto:
        // `?tab=historial` es válida para miembros activos; la sección de
        // miembros dentro del historial sigue reservada al Director.
        this.aplicarTabDesdeQuery();
        if (this.esDirector) this.cargarResumenReemplazos(corrida);
        else this.limpiarResumenReemplazos();
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
    /**
     * Badge de la pestaña Reemplazos. El backend no tiene endpoint de resumen:
     * se cuenta sobre el listado (sin paginación) y se silencian los errores
     * para no bloquear el dashboard del proyecto.
     * @param {number} [corrida] id de carga del proyecto
     */
    async cargarResumenReemplazos(corrida = this.idCarga) {
      if (!this.esDirector || this.idProyecto == null) {
        this.limpiarResumenReemplazos();
        return;
      }

      if (controladorResumenReemplazos) controladorResumenReemplazos.abort();
      controladorResumenReemplazos = new AbortController();

      try {
        const response = await reemplazoService.listar(
          this.idProyecto,
          controladorResumenReemplazos.signal
        );
        if (corrida !== this.idCarga || !this.esDirector) return;

        const data = response?.data;
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : [];
        const resumen = calcularResumenReemplazos(lista);
        this.reemplazosPendientes = resumen.totalAccionesPendientes;
        this.reemplazosSinCandidatos = resumen.sinCandidatos;
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          error?.name === "AbortError"
        ) {
          return;
        }
        if (corrida === this.idCarga) this.limpiarResumenReemplazos();
      }
    },
    limpiarResumenReemplazos() {
      this.reemplazosPendientes = 0;
      this.reemplazosSinCandidatos = 0;
    },
    actualizarResumenReemplazos({ pendientes, sinCandidatos } = {}) {
      this.reemplazosPendientes = Number(pendientes) || 0;
      this.reemplazosSinCandidatos = Number(sinCandidatos) || 0;
    },
    /**
     * Después de aprobar/rechazar/cancelar/regenerar, el proyecto cambia:
     * requerimientos, miembros y planificación pueden haber cambiado.
     */
    async refrescarTrasReemplazo() {
      await this.cargar();
      this.tokenRefrescoIntegrantes += 1;
      this.tokenRefrescoPlanificacion += 1;
      this.refrescarNotificacionesPerfil();
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
        if (error?._esCuentaNoActiva) {
          this.mensajeError = mensajeErrorApi(
            error,
            "Tu cuenta no se encuentra activa."
          );
          this.mostrarVolver = true;
          return;
        }
        this.mensajeError = /perfil/i.test(mensaje)
          ? "El perfil no se encuentra activo."
          : "No tenés acceso a este proyecto o ya no participás en él.";
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
      const permitidas = [
        "informacion",
        "planificacion",
        "integrantes",
        "chat",
        "historial",
        "reemplazos",
        "postulaciones",
        "contratos",
      ];
      const tab = permitidas.includes(solicitada) ? solicitada : "informacion";

      if (["planificacion", "integrantes", "chat"].includes(tab) && !this.esMiembro) {
        this.tabActiva = "informacion";
        return;
      }
      if (tab === "historial" && !this.puedeVerHistorial) {
        this.tabActiva = "informacion";
        return;
      }
      if (tab === "reemplazos" && !this.esDirector) {
        this.tabActiva = "informacion";
        return;
      }
      if (tab === "contratos" && !this.puedeVerContratos) {
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
      if (["planificacion", "integrantes", "chat"].includes(tab) && !this.esMiembro) return;
      if (tab === "historial" && !this.puedeVerHistorial) return;
      if (tab === "reemplazos" && !this.esDirector) return;
      if (tab === "contratos" && !this.puedeVerContratos) return;
      if (this.tabActiva === tab) return;

      this.tabActiva = tab;
      const query = { ...this.$route.query };
      if (tab === "informacion") delete query.tab;
      else query.tab = tab;
      if (tab !== "planificacion") delete query.vista;
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
        // y el botón Publicar desaparece. Se conserva `puedeDarseDeBaja` por si
        // el DTO del POST no lo incluye.
        const publicado = response?.data || null;
        this.proyecto = publicado
          ? {
              ...publicado,
              puedeDarseDeBaja:
                publicado.puedeDarseDeBaja ??
                this.proyecto?.puedeDarseDeBaja ??
                false,
            }
          : this.proyecto;
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
    /** UC-38: abre la confirmación de baja de un integrante. */
    abrirEliminarIntegrante(miembro) {
      if (this.eliminandoIntegrante) return;
      if (miembro?.eliminable !== true) return;
      if (miembro?.idMiembro == null) return;

      this.integranteEliminar = { ...miembro };
      this.errorEliminarIntegrante = "";
      this.errorMotivoEliminarIntegrante = "";
      this.modalEliminarIntegranteVisible = true;
    },
    onCambioVisibilidadEliminarIntegrante(valor) {
      if (this.eliminandoIntegrante && !valor) return;
      if (valor) {
        this.modalEliminarIntegranteVisible = true;
        return;
      }
      this.cerrarModalEliminarIntegrante();
    },
    cerrarModalEliminarIntegrante(forzar = false) {
      if (this.eliminandoIntegrante && !forzar) return;
      this.modalEliminarIntegranteVisible = false;
      this.integranteEliminar = null;
      this.errorEliminarIntegrante = "";
      this.errorMotivoEliminarIntegrante = "";
      if (controladorEliminarIntegrante) {
        controladorEliminarIntegrante.abort();
        controladorEliminarIntegrante = null;
      }
    },
    /** UC-38: ejecuta el DELETE y refresca miembros, proyecto y planificación. */
    async confirmarEliminarIntegrante(motivo) {
      if (this.eliminandoIntegrante) return;

      const miembro = this.integranteEliminar;
      const texto = String(motivo ?? "").trim();

      if (!miembro?.idMiembro) {
        this.errorEliminarIntegrante =
          "No se pudo identificar al integrante. Recargá la página e intentá nuevamente.";
        return;
      }
      if (!texto) {
        this.errorMotivoEliminarIntegrante =
          "El motivo de eliminación es obligatorio.";
        return;
      }
      if (texto.length > LIMITE_MOTIVO_BAJA) {
        this.errorMotivoEliminarIntegrante =
          "El motivo de eliminación no puede superar los 100 caracteres.";
        return;
      }

      this.eliminandoIntegrante = true;
      this.errorEliminarIntegrante = "";
      this.errorMotivoEliminarIntegrante = "";
      if (controladorEliminarIntegrante) controladorEliminarIntegrante.abort();
      controladorEliminarIntegrante = new AbortController();

      try {
        await proyectoService.eliminarIntegrante(
          this.idProyecto,
          miembro.idMiembro,
          texto,
          controladorEliminarIntegrante.signal
        );

        this.modalEliminarIntegranteVisible = false;
        this.integranteEliminar = null;
        this.errorEliminarIntegrante = "";
        this.errorMotivoEliminarIntegrante = "";

        this.toast.init({
          title: "Miembro eliminado",
          message: "El miembro fue desvinculado del proyecto.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        // El backend es la fuente de verdad: se recargan lista, proyecto y
        // planificación en vez de modificar el estado local a mano.
        this.tokenRefrescoIntegrantes += 1;
        this.tokenRefrescoPlanificacion += 1;
        await this.cargar();
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorEliminarIntegrante(error);
      } finally {
        this.eliminandoIntegrante = false;
      }
    },
    async manejarErrorEliminarIntegrante(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorEliminarIntegrante(error);
      const { tipo, mensaje } = clasificacion;

      const cerrarYRefrescar = async (refrescarProyecto = false) => {
        this.cerrarModalEliminarIntegrante(true);
        this.tokenRefrescoIntegrantes += 1;
        if (refrescarProyecto) await this.cargar();
      };

      const mostrarToast = (title) => {
        this.toast.init({
          title,
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
      };

      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.SESION) {
        // El interceptor global ya limpió la sesión y redirigió a login.
        this.cerrarModalEliminarIntegrante(true);
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.CUENTA) {
        await cerrarYRefrescar();
        mostrarToast("Cuenta no habilitada");
        return;
      }

      // Error corregible: el modal sigue abierto y conserva el motivo.
      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.MOTIVO) {
        this.errorMotivoEliminarIntegrante = mensaje;
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.PERMISO) {
        await cerrarYRefrescar(true);
        mostrarToast("No se pudo eliminar");
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.PERFIL_ACTIVO) {
        this.cerrarModalEliminarIntegrante(true);
        this.mensajeError =
          "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.PERFIL_NO_ENCONTRADO) {
        this.cerrarModalEliminarIntegrante(true);
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_ELIMINAR_INTEGRANTE.PROYECTO_NO_ENCONTRADO) {
        this.cerrarModalEliminarIntegrante(true);
        this.proyecto = null;
        this.estadoNoEncontrado = true;
        this.mensajeError = mensaje;
        this.mostrarVolver = true;
        return;
      }

      if (
        [
          TIPOS_ERROR_ELIMINAR_INTEGRANTE.MIEMBRO_NO_ENCONTRADO,
          TIPOS_ERROR_ELIMINAR_INTEGRANTE.MIEMBRO_INACTIVO,
          TIPOS_ERROR_ELIMINAR_INTEGRANTE.ESTADO_PROYECTO,
          TIPOS_ERROR_ELIMINAR_INTEGRANTE.AUTOELIMINACION,
          TIPOS_ERROR_ELIMINAR_INTEGRANTE.ULTIMO_DIRECTOR,
        ].includes(tipo)
      ) {
        await cerrarYRefrescar(true);
        mostrarToast("No se pudo eliminar");
        return;
      }

      // La ficha manda cerrar ante 403/404/409 aunque el mensaje no coincida
      // con ningún patrón conocido: el backend sigue siendo la fuente de
      // verdad y la lista/proyecto se recargan.
      if ([403, 404, 409].includes(status)) {
        await cerrarYRefrescar(true);
        mostrarToast("No se pudo eliminar");
        return;
      }

      // 5xx o error no clasificado: el modal queda abierto para reintentar.
      this.errorEliminarIntegrante = mensaje;
    },
    /** UC-40: abre la confirmación de baja voluntaria del perfil activo. */
    abrirDarseDeBaja() {
      if (!this.puedeDarseDeBaja || this.dandoDeBaja) return;
      this.errorDarseDeBaja = "";
      this.errorMotivoDarseDeBaja = "";
      this.modalDarseDeBajaVisible = true;
    },
    onCambioVisibilidadDarseDeBaja(valor) {
      if (this.dandoDeBaja && !valor) return;
      if (valor) {
        this.modalDarseDeBajaVisible = true;
        return;
      }
      this.cerrarModalDarseDeBaja();
    },
    cerrarModalDarseDeBaja(forzar = false) {
      if (this.dandoDeBaja && !forzar) return;
      this.modalDarseDeBajaVisible = false;
      this.errorDarseDeBaja = "";
      this.errorMotivoDarseDeBaja = "";
      if (controladorDarseDeBaja) {
        controladorDarseDeBaja.abort();
        controladorDarseDeBaja = null;
      }
    },
    /** UC-40: ejecuta la baja y redirige fuera del detalle. */
    async confirmarDarseDeBaja(motivo) {
      if (this.dandoDeBaja) return;

      const texto = String(motivo ?? "").trim();
      if (!texto) {
        this.errorMotivoDarseDeBaja = "El motivo de la baja es obligatorio.";
        return;
      }
      if (texto.length > LIMITE_MOTIVO_BAJA) {
        this.errorMotivoDarseDeBaja =
          "El motivo de la baja no puede superar los 100 caracteres.";
        return;
      }

      this.dandoDeBaja = true;
      this.errorDarseDeBaja = "";
      this.errorMotivoDarseDeBaja = "";
      if (controladorDarseDeBaja) controladorDarseDeBaja.abort();
      controladorDarseDeBaja = new AbortController();

      try {
        await proyectoService.darseDeBajaProyecto(
          this.idProyecto,
          texto,
          controladorDarseDeBaja.signal
        );

        this.modalDarseDeBajaVisible = false;
        this.errorDarseDeBaja = "";
        this.errorMotivoDarseDeBaja = "";

        this.toast.init({
          title: "Te diste de baja",
          message: "Ya no formás parte del proyecto.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        // Destino fresco: ProyectosInicioView ejecuta GET /proyectos/propios
        // al montar, así que no hace falta invalidar una caché inexistente.
        await this.$router.push({ name: "proyectos-inicio" });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorDarseDeBaja(error);
      } finally {
        this.dandoDeBaja = false;
      }
    },
    async manejarErrorDarseDeBaja(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorDarseDeBaja(error);
      const { tipo, mensaje } = clasificacion;

      const mostrarToast = (title) => {
        this.toast.init({
          title,
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
      };

      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.SESION) {
        // El interceptor global ya limpió la sesión y redirigió a login.
        this.cerrarModalDarseDeBaja(true);
        return;
      }

      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.CUENTA) {
        this.cerrarModalDarseDeBaja(true);
        await this.cargar();
        mostrarToast("Cuenta no habilitada");
        return;
      }

      // Error corregible: el modal sigue abierto y conserva el motivo.
      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.MOTIVO) {
        this.errorMotivoDarseDeBaja = mensaje;
        return;
      }

      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.PERFIL_ACTIVO) {
        this.cerrarModalDarseDeBaja(true);
        this.mensajeError = mensaje;
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.PROYECTO_NO_ENCONTRADO) {
        this.cerrarModalDarseDeBaja(true);
        this.proyecto = null;
        this.estadoNoEncontrado = true;
        this.mensajeError = mensaje;
        this.mostrarVolver = true;
        return;
      }

      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.PERMISO) {
        this.cerrarModalDarseDeBaja(true);
        await this.cargar();
        mostrarToast("No se pudo dar de baja");
        return;
      }

      if (tipo === TIPOS_ERROR_DARSE_DE_BAJA.ULTIMO_DIRECTOR) {
        this.cerrarModalDarseDeBaja(true);
        await this.cargar();
        mostrarToast("Último director");
        return;
      }

      if (
        [
          TIPOS_ERROR_DARSE_DE_BAJA.ESTADO_PROYECTO,
          TIPOS_ERROR_DARSE_DE_BAJA.MEMBRESIA_INACTIVA,
        ].includes(tipo)
      ) {
        this.cerrarModalDarseDeBaja(true);
        await this.cargar();
        mostrarToast("No se pudo dar de baja");
        return;
      }

      // La ficha §8.3 manda cerrar ante 403/404/409 aunque el mensaje no
      // coincida con ningún patrón conocido: el backend sigue siendo la
      // fuente de verdad y el proyecto se recarga.
      if ([403, 404, 409].includes(status)) {
        this.cerrarModalDarseDeBaja(true);
        await this.cargar();
        mostrarToast("No se pudo dar de baja");
        return;
      }

      // 5xx o error no clasificado: el modal queda abierto para reintentar.
      this.errorDarseDeBaja = mensaje;
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
        // Tras un 409 de confirmación el refresco no debe borrar el mensaje:
        // el preview puede volver a decir "puedeConfirmar" y hacer desaparecer
        // el error real que devolvió el POST.
        if (inicial) this.errorConfirmacion = "";
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
            puedeDarseDeBaja:
              data.proyecto.puedeDarseDeBaja ??
              this.proyecto?.puedeDarseDeBaja ??
              false,
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
    /** UC-37: abre el diálogo y consulta el preview de finalización. */
    abrirFinalizacion() {
      if (!this.puedeFinalizarProyecto || this.finalizandoProyecto) return;
      this.errorFinalizacion = "";
      this.faltantesFinalizacion = [];
      this.modalFinalizacionVisible = true;
      this.cargarPreviewFinalizacion();
    },
    onCambioVisibilidadFinalizacion(valor) {
      if (valor) {
        this.modalFinalizacionVisible = true;
        return;
      }
      if (this.finalizandoProyecto) return;

      this.modalFinalizacionVisible = false;
      this.idCargaPreviewFinalizacion++;
      if (controladorFinalizacion) {
        controladorFinalizacion.abort();
        controladorFinalizacion = null;
      }
      this.previewFinalizacion = null;
      this.profesionesFinalizacion = {};
      this.cargandoPreviewFinalizacion = false;
      this.errorPreviewFinalizacion = "";
      this.puedeReintentarPreviewFinalizacion = false;
      this.errorFinalizacion = "";
      this.faltantesFinalizacion = [];
    },
    reintentarPreviewFinalizacion() {
      this.cargarPreviewFinalizacion();
    },
    /**
     * GET /proyectos/{id}/finalizacion + GET /proyectos/{id}/miembros.
     * El listado de miembros solo enriquece la profesión; si falla, el modal
     * sigue funcionando con nombre y rol.
     */
    async cargarPreviewFinalizacion() {
      if (this.finalizandoProyecto) return;
      const corrida = ++this.idCargaPreviewFinalizacion;

      if (controladorFinalizacion) controladorFinalizacion.abort();
      controladorFinalizacion = new AbortController();

      this.previewFinalizacion = null;
      this.profesionesFinalizacion = {};
      this.cargandoPreviewFinalizacion = true;
      this.errorPreviewFinalizacion = "";
      this.puedeReintentarPreviewFinalizacion = false;

      try {
        const resultados = await Promise.allSettled([
          proyectoService.previsualizarFinalizacion(
            this.idProyecto,
            controladorFinalizacion.signal
          ),
          proyectoService.listarMiembros(
            this.idProyecto,
            { todos: true },
            controladorFinalizacion.signal
          ),
        ]);
        if (corrida !== this.idCargaPreviewFinalizacion) return;

        const [previewRes, miembrosRes] = resultados;
        if (previewRes.status !== "fulfilled") {
          await this.manejarErrorPreviewFinalizacion(previewRes.reason);
          return;
        }

        this.previewFinalizacion = normalizarPreviewFinalizacion(
          previewRes.value?.data
        );
        this.profesionesFinalizacion =
          miembrosRes.status === "fulfilled"
            ? indexarProfesionesPorPerfil(miembrosRes.value?.data)
            : {};
        this.errorFinalizacion = "";
      } catch (error) {
        if (
          corrida === this.idCargaPreviewFinalizacion &&
          error?.code !== "ERR_CANCELED" &&
          error?.name !== "CanceledError"
        ) {
          await this.manejarErrorPreviewFinalizacion(error);
        }
      } finally {
        if (corrida === this.idCargaPreviewFinalizacion) {
          this.cargandoPreviewFinalizacion = false;
        }
      }
    },
    async manejarErrorPreviewFinalizacion(error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }

      const status = error?.response?.status;
      const clasificacion = clasificarErrorFinalizacion(error);
      const clasificacionProyecto = clasificarErrorProyecto(error);
      const mensaje = clasificacion.mensaje;

      if (status === 403) {
        this.modalFinalizacionVisible = false;
        this.toast.init({
          title: "No se pudo verificar",
          message:
            mensaje ||
            "No tenés permiso para finalizar este proyecto o no sos miembro activo.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (status === 404) {
        this.modalFinalizacionVisible = false;

        if (
          clasificacionProyecto?.tipo === "perfil-activo" ||
          /perfil\s*activo/i.test(mensaje)
        ) {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (
          clasificacionProyecto?.tipo === "perfil-no-encontrado" ||
          /perfil/i.test(mensaje)
        ) {
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        this.proyecto = null;
        this.estadoNoEncontrado = true;
        this.mensajeError = mensaje || "El proyecto no existe.";
        this.mostrarVolver = true;
        return;
      }

      this.errorPreviewFinalizacion = mensajeErrorApi(
        error,
        "No se pudo verificar el proyecto. Inténtalo nuevamente."
      );
      this.puedeReintentarPreviewFinalizacion = true;
    },
    /** UC-37: envía todas las calificaciones del director en un solo POST. */
    async confirmarFinalizacion(
      calificaciones,
      confirmarFinalizacionPrematura = false
    ) {
      if (this.finalizandoProyecto) return;
      if (!Array.isArray(calificaciones)) return;

      this.finalizandoProyecto = true;
      this.errorFinalizacion = "";
      this.faltantesFinalizacion = [];
      if (controladorFinalizacion) controladorFinalizacion.abort();
      controladorFinalizacion = new AbortController();

      try {
        const response = await proyectoService.finalizar(
          this.idProyecto,
          calificaciones,
          confirmarFinalizacionPrematura === true,
          controladorFinalizacion.signal
        );
        const data = response?.data || {};

        if (data.proyecto) {
          this.proyecto = {
            ...data.proyecto,
            esMiembro:
              data.proyecto.esMiembro ?? this.proyecto?.esMiembro ?? false,
            rolUsuario:
              data.proyecto.rolUsuario ?? this.proyecto?.rolUsuario ?? null,
            permisos: Array.isArray(data.proyecto.permisos)
              ? data.proyecto.permisos
              : this.proyecto?.permisos || [],
            puedeDarseDeBaja:
              data.proyecto.puedeDarseDeBaja ??
              this.proyecto?.puedeDarseDeBaja ??
              false,
            fechaFinalizacion:
              data.proyecto.fechaFinalizacion ??
              data.fechaFinalizacion ??
              this.proyecto?.fechaFinalizacion ??
              null,
            finalizacionPrematura:
              data.proyecto.finalizacionPrematura ??
              data.finalizacionPrematura ??
              this.proyecto?.finalizacionPrematura ??
              false,
          };
        } else {
          await this.cargar();
          if (data.fechaFinalizacion && this.proyecto) {
            this.proyecto = {
              ...this.proyecto,
              fechaFinalizacion: data.fechaFinalizacion,
              finalizacionPrematura:
                data.finalizacionPrematura ??
                this.proyecto?.finalizacionPrematura ??
                false,
            };
          }
        }

        const finalizacionPrematura =
          data.proyecto?.finalizacionPrematura === true ||
          this.proyecto?.finalizacionPrematura === true;

        this.modalFinalizacionVisible = false;
        this.previewFinalizacion = null;
        this.profesionesFinalizacion = {};
        this.errorFinalizacion = "";
        this.faltantesFinalizacion = [];
        this.refrescarNotificacionesPerfil();
        this.refrescarPersonalRequerido();

        const cantidad = Number(data.calificacionesRegistradas) || 0;
        const cierre = finalizacionPrematura
          ? "El proyecto quedó finalizado de forma anticipada"
          : "El proyecto quedó finalizado";
        this.toast.init({
          title: finalizacionPrematura
            ? "Proyecto finalizado anticipadamente"
            : "Proyecto finalizado",
          message: cantidad
            ? `${cierre} y se registraron ${cantidad} calificaciones.`
            : `${cierre} y se notificó a los integrantes.`,
          color: "success",
          position: "top-right",
          duration: 6000,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorFinalizacion(error);
      } finally {
        this.finalizandoProyecto = false;
      }
    },
    async manejarErrorFinalizacion(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorFinalizacion(error);
      const clasificacionProyecto = clasificarErrorProyecto(error);
      const mensaje = clasificacion.mensaje;

      if (status === 403) {
        this.modalFinalizacionVisible = false;
        this.toast.init({
          title: "No se pudo finalizar",
          message:
            mensaje ||
            "No tenés permiso para finalizar este proyecto o no sos miembro activo.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (status === 404) {
        this.modalFinalizacionVisible = false;

        if (
          clasificacionProyecto?.tipo === "perfil-activo" ||
          /perfil\s*activo/i.test(mensaje)
        ) {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (
          clasificacionProyecto?.tipo === "perfil-no-encontrado" ||
          /perfil/i.test(mensaje)
        ) {
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        this.proyecto = null;
        this.estadoNoEncontrado = true;
        this.mensajeError = mensaje || "El proyecto no existe.";
        this.mostrarVolver = true;
        return;
      }

      if (status === 409) {
        if (clasificacion.esConfirmacionPrematuraRequerida) {
          this.previewFinalizacion = {
            ...(this.previewFinalizacion || {}),
            requiereConfirmacionPrematura: true,
            diasAnticipacion:
              clasificacion.diasAnticipacion ||
              this.previewFinalizacion?.diasAnticipacion ||
              0,
            advertencias:
              this.previewFinalizacion?.advertencias?.length
                ? this.previewFinalizacion.advertencias
                : [
                    {
                      codigo: "FECHA_ENTREGA_FUTURA",
                      mensaje:
                        mensaje ||
                        "La fecha de entrega estipulada todavía no se alcanzó.",
                      entidadTipo: "PLANIFICACION",
                      entidadId: null,
                    },
                  ],
          };
          this.errorFinalizacion =
            mensaje ||
            "Confirmá la finalización anticipada para continuar.";
          return;
        }

        if (clasificacion.esCalificacionesIncompletas) {
          this.faltantesFinalizacion = clasificacion.faltantes;
          this.errorFinalizacion =
            mensaje || "Faltan calificaciones obligatorias para finalizar.";
          return;
        }

        if (clasificacion.esCalificacionInvalida) {
          this.errorFinalizacion =
            mensaje ||
            "Revisá la valoración y la reseña de las calificaciones.";
          return;
        }

        this.modalFinalizacionVisible = false;
        this.toast.init({
          title: "No se pudo finalizar",
          message:
            mensaje ||
            "El proyecto ya no se encuentra en un estado finalizable.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (status === 400) {
        this.errorFinalizacion =
          mensaje ||
          "Revisá la valoración y la reseña de las calificaciones.";
        return;
      }

      if (!status || status >= 500) {
        this.errorFinalizacion =
          "Ocurrió un error al finalizar el proyecto. Inténtalo nuevamente.";
        return;
      }

      this.errorFinalizacion = mensajeErrorApi(
        error,
        "No se pudo finalizar el proyecto."
      );
    },
    irACalificaciones() {
      this.$router.push({
        name: "calificaciones-proyecto",
        params: { id: this.idProyecto },
      });
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
        // Mismo usuario ya asignado a la actividad con otro perfil: no se
        // genera la postulación y se refresca el listado de asignados.
        if (esConflictoAsignacionUnica(error)) {
          this.modalPostulacion.visible = false;
          this.toast.init({
            title: "Ya estás asignado",
            message: mensaje || MENSAJE_USUARIO_YA_ASIGNADO_POSTULACION,
            color: "danger",
            position: "top-right",
            duration: 6000,
          });
          await this.cargar();
          this.refrescarPersonalRequerido();
          return;
        }

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
    irAInvitarProyecto() {
      if (!this.puedeInvitarIntegrante) return;
      this.$router.push({
        name: "invitar-proyecto",
        params: { id: this.idProyecto },
      });
    },
    irANuevoContrato() {
      if (!this.puedeVerContratos) return;
      this.$router.push({
        name: "generar-contrato",
        params: { id: this.idProyecto },
      });
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
      this.usuariosAsignadosActividad = usuariosAsignadosDe(actividad);
      this.errorAsignar = "";
      this.bloqueosAsignar = [];
      this.miembrosBloqueantesAsignar = [];
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
      this.usuariosAsignadosActividad = [];
      this.errorAsignar = "";
      this.bloqueosAsignar = [];
      this.miembrosBloqueantesAsignar = [];
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
      this.bloqueosAsignar = [];
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
        this.usuariosAsignadosActividad = [];
        this.bloqueosAsignar = [];
        this.miembrosBloqueantesAsignar = [];

        this.toast.init({
          title: "Actividad asignada",
          message: `${mensajeExitoAsignacion(data, miembro, actividad)}${
            this.esConfirmado
              ? " El cronograma se recalculó; revisá la planificación."
              : ""
          }`,
          color: "success",
          position: "top-right",
          duration: 7000,
        });

        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        this.refrescarNotificacionesPerfil();
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorAsignacion(error);
      } finally {
        this.asignando = false;
      }
    },
    abrirModalDesasignar({ actividad, responsable } = {}) {
      if (this.desasignando) return;
      if (
        !actividad?.idActividad ||
        !responsable?.idAsignacionActividad ||
        !puedeDesasignarActividad({
          proyecto: this.proyecto,
          actividad,
          responsable,
        })
      ) {
        return;
      }

      this.actividadDesasignar = { ...actividad };
      this.responsableDesasignar = responsable;
      this.errorDesasignar = "";
      this.modalDesasignarVisible = true;
    },
    onCambioVisibilidadDesasignar(valor) {
      if (this.desasignando && !valor) return;
      if (valor) {
        this.modalDesasignarVisible = true;
        return;
      }
      this.cerrarModalDesasignar();
    },
    cerrarModalDesasignar() {
      if (this.desasignando) return;
      this.modalDesasignarVisible = false;
      this.actividadDesasignar = null;
      this.responsableDesasignar = null;
      this.errorDesasignar = "";
      if (controladorDesasignacion) {
        controladorDesasignacion.abort();
        controladorDesasignacion = null;
      }
    },
    async confirmarDesasignacion() {
      if (this.desasignando) return;
      const actividad = this.actividadDesasignar;
      const responsable = this.responsableDesasignar;
      if (!actividad?.idActividad || !responsable?.idAsignacionActividad) {
        return;
      }

      this.desasignando = true;
      this.errorDesasignar = "";
      if (controladorDesasignacion) controladorDesasignacion.abort();
      controladorDesasignacion = new AbortController();

      try {
        const response = await actividadService.desasignar(
          this.idProyecto,
          actividad.idActividad,
          responsable.idAsignacionActividad,
          controladorDesasignacion.signal
        );
        const data = response?.data || {};

        this.modalDesasignarVisible = false;
        this.actividadDesasignar = null;
        this.responsableDesasignar = null;

        this.toast.init({
          title: "Miembro desasignado",
          message: mensajeExitoDesasignacion(data, responsable, actividad),
          color: "success",
          position: "top-right",
          duration: 7000,
        });

        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
          this.tokenRefrescoDisponibilidad += 1;
        });
        this.refrescarNotificacionesPerfil();
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorDesasignacion(error);
      } finally {
        this.desasignando = false;
      }
    },
    async manejarErrorDesasignacion(error) {
      const { tipo, mensaje } = clasificarErrorDesasignacion(error);

      const cerrar = () => {
        this.modalDesasignarVisible = false;
        this.actividadDesasignar = null;
        this.responsableDesasignar = null;
        this.errorDesasignar = "";
      };

      if (tipo === TIPOS_ERROR_ASIGNACION.SESION) {
        cerrar();
        await refrescarSesion();
        this.mensajeError = "Tu sesión expiró. Volvé a iniciar sesión.";
        this.$router.push({ name: "login" });
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

      if (
        tipo === TIPOS_ERROR_ASIGNACION.RECURSO_NO_ENCONTRADO ||
        tipo === TIPOS_ERROR_ASIGNACION.ESTADO_INVALIDO ||
        tipo === TIPOS_ERROR_ASIGNACION.MIEMBRO_INACTIVO ||
        tipo === TIPOS_ERROR_ASIGNACION.CONFLICTO
      ) {
        cerrar();
        this.toast.init({
          title: "No se pudo desasignar",
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

      this.errorDesasignar = mensaje;
    },
    /**
     * Recarga el detalle de la actividad abierta en el modal para actualizar
     * los perfiles y usuarios ya asignados después de un 409.
     */
    async refrescarAsignadosActividad() {
      const idActividad = this.actividadAsignar?.idActividad;
      if (idActividad == null) return;

      try {
        const response = await actividadService.obtener(
          this.idProyecto,
          idActividad
        );
        const detalle = response?.data;
        if (!detalle) return;

        // El modal pudo cerrarse o cambiar de actividad mientras cargaba.
        if (
          !this.modalAsignarVisible ||
          String(this.actividadAsignar?.idActividad) !== String(idActividad)
        ) {
          return;
        }

        this.actividadAsignar = detalle;
        this.perfilesAsignadosActividad = perfilesAsignadosDe(detalle);
        this.usuariosAsignadosActividad = usuariosAsignadosDe(detalle);
      } catch {
        // El refresco del listado es best-effort; el error original manda.
      }
    },
    async manejarErrorAsignacion(error) {
      const clasificacion = clasificarErrorAsignacion(error);
      const { tipo, mensaje, bloqueos = [] } = clasificacion;
      this.bloqueosAsignar = Array.isArray(bloqueos) ? bloqueos : [];
      this.miembrosBloqueantesAsignar = Array.isArray(clasificacion.miembrosBloqueantes)
        ? clasificacion.miembrosBloqueantes
        : [];

      const cerrar = () => {
        this.modalAsignarVisible = false;
        this.actividadAsignar = null;
        this.perfilesAsignadosActividad = [];
        this.usuariosAsignadosActividad = [];
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

      if (
        tipo === TIPOS_ERROR_ASIGNACION.USUARIO_YA_ASIGNADO ||
        tipo === TIPOS_ERROR_ASIGNACION.DUPLICADO
      ) {
        this.errorAsignar = mensaje;
        this.tokenRefrescoMiembros += 1;
        await this.refrescarAsignadosActividad();
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

      // UC-51: el modal carga los integrantes exclusivos. No se pide el detalle
      // de la actividad (dependía de MODIFICAR_ACTIVIDAD y ya no es necesario).
      this.actividadEliminar = {
        ...actividad,
        idProyecto,
      };
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
      this.erroresMiembroEliminarActividad = {};
      this.conflictoEliminarActividadEnCurso = false;
      this.modalEliminarActividadVisible = true;
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
      const refrescar = this.conflictoEliminarActividadEnCurso;
      this.modalEliminarActividadVisible = false;
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
      this.erroresMiembroEliminarActividad = {};
      this.conflictoEliminarActividadEnCurso = false;
      this.actividadEliminar = {};
      if (controladorEliminacion) {
        controladorEliminacion.abort();
        controladorEliminacion = null;
      }
      // El 409 de EN_CURSO no cambia datos, pero la ficha pide refrescar al
      // salir para no dejar estado viejo en la planificación.
      if (refrescar) this.refrescarTrasEliminar();
    },
    limpiarErroresEliminarActividad() {
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
    },
    refrescarTrasEliminar() {
      this.cargar();
      this.$nextTick(() => {
        this.tokenRefrescoPlanificacion += 1;
      });
      this.refrescarNotificacionesPerfil();
    },
    irActividadDesdeEliminacion() {
      const idActividad = this.actividadEliminar?.idActividad;
      this.cerrarModalEliminarActividad();
      if (!idActividad) return;
      this.$router.push({
        name: "modificar-actividad",
        params: { id: this.idProyecto, idActividad },
      });
    },
    async confirmarEliminarActividad({ motivo, decisiones } = {}) {
      if (this.eliminandoActividad) return;

      const idProyecto = this.idProyecto;
      const idActividadFinal = this.actividadEliminar?.idActividad;
      const nombreActividad = this.actividadEliminar?.nombre || "";
      const motivoFinal = String(motivo ?? "").trim();
      const decisionesFinal = Array.isArray(decisiones) ? decisiones : [];

      if (!idProyecto || !idActividadFinal) {
        this.errorEliminarActividad =
          "No se pudo identificar la actividad a eliminar. Recargá la página e intentá nuevamente.";
        return;
      }
      if (!motivoFinal) {
        this.errorMotivoEliminarActividad =
          "El motivo de la eliminación es obligatorio.";
        return;
      }
      if (motivoFinal.length > 200) {
        this.errorMotivoEliminarActividad =
          "El motivo de la eliminación no puede superar los 200 caracteres.";
        return;
      }

      this.eliminandoActividad = true;
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
      this.erroresMiembroEliminarActividad = {};
      this.conflictoEliminarActividadEnCurso = false;
      if (controladorEliminacion) controladorEliminacion.abort();
      controladorEliminacion = new AbortController();

      try {
        await actividadService.eliminarConDecisiones(
          idProyecto,
          idActividadFinal,
          { motivo: motivoFinal, decisiones: decisionesFinal },
          controladorEliminacion.signal
        );

        const eliminados = decisionesFinal.filter(
          (decision) => decision?.accion === "ELIMINAR"
        ).length;

        await this.cargar();
        await this.$nextTick(() => {
          this.tokenRefrescoPlanificacion += 1;
        });
        if (eliminados > 0) {
          this.tokenRefrescoIntegrantes += 1;
        }
        this.refrescarNotificacionesPerfil();

        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "Actividad eliminada",
          message: mensajeExitoEliminarActividad({
            nombreActividad,
            eliminados,
          }),
          color: "success",
          position: "top-right",
          duration: 6000,
        });
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        await this.manejarErrorEliminarActividad(error, decisionesFinal);
      } finally {
        this.eliminandoActividad = false;
      }
    },
    async manejarErrorEliminarActividad(error, decisiones = []) {
      const resultado = clasificarErrorEliminarActividad(error, {
        decisiones,
      });

      if (
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.SESION ||
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.CUENTA
      ) {
        this.errorEliminarActividad = resultado.mensaje;
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.MOTIVO) {
        this.errorMotivoEliminarActividad = resultado.mensaje;
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.DECISIONES) {
        this.errorEliminarActividad = resultado.mensaje;
        this.erroresMiembroEliminarActividad = {};
        // El backend devuelve un único error: recargar la lista para que el
        // usuario vuelva a decidir sobre el estado actual.
        this.tokenRefrescoExclusivos += 1;
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.MOTIVO_BAJA) {
        this.erroresMiembroEliminarActividad = {
          ...(resultado.erroresPorMiembro || {}),
        };
        if (resultado.mensajeCampo) {
          this.errorMotivoEliminarActividad = resultado.mensajeCampo;
        }
        if (
          Object.keys(this.erroresMiembroEliminarActividad).length === 0 &&
          !resultado.mensajeCampo
        ) {
          this.errorEliminarActividad = resultado.mensaje;
        }
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.FALLBACK_MOTIVO) {
        const errores = {};
        for (const id of idsEliminarSinMotivo(decisiones)) {
          errores[String(id)] =
            "Ingresá un motivo de baja de hasta 100 caracteres: el motivo de la actividad supera ese límite.";
        }
        this.erroresMiembroEliminarActividad = errores;
        if (Object.keys(errores).length === 0) {
          this.errorEliminarActividad = resultado.mensaje;
        }
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERMISO) {
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "No se pudo eliminar",
          message:
            resultado.mensaje ||
            "No tenés permiso para eliminar esta actividad.",
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

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERFIL_ACTIVO) {
        this.cerrarModalEliminarActividad();
        this.mensajeError =
          resultado.mensaje ||
          "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERFIL_NO_ENCONTRADO
      ) {
        this.cerrarModalEliminarActividad();
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.NO_ENCONTRADO) {
        if (/proyecto/i.test(resultado.mensaje || "")) {
          this.cerrarModalEliminarActividad();
          this.proyecto = null;
          this.estadoNoEncontrado = true;
          this.mensajeError = resultado.mensaje;
          this.mostrarVolver = true;
          return;
        }
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "No se pudo eliminar",
          message: resultado.mensaje,
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

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.ESTADO) {
        this.cerrarModalEliminarActividad();
        this.toast.init({
          title: "No se pudo eliminar",
          message: resultado.mensaje,
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
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.EN_CURSO_CONFIRMADO
      ) {
        // Mantener el modal abierto: el CTA "Ir a la actividad" permite
        // cancelarla primero desde Modificar actividad.
        this.errorEliminarActividad = resultado.mensaje;
        this.conflictoEliminarActividadEnCurso = true;
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.NO_ELIMINABLE) {
        this.errorEliminarActividad = resultado.mensaje;
        this.tokenRefrescoExclusivos += 1;
        return;
      }

      this.errorEliminarActividad =
        resultado.mensaje ||
        "Ocurrió un error al eliminar la actividad. Inténtalo nuevamente.";
    },
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
    if (controladorPublicacion) controladorPublicacion.abort();
    if (controladorCancelacion) controladorCancelacion.abort();
    if (controladorEliminacion) controladorEliminacion.abort();
    if (controladorAsignacion) controladorAsignacion.abort();
    if (controladorDesasignacion) controladorDesasignacion.abort();
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
