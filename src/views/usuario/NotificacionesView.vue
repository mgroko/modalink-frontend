<template>
  <div class="notificaciones-view">
    <header class="notificaciones-view__header">
      <div>
        <h2 class="notificaciones-view__title">{{ titulo }}</h2>
        <p class="notificaciones-view__subtitle">{{ subtitulo }}</p>
      </div>

      <div class="notificaciones-view__actions">
        <select
          v-if="!modoPerfil"
          v-model="filtroPerfil"
          class="notificaciones-view__select"
          @change="cargar"
        >
          <option :value="null">Todos los perfiles</option>
          <option
            v-for="perfil in perfiles"
            :key="perfil.idPerfil"
            :value="perfil.idPerfil"
          >
            {{ perfil.nombreArtistico }}
          </option>
        </select>

        <VaButton
          color="primary"
          size="small"
          :disabled="marcandoTodas || !hayNoLeidas"
          @click="marcarTodas"
        >
          Marcar todas como leídas
        </VaButton>
      </div>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="cargando" class="notificaciones-view__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando notificaciones...
    </div>

    <div v-else-if="!notificaciones.length" class="notificaciones-view__estado">
      <span class="material-symbols-outlined">notifications_off</span>
      No tenés notificaciones{{ modoPerfil ? " en este perfil" : "" }}.
    </div>

    <ul v-else class="notificaciones-view__lista">
      <li
        v-for="notificacion in notificaciones"
        :key="notificacion.idNotificacion"
        class="notificacion-card"
        :class="{ 'notificacion-card--no-leida': !notificacion.leida }"
      >
        <span class="notificacion-card__icono material-symbols-outlined">
          {{ iconoPorTipo(notificacion.tipo) }}
        </span>

        <div class="notificacion-card__contenido">
          <div class="notificacion-card__cabecera">
            <span class="notificacion-card__tipo">{{ etiquetaTipo(notificacion.tipo) }}</span>
            <span class="notificacion-card__fecha">{{ formatearFecha(notificacion.fechaGenerada) }}</span>
          </div>
          <p class="notificacion-card__mensaje">{{ notificacion.mensaje }}</p>

          <RouterLink
            v-if="!modoAdmin && notificacion.destino"
            :to="notificacion.destino.ruta"
            class="notificacion-card__enlace"
            @click="marcarLeidaAlNavegar(notificacion)"
          >
            {{ notificacion.destino.etiqueta }}
            <span class="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </RouterLink>

          <span
            v-if="!modoPerfil && notificacion.idPerfilContexto != null"
            class="notificacion-card__perfil"
          >
            {{ nombrePerfil(notificacion.idPerfilContexto) }}
          </span>
        </div>

        <button
          v-if="!notificacion.leida"
          class="notificacion-card__marcar"
          :disabled="marcandoId === notificacion.idNotificacion"
          @click="marcarLeida(notificacion)"
        >
          Marcar leída
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import perfilService from "../../services/perfilService";
import notificacionService from "../../services/notificacionService";
import { idPerfilActivo } from "../../services/authState";
import {
  cargarResumenPerfil,
  cargarResumenUsuario,
} from "../../services/notificacionState";
import {
  TIPOS_NOTIFICACION,
  destinoNotificacion,
} from "../../utils/notificacionConstants.js";

