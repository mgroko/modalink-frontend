<template>
  <div class="buscar-personas">
    <div class="buscar-personas__filtros">
      <VaInput
        class="buscar-personas__campo buscar-personas__campo--buscar"
        :model-value="filtros.nombreArtistico"
        placeholder="Buscar por nombre artístico…"
        aria-label="Buscar personas por nombre artístico"
        clearable
        @update:modelValue="cambiarTexto"
        @keyup.enter="buscarAhora"
      >
        <template #prependInner>
          <span class="material-symbols-outlined buscar-personas__icono">
            search
          </span>
        </template>
      </VaInput>

      <VaSelect
        class="buscar-personas__campo"
        :model-value="filtros.idProfesion"
        :options="profesiones"
        value-by="idProfesion"
        :text-by="(opcion) => opcion.nombre"
        placeholder="Profesión"
        clearable
        :loading="cargandoProfesiones"
        @update:modelValue="cambiarProfesion"
      />

      <VaSelect
        class="buscar-personas__campo buscar-personas__campo--tamano"
        :model-value="filtros.tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        aria-label="Resultados por página"
        @update:modelValue="cambiarTamano"
      />
    </div>

    <div v-if="error" class="buscar-personas__error">
      <BaseAlert :message="error" type="error" />
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-refresh"
        @click="reintentar"
      >
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="buscar-personas__estado" aria-live="polite">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Buscando personas...
    </div>

    <template v-else-if="!error">
      <div v-if="!perfiles.length" class="buscar-personas__vacio">
        <span class="material-symbols-outlined" aria-hidden="true">
          person_search
        </span>
        <p>No encontramos personas que coincidan con tu búsqueda.</p>
      </div>

      <template v-else>
        <div class="buscar-personas__grid">
          <PerfilBusquedaCard
            v-for="perfil in perfiles"
            :key="perfil.idPerfil"
            :perfil="perfil"
            :permitir-conexion="true"
            :estado-conexion="estadoConexionDe(perfil)"
            :conectando="estaConectando(perfil)"
            @abrir="verPerfil"
            @conectar="abrirConexion"
          />
        </div>

        <PaginacionResultados
          :paginacion="paginacion"
          @cambiar="cambiarPagina"
        />
      </template>
    </template>

    <ModalEnviarSolicitudConexion
      :model-value="modalConexion"
      :perfil="perfilSeleccionado"
      :nombre-remitente="nombreRemitente"
      :enviando="enviandoConexion"
      :error="errorConexion"
      @update:model-value="alCambiarModalConexion"
      @confirmar="enviarSolicitud"
    />
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import PerfilBusquedaCard from "../busqueda/PerfilBusquedaCard.vue";
import PaginacionResultados from "../busqueda/PaginacionResultados.vue";
import ModalEnviarSolicitudConexion from "../perfil/ModalEnviarSolicitudConexion.vue";
import perfilService from "../../services/perfilService";
import solicitudConexionService from "../../services/solicitudConexionService";
import {
  idPerfilActivo,
  idUsuarioActivo,
  state as authState,
} from "../../services/authState";
import {
  CODIGOS_ERROR_CONEXION,
  ESTADOS_CONEXION,
  mensajeErrorConexion,
  normalizarEstadoConexion,
} from "../../utils/conexionConstants.js";
import { OPCIONES_TAMANO } from "../../utils/solicitudesConexionConstants.js";
import { TAMANO_POR_DEFECTO } from "../../utils/parametrosSolicitudesConexion.js";
import { mensajeErrorApi } from "../../utils/apiError";
import { useToast } from "vuestic-ui";

const DEBOUNCE_MS = 350;

function paginacionInicial() {
  return {
    paginaActual: 0,
    tamanoPagina: TAMANO_POR_DEFECTO,
    totalElementos: 0,
    totalPaginas: 0,
    primera: true,
    ultima: true,
  };
}

function normalizarPagina(data) {
  return {
    paginaActual: data?.paginaActual ?? 0,
    tamanoPagina: data?.tamanoPagina ?? TAMANO_POR_DEFECTO,
    totalElementos: data?.totalElementos ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
    primera: data?.primera ?? true,
    ultima: data?.ultima ?? true,
  };
}

