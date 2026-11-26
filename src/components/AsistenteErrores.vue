<template>
  <Teleport to="body">
    <div
      v-if="estado.abierto"
      class="asistente-error"
      role="presentation"
      @click.self="cerrar"
    >
      <aside
        ref="panel"
        class="asistente-error__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asistente-error-titulo"
      >
        <header class="asistente-error__header">
          <div>
            <p class="asistente-error__eyebrow">Ayuda contextual</p>
            <h2 id="asistente-error-titulo">¿Qué significa este error?</h2>
          </div>
          <button
            ref="cerrarBoton"
            type="button"
            class="asistente-error__cerrar"
            aria-label="Cerrar ayuda"
            @click="cerrar"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div class="asistente-error__mensaje">
          <p class="asistente-error__mensaje-texto">{{ estado.mensaje }}</p>
          <button
            type="button"
            class="asistente-error__copiar"
            @click="copiarMensaje"
          >
            {{ copiado ? "Copiado" : "Copiar mensaje" }}
          </button>
        </div>

        <section
          v-if="estado.coincidencias.length"
          class="asistente-error__resultados"
        >
          <article
            v-for="coincidencia in estado.coincidencias"
            :key="coincidencia.id"
            class="asistente-error__resultado"
          >
            <p class="asistente-error__contexto">
              {{ coincidencia.capituloTitulo }} · {{ coincidencia.seccion }}
            </p>
            <p v-if="coincidencia.causa">
              <strong>Por qué pasa:</strong> {{ coincidencia.causa }}
            </p>
            <p v-if="coincidencia.solucion">
              <strong>Qué hacer:</strong> {{ coincidencia.solucion }}
            </p>
            <RouterLink
              :to="enlaceManual(coincidencia)"
              class="asistente-error__enlace"
              @click="cerrar"
            >
              Ver en el manual
            </RouterLink>
          </article>
        </section>

        <p v-else class="asistente-error__vacio">
          No encontramos una explicación exacta para este mensaje. Podés
          buscarlo en el manual completo.
        </p>

        <footer class="asistente-error__footer">
          <RouterLink
            :to="{ name: rutaManual }"
            class="asistente-error__enlace"
            @click="cerrar"
          >
            Abrir el manual completo
          </RouterLink>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script>
import { errorAssistantState } from "../services/errorAssistantState";
import { cerrar as cerrarAsistente } from "../services/errorAssistantState";
import { esAdmin as esAdminSesion } from "../services/authState";

export default {
  name: "AsistenteErrores",
  data() {
    return {
      copiado: false,
      timerCopia: null,
    };
  },
  computed: {
    estado() {
      return errorAssistantState;
    },
    abierto() {
      return errorAssistantState.abierto;
    },
    esAdmin() {
      return esAdminSesion();
    },
    rutaManual() {
      return this.esAdmin ? "admin-manual" : "manual";
    },
    rutaCapitulo() {
      return this.esAdmin ? "admin-manual-capitulo" : "manual-capitulo";
    },
  },
  watch: {
    abierto(abierto) {
      if (abierto) {
        this.$nextTick(() => this.$refs.cerrarBoton?.focus());
      }
    },
  },
  mounted() {
    document.addEventListener("keydown", this.manejarTecla);
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.manejarTecla);
    if (this.timerCopia) clearTimeout(this.timerCopia);
  },
  methods: {
    cerrar() {
      cerrarAsistente();
      this.copiado = false;
    },
    enlaceManual(coincidencia) {
      return {
        name: this.rutaCapitulo,
        params: { id: coincidencia.capituloId },
        hash: `#${coincidencia.seccionId}`,
      };
    },
    async copiarMensaje() {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(this.estado.mensaje);
        } else {
          const area = document.createElement("textarea");
          area.value = this.estado.mensaje;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.opacity = "0";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          document.body.removeChild(area);
        }
        this.copiado = true;
        if (this.timerCopia) clearTimeout(this.timerCopia);
        this.timerCopia = setTimeout(() => {
          this.copiado = false;
        }, 2000);
      } catch {
        this.copiado = false;
      }
    },
    manejarTecla(event) {
      if (!this.abierto) return;

      if (event.key === "Escape") {
        event.preventDefault();
        this.cerrar();
        return;
      }

      if (event.key === "Tab") {
        const panel = this.$refs.panel;
        if (!panel) return;

        const focusables = panel.querySelectorAll(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === primero) {
          event.preventDefault();
          ultimo.focus();
        } else if (!event.shiftKey && document.activeElement === ultimo) {
          event.preventDefault();
          primero.focus();
        }
      }
    },
  },
};
</script>

<style scoped>
.asistente-error {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  background: rgba(20, 18, 30, 0.22);
  backdrop-filter: blur(1px);
}

.asistente-error__panel {
  display: flex;
  flex-direction: column;
  width: min(450px, 100%);
  height: 100%;
  padding: 1.2rem;
  overflow-y: auto;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: -20px 0 50px -30px var(--color-shadow);
  animation: asistente-entrar 0.2s ease-out;
}

@keyframes asistente-entrar {
  from {
    transform: translateX(24px);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.asistente-error__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.asistente-error__eyebrow {
  margin: 0 0 0.35rem;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.asistente-error__header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.asistente-error__cerrar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
}

.asistente-error__cerrar:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.asistente-error__mensaje {
  margin-top: 1rem;
  padding: 0.85rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 10px;
  background: var(--color-danger-soft);
}

.asistente-error__mensaje-texto {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.asistente-error__copiar {
  margin-top: 0.55rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-danger-text);
  font: inherit;
  font-size: 0.76rem;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
}

.asistente-error__resultados {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.asistente-error__resultado {
  padding: 0.85rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.asistente-error__contexto {
  margin: 0 0 0.5rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.asistente-error__resultado p {
  margin: 0.4rem 0;
  font-size: 0.86rem;
  line-height: 1.55;
}

.asistente-error__resultado strong {
  font-weight: 700;
}

.asistente-error__enlace {
  display: inline-block;
  margin-top: 0.4rem;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: underline;
}

.asistente-error__vacio {
  margin: 1rem 0;
  padding: 0.85rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.55;
}

.asistente-error__footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-soft);
}

@media (max-width: 560px) {
  .asistente-error {
    align-items: flex-end;
  }

  .asistente-error__panel {
    width: 100%;
    height: auto;
    max-height: 86vh;
    border-left: 0;
    border-top: 1px solid var(--color-border);
    border-radius: 16px 16px 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .asistente-error__panel {
    animation: none;
  }
}

@media print {
  .asistente-error {
    display: none !important;
  }
}
</style>
