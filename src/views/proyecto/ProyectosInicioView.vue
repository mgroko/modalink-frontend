<template>
  <div class="proyectos-inicio">
    <header class="proyectos-inicio__header">
      <h1 class="proyectos-inicio__titulo">Proyectos / Inicio</h1>
      <VaButton color="#5CA4A9" text-color="#17161F" icon="mso-add" @click="irACrearProyecto">
        Crear proyecto
      </VaButton>
    </header>

    <section class="proyectos-inicio__panel">
      <span class="proyectos-inicio__panel-titulo">Buscar proyecto</span>

      <div class="proyectos-inicio__filtros">
        <VaInput
          v-model="filtros.nombre"
          class="proyectos-inicio__campo proyectos-inicio__campo--nombre"
          placeholder="Nombre"
          @keyup.enter="buscarAhora"
          @input="programarBusqueda"
        >
          <template #prependInner>
            <span class="material-symbols-outlined proyectos-inicio__icono-campo">search</span>
          </template>
        </VaInput>

        <VaSelect
          v-model="filtros.estado"
          class="proyectos-inicio__campo proyectos-inicio__campo--estado"
          :options="opcionesEstado"
          value-by="value"
          text-by="text"
          placeholder="Estado"
          clearable
          @update:modelValue="buscarAhora"
        />

        <label class="proyectos-inicio__opcion">
          <input
            v-model="filtros.director"
            type="checkbox"
            @change="cambiarRol"
          />
          <span>Director</span>
        </label>

        <label class="proyectos-inicio__opcion">
          <input
            v-model="filtros.miembro"
            type="checkbox"
            @change="cambiarRol"
          />
          <span>Miembro</span>
        </label>

        <VaSelect
          v-model="filtros.tamano"
          class="proyectos-inicio__campo proyectos-inicio__campo--tamano"
          :options="opcionesTamano"
          value-by="value"
          text-by="text"
          placeholder="Resultados"
          @update:modelValue="buscarAhora"
        />

        <button
          type="button"
          class="proyectos-inicio__limpiar"
          :disabled="!hayFiltrosActivos"
          @click="limpiarFiltros"
        >
          <span class="material-symbols-outlined">filter_alt_off</span>
          Limpiar filtros
        </button>
      </div>
    </section>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar && !cargando" class="proyectos-inicio__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="proyectos-inicio__estado">
      <span class="material-symbols-outlined proyectos-inicio__estado-icono">hourglass_empty</span>
      Buscando proyectos...
    </div>

    <template v-else>
      <p v-if="!mensajeError" class="proyectos-inicio__resumen">
        {{ paginacion.totalElementos }} proyecto(s) encontrado(s)
        <template v-if="!esTodos">
          · Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
        </template>
      </p>

      <div v-if="proyectos.length === 0 && !mensajeError" class="proyectos-inicio__estado">
        <span class="material-symbols-outlined proyectos-inicio__estado-icono">folder_open</span>
        <span v-if="hayFiltrosDeBusqueda">
          No encontramos ningún proyecto que coincida con tus criterios de búsqueda.
        </span>
        <span v-else>
          Todavía no participás en ningún proyecto. Creá uno o unite a uno existente.
        </span>
        <VaButton
          v-if="hayFiltrosDeBusqueda"
          preset="secondary"
          size="small"
          @click="limpiarFiltros"
        >
          Restablecer filtros
        </VaButton>
        <VaButton
          v-else
          color="#5CA4A9"
          text-color="#17161F"
          size="small"
          icon="mso-add"
          @click="irACrearProyecto"
        >
          Crear proyecto
        </VaButton>
      </div>

      <div v-else-if="proyectos.length > 0" class="proyectos-inicio__lista">
        <article
          v-for="proyecto in proyectos"
          :key="proyecto.idProyecto"
          class="proyecto-tarjeta"
          role="button"
          tabindex="0"
          @click="irAProyecto(proyecto)"
          @keydown.enter="irAProyecto(proyecto)"
          @keydown.space.prevent="irAProyecto(proyecto)"
        >
          <div class="proyecto-tarjeta__cuerpo">
            <div class="proyecto-tarjeta__encabezado">
              <h3 class="proyecto-tarjeta__nombre">{{ proyecto.nombre }}</h3>
              <span
                class="proyecto-tarjeta__rol"
                :style="estiloRol(proyecto.rolUsuario)"
              >
                {{ etiquetaRolProyecto(proyecto.rolUsuario) }}
              </span>
              <EstadoProyectoBadge
                class="proyecto-tarjeta__estado"
                :estado="proyecto.estado"
              />
            </div>

            <p class="proyecto-tarjeta__descripcion">{{ proyecto.descripcion }}</p>

            <p v-if="proyecto.fechaInicio" class="proyecto-tarjeta__inicio">
              <span class="material-symbols-outlined">event</span>
              Inicio: {{ formatearFechaCorta(proyecto.fechaInicio) }}
            </p>

            <div v-if="proyecto.proximaActividad" class="proyecto-tarjeta__actividad">
              <span class="proyecto-tarjeta__actividad-etiqueta">
                Próxima actividad asignada al usuario
              </span>
              <span class="proyecto-tarjeta__actividad-hora">
                {{ rangoHorario(proyecto.proximaActividad) }}
              </span>
              <span class="proyecto-tarjeta__actividad-nombre">
                {{ proyecto.proximaActividad.nombre }}
              </span>
            </div>

            <p v-else class="proyecto-tarjeta__sin-actividad">
              Sin actividad próxima
            </p>
          </div>

          <span class="material-symbols-outlined proyecto-tarjeta__flecha">arrow_forward</span>
        </article>
      </div>

      <div
        v-if="!esTodos && proyectos.length > 0 && paginacion.totalPaginas > 1"
        class="proyectos-inicio__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="cambiarPagina(-1)"
        >
          Anterior
        </VaButton>
        <VaButton
          preset="secondary"
          size="small"
          icon-right="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="cambiarPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService";
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoProyectoBadge from "../../components/proyecto/EstadoProyectoBadge.vue";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { horaCorta, aHora } from "../../utils/horas.js";
import {
  OPCIONES_ESTADO_FILTRO,
  ROLES_PROYECTO,
  coloresRolProyecto,
  etiquetaRolProyecto,
} from "../../utils/proyectoConstants.js";

