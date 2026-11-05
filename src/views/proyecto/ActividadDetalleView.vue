<template>
  <div class="actividad-detalle">
    <div v-if="cargando" class="actividad-detalle__estado">
      <span class="material-symbols-outlined actividad-detalle__estado-icono">
        hourglass_empty
      </span>
      Cargando actividad...
    </div>

    <template v-else>
      <section v-if="estadoNoEncontrado" class="actividad-detalle__estado">
        <span class="material-symbols-outlined actividad-detalle__estado-icono">
          folder_open
        </span>
        <p class="actividad-detalle__estado-titulo">Actividad no encontrada</p>
        <p class="actividad-detalle__estado-texto">
          {{ mensajeError || "No encontramos la actividad que estás buscando." }}
        </p>
        <VaButton preset="secondary" @click="volverAlProyecto">
          Volver al proyecto
        </VaButton>
      </section>

      <section v-else-if="sinAcceso" class="actividad-detalle__estado">
        <span class="material-symbols-outlined actividad-detalle__estado-icono">
          lock
        </span>
        <p class="actividad-detalle__estado-titulo">Sin acceso</p>
        <p class="actividad-detalle__estado-texto">
          {{ mensajeError || "No tenés acceso a esta actividad." }}
        </p>
        <VaButton preset="secondary" @click="volverAlProyecto">
          Volver al proyecto
        </VaButton>
      </section>

      <template v-else-if="actividad">
        <p class="actividad-detalle__migas">
          <router-link
            :to="{ name: 'dashboard-proyecto', params: { id: idProyecto }, query: { tab: 'postulaciones' } }"
            class="actividad-detalle__miga"
          >
            {{ nombreProyecto || "Proyecto" }}
          </router-link>
          <span aria-hidden="true">›</span>
          <span>Actividades</span>
        </p>

        <section class="actividad-detalle__cabecera">
          <header class="actividad-detalle__titular">
            <div class="actividad-detalle__titulo-grupo">
              <h1 class="actividad-detalle__titulo">{{ actividad.nombre }}</h1>
              <span class="actividad-detalle__estado" :style="estiloEstado">
                {{ etiquetaEstadoActividad(actividad.estado) }}
              </span>
              <ChipOrigenInicio :origen="actividad.origenInicio" />
            </div>

            <p v-if="actividad.descripcion" class="actividad-detalle__descripcion">
              {{ actividad.descripcion }}
            </p>

            <div
              v-if="tienePermisoEliminar"
              class="actividad-detalle__acciones-cabecera"
            >
              <VaButton
                color="danger"
                preset="secondary"
                size="small"
                :disabled="!puedeEliminarActividad"
                :title="motivoNoEliminable"
                @click="abrirModalEliminar"
              >
                <template #prepend>
                  <span class="material-symbols-outlined" aria-hidden="true">
                    delete
                  </span>
                </template>
                Eliminar actividad
              </VaButton>
            </div>
          </header>

          <dl class="actividad-detalle__meta">
            <div class="actividad-detalle__meta-item">
              <dt>Proyecto</dt>
              <dd>{{ nombreProyecto || "—" }}</dd>
            </div>
            <div class="actividad-detalle__meta-item">
              <dt>Fecha</dt>
              <dd>{{ fechaActividad }}</dd>
            </div>
            <div class="actividad-detalle__meta-item">
              <dt>Horario</dt>
              <dd>{{ horarioActividad }}</dd>
            </div>
            <div class="actividad-detalle__meta-item">
              <dt>Duración</dt>
              <dd>{{ duracionActividad }}</dd>
            </div>
          </dl>

          <p v-if="esProyectada" class="actividad-detalle__aviso">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            Las fechas de esta actividad son proyectadas por CPM y pueden
            cambiar hasta confirmar el proyecto.
          </p>
        </section>

        <h2 class="actividad-detalle__subtitulo">
          Requerimientos de la actividad
        </h2>

        <div v-if="requerimientos.length" class="actividad-detalle__lista">
          <RequerimientoCard
            v-for="requerimiento in requerimientos"
            :key="requerimiento.idRequerimiento"
            :requerimiento="requerimiento"
            :habilidades="habilidades"
            :catalogo-caracteristicas="
              catalogoDelRequerimiento(requerimiento)
            "
            :mostrar-accion="puedePostularse(requerimiento)"
            :sin-cupo="estaSinCupo(requerimiento)"
            :motivo="motivo(requerimiento)"
          >
            <template #accion>
              <VaButton
                preset="primary"
                size="small"
                :disabled="estaDeshabilitado(requerimiento)"
                :loading="estaEnviando(requerimiento)"
                :aria-busy="estaEnviando(requerimiento) ? 'true' : 'false'"
                @click="abrirPostulacion(requerimiento)"
              >
                {{
                  estaPostulado(requerimiento)
                    ? "Postulación enviada"
                    : "Postularme"
                }}
              </VaButton>
            </template>
          </RequerimientoCard>
        </div>

        <p v-else class="actividad-detalle__vacio">
          Esta actividad todavía no tiene requerimientos cargados.
        </p>

        <h2 class="actividad-detalle__subtitulo">
          Profesionales asignados
        </h2>

        <div
          v-if="profesionalesVisibles.length"
          class="actividad-detalle__profesionales"
        >
          <article
            v-for="profesional in profesionalesVisibles"
            :key="
              profesional.idAsignacionActividad ??
              `${profesional.idPerfil}-${profesional.idUsuario}`
            "
            class="profesional-actividad"
          >
            <div class="profesional-actividad__datos">
              <p class="profesional-actividad__nombre">
                {{ profesional.nombreArtistico || "Perfil" }}
              </p>
              <p
                v-if="profesional.nombreProfesion"
                class="profesional-actividad__profesion"
              >
                {{ profesional.nombreProfesion }}
              </p>
            </div>

            <span
              v-if="esHistorico(profesional)"
              class="profesional-actividad__historico"
            >
              {{ etiquetaParticipacion(profesional) }}
            </span>
          </article>
        </div>

        <p v-else class="actividad-detalle__vacio">
          Sin profesionales asignados.
        </p>

        <p
          v-if="requerimientos.length && !aceptaPostulaciones"
          class="actividad-detalle__cerrada"
        >
          {{ textos.AVISO_ACTIVIDAD_CERRADA }}
        </p>

        <BaseAlert
          v-if="mensajeError"
          :message="mensajeError"
          type="error"
          class="actividad-detalle__alerta"
        />
        <div v-if="puedeReintentar" class="actividad-detalle__reintento">
          <VaButton preset="primary" icon="mso-refresh" @click="cargar">
            Reintentar
          </VaButton>
        </div>

        <ModalPostulacion
          :model-value="modal.visible"
          :id-proyecto="idProyecto"
          :tipo="TIPOS_POSTULACION.ACTIVIDAD"
          :nombre-proyecto="nombreProyecto"
          :requerimiento="modal.requerimiento"
          :actividad="actividad"
          :sin-fecha-entrega="sinFechaEntrega"
          :enviando="enviando"
          :error="errorPostulacion"
          :sugerir-calendario="errorEsDisponibilidad"
          @update:model-value="modal.visible = $event"
          @confirmar="confirmarPostulacion"
          @revisar-calendario="revisarCalendario"
        />

        <ModalEliminarActividad
          :model-value="modalEliminarVisible"
          :id-proyecto="idProyecto"
          :actividad="actividad"
          :nombre-proyecto="nombreProyecto"
          :eliminando="eliminandoActividad"
          :error="errorEliminarActividad"
          :error-motivo="errorMotivoEliminarActividad"
          :errores-por-miembro="erroresMiembroEliminarActividad"
          :conflicto-en-curso="conflictoEliminarActividadEnCurso"
          :puede-ir-actividad="tienePermisoModificar"
          :token-refresco-exclusivos="tokenRefrescoExclusivos"
          @update:modelValue="onCambioVisibilidadEliminar"
          @limpiar-error="limpiarErroresEliminar"
          @limpiar-errores-filas="erroresMiembroEliminarActividad = {}"
          @ir-actividad="irActividadDesdeEliminacion"
          @recargar="volverAPlanificacion"
          @confirmar="confirmarEliminarActividad"
        />
      </template>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService.js";
