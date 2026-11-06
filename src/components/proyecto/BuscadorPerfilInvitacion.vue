<template>
  <div class="buscador-perfil-invitacion">
    <VaInput
      v-model="busqueda"
      class="buscador-perfil-invitacion__input"
      placeholder="Buscar perfil por nombre o profesión..."
      clearable
      :disabled="deshabilitado"
      @update:model-value="programarBusqueda"
    >
      <template #prependInner>
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
      </template>
    </VaInput>

    <p v-if="idProfesion != null" class="buscador-perfil-invitacion__filtro">
      <span class="material-symbols-outlined" aria-hidden="true">filter_alt</span>
      Profesión requerida:
      {{ nombreProfesion || "la actividad" }}
    </p>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div
      v-if="error && puedeReintentar"
      class="buscador-perfil-invitacion__reintento"
    >
      <VaButton preset="secondary" size="small" @click="buscar(paginacion.paginaActual)">
        Reintentar
      </VaButton>
    </div>

    <p v-if="cargando" class="buscador-perfil-invitacion__nota">
      Buscando perfiles...
    </p>

    <p
      v-else-if="!error && !perfiles.length"
      class="buscador-perfil-invitacion__vacio"
    >
      <span class="material-symbols-outlined" aria-hidden="true">search_off</span>
      No hay perfiles disponibles para invitar con los filtros actuales.
    </p>

    <ul v-else-if="!error" class="buscador-perfil-invitacion__lista">
      <li v-for="perfil in perfiles" :key="perfil.idPerfil">
        <button
          type="button"
          class="buscador-perfil-invitacion__item"
          :class="{
            'buscador-perfil-invitacion__item--seleccionado':
              estaSeleccionado(perfil),
          }"
          :disabled="deshabilitado"
          :aria-pressed="estaSeleccionado(perfil) ? 'true' : 'false'"
          @click="seleccionar(perfil)"
        >
          <span class="buscador-perfil-invitacion__avatar" aria-hidden="true">
            <img
              v-if="fotoDe(perfil) && !fotosRotas[perfil.idPerfil]"
              :src="fotoDe(perfil)"
              :alt="perfil.nombreArtistico || 'Perfil'"
              @error="marcarFotoRota(perfil)"
            />
            <template v-else>{{ inicialDe(perfil.nombreArtistico) }}</template>
          </span>

          <span class="buscador-perfil-invitacion__datos">
            <span class="buscador-perfil-invitacion__nombre">
              {{ perfil.nombreArtistico || "Perfil" }}
            </span>
            <span class="buscador-perfil-invitacion__meta">
              {{ perfil.profesion || "Sin profesión" }}
              <template v-if="ubicacionTexto(perfil)">
                · {{ ubicacionTexto(perfil) }}
              </template>
            </span>
            <span
              v-if="habilidadesVisibles(perfil).length"
              class="buscador-perfil-invitacion__habilidades"
            >
              {{ habilidadesVisibles(perfil).join(" · ") }}
            </span>
          </span>

          <span
            class="buscador-perfil-invitacion__accion"
            :class="{
              'buscador-perfil-invitacion__accion--seleccionado':
                estaSeleccionado(perfil),
            }"
          >
            {{ estaSeleccionado(perfil) ? "Quitar" : "Seleccionar" }}
          </span>
        </button>
      </li>
    </ul>

    <div
      v-if="mostrarPaginacion && !error"
      class="buscador-perfil-invitacion__paginacion"
    >
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_left"
        :disabled="deshabilitado || paginacion.primera || cargando"
        @click="cambiarPagina(-1)"
      >
        Anterior
      </VaButton>

      <span class="buscador-perfil-invitacion__pagina">
        Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
      </span>

      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_right"
        :disabled="deshabilitado || paginacion.ultima || cargando"
        @click="cambiarPagina(1)"
      >
        Siguiente
      </VaButton>
    </div>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import perfilService from "../../services/perfilService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import { resolverFotoUrl } from "../../utils/fotos.js";
import { formatUbicacion } from "../../utils/ubicacion.js";

const TAMANO_PAGINA = 20;
const DEBOUNCE_MS = 350;
let controlador = null;

/*
 * Buscador de perfiles destinatarios para UC-31.
 *
 * - Sin texto: paginación del servidor.
 * - Con texto: unión OR por nombre artístico, nombre, apellido y profesión,
 *   merge en cliente y paginación local (mismo patrón de BuscarPerfilView).
 * - Oculta perfiles propios y perfiles de miembros activos del proyecto.
 * - Permite seleccionar y quitar varios perfiles; el padre conserva la lista.
 */
