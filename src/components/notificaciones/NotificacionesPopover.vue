<template>
  <div
    v-if="modelValue"
    class="notificaciones-popover"
    role="dialog"
    aria-label="Notificaciones"
    @click.stop
  >
    <header class="notificaciones-popover__cabecera">
      <div class="notificaciones-popover__encabezado">
        <h3 class="notificaciones-popover__titulo">Notificaciones</h3>
        <p class="notificaciones-popover__subtitulo">{{ resumenNoLeidas }}</p>
      </div>

      <button
        type="button"
        class="notificaciones-popover__accion"
        :disabled="marcandoTodas || !hayNoLeidas"
        @click="marcarTodas"
      >
        Marcar todas
      </button>
    </header>

    <div class="notificaciones-popover__cuerpo">
      <p v-if="errorAccion" class="notificaciones-popover__error-accion">
        {{ errorAccion }}
      </p>

      <div v-if="cargando" class="notificaciones-popover__esqueletos" aria-hidden="true">
        <div
          v-for="indice in 3"
          :key="indice"
          class="notificaciones-popover__esqueleto"
        >
          <span class="notificaciones-popover__esqueleto-icono"></span>
          <span class="notificaciones-popover__esqueleto-lineas">
            <span></span>
            <span></span>
          </span>
        </div>
      </div>

      <div v-else-if="error" class="notificaciones-popover__estado">
        <span class="material-symbols-outlined" aria-hidden="true">error</span>
        <p>{{ error }}</p>
        <button type="button" class="notificaciones-popover__reintentar" @click="cargar">
          Reintentar
        </button>
      </div>

      <div v-else-if="!notificaciones.length" class="notificaciones-popover__estado">
        <span class="material-symbols-outlined" aria-hidden="true">
          notifications_off
        </span>
        <p>No tenés notificaciones{{ idPerfilContexto ? " en este perfil" : "" }}.</p>
      </div>

      <ul v-else class="notificaciones-popover__lista">
        <NotificacionItem
          v-for="notificacion in notificaciones"
          :key="notificacion.idNotificacion"
          :notificacion="notificacion"
          :marcando="marcandoId === notificacion.idNotificacion"
          :activando="activandoId === notificacion.idNotificacion"
          @navegar="navegar"
          @marcar-leida="marcarLeida"
        />
      </ul>
    </div>

    <footer class="notificaciones-popover__pie">
      <button type="button" class="notificaciones-popover__ver-todas" @click="verTodas">
        Ver todas las notificaciones
      </button>
    </footer>
  </div>
</template>

<script>
import NotificacionItem from "./NotificacionItem.vue";
import notificacionService from "../../services/notificacionService";
import {
  state as notificacionState,
  cargarResumenPerfil,
  cargarResumenUsuario,
} from "../../services/notificacionState";
import { destinoNotificacion } from "../../utils/notificacionConstants.js";
import { navegarANotificacion } from "../../utils/notificacionNavegacion.js";

