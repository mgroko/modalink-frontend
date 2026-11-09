<template>
  <div class="buscar-perfil">
    <h1 class="buscar-perfil__titulo">Buscar</h1>
    <p class="buscar-perfil__subtitulo">{{ subtitulo }}</p>

    <div v-if="recientes.length" class="buscar-perfil__recientes">
      <span class="buscar-perfil__recientes-label">Recientes:</span>
      <button
        v-for="termino in recientes"
        :key="termino"
        type="button"
        class="buscar-perfil__reciente"
        @click="aplicarReciente(termino)"
      >
        {{ termino }}
      </button>
    </div>

    <div
      class="buscar-perfil__tabs"
      role="tablist"
      aria-label="Tipo de búsqueda"
    >
      <button
        v-for="item in tabs"
        :key="item.id"
        class="buscar-perfil__tab"
        :class="{ 'buscar-perfil__tab--active': tab === item.id }"
        role="tab"
        :aria-selected="tab === item.id"
        @click="cambiarTab(item.id)"
      >
        {{ item.label }}
        <span class="buscar-perfil__tab-count">{{ item.count }}</span>
      </button>
    </div>

    <section class="buscar-perfil__filtros">
      <VaInput
        v-model="filtros.q"
        class="buscar-perfil__campo buscar-perfil__campo--texto"
        placeholder="Nombre, profesión, proyecto, director o ubicación"
        clearable
        @keyup.enter="buscarDesdeCabecera"
        @input="programarBusqueda"
      >
        <template #prependInner>
          <span class="material-symbols-outlined buscar-perfil__icono-campo">
            search
          </span>
        </template>
      </VaInput>

      <VaButton preset="primary" @click="buscarDesdeCabecera">
        Buscar
      </VaButton>

      <VaSelect
        v-if="mostrarFiltroProfesion"
        v-model="filtros.idProfesion"
        class="buscar-perfil__campo"
        :options="profesiones"
        value-by="idProfesion"
        :text-by="(option) => option.nombre"
        placeholder="Profesión"
        clearable
        :loading="cargandoProfesiones"
        @update:modelValue="cambiarProfesion"
      />

      <VaSelect
        v-if="mostrarFiltroEstado"
        v-model="filtros.estadoProyecto"
        class="buscar-perfil__campo"
        :options="opcionesEstadoProyecto"
        value-by="value"
        text-by="text"
        placeholder="Estado del proyecto"
        clearable
        @update:modelValue="buscarAhora"
      />

      <FiltroUbicacion
        v-if="mostrarFiltroUbicacion"
        :model-value="filtros.ubicacion"
        class="buscar-perfil__campo"
        @update:model-value="cambiarUbicacion"
      />

      <VaSelect
        v-if="mostrarTamano"
        v-model="filtros.tamano"
        class="buscar-perfil__campo buscar-perfil__campo--tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        placeholder="Resultados"
        @update:modelValue="buscarAhora"
      />

      <VaButton
        v-if="mostrarAvanzadoBoton"
        preset="secondary"
        size="small"
        :icon="mostrarAvanzado ? 'mso-expand_less' : 'mso-expand_more'"
        @click="mostrarAvanzado = !mostrarAvanzado"
      >
        Más filtros
      </VaButton>

      <VaButton preset="secondary" size="small" @click="limpiarFiltros">
        Limpiar filtros
      </VaButton>
    </section>

    <section
      v-if="mostrarFiltrosAvanzados"
      class="buscar-perfil__filtros"
    >
      <VaSelect
        v-model="filtros.idCaracteristica"
        class="buscar-perfil__campo"
        :options="caracteristicas"
        value-by="idCaracteristica"
        :text-by="(opcion) => opcion.nombre || opcion.codigo"
        placeholder="Característica"
        clearable
        :disabled="filtros.idProfesion == null"
        :loading="cargandoCaracteristicas"
        @update:modelValue="cambiarCaracteristica"
      />

      <template v-if="filtros.idCaracteristica != null">
        <VaSelect
          v-if="esCaracteristicaEnumerada"
          v-model="filtros.idValorCaracteristica"
          class="buscar-perfil__campo"
          :options="valoresDeCaracteristica"
          value-by="idValor"
          text-by="codigo"
          placeholder="Valor"
          clearable
          @update:modelValue="buscarAhora"
        />
        <VaInput
          v-else
          v-model="filtros.valorCaracteristica"
          class="buscar-perfil__campo"
          :type="tipoEntradaValor"
          placeholder="Valor"
          @keyup.enter="buscarDesdeCabecera"
          @input="programarBusqueda"
        />
      </template>
      <span v-else-if="filtros.idProfesion == null" class="buscar-perfil__ayuda">
        Seleccioná una profesión para filtrar por característica.
      </span>
    </section>

    <section
      v-if="mostrarFiltrosOportunidad"
      class="buscar-perfil__filtros buscar-perfil__filtros--toggles"
      aria-label="Filtros de oportunidades"
    >
      <label class="buscar-perfil__toggle">
        <VaCheckbox
          v-model="filtros.soloMiProfesion"
          @update:modelValue="cambiarSoloMiProfesion"
        />
        <span>Solo mi profesión</span>
      </label>

      <label class="buscar-perfil__toggle">
        <VaCheckbox
          v-model="filtros.soloPostulables"
          @update:modelValue="buscarAhora"
        />
        <span>Solo postulables</span>
      </label>

      <label class="buscar-perfil__toggle">
        <VaCheckbox
          v-model="filtros.excluirYaPostulados"
          @update:modelValue="buscarAhora"
        />
        <span>Ocultar ya postulados</span>
      </label>
    </section>

    <div v-if="!cargando" class="buscar-perfil__toolbar">
      <p class="buscar-perfil__resumen">{{ textoResumen }}</p>
      <VaSelect
        v-model="orden"
        class="buscar-perfil__campo--orden"
        :options="opcionesOrden"
        value-by="value"
        text-by="text"
        disabled
        title="El orden por relevancia estará disponible próximamente"
      />
    </div>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar && !cargando" class="buscar-perfil__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="buscar-perfil__estado">
      <span class="material-symbols-outlined buscar-perfil__estado-icono">
        hourglass_empty
      </span>
      Buscando...
    </div>

    <template v-else>
      <div v-if="resultadosVacios" class="buscar-perfil__estado">
        <span class="material-symbols-outlined buscar-perfil__estado-icono">
          search_off
        </span>
        <span>{{ textoVacio }}</span>
        <VaButton preset="secondary" size="small" @click="limpiarFiltros">
          Restablecer filtros
        </VaButton>
      </div>

      <template v-else-if="tab === 'todo'">
        <BuscadorSeccion
          v-if="todo.perfiles.length"
          titulo="Perfiles"
          :hay-items="true"
          :ver-todos="contadores.perfiles > todo.perfiles.length"
          :texto-ver-todos="`Ver los ${contadores.perfiles}`"
          @ver-todos="cambiarTab('perfiles')"
        >
          <PerfilBusquedaCard
            v-for="perfil in todo.perfiles"
            :key="perfil.idPerfil"
            :perfil="perfil"
            @abrir="irAPerfil"
          />
        </BuscadorSeccion>

        <BuscadorSeccion
          v-if="todo.proyectos.length"
          titulo="Proyectos"
          :hay-items="true"
          :ver-todos="contadores.proyectos > todo.proyectos.length"
          :texto-ver-todos="`Ver los ${contadores.proyectos}`"
          @ver-todos="cambiarTab('proyectos')"
        >
          <ProyectoBusquedaCard
            v-for="proyecto in todo.proyectos"
            :key="proyecto.idProyecto"
            :proyecto="proyecto"
            @abrir="irAProyecto"
          />
        </BuscadorSeccion>

        <BuscadorSeccion
          v-if="todo.oportunidades.length"
          titulo="Oportunidades abiertas"
          :hay-items="true"
          :ver-todos="contadores.oportunidades > todo.oportunidades.length"
          :texto-ver-todos="`Ver las ${contadores.oportunidades}`"
          @ver-todos="cambiarTab('oportunidades')"
        >
          <OportunidadBusquedaCard
            v-for="oportunidad in todo.oportunidades"
            :key="claveOportunidad(oportunidad)"
            :oportunidad="oportunidad"
            :habilidades-catalogo="habilidades"
            :caracteristicas-catalogo="caracteristicas"
            @postular="abrirPostulacion"
            @ver-detalle="verDetalleOportunidad"
          />
        </BuscadorSeccion>
      </template>

      <template v-else-if="tab === 'perfiles'">
        <div class="buscar-perfil__grid">
          <PerfilBusquedaCard
            v-for="perfil in perfiles"
            :key="perfil.idPerfil"
            :perfil="perfil"
            @abrir="irAPerfil"
          />
        </div>
        <PaginacionResultados
          :paginacion="paginacion"
          :es-todos="esTodos"
          @cambiar="cambiarPagina"
        />
      </template>

      <template v-else-if="tab === 'proyectos'">
        <div class="buscar-perfil__grid">
          <ProyectoBusquedaCard
            v-for="proyecto in proyectos"
            :key="proyecto.idProyecto"
            :proyecto="proyecto"
            @abrir="irAProyecto"
          />
        </div>
        <PaginacionResultados
          :paginacion="paginacion"
          :es-todos="esTodos"
          @cambiar="cambiarPagina"
        />
      </template>

      <template v-else-if="tab === 'oportunidades'">
        <div class="buscar-perfil__subtabs" role="tablist">
          <button
            class="buscar-perfil__subtab"
            :class="{ 'buscar-perfil__subtab--active': subtabOportunidades === 'generales' }"
            role="tab"
            :aria-selected="subtabOportunidades === 'generales'"
            @click="cambiarSubtabOportunidades('generales')"
          >
            Generales
            <span class="buscar-perfil__tab-count">
              {{ contadoresOportunidades.generales }}
            </span>
          </button>
          <button
            class="buscar-perfil__subtab"
            :class="{ 'buscar-perfil__subtab--active': subtabOportunidades === 'actividades' }"
            role="tab"
            :aria-selected="subtabOportunidades === 'actividades'"
            @click="cambiarSubtabOportunidades('actividades')"
          >
            Actividades
            <span class="buscar-perfil__tab-count">
              {{ contadoresOportunidades.actividades }}
            </span>
          </button>
        </div>

        <div class="buscar-perfil__grid">
          <OportunidadBusquedaCard
            v-for="oportunidad in oportunidades"
            :key="claveOportunidad(oportunidad)"
            :oportunidad="oportunidad"
            :habilidades-catalogo="habilidades"
            :caracteristicas-catalogo="caracteristicas"
            @postular="abrirPostulacion"
            @ver-detalle="verDetalleOportunidad"
          />
        </div>

        <PaginacionResultados
          :paginacion="paginacion"
          :es-todos="esTodos"
          @cambiar="cambiarPagina"
        />
      </template>
    </template>

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
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import proyectoService from "../../services/proyectoService";
import usuarioService from "../../services/usuarioService";
import requerimientoService from "../../services/requerimientoService";
import habilidadService from "../../services/habilidadService";
import BaseAlert from "../../components/AlertaBase.vue";
import BuscadorSeccion from "../../components/busqueda/BuscadorSeccion.vue";
import PerfilBusquedaCard from "../../components/busqueda/PerfilBusquedaCard.vue";
import ProyectoBusquedaCard from "../../components/busqueda/ProyectoBusquedaCard.vue";
import OportunidadBusquedaCard from "../../components/proyecto/OportunidadBusquedaCard.vue";
import FiltroUbicacion from "../../components/ubicacion/FiltroUbicacion.vue";
import ModalPostulacion from "../../components/proyecto/ModalPostulacion.vue";
import PaginacionResultados from "../../components/busqueda/PaginacionResultados.vue";
import { useToast } from "vuestic-ui";
import { idPerfilActivo, refrescarSesion } from "../../services/authState.js";
import { resolverUbicacionTexto } from "../../utils/ubicacion.js";
import { mensajeErrorApi } from "../../utils/apiError";
import { OPCIONES_ESTADO_FILTRO } from "../../utils/proyectoConstants.js";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import {
  AVISO_DISPONIBILIDAD_PROVISORIA,
  TIPOS_POSTULACION,
  esErrorCupoCompleto,
  esErrorDisponibilidad,
  esErrorPostulacionDuplicada,
  mensajeExitoPostulacion,
} from "../../utils/postulacionConstants.js";
import {
  claveOportunidad,
  normalizarTipoOportunidad,
  puedePostularOportunidad,
} from "../../utils/requerimientoAbiertoConstants.js";

