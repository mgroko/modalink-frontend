<template>
  <section class="reemplazos-proyecto">
    <header class="reemplazos-proyecto__cabecera">
      <div>
        <h2 class="reemplazos-proyecto__titulo">Reemplazos</h2>
        <p class="reemplazos-proyecto__subtitulo">
          Procesos generados por bajas o eliminaciones de integrantes. El
          sistema propone candidatos, envía invitaciones y vos elegís a quién
          incorporar entre los que acepten.
        </p>
      </div>
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-refresh"
        :loading="cargando"
        @click="cargar"
      >
        Actualizar
      </VaButton>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="reemplazos-proyecto__reintento">
      <VaButton preset="primary" size="small" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <p
      v-if="cargando && !reemplazos.length"
      class="reemplazos-proyecto__estado"
    >
      Cargando procesos de reemplazo...
    </p>

    <p
      v-else-if="!error && !reemplazos.length"
      class="reemplazos-proyecto__vacio"
    >
      Este proyecto no tiene procesos de reemplazo.
    </p>

    <div v-else-if="reemplazos.length" class="reemplazos-proyecto__layout">
      <aside class="reemplazos-proyecto__lista">
        <div class="reemplazos-proyecto__filtros">
          <input
            v-model="busqueda"
            type="search"
            class="reemplazos-proyecto__busqueda"
            placeholder="Buscar por actividad, profesión o perfil..."
            aria-label="Buscar procesos de reemplazo"
          />
          <select
            v-model="filtroEstado"
            class="reemplazos-proyecto__select"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option
              v-for="opcion in opcionesEstado"
              :key="opcion.value"
              :value="opcion.value"
            >
              {{ opcion.text }}
            </option>
          </select>
        </div>

        <p class="reemplazos-proyecto__contador">
          {{ textoContador }}
        </p>

        <div
          v-if="!listaFiltrada.length"
          class="reemplazos-proyecto__vacio reemplazos-proyecto__vacio--filtro"
        >
          No hay procesos que coincidan con el filtro.
        </div>

        <div v-else class="reemplazos-proyecto__items">
          <ReemplazoResumenCard
            v-for="reemplazo in listaFiltrada"
            :key="reemplazo.idReemplazo"
            :reemplazo="reemplazo"
            :activo="esSeleccionado(reemplazo)"
            @abrir="seleccionar"
          />
        </div>
      </aside>

      <div class="reemplazos-proyecto__detalle">
        <ReemplazoDetallePanel
          :detalle="detalle"
          :cargando="cargandoDetalle"
          :error="errorDetalle"
          :puede-reintentar="puedeReintentarDetalle"
          :procesando="accionEnCurso"
          @confirmar="abrirConfirmar"
          @regenerar="abrirRegenerar"
          @cancelar="abrirCancelar"
          @aprobar="abrirDecisionAprobar"
          @rechazar="abrirDecisionRechazar"
          @reintentar="reintentarDetalle"
        />
      </div>
    </div>

    <ModalConfirmarReemplazo
      v-model="modalConfirmarVisible"
      :candidatos="candidatosDetalle"
      :confirmando="confirmando"
      :error="errorConfirmar"
      @confirmar="confirmarCandidatos"
    />

    <ModalRegenerarReemplazo
      v-model="modalRegenerarVisible"
      :descripcion="descripcionSeleccionada"
      :regenerando="regenerando"
      :error="errorRegenerar"
      @confirmar="confirmarRegenerar"
    />

    <ModalCancelarReemplazo
      v-model="modalCancelarVisible"
      :nombre-proyecto="nombreProyectoSeleccionado"
      :descripcion="descripcionSeleccionada"
      :cancelando="cancelando"
      :error="errorCancelar"
      @confirmar="confirmarCancelar"
    />

    <ModalDecisionCandidato
      v-model="modalDecisionVisible"
      :accion="accionDecision"
      :candidato="candidatoDecision"
      :nombre-proyecto="nombreProyectoSeleccionado"
      :descripcion="descripcionSeleccionada"
      :procesando="procesandoDecision"
      :error="errorDecision"
      :terminos-vigentes="terminosVigentesDecision"
      :token-refresco-terminos="tokenRefrescoTerminosDecision"
      @confirmar="confirmarDecision"
    />
  </section>
</template>

