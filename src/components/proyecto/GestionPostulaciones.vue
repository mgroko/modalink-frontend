<template>
  <section class="gestion-postulaciones">
    <FiltrosPostulaciones
      :filtros="filtros"
      :profesiones="profesiones"
      :cargando-profesiones="cargandoProfesiones"
      :error-fechas="errorFechas"
      :conteos="conteos"
      @cambio="cambiarFiltro"
      @limpiar="limpiarFiltros"
      @buscar-ahora="buscar(0)"
    />

    <p v-if="!cargando && !mensajeError" class="gestion-postulaciones__resumen">
      {{ paginacion.totalElementos }} postulación(es)
      <template v-if="!esTodos && paginacion.totalPaginas > 1">
        · Página {{ paginacion.paginaActual + 1 }} de
        {{ paginacion.totalPaginas }}
      </template>
    </p>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <section
      v-if="resultadoGestion"
      class="gestion-postulaciones__resultado"
      role="status"
    >
      <header class="gestion-postulaciones__resultado-cabecera">
        <span class="material-symbols-outlined" aria-hidden="true">warning</span>
        <strong class="gestion-postulaciones__resultado-titulo">
          Aceptación con observaciones
        </strong>
        <VaButton
          preset="secondary"
          size="small"
          @click="resultadoGestion = null"
        >
          Cerrar
        </VaButton>
      </header>

      <p v-if="resultadoGestion.ajuste" class="gestion-postulaciones__resultado-texto">
        {{ resultadoGestion.ajuste }}
      </p>

      <ul
        v-if="resultadoGestion.advertencias.length"
        class="gestion-postulaciones__resultado-lista"
      >
        <li
          v-for="(advertencia, indice) in resultadoGestion.advertencias"
          :key="`${advertencia.idActividad ?? 'actividad'}-${indice}`"
        >
          Posible superposición con
          «{{ advertencia.nombreActividad || "actividad" }}»
          <template v-if="advertencia.nombreProyecto">
            ({{ advertencia.nombreProyecto }})
          </template>
          <template v-if="ventanaAdvertencia(advertencia)">
            · {{ ventanaAdvertencia(advertencia) }}
          </template>.
        </li>
      </ul>
    </section>

    <div v-if="puedeReintentar && !cargando" class="gestion-postulaciones__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="gestion-postulaciones__estado">
      <span class="material-symbols-outlined gestion-postulaciones__estado-icono">
        hourglass_empty
      </span>
      Cargando postulaciones...
    </div>

    <template v-else-if="!mensajeError">
      <div
        v-if="!postulaciones.length"
        class="gestion-postulaciones__estado gestion-postulaciones__vacio"
      >
        <span class="material-symbols-outlined gestion-postulaciones__estado-icono">
          inbox
        </span>
        <p class="gestion-postulaciones__vacio-titulo">
          {{
            hayFiltrosActivos
              ? "No hay postulaciones para los filtros seleccionados."
              : textos.VACIO_PROYECTO_ESTADO
          }}
        </p>
        <VaButton
          v-if="hayFiltrosActivos"
          preset="secondary"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </VaButton>
      </div>

      <template v-else>
        <TablaPostulaciones
          :postulaciones="postulaciones"
          :accion-en-curso="enviando"
          @aceptar="abrirModalAceptar"
          @rechazar="abrirModalRechazar"
        />

        <div
          v-if="!esTodos && paginacion.totalPaginas > 1"
          class="gestion-postulaciones__paginacion"
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
          <span class="gestion-postulaciones__pagina">
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
    </template>

    <ModalGestionPostulacion
      :model-value="modal.visible"
      :id-proyecto="idProyecto"
      :token-disponibilidad="tokenDisponibilidad"
      :accion="modal.accion"
      :postulacion="modal.postulacion"
      :nombre-proyecto="nombreProyecto"
      :actividad="actividadDetalle"
      :sin-fecha-entrega="sinFechaEntrega"
      :cargando-actividad="cargandoActividad"
      :error-actividad="errorActividad"
      :enviando="enviando"
      :error="errorGestion"
      @update:model-value="onModalVisibility"
      @confirmar="confirmarGestion"
    />
  </section>
</template>

