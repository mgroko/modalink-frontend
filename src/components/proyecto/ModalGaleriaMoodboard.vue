<template>
  <Teleport to="body">
    <Transition name="galeria-moodboard">
      <div
        v-if="abierta"
        ref="overlay"
        class="galeria-moodboard"
        role="dialog"
        aria-modal="true"
        aria-label="Moodboard ampliado"
        tabindex="-1"
      >
        <header class="galeria-moodboard__barra">
          <div class="galeria-moodboard__barra-izq">
            <h2 class="galeria-moodboard__titulo">Moodboard</h2>
            <span class="galeria-moodboard__contador">
              Imagen {{ indiceActual + 1 }} de {{ total }}
            </span>
          </div>

          <div class="galeria-moodboard__barra-der">
            <button
              type="button"
              class="galeria-moodboard__boton"
              :disabled="descargando"
              @click="descargarImagen"
            >
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              <span>{{ descargando ? "Descargando…" : "Descargar" }}</span>
            </button>
            <button
              type="button"
              class="galeria-moodboard__boton"
              @click="cerrar"
            >
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
              <span>Cerrar</span>
            </button>
          </div>
        </header>

        <div v-if="imagenActual" class="galeria-moodboard__escenario">
          <button
            v-if="tieneVarias"
            type="button"
            class="galeria-moodboard__flecha galeria-moodboard__flecha--izq"
            aria-label="Imagen anterior"
            @click="anterior"
          >
            <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>

          <figure class="galeria-moodboard__figura">
            <img
              class="galeria-moodboard__imagen"
              :src="imagenActual.preview"
              :alt="imagenActual.nombre"
            />
            <figcaption class="galeria-moodboard__pie">
              <span class="galeria-moodboard__pie-nombre">{{ imagenActual.nombre }}</span>
              <span class="galeria-moodboard__pie-ayuda">
                <span aria-hidden="true">← →</span> para navegar
                <span class="galeria-moodboard__pie-separador" aria-hidden="true">·</span>
                <span aria-hidden="true">Esc</span> para cerrar
              </span>
            </figcaption>
          </figure>

          <button
            v-if="tieneVarias"
            type="button"
            class="galeria-moodboard__flecha galeria-moodboard__flecha--der"
            aria-label="Imagen siguiente"
            @click="siguiente"
          >
            <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
        </div>

        <footer v-if="tieneVarias" class="galeria-moodboard__tiras">
          <div class="galeria-moodboard__miniaturas">
            <button
              v-for="(imagen, i) in imagenes"
              :key="imagen.id"
              type="button"
              class="galeria-moodboard__miniatura"
              :class="{ 'galeria-moodboard__miniatura--activa': i === indiceActual }"
              :aria-label="`Ver ${imagen.nombre}`"
              :aria-current="i === indiceActual ? 'true' : undefined"
              @click="irA(i)"
            >
              <img :src="imagen.preview" :alt="imagen.nombre" />
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
/*
 * Vista ampliada del moodboard: lightbox a pantalla completa con navegación
 * por flechas/teclado, miniaturas y descarga de la imagen actual.
 * Sólo lee `imagenes` (items con `preview`); abrir/cerrar lo controla el padre
 * con v-model, que puede indicar en qué imagen iniciar con `indiceInicial`.
 */