<script>
import { useToast } from "vuestic-ui";
import BaseAlert from "../AlertaBase.vue";
import ReemplazoResumenCard from "./ReemplazoResumenCard.vue";
import ReemplazoDetallePanel from "./ReemplazoDetallePanel.vue";
import ModalConfirmarReemplazo from "./ModalConfirmarReemplazo.vue";
import ModalRegenerarReemplazo from "./ModalRegenerarReemplazo.vue";
import ModalCancelarReemplazo from "./ModalCancelarReemplazo.vue";
import ModalDecisionCandidato from "./ModalDecisionCandidato.vue";
import reemplazoService from "../../services/reemplazoService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  datosErrorTerminos,
  esErrorTerminos,
} from "../../utils/terminosCondiciones.js";
import {
  ACCIONES_DECISION_REEMPLAZO,
  ESTADOS_CANDIDATO_REEMPLAZO,
  calcularResumenReemplazos,
  clasificarErrorReemplazo,
  descripcionVacante,
  etiquetaEstadoReemplazo,
  TIPOS_ERROR_REEMPLAZO,
} from "../../utils/reemplazoConstants.js";

/*
 * Panel de procesos de reemplazo del Director.
 *
 * Toda la lógica de estados, acciones y errores se apoya en el backend: el
 * frontend sólo decide qué botones mostrar a partir de `estado` y refresca
 * después de cada operación.
 */