export default {
  name: "NotificacionesView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      notificaciones: [],
      perfiles: [],
      filtroPerfil: null,
      cargando: false,
      error: null,
      marcandoTodas: false,
      marcandoId: null,
    };
  },
  computed: {
    modoPerfil() {
      return this.$route.meta.soloPerfilActivo === true;
    },
    modoAdmin() {
      return this.$route.meta.requiereAdmin === true;
    },
    idPerfilContexto() {
      return this.modoPerfil ? idPerfilActivo() : this.filtroPerfil;
    },
    titulo() {
      return this.modoPerfil ? "Notificaciones del perfil" : "Notificaciones";
    },
    subtitulo() {
      return this.modoPerfil
        ? "Actividad reciente del perfil activo."
        : "Todas las notificaciones de tu cuenta. Podés filtrar por perfil.";
    },
    hayNoLeidas() {
      return this.notificaciones.some((notificacion) => !notificacion.leida);
    },
  },
  watch: {
    "$route.name"() {
      this.cargar();
      this.cargarResumen();
    },
  },
  mounted() {
    this.cargarPerfiles();
    this.cargar();
    this.cargarResumen();
  },
  methods: {
    async cargarPerfiles() {
      try {
        const response = await perfilService.listarMisPerfiles();
        this.perfiles = response?.data || [];
      } catch {
        this.perfiles = [];
      }
    },
    async cargar() {
      if (this.modoPerfil && this.idPerfilContexto == null) return;

      this.cargando = true;
      this.error = null;

      try {
        const response = await notificacionService.listar({
          idPerfilContexto: this.idPerfilContexto,
          page: 0,
          size: 100,
        });
        this.notificaciones = (response?.data?.contenido || []).map(
          (notificacion) => ({
            ...notificacion,
            destino: destinoNotificacion(notificacion),
          })
        );
      } catch (error) {
        this.notificaciones = [];
        this.error = error?.response?.data?.message || "No se pudieron cargar las notificaciones.";
      } finally {
        this.cargando = false;
      }
    },
    async cargarResumen() {
      if (this.modoPerfil) {
        await cargarResumenPerfil(this.idPerfilContexto);
      } else {
        await cargarResumenUsuario();
      }
    },
    async marcarLeida(notificacion) {
      if (notificacion.leida || this.marcandoId != null) return;

      this.marcandoId = notificacion.idNotificacion;
      try {
        const response = await notificacionService.marcarLeida(notificacion.idNotificacion);
        notificacion.leida = true;
        notificacion.fechaLeida = response?.data?.fechaLeida || new Date().toISOString();
        await this.cargarResumen();
      } catch (error) {
        this.error = error?.response?.data?.message || "No se pudo marcar la notificación.";
      } finally {
        this.marcandoId = null;
      }
    },
    marcarLeidaAlNavegar(notificacion) {
      if (!notificacion.leida) {
        // No bloquear la navegación: si el PATCH falla, se navega igual.
        void this.marcarLeida(notificacion);
      }
    },
    async marcarTodas() {
      if (this.marcandoTodas) return;

      this.marcandoTodas = true;
      this.error = null;
      try {
        await notificacionService.marcarTodas(this.idPerfilContexto);
        const ahora = new Date().toISOString();
        this.notificaciones.forEach((notificacion) => {
          notificacion.leida = true;
          notificacion.fechaLeida = notificacion.fechaLeida || ahora;
        });
        await this.cargarResumen();
      } catch (error) {
        this.error = error?.response?.data?.message || "No se pudieron marcar las notificaciones.";
      } finally {
        this.marcandoTodas = false;
      }
    },
    etiquetaTipo(tipo) {
      const etiquetas = {
        [TIPOS_NOTIFICACION.POSTULACION_RECIBIDA]: "Postulación recibida",
        [TIPOS_NOTIFICACION.POSTULACION_ACEPTADA]: "Postulación aceptada",
        [TIPOS_NOTIFICACION.POSTULACION_RECHAZADA]: "Postulación rechazada",
        [TIPOS_NOTIFICACION.PROYECTO_CANCELADO]: "Proyecto cancelado",
        INVITACION_RECHAZADA: "Invitación rechazada",
        HITO_CUMPLIDO: "Hito cumplido",
        ACTIVIDAD_ASIGNADA: "Actividad asignada",
      };
      return etiquetas[tipo] || String(tipo || "").replaceAll("_", " ");
    },
    iconoPorTipo(tipo) {
      const iconos = {
        [TIPOS_NOTIFICACION.POSTULACION_RECIBIDA]: "person_add",
        [TIPOS_NOTIFICACION.POSTULACION_ACEPTADA]: "how_to_reg",
        [TIPOS_NOTIFICACION.POSTULACION_RECHAZADA]: "person_remove",
        [TIPOS_NOTIFICACION.PROYECTO_CANCELADO]: "cancel",
        INVITACION_RECHAZADA: "mail_off",
        HITO_CUMPLIDO: "flag",
        ACTIVIDAD_ASIGNADA: "assignment",
      };
      return iconos[tipo] || "notifications";
    },
    nombrePerfil(idPerfil) {
      return this.perfiles.find((perfil) => perfil.idPerfil === idPerfil)?.nombreArtistico || "Perfil";
    },
    formatearFecha(fecha) {
      if (!fecha) return "";
      const valor = new Date(fecha);
      if (Number.isNaN(valor.getTime())) return "";
      return valor.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped>
.notificaciones-view {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.notificaciones-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.notificaciones-view__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 700;
}

.notificaciones-view__subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.notificaciones-view__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.notificaciones-view__actions :deep(.va-button) {
  opacity: 0.8;
}

.notificaciones-view__select {
  min-width: 180px;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
}

.notificaciones-view__estado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
}

.notificaciones-view__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.notificacion-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.notificacion-card--no-leida {
  border-left: 3px solid var(--color-primary);
  background: var(--color-info-soft);
}

.notificacion-card__icono {
  color: var(--color-secondary);
  font-size: 1.3rem;
  margin-top: 0.1rem;
}

.notificacion-card__contenido {
  flex: 1;
  min-width: 0;
}

.notificacion-card__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.notificacion-card__tipo {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
}

.notificacion-card__fecha {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.notificacion-card__mensaje {
  margin: 0.3rem 0 0;
  font-size: 0.88rem;
  line-height: 1.4;
}

.notificacion-card__enlace {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-top: 0.35rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
}

.notificacion-card__enlace:hover {
  text-decoration: underline;
}

.notificacion-card__enlace .material-symbols-outlined {
  font-size: 0.95rem;
}

.notificacion-card__perfil {
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.notificacion-card__marcar {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  padding: 0.2rem 0;
}

.notificacion-card__marcar:disabled {
  opacity: 0.5;
  cursor: default;
}

@media (max-width: 720px) {
  .notificaciones-view__header {
    flex-direction: column;
  }

  .notificacion-card__cabecera {
    flex-direction: column;
    gap: 0.15rem;
  }
}
</style>