const DEBOUNCE_MS = 350;
const LONGITUD_MIN_UBICACION = 3;
const LIMITE_CACHE_UBICACION = 100;
const CLAVE_RECIENTES = "modalink.busquedasRecientes";
const MAX_RECIENTES = 5;
const TABS = [
  { id: "todo", label: "Todo" },
  { id: "perfiles", label: "Perfiles" },
  { id: "proyectos", label: "Proyectos" },
  { id: "oportunidades", label: "Oportunidades" },
];

const PAGINACION_INICIAL = () => ({
  paginaActual: 0,
  tamanoPagina: 20,
  totalElementos: 0,
  totalPaginas: 0,
  primera: true,
  ultima: true,
});

const MODAL_INICIAL = () => ({
  visible: false,
  tipo: TIPOS_POSTULACION.GENERAL,
  idProyecto: null,
  nombreProyecto: "",
  requerimiento: null,
  actividad: null,
  fechaEntrega: null,
});

function normalizarTab(valor) {
  const tab = String(valor || "").toLowerCase();
  return TABS.some((item) => item.id === tab) ? tab : "todo";
}

function normalizarSubtab(valor) {
  return String(valor || "").toLowerCase() === "actividades"
    ? "actividades"
    : "generales";
}

function idDesdeQuery(valor) {
  const id = Number(valor);
  return Number.isFinite(id) && id > 0 ? id : null;
}

