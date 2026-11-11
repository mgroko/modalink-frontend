<template>
  <section id="comentarios" class="publicacion-comentarios">
    <div
      v-if="cargando"
      class="publicacion-comentarios__estado"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando comentarios...
    </div>

    <div
      v-else-if="error"
      class="publicacion-comentarios__estado publicacion-comentarios__estado--error"
    >
      <p>{{ error }}</p>
      <VaButton preset="secondary" size="small" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <template v-else>
      <p v-if="!comentarios.length" class="publicacion-comentarios__vacio">
        Todavía no hay comentarios. Sé el primero en comentar.
      </p>

      <ul v-else class="publicacion-comentarios__lista">
        <li
          v-for="comentario in comentarios"
          :key="comentario.idComentario"
          class="publicacion-comentarios__item"
        >
          <span class="publicacion-comentarios__avatar" aria-hidden="true">
            <img
              v-if="fotoAutor(comentario)"
              :src="fotoAutor(comentario)"
              :alt="nombreAutor(comentario)"
            />
            <template v-else>{{ inicialesAutor(comentario) }}</template>
          </span>

          <div class="publicacion-comentarios__cuerpo">
            <div class="publicacion-comentarios__cabecera">
              <strong class="publicacion-comentarios__nombre">
                {{ nombreAutor(comentario) }}
              </strong>
              <span
                v-if="esPropio(comentario)"
                class="publicacion-comentarios__vos"
              >
                (vos)
              </span>
              <span class="publicacion-comentarios__fecha">
                {{ fechaComentario(comentario) }}
              </span>
            </div>
            <p class="publicacion-comentarios__texto">{{ comentario.texto }}</p>
          </div>
        </li>
      </ul>

      <div v-if="!ultima" class="publicacion-comentarios__mas">
        <VaButton
          preset="secondary"
          size="small"
          :loading="cargandoMas"
          :disabled="cargandoMas"
          @click="cargarMas"
        >
          Cargar más comentarios
        </VaButton>
      </div>

      <p v-if="errorEnvio" class="publicacion-comentarios__error" role="alert">
        {{ errorEnvio }}
      </p>

      <form class="publicacion-comentarios__form" @submit.prevent="enviar">
        <span class="publicacion-comentarios__avatar" aria-hidden="true">
          {{ inicialesPerfilActivo }}
        </span>

        <div class="publicacion-comentarios__campo">
          <textarea
            ref="textarea"
            v-model="texto"
            class="publicacion-comentarios__input"
            :maxlength="limite"
            :disabled="enviando"
            rows="1"
            placeholder="Escribí un comentario..."
            aria-label="Escribir un comentario"
            @input="errorEnvio = ''"
            @keydown.ctrl.enter.prevent="enviar"
            @keydown.meta.enter.prevent="enviar"
          ></textarea>
          <span class="publicacion-comentarios__contador">
            {{ texto.length }}/{{ limite }}
          </span>
        </div>

        <button
          type="submit"
          class="publicacion-comentarios__enviar"
          :disabled="!puedeEnviar"
          aria-label="Enviar comentario"
          title="Enviar comentario"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </form>
    </template>
  </section>
</template>

<script>
import publicacionService from "../../services/publicacionService";
import {
  fijarCantidadComentarios,
  incrementarComentarios,
} from "../../services/publicacionInteraccionState";
import { idPerfilActivo, state as authState } from "../../services/authState";
import {
  clasificarErrorPublicacion,
  mensajeErrorApi,
  mensajeErrorComentario,
} from "../../utils/apiError";
import { formatearTiempoRelativo } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  LIMITES_PUBLICACION,
  esComentarioPropio,
  fusionarComentarios,
  normalizarComentario,
  normalizarPaginaComentarios,
  textoComentarioValido,
} from "../../utils/publicacionConstants.js";

const TAMANO_PAGINA = 10;

