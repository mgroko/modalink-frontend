<template>
  <section class="listado-contratos">
    <header v-if="mostrarEncabezado" class="listado-contratos__cabecera">
      <div>
        <h1 class="listado-contratos__titulo">{{ titulo }}</h1>
        <p v-if="subtitulo" class="listado-contratos__subtitulo">
          {{ subtitulo }}
        </p>
      </div>

      <div class="listado-contratos__acciones-cabecera">
        <VaButton
          v-if="!miFirmaPendienteFijo"
          preset="secondary"
          size="small"
          icon="mso-draw"
          @click="irAPendientesMiFirma"
        >
          Pendientes de mi firma
        </VaButton>
        <VaButton
          v-if="miFirmaPendienteFijo || idProyecto != null"
          preset="secondary"
          size="small"
          icon="mso-open_in_new"
          @click="irABusquedaGlobal"
        >
          Ver todos mis contratos
        </VaButton>
        <VaButton
          v-if="puedeCrear"
          preset="primary"
          size="small"
          icon="mso-add"
          @click="$emit('nuevo-contrato')"
        >
          Nuevo contrato
        </VaButton>
      </div>
    </header>

    <FiltrosContratos
      :filtros="filtros"
      :proyectos="proyectos"
      :cargando-proyectos="cargandoProyectos"
      :mostrar-filtro-proyecto="mostrarFiltroProyecto"
      :mostrar-filtro-mi-firma="!miFirmaPendienteFijo"
      :error-fechas="errorFechas"
      @cambio="cambiarFiltro"
      @limpiar="limpiarFiltros"
      @buscar-ahora="buscarAhora"
    />

    <BaseAlert v-if="errorGeneral" :message="errorGeneral" type="error" />

    <div v-if="puedeReintentar && !cargando" class="listado-contratos__reintento">
      <VaButton preset="primary" size="small" icon="mso-refresh" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="listado-contratos__estado">
      <span class="material-symbols-outlined listado-contratos__estado-icono">
        hourglass_empty
      </span>
      {{ esBusquedaGlobal ? "Buscando contratos..." : "Cargando contratos..." }}
    </div>

    <template v-else-if="!errorGeneral">
      <p class="listado-contratos__resumen">
        {{ paginacion.totalElementos }} contrato(s) encontrado(s)
        <template v-if="paginacion.totalPaginas > 1">
          · Página {{ paginacion.paginaActual + 1 }} de
          {{ paginacion.totalPaginas }}
        </template>
      </p>

      <TablaContratos
        v-if="contratos.length"
        :contratos="contratos"
        @ver="irADetalle"
        @modificar="irAModificar"
        @eliminar="abrirEliminar"
      />

      <div v-else class="listado-contratos__vacio">
        <span class="material-symbols-outlined listado-contratos__vacio-icono">
          {{ miFirmaPendienteFijo ? "draw" : "description" }}
        </span>
        <p>{{ textoVacio }}</p>
        <VaButton
          v-if="hayFiltrosAplicados"
          preset="secondary"
          size="small"
          @click="limpiarFiltros"
        >
          Restablecer filtros
        </VaButton>
      </div>

      <PaginacionResultados
        :paginacion="paginacion"
        @cambiar="irAPagina"
      />
    </template>

    <ModalEliminarContrato
      v-model="modalEliminarVisible"
      :contrato="contratoAEliminar"
      :eliminando="eliminando"
      :error="errorEliminar"
      @confirmar="confirmarEliminar"
    />
  </section>
</template>