export default {
  name: "BuscadorPerfilInvitacion",
  components: { BaseAlert },
  props: {
    idProfesion: {
      type: [Number, String],
      default: null,
    },
    nombreProfesion: {
      type: String,
      default: "",
    },
    idUsuarioActual: {
      type: [Number, String],
      default: null,
    },
    idPerfilesExcluidos: {
      type: Array,
      default: () => [],
    },
    /** Perfiles seleccionados. Cada item es un PerfilBusquedaResponse. */
    modelValue: {
      type: Array,
      default: () => [],
    },
    tokenRefresco: {
      type: Number,
      default: 0,
    },
    deshabilitado: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "seleccionados"],
  data() {
    return {
      busqueda: "",
      perfiles: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: TAMANO_PAGINA,
        totalElementos: 0,
        totalPaginas: 1,
        primera: true,
        ultima: true,
      },
      cargando: true,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
      temporalizador: null,
      fotosRotas: {},
      claveResultados: "",
      resultadosCombinados: [],
    };
  },
  computed: {
    idsPerfilesExcluidos() {
      return new Set(
        (this.idPerfilesExcluidos || [])
          .filter((id) => id != null && id !== "")
          .map((id) => String(id))
      );
    },
    mostrarPaginacion() {
      return this.paginacion.totalPaginas > 1;
    },
  },
  watch: {
    idProfesion() {
      this.$emit("update:modelValue", []);
      this.$emit("seleccionados", []);
      this.buscar(0);
    },
    tokenRefresco() {
      this.buscar(this.paginacion.paginaActual);
    },
  },
  mounted() {
    this.buscar(0);
  },
  beforeUnmount() {
    clearTimeout(this.temporalizador);
    this.abortar();
  },
  methods: {
    normalizarTexto(valor) {
      return String(valor || "").trim();
    },
    fotoDe(perfil) {
      return resolverFotoUrl(perfil?.fotoUrl);
    },
    marcarFotoRota(perfil) {
      if (perfil?.idPerfil == null) return;
      this.fotosRotas = { ...this.fotosRotas, [perfil.idPerfil]: true };
    },
    inicialDe(valor) {
      return String(valor || "?").trim().charAt(0).toUpperCase() || "?";
    },
    ubicacionTexto(perfil) {
      return formatUbicacion(perfil);
    },
    habilidadesVisibles(perfil) {
      const lista = Array.isArray(perfil?.habilidades) ? perfil.habilidades : [];
      return lista.slice(0, 3);
    },
    estaSeleccionado(perfil) {
      return (Array.isArray(this.modelValue) ? this.modelValue : []).some(
        (seleccionado) =>
          String(seleccionado?.idPerfil) === String(perfil?.idPerfil)
      );
    },
    seleccionar(perfil) {
      if (this.deshabilitado) return;

      const actuales = Array.isArray(this.modelValue) ? this.modelValue : [];
      const seleccionado = this.estaSeleccionado(perfil);
      const siguientes = seleccionado
        ? actuales.filter(
            (item) => String(item?.idPerfil) !== String(perfil?.idPerfil)
          )
        : [...actuales, perfil];

      this.$emit("update:modelValue", siguientes);
      this.$emit("seleccionados", siguientes);
    },
    programarBusqueda() {
      clearTimeout(this.temporalizador);
      this.temporalizador = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
    },
    paramsBase() {
      const params = {};
      if (this.idProfesion != null && this.idProfesion !== "") {
        params.idProfesion = this.idProfesion;
      }
      return params;
    },
    variantesDeTexto(texto) {
      const base = this.paramsBase();
      return ["nombreArtistico", "nombre", "apellido", "profesion"].map(
        (clave) => ({
          ...base,
          todos: true,
          [clave]: texto,
        })
      );
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

      return Array.from(vistos.values())
        .filter((perfil) => !this.estaExcluido(perfil))
        .sort((a, b) =>
          String(a?.nombreArtistico || "").localeCompare(
            String(b?.nombreArtistico || ""),
            "es",
            { sensitivity: "base" }
          )
        );
    },
    estaExcluido(perfil) {
      if (!perfil) return true;
      if (
        this.idUsuarioActual != null &&
        String(perfil.idUsuario) === String(this.idUsuarioActual)
      ) {
        return true;
      }
      return this.idsPerfilesExcluidos.has(String(perfil.idPerfil));
    },
    filtrarExcluidos(lista) {
      return (Array.isArray(lista) ? lista : []).filter(
        (perfil) => !this.estaExcluido(perfil)
      );
    },
    paginarCliente(listado, page) {
      const totalElementos = listado.length;
      const totalPaginas = Math.max(
        1,
        Math.ceil(totalElementos / TAMANO_PAGINA)
      );
      const pagina = Math.min(Math.max(page, 0), totalPaginas - 1);

      return {
        contenido: listado.slice(
          pagina * TAMANO_PAGINA,
          (pagina + 1) * TAMANO_PAGINA
        ),
        paginaActual: pagina,
        tamanoPagina: TAMANO_PAGINA,
        totalElementos,
        totalPaginas,
        primera: pagina === 0,
        ultima: pagina >= totalPaginas - 1,
      };
    },
    async buscar(page = 0) {
      const corrida = ++this.idCarga;
      this.abortar();
      controlador = new AbortController();
      const signal = controlador.signal;

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const texto = this.normalizarTexto(this.busqueda);

        if (!texto) {
          const response = await perfilService.buscar(
            {
              ...this.paramsBase(),
              page,
              size: TAMANO_PAGINA,
            },
            signal
          );
          if (corrida !== this.idCarga) return;

          const data = response?.data || {};
          this.perfiles = this.filtrarExcluidos(
            Array.isArray(data.contenido) ? data.contenido : []
          );
          this.paginacion = {
            paginaActual: Number(data.paginaActual) || 0,
            tamanoPagina: Number(data.tamanoPagina) || TAMANO_PAGINA,
            totalElementos: Number(data.totalElementos) || 0,
            totalPaginas: Number(data.totalPaginas) || 1,
            primera: data.primera !== false,
            ultima: data.ultima !== false,
          };
          return;
        }

        const variantes = this.variantesDeTexto(texto);
        const clave = JSON.stringify(variantes);
        let listado;

        if (this.claveResultados === clave) {
          listado = this.resultadosCombinados;
        } else {
          const respuestas = await Promise.all(
            variantes.map((params) => perfilService.buscar(params, signal))
          );
          if (corrida !== this.idCarga) return;

          listado = this.combinarResultados(respuestas);
          this.claveResultados = clave;
          this.resultadosCombinados = listado;
        }

        const pagina = this.paginarCliente(listado, page);
        this.perfiles = pagina.contenido;
        this.paginacion = {
          paginaActual: pagina.paginaActual,
          tamanoPagina: pagina.tamanoPagina,
          totalElementos: pagina.totalElementos,
          totalPaginas: pagina.totalPaginas,
          primera: pagina.primera,
          ultima: pagina.ultima,
        };
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      this.perfiles = [];
      this.error = "";
      this.puedeReintentar = false;

      if (status === 401) {
        this.error = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 403) {
        this.error =
          mensaje || "No tenés permiso para buscar perfiles.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.error = mensaje || "La búsqueda de perfiles ya no está disponible.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al buscar perfiles. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar los perfiles."
      );
    },
    abortar() {
      if (controlador) {
        controlador.abort();
        controlador = null;
      }
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
.buscador-perfil-invitacion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.buscador-perfil-invitacion__input {
  width: 100%;
}

.buscador-perfil-invitacion__filtro {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.3rem;
  margin: 0;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.72rem;
  font-weight: 600;
}

.buscador-perfil-invitacion__filtro .material-symbols-outlined {
  font-size: 0.9rem;
}

.buscador-perfil-invitacion__lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 390px;
  margin: 0;
  padding: 0 0.15rem 0 0;
  overflow-y: auto;
  list-style: none;
}

.buscador-perfil-invitacion__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.buscador-perfil-invitacion__item:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.buscador-perfil-invitacion__item--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.buscador-perfil-invitacion__item:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.buscador-perfil-invitacion__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-soft, var(--color-info-soft));
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
}

.buscador-perfil-invitacion__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.buscador-perfil-invitacion__datos {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.buscador-perfil-invitacion__nombre {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buscador-perfil-invitacion__meta {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buscador-perfil-invitacion__habilidades {
  overflow: hidden;
  color: var(--color-text-subtle);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buscador-perfil-invitacion__accion {
  padding: 0.32rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.buscador-perfil-invitacion__accion--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.buscador-perfil-invitacion__nota,
.buscador-perfil-invitacion__vacio {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 1.1rem 0.9rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.buscador-perfil-invitacion__vacio .material-symbols-outlined {
  font-size: 1.2rem;
}

.buscador-perfil-invitacion__reintento {
  display: flex;
  justify-content: flex-start;
}

.buscador-perfil-invitacion__paginacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.buscador-perfil-invitacion__pagina {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

@media (max-width: 560px) {
  .buscador-perfil-invitacion__item {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .buscador-perfil-invitacion__accion {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