export default {
  name: "PublicacionComentarios",
  props: {
    idPublicacion: {
      type: [Number, String],
      default: null,
    },
    publicacion: {
      type: Object,
      default: null,
    },
    enfocarAlMontar: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "no-disponible",
    "sin-perfil",
    "perfil-inactivo",
    "comentario-creado",
  ],
  data() {
    return {
      comentarios: [],
      cargando: true,
      cargandoMas: false,
      error: "",
      errorEnvio: "",
      enviando: false,
      texto: "",
      pagina: 0,
      totalPaginas: 0,
      ultima: true,
      total: 0,
      controlador: null,
    };
  },
  computed: {
    limite() {
      return LIMITES_PUBLICACION.COMENTARIO;
    },
    puedeEnviar() {
      return !this.enviando && textoComentarioValido(this.texto);
    },
    nombrePerfilActivo() {
      return authState.usuario?.nombreArtisticoActivo || "Perfil";
    },
    inicialesPerfilActivo() {
      return this.inicialesDe(this.nombrePerfilActivo);
    },
    idPerfilActivoActual() {
      return idPerfilActivo();
    },
  },
  watch: {
    idPublicacion: {
      immediate: true,
      handler() {
        this.reiniciarYcargar();
      },
    },
    idPerfilActivoActual() {
      // Los comentarios visibles y el marcador (vos) dependen del perfil.
      this.reiniciarYcargar();
    },
    enfocarAlMontar(activo) {
      if (activo) this.enfocarComposer();
    },
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
    reiniciarYcargar() {
      this.abortar();
      this.comentarios = [];
      this.pagina = 0;
      this.totalPaginas = 0;
      this.ultima = true;
      this.total = 0;
      this.error = "";
      this.errorEnvio = "";
      this.texto = "";
      this.enviando = false;
      if (this.idPublicacion == null || this.idPublicacion === "") {
        this.cargando = false;
        return;
      }
      this.cargar(0, false);
    },
    async cargar(pagina = 0, append = false) {
      if (this.idPublicacion == null || this.idPublicacion === "") return;

      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;

      if (append) this.cargandoMas = true;
      else this.cargando = true;
      this.error = "";

      try {
        const response = await publicacionService.listarComentarios(
          this.idPublicacion,
          { page: pagina, size: TAMANO_PAGINA },
          controller.signal
        );
        if (this.controlador !== controller) return;

        const data = normalizarPaginaComentarios(response?.data);
        this.comentarios = append
          ? fusionarComentarios(this.comentarios, data.contenido)
          : data.contenido;
        this.pagina = data.paginaActual;
        this.totalPaginas = data.totalPaginas;
        this.ultima = data.ultima;
        this.total = data.totalElementos;
        if (!append) {
          fijarCantidadComentarios(
            this.idPublicacion,
            data.totalElementos,
            this.publicacion
          );
        }
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        const tipo = clasificarErrorPublicacion(error);
        if (tipo === "PUBLICACION_NO_DISPONIBLE") {
          this.error =
            error?.response?.data?.message ||
            "La publicación ya no está disponible.";
          this.$emit("no-disponible", this.publicacion);
          return;
        }
        if (tipo === "SIN_PERFIL") {
          this.error =
            error?.response?.data?.message ||
            "Seleccioná un perfil para ver los comentarios.";
          this.$emit("sin-perfil", this.publicacion);
          return;
        }
        if (tipo === "PERFIL_INACTIVO") {
          this.error =
            error?.response?.data?.message ||
            "El perfil activo no se encuentra disponible.";
          this.$emit("perfil-inactivo", this.publicacion);
          return;
        }

        this.error = mensajeErrorApi(
          error,
          "No se pudieron cargar los comentarios."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.cargandoMas = false;
          this.controlador = null;
          if (!append && this.enfocarAlMontar) this.enfocarComposer();
        }
      }
    },
    reintentar() {
      this.cargar(0, false);
    },
    cargarMas() {
      if (this.cargando || this.cargandoMas || this.ultima) return;
      this.cargar(this.pagina + 1, true);
    },
    async enviar() {
      if (this.enviando) return;

      const limpio = String(this.texto || "").trim();
      if (!textoComentarioValido(limpio)) {
        this.errorEnvio =
          "Escribí un comentario de hasta 1000 caracteres.";
        return;
      }

      this.enviando = true;
      this.errorEnvio = "";
      const idPublicacion = this.idPublicacion;
      const perfilSolicitud = idPerfilActivo();

      try {
        const response = await publicacionService.crearComentario(
          idPublicacion,
          { texto: limpio }
        );
        if (
          String(this.idPublicacion) !== String(idPublicacion) ||
          String(idPerfilActivo()) !== String(perfilSolicitud)
        ) {
          return;
        }

        const nuevo = normalizarComentario(response?.data);
        if (nuevo) {
          this.total = incrementarComentarios(
            idPublicacion,
            1,
            this.publicacion
          );
          this.$emit("comentario-creado", nuevo);

          if (this.ultima) {
            this.comentarios = fusionarComentarios(this.comentarios, [nuevo]);
          } else {
            // Si el usuario está viendo un tramo anterior, el comentario nuevo
            // pertenece a la última página. Se recarga esa página.
            await this.cargar(
              Math.max(0, this.totalPaginas - 1),
              false
            );
          }
        }
        // Sólo se limpia después de un 201 exitoso.
        this.texto = "";
        this.errorEnvio = "";
      } catch (error) {
        if (String(idPerfilActivo()) !== String(perfilSolicitud)) {
          return;
        }

        const tipo = clasificarErrorPublicacion(error);
        if (tipo === "PUBLICACION_NO_DISPONIBLE") {
          this.$emit("no-disponible", this.publicacion);
        } else if (tipo === "SIN_PERFIL") {
          this.$emit("sin-perfil", this.publicacion);
        } else if (tipo === "PERFIL_INACTIVO") {
          this.$emit("perfil-inactivo", this.publicacion);
        }

        // El texto se conserva ante cualquier error.
        this.errorEnvio = mensajeErrorComentario(
          error,
          "No se pudo enviar el comentario."
        );
      } finally {
        this.enviando = false;
      }
    },
    enfocarComposer() {
      this.$nextTick(() => {
        const campo = this.$refs.textarea;
        if (campo) campo.focus();
      });
    },
    esPropio(comentario) {
      return esComentarioPropio(comentario, idPerfilActivo());
    },
    nombreAutor(comentario) {
      return (
        comentario?.autor?.nombreArtistico ||
        comentario?.autor?.nombre ||
        "Perfil"
      );
    },
    fotoAutor(comentario) {
      return resolverFotoUrl(comentario?.autor?.fotoUrl);
    },
    inicialesAutor(comentario) {
      return this.inicialesDe(this.nombreAutor(comentario));
    },
    inicialesDe(nombre) {
      return String(nombre || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
    },
    fechaComentario(comentario) {
      return formatearTiempoRelativo(comentario?.fechaComentario);
    },
  },
};
</script>

<style scoped>
.publicacion-comentarios {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 0;
}

.publicacion-comentarios__estado,
.publicacion-comentarios__vacio {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 1.2rem 0.75rem;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  text-align: center;
}

.publicacion-comentarios__estado--error {
  flex-direction: column;
  color: var(--color-danger-text);
}

.publicacion-comentarios__estado--error p {
  margin: 0;
}

.publicacion-comentarios__lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.publicacion-comentarios__item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.publicacion-comentarios__avatar {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 2rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.6rem;
  font-weight: 700;
}

.publicacion-comentarios__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.publicacion-comentarios__cuerpo {
  min-width: 0;
}

.publicacion-comentarios__cabecera {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem 0.4rem;
}

.publicacion-comentarios__nombre {
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
}

.publicacion-comentarios__vos,
.publicacion-comentarios__fecha {
  color: var(--color-text-subtle);
  font-size: 0.7rem;
}

.publicacion-comentarios__texto {
  margin: 0.15rem 0 0;
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.publicacion-comentarios__mas {
  display: flex;
  justify-content: center;
}

.publicacion-comentarios__form {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  padding-top: 0.65rem;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--color-surface);
}

.publicacion-comentarios__campo {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.publicacion-comentarios__input {
  display: block;
  width: 100%;
  min-height: 2.6rem;
  max-height: 7rem;
  padding: 0.7rem 3.4rem 0.7rem 0.9rem;
  color: var(--color-text);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 999px;
  font: inherit;
  font-size: 0.84rem;
  line-height: 1.4;
  resize: vertical;
}

.publicacion-comentarios__input:focus {
  border-color: var(--color-primary-light);
  outline: none;
}

.publicacion-comentarios__contador {
  position: absolute;
  right: 0.85rem;
  bottom: 0.75rem;
  color: var(--color-text-subtle);
  font-size: 0.65rem;
  pointer-events: none;
}

.publicacion-comentarios__enviar {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  flex: 0 0 2.6rem;
  padding: 0;
  place-items: center;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.publicacion-comentarios__enviar:hover:not(:disabled),
.publicacion-comentarios__enviar:focus-visible:not(:disabled) {
  filter: brightness(1.08);
  outline: 2px solid var(--color-primary-light);
  outline-offset: 2px;
}

.publicacion-comentarios__enviar:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.publicacion-comentarios__enviar .material-symbols-outlined {
  font-size: 1.15rem;
}

.publicacion-comentarios__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}
</style>