<script>
import { markRaw } from "vue";
import BaseAlert from "../AlertaBase.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import FiltrosContratos from "./FiltrosContratos.vue";
import TablaContratos from "./TablaContratos.vue";
import ModalEliminarContrato from "./ModalEliminarContrato.vue";
import contratoService from "../../services/contratoService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  CODIGOS_CONTRATO,
  ESTADOS_CONTRATO_POR_DEFECTO,
  clasificarErrorContrato,
  normalizarPaginaContratos,
  puedeModificarContrato,
} from "../../utils/contratoConstants.js";
import {
  construirParamsBusquedaContrato,
  estadosContratoPorDefecto,
  mismosEstados,
  normalizarListaEstados,
  normalizarPaginaContrato,
  normalizarTamanoContrato,
  validarRangosBusquedaContrato,
} from "../../utils/parametrosContratos.js";
import {
  conVolver,
  crearRutaVolver,
} from "../../utils/navegacionContratos.js";

const TEXTOS = {
  VACIO_BUSQUEDA:
    "No encontramos contratos que coincidan con los filtros seleccionados.",
  VACIO_PROYECTO:
    "Todavía no hay contratos visibles para tu perfil en este proyecto.",
  VACIO_PENDIENTES:
    "No tenés contratos pendientes de firma.",
  VACIO_PENDIENTES_FILTROS:
    "No encontramos contratos pendientes con los filtros seleccionados.",
};

/** Claves de la query que administra este listado. */
const CLAVES_QUERY_LISTADO = [
  "idProyecto",
  "estados",
  "parte",
  "fechaEmisionDesde",
  "fechaEmisionHasta",
  "fechaFirmaDesde",
  "fechaFirmaHasta",
  "nombreContrato",
  "miFirmaPendiente",
  "page",
  "size",
];

function filtrosIniciales(idProyecto, miFirmaPendienteFijo = false) {
  return {
    idProyecto: idProyecto ?? null,
    estados: estadosContratoPorDefecto(),
    parte: "",
    fechaEmisionDesde: "",
    fechaEmisionHasta: "",
    fechaFirmaDesde: "",
    fechaFirmaHasta: "",
    nombreContrato: "",
    miFirmaPendiente: miFirmaPendienteFijo === true,
    page: 0,
    size: 20,
  };
}

function primerValor(valor) {
  return Array.isArray(valor) ? valor[0] : valor;
}

/*
 * Listado de contratos de UC-68. Se usa en la búsqueda global, en la pestaña
 * Contratos del proyecto y en la bandeja "Pendientes de mi firma". El backend
 * es la fuente de verdad de la visibilidad y de los flags de acción.
 *
 * Firmar y rechazar viven sólo en el detalle (UC-55); este listado navega.
 */