const DEBOUNCE_MS = 350;
const TAMANO_POR_DEFECTO = 20;

// Cancela la request en vuelo cuando arranca una búsqueda nueva
// (no reactivo a propósito: AbortController no debe pasar por reactive()).
let controladorBusqueda = null;

function filtrosVacios() {
  return {
    nombre: "",
    estado: null,
    director: false,
    miembro: false,
    tamano: { text: "20 por página", value: TAMANO_POR_DEFECTO },
  };
}

export default {
  name: "ProyectosInicioView",
  components: {
    BaseAlert,
    EstadoProyectoBadge,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: filtrosVacios(),
      opcionesEstado: OPCIONES_ESTADO_FILTRO,
      opcionesTamano: [
        { text: "20 por página", value: 20 },
        { text: "50 por página", value: 50 },
        { text: "Ver todos", value: 0 },
      ],
      proyectos: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: TAMANO_POR_DEFECTO,
        totalElementos: 0,
        totalPaginas: 0,
        primera: true,
        ultima: true,
      },
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      debounceHandle: null,
      idBusqueda: 0,
    };
  },
  computed: {
    /**
     * VaSelect con `value-by="value"` emite el valor simple (20/50/0), pero
     * el estado inicial es el objeto `{text, value}`: se normaliza para que
     * "Ver todos" (0) no se confunda con el default.
     */
    tamanoSeleccionado() {
      const tamano = this.filtros.tamano;
      if (tamano === null || tamano === undefined || tamano === "") {
        return TAMANO_POR_DEFECTO;
      }
      if (typeof tamano === "object") {
        return Number(tamano.value ?? TAMANO_POR_DEFECTO);
      }
      return Number(tamano);
    },
    esTodos() {
      return this.tamanoSeleccionado === 0;
    },
    hayFiltrosDeBusqueda() {
      return (
        this.filtros.nombre.trim() !== "" ||
        this.filtros.estado != null ||
        this.filtros.director ||
        this.filtros.miembro
      );
    },
    hayFiltrosActivos() {
      return (
        this.hayFiltrosDeBusqueda || this.tamanoSeleccionado !== TAMANO_POR_DEFECTO
      );
    },
  },
  async mounted() {
    await this.buscar();
  },
  methods: {
    etiquetaRolProyecto,
    estiloRol(rol) {
      const colores = coloresRolProyecto(rol);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
    /** "18:00 – 20:00": el backend no envía la hora de fin calculada. */
    rangoHorario(actividad) {
      const inicio = horaCorta(String(actividad?.fechaHoraInicio || "").split("T")[1] || "");
      if (!inicio) return "";
      const duracion = Number(actividad?.duracionMinutos) || 0;
      const [hora, minuto] = inicio.split(":").map(Number);
      return `${inicio} – ${aHora(hora * 60 + minuto + duracion)}`;
    },
    irACrearProyecto() {
      this.$router.push({ name: "crear-proyecto" });
    },
    irAProyecto(proyecto) {
      if (proyecto?.idProyecto) {
        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: proyecto.idProyecto },
        });
      }
    },
    cambiarRol() {
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
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    limpiarFiltros() {
      this.filtros = filtrosVacios();
      this.buscarAhora();
    },
    /**
     * El filtro de rol tiene tres estados efectivos: Director, Miembro o
     * ambos/ninguno. Si están marcados los dos (o ninguno) no se envía
     * `rol` (ficha UC-29 bis §5.2).
     */
    buildParams(page) {
      const params = {};

      const nombre = this.filtros.nombre.trim();
      if (nombre) params.nombre = nombre;

      if (this.filtros.estado) params.estado = this.filtros.estado;

      const soloDirector = this.filtros.director && !this.filtros.miembro;
      const soloMiembro = this.filtros.miembro && !this.filtros.director;
      if (soloDirector) params.rol = ROLES_PROYECTO.DIRECTOR;
      else if (soloMiembro) params.rol = ROLES_PROYECTO.MIEMBRO;

      const size = this.tamanoSeleccionado;
      if (size === 0) {
        params.todos = true;
      } else {
        params.page = page;
        params.size = size;
      }
      return params;
    },
    normalizarPagina(data) {
      return {
        paginaActual: data.paginaActual ?? 0,
        tamanoPagina: data.tamanoPagina ?? TAMANO_POR_DEFECTO,
        totalElementos: data.totalElementos ?? 0,
        totalPaginas: data.totalPaginas ?? 1,
        primera: data.primera ?? true,
        ultima: data.ultima ?? true,
      };
    },
    async buscar(page = 0) {
      const corrida = ++this.idBusqueda;
      if (controladorBusqueda) controladorBusqueda.abort();
      controladorBusqueda = new AbortController();

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.propios(
          this.buildParams(page),
          controladorBusqueda.signal
        );
        if (corrida !== this.idBusqueda) return;
        const data = response?.data || {};
        this.proyectos = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = this.normalizarPagina(data);
      } catch (error) {
        if (
          corrida !== this.idBusqueda ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.manejarError(error);
      } finally {
        if (corrida === this.idBusqueda) this.cargando = false;
      }
    },
    async manejarError(error) {
      const status = error?.response?.status;
      this.proyectos = [];

      const clasificacion = clasificarErrorProyecto(error);

      if (clasificacion?.tipo === "perfil-activo") {
        this.mensajeError =
          "No hay un perfil activo seleccionado. Elegí un perfil para ver tus proyectos.";
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

      if (status === 400) {
        this.mensajeError = "Revisá los filtros seleccionados e intentá nuevamente.";
        return;
      }

      if (status === 401) {
        this.mensajeError = mensajeErrorApi(error, "Tu sesión no está activa.");
        return;
      }

      if (status === 403) {
        this.mensajeError = mensajeErrorApi(error, "No podés listar tus proyectos.");
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al buscar proyectos. Inténtalo nuevamente.";
        this.toast.init({
          title: "Error del servidor",
          message: "No se pudieron cargar los proyectos. Usá el botón de reintento.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "Ocurrió un error al buscar proyectos. Inténtalo nuevamente."
      );
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    if (controladorBusqueda) controladorBusqueda.abort();
  },
};
</script>

<style scoped>
.proyectos-inicio {
  width: 100%;
}

.proyectos-inicio__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.proyectos-inicio__titulo {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.proyectos-inicio__panel {
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.proyectos-inicio__panel-titulo {
  display: block;
  margin-bottom: 0.6rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.proyectos-inicio__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem;
}

.proyectos-inicio__campo--nombre {
  min-width: 220px;
}

.proyectos-inicio__campo--estado {
  min-width: 160px;
}

.proyectos-inicio__campo--tamano {
  min-width: 150px;
}

.proyectos-inicio__icono-campo {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.proyectos-inicio__opcion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
}

.proyectos-inicio__opcion input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.proyectos-inicio__limpiar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--color-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}

.proyectos-inicio__limpiar:disabled {
  color: var(--color-text-muted);
  opacity: 0.6;
  cursor: not-allowed;
}

.proyectos-inicio__limpiar .material-symbols-outlined {
  font-size: 1.1rem;
}

.proyectos-inicio__reintento {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.proyectos-inicio__resumen {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.proyectos-inicio__lista {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.proyecto-tarjeta {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.proyecto-tarjeta:hover {
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
  border-color: var(--color-primary-light);
}

.proyecto-tarjeta:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.proyecto-tarjeta__cuerpo {
  flex: 1;
  min-width: 0;
}

.proyecto-tarjeta__encabezado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.proyecto-tarjeta__nombre {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.proyecto-tarjeta__rol {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.55rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
}

.proyecto-tarjeta__estado {
  margin-left: auto;
}

.proyecto-tarjeta__descripcion {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-text);
}

.proyecto-tarjeta__inicio {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.proyecto-tarjeta__inicio .material-symbols-outlined {
  font-size: 0.95rem;
}

.proyecto-tarjeta__actividad {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.75rem;
}

.proyecto-tarjeta__actividad-etiqueta {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.proyecto-tarjeta__actividad-hora {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-success-text);
}

.proyecto-tarjeta__actividad-nombre {
  font-size: 0.82rem;
  color: var(--color-success-text);
}

.proyecto-tarjeta__sin-actividad {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.proyecto-tarjeta__flecha {
  flex-shrink: 0;
  font-size: 1.5rem;
  color: var(--color-text-muted);
}

.proyectos-inicio__paginacion {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.proyectos-inicio__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.proyectos-inicio__estado-icono {
  font-size: 2.5rem;
}
</style>