export default {
  name: "BuscarPersonasPanel",
  components: {
    BaseAlert,
    PerfilBusquedaCard,
    PaginacionResultados,
    ModalEnviarSolicitudConexion,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: {
        nombreArtistico: "",
        idProfesion: null,
        tamano: TAMANO_POR_DEFECTO,
      },
      opcionesTamano: OPCIONES_TAMANO,
      perfiles: [],
      paginacion: paginacionInicial(),
      cargando: true,
      error: "",
      profesiones: [],
      cargandoProfesiones: false,
      controlador: null,
      idBusqueda: 0,
      debounceHandle: null,
      estadosLocales: {},
      verificandoId: null,
      modalConexion: false,
      perfilSeleccionado: null,
      enviandoConexion: false,
      errorConexion: "",
    };
  },
  computed: {
    nombreRemitente() {
      return authState.usuario?.nombreArtisticoActivo || "tu perfil activo";
    },
  },
  mounted() {
    this.cargarProfesiones();
    this.buscar(0);
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    this.abortarBusqueda();
  },
  methods: {
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
    abortarBusqueda() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    async buscar(pagina = 0) {
      clearTimeout(this.debounceHandle);
      this.abortarBusqueda();

      const controlador = new AbortController();
      this.controlador = controlador;
      const corrida = ++this.idBusqueda;
      this.cargando = true;
      this.error = "";

      const params = {
        page: Math.max(0, Number(pagina) || 0),
        size: Math.min(
          100,
          Math.max(1, Number(this.filtros.tamano) || TAMANO_POR_DEFECTO)
        ),
      };

      const texto = String(this.filtros.nombreArtistico || "").trim();
      if (texto) params.nombreArtistico = texto;
      if (this.filtros.idProfesion != null) {
        params.idProfesion = this.filtros.idProfesion;
      }

      try {
        const response = await perfilService.buscar(
          params,
          controlador.signal
        );
        if (corrida !== this.idBusqueda) return;

        const data = response?.data || {};
        const contenido = Array.isArray(data.contenido) ? data.contenido : [];
        const idActivo = idPerfilActivo();
        const idUsuario = idUsuarioActivo();
        this.perfiles = contenido.filter((perfil) => {
          const esPerfilActivo =
            String(perfil?.idPerfil) === String(idActivo);
          const esMismoUsuario =
            idUsuario != null &&
            perfil?.idUsuario != null &&
            String(perfil.idUsuario) === String(idUsuario);
          return !esPerfilActivo && !esMismoUsuario;
        });
        this.paginacion = normalizarPagina(data);
      } catch (error) {
        if (
          corrida !== this.idBusqueda ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        this.perfiles = [];
        this.paginacion = paginacionInicial();
        this.error = mensajeErrorApi(
          error,
          "No se pudieron cargar los perfiles. Intentá nuevamente."
        );
      } finally {
        if (corrida === this.idBusqueda) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },
    cambiarTexto(valor) {
      this.filtros.nombreArtistico = valor;
      this.programarBusqueda();
    },
    cambiarProfesion(valor) {
      this.filtros.idProfesion = valor;
      this.buscarAhora();
    },
    cambiarTamano(valor) {
      this.filtros.tamano = valor;
      this.buscarAhora();
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
    verPerfil(perfil) {
      if (!perfil?.idPerfil) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: perfil.idPerfil },
      });
    },
    estadoConexionDe(perfil) {
      const local = this.estadosLocales[perfil?.idPerfil];
      return normalizarEstadoConexion(
        local ?? perfil?.estadoConexion ?? ESTADOS_CONEXION.NINGUNA
      );
    },
    estaConectando(perfil) {
      if (!perfil?.idPerfil) return false;
      return (
        this.verificandoId === perfil.idPerfil ||
        (this.enviandoConexion &&
          this.perfilSeleccionado?.idPerfil === perfil.idPerfil)
      );
    },
    guardarEstado(perfil, estado) {
      if (!perfil?.idPerfil) return;
      this.estadosLocales = {
        ...this.estadosLocales,
        [perfil.idPerfil]: normalizarEstadoConexion(estado),
      };
    },
    async consultarEstado(perfil) {
      try {
        const response = await perfilService.obtener(perfil.idPerfil);
        return normalizarEstadoConexion(response?.data?.estadoConexion);
      } catch {
        return null;
      }
    },
    mensajeEstado(estado) {
      if (estado === ESTADOS_CONEXION.CONECTADO) {
        return "Ya tenés una conexión con este perfil.";
      }
      if (estado === ESTADOS_CONEXION.SOLICITUD_RECIBIDA) {
        return "Este perfil ya te envió una solicitud de conexión.";
      }
      return "Ya enviaste una solicitud a este perfil.";
    },
    async abrirConexion(perfil) {
      if (!perfil?.idPerfil || this.verificandoId != null) return;
      if (this.estadoConexionDe(perfil) !== ESTADOS_CONEXION.NINGUNA) return;

      this.perfilSeleccionado = perfil;
      this.errorConexion = "";
      this.verificandoId = perfil.idPerfil;
      try {
        const estado = await this.consultarEstado(perfil);
        if (estado && estado !== ESTADOS_CONEXION.NINGUNA) {
          this.guardarEstado(perfil, estado);
          this.toast.init({
            title: "Estado de la conexión",
            message: this.mensajeEstado(estado),
            color: "info",
            position: "top-right",
            duration: 5000,
          });
          this.perfilSeleccionado = null;
          return;
        }
        this.modalConexion = true;
      } finally {
        this.verificandoId = null;
      }
    },
    alCambiarModalConexion(valor) {
      if (this.enviandoConexion && !valor) return;
      this.modalConexion = valor;
      if (!valor) {
        this.errorConexion = "";
        this.perfilSeleccionado = null;
      }
    },
    async enviarSolicitud() {
      if (this.enviandoConexion) return;
      const perfil = this.perfilSeleccionado;
      if (!perfil?.idPerfil) return;

      this.enviandoConexion = true;
      this.errorConexion = "";
      try {
        await solicitudConexionService.enviar(perfil.idPerfil);
        this.guardarEstado(perfil, ESTADOS_CONEXION.SOLICITUD_ENVIADA);
        this.modalConexion = false;
        this.perfilSeleccionado = null;
        this.toast.init({
          title: "Solicitud enviada",
          message: `Le enviaste una solicitud de conexión a ${
            perfil.nombreArtistico || "este perfil"
          }.`,
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        const codigo = error?.response?.data?.codigo;
        const esConflicto =
          codigo === CODIGOS_ERROR_CONEXION.SOLICITUD_CONEXION_PENDIENTE ||
          codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE;

        if (esConflicto) {
          this.modalConexion = false;
          const estado = await this.consultarEstado(perfil);
          if (
            codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE &&
            !estado
          ) {
            this.guardarEstado(perfil, ESTADOS_CONEXION.CONECTADO);
          } else if (estado) {
            this.guardarEstado(perfil, estado);
          }
          this.toast.init({
            title: "Conexión",
            message:
              codigo === CODIGOS_ERROR_CONEXION.CONEXION_YA_EXISTENTE
                ? "Ya tenés una conexión con este perfil."
                : "Ya existe una solicitud de conexión pendiente con este perfil.",
            color: "info",
            position: "top-right",
            duration: 5000,
          });
          this.perfilSeleccionado = null;
          return;
        }

        this.errorConexion = mensajeErrorConexion(error);
      } finally {
        this.enviandoConexion = false;
      }
    },
  },
};
</script>

<style scoped>
.buscar-personas {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.buscar-personas__filtros {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.buscar-personas__campo {
  min-width: 0;
}

.buscar-personas__campo--buscar {
  flex: 1 1 280px;
}

.buscar-personas__campo--tamano {
  flex: 0 1 170px;
}

.buscar-personas__icono {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.buscar-personas__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.buscar-personas__estado,
.buscar-personas__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

.buscar-personas__vacio {
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
}

.buscar-personas__vacio p {
  margin: 0;
}

.buscar-personas__estado .material-symbols-outlined,
.buscar-personas__vacio .material-symbols-outlined {
  font-size: 2rem;
}

.buscar-personas__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
</style>