export default {
  name: "ModalGaleriaMoodboard",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    imagenes: {
      type: Array,
      default: () => [],
    },
    indiceInicial: {
      type: Number,
      default: 0,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      indiceActual: 0,
      descargando: false,
      overflowPrevio: "",
      scrollBloqueado: false,
      elementoPrevio: null,
    };
  },
  computed: {
    abierta() {
      return this.modelValue && this.imagenes.length > 0;
    },
    total() {
      return this.imagenes.length;
    },
    tieneVarias() {
      return this.total > 1;
    },
    imagenActual() {
      return this.imagenes[this.indiceActual] || null;
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) this.abrir();
      else this.limpiar();
    },
    imagenes: {
      handler() {
        if (!this.modelValue) return;
        this.indiceActual = Math.min(
          this.indiceActual,
          Math.max(this.total - 1, 0)
        );
        if (this.total === 0) this.cerrar();
      },
      deep: false,
    },
  },
  mounted() {
    if (this.modelValue) this.abrir();
  },
  beforeUnmount() {
    this.limpiar();
  },
  methods: {
    abrir() {
      if (this.imagenes.length === 0) return;
      const inicial = Number.isInteger(this.indiceInicial) ? this.indiceInicial : 0;
      this.indiceActual = Math.min(Math.max(inicial, 0), this.imagenes.length - 1);

      this.elementoPrevio = document.activeElement;
      if (!this.scrollBloqueado) {
        this.overflowPrevio = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        this.scrollBloqueado = true;
      }
      window.addEventListener("keydown", this.alPresionarTecla);

      this.$nextTick(() => {
        this.$refs.overlay?.focus();
      });
    },
    limpiar() {
      if (this.scrollBloqueado) {
        document.body.style.overflow = this.overflowPrevio || "";
        this.scrollBloqueado = false;
      }
      window.removeEventListener("keydown", this.alPresionarTecla);

      if (
        this.elementoPrevio &&
        typeof this.elementoPrevio.focus === "function" &&
        document.contains(this.elementoPrevio)
      ) {
        this.elementoPrevio.focus();
      }
      this.elementoPrevio = null;
    },
    cerrar() {
      this.$emit("update:modelValue", false);
    },
    irA(indice) {
      if (!this.total) return;
      this.indiceActual = ((indice % this.total) + this.total) % this.total;
    },
    anterior() {
      this.irA(this.indiceActual - 1);
    },
    siguiente() {
      this.irA(this.indiceActual + 1);
    },
    alPresionarTecla(evento) {
      if (evento.altKey || evento.ctrlKey || evento.metaKey) return;

      if (evento.key === "Escape") {
        evento.preventDefault();
        this.cerrar();
        return;
      }
      if (!this.tieneVarias) return;

      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        this.anterior();
      } else if (evento.key === "ArrowRight") {
        evento.preventDefault();
        this.siguiente();
      }
    },
    nombreDescarga(tipoMime = "") {
      const imagen = this.imagenActual;
      const base = `moodboard-imagen-${this.indiceActual + 1}`;
      const extension =
        this.extensionDe(imagen?.archivo?.name) ||
        this.extensionDe(imagen?.preview) ||
        { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[
          tipoMime
        ] ||
        "jpg";
      return `${base}.${extension}`;
    },
    extensionDe(valor) {
      const coincidencia = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(String(valor || ""));
      return coincidencia ? coincidencia[1].toLowerCase() : "";
    },
    async descargarImagen() {
      const imagen = this.imagenActual;
      if (!imagen?.preview || this.descargando) return;

      this.descargando = true;
      try {
        const respuesta = await fetch(imagen.preview);
        if (!respuesta.ok) throw new Error("No se pudo descargar la imagen");

        const blob = await respuesta.blob();
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = this.nombreDescarga(blob.type);
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        // Sin CORS o sin blob disponible: se abre la imagen en otra pestaña.
        window.open(imagen.preview, "_blank", "noopener");
      } finally {
        this.descargando = false;
      }
    },
  },
};
</script>

<style scoped>
.galeria-moodboard {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  flex-direction: column;
  background: #08080c;
  color: #f5f4f8;
  outline: none;
}