<script>
import postulacionService from "../../services/postulacionService.js";
import actividadService from "../../services/actividadService.js";
import perfilService from "../../services/perfilService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import BaseAlert from "../AlertaBase.vue";
import FiltrosPostulaciones from "./FiltrosPostulaciones.vue";
import TablaPostulaciones from "./TablaPostulaciones.vue";
import ModalGestionPostulacion from "./ModalGestionPostulacion.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  RESULTADOS_PREFERENCIA,
  formatearVentana,
  mensajeAjustePreferencia,
} from "../../utils/disponibilidadConstants.js";
import {
  ACCIONES_GESTION,
  ESTADOS_POSTULACION,
  TEXTOS_POSTULACIONES,
  TIPOS_POSTULACION,
} from "../../utils/postulacionConstants.js";
import {
  TAMANO_POR_DEFECTO,
  construirParamsPostulaciones,
  validarRangoFechas,
} from "../../utils/parametrosPostulaciones.js";

const DEBOUNCE_BUSQUEDA_MS = 350;

function filtrosIniciales() {
  return {
    estado: ESTADOS_POSTULACION.PENDIENTE,
    tipo: "",
    nombrePerfil: "",
    idProfesion: "",
    fechaDesde: "",
    fechaHasta: "",
    tamano: TAMANO_POR_DEFECTO,
  };
}

/*
 * Contenedor de UC-74 + UC-34: listado, filtros, paginación y gestión de
 * postulaciones. El padre (PostulacionesProyectoView) valida el permiso; acá
 * sólo se asume un director con GESTIONAR_POSTULACIONES.
 */