export default {
  name: "ReemplazosProyecto",
  components: {
    BaseAlert,
    ReemplazoResumenCard,
    ReemplazoDetallePanel,
    ModalConfirmarReemplazo,
    ModalRegenerarReemplazo,
    ModalCancelarReemplazo,
    ModalDecisionCandidato,
  },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
  },
  emits: ["resumen", "actualizado"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      ACCIONES_DECISION_REEMPLAZO,
      reemplazos: [],
      cargando: false,
      error: "",
      puedeReintentar: false,
      filtroEstado: "",
      busqueda: "",
      seleccionadoId: null,
      detalle: null,
      cargandoDetalle: false,
      errorDetalle: "",
      puedeReintentarDetalle: false,
      modalConfirmarVisible: false,
      confirmando: false,
      errorConfirmar: "",
      modalRegenerarVisible: false,
      regenerando: false,
      errorRegenerar: "",
      modalCancelarVisible: false,
      cancelando: false,
      errorCancelar: "",
      modalDecisionVisible: false,
      accionDecision: ACCIONES_DECISION_REEMPLAZO.APROBAR,
      candidatoDecision: null,
      procesandoDecision: false,
      errorDecision: "",
      terminosVigentesDecision: null,
      tokenRefrescoTerminosDecision: 0,
      idCarga: 0,
      idCargaDetalle: 0,
    };
  },
  computed: {
    listaFiltrada() {
      const texto = String(this.busqueda || "").trim().toLowerCase();
      return this.reemplazos.filter((reemplazo) => {
        if (this.filtroEstado && reemplazo.estado !== this.filtroEstado) {
          return false;
        }
        if (!texto) return true;
        return [
          reemplazo.nombreActividad,
          reemplazo.profesion,
          reemplazo.nombreProyecto,
          reemplazo.perfilBaja,
        ]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(texto));
      });
    },
    opcionesEstado() {
      const estados = [...new Set(this.reemplazos.map((r) => r.estado))];
      return estados.map((estado) => ({
        value: estado,
        text: etiquetaEstadoReemplazo(estado),
      }));
    },
    textoContador() {
      const total = this.listaFiltrada.length;
      const palabra = total === 1 ? "proceso" : "procesos";
      return `${total} ${palabra}`;
    },
    seleccionado() {
      return (
        this.reemplazos.find(
          (reemplazo) =>
            String(reemplazo.idReemplazo) === String(this.seleccionadoId)
        ) || null
      );
    },
    candidatosDetalle() {
      return Array.isArray(this.detalle?.candidatos)
        ? this.detalle.candidatos
        : [];
    },
    descripcionSeleccionada() {
      return descripcionVacante(this.detalle?.reemplazo || this.seleccionado);
    },
    nombreProyectoSeleccionado() {
      return (
        this.detalle?.reemplazo?.nombreProyecto ||
        this.seleccionado?.nombreProyecto ||
        ""
      );
    },
    resumen() {
      return calcularResumenReemplazos(this.reemplazos);
    },
    accionEnCurso() {
      return (
        this.confirmando ||
        this.regenerando ||
        this.cancelando ||
        this.procesandoDecision
      );
    },
  },
  watch: {
    idProyecto() {
      this.reiniciarEstado();
      this.cargar();
    },
  },
  created() {
    this.controladorLista = null;
    this.controladorDetalle = null;
    this.controladorAccion = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    this.abortar(this.controladorLista);
    this.abortar(this.controladorDetalle);
    this.abortar(this.controladorAccion);
  },
  methods: {
    reiniciarEstado() {
      this.abortar(this.controladorLista);
      this.abortar(this.controladorDetalle);
      this.abortar(this.controladorAccion);
      this.cerrarModales(true);
      this.reemplazos = [];
      this.seleccionadoId = null;
      this.detalle = null;
      this.error = "";
      this.errorDetalle = "";
      this.filtroEstado = "";
      this.busqueda = "";
      this.$emit("resumen", { pendientes: 0, sinCandidatos: 0 });
    },
    esSeleccionado(reemplazo) {
      return (
        String(reemplazo?.idReemplazo) === String(this.seleccionadoId)
      );
    },
    emitirResumen(resumen = this.resumen) {
      this.$emit("resumen", {
        pendientes: resumen.totalAccionesPendientes,
        sinCandidatos: resumen.sinCandidatos,
      });
    },
    async cargar() {
      if (this.idProyecto == null || this.idProyecto === "") return;

      const corrida = ++this.idCarga;
      this.abortar(this.controladorLista);
      this.controladorLista = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await reemplazoService.listar(
          this.idProyecto,
          this.controladorLista.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data;
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : [];

        this.reemplazos = lista;
        this.emitirResumen();

        const actualSigueExistiendo = lista.some(
          (reemplazo) =>
            String(reemplazo.idReemplazo) === String(this.seleccionadoId)
        );

        if (!actualSigueExistiendo) {
          this.seleccionadoId = lista[0]?.idReemplazo ?? null;
          this.detalle = null;
        }

        if (this.seleccionadoId != null) {
          await this.cargarDetalle(this.seleccionadoId);
        }
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async cargarDetalle(idReemplazo) {
      if (idReemplazo == null) {
        this.detalle = null;
        return;
      }

      const corrida = ++this.idCargaDetalle;
      this.abortar(this.controladorDetalle);
      this.controladorDetalle = new AbortController();

      this.cargandoDetalle = true;
      this.errorDetalle = "";
      this.puedeReintentarDetalle = false;

      try {
        const response = await reemplazoService.obtener(
          this.idProyecto,
          idReemplazo,
          this.controladorDetalle.signal
        );
        if (corrida !== this.idCargaDetalle) return;
        this.detalle = response?.data || null;
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCargaDetalle) {
          return;
        }
        await this.manejarErrorDetalle(error);
      } finally {
        if (corrida === this.idCargaDetalle) this.cargandoDetalle = false;
      }
    },
    seleccionar(reemplazo) {
      if (!reemplazo?.idReemplazo) return;
      if (this.esSeleccionado(reemplazo) && this.detalle) return;
      this.seleccionadoId = reemplazo.idReemplazo;
      this.detalle = null;
      this.cargarDetalle(reemplazo.idReemplazo);
    },
    reintentarDetalle() {
      if (this.seleccionadoId != null) this.cargarDetalle(this.seleccionadoId);
    },
    async manejarErrorCarga(error) {
      const clasificacion = clasificarErrorReemplazo(error);
      const mensaje = mensajeErrorApi(
        error,
        "No se pudieron cargar los procesos de reemplazo."
      );

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.SESION) return;

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_ACTIVO) {
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERMISO) {
        this.error =
          clasificacion.mensaje ||
          "No tenés permiso para gestionar los reemplazos de este proyecto.";
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PROYECTO_NO_ENCONTRADO) {
        this.error = clasificacion.mensaje || "El proyecto ya no está disponible.";
        return;
      }

      this.error = mensaje;
      this.puedeReintentar = true;
    },
    async manejarErrorDetalle(error) {
      const clasificacion = clasificarErrorReemplazo(error);
      const mensaje = mensajeErrorApi(
        error,
        "No se pudo cargar el detalle del reemplazo."
      );

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.SESION) return;

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_ACTIVO) {
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.NO_ENCONTRADO) {
        this.detalle = null;
        this.errorDetalle =
          clasificacion.mensaje || "El proceso de reemplazo ya no existe.";
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERMISO) {
        this.errorDetalle =
          clasificacion.mensaje ||
          "No tenés permiso para ver este proceso de reemplazo.";
        return;
      }

      this.errorDetalle = mensaje;
      this.puedeReintentarDetalle = true;
    },
    abrirConfirmar() {
      if (!this.detalle?.reemplazo || this.accionEnCurso) return;
      const hayPropuestos = this.candidatosDetalle.some(
        (candidato) =>
          candidato?.estado === ESTADOS_CANDIDATO_REEMPLAZO.PROPUESTO
      );
      if (!hayPropuestos) return;
      this.errorConfirmar = "";
      this.modalConfirmarVisible = true;
    },
    abrirRegenerar() {
      if (this.accionEnCurso) return;
      this.errorRegenerar = "";
      this.modalRegenerarVisible = true;
    },
    abrirCancelar() {
      if (this.accionEnCurso) return;
      this.errorCancelar = "";
      this.modalCancelarVisible = true;
    },
    abrirDecisionAprobar(candidato) {
      this.abrirDecision(ACCIONES_DECISION_REEMPLAZO.APROBAR, candidato);
    },
    abrirDecisionRechazar(candidato) {
      this.abrirDecision(ACCIONES_DECISION_REEMPLAZO.RECHAZAR, candidato);
    },
    abrirDecision(accion, candidato) {
      if (this.accionEnCurso || !candidato) return;
      this.accionDecision = accion;
      this.candidatoDecision = candidato;
      this.errorDecision = "";
      this.terminosVigentesDecision = null;
      this.tokenRefrescoTerminosDecision = 0;
      this.modalDecisionVisible = true;
    },
    async confirmarCandidatos({ idsCandidatos, mensaje } = {}) {
      if (this.confirmando || !this.detalle?.reemplazo) return;
      if (!Array.isArray(idsCandidatos) || !idsCandidatos.length) return;

      this.confirmando = true;
      this.errorConfirmar = "";
      this.abortar(this.controladorAccion);
      this.controladorAccion = new AbortController();

      try {
        await reemplazoService.confirmar(
          this.idProyecto,
          this.detalle.reemplazo.idReemplazo,
          { idsCandidatos, mensaje },
          this.controladorAccion.signal
        );
        this.modalConfirmarVisible = false;
        this.toast.init({
          title: "Invitaciones enviadas",
          message: "Los candidatos seleccionados recibieron la invitación.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.recargarYNotificar();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorAccion(error, "confirmar");
      } finally {
        this.confirmando = false;
      }
    },
    async confirmarRegenerar() {
      if (this.regenerando || !this.detalle?.reemplazo) return;

      this.regenerando = true;
      this.errorRegenerar = "";
      this.abortar(this.controladorAccion);
      this.controladorAccion = new AbortController();

      try {
        await reemplazoService.regenerar(
          this.idProyecto,
          this.detalle.reemplazo.idReemplazo,
          this.controladorAccion.signal
        );
        this.modalRegenerarVisible = false;
        this.toast.init({
          title: "Candidatos regenerados",
          message: "Se volvieron a calcular los candidatos para la vacante.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.recargarYNotificar();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorAccion(error, "regenerar");
      } finally {
        this.regenerando = false;
      }
    },
    async confirmarCancelar(motivo) {
      if (this.cancelando || !this.detalle?.reemplazo) return;

      this.cancelando = true;
      this.errorCancelar = "";
      this.abortar(this.controladorAccion);
      this.controladorAccion = new AbortController();

      try {
        await reemplazoService.cancelar(
          this.idProyecto,
          this.detalle.reemplazo.idReemplazo,
          motivo,
          this.controladorAccion.signal
        );
        this.modalCancelarVisible = false;
        this.toast.init({
          title: "Proceso cancelado",
          message: "El proceso de reemplazo fue cancelado.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.recargarYNotificar();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorAccion(error, "cancelar");
      } finally {
        this.cancelando = false;
      }
    },
    async confirmarDecision({
      motivo = "",
      aceptacionTerminos = null,
    } = {}) {
      if (
        this.procesandoDecision ||
        !this.detalle?.reemplazo ||
        !this.candidatoDecision?.idCandidato
      ) {
        return;
      }

      const esAprobar =
        this.accionDecision === ACCIONES_DECISION_REEMPLAZO.APROBAR;

      this.procesandoDecision = true;
      this.errorDecision = "";
      this.abortar(this.controladorAccion);
      this.controladorAccion = new AbortController();

      try {
        if (esAprobar) {
          await reemplazoService.aprobarCandidato(
            this.idProyecto,
            this.detalle.reemplazo.idReemplazo,
            this.candidatoDecision.idCandidato,
            { aceptacionTerminos },
            this.controladorAccion.signal
          );
        } else {
          await reemplazoService.rechazarCandidato(
            this.idProyecto,
            this.detalle.reemplazo.idReemplazo,
            this.candidatoDecision.idCandidato,
            motivo,
            this.controladorAccion.signal
          );
        }

        this.modalDecisionVisible = false;
        this.candidatoDecision = null;
        this.toast.init({
          title: esAprobar ? "Incorporación aprobada" : "Incorporación rechazada",
          message: esAprobar
            ? "Se incorporó al candidato y se cancelaron las demás invitaciones activas."
            : "Se rechazó la incorporación del candidato.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.recargarYNotificar();
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorAccion(error, "decision");
      } finally {
        this.procesandoDecision = false;
      }
    },
    async recargarYNotificar() {
      await this.cargar();
      this.$emit("actualizado");
    },
    async manejarErrorAccion(error, contexto) {
      if (contexto === "decision" && esErrorTerminos(error)) {
        const datos = datosErrorTerminos(error);
        this.errorDecision =
          datos.mensaje ||
          "Los términos y condiciones del candidato cambiaron. Revisá la versión vigente y volvé a aceptar.";

        if (
          datos.idTycVigente != null ||
          datos.esPlantilla ||
          datos.descripcionVigente
        ) {
          this.terminosVigentesDecision = {
            idPerfil: datos.idPerfil,
            idTyc: datos.idTycVigente,
            descripcion: datos.descripcionVigente,
            esPlantilla: datos.esPlantilla,
            fechaInicio: null,
            fechaFin: null,
          };
        } else {
          this.terminosVigentesDecision = null;
          this.tokenRefrescoTerminosDecision += 1;
        }
        return;
      }

      const clasificacion = clasificarErrorReemplazo(error);
      const mensaje = clasificacion.mensaje;
      const campo = {
        confirmar: "errorConfirmar",
        regenerar: "errorRegenerar",
        cancelar: "errorCancelar",
        decision: "errorDecision",
      }[contexto];

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.SESION) {
        this.cerrarModales(true);
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_ACTIVO) {
        this.cerrarModales(true);
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.PERFIL_NO_ENCONTRADO) {
        this.cerrarModales(true);
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.VALIDACION) {
        if (campo) {
          this[campo] =
            mensaje ||
            "Revisá los datos ingresados e intentá nuevamente.";
        }
        return;
      }

      if (
        clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.SERVIDOR ||
        clasificacion.tipo === TIPOS_ERROR_REEMPLAZO.GENERICO
      ) {
        if (campo) {
          this[campo] = mensajeErrorApi(
            error,
            "Ocurrió un error al completar la operación. Inténtalo nuevamente."
          );
        }
        return;
      }

      // 403, 404 o 409: el estado cambió. Se cierra el modal, se avisa y se
      // recargan listado y detalle; el backend es la fuente de verdad.
      this.cerrarModales(true);
      this.toast.init({
        title: "No se pudo completar la operación",
        message:
          mensaje ||
          "El proceso de reemplazo cambió de estado. Actualizamos los datos.",
        color: "danger",
        position: "top-right",
        duration: 6000,
      });
      await this.recargarYNotificar();
    },
    cerrarModales(forzar = false) {
      if (!forzar) {
        if (
          this.confirmando ||
          this.regenerando ||
          this.cancelando ||
          this.procesandoDecision
        ) {
          return;
        }
      }
      this.modalConfirmarVisible = false;
      this.modalRegenerarVisible = false;
      this.modalCancelarVisible = false;
      this.modalDecisionVisible = false;
      this.errorConfirmar = "";
      this.errorRegenerar = "";
      this.errorCancelar = "";
      this.errorDecision = "";
      this.candidatoDecision = null;
      this.terminosVigentesDecision = null;
    },
    abortar(controlador) {
      if (controlador) controlador.abort();
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
.reemplazos-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.15rem 1.5rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.reemplazos-proyecto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.reemplazos-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.reemplazos-proyecto__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.reemplazos-proyecto__reintento {
  display: flex;
  justify-content: flex-start;
}

.reemplazos-proyecto__estado,
.reemplazos-proyecto__vacio {
  margin: 0;
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.reemplazos-proyecto__vacio--filtro {
  padding: 1.1rem 0.8rem;
}

.reemplazos-proyecto__layout {
  display: grid;
  grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.6fr);
  gap: 1rem;
  align-items: start;
}

.reemplazos-proyecto__lista,
.reemplazos-proyecto__detalle {
  min-width: 0;
}

.reemplazos-proyecto__lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reemplazos-proyecto__filtros {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.reemplazos-proyecto__busqueda,
.reemplazos-proyecto__select {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.8rem;
}

.reemplazos-proyecto__busqueda:focus,
.reemplazos-proyecto__select:focus {
  border-color: var(--color-primary);
  outline: none;
}

.reemplazos-proyecto__contador {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.reemplazos-proyecto__items {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-height: 38rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}

@media (max-width: 900px) {
  .reemplazos-proyecto__layout {
    grid-template-columns: 1fr;
  }

  .reemplazos-proyecto__items {
    max-height: none;
  }
}
</style>