import actividadService from "../../services/actividadService.js";
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import { refrescarSesion, idPerfilActivo } from "../../services/authState";
import { cargarResumenPerfil } from "../../services/notificacionState";
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import RequerimientoCard from "../../components/proyecto/RequerimientoCard.vue";
import ChipOrigenInicio from "../../components/proyecto/ChipOrigenInicio.vue";
import ModalPostulacion from "../../components/proyecto/ModalPostulacion.vue";
import ModalEliminarActividad from "../../components/proyecto/ModalEliminarActividad.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import {
  TIPOS_ERROR_ELIMINAR_ACTIVIDAD,
  clasificarErrorEliminarActividad,
  idsEliminarSinMotivo,
  mensajeExitoEliminarActividad,
  motivoNoEliminableActividad as evaluarMotivoNoEliminableActividad,
  puedeEliminarActividad as evaluarPuedeEliminarActividad,
} from "../../utils/eliminacionActividadConstants.js";
import {
  coloresEstadoActividad,
  esProfesionalHistorico,
  etiquetaEstadoActividad,
  etiquetaParticipacionProfesional,
  formatearDuracionMinutos,
  mostrarHistoricosEnActividad,
  profesionalesActuales,
} from "../../utils/actividadConstants.js";
import {
  formatearFechaConDia,
  formatearRangoHoras,
} from "../../utils/fechas.js";
import {
  TEXTOS_POSTULACIONES,
  TIPOS_POSTULACION,
  clavePostulacion,
  esCupoCompleto,
  esErrorCupoCompleto,
  esErrorDisponibilidad,
  esErrorPostulacionDuplicada,
  mensajeExitoPostulacion,
  puedePostularRequerimiento,
} from "../../utils/postulacionConstants.js";
import {
  MENSAJE_USUARIO_YA_ASIGNADO_POSTULACION,
  esConflictoAsignacionUnica,
} from "../../utils/asignacionUnicaConstants.js";