export default {
  name: "GestionPostulaciones",
  components: {
    BaseAlert,
    FiltrosPostulaciones,
    TablaPostulaciones,
    ModalGestionPostulacion,
  },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    nombreProyecto: {
      type: String,
      default: "",
    },
    /** El proyecto no tiene fecha de entrega: no se permite aceptar. */
    sinFechaEntrega: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["gestionada"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: filtrosIniciales(),
      textos: TEXTOS_POSTULACIONES,
      /** Conteos por estado del contrato nuevo; vacío mientras no exista. */
      conteos: {},
      postulaciones: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: TAMANO_POR_DEFECTO,
        totalElementos: 0,
        totalPaginas: 1,
        primera: true,
        ultima: true,
      },
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      profesiones: [],
      cargandoProfesiones: false,
      modal: {
        visible: false,
        accion: ACCIONES_GESTION.ACEPTAR,
        postulacion: null,
      },
      enviando: false,
      errorGestion: "",
      /** Resultado de la última aceptación de actividad (ajuste/advertencias). */
      resultadoGestion: null,
      actividadDetalle: null,
      cargandoActividad: false,
      errorActividad: "",
      tokenDisponibilidad: 0,
      idCarga: 0,
      idActividadCarga: 0,
    };
  },
  computed: {
    errorFechas() {
      return validarRangoFechas(this.filtros.fechaDesde, this.filtros.fechaHasta);
    },
    esTodos() {
      return Number(this.filtros.tamano) === 0;
    },
    hayFiltrosActivos() {
      return (
        this.filtros.estado !== ESTADOS_POSTULACION.PENDIENTE ||
        !!this.filtros.tipo ||
        !!String(this.filtros.nombrePerfil || "").trim() ||
        (this.filtros.idProfesion !== "" &&
          this.filtros.idProfesion != null) ||
        !!this.filtros.fechaDesde ||
        !!this.filtros.fechaHasta ||
        Number(this.filtros.tamano) !== TAMANO_POR_DEFECTO
      );
    },
  },
  created() {
    this.controladorListado = null;
    this.controladorActividad = null;
    this.controladorGestion = null;
    this.debounceHandle = null;
  },
  mounted() {
    this.cargarProfesiones();
    this.buscar(0);
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    this.abortarListado();
    this.abortarActividad();
    if (this.controladorGestion) this.controladorGestion.abort();
  },
  methods: {
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        // El filtro por profesión queda sólo con "Todas"; no bloquea el listado.
        this.profesiones = [];
      } finally {
        this.cargandoProfesiones = false;
      }
    },
    cambiarFiltro({ campo, valor }) {
      this.filtros = { ...this.filtros, [campo]: valor };
      if (this.errorFechas) return;
      if (campo === "nombrePerfil") {
        this.programarBusqueda();
        return;
      }
      this.buscar(0);
    },
    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => {
        this.buscar(0);
      }, DEBOUNCE_BUSQUEDA_MS);
    },
    limpiarFiltros() {
      this.filtros = filtrosIniciales();
      this.buscar(0);
    },
    abortarListado() {
      if (this.controladorListado) {
        this.controladorListado.abort();
        this.controladorListado = null;
      }
    },
    abortarActividad() {
      if (this.controladorActividad) {
        this.controladorActividad.abort();
        this.controladorActividad = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    /**
     * Normaliza `conteosPorEstado` del contrato nuevo. Si el backend todavía
     * no lo devuelve, deja los tres estados en null y las tabs se muestran sin
     * número.
     * @param {object|null|undefined} valor
     * @returns {Record<string, number|null>}
     */
    normalizarConteos(valor) {
      const conteos = {};
      for (const estado of Object.values(ESTADOS_POSTULACION)) {
        const total = valor?.[estado];
        const numero = Number(total);
        conteos[estado] =
          total === null || total === undefined || !Number.isFinite(numero)
            ? null
            : numero;
      }

      const totalDirecto = Number(valor?.TOTAL);
      const suma = Object.values(conteos).reduce(
        (acumulado, numero) => acumulado + (numero || 0),
        0
      );
      const hayDatos = Object.values(ESTADOS_POSTULACION).some((estado) =>
        Number.isFinite(Number(valor?.[estado]))
      );
      conteos.TOTAL = hayDatos
        ? Number.isFinite(totalDirecto)
          ? totalDirecto
          : suma
        : null;

      return conteos;
    },
    async buscar(pagina = 0) {
      clearTimeout(this.debounceHandle);
      if (this.errorFechas) {
        this.abortarListado();
        this.cargando = false;
        return;
      }

      const corrida = ++this.idCarga;
      this.abortarListado();
      this.controladorListado = new AbortController();

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      const params = construirParamsPostulaciones({
        ...this.filtros,
        pagina,
      });

      try {
        const response = await postulacionService.buscar(
          this.idProyecto,
          params,
          this.controladorListado.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido) ? data.contenido : [];

        this.postulaciones = contenido;
        this.paginacion = {
          paginaActual: Number(data.paginaActual) || 0,
          tamanoPagina:
            Number(data.tamanoPagina) ||
            Number(this.filtros.tamano) ||
            TAMANO_POR_DEFECTO,
          totalElementos: Number(data.totalElementos) || 0,
          totalPaginas: Number(data.totalPaginas) || 1,
          primera: data.primera !== false,
          ultima: data.ultima !== false,
        };
        this.conteos = this.normalizarConteos(data.conteosPorEstado);

        // Si una gestión vació la última página, retroceder una.
        if (!contenido.length && this.paginacion.paginaActual > 0) {
          this.buscar(this.paginacion.paginaActual - 1);
        }
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorListado(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarErrorListado(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.mensajeError = "";
      this.puedeReintentar = false;

      if (error?._esSesionExpirada) {
        this.mensajeError = mensajeErrorApi(error);
        return;
      }

      if (status === 400) {
        this.mensajeError =
          mensaje || "Revisá el rango de fechas e intentá nuevamente.";
        return;
      }

      if (status === 401) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 403) {
        if (error?._esCsrf) {
          this.mensajeError = mensajeErrorApi(error);
          return;
        }
        this.mensajeError =
          "No tenés permiso para gestionar las postulaciones de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        if (/proyecto/i.test(mensaje)) {
          this.mensajeError =
            "El proyecto ya no existe o no está disponible.";
          return;
        }
        this.mensajeError = mensajeErrorApi(
          error,
          "No se encontraron las postulaciones."
        );
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al cargar las postulaciones. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudieron cargar las postulaciones."
      );
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
    },
    abrirModalAceptar(postulacion) {
      this.abrirModal(postulacion, ACCIONES_GESTION.ACEPTAR);
    },
    abrirModalRechazar(postulacion) {
      this.abrirModal(postulacion, ACCIONES_GESTION.RECHAZAR);
    },
    abrirModal(postulacion, accion) {
      if (!postulacion || this.enviando) return;
      if (accion === ACCIONES_GESTION.ACEPTAR && !postulacion.puedeAceptar) {
        return;
      }
      if (accion === ACCIONES_GESTION.RECHAZAR && !postulacion.puedeRechazar) {
        return;
      }

      this.modal = { visible: true, accion, postulacion };
      this.errorGestion = "";
      this.resultadoGestion = null;
      this.actividadDetalle = null;
      this.errorActividad = "";
      this.cargandoActividad = false;
      this.tokenDisponibilidad = 0;

      if (postulacion.tipo === TIPOS_POSTULACION.ACTIVIDAD) {
        this.cargarActividad(postulacion);
      }
    },
    async cargarActividad(postulacion) {
      const idActividad = postulacion?.idActividad;
      if (idActividad == null) return;

      const corrida = ++this.idActividadCarga;
      this.abortarActividad();
      this.controladorActividad = new AbortController();

      this.cargandoActividad = true;
      this.errorActividad = "";

      try {
        const response = await actividadService.obtener(
          this.idProyecto,
          idActividad,
          this.controladorActividad.signal
        );
        if (corrida !== this.idActividadCarga) return;
        this.actividadDetalle = response?.data || null;
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idActividadCarga) {
          return;
        }
        this.actividadDetalle = null;
        this.errorActividad =
          "No se pudo cargar el horario de la actividad.";
      } finally {
        if (corrida === this.idActividadCarga) this.cargandoActividad = false;
      }
    },
    onModalVisibility(valor) {
      if (!valor) this.cerrarModal();
    },
    cerrarModal() {
      if (this.enviando) return;
      this.modal.visible = false;
      this.abortarActividad();
      this.cargandoActividad = false;
      this.errorActividad = "";
      this.actividadDetalle = null;
      this.errorGestion = "";
    },
    async confirmarGestion() {
      if (this.enviando) return;

      const { accion, postulacion } = this.modal;
      if (!postulacion) return;

      this.enviando = true;
      this.errorGestion = "";

      if (this.controladorGestion) this.controladorGestion.abort();
      this.controladorGestion = new AbortController();
      const signal = this.controladorGestion.signal;
      const esAceptar = accion === ACCIONES_GESTION.ACEPTAR;
      const esActividad = postulacion.tipo === TIPOS_POSTULACION.ACTIVIDAD;

      try {
        let respuesta = null;

        if (esActividad) {
          if (esAceptar) {
            respuesta = await postulacionService.aceptarActividad(
              this.idProyecto,
              postulacion.idPostulacion,
              signal
            );
          } else {
            await postulacionService.rechazarActividad(
              this.idProyecto,
              postulacion.idPostulacion,
              signal
            );
          }
        } else if (esAceptar) {
          respuesta = await postulacionService.aceptarGeneral(
            this.idProyecto,
            postulacion.idPostulacion,
            signal
          );
        } else {
          await postulacionService.rechazarGeneral(
            this.idProyecto,
            postulacion.idPostulacion,
            signal
          );
        }

        this.modal.visible = false;
        this.abortarActividad();
        this.errorGestion = "";
        this.procesarResultadoGestion(
          respuesta?.data || null,
          postulacion,
          esAceptar
        );
        this.toast.init({
          title: esAceptar ? "Postulación aceptada" : "Postulación rechazada",
          message: this.mensajeExito(accion, postulacion),
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        await this.buscar(this.paginacion.paginaActual);
        this.$emit("gestionada", { accion, postulacion });
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorGestion(error);
      } finally {
        this.enviando = false;
      }
    },
    mensajeExito(accion, postulacion) {
      if (accion === ACCIONES_GESTION.RECHAZAR) {
        return "La postulación quedó rechazada.";
      }
      if (postulacion.tipo === TIPOS_POSTULACION.ACTIVIDAD) {
        return "La postulación fue aceptada y se creó la asignación a la actividad.";
      }
      return "La postulación fue aceptada y el postulante ya es miembro del proyecto.";
    },
    procesarResultadoGestion(data, postulacion, esAceptar) {
      if (
        !esAceptar ||
        postulacion?.tipo !== TIPOS_POSTULACION.ACTIVIDAD ||
        !data
      ) {
        this.resultadoGestion = null;
        return;
      }

      const ajuste =
        data.resultadoPreferencia === RESULTADOS_PREFERENCIA.DESVIO
          ? mensajeAjustePreferencia(
              data.resultadoPreferencia,
              data.desvioMinutos
            )
          : "";
      const advertencias = Array.isArray(data.advertencias)
        ? data.advertencias.filter(
            (advertencia) => advertencia && typeof advertencia === "object"
          )
        : [];

      if (!ajuste && !advertencias.length) {
        this.resultadoGestion = null;
        return;
      }

      this.resultadoGestion = { ajuste, advertencias };
    },
    ventanaAdvertencia(advertencia) {
      const texto = formatearVentana(
        advertencia?.inicioPotencial,
        advertencia?.finPotencial
      );
      return texto === "—" ? "" : texto;
    },
    async manejarErrorGestion(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const esPerfilInactivo =
        /perfil/i.test(mensaje) && /inactiv/i.test(mensaje);

      if (status === 400) {
        this.errorGestion =
          mensaje ||
          "No se pudo gestionar la postulación. Revisá los datos e intentá nuevamente.";
        return;
      }

      if (status === 401) {
        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo gestionar",
          message: mensajeErrorApi(error, "Tu cuenta no se encuentra activa."),
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (status === 403) {
        if (error?._esCsrf) {
          this.errorGestion = mensajeErrorApi(error);
          return;
        }
        this.modal.visible = false;
        this.toast.init({
          title: "Sin permiso",
          message:
            "No tenés permiso para gestionar las postulaciones de este proyecto.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          this.modal.visible = false;
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        if (/proyecto/i.test(mensaje)) {
          this.modal.visible = false;
          this.mensajeError = "El proyecto ya no existe o no está disponible.";
          return;
        }
        this.modal.visible = false;
        this.toast.init({
          title: "No se pudo gestionar",
          message: mensaje || "La postulación ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (status === 409) {
        // Sin hueco común o fuera de tolerancia de preferencia: el modal queda
        // abierto para leer el mensaje y reconsultar la disponibilidad.
        const esDisponibilidad =
          /intersecci[oó]n de disponibilidad|hueco com[uú]n|tolerancia|horario de preferencia/i.test(
            mensaje
          );
        if (esDisponibilidad) {
          this.errorGestion =
            mensaje ||
            "El postulante no tiene disponibilidad suficiente para la actividad.";
          this.tokenDisponibilidad += 1;
          return;
        }

        this.modal.visible = false;
        this.toast.init({
          title: esPerfilInactivo ? "Perfil inactivo" : "No se pudo gestionar",
          message: mensaje || "La postulación ya no se puede gestionar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });

        if (esPerfilInactivo) {
          await refrescarSesion();
        }

        await this.buscar(this.paginacion.paginaActual);
        return;
      }

      if (!status || status >= 500) {
        this.errorGestion =
          "Ocurrió un error al gestionar la postulación. Inténtalo nuevamente.";
        return;
      }

      this.errorGestion = mensajeErrorApi(
        error,
        "No se pudo gestionar la postulación."
      );
    },
  },
};
</script>

<style scoped>
.gestion-postulaciones {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gestion-postulaciones__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.gestion-postulaciones__reintento {
  display: flex;
  justify-content: center;
}

.gestion-postulaciones__resultado {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.gestion-postulaciones__resultado-cabecera {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.gestion-postulaciones__resultado-cabecera .material-symbols-outlined {
  font-size: 1.1rem;
}

.gestion-postulaciones__resultado-titulo {
  flex: 1;
  font-size: 0.88rem;
}

.gestion-postulaciones__resultado-texto {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
}

.gestion-postulaciones__resultado-lista {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  line-height: 1.45;
}

.gestion-postulaciones__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.25rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.gestion-postulaciones__estado-icono {
  font-size: 1.6rem;
}

.gestion-postulaciones__vacio-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.gestion-postulaciones__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.gestion-postulaciones__pagina {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}
</style>
