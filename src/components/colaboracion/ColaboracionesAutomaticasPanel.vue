<template>
  <div class="colaboraciones-automaticas">
    <div class="colaboraciones-automaticas__barra">
      <p class="colaboraciones-automaticas__ayuda">
        Detectamos publicaciones que comparten una imagen. La colaboración se
        activa cuando ambos perfiles confirman.
      </p>

      <label class="colaboraciones-automaticas__historial">
        <VaSwitch
          :model-value="filtros.todosLosEstados"
          size="small"
          @update:model-value="cambiarHistorial"
        />
        <span>Ver historial completo</span>
      </label>
    </div>

    <FiltrosColaboracionesAutomaticas
      :filtros="filtros"
      :cargando="cargando"
      :error-fechas="errorFechas"
      :historial="filtros.todosLosEstados"
      @cambio="cambiarFiltro"
      @limpiar="limpiarFiltros"
    />

    <BaseAlert :message="error" type="error" />

    <div
      v-if="cargando"
      class="colaboraciones-automaticas__estado"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando colaboraciones automáticas...
    </div>

    <div
      v-else-if="!colaboraciones.length"
      class="colaboraciones-automaticas__vacio"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        auto_awesome
      </span>
      <p>{{ textoVacio }}</p>
    </div>

    <template v-else>
      <p class="colaboraciones-automaticas__resumen">
        {{ textoResumen }}
      </p>

      <div class="colaboraciones-automaticas__lista">
        <ColaboracionAutomaticaCard
          v-for="colaboracion in colaboraciones"
          :key="colaboracion.idColaboracionAutomatica"
          :colaboracion="colaboracion"
          :procesando="
            procesandoId === colaboracion.idColaboracionAutomatica
          "
          :accion="accionProcesando"
          @confirmar="abrirGestion($event, 'confirmar')"
          @rechazar="abrirGestion($event, 'rechazar')"
          @ver-detalle="verDetalle"
          @ver-publicacion="verPublicacion"
          @ver-perfil="verPerfil"
        />
      </div>

      <PaginacionResultados
        :paginacion="paginacion"
        @cambiar="cambiarPagina"
      />
    </template>

    <ModalGestionColaboracionAutomatica
      v-model="modalGestion.visible"
      :colaboracion="modalGestion.colaboracion"
      :accion="modalGestion.accion"
      :gestionando="procesandoId != null"
      :error="errorModal"
      @confirmar="confirmarGestion"
    />
  </div>
</template>

<script>
import { useToast } from "vuestic-ui";
import BaseAlert from "../AlertaBase.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import FiltrosColaboracionesAutomaticas from "./FiltrosColaboracionesAutomaticas.vue";
import ColaboracionAutomaticaCard from "./ColaboracionAutomaticaCard.vue";
import ModalGestionColaboracionAutomatica from "./ModalGestionColaboracionAutomatica.vue";
import colaboracionAutomaticaService from "../../services/colaboracionAutomaticaService";
import { cargarResumenColaboracionesAutomaticas } from "../../services/colaboracionAutomaticaState";
import { cargarResumenPerfil } from "../../services/notificacionState";
import { idPerfilActivo } from "../../services/authState";
import {
  ACCIONES_COLABORACION_AUTOMATICA,
  ESTADOS_COLABORACION_AUTOMATICA,
  TAMANO_PAGINA_COLABORACIONES_AUTOMATICAS,
  contenidoColaboracionesAutomaticas,
  mensajeErrorColaboracionAutomatica,
  normalizarColaboracionAutomatica,
  normalizarPaginaColaboracionesAutomaticas,
  paginacionColaboracionesAutomaticasInicial,
} from "../../utils/colaboracionesAutomaticasConstants.js";
import { validarRangoFechas } from "../../utils/parametrosPostulaciones.js";

function filtrosBase() {
  return {
    estado: ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE,
    todosLosEstados: false,
    fechaDesde: "",
    fechaHasta: "",
    idPerfilContraparte: null,
    idPublicacion: null,
  };
}