// Cancela la tanda de requests en vuelo cuando arranca una búsqueda nueva.
let controladorBusqueda = null;
let controladorContadores = null;

/*
 * Buscador unificado: Todo, Perfiles, Proyectos y Oportunidades.
 *
 * Respeta la estructura y el lenguaje visual existentes de la pantalla de
 * búsqueda. La composición de resultados se hace en el frontend porque no
 * existe un endpoint global; cada recurso conserva su contrato y su
 * paginación server-side.
 */
export default {
  name: "BuscarView",
  components: {
    BaseAlert,
    BuscadorSeccion,
    PerfilBusquedaCard,
    ProyectoBusquedaCard,
    OportunidadBusquedaCard,
    FiltroUbicacion,
    ModalPostulacion,
    PaginacionResultados,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      tab: "todo",
      subtabOportunidades: "generales",
      buscado: {},
      filtros: {
        q: "",
        nombre: "",
        apellido: "",
        idProfesion: null,
        idCaracteristica: null,
        valorCaracteristica: "",
        idValorCaracteristica: null,
        estadoProyecto: null,
        soloMiProfesion: false,
        soloPostulables: false,
        excluirYaPostulados: false,
        ubicacion: { provinciaId: null, localidadId: null },
        tamano: { text: "20 por página", value: 20 },
      },
      opcionesTamano: [
        { text: "20 por página", value: 20 },
        { text: "50 por página", value: 50 },
        { text: "Ver todos", value: 0 },
      ],
      opcionesEstadoProyecto: OPCIONES_ESTADO_FILTRO,
      opcionesOrden: [{ text: "Más relevantes", value: "relevancia" }],
      orden: "relevancia",
      profesiones: [],
      cargandoProfesiones: false,
      habilidades: [],
      cargandoHabilidades: false,
      caracteristicas: [],
      cargandoCaracteristicas: false,
      mostrarAvanzado: false,
      perfiles: [],
      proyectos: [],
      oportunidades: [],
      paginacionPerfiles: PAGINACION_INICIAL(),
      paginacionProyectos: PAGINACION_INICIAL(),
      paginacionOportunidades: PAGINACION_INICIAL(),
      todo: {
        perfiles: [],
        proyectos: [],
        oportunidades: [],
      },
      contadores: {
        todo: 0,
        perfiles: 0,
        proyectos: 0,
        oportunidades: 0,
      },
      contadoresOportunidades: {
        generales: 0,
        actividades: 0,
      },
      recientes: [],
      claveContadoresCargada: null,
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      debounceHandle: null,
      idBusqueda: 0,
      resolucionUbicacionCache: new Map(),
      modalPostulacion: MODAL_INICIAL(),
      enviandoPostulacion: false,
      errorPostulacion: "",
      errorPostulacionEsDisponibilidad: false,
    };
  },
  computed: {
    tabs() {
      return TABS.map((item) => ({
        ...item,
        count: Number(this.contadores[item.id]) || 0,
      }));
    },
    subtitulo() {
      if (this.tab === "perfiles") {
        return "Encontrá profesionales por nombre, profesión o ubicación.";
      }
      if (this.tab === "proyectos") {
        return "Encontrá proyectos por nombre, estado, director, profesión o ubicación.";
      }
      if (this.tab === "oportunidades") {
        return "Requerimientos abiertos para postularte, con filtros por profesión o ubicación.";
      }
      return "Perfiles, proyectos y oportunidades en un solo lugar.";
    },
    mostrarFiltroProfesion() {
      return true;
    },
    mostrarFiltroUbicacion() {
      return (
        this.tab === "todo" ||
        this.tab === "proyectos" ||
        this.tab === "oportunidades"
      );
    },
    mostrarFiltroEstado() {
      return this.tab === "proyectos" || this.tab === "todo";
    },
    mostrarTamano() {
      return this.tab !== "todo";
    },
    mostrarAvanzadoBoton() {
      return this.tab === "perfiles" || this.tab === "todo";
    },
    mostrarFiltrosAvanzados() {
      return this.mostrarAvanzadoBoton && this.mostrarAvanzado;
    },
    mostrarFiltrosOportunidad() {
      return this.tab === "oportunidades" || this.tab === "todo";
    },
    esTodos() {
      return this.filtros.tamano?.value === 0;
    },
    caracteristicaSeleccionada() {
      return (
        this.caracteristicas.find(
          (caracteristica) =>
            caracteristica.idCaracteristica === this.filtros.idCaracteristica
        ) || null
      );
    },
    esCaracteristicaEnumerada() {
      const caracteristica = this.caracteristicaSeleccionada;
      if (!caracteristica) return false;
      return (
        String(caracteristica.tipoDato || "").toUpperCase() === "ENUMERADO" &&
        Array.isArray(caracteristica.valores) &&
        caracteristica.valores.length > 0
      );
    },
    tipoEntradaValor() {
      const tipo = String(
        this.caracteristicaSeleccionada?.tipoDato || ""
      ).toUpperCase();
      return tipo === "NUMERICO" ? "number" : "text";
    },
    valoresDeCaracteristica() {
      return Array.isArray(this.caracteristicaSeleccionada?.valores)
        ? this.caracteristicaSeleccionada.valores
        : [];
    },
    paginacion() {
      if (this.tab === "perfiles") return this.paginacionPerfiles;
      if (this.tab === "proyectos") return this.paginacionProyectos;
      if (this.tab === "oportunidades") return this.paginacionOportunidades;
      return {
        ...PAGINACION_INICIAL(),
        totalElementos: this.contadores.todo,
        totalPaginas: this.contadores.todo > 0 ? 1 : 0,
      };
    },
    resultadosVacios() {
      if (this.tab === "todo") {
        return (
          this.todo.perfiles.length === 0 &&
          this.todo.proyectos.length === 0 &&
          this.todo.oportunidades.length === 0
        );
      }
      if (this.tab === "perfiles") return this.perfiles.length === 0;
      if (this.tab === "proyectos") return this.proyectos.length === 0;
      return this.oportunidades.length === 0;
    },
    textoResumen() {
      if (this.tab === "todo") {
        const total = Number(this.contadores.todo) || 0;
        return `${total} ${
          total === 1 ? "resultado" : "resultados"
        } para tu búsqueda`;
      }
      const total = Number(this.paginacion.totalElementos) || 0;
      const etiqueta =
        this.tab === "perfiles"
          ? "perfil(es)"
          : this.tab === "proyectos"
            ? "proyecto(s)"
            : "oportunidad(es)";
      const pagina = this.esTodos
        ? ""
        : ` · Página ${this.paginacion.paginaActual + 1} de ${
            this.paginacion.totalPaginas || 1
          }`;
      return `${total} ${etiqueta} encontrado(s)${pagina}`;
    },
    textoVacio() {
      if (this.tab === "perfiles") {
        return "No encontramos ningún perfil que coincida con tus criterios de búsqueda.";
      }
      if (this.tab === "proyectos") {
        return "No encontramos ningún proyecto que coincida con tus criterios de búsqueda.";
      }
      if (this.tab === "oportunidades") {
        return "No encontramos oportunidades que coincidan con tus criterios de búsqueda.";
      }
      return "No encontramos resultados que coincidan con tu búsqueda.";
    },
    modalPostulacionSinFechaEntrega() {
      return (
        this.modalPostulacion.tipo === TIPOS_POSTULACION.ACTIVIDAD &&
        !this.modalPostulacion.fechaEntrega
      );
    },
  },
  watch: {
    "$route.query"(nuevo, anterior) {
      if (JSON.stringify(nuevo) === JSON.stringify(anterior)) return;

      const tab = normalizarTab(nuevo?.tab);
      const subtab = normalizarSubtab(nuevo?.subtab);
      const q = typeof nuevo?.q === "string" ? nuevo.q : "";
      const qActual = this.limpiarTexto(this.filtros.q);
      const idProfesion = idDesdeQuery(nuevo?.idProfesion);
      const provinciaId =
        typeof nuevo?.provinciaId === "string" ? nuevo.provinciaId : null;
      const localidadId =
        typeof nuevo?.localidadId === "string" ? nuevo.localidadId : null;

      const provinciaActual = this.filtros.ubicacion?.provinciaId
        ? String(this.filtros.ubicacion.provinciaId)
        : null;
      const localidadActual = this.filtros.ubicacion?.localidadId
        ? String(this.filtros.ubicacion.localidadId)
        : null;

      const cambia =
        tab !== this.tab ||
        subtab !== this.subtabOportunidades ||
        q !== qActual ||
        idProfesion !== this.filtros.idProfesion ||
        provinciaId !== provinciaActual ||
        localidadId !== localidadActual;

      if (!cambia) return;

      this.tab = tab;
      this.subtabOportunidades = subtab;
      this.filtros.q = q;
      this.filtros.idProfesion = idProfesion;
      this.filtros.ubicacion = { provinciaId, localidadId };
      this.buscar(0);
    },
  },
  async mounted() {
    this.sincronizarDesdeRuta();
    this.cargarRecientes();
    await Promise.all([
      this.cargarProfesiones(),
      this.cargarHabilidades(),
      this.cargarPerfilActivo(),
    ]);
    await this.cargarCaracteristicas();
    await this.buscar();
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    if (controladorBusqueda) controladorBusqueda.abort();
    if (controladorContadores) controladorContadores.abort();
  },
  methods: {
    claveOportunidad,
    limpiarTexto(valor) {
      return String(valor ?? "").trim();
    },
    sincronizarDesdeRuta() {
      const tab = normalizarTab(this.$route.query.tab);
      this.tab = tab;
      this.subtabOportunidades = normalizarSubtab(this.$route.query.subtab);
      this.filtros.q =
        typeof this.$route.query.q === "string" ? this.$route.query.q : "";
      this.filtros.idProfesion = idDesdeQuery(this.$route.query.idProfesion);
      this.filtros.ubicacion = {
        provinciaId:
          typeof this.$route.query.provinciaId === "string"
            ? this.$route.query.provinciaId
            : null,
        localidadId:
          typeof this.$route.query.localidadId === "string"
            ? this.$route.query.localidadId
            : null,
      };
    },
    sincronizarRuta() {
      const query = { ...this.$route.query };
      const texto = this.limpiarTexto(this.filtros.q);
      if (texto) query.q = texto;
      else delete query.q;

      if (this.tab === "todo") delete query.tab;
      else query.tab = this.tab;

      if (this.tab === "oportunidades") {
        query.subtab = this.subtabOportunidades;
      } else {
        delete query.subtab;
      }

      if (this.filtros.idProfesion != null) {
        query.idProfesion = String(this.filtros.idProfesion);
      } else {
        delete query.idProfesion;
      }

      if (this.filtros.ubicacion.provinciaId) {
        query.provinciaId = this.filtros.ubicacion.provinciaId;
      } else {
        delete query.provinciaId;
      }

      if (this.filtros.ubicacion.localidadId) {
        query.localidadId = this.filtros.ubicacion.localidadId;
      } else {
        delete query.localidadId;
      }

      this.$router.replace({ name: "buscar", query }).catch(() => {});
    },
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos)
          ? datos
          : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      } finally {
        this.cargandoProfesiones = false;
      }
    },
    async cargarHabilidades() {
      this.cargandoHabilidades = true;
      try {
        const response = await habilidadService.listar();
        const datos = response?.data;
        this.habilidades = Array.isArray(datos)
          ? datos
          : datos?.habilidades || [];
      } catch {
        this.habilidades = [];
      } finally {
        this.cargandoHabilidades = false;
      }
    },
    async cargarPerfilActivo() {
      if (this.filtros.idProfesion != null) return;
      const id = idPerfilActivo();
      if (id == null) return;
      try {
        const response = await perfilService.obtener(id);
        const idProfesion = Number(response?.data?.idProfesion);
        if (
          this.filtros.idProfesion == null &&
          Number.isFinite(idProfesion) &&
          idProfesion > 0
        ) {
          this.filtros.idProfesion = idProfesion;
          this.sincronizarRuta();
        }
      } catch {
        // Sin perfil activo o sin acceso: la búsqueda sigue sin precarga.
      }
    },
    limpiarRamaCaracteristica() {
      this.filtros.idCaracteristica = null;
      this.filtros.valorCaracteristica = "";
      this.filtros.idValorCaracteristica = null;
    },
    async cargarCaracteristicas() {
      const idProfesion = this.filtros.idProfesion;
      this.caracteristicas = [];
      if (idProfesion == null) {
        this.cargandoCaracteristicas = false;
        return;
      }
      this.cargandoCaracteristicas = true;
      try {
        const response =
          await perfilService.caracteristicasPorProfesion(idProfesion);
        if (idProfesion !== this.filtros.idProfesion) return;
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : [];
      } catch {
        if (idProfesion === this.filtros.idProfesion) {
          this.caracteristicas = [];
        }
      } finally {
        if (idProfesion === this.filtros.idProfesion) {
          this.cargandoCaracteristicas = false;
        }
      }
    },
    cambiarUbicacion(ubicacion) {
      this.filtros.ubicacion = {
        provinciaId:
          ubicacion?.provinciaId != null
            ? String(ubicacion.provinciaId)
            : null,
        localidadId:
          ubicacion?.localidadId != null
            ? String(ubicacion.localidadId)
            : null,
      };
      this.sincronizarRuta();
      this.buscarAhora();
    },
    cambiarProfesion() {
      this.filtros.soloMiProfesion = false;
      this.limpiarRamaCaracteristica();
      this.sincronizarRuta();
      if (this.tab === "perfiles" || this.tab === "todo") {
        this.cargarCaracteristicas();
      } else {
        this.caracteristicas = [];
        this.cargandoCaracteristicas = false;
      }
      this.buscarAhora();
    },
    cambiarSoloMiProfesion() {
      if (this.filtros.soloMiProfesion) {
        this.filtros.idProfesion = null;
        this.limpiarRamaCaracteristica();
        this.caracteristicas = [];
        this.sincronizarRuta();
      }
      this.buscarAhora();
    },
    cambiarCaracteristica() {
      this.filtros.valorCaracteristica = "";
      this.filtros.idValorCaracteristica = null;
      this.buscarAhora();
    },
    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },
    buscarDesdeCabecera() {
      this.guardarReciente(this.filtros.q);
      this.sincronizarRuta();
      this.buscarAhora();
    },
    cargarRecientes() {
      try {
        const crudo = localStorage.getItem(CLAVE_RECIENTES);
        const lista = crudo ? JSON.parse(crudo) : [];
        this.recientes = Array.isArray(lista)
          ? lista.filter((item) => typeof item === "string").slice(0, MAX_RECIENTES)
          : [];
      } catch {
        this.recientes = [];
      }
    },
    guardarReciente(texto) {
      const termino = this.limpiarTexto(texto);
      if (!termino) return;
      this.recientes = [
        termino,
        ...this.recientes.filter((item) => item !== termino),
      ].slice(0, MAX_RECIENTES);
      try {
        localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(this.recientes));
      } catch {
        // almacenamiento no disponible: se mantiene solo en memoria
      }
    },
    aplicarReciente(texto) {
      this.filtros.q = texto;
      this.buscarDesdeCabecera();
    },
    cambiarTab(tab) {
      if (tab === this.tab) return;
      this.tab = tab;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.sincronizarRuta();
      this.buscar(0);
    },
    cambiarSubtabOportunidades(subtab) {
      if (subtab === this.subtabOportunidades) return;
      this.subtabOportunidades = subtab;
      this.sincronizarRuta();
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const paginacion = this.paginacion;
      const destino = paginacion.paginaActual + delta;
      if (destino < 0 || destino >= paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    limpiarFiltros() {
      this.filtros.q = "";
      this.filtros.nombre = "";
      this.filtros.apellido = "";
      this.filtros.idProfesion = null;
      this.filtros.idCaracteristica = null;
      this.filtros.valorCaracteristica = "";
      this.filtros.idValorCaracteristica = null;
      this.filtros.estadoProyecto = null;
      this.filtros.soloMiProfesion = false;
      this.filtros.soloPostulables = false;
      this.filtros.excluirYaPostulados = false;
      this.filtros.ubicacion = { provinciaId: null, localidadId: null };
      this.filtros.tamano = { text: "20 por página", value: 20 };
      this.caracteristicas = [];
      this.cargandoCaracteristicas = false;
      this.sincronizarRuta();
      this.buscarAhora();
    },
    tamanoActual() {
      return this.filtros.tamano?.value ?? 20;
    },
    paginacionInicial() {
      return PAGINACION_INICIAL();
    },
    normalizarPagina(data) {
      return {
        paginaActual: data?.paginaActual ?? 0,
        tamanoPagina: data?.tamanoPagina ?? 20,
        totalElementos: data?.totalElementos ?? 0,
        totalPaginas: data?.totalPaginas ?? 1,
        primera: data?.primera ?? true,
        ultima: data?.ultima ?? true,
      };
    },
    paginar(listado, page, size) {
      const totalElementos = listado.length;
      if (!size) {
        return {
          paginaActual: 0,
          tamanoPagina: totalElementos,
          totalElementos,
          totalPaginas: 1,
          primera: true,
          ultima: true,
          contenido: listado,
        };
      }
      const totalPaginas = Math.max(1, Math.ceil(totalElementos / size));
      const pagina = Math.min(Math.max(page, 0), totalPaginas - 1);
      return {
        paginaActual: pagina,
        tamanoPagina: size,
        totalElementos,
        totalPaginas,
        primera: pagina === 0,
        ultima: pagina >= totalPaginas - 1,
        contenido: listado.slice(pagina * size, (pagina + 1) * size),
      };
    },
    buildParamsBase() {
      const params = {};
      const nombre = this.limpiarTexto(this.filtros.nombre);
      const apellido = this.limpiarTexto(this.filtros.apellido);
      if (nombre) params.nombre = nombre;
      if (apellido) params.apellido = apellido;
      if (this.filtros.idProfesion != null) {
        params.idProfesion = this.filtros.idProfesion;
      }

      if (this.filtros.idCaracteristica != null) {
        params.idCaracteristica = this.filtros.idCaracteristica;
        const idValor = this.filtros.idValorCaracteristica;
        const valor = this.limpiarTexto(this.filtros.valorCaracteristica);
        if (idValor != null) {
          params.idValorCaracteristica = idValor;
        } else if (valor) {
          params.valorCaracteristica = valor;
        }
      }
      return params;
    },
    buildParamsProyectoBase() {
      const params = {};
      if (this.filtros.estadoProyecto) {
        params.estado = this.filtros.estadoProyecto;
      }
      if (this.filtros.idProfesion != null) {
        params.idProfesion = this.filtros.idProfesion;
      }
      if (this.filtros.ubicacion?.provinciaId) {
        params.provinciaId = this.filtros.ubicacion.provinciaId;
      }
      if (this.filtros.ubicacion?.localidadId) {
        params.localidadId = this.filtros.ubicacion.localidadId;
      }
      return params;
    },
    buildParamsOportunidad(page, size, todos = false) {
      const params = {};
      const texto = this.limpiarTexto(this.filtros.q);
      if (texto) params.texto = texto;
      if (this.filtros.idProfesion != null) {
        params.idProfesion = this.filtros.idProfesion;
      }
      if (this.filtros.soloMiProfesion) params.soloMiProfesion = true;
      if (this.filtros.soloPostulables) params.soloPostulables = true;
      if (this.filtros.excluirYaPostulados) params.excluirYaPostulados = true;
      if (this.filtros.ubicacion?.provinciaId) {
        params.provinciaId = this.filtros.ubicacion.provinciaId;
      }
      if (this.filtros.ubicacion?.localidadId) {
        params.localidadId = this.filtros.ubicacion.localidadId;
      }

      if (todos || !size) {
        params.todos = true;
      } else {
        params.page = page;
        params.size = size;
      }
      return params;
    },
    async resolverFiltroUbicacion(texto) {
      const consulta = this.limpiarTexto(texto).toLowerCase();
      if (consulta.length < LONGITUD_MIN_UBICACION) return null;
      if (this.resolucionUbicacionCache.has(consulta)) {
        return this.resolucionUbicacionCache.get(consulta);
      }

      let resolucion = null;
      let catalogoOk = true;
      try {
        const provResponse = await usuarioService.listarProvincias();
        const provincias = Array.isArray(provResponse?.data)
          ? provResponse.data
          : [];

        resolucion = resolverUbicacionTexto(texto, provincias);
        if (!resolucion) {
          const locResponse = await usuarioService.listarLocalidades({
            nombre: texto,
          });
          const localidades = Array.isArray(locResponse?.data)
            ? locResponse.data
            : [];
          resolucion = resolverUbicacionTexto(texto, provincias, localidades);
        }
      } catch {
        resolucion = null;
        catalogoOk = false;
      }

      if (catalogoOk) {
        if (this.resolucionUbicacionCache.size >= LIMITE_CACHE_UBICACION) {
          this.resolucionUbicacionCache.clear();
        }
        this.resolucionUbicacionCache.set(consulta, resolucion);
      }
      return resolucion;
    },
    async variantesDeTexto(texto, base) {
      const claves = ["nombreArtistico", "nombre", "apellido", "profesion"];
      const variantes = claves
        .filter((clave) => base[clave] === undefined)
        .filter((clave) => !(clave === "profesion" && base.idProfesion != null))
        .map((clave) => ({ ...base, todos: true, [clave]: texto }));

      const ubicacion = await this.resolverFiltroUbicacion(texto);
      if (ubicacion) {
        variantes.push({
          ...base,
          todos: true,
          [ubicacion.tipo]: ubicacion.valor,
        });
      }
      return variantes;
    },
    combinarResultados(respuestas) {
      const vistos = new Map();
      for (const respuesta of respuestas) {
        const contenido = Array.isArray(respuesta?.data?.contenido)
          ? respuesta.data.contenido
          : [];
        for (const perfil of contenido) {
          if (perfil?.idPerfil != null && !vistos.has(perfil.idPerfil)) {
            vistos.set(perfil.idPerfil, perfil);
          }
        }
      }
      return Array.from(vistos.values()).sort((a, b) =>
        String(a?.nombreArtistico || "").localeCompare(
          String(b?.nombreArtistico || ""),
          "es",
          { sensitivity: "base" }
        )
      );
    },
    variantesDeTextoProyecto(texto, base) {
      return ["nombre", "director"].map((clave) => ({
        ...base,
        todos: true,
        [clave]: texto,
      }));
    },
    combinarProyectos(respuestas) {
      const vistos = new Map();
      for (const respuesta of respuestas) {
        const contenido = Array.isArray(respuesta?.data?.contenido)
          ? respuesta.data.contenido
          : [];
        for (const proyecto of contenido) {
          if (proyecto?.idProyecto != null && !vistos.has(proyecto.idProyecto)) {
            vistos.set(proyecto.idProyecto, proyecto);
          }
        }
      }
      return Array.from(vistos.values()).sort((a, b) =>
        String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es", {
          sensitivity: "base",
        })
      );
    },
    async consultarPerfiles(
      { page = 0, size = 20, todos = false } = {},
      signal
    ) {
      const base = this.buildParamsBase();
      const texto = this.limpiarTexto(this.filtros.q);

      if (!texto) {
        const params = { ...base };
        if (todos || !size) params.todos = true;
        else {
          params.page = page;
          params.size = size;
        }
        const response = await perfilService.buscar(params, signal);
        const data = response?.data || {};
        return {
          items: Array.isArray(data.contenido) ? data.contenido : [],
          paginacion: this.normalizarPagina(data),
        };
      }

      const variantes = await this.variantesDeTexto(texto, base);
      const respuestas = await Promise.all(
        variantes.map((params) => perfilService.buscar(params, signal))
      );
      const listado = this.combinarResultados(respuestas);
      const pagina = this.paginar(listado, page, size);
      return { items: pagina.contenido, paginacion: pagina };
    },
    async consultarProyectos(
      { page = 0, size = 20, todos = false } = {},
      signal
    ) {
      const base = this.buildParamsProyectoBase();
      const texto = this.limpiarTexto(this.filtros.q);

      if (!texto) {
        const params = { ...base };
        if (todos || !size) params.todos = true;
        else {
          params.page = page;
          params.size = size;
        }
        const response = await proyectoService.buscar(params, signal);
        const data = response?.data || {};
        return {
          items: Array.isArray(data.contenido) ? data.contenido : [],
          paginacion: this.normalizarPagina(data),
        };
      }

      const variantes = this.variantesDeTextoProyecto(texto, base);
      const respuestas = await Promise.all(
        variantes.map((params) => proyectoService.buscar(params, signal))
      );
      const listado = this.combinarProyectos(respuestas);
      const pagina = this.paginar(listado, page, size);
      return { items: pagina.contenido, paginacion: pagina };
    },
    async consultarOportunidadesPorTipo(
      tipo,
      { page = 0, size = 20, todos = false } = {},
      signal
    ) {
      const params = this.buildParamsOportunidad(page, size, todos);
      const response =
        tipo === TIPOS_POSTULACION.ACTIVIDAD
          ? await requerimientoService.buscarActividades(params, signal)
          : await requerimientoService.buscarGenerales(params, signal);
      const data = response?.data || {};
      return {
        items: Array.isArray(data.contenido) ? data.contenido : [],
        paginacion: this.normalizarPagina(data),
      };
    },
    resultadoSeguro(resultado, etiqueta, errores) {
      if (resultado.status === "fulfilled") return resultado.value;
      errores.push(etiqueta);
      return { items: [], paginacion: this.paginacionInicial() };
    },
    async cargarTodo(signal, corrida) {
      const [perfilesRes, proyectosRes, generalesRes, actividadesRes] =
        await Promise.allSettled([
          this.consultarPerfiles({ page: 0, size: 3 }, signal),
          this.consultarProyectos({ page: 0, size: 3 }, signal),
          this.consultarOportunidadesPorTipo(
            TIPOS_POSTULACION.GENERAL,
            { page: 0, size: 3 },
            signal
          ),
          this.consultarOportunidadesPorTipo(
            TIPOS_POSTULACION.ACTIVIDAD,
            { page: 0, size: 3 },
            signal
          ),
        ]);

      if (corrida !== this.idBusqueda) return;

      const errores = [];
      const perfiles = this.resultadoSeguro(
        perfilesRes,
        "perfiles",
        errores
      );
      const proyectos = this.resultadoSeguro(
        proyectosRes,
        "proyectos",
        errores
      );
      const generales = this.resultadoSeguro(
        generalesRes,
        "oportunidades generales",
        errores
      );
      const actividades = this.resultadoSeguro(
        actividadesRes,
        "oportunidades de actividad",
        errores
      );

      this.todo.perfiles = perfiles.items;
      this.todo.proyectos = proyectos.items;
      this.todo.oportunidades = [
        ...generales.items,
        ...actividades.items,
      ].slice(0, 3);

      this.contadores.perfiles = perfiles.paginacion.totalElementos;
      this.contadores.proyectos = proyectos.paginacion.totalElementos;
      this.contadoresOportunidades = {
        generales: generales.paginacion.totalElementos,
        actividades: actividades.paginacion.totalElementos,
      };
      this.contadores.oportunidades =
        this.contadoresOportunidades.generales +
        this.contadoresOportunidades.actividades;
      this.actualizarContadorTodo();

      if (errores.length) {
        this.mensajeError =
          errores.length === 4
            ? "No se pudieron cargar los resultados. Intentá nuevamente."
            : `No se pudieron cargar: ${errores.join(", ")}.`;
        this.puedeReintentar = true;
      } else {
        this.claveContadoresCargada = this.claveContadoresActual();
      }
    },
    actualizarContadorTodo() {
      this.contadores.todo =
        this.contadores.perfiles +
        this.contadores.proyectos +
        this.contadores.oportunidades;
    },
    claveContadoresActual() {
      return JSON.stringify({
        q: this.limpiarTexto(this.filtros.q),
        idProfesion: this.filtros.idProfesion,
        estadoProyecto: this.filtros.estadoProyecto,
        idCaracteristica: this.filtros.idCaracteristica,
        idValorCaracteristica: this.filtros.idValorCaracteristica,
        valorCaracteristica: this.limpiarTexto(
          this.filtros.valorCaracteristica
        ),
        soloMiProfesion: this.filtros.soloMiProfesion,
        soloPostulables: this.filtros.soloPostulables,
        excluirYaPostulados: this.filtros.excluirYaPostulados,
        provinciaId: this.filtros.ubicacion?.provinciaId || null,
        localidadId: this.filtros.ubicacion?.localidadId || null,
      });
    },
    /**
     * Mantiene los contadores de las pestañas inactivas sin duplicar
     * resultados visibles. Se ejecuta sólo cuando cambian los filtros.
     */
    async actualizarContadoresGlobales() {
      const clave = this.claveContadoresActual();
      if (clave === this.claveContadoresCargada) return;

      if (controladorContadores) controladorContadores.abort();
      controladorContadores = new AbortController();
      const signal = controladorContadores.signal;

      const [perfilesRes, proyectosRes, generalesRes, actividadesRes] =
        await Promise.allSettled([
          this.consultarPerfiles({ page: 0, size: 1 }, signal),
          this.consultarProyectos({ page: 0, size: 1 }, signal),
          this.consultarOportunidadesPorTipo(
            TIPOS_POSTULACION.GENERAL,
            { page: 0, size: 1 },
            signal
          ),
          this.consultarOportunidadesPorTipo(
            TIPOS_POSTULACION.ACTIVIDAD,
            { page: 0, size: 1 },
            signal
          ),
        ]);

      if (signal.aborted || clave !== this.claveContadoresActual()) return;

      if (perfilesRes.status === "fulfilled") {
        this.contadores.perfiles =
          perfilesRes.value.paginacion.totalElementos;
      }
      if (proyectosRes.status === "fulfilled") {
        this.contadores.proyectos =
          proyectosRes.value.paginacion.totalElementos;
      }
      if (generalesRes.status === "fulfilled") {
        this.contadoresOportunidades.generales =
          generalesRes.value.paginacion.totalElementos;
      }
      if (actividadesRes.status === "fulfilled") {
        this.contadoresOportunidades.actividades =
          actividadesRes.value.paginacion.totalElementos;
      }
      this.contadores.oportunidades =
        this.contadoresOportunidades.generales +
        this.contadoresOportunidades.actividades;
      this.actualizarContadorTodo();
      this.claveContadoresCargada = clave;
    },
    async buscar(page = 0) {
      this.buscado[this.tab] = true;
      const corrida = ++this.idBusqueda;
      if (controladorBusqueda) controladorBusqueda.abort();
      if (controladorContadores) controladorContadores.abort();
      controladorBusqueda = new AbortController();
      const signal = controladorBusqueda.signal;

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      try {
        if (this.tab === "todo") {
          await this.cargarTodo(signal, corrida);
          return;
        }

        if (this.tab === "oportunidades") {
          const tipo =
            this.subtabOportunidades === "actividades"
              ? TIPOS_POSTULACION.ACTIVIDAD
              : TIPOS_POSTULACION.GENERAL;
          const resultado = await this.consultarOportunidadesPorTipo(
            tipo,
            { page, size: this.tamanoActual() },
            signal
          );
          if (corrida !== this.idBusqueda) return;
          this.oportunidades = resultado.items;
          this.paginacionOportunidades = resultado.paginacion;
          this.contadoresOportunidades[this.subtabOportunidades] =
            resultado.paginacion.totalElementos;
          this.contadores.oportunidades =
            this.contadoresOportunidades.generales +
            this.contadoresOportunidades.actividades;
          this.actualizarContadorTodo();
          this.actualizarContadoresGlobales();
          return;
        }

        if (this.tab === "proyectos") {
          const resultado = await this.consultarProyectos(
            { page, size: this.tamanoActual() },
            signal
          );
          if (corrida !== this.idBusqueda) return;
          this.proyectos = resultado.items;
          this.paginacionProyectos = resultado.paginacion;
          this.contadores.proyectos = resultado.paginacion.totalElementos;
          this.actualizarContadorTodo();
          this.actualizarContadoresGlobales();
          return;
        }

        const resultado = await this.consultarPerfiles(
          { page, size: this.tamanoActual() },
          signal
        );
        if (corrida !== this.idBusqueda) return;
        this.perfiles = resultado.items;
        this.paginacionPerfiles = resultado.paginacion;
        this.contadores.perfiles = resultado.paginacion.totalElementos;
        this.actualizarContadorTodo();
        this.actualizarContadoresGlobales();
      } catch (error) {
        if (
          corrida !== this.idBusqueda ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.limpiarResultadosTab();
        this.manejarErrorBusqueda(error);
      } finally {
        if (corrida === this.idBusqueda) this.cargando = false;
      }
    },
    limpiarResultadosTab() {
      if (this.tab === "perfiles") {
        this.perfiles = [];
        this.paginacionPerfiles = this.paginacionInicial();
      } else if (this.tab === "proyectos") {
        this.proyectos = [];
        this.paginacionProyectos = this.paginacionInicial();
      } else if (this.tab === "oportunidades") {
        this.oportunidades = [];
        this.paginacionOportunidades = this.paginacionInicial();
      } else {
        this.todo = { perfiles: [], proyectos: [], oportunidades: [] };
      }
    },
    manejarErrorBusqueda(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (status === 404) {
        this.mensajeError =
          mensaje ||
          "No hay un perfil activo seleccionado en la sesión. Elegí un perfil para buscar.";
      } else if (status === 401) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra habilitada."
        );
      } else if (status === 403) {
        this.mensajeError = mensajeErrorApi(
          error,
          "No se pudo completar la búsqueda."
        );
      } else if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al buscar. Inténtalo nuevamente.";
        this.toast.init({
          title: "Error del servidor",
          message:
            "No se pudieron cargar los resultados. Usá el botón de reintento.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
      } else {
        this.mensajeError =
          mensaje || "Ocurrió un error al buscar. Inténtalo nuevamente.";
      }
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
    irAPerfil(perfil) {
      if (perfil?.idPerfil) {
        this.$router.push({
          name: "ver-perfil",
          params: { id: perfil.idPerfil },
        });
      }
    },
    irAProyecto(proyecto) {
      if (proyecto?.idProyecto) {
        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: proyecto.idProyecto },
        });
      }
    },
    verDetalleOportunidad(oportunidad) {
      if (!oportunidad) return;
      const tipo = normalizarTipoOportunidad(oportunidad.tipo);
      if (
        tipo === TIPOS_POSTULACION.ACTIVIDAD &&
        oportunidad.idProyecto != null &&
        oportunidad.idActividad != null
      ) {
        this.$router.push({
          name: "actividad-detalle",
          params: {
            id: oportunidad.idProyecto,
            idActividad: oportunidad.idActividad,
          },
        });
        return;
      }
      if (oportunidad.idProyecto != null) {
        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: oportunidad.idProyecto },
          query: { tab: "postulaciones" },
        });
      }
    },
    abrirPostulacion(oportunidad) {
      if (!oportunidad || !puedePostularOportunidad(oportunidad)) return;

      const tipo = normalizarTipoOportunidad(
        oportunidad.tipo,
        this.subtabOportunidades === "actividades"
          ? TIPOS_POSTULACION.ACTIVIDAD
          : TIPOS_POSTULACION.GENERAL
      );

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

        await this.buscar(
          this.tab === "oportunidades"
            ? this.paginacionOportunidades.paginaActual
            : 0
        );
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
        this.cerrarModalPostulacion(false);

        if (clasificacion?.tipo === "perfil-activo") {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          return;
        }

        if (clasificacion?.tipo === "perfil-no-encontrado") {
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          return;
        }

        this.toast.init({
          title: "No se pudo postular",
          message: mensaje || "El requerimiento ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        await this.buscar(0);
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
        await this.buscar(
          this.tab === "oportunidades"
            ? this.paginacionOportunidades.paginaActual
            : 0
        );
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
      const claveBuscada = claveOportunidad({ tipo, idRequerimiento });
      for (const lista of [this.oportunidades, this.todo.oportunidades]) {
        const indice = lista.findIndex(
          (oportunidad) => claveOportunidad(oportunidad) === claveBuscada
        );
        if (indice !== -1) {
          lista.splice(indice, 1, { ...lista[indice], ...cambios });
        }
      }
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
.buscar-perfil {
  width: 100%;
}

.buscar-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.buscar-perfil__subtitulo {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1rem;
}

.buscar-perfil__recientes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.buscar-perfil__recientes-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.buscar-perfil__reciente {
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.76rem;
  cursor: pointer;
}

.buscar-perfil__reciente:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.buscar-perfil__tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  margin-bottom: 1rem;
}

.buscar-perfil__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.buscar-perfil__tab:hover {
  color: var(--color-text);
}

.buscar-perfil__tab--active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(35, 33, 52, 0.1);
}

.buscar-perfil__tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 700;
}

