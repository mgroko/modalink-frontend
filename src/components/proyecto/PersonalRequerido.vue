<template>
  <section class="personal-requerido">
    <header class="personal-requerido__cabecera">
      <h2 class="personal-requerido__titulo">Personal requerido</h2>
      <span v-if="!cargando" class="personal-requerido__contador">
        {{ items.length }} requerimiento{{ items.length === 1 ? "" : "s" }}
      </span>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="personal-requerido__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="cargarActividades">
        Reintentar
      </VaButton>
    </div>

    <div v-if="items.length" class="personal-requerido__lista">
      <RequerimientoCard
        v-for="item in items"
        :key="item.clave"
        :requerimiento="item.requerimiento"
        :habilidades="habilidades"
        :catalogo-caracteristicas="
          catalogos[item.requerimiento.idProfesion] || null
        "
        :contexto-actividad="item.actividad?.nombre || ''"
        :mostrar-ver-actividad="puedeVerActividad(item)"
        :mostrar-accion="puedePostularItem(item)"
        :sin-cupo="estaSinCupo(item)"
        :motivo="motivoItem(item)"
        @ver-actividad="$emit('ver-actividad', item)"
      >
        <template #accion>
          <VaButton
            preset="primary"
            size="small"
            :disabled="estaDeshabilitado(item)"
            :loading="estaEnviando(item)"
            :aria-busy="estaEnviando(item) ? 'true' : 'false'"
            @click="postular(item)"
          >
            {{ estaPostulado(item) ? "Postulación enviada" : "Postularme" }}
          </VaButton>
        </template>
      </RequerimientoCard>
    </div>

    <div v-if="cargando" class="personal-requerido__cargando">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando actividades...
    </div>

    <p
      v-else-if="!items.length && !error"
      class="personal-requerido__vacio"
    >
      {{ textos.VACIO_PERSONAL_REQUERIDO }}
    </p>
  </section>
</template>

<script>
import actividadService from "../../services/actividadService.js";
import perfilService from "../../services/perfilService.js";
import { refrescarSesion } from "../../services/authState";
import BaseAlert from "../AlertaBase.vue";
import RequerimientoCard from "./RequerimientoCard.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "../../utils/actividadConstants.js";
import {
  TEXTOS_POSTULACIONES,
  TIPOS_POSTULACION,
  clavePostulacion,
  esCupoCompleto,
  puedePostularActividad,
  puedePostularGeneral,
} from "../../utils/postulacionConstants.js";

/*
 * Listado unificado de la pestaña Postulaciones (miembro / no miembro):
 * requerimientos generales del proyecto + requerimientos de las actividades
 * PENDIENTE. Los generales solo se listan si el proyecto acepta postulaciones
 * generales. La elegibilidad la decide `puedePostularse` del sistema; el 409
 * de cupo se marca localmente.
 */