export default {
  name: "ColaboracionesAutomaticasPanel",
  components: {
    BaseAlert,
    ColaboracionAutomaticaCard,
    FiltrosColaboracionesAutomaticas,
    ModalGestionColaboracionAutomatica,
    PaginacionResultados,
  },
  emits: ["actualizada"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: filtrosBase(),
      colaboraciones: [],
      paginacion: paginacionColaboracionesAutomaticasInicial(),
      cargando: true,
      error: "",
      errorFechas: "",
      controlador: null,
      procesandoId: null,
      accionProcesando: "",
      errorModal: "",
      modalGestion: {
        visible: false,
        colaboracion: null,
        accion: ACCIONES_COLABORACION_AUTOMATICA.CONFIRMAR,
      },
    };
  },
  computed: {
    textoVacio() {
      if (this.errorFechas) {
        return "Revisá el rango de fechas para buscar colaboraciones.";
      }
      if (this.filtros.todosLosEstados) {
        return "Todavía no hay colaboraciones automáticas registradas.";
      }
      if (
        this.filtros.estado ===
        ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE
      ) {
        return "No tenés propuestas de colaboración automática pendientes.";
      }
      return "No hay propuestas con el estado seleccionado.";
    },
    textoResumen() {
      const total = this.paginacion.totalElementos;
      const palabra = total === 1 ? "propuesta" : "propuestas";
      return `${total} ${palabra} de colaboración automática`;
    },
  },
  mounted() {
    this.buscar(0);
  },
  beforeUnmount() {
    this.abortar();
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
        size: TAMANO_PAGINA_COLABORACIONES_AUTOMATICAS,
      };

      if (this.filtros.todosLosEstados) {
        params.todosLosEstados = true;
      } else {
        params.estado =
          this.filtros.estado ||
          ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE;
      }

      if (this.filtros.fechaDesde) {
        params.fechaDesde = this.filtros.fechaDesde;
      }
      if (this.filtros.fechaHasta) {
        params.fechaHasta = this.filtros.fechaHasta;
      }
      if (
        this.filtros.idPerfilContraparte != null &&
        this.filtros.idPerfilContraparte !== ""
      ) {
        params.idPerfilContraparte = this.filtros.idPerfilContraparte;
      }
      if (
        this.filtros.idPublicacion != null &&
        this.filtros.idPublicacion !== ""
      ) {
        params.idPublicacion = this.filtros.idPublicacion;
      }

      return params;
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
        const response = await colaboracionAutomaticaService.listar(
          this.construirParams(pagina),
          controller.signal
        );
        if (this.controlador !== controller) return;

        const data = response?.data;
        const lista = contenidoColaboracionesAutomaticas(data)
          .map(normalizarColaboracionAutomatica)
          .filter(Boolean);

        if (!lista.length && pagina > 0) {
          this.cargando = false;
          this.controlador = null;
          await this.buscar(pagina - 1);
          return;
        }

        this.colaboraciones = lista;
        this.paginacion =
          normalizarPaginaColaboracionesAutomaticas(data);
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        if (error?.response?.status === 400) {
          this.errorFechas = mensajeErrorColaboracionAutomatica(
            error,
            "Revisá los filtros ingresados."
          );
        } else {
          this.colaboraciones = [];
          this.paginacion = paginacionColaboracionesAutomaticasInicial();
          this.error = mensajeErrorColaboracionAutomatica(
            error,
            "No se pudieron cargar las colaboraciones automáticas."
          );
        }
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    cambiarHistorial(valor) {
      this.filtros = {
        ...this.filtros,
        todosLosEstados: !!valor,
        estado: valor
          ? ""
          : ESTADOS_COLABORACION_AUTOMATICA.PENDIENTE,
      };
      this.buscar(0);
    },
    cambiarFiltro({ campo, valor }) {
      const filtros = { ...this.filtros };

      if (
        campo === "idPerfilContraparte" ||
        campo === "idPublicacion"
      ) {
        filtros[campo] = valor == null || valor === "" ? null : valor;
      } else {
        filtros[campo] = valor;
      }

      this.filtros = filtros;
      this.errorFechas = "";
      this.buscar(0);
    },
    limpiarFiltros() {
      this.filtros = filtrosBase();
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
    },
    abrirGestion(colaboracion, accion) {
      if (this.procesandoId != null || !colaboracion) return;
      this.errorModal = "";
      this.modalGestion = {
        visible: true,
        colaboracion,
        accion,
      };
    },
    confirmarGestion() {
      if (!this.modalGestion?.colaboracion) return;
      return this.gestionar(this.modalGestion.colaboracion);
    },
    async gestionar(colaboracion) {
      if (this.procesandoId != null || !colaboracion) return;

      const accion = this.modalGestion.accion;
      const esConfirmar = accion === ACCIONES_COLABORACION_AUTOMATICA.CONFIRMAR;

      this.error = "";
      this.errorModal = "";
      this.procesandoId = colaboracion.idColaboracionAutomatica;
      this.accionProcesando = accion;

      try {
        const response = esConfirmar
          ? await colaboracionAutomaticaService.confirmar(
              colaboracion.idColaboracionAutomatica
            )
          : await colaboracionAutomaticaService.rechazar(
              colaboracion.idColaboracionAutomatica
            );

        const estadoRespuesta =
          normalizarColaboracionAutomatica(response?.data)?.estado || null;

        this.modalGestion.visible = false;
        this.toast.init({
          title: esConfirmar
            ? estadoRespuesta ===
              ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA
              ? "Colaboración confirmada"
              : "Confirmación registrada"
            : "Propuesta rechazada",
          message: esConfirmar
            ? estadoRespuesta ===
              ESTADOS_COLABORACION_AUTOMATICA.CONFIRMADA
              ? "Ambos perfiles ya aparecen como colaboradores en la publicación del otro."
              : "Tu confirmación fue registrada. La colaboración se activará cuando la contraparte también confirme."
            : "La propuesta quedó rechazada y no se agregaron colaboradores.",
          color: esConfirmar ? "success" : "warning",
          position: "top-right",
          duration: 5000,
        });

        await this.refrescar();
        this.$emit("actualizada");
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = mensajeErrorColaboracionAutomatica(
          error,
          "No se pudo gestionar la propuesta."
        );

        if (status === 403 || status === 404 || status === 409) {
          this.modalGestion.visible = false;
          await this.refrescar();
          this.error = mensaje;
          this.$emit("actualizada");
        } else {
          this.errorModal = mensaje;
        }
      } finally {
        this.procesandoId = null;
        this.accionProcesando = "";
      }
    },
    async refrescar() {
      await this.buscar(this.paginacion.paginaActual);
      await Promise.allSettled([
        cargarResumenColaboracionesAutomaticas(),
        cargarResumenPerfil(idPerfilActivo()),
      ]);
    },
    verDetalle(colaboracion) {
      const id = colaboracion?.idColaboracionAutomatica;
      if (id == null) return;
      this.$router.push({
        name: "colaboracion-automatica-detalle",
        params: { id },
      });
    },
    verPublicacion(publicacion) {
      if (publicacion?.idPublicacion == null) return;
      this.$router.push({
        name: "publicacion-detalle",
        params: { idPublicacion: publicacion.idPublicacion },
      });
    },
    verPerfil(perfil) {
      if (perfil?.idPerfil == null) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: perfil.idPerfil },
      });
    },
  },
};
</script>

<style scoped>
.colaboraciones-automaticas {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.colaboraciones-automaticas__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
}

.colaboraciones-automaticas__ayuda {
  max-width: 620px;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.colaboraciones-automaticas__historial {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
}

.colaboraciones-automaticas__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.colaboraciones-automaticas__lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.colaboraciones-automaticas__estado,
.colaboraciones-automaticas__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.colaboraciones-automaticas__vacio .material-symbols-outlined {
  font-size: 2rem;
}

@media (max-width: 620px) {
  .colaboraciones-automaticas__barra {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