export default {
  name: "ListadoContratos",
  components: {
    BaseAlert,
    PaginacionResultados,
    FiltrosContratos,
    TablaContratos,
    ModalEliminarContrato,
  },
  props: {
    idProyecto: {
      type: [Number, String],
      default: null,
    },
    mostrarFiltroProyecto: {
      type: Boolean,
      default: true,
    },
    /** Bandeja dedicada: fija `miFirmaPendiente=true` y oculta el checkbox. */
    miFirmaPendienteFijo: {
      type: Boolean,
      default: false,
    },
    mostrarEncabezado: {
      type: Boolean,
      default: true,
    },
    sincronizarQuery: {
      type: Boolean,
      default: false,
    },
    /**
     * Query que se conserva al sincronizar los filtros. Se usa cuando el
     * listado se embebe en otra pantalla: por ejemplo, la pestaña Contratos
     * del proyecto necesita mantener `tab=contratos` en la URL.
     */
    queryBase: {
      type: Object,
      default: null,
    },
    puedeCrear: {
      type: Boolean,
      default: false,
    },
    titulo: {
      type: String,
      default: "Contratos",
    },
    subtitulo: {
      type: String,
      default: "",
    },
  },
  emits: ["nuevo-contrato"],
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      textos: TEXTOS,
      filtros: filtrosIniciales(
        this.idProyecto,
        this.miFirmaPendienteFijo
      ),
      contratos: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        primera: true,
        ultima: true,
      },
      cargando: true,
      errorGeneral: "",
      errorFechas: "",
      puedeReintentar: false,
      proyectos: [],
      cargandoProyectos: false,
      idCarga: 0,
      controladorBusqueda: null,
      timerBusqueda: null,
      modalEliminarVisible: false,
      contratoAEliminar: null,
      eliminando: false,
      errorEliminar: "",
    };
  },
  computed: {
    esBusquedaGlobal() {
      return this.idProyecto == null;
    },
    textoVacio() {
      if (this.miFirmaPendienteFijo) {
        return this.hayFiltrosAplicados
          ? this.textos.VACIO_PENDIENTES_FILTROS
          : this.textos.VACIO_PENDIENTES;
      }
      return this.esBusquedaGlobal
        ? this.textos.VACIO_BUSQUEDA
        : this.textos.VACIO_PROYECTO;
    },
    hayFiltrosAplicados() {
      return (
        String(this.filtros.nombreContrato || "").trim() !== "" ||
        String(this.filtros.parte || "").trim() !== "" ||
        (this.mostrarFiltroProyecto && this.filtros.idProyecto != null) ||
        (!this.miFirmaPendienteFijo && this.filtros.miFirmaPendiente === true) ||
        this.filtros.fechaEmisionDesde ||
        this.filtros.fechaEmisionHasta ||
        this.filtros.fechaFirmaDesde ||
        this.filtros.fechaFirmaHasta ||
        !mismosEstados(this.filtros.estados, ESTADOS_CONTRATO_POR_DEFECTO)
      );
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (String(nuevo ?? "") === String(anterior ?? "")) return;
      this.filtros = {
        ...this.filtros,
        idProyecto: nuevo ?? null,
        page: 0,
      };
      this.buscarAhora();
    },
  },
  mounted() {
    if (this.sincronizarQuery) this.aplicarQuery();
    this.cargarProyectos();
    this.cargar();
  },
  beforeUnmount() {
    if (this.controladorBusqueda) this.controladorBusqueda.abort();
    if (this.timerBusqueda) window.clearTimeout(this.timerBusqueda);
  },
  methods: {
    puedeModificarContrato,
    aplicarQuery() {
      const query = this.$route?.query || {};
      const estados = normalizarListaEstados(query.estados);
      const idProyectoQuery = Number(primerValor(query.idProyecto));
      // En un listado embebido con `idProyecto` fijo (pestaña del proyecto),
      // el prop manda: la query no debe poder apuntar a otro proyecto.
      const idProyecto =
        this.idProyecto != null
          ? this.idProyecto
          : Number.isFinite(idProyectoQuery)
            ? idProyectoQuery
            : null;

      this.filtros = {
        ...this.filtros,
        idProyecto,
        estados: estados.length ? estados : estadosContratoPorDefecto(),
        parte: String(primerValor(query.parte) || ""),
        fechaEmisionDesde: String(primerValor(query.fechaEmisionDesde) || ""),
        fechaEmisionHasta: String(primerValor(query.fechaEmisionHasta) || ""),
        fechaFirmaDesde: String(primerValor(query.fechaFirmaDesde) || ""),
        fechaFirmaHasta: String(primerValor(query.fechaFirmaHasta) || ""),
        nombreContrato: String(primerValor(query.nombreContrato) || ""),
        miFirmaPendiente:
          this.miFirmaPendienteFijo ||
          primerValor(query.miFirmaPendiente) === "true" ||
          primerValor(query.miFirmaPendiente) === true,
        page: normalizarPaginaContrato(primerValor(query.page)),
        size: normalizarTamanoContrato(primerValor(query.size)),
      };
    },
    actualizarQuery() {
      if (!this.sincronizarQuery) return;

      let query = {};
      if (this.queryBase) {
        // Listado embebido: conservar la query de la pantalla anfitriona
        // (`tab`, `seccion`, etc.) y reconstruir sólo las claves del listado.
        query = { ...this.queryBase, ...this.$route.query };
        CLAVES_QUERY_LISTADO.forEach((clave) => delete query[clave]);
      }
      if (
        this.idProyecto == null &&
        this.filtros.idProyecto !== null &&
        this.filtros.idProyecto !== undefined &&
        this.filtros.idProyecto !== "" &&
        Number.isFinite(Number(this.filtros.idProyecto))
      ) {
        query.idProyecto = String(this.filtros.idProyecto);
      }
      if (
        this.filtros.estados.length &&
        !mismosEstados(this.filtros.estados, ESTADOS_CONTRATO_POR_DEFECTO)
      ) {
        query.estados = [...this.filtros.estados];
      }
      if (String(this.filtros.parte || "").trim()) {
        query.parte = String(this.filtros.parte).trim();
      }
      if (this.filtros.fechaEmisionDesde) {
        query.fechaEmisionDesde = this.filtros.fechaEmisionDesde;
      }
      if (this.filtros.fechaEmisionHasta) {
        query.fechaEmisionHasta = this.filtros.fechaEmisionHasta;
      }
      if (this.filtros.fechaFirmaDesde) {
        query.fechaFirmaDesde = this.filtros.fechaFirmaDesde;
      }
      if (this.filtros.fechaFirmaHasta) {
        query.fechaFirmaHasta = this.filtros.fechaFirmaHasta;
      }
      if (String(this.filtros.nombreContrato || "").trim()) {
        query.nombreContrato = String(this.filtros.nombreContrato).trim();
      }
      if (this.miFirmaPendienteFijo || this.filtros.miFirmaPendiente === true) {
        query.miFirmaPendiente = "true";
      }
      if (this.filtros.page > 0) query.page = String(this.filtros.page);
      if (Number(this.filtros.size) !== 20) {
        query.size = String(this.filtros.size);
      }

      this.$router.replace({ query }).catch(() => {});
    },
    cambiarFiltro({ clave, valor }) {
      if (clave === "miFirmaPendiente" && this.miFirmaPendienteFijo) return;
      const siguiente = { ...this.filtros, [clave]: valor };
      if (clave !== "page") siguiente.page = 0;
      this.filtros = siguiente;
      this.actualizarQuery();

      if (clave === "size") {
        this.cargar();
      } else {
        this.programarBusqueda();
      }
    },
    programarBusqueda() {
      if (this.timerBusqueda) window.clearTimeout(this.timerBusqueda);
      this.timerBusqueda = window.setTimeout(() => {
        this.timerBusqueda = null;
        this.cargar();
      }, 300);
    },
    buscarAhora() {
      if (this.timerBusqueda) {
        window.clearTimeout(this.timerBusqueda);
        this.timerBusqueda = null;
      }
      this.filtros = { ...this.filtros, page: 0 };
      this.actualizarQuery();
      this.cargar();
    },
    limpiarFiltros() {
      this.filtros = filtrosIniciales(
        this.idProyecto,
        this.miFirmaPendienteFijo
      );
      this.errorFechas = "";
      this.actualizarQuery();
      this.cargar();
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.filtros = { ...this.filtros, page: destino };
      this.actualizarQuery();
      this.cargar();
    },
    async cargar() {
      const errorRango = validarRangosBusquedaContrato(this.filtros);
      this.errorFechas = errorRango;
      if (errorRango) {
        if (this.controladorBusqueda) this.controladorBusqueda.abort();
        this.idCarga += 1;
        this.cargando = false;
        this.errorGeneral = "";
        return;
      }

      const corrida = ++this.idCarga;
      if (this.controladorBusqueda) this.controladorBusqueda.abort();
      this.controladorBusqueda = markRaw(new AbortController());

      this.cargando = true;
      this.errorGeneral = "";
      this.puedeReintentar = false;

      try {
        const params = construirParamsBusquedaContrato(this.filtros);
        const response = await contratoService.buscar(
          params,
          this.controladorBusqueda.signal
        );
        if (corrida !== this.idCarga) return;

        const pagina = normalizarPaginaContratos(response?.data);
        this.contratos = pagina.contenido;
        this.paginacion = {
          paginaActual: pagina.paginaActual,
          tamanoPagina: pagina.tamanoPagina,
          totalElementos: pagina.totalElementos,
          totalPaginas: pagina.totalPaginas,
          primera: pagina.primera,
          ultima: pagina.ultima,
        };

        if (String(this.filtros.page) !== String(pagina.paginaActual)) {
          this.filtros = { ...this.filtros, page: pagina.paginaActual };
        }
        if (String(this.filtros.size) !== String(pagina.tamanoPagina)) {
          this.filtros = { ...this.filtros, size: pagina.tamanoPagina };
        }
        this.actualizarQuery();
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarErrorCarga(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (
        status === 400 &&
        clasificacion.codigo === CODIGOS_CONTRATO.RANGO_FECHAS_CONTRATO_INVALIDO
      ) {
        this.errorFechas =
          clasificacion.mensaje ||
          "La fecha desde no puede ser posterior a la fecha hasta.";
        return;
      }

      if (
        status === 404 &&
        clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_ACTIVO_NO_SELECCIONADO
      ) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (status === 403) {
        this.errorGeneral =
          clasificacion.mensaje ||
          "No tenés permiso para consultar estos contratos.";
        return;
      }

      if (status === 404) {
        this.errorGeneral =
          clasificacion.mensaje || "No se encontraron contratos.";
        return;
      }

      if (status === 409) {
        if (clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_EN_BAJA) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.errorGeneral =
          clasificacion.mensaje || "El perfil no se encuentra activo.";
        return;
      }

      this.errorGeneral = mensajeErrorApi(
        error,
        "Ocurrió un error al buscar contratos. Inténtalo nuevamente."
      );
      this.puedeReintentar = !status || status >= 500;
    },
    async cargarProyectos() {
      if (!this.mostrarFiltroProyecto) return;

      this.cargandoProyectos = true;
      try {
        const response = await contratoService.listarProyectos();
        const lista = Array.isArray(response?.data) ? response.data : [];
        const opciones = lista
          .filter((proyecto) => proyecto?.idProyecto != null)
          .map((proyecto) => ({
            idProyecto: Number(proyecto.idProyecto),
            nombre: proyecto.nombre || `Proyecto #${proyecto.idProyecto}`,
          }));

        if (
          this.filtros.idProyecto != null &&
          !opciones.some(
            (proyecto) =>
              String(proyecto.idProyecto) === String(this.filtros.idProyecto)
          )
        ) {
          opciones.unshift({
            idProyecto: Number(this.filtros.idProyecto),
            nombre: `Proyecto #${this.filtros.idProyecto}`,
          });
        }

        this.proyectos = opciones;
      } catch {
        this.proyectos =
          this.filtros.idProyecto != null
            ? [
                {
                  idProyecto: Number(this.filtros.idProyecto),
                  nombre: `Proyecto #${this.filtros.idProyecto}`,
                },
              ]
            : [];
      } finally {
        this.cargandoProyectos = false;
      }
    },
    idProyectoDe(contrato) {
      return contrato?.idProyecto ?? this.idProyecto;
    },
    irABusquedaGlobal() {
      // "Ver todos mis contratos" siempre abre la búsqueda global: no debe
      // conservar el proyecto actualmente seleccionado.
      this.$router.push({ name: "buscar-contratos" });
    },
    irAPendientesMiFirma() {
      const idProyecto = this.idProyecto ?? this.filtros.idProyecto;
      this.$router.push({
        name: "contratos-pendientes",
        query:
          idProyecto != null
            ? { idProyecto: String(idProyecto) }
            : {},
      });
    },
    irADetalle(contrato) {
      if (contrato?.idContrato == null) return;
      const query = this.sincronizarQuery
        ? { idProyecto: this.filtros.idProyecto ?? undefined }
        : {};
      this.$router.push(
        conVolver(
          {
            name: "detalle-contrato",
            params: {
              idProyecto: this.idProyectoDe(contrato),
              idContrato: contrato.idContrato,
            },
            query,
          },
          crearRutaVolver(this.$route)
        )
      );
    },
    irAModificar(contrato) {
      if (!puedeModificarContrato(contrato) || contrato?.idContrato == null) {
        return;
      }
      this.$router.push(
        conVolver(
          {
            name: "modificar-contrato",
            params: {
              idProyecto: this.idProyectoDe(contrato),
              idContrato: contrato.idContrato,
            },
          },
          crearRutaVolver(this.$route)
        )
      );
    },
    abrirEliminar(contrato) {
      if (!contrato?.puedeEliminar || this.eliminando) return;
      this.contratoAEliminar = contrato;
      this.errorEliminar = "";
      this.modalEliminarVisible = true;
    },
    async confirmarEliminar() {
      if (!this.contratoAEliminar || this.eliminando) return;
      const contrato = this.contratoAEliminar;
      this.eliminando = true;
      this.errorEliminar = "";

      try {
        await contratoService.eliminar(
          this.idProyectoDe(contrato),
          contrato.idContrato
        );
        this.modalEliminarVisible = false;
        this.toast.init({
          title: "Contrato eliminado",
          message: "El contrato quedó en estado Eliminado y sigue visible en la búsqueda.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        // El eliminado debe seguir apareciendo: se recarga con los mismos
        // filtros y el backend lo devuelve en estado ELIMINADO. La bandeja
        // "Pendientes de mi firma" no puede mostrarlo porque sus firmas
        // pendientes fueron canceladas.
        if (this.miFirmaPendienteFijo) {
          this.$router.push({ name: "buscar-contratos" });
          return;
        }
        await this.cargar();

        // Si el usuario tenía oculto ELIMINADO y la baja dejó vacía la página
        // actual, retrocede una página para no mostrar un listado en blanco.
        if (!this.contratos.length && this.filtros.page > 0) {
          this.filtros = {
            ...this.filtros,
            page: Math.max(0, this.filtros.page - 1),
          };
          await this.cargar();
        }
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorEliminar(error);
      } finally {
        this.eliminando = false;
      }
    },
    async manejarErrorEliminar(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);
      const mensaje =
        clasificacion.mensaje ||
        mensajeErrorApi(
          error,
          "No se pudo eliminar el contrato. Inténtalo nuevamente."
        );

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_EN_BAJA) {
        this.modalEliminarVisible = false;
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_YA_ELIMINADO) {
        this.modalEliminarVisible = false;
        this.toast.init({
          title: "Contrato eliminado",
          message: "El contrato ya estaba eliminado.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        await this.cargar();
        return;
      }

      if (
        status === 403 ||
        status === 404 ||
        clasificacion.codigo ===
          CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_ELIMINACION
      ) {
        this.modalEliminarVisible = false;
        this.toast.init({
          title: "No se pudo eliminar",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.cargar();
        return;
      }

      this.errorEliminar = mensaje;
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
.listado-contratos {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.listado-contratos__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.listado-contratos__acciones-cabecera {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.listado-contratos__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 700;
}

.listado-contratos__subtitulo {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.listado-contratos__reintento {
  display: flex;
  justify-content: flex-start;
}

.listado-contratos__resumen {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.listado-contratos__estado,
.listado-contratos__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 2rem 1.25rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.86rem;
}

.listado-contratos__estado {
  flex-direction: row;
}

.listado-contratos__estado-icono,
.listado-contratos__vacio-icono {
  font-size: 1.6rem;
  color: var(--color-text-subtle);
}

.listado-contratos__vacio p {
  margin: 0;
  max-width: 32rem;
  line-height: 1.5;
}
</style>