/*
 * Detalle de actividad (ficha unificada §5.3). Accesible a miembros y no
 * miembros según la visibilidad del proyecto. Permite postularse a cada
 * requerimiento y avisa cuando la actividad ya no acepta postulaciones.
 */
export default {
  name: "ActividadDetalleView",
  components: {
    BaseAlert,
    RequerimientoCard,
    ModalPostulacion,
    ModalEliminarActividad,
    ChipOrigenInicio,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      textos: TEXTOS_POSTULACIONES,
      TIPOS_POSTULACION,
      actividad: null,
      proyecto: null,
      habilidades: [],
      catalogosCaracteristicas: {},
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      estadoNoEncontrado: false,
      sinAcceso: false,
      modal: { visible: false, requerimiento: null },
      enviando: false,
      errorPostulacion: "",
      errorEsDisponibilidad: false,
      postulacionesEnviadas: {},
      requerimientosSinCupo: {},
      modalEliminarVisible: false,
      eliminandoActividad: false,
      errorEliminarActividad: "",
      errorMotivoEliminarActividad: "",
      erroresMiembroEliminarActividad: {},
      conflictoEliminarActividadEnCurso: false,
      tokenRefrescoExclusivos: 0,
      idCarga: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    idActividad() {
      return this.$route.params.idActividad;
    },
    nombreProyecto() {
      return this.actividad?.nombreProyecto || this.proyecto?.nombre || "";
    },
    requerimientos() {
      return Array.isArray(this.actividad?.requerimientos)
        ? this.actividad.requerimientos
        : [];
    },
    inicio() {
      return this.actividad?.fechaHoraInicio || this.actividad?.inicioProyectado;
    },
    fin() {
      return this.actividad?.fechaHoraFin || this.actividad?.finProyectado;
    },
    fechaActividad() {
      return this.inicio
        ? formatearFechaConDia(this.inicio)
        : "Sin programar";
    },
    horarioActividad() {
      return this.inicio ? formatearRangoHoras(this.inicio, this.fin) : "—";
    },
    duracionActividad() {
      return formatearDuracionMinutos(this.actividad?.duracionMinutos);
    },
    profesionalesVisibles() {
      const lista = Array.isArray(this.actividad?.profesionalesAsignados)
        ? this.actividad.profesionalesAsignados
        : [];
      // En PENDIENTE no se muestran históricos; en EN_CURSO/FINALIZADA/
      // CANCELADA sí, con etiqueta y sin acciones operativas.
      return mostrarHistoricosEnActividad(this.actividad?.estado)
        ? lista
        : profesionalesActuales(lista);
    },
    esProyectada() {
      return (
        this.actividad?.tentativo === true ||
        (!this.actividad?.fechaHoraInicio && !!this.actividad?.inicioProyectado)
      );
    },
    sinFechaEntrega() {
      return !!this.proyecto && !this.proyecto.fechaEntregaEstipulada;
    },
    aceptaPostulaciones() {
      return this.requerimientos.some(
        (requerimiento) => puedePostularRequerimiento(requerimiento)
      );
    },
    tienePermisoEliminar() {
      return (this.proyecto?.permisos || []).includes("ELIMINAR_ACTIVIDAD");
    },
    tienePermisoModificar() {
      return (this.proyecto?.permisos || []).includes("MODIFICAR_ACTIVIDAD");
    },
    puedeEliminarActividad() {
      return evaluarPuedeEliminarActividad({
        tienePermiso: this.tienePermisoEliminar,
        estadoProyecto: this.proyecto?.estado,
        estadoActividad: this.actividad?.estado,
      });
    },
    motivoNoEliminable() {
      return evaluarMotivoNoEliminableActividad({
        tienePermiso: this.tienePermisoEliminar,
        estadoProyecto: this.proyecto?.estado,
        estadoActividad: this.actividad?.estado,
      });
    },
    estiloEstado() {
      const colores = coloresEstadoActividad(this.actividad?.estado);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
  },
  watch: {
    "$route.params.idActividad"(nuevo, anterior) {
      if (String(nuevo) === String(anterior)) return;
      this.cargar();
    },
  },
  created() {
    this.controlador = null;
    this.controladorPostulacion = null;
    this.controladorEliminacion = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
    if (this.controladorPostulacion) this.controladorPostulacion.abort();
    if (this.controladorEliminacion) this.controladorEliminacion.abort();
  },
  methods: {
    etiquetaEstadoActividad,
    esHistorico(profesional) {
      return esProfesionalHistorico(profesional);
    },
    etiquetaParticipacion(profesional) {
      return etiquetaParticipacionProfesional(profesional);
    },
    async cargar() {
      if (this.modalEliminarVisible) this.cerrarModalEliminar();
      const corrida = ++this.idCarga;
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.estadoNoEncontrado = false;
      this.sinAcceso = false;
      this.modal = { visible: false, requerimiento: null };

      try {
        const response = await actividadService.obtener(
          this.idProyecto,
          this.idActividad,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        this.actividad = response?.data || null;
        if (!this.actividad) {
          this.estadoNoEncontrado = true;
          return;
        }

        await this.cargarCatalogos(corrida);
        this.cargarProyecto(corrida);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    /** El proyecto solo aporta `fechaEntregaEstipulada` al modal de postulación. */
    async cargarProyecto(corrida) {
      try {
        const response = await proyectoService.obtener(this.idProyecto);
        if (corrida !== this.idCarga) return;
        this.proyecto = response?.data || null;
      } catch {
        // Sin proyecto, el modal no bloquea por fecha de entrega.
      }
    },
    async cargarCatalogos(corrida) {
      const requerimientos = this.requerimientos;
      const idsProfesion = [
        ...new Set(
          requerimientos.map((r) => r?.idProfesion).filter(Boolean)
        ),
      ];

      const resultados = await Promise.allSettled([
        habilidadService.listar(),
        ...idsProfesion.map((id) => perfilService.caracteristicasPorProfesion(id)),
      ]);
      if (corrida !== this.idCarga) return;

      const datosHabilidades = resultados[0]?.value?.data;
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
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      if (status === 403) {
        if (error?._esSesionExpirada) {
          this.mensajeError = mensajeErrorApi(error);
          return;
        }
        this.sinAcceso = true;
        return;
      }

      if (status === 404) {
        if (clasificacion?.tipo === "perfil-activo") {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        if (clasificacion?.tipo === "perfil-no-encontrado") {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.estadoNoEncontrado = true;
        this.mensajeError =
          mensaje || "La actividad ya no existe o no está disponible.";
        return;
      }

      if (status === 401) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al cargar la actividad. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudo cargar la actividad."
      );
    },
    catalogoDelRequerimiento(requerimiento) {
      return (
        this.catalogosCaracteristicas?.[requerimiento?.idProfesion] || null
      );
    },
    claveDe(requerimiento) {
      return clavePostulacion(
        TIPOS_POSTULACION.ACTIVIDAD,
        requerimiento?.idRequerimiento
      );
    },
    puedePostularse(requerimiento) {
      return (
        !this.estaSinCupo(requerimiento) &&
        puedePostularRequerimiento(requerimiento)
      );
    },
    estaSinCupo(requerimiento) {
      const clave = this.claveDe(requerimiento);
      return !!clave && !!this.requerimientosSinCupo[clave];
    },
    estaPostulado(requerimiento) {
      const clave = this.claveDe(requerimiento);
      return !!clave && !!this.postulacionesEnviadas[clave];
    },
    estaEnviando(requerimiento) {
      const clave = this.claveDe(requerimiento);
      return !!clave && this.modal.requerimiento === requerimiento && this.enviando;
    },
    estaDeshabilitado(requerimiento) {
      return this.estaPostulado(requerimiento) || this.enviando;
    },
    motivo(requerimiento) {
      if (this.puedePostularse(requerimiento)) return "";
      if (this.estaSinCupo(requerimiento) || esCupoCompleto(requerimiento)) {
        return this.textos.CUPO_COMPLETO;
      }
      if (requerimiento?.puedePostularse === false) {
        return this.textos.NO_DISPONIBLE;
      }
      return "";
    },
    abrirPostulacion(requerimiento) {
      if (!this.puedePostularse(requerimiento) || this.estaPostulado(requerimiento)) {
        return;
      }
      this.errorPostulacion = "";
      this.errorEsDisponibilidad = false;
      this.modal = { visible: true, requerimiento };
    },
    async confirmarPostulacion() {
      if (this.enviando) return;
      const requerimiento = this.modal.requerimiento;
      if (!requerimiento?.idRequerimiento) return;

      this.enviando = true;
      this.errorPostulacion = "";
      this.errorEsDisponibilidad = false;

      if (this.controladorPostulacion) this.controladorPostulacion.abort();
      this.controladorPostulacion = new AbortController();

      try {
        await proyectoService.postularARequerimientoActividad(
          this.idProyecto,
          requerimiento.idRequerimiento,
          this.controladorPostulacion.signal
        );

        const clave = this.claveDe(requerimiento);
        this.postulacionesEnviadas = {
          ...this.postulacionesEnviadas,
          [clave]: true,
        };
        this.modal.visible = false;

        this.toast.init({
          title: "Postulación enviada",
          message: mensajeExitoPostulacion(
            TIPOS_POSTULACION.ACTIVIDAD,
            this.actividad?.nombre
          ),
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        await this.cargar();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorPostulacion(error);
      } finally {
        this.enviando = false;
      }
    },
    async manejarErrorPostulacion(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 400) {
        this.errorPostulacion =
          mensaje || "No se pudo enviar la postulación. Revisá los datos.";
        return;
      }

      if (status === 401) {
        this.modal.visible = false;
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
        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo postular",
          message: mensaje || "La actividad ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      if (status === 409) {
        // Mismo usuario ya asignado a la actividad con otro perfil: no se
        // genera la postulación y se refresca el detalle/asignados.
        if (esConflictoAsignacionUnica(error)) {
          this.modal.visible = false;
          this.toast.init({
            title: "Ya estás asignado",
            message: mensaje || MENSAJE_USUARIO_YA_ASIGNADO_POSTULACION,
            color: "danger",
            position: "top-right",
            duration: 6000,
          });
          await this.cargar();
          return;
        }

        if (esErrorDisponibilidad(error)) {
          this.errorPostulacion = mensaje;
          this.errorEsDisponibilidad = true;
          return;
        }

        const requerimiento = this.modal.requerimiento;
        const clave = this.claveDe(requerimiento);

        if (esErrorPostulacionDuplicada(error) && clave) {
          this.postulacionesEnviadas = {
            ...this.postulacionesEnviadas,
            [clave]: true,
          };
        }

        if (esErrorCupoCompleto(error) && clave) {
          this.requerimientosSinCupo = {
            ...this.requerimientosSinCupo,
            [clave]: true,
          };
        }

        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo postular",
          message: mensaje || "La postulación no se pudo completar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
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
    revisarCalendario() {
      this.modal.visible = false;
      this.$router.push({ name: "calendario" });
    },
    abrirModalEliminar() {
      if (!this.puedeEliminarActividad) return;
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
      this.erroresMiembroEliminarActividad = {};
      this.conflictoEliminarActividadEnCurso = false;
      this.modalEliminarVisible = true;
    },
    onCambioVisibilidadEliminar(valor) {
      if (this.eliminandoActividad && !valor) return;
      if (valor) {
        this.modalEliminarVisible = true;
        return;
      }
      this.cerrarModalEliminar();
    },
    cerrarModalEliminar() {
      this.modalEliminarVisible = false;
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
      this.erroresMiembroEliminarActividad = {};
      this.conflictoEliminarActividadEnCurso = false;
      if (this.controladorEliminacion) {
        this.controladorEliminacion.abort();
        this.controladorEliminacion = null;
      }
    },
    limpiarErroresEliminar() {
      this.errorEliminarActividad = "";
      this.errorMotivoEliminarActividad = "";
    },
    async confirmarEliminarActividad({ motivo, decisiones } = {}) {
      if (this.eliminandoActividad) return;

      const motivoFinal = String(motivo ?? "").trim();
      const decisionesFinal = Array.isArray(decisiones) ? decisiones : [];
      const nombreActividad = this.actividad?.nombre || "";

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
      if (this.controladorEliminacion) this.controladorEliminacion.abort();
      this.controladorEliminacion = new AbortController();

      try {
        await actividadService.eliminarConDecisiones(
          this.idProyecto,
          this.idActividad,
          { motivo: motivoFinal, decisiones: decisionesFinal },
          this.controladorEliminacion.signal
        );

        const eliminados = decisionesFinal.filter(
          (decision) => decision?.accion === "ELIMINAR"
        ).length;

        this.cerrarModalEliminar();
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

        const idPerfil = idPerfilActivo();
        if (idPerfil != null) await cargarResumenPerfil(idPerfil);

        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
          query: { tab: "planificacion" },
        });
      } catch (error) {
        if (this.esCancelacion(error)) return;
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

      if (
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.EN_CURSO_CONFIRMADO
      ) {
        this.errorEliminarActividad = resultado.mensaje;
        this.conflictoEliminarActividadEnCurso = true;
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.NO_ELIMINABLE) {
        this.errorEliminarActividad = resultado.mensaje;
        this.tokenRefrescoExclusivos += 1;
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERMISO) {
        this.cerrarModalEliminar();
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
        return;
      }

      if (resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERFIL_ACTIVO) {
        this.cerrarModalEliminar();
        this.mensajeError =
          resultado.mensaje ||
          "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.PERFIL_NO_ENCONTRADO
      ) {
        this.cerrarModalEliminar();
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.NO_ENCONTRADO ||
        resultado.tipo === TIPOS_ERROR_ELIMINAR_ACTIVIDAD.ESTADO
      ) {
        this.cerrarModalEliminar();
        this.toast.init({
          title: "No se pudo eliminar",
          message: resultado.mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      this.errorEliminarActividad =
        resultado.mensaje ||
        "Ocurrió un error al eliminar la actividad. Inténtalo nuevamente.";
    },
    irActividadDesdeEliminacion() {
      const idActividad = this.idActividad;
      this.cerrarModalEliminar();
      this.$router.push({
        name: "modificar-actividad",
        params: { id: this.idProyecto, idActividad },
      });
    },
    volverAPlanificacion() {
      this.cerrarModalEliminar();
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: "planificacion" },
      });
    },
    volverAlProyecto() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: "postulaciones" },
      });
    },
  },
};
</script>

<style scoped>
.actividad-detalle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.actividad-detalle__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.actividad-detalle__estado-icono {
  font-size: 2rem;
}

.actividad-detalle__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.actividad-detalle__estado-texto {
  margin: 0;
  max-width: 32rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.actividad-detalle__migas {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.actividad-detalle__miga {
  color: var(--color-primary);
  text-decoration: none;
}

.actividad-detalle__miga:hover {
  text-decoration: underline;
}

.actividad-detalle__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.actividad-detalle__titulo-grupo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.actividad-detalle__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
}

.actividad-detalle__estado {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.actividad-detalle__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.actividad-detalle__acciones-cabecera {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.75rem;
}

.actividad-detalle__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-border-soft);
}

.actividad-detalle__meta-item dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.actividad-detalle__meta-item dd {
  margin: 0.15rem 0 0;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
}

.actividad-detalle__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.actividad-detalle__aviso .material-symbols-outlined {
  font-size: 1rem;
}

.actividad-detalle__subtitulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.actividad-detalle__lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.actividad-detalle__vacio {
  margin: 0;
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

.actividad-detalle__profesionales {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profesional-actividad {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.profesional-actividad__datos {
  min-width: 0;
}

.profesional-actividad__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
}

.profesional-actividad__profesion {
  margin: 0.1rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.profesional-actividad__historico {
  flex: 0 0 auto;
  padding: 0.12rem 0.5rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 999px;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-style: italic;
  font-weight: 600;
  white-space: nowrap;
}

.actividad-detalle__cerrada {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.actividad-detalle__alerta {
  margin: 0 !important;
}

.actividad-detalle__reintento {
  display: flex;
  justify-content: center;
}

@media (max-width: 720px) {
  .actividad-detalle__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