export default {
  name: "PersonalRequerido",
  components: { BaseAlert, RequerimientoCard },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    /** Catálogo [{idHabilidad, nombre}]. */
    habilidades: {
      type: Array,
      default: () => [],
    },
    /** Mapa { [idProfesion]: catálogo de características }. */
    catalogosCaracteristicas: {
      type: Object,
      default: () => ({}),
    },
    /** Claves ya postuladas en esta sesión de la vista. */
    postulacionesEnviadas: {
      type: Object,
      default: () => ({}),
    },
    /** Requerimientos marcados sin cupo tras un 409. */
    requerimientosSinCupo: {
      type: Object,
      default: () => ({}),
    },
    /** Clave de la postulación en vuelo, si hay alguna. */
    enviandoClave: {
      type: String,
      default: "",
    },
    /** Gate global del proyecto (fecha de entrega definida). */
    puedePostular: {
      type: Boolean,
      default: false,
    },
    /** Se habilita cuando exista la ruta de detalle de actividad. */
    mostrarVerActividad: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["postular", "ver-actividad"],
  data() {
    return {
      textos: TEXTOS_POSTULACIONES,
      actividades: [],
      /** Catálogos traídos para profesiones de actividad no incluidas en el padre. */
      catalogosLocales: {},
      cargando: true,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  computed: {
    itemsGenerales() {
      if (this.proyecto?.aceptaPostulacionGral === false) return [];
      const requerimientos = Array.isArray(this.proyecto?.requerimientosGral)
        ? this.proyecto.requerimientosGral
        : [];

      return requerimientos.map((requerimiento) => ({
        clave: clavePostulacion(
          TIPOS_POSTULACION.GENERAL,
          requerimiento.idRequerimientoGral
        ),
        tipo: TIPOS_POSTULACION.GENERAL,
        requerimiento,
        actividad: null,
      }));
    },
    itemsActividad() {
      return (this.actividades || []).flatMap((actividad) => {
        const requerimientos = Array.isArray(actividad?.requerimientos)
          ? actividad.requerimientos
          : [];

        return requerimientos.map((requerimiento) => ({
          clave: clavePostulacion(
            TIPOS_POSTULACION.ACTIVIDAD,
            requerimiento.idRequerimiento
          ),
          tipo: TIPOS_POSTULACION.ACTIVIDAD,
          requerimiento,
          actividad,
        }));
      });
    },
    /** Generales primero, después las actividades en el orden del listado. */
    items() {
      return [...this.itemsGenerales, ...this.itemsActividad];
    },
    /** Catálogos del padre + los que falten para profesiones de actividad. */
    catalogos() {
      return { ...this.catalogosCaracteristicas, ...this.catalogosLocales };
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (String(nuevo) === String(anterior)) return;
      this.actividades = [];
      this.cargarActividades();
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.cargarActividades();
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    async cargarActividades() {
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
        this.cargarCatalogosFaltantes(corrida);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    /** Refresco externo tras postularse o ante un 409. */
    refrescar() {
      return this.cargarActividades();
    },
    /**
     * Trae catálogos de características de profesiones de actividad que el
     * dashboard no cargó (solo recorre requerimientos generales). No bloquea
     * la vista: sin catálogo, los valores enumerados degradan a la etiqueta.
     * @param {number} corrida
     */
    cargarCatalogosFaltantes(corrida) {
      const ids = [
        ...new Set(
          this.itemsActividad
            .map((item) => item.requerimiento?.idProfesion)
            .filter(Boolean)
        ),
      ].filter(
        (id) =>
          this.catalogosCaracteristicas?.[id] == null &&
          this.catalogosLocales?.[id] == null
      );
      if (!ids.length) return;

      ids.forEach(async (id) => {
        try {
          const response = await perfilService.caracteristicasPorProfesion(id);
          if (corrida !== this.idCarga) return;
          const datos = response?.data;
          this.catalogosLocales = {
            ...this.catalogosLocales,
            [id]: Array.isArray(datos) ? datos : datos?.caracteristicas || [],
          };
        } catch {
          // Sin catálogo los chips enumerados quedan con la etiqueta sola.
        }
      });
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
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

      this.error = mensajeErrorApi(error, "No se pudieron cargar las actividades.");
    },
    estaSinCupo(item) {
      return !!item.clave && !!this.requerimientosSinCupo?.[item.clave];
    },
    estaPostulado(item) {
      return !!item.clave && !!this.postulacionesEnviadas?.[item.clave];
    },
    estaEnviando(item) {
      return !!item.clave && this.enviandoClave === item.clave;
    },
    estaDeshabilitado(item) {
      return (
        !this.puedePostular ||
        this.estaPostulado(item) ||
        !!this.enviandoClave
      );
    },
    puedePostularItem(item) {
      if (!this.puedePostular) return false;
      if (this.estaSinCupo(item)) return false;

      return item.tipo === TIPOS_POSTULACION.GENERAL
        ? puedePostularGeneral(this.proyecto, item.requerimiento)
        : puedePostularActividad(
            this.proyecto,
            item.actividad,
            item.requerimiento
          );
    },
    puedeVerActividad(item) {
      return (
        this.mostrarVerActividad &&
        item.tipo === TIPOS_POSTULACION.ACTIVIDAD &&
        this.puedePostularItem(item)
      );
    },
    motivoItem(item) {
      if (this.puedePostularItem(item) || this.estaPostulado(item)) return "";
      if (this.estaSinCupo(item) || esCupoCompleto(item.requerimiento)) {
        return this.textos.CUPO_COMPLETO;
      }
      if (item.requerimiento?.puedePostularse === false) {
        return this.textos.NO_DISPONIBLE;
      }
      return "";
    },
    postular(item) {
      if (!this.puedePostularItem(item) || this.estaDeshabilitado(item)) return;
      this.$emit("postular", {
        tipo: item.tipo,
        requerimiento: item.requerimiento,
        actividad: item.actividad,
      });
    },
  },
};
</script>

<style scoped>
.personal-requerido {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.personal-requerido__cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.personal-requerido__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.personal-requerido__contador {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.personal-requerido__lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.personal-requerido__reintento {
  display: flex;
  justify-content: center;
}

.personal-requerido__cargando {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.84rem;
}

.personal-requerido__cargando .material-symbols-outlined {
  font-size: 1.1rem;
  animation: girar 1.2s linear infinite;
}

.personal-requerido__vacio {
  margin: 0;
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.88rem;
  text-align: center;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