.buscar-perfil__tab--active .buscar-perfil__tab-count {
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.buscar-perfil__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.buscar-perfil__filtros--toggles {
  gap: 0.75rem 1.25rem;
}

.buscar-perfil__campo {
  min-width: 180px;
}

.buscar-perfil__campo--texto {
  flex: 1;
  min-width: 240px;
}

.buscar-perfil__campo--tamano {
  min-width: 150px;
}

.buscar-perfil__campo--orden {
  min-width: 170px;
}

.buscar-perfil__icono-campo {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.buscar-perfil__ayuda {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.buscar-perfil__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text);
  font-size: 0.8rem;
  cursor: pointer;
}

.buscar-perfil__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.buscar-perfil__resumen {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.buscar-perfil__reintento {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.buscar-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.buscar-perfil__subtabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.2rem;
  margin-bottom: 1rem;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.buscar-perfil__subtab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.9rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.buscar-perfil__subtab--active {
  background: var(--color-surface);
  color: var(--color-primary);
}

.buscar-perfil__paginacion {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.buscar-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.buscar-perfil__estado-icono {
  font-size: 2.5rem;
}

@media (max-width: 640px) {
  .buscar-perfil__tabs {
    display: flex;
    width: 100%;
    overflow-x: auto;
  }

  .buscar-perfil__tab {
    flex: 0 0 auto;
  }

  .buscar-perfil__campo,
  .buscar-perfil__campo--texto,
  .buscar-perfil__campo--tamano,
  .buscar-perfil__campo--orden {
    width: 100%;
    min-width: 0;
  }

  .buscar-perfil__grid {
    grid-template-columns: 1fr;
  }
}
</style>
