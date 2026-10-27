<template>
  <section class="actividades-postulables">
    <header class="actividades-postulables__cabecera">
      <div>
        <h2 class="actividades-postulables__titulo">Actividades abiertas</h2>
        <p class="actividades-postulables__subtitulo">
          Postulate a los requerimientos de las actividades pendientes del
          proyecto.
        </p>
      </div>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="actividades-postulables__reintento">
      <VaButton preset="primary" @click="cargar">Reintentar</VaButton>
    </div>

    <div v-if="cargando" class="actividades-postulables__cargando">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando actividades...
    </div>

    <p
      v-else-if="!error && !actividadesConRequerimientos.length"
      class="actividades-postulables__vacio"
    >
      No hay actividades pendientes con requerimientos para postularse.
    </p>

    <div v-else-if="!error" class="actividades-postulables__lista">
      <article
        v-for="actividad in actividadesConRequerimientos"
        :key="actividad.idActividad"
        class="actividad-postulable"
      >
        <header class="actividad-postulable__cabecera">
          <div class="actividad-postulable__titulo-grupo">
            <h3 class="actividad-postulable__titulo">{{ actividad.nombre }}</h3>
            <span
              class="actividad-postulable__estado"
              :style="estiloEstado(actividad.estado)"
            >
              {{ etiquetaEstadoActividad(actividad.estado) }}
            </span>
          </div>

          <p v-if="actividad.descripcion" class="actividad-postulable__descripcion">
            {{ actividad.descripcion }}
          </p>

          <div class="actividad-postulable__meta">
            <span class="actividad-postulable__meta-item">
              <span class="material-symbols-outlined" aria-hidden="true">
                schedule
              </span>
              {{ formatearDuracionMinutos(actividad.duracionMinutos) }}
            </span>
            <span class="actividad-postulable__meta-item">
              <span class="material-symbols-outlined" aria-hidden="true">
                event
              </span>
              {{ rangoFechas(actividad) }}
            </span>
          </div>
        </header>

        <div class="actividad-postulable__requerimientos">
          <div
            v-for="requerimiento in actividad.requerimientos"
            :key="requerimiento.idRequerimiento"
            class="requerimiento-postulable"
          >
            <div class="requerimiento-postulable__datos">
              <p class="requerimiento-postulable__profesion">
                {{ requerimiento.cantidad }} × {{ requerimiento.nombreProfesion }}
              </p>
              <p
                v-if="requerimiento.descripcion"
                class="requerimiento-postulable__descripcion"
              >
                {{ requerimiento.descripcion }}
              </p>
            </div>

            <VaButton
              v-if="puedePostular"
              preset="primary"
              size="small"
              :disabled="estaDeshabilitado(requerimiento)"
              :loading="estaEnviando(requerimiento)"
              :aria-busy="estaEnviando(requerimiento) ? 'true' : 'false'"
              @click="postular(actividad, requerimiento)"
            >
              {{ estaPostulado(requerimiento) ? "Postulación enviada" : "Postularme" }}
            </VaButton>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
/*
 * Listado público de actividades PENDIENTE para postularse (UC-26, ficha §8.1).
 * Se muestra sólo a perfiles no miembros con proyecto Publicado. La carga y
 * el refresco viven acá; la request de postulación la resuelve el dashboard,
 * que abre el modal de confirmación.
 */
import actividadService from "../../services/actividadService.js";
import { refrescarSesion } from "../../services/authState";
import BaseAlert from "../AlertaBase.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  ESTADOS_ACTIVIDAD,
  coloresEstadoActividad,
  etiquetaEstadoActividad,
  formatearDuracionMinutos,
  normalizarEstadoActividad,
} from "../../utils/actividadConstants.js";
import { formatearFecha } from "../../utils/fechas.js";
import {
  TIPOS_POSTULACION,
  clavePostulacion,
} from "../../utils/postulacionConstants.js";