export default {
  name: "NotificacionesPopover",
  components: {
    NotificacionItem,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idPerfilContexto: {
      type: [Number, String],
      default: null,
    },
    rutaVerTodas: {
      type: Object,
      default: null,
    },
    limite: {
      type: Number,
      default: 6,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      notificaciones: [],
      cargando: false,
      error: null,
      errorAccion: null,
      marcandoTodas: false,
      marcandoId: null,
      activandoId: null,
    };
  },
  computed: {
    noLeidas() {
      return this.idPerfilContexto != null
        ? notificacionState.noLeidasPerfil
        : notificacionState.noLeidasUsuario;
    },
    hayNoLeidas() {
      return this.noLeidas > 0;
    },
    resumenNoLeidas() {
      if (this.noLeidas <= 0) return "Sin novedades";
      return this.noLeidas === 1 ? "1 sin leer" : `${this.noLeidas} sin leer`;
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(abierto) {
        if (abierto) this.alAbrir();
        else this.abortarSolicitud();
      },
    },
    idPerfilContexto() {
      if (this.modelValue) this.alAbrir();
    },
  },
  created() {
    // Fuera de `data` para no envolver el AbortController en el proxy reactivo.
    this.controladorSolicitud = null;
  },
  mounted() {
    window.addEventListener("keydown", this.alPresionarTecla);
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.alPresionarTecla);
    this.abortarSolicitud();
  },
  methods: {
    alAbrir() {
      this.errorAccion = null;
      void this.cargar();
      void this.cargarResumen();
    },
    async cargar() {
      this.abortarSolicitud();

      const controlador = new AbortController();
      this.controladorSolicitud = controlador;
      this.cargando = true;
      this.error = null;

      try {
        const response = await notificacionService.listar({
          idPerfilContexto: this.idPerfilContexto,
          page: 0,
          size: this.limite,
          signal: controlador.signal,
        });

        if (controlador.signal.aborted) return;

        this.notificaciones = (response?.data?.contenido || []).map(
          (notificacion) => ({
            ...notificacion,
            destino: destinoNotificacion(notificacion),
          })
        );
      } catch (error) {
        if (controlador.signal.aborted || error?.code === "ERR_CANCELED") {
          return;
        }
        this.notificaciones = [];
        this.error =
          error?.response?.data?.message ||
          "No se pudieron cargar las notificaciones.";
      } finally {
        if (this.controladorSolicitud === controlador) {
          this.controladorSolicitud = null;
          this.cargando = false;
        }
      }
    },
    async cargarResumen() {
      if (this.idPerfilContexto != null) {
        await cargarResumenPerfil(this.idPerfilContexto);
      } else {
        await cargarResumenUsuario();
      }
    },
    async marcarTodas() {
      if (this.marcandoTodas || !this.hayNoLeidas) return;

      this.marcandoTodas = true;
      this.errorAccion = null;
      try {
        await notificacionService.marcarTodas(this.idPerfilContexto);
        const ahora = new Date().toISOString();
        this.notificaciones.forEach((notificacion) => {
          notificacion.leida = true;
          notificacion.fechaLeida = notificacion.fechaLeida || ahora;
        });
        await this.cargarResumen();
      } catch (error) {
        this.errorAccion =
          error?.response?.data?.message ||
          "No se pudieron marcar las notificaciones.";
      } finally {
        this.marcandoTodas = false;
      }
    },
    async marcarLeida(notificacion) {
      if (!notificacion || notificacion.leida || this.marcandoId != null) return;

      this.marcandoId = notificacion.idNotificacion;
      try {
        const response = await notificacionService.marcarLeida(
          notificacion.idNotificacion
        );
        notificacion.leida = response?.data?.leida ?? true;
        notificacion.fechaLeida =
          response?.data?.fechaLeida || new Date().toISOString();
        await this.cargarResumen();
      } catch (error) {
        this.errorAccion =
          error?.response?.data?.message ||
          "No se pudo marcar la notificación como leída.";
      } finally {
        this.marcandoId = null;
      }
    },
    async navegar(notificacion) {
      if (!notificacion?.destino || this.activandoId != null) return;

      this.activandoId = notificacion.idNotificacion;
      this.errorAccion = null;

      const resultado = await navegarANotificacion(notificacion, this.$router);
      this.activandoId = null;

      if (!resultado.ok) {
        if (resultado.error) this.errorAccion = resultado.error;
        return;
      }

      if (!notificacion.leida) void this.marcarLeida(notificacion);
      this.cerrar();
    },
    verTodas() {
      this.cerrar();
      if (this.rutaVerTodas) this.$router.push(this.rutaVerTodas);
    },
    cerrar() {
      this.$emit("update:modelValue", false);
    },
    abortarSolicitud() {
      if (this.controladorSolicitud) {
        this.controladorSolicitud.abort();
        this.controladorSolicitud = null;
      }
      this.cargando = false;
    },
    alPresionarTecla(evento) {
      if (evento.key === "Escape" && this.modelValue) {
        evento.stopPropagation();
        this.cerrar();
      }
    },
  },
};
</script>

<style scoped>
.notificaciones-popover {
  position: absolute;
  z-index: 50;
  top: calc(100% + 0.45rem);
  right: 0;
  display: flex;
  flex-direction: column;
  width: min(420px, calc(100vw - 2rem));
  max-height: min(70vh, 520px);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 14px 34px var(--color-shadow);
}

.notificaciones-popover__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.notificaciones-popover__encabezado {
  min-width: 0;
}

.notificaciones-popover__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.notificaciones-popover__subtitulo {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.notificaciones-popover__accion {
  padding: 0.2rem 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.notificaciones-popover__accion:disabled {
  opacity: 0.45;
  cursor: default;
}

.notificaciones-popover__cuerpo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-strong) transparent;
}

.notificaciones-popover__cuerpo::-webkit-scrollbar {
  width: 6px;
}

.notificaciones-popover__cuerpo::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 999px;
}

.notificaciones-popover__lista {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notificaciones-popover__error-accion {
  margin: 0;
  padding: 0.55rem 1rem;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.72rem;
  line-height: 1.4;
}

.notificaciones-popover__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2rem 1.25rem;
  color: var(--color-text-muted);
  text-align: center;
}

.notificaciones-popover__estado .material-symbols-outlined {
  font-size: 1.6rem;
}

.notificaciones-popover__estado p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
}

.notificaciones-popover__reintentar {
  margin-top: 0.25rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.74rem;
  cursor: pointer;
}

.notificaciones-popover__reintentar:hover {
  background: var(--color-bg);
}

.notificaciones-popover__esqueletos {
  padding: 0.25rem 0;
}

.notificaciones-popover__esqueleto {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.notificaciones-popover__esqueleto-icono {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-skeleton);
  flex-shrink: 0;
}

.notificaciones-popover__esqueleto-lineas {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
  min-width: 0;
}

.notificaciones-popover__esqueleto-lineas span {
  height: 0.6rem;
  border-radius: 999px;
  background: var(--color-skeleton);
}

.notificaciones-popover__esqueleto-lineas span:first-child {
  width: 55%;
}

.notificaciones-popover__esqueleto-lineas span:last-child {
  width: 85%;
}

.notificaciones-popover__pie {
  flex-shrink: 0;
  padding: 0.65rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  text-align: center;
}

.notificaciones-popover__ver-todas {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.notificaciones-popover__ver-todas:hover {
  text-decoration: underline;
}

@media (max-width: 520px) {
  /* En pantallas angostas el topbar puede desbordar: el panel se fija al
     viewport como hoja inferior para que nunca quede recortado. */
  .notificaciones-popover {
    position: fixed;
    top: auto;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
    max-height: min(70vh, 560px);
    border-radius: 14px;
  }
}
</style>