/* ── Barra superior ── */
.galeria-moodboard__barra {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.galeria-moodboard__barra-izq,
.galeria-moodboard__barra-der {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.galeria-moodboard__titulo {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #f7f6fb;
}

.galeria-moodboard__contador {
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  background: #1b1a25;
  color: #a9a7b8;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.galeria-moodboard__boton {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 10px;
  background: #17161f;
  color: #f0eff6;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.galeria-moodboard__boton:hover:not(:disabled) {
  background: #232130;
  border-color: rgba(255, 255, 255, 0.16);
}

.galeria-moodboard__boton:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.galeria-moodboard__boton:disabled {
  opacity: 0.6;
  cursor: progress;
}

.galeria-moodboard__boton .material-symbols-outlined {
  font-size: 1.15rem;
}

/* ── Imagen central ── */
.galeria-moodboard__escenario {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  gap: clamp(0.75rem, 3.5vw, 3rem);
  min-height: 0;
  padding: 1.5rem clamp(1rem, 3vw, 2.5rem) 0.75rem;
}

.galeria-moodboard__figura {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  width: 100%;
  max-width: 1000px;
  height: 100%;
  margin: 0;
}

.galeria-moodboard__imagen {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  border-radius: 12px;
  object-fit: contain;
  background: transparent;
}

.galeria-moodboard__pie {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  font-size: 0.8rem;
  color: #8f8d9e;
}

.galeria-moodboard__pie-nombre {
  color: #c9c7d6;
  font-weight: 500;
}

.galeria-moodboard__pie-ayuda {
  white-space: nowrap;
}

.galeria-moodboard__pie-separador {
  margin: 0 0.35rem;
}

.galeria-moodboard__flecha {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  background: #14131c;
  color: #f0eff6;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.galeria-moodboard__flecha:hover {
  background: #232130;
  border-color: rgba(255, 255, 255, 0.22);
}

.galeria-moodboard__flecha:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.galeria-moodboard__flecha .material-symbols-outlined {
  font-size: 1.4rem;
}

/* ── Miniaturas ── */
.galeria-moodboard__tiras {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 1.1rem 1.75rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  overflow-x: auto;
}

.galeria-moodboard__miniaturas {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 auto;
}

.galeria-moodboard__miniatura {
  flex: 0 0 auto;
  width: 104px;
  height: 82px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #14131c;
  cursor: pointer;
  overflow: hidden;
  opacity: 0.55;
  transition: opacity 0.15s ease, border-color 0.15s ease;
}

.galeria-moodboard__miniatura img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.galeria-moodboard__miniatura:hover {
  opacity: 0.85;
}

.galeria-moodboard__miniatura--activa {
  border-color: #ffffff;
  opacity: 1;
}

.galeria-moodboard__miniatura:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
  opacity: 1;
}

/* ── Transición ── */
.galeria-moodboard-enter-active,
.galeria-moodboard-leave-active {
  transition: opacity 0.18s ease;
}

.galeria-moodboard-enter-active .galeria-moodboard__figura,
.galeria-moodboard-leave-active .galeria-moodboard__figura {
  transition: transform 0.18s ease;
}

.galeria-moodboard-enter-from,
.galeria-moodboard-leave-to {
  opacity: 0;
}

.galeria-moodboard-enter-from .galeria-moodboard__figura,
.galeria-moodboard-leave-to .galeria-moodboard__figura {
  transform: scale(0.985);
}

@media (max-width: 720px) {
  .galeria-moodboard__barra {
    padding: 0.75rem 1rem;
  }

  .galeria-moodboard__titulo {
    font-size: 1.05rem;
  }

  .galeria-moodboard__boton span:not(.material-symbols-outlined) {
    display: none;
  }

  .galeria-moodboard__escenario {
    gap: 0.5rem;
    padding: 1rem 0.75rem 0.5rem;
  }

  .galeria-moodboard__flecha {
    width: 38px;
    height: 38px;
  }

  .galeria-moodboard__pie-ayuda {
    display: none;
  }

  .galeria-moodboard__tiras {
    padding: 0.85rem 1rem 1rem;
  }

  .galeria-moodboard__miniaturas {
    margin: 0;
  }

  .galeria-moodboard__miniatura {
    width: 84px;
    height: 66px;
  }
}
</style>