export default {
  name: "ActividadesPostulables",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    /** Mapa de claves ya postuladas en esta sesión de la vista. */
    postulacionesEnviadas: {
      type: Object,
      default: () => ({}),
    },
    /** Clave de la postulación en vuelo, si hay alguna. */
    enviandoClave: {
      type: String,
      default: "",
    },
    puedePostular: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["postular"],
  data() {
    return {
      actividades: [],
      cargando: true,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  computed: {
    actividadesConRequerimientos() {
      return (this.actividades || []).filter(
        (actividad) =>
          Array.isArray(actividad?.requerimientos) &&
          actividad.requerimientos.length > 0
      );
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    etiquetaEstadoActividad,
    formatearDuracionMinutos,
    async cargar() {
      const corrida = ++this.idCarga;
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await actividadService.buscar(
          this.idProyecto,
          { estado: "PENDIENTE", todos: true },
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const contenido = response?.data?.contenido;
        const lista = Array.isArray(contenido) ? contenido : [];
        this.actividades = lista.filter(
          (actividad) =>
            normalizarEstadoActividad(actividad?.estado) ===
            ESTADOS_ACTIVIDAD.PENDIENTE
        );
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    /** Permite que el dashboard refresque el listado tras un 409/404. */
    refrescar() {
      return this.cargar();
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.error = "";

      if (status === 403) {
        this.error =
          mensaje || "No tenés acceso a las actividades de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.error = /proyecto/i.test(mensaje)
          ? "El proyecto ya no existe o no está disponible."
          : mensajeErrorApi(error, "No se pudieron cargar las actividades.");
        return;
      }

      if (status === 401) {
        this.error = mensajeErrorApi(error, "Tu cuenta no se encuentra activa.");
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar las actividades. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar las actividades."
      );
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    rangoFechas(actividad) {
      const inicio = formatearFecha(actividad?.fechaHoraInicio);
      const fin = formatearFecha(actividad?.fechaHoraFin);
      if (inicio === "—" && fin === "—") return "—";
      return `${inicio} – ${fin}`;
    },
    estiloEstado(estado) {
      const colores = coloresEstadoActividad(estado);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
    claveDe(requerimiento) {
      return clavePostulacion(
        TIPOS_POSTULACION.ACTIVIDAD,
        requerimiento?.idRequerimiento
      );
    },
    estaPostulado(requerimiento) {
      const clave = this.claveDe(requerimiento);
      return !!clave && !!this.postulacionesEnviadas?.[clave];
    },
    estaEnviando(requerimiento) {
      const clave = this.claveDe(requerimiento);
      return !!clave && this.enviandoClave === clave;
    },
    estaDeshabilitado(requerimiento) {
      return (
        !this.puedePostular ||
        this.estaPostulado(requerimiento) ||
        !!this.enviandoClave
      );
    },
    postular(actividad, requerimiento) {
      if (this.estaDeshabilitado(requerimiento)) return;
      this.$emit("postular", { actividad, requerimiento });
    },
  },
};
</script>

<style scoped>
.actividades-postulables {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actividades-postulables__cabecera {
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.actividades-postulables__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.actividades-postulables__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.actividades-postulables__reintento {
  display: flex;
  justify-content: center;
}

.actividades-postulables__cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.actividades-postulables__cargando .material-symbols-outlined {
  animation: girar 1.2s linear infinite;
}

.actividades-postulables__vacio {
  margin: 0;
  padding: 2rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.88rem;
  font-style: italic;
  text-align: center;
}

.actividades-postulables__lista {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.actividad-postulable {
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.actividad-postulable__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.actividad-postulable__titulo-grupo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.actividad-postulable__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.98rem;
  font-weight: 700;
}

.actividad-postulable__estado {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.actividad-postulable__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.actividad-postulable__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.actividad-postulable__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.actividad-postulable__meta-item .material-symbols-outlined {
  font-size: 1rem;
}

.actividad-postulable__requerimientos {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.85rem;
}

.requerimiento-postulable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-muted);
}

.requerimiento-postulable__datos {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 180px;
}

.requerimiento-postulable__profesion {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.requerimiento-postulable__descripcion {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
