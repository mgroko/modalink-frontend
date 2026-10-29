<template>
  <section class="cronograma-proyecto">
    <div v-if="cargando && !cronograma" class="cronograma-proyecto__estado">
      <span class="material-symbols-outlined cronograma-proyecto__estado-icono">
        hourglass_empty
      </span>
      Calculando el cronograma...
    </div>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="cronograma-proyecto__reintento">
      <VaButton preset="primary" @click="cargar">Reintentar</VaButton>
    </div>

    <template v-if="resumen">
      <div
        v-if="estadoCronograma === ESTADOS_CRONOGRAMA.SIN_FECHA_ENTREGA || parcial"
        class="cronograma-proyecto__aviso"
        role="status"
      >
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        <div>
          <p class="cronograma-proyecto__aviso-titulo">Cálculo parcial</p>
          <p class="cronograma-proyecto__aviso-texto">
            El proyecto no tiene una fecha de entrega completa. Las fechas son
            orientativas y no hay métricas de margen hasta la entrega.
          </p>
        </div>
      </div>

      <div v-else-if="!viable" class="cronograma-proyecto__aviso cronograma-proyecto__aviso--peligro" role="alert">
        <span class="material-symbols-outlined" aria-hidden="true">error</span>
        <div>
          <p class="cronograma-proyecto__aviso-titulo">Cronograma inviable</p>
          <p class="cronograma-proyecto__aviso-texto">
            El CPM detectó un cronograma que no puede cumplirse con la fecha de
            entrega actual.
          </p>
        </div>
      </div>

      <div v-if="tentativo" class="cronograma-proyecto__aviso" role="status">
        <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
        <div>
          <p class="cronograma-proyecto__aviso-titulo">Proyección provisional</p>
          <p class="cronograma-proyecto__aviso-texto">
            El proyecto todavía no confirmó su fecha de inicio. Las fechas
            pueden cambiar.
          </p>
        </div>
      </div>

      <div class="cronograma-proyecto__tarjetas">
        <article class="cronograma-proyecto__tarjeta">
          <span class="cronograma-proyecto__tarjeta-label">Duración estimada</span>
          <strong class="cronograma-proyecto__tarjeta-valor">
            {{ duracionTexto }}
          </strong>
          <span class="cronograma-proyecto__tarjeta-hint">
            {{ rangoProyectado }}
          </span>
        </article>

        <article class="cronograma-proyecto__tarjeta">
          <span class="cronograma-proyecto__tarjeta-label">Ruta crítica</span>
          <strong class="cronograma-proyecto__tarjeta-valor">
            {{ actividadesCriticas }} de {{ totalActividades }}
          </strong>
          <span class="cronograma-proyecto__tarjeta-hint">
            {{ rutaCriticaTexto }}
          </span>
        </article>

        <article class="cronograma-proyecto__tarjeta">
          <span class="cronograma-proyecto__tarjeta-label">
            Margen hasta la entrega
          </span>
          <strong
            class="cronograma-proyecto__tarjeta-valor"
            :class="{ 'cronograma-proyecto__tarjeta-valor--alerta': margenVencido }"
          >
            {{ margenTexto }}
          </strong>
          <span class="cronograma-proyecto__tarjeta-hint">
            {{ entregaTexto }}
          </span>
        </article>

        <article class="cronograma-proyecto__tarjeta">
          <span class="cronograma-proyecto__tarjeta-label">Estado</span>
          <span
            class="cronograma-proyecto__estado-chip"
            :style="estiloEstadoCronograma"
          >
            {{ etiquetaEstadoCronograma(estadoCronograma) }}
          </span>
          <span class="cronograma-proyecto__tarjeta-hint">
            {{ tentativo ? "Proyección provisional" : "Fechas calculadas por CPM" }}
          </span>
        </article>
      </div>

      <section class="cronograma-proyecto__panel">
        <header class="cronograma-proyecto__panel-cabecera">
          <div>
            <h3 class="cronograma-proyecto__titulo">Gantt</h3>
            <p class="cronograma-proyecto__subtitulo">
              Barra sólida: ejecución proyectada. Barra clara: holgura hasta el
              makespan.
            </p>
          </div>
        </header>

        <CronogramaActividades
          :actividades="actividades"
          :seleccionada="seleccionadaId"
          @seleccionar="seleccionar"
        />
      </section>

      <section
        v-if="actividadSeleccionada"
        class="cronograma-proyecto__panel cronograma-proyecto__detalle"
      >
        <header class="cronograma-proyecto__panel-cabecera">
          <div>
            <h3 class="cronograma-proyecto__titulo">
              {{ actividadSeleccionada.nombre }}
            </h3>
            <p
              v-if="actividadSeleccionada.descripcion"
              class="cronograma-proyecto__subtitulo"
            >
              {{ actividadSeleccionada.descripcion }}
            </p>
          </div>
          <button
            type="button"
            class="cronograma-proyecto__cerrar"
            aria-label="Cerrar detalle"
            @click="cerrarDetalle"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <div v-if="chipsSeleccionada.length" class="cronograma-proyecto__chips">
          <span
            v-for="chip in chipsSeleccionada"
            :key="chip.tipo"
            class="cronograma-proyecto__chip"
            :class="`cronograma-proyecto__chip--${chip.tipo}`"
            :title="chip.detalle"
          >
            {{ chip.etiqueta }}
          </span>
        </div>

        <dl class="cronograma-proyecto__detalle-lista">
          <div>
            <dt>Inicio – Fin</dt>
            <dd>{{ rangoSeleccionada }}</dd>
          </div>
          <div>
            <dt>Holgura makespan</dt>
            <dd>{{ holguraSeleccionada }}</dd>
          </div>
          <div>
            <dt>Holgura entrega</dt>
            <dd>{{ holguraEntregaSeleccionada }}</dd>
          </div>
          <div>
            <dt>Depende de</dt>
            <dd>{{ predecesorasSeleccionada }}</dd>
          </div>
        </dl>

        <p
          v-if="actividadSeleccionada.conflicto"
          class="cronograma-proyecto__conflicto-texto"
        >
          <span class="material-symbols-outlined" aria-hidden="true">warning</span>
          {{ actividadSeleccionada.motivoConflicto || "Conflicto CPM detectado." }}
        </p>

        <VaButton
          preset="secondary"
          size="small"
          :loading="cargandoDetalle"
          @click="verDetalleCompleto"
        >
          Ver detalle completo
        </VaButton>

        <BaseAlert
          v-if="errorDetalle"
          :message="errorDetalle"
          type="error"
          class="cronograma-proyecto__detalle-alerta"
        />

        <div v-if="detalleCompleto" class="cronograma-proyecto__detalle-completo">
          <h4 class="cronograma-proyecto__subtitulo-fuerte">
            Responsables y requerimientos
          </h4>
          <p class="cronograma-proyecto__detalle-texto">
            <strong>Responsables:</strong>
            {{ responsablesDetalle }}
          </p>
          <p class="cronograma-proyecto__detalle-texto">
            <strong>Requerimientos:</strong>
            {{ requerimientosDetalle }}
          </p>
        </div>
      </section>

      <section class="cronograma-proyecto__panel">
        <header class="cronograma-proyecto__panel-cabecera">
          <div>
            <h3 class="cronograma-proyecto__titulo">Tabla CPM</h3>
            <p class="cronograma-proyecto__subtitulo">
              Holgura calculada por el backend respecto del makespan. La columna
              Crítica usa la ruta crítica del cronograma.
            </p>
          </div>
        </header>

        <div class="cronograma-proyecto__tabla-scroll">
          <table class="cronograma-proyecto__tabla">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Actividad</th>
                <th scope="col">Dur.</th>
                <th scope="col">Depende de</th>
                <th scope="col">Inicio – Fin</th>
                <th scope="col">Holgura</th>
                <th scope="col">Crítica</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fila in filas"
                :key="fila.idActividad"
                class="cronograma-proyecto__fila"
                :class="{
                  'cronograma-proyecto__fila--seleccionada':
                    String(fila.idActividad) === String(seleccionadaId),
                }"
                @click="seleccionar(fila.idActividad)"
              >
                <td>{{ fila.indice }}</td>
                <td>
                  <span class="cronograma-proyecto__nombre-actividad">
                    {{ fila.nombre }}
                  </span>
                  <span
                    v-if="fila.tentativa"
                    class="cronograma-proyecto__secundario"
                  >
                    Estimada
                  </span>
                </td>
                <td class="cronograma-proyecto__ahora">
                  {{ formatearDuracionMinutos(fila.duracionMinutos) }}
                </td>
                <td>
                  <span v-if="fila.predecesoras.length">
                    {{ fila.predecesorasTexto }}
                  </span>
                  <span v-else class="cronograma-proyecto__secundario">—</span>
                </td>
                <td class="cronograma-proyecto__ahora">{{ fila.rango }}</td>
                <td class="cronograma-proyecto__ahora">{{ fila.holgura }}</td>
                <td>
                  <span
                    v-if="fila.enRutaCritica"
                    class="cronograma-proyecto__chip cronograma-proyecto__chip--critica"
                  >
                    Crítica
                  </span>
                  <span v-else class="cronograma-proyecto__secundario">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-if="conflictosNormalizados.length"
        class="cronograma-proyecto__panel"
      >
        <h3 class="cronograma-proyecto__titulo">Conflictos</h3>
        <ul class="cronograma-proyecto__conflictos">
          <li
            v-for="(conflicto, indice) in conflictosNormalizados"
            :key="indice"
          >
            <span class="material-symbols-outlined" aria-hidden="true">warning</span>
            {{ conflicto }}
          </li>
        </ul>
      </section>
    </template>

    <p
      v-else-if="!cargando && !error"
      class="cronograma-proyecto__vacio"
    >
      No hay actividades para calcular el cronograma.
    </p>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import CronogramaActividades from "./CronogramaActividades.vue";
import actividadService from "../../services/actividadService.js";
import { refrescarSesion } from "../../services/authState";
import { formatearDuracionMinutos } from "../../utils/actividadConstants.js";
import {
  ESTADOS_CRONOGRAMA,
  coloresEstadoCronograma,
  etiquetaEstadoCronograma,
  fechaFinInclusiva,
  formatearHolgura,
  formatearRangoCpm,
} from "../../utils/cpmConstants.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";

/*
 * Pestaña Cronograma (UC-33). Consume `GET /proyectos/{id}/cronograma` y no
 * duplica CPM ni márgenes. Se carga al abrir la pestaña y se refresca cuando
 * el padre incrementa `tokenRefresco`.
 */
export default {
  name: "CronogramaProyecto",
  components: { BaseAlert, CronogramaActividades },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    tokenRefresco: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      ESTADOS_CRONOGRAMA,
      cronograma: null,
      cargando: false,
      error: "",
      puedeReintentar: false,
      cargado: false,
      desactualizado: false,
      idCarga: 0,
      seleccionadaId: null,
      detalleCompleto: null,
      cargandoDetalle: false,
      errorDetalle: "",
      controlador: null,
      controladorDetalle: null,
    };
  },
  computed: {
    resumen() {
      return this.cronograma?.resumen || null;
    },
    actividades() {
      return Array.isArray(this.cronograma?.actividades)
        ? this.cronograma.actividades
        : [];
    },
    conflictos() {
      return Array.isArray(this.cronograma?.conflictos)
        ? this.cronograma.conflictos
        : [];
    },
    estadoCronograma() {
      return this.resumen?.estadoCronograma || null;
    },
    estiloEstadoCronograma() {
      const colores = coloresEstadoCronograma(this.estadoCronograma);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
    parcial() {
      return this.resumen?.parcial === true;
    },
    tentativo() {
      return this.resumen?.tentativo === true;
    },
    viable() {
      return this.resumen?.viable !== false;
    },
    duracionTexto() {
      return formatearDuracionMinutos(this.resumen?.makespanMinutos);
    },
    rangoProyectado() {
      const inicio = formatearFechaCorta(this.resumen?.fechaInicio);
      const fin = formatearFechaCorta(
        fechaFinInclusiva(this.resumen?.fechaFinProyectada)
      );
      if (inicio === "—" && fin === "—") return "Sin fechas proyectadas";
      return `${inicio} – ${fin}`;
    },
    totalActividades() {
      const total = Number(this.resumen?.totalActividades);
      return Number.isFinite(total) ? total : this.actividades.length;
    },
    actividadesCriticas() {
      const total = Number(this.resumen?.actividadesCriticas);
      if (Number.isFinite(total)) return total;
      return this.actividades.filter(
        (actividad) => actividad?.enRutaCritica === true
      ).length;
    },
    rutaCriticaTexto() {
      const ids = Array.isArray(this.resumen?.rutaCritica)
        ? this.resumen.rutaCritica
        : [];
      if (!ids.length) return "Sin actividades en la ruta crítica";
      const nombres = ids
        .map((id) => this.nombrePorId(id))
        .filter(Boolean)
        .slice(0, 5);
      const sufijo = ids.length > nombres.length ? "…" : "";
      return `${nombres.join(" → ")}${sufijo}`;
    },
    margenVencido() {
      const margen = Number(this.resumen?.margenMinutos);
      return Number.isFinite(margen) && margen < 0;
    },
    margenTexto() {
      if (this.parcial || this.estadoCronograma === ESTADOS_CRONOGRAMA.SIN_FECHA_ENTREGA) {
        return "Sin fecha de entrega";
      }
      if (this.resumen?.margenMinutos == null) return "—";
      return formatearHolgura(this.resumen.margenMinutos) || "—";
    },
    entregaTexto() {
      const entrega = formatearFechaCorta(this.resumen?.fechaEntrega);
      return entrega === "—" ? "Sin fecha de entrega" : `Entrega: ${entrega}`;
    },
    filas() {
      return this.actividades.map((actividad, indice) => ({
        ...actividad,
        indice: indice + 1,
        tentativa:
          actividad?.tentativo === true || actividad?.tentative === "true",
        enRutaCritica: actividad?.enRutaCritica === true,
        predecesoras: Array.isArray(actividad?.predecesoras)
          ? actividad.predecesoras
          : [],
        predecesorasTexto: (actividad?.predecesoras || [])
          .map((predecesora) => predecesora?.nombre)
          .filter(Boolean)
          .join(", "),
        rango: formatearRangoCpm(
          actividad?.inicioProyectado,
          actividad?.finProyectado
        ),
        holgura: formatearHolgura(actividad?.holguraMakespan) || "—",
      }));
    },
    actividadSeleccionada() {
      if (this.seleccionadaId == null) return null;
      return (
        this.actividades.find(
          (actividad) =>
            String(actividad.idActividad) === String(this.seleccionadaId)
        ) || null
      );
    },
    chipsSeleccionada() {
      const actividad = this.actividadSeleccionada;
      if (!actividad) return [];

      // El DTO del cronograma no expone fechas persistidas: se muestran sólo
      // los flags que sí trae, para no rotular todo como "Proyectada".
      const chips = [];
      if (actividad.tentativo === true || actividad.tentative === "true") {
        chips.push({
          tipo: "estimada",
          etiqueta: "Estimada",
          detalle: "Proyección provisional hasta confirmar el proyecto.",
        });
      }
      if (actividad.critica === true) {
        chips.push({
          tipo: "critica",
          etiqueta: "Crítica",
          detalle: "Holgura de makespan igual a cero.",
        });
      }
      if (actividad.conflicto === true) {
        chips.push({
          tipo: "conflicto",
          etiqueta: "Conflicto",
          detalle:
            actividad.motivoConflicto ||
            "La ventana CPM de la actividad no es factible.",
        });
      }
      if (actividad.fijo === true) {
        chips.push({
          tipo: "proyectada",
          etiqueta: "Fija",
          detalle: "Actividad fija del cronograma.",
        });
      }
      return chips;
    },
    rangoSeleccionada() {
      return formatearRangoCpm(
        this.actividadSeleccionada?.inicioProyectado,
        this.actividadSeleccionada?.finProyectado
      );
    },
    holguraSeleccionada() {
      return formatearHolgura(this.actividadSeleccionada?.holguraMakespan) || "—";
    },
    holguraEntregaSeleccionada() {
      return formatearHolgura(this.actividadSeleccionada?.holguraEntrega) || "—";
    },
    predecesorasSeleccionada() {
      const nombres = (this.actividadSeleccionada?.predecesoras || [])
        .map((predecesora) => predecesora?.nombre)
        .filter(Boolean);
      return nombres.length ? nombres.join(", ") : "—";
    },
    responsablesDetalle() {
      const responsables = this.detalleCompleto?.profesionalesAsignados || [];
      if (!responsables.length) return "Sin responsables asignados.";
      return responsables
        .map((responsable) => responsable?.nombreArtistico)
        .filter(Boolean)
        .join(", ");
    },
    requerimientosDetalle() {
      const requerimientos = this.detalleCompleto?.requerimientos || [];
      if (!requerimientos.length) return "Sin requerimientos.";
      return requerimientos
        .map(
          (requerimiento) =>
            `${requerimiento?.cantidad ?? "?"} × ${requerimiento?.nombreProfesion || "Perfil"}`
        )
        .join(", ");
    },
    conflictosNormalizados() {
      return this.conflictos
        .map((conflicto) => this.textoConflicto(conflicto))
        .filter(Boolean);
    },
  },
  watch: {
    activo(valor) {
      if (valor && (!this.cargado || this.desactualizado)) this.cargar();
    },
    tokenRefresco() {
      if (this.activo) {
        this.cargar();
      } else {
        this.desactualizado = true;
      }
    },
    idProyecto() {
      this.resetear();
      if (this.activo) this.cargar();
    },
  },
  created() {
    this.controlador = null;
    this.controladorDetalle = null;
  },
  mounted() {
    if (this.activo) this.cargar();
  },
  beforeUnmount() {
    this.abortar();
    this.abortarDetalle();
  },
  methods: {
    async cargar() {
      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;
      this.detalleCompleto = null;
      this.errorDetalle = "";
      this.abortarDetalle();

      try {
        const response = await actividadService.obtenerCronograma(
          this.idProyecto,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        this.cronograma = response?.data || null;
        this.cargado = true;
        this.desactualizado = false;

        if (
          this.seleccionadaId != null &&
          !this.actividades.some(
            (actividad) =>
              String(actividad.idActividad) === String(this.seleccionadaId)
          )
        ) {
          this.seleccionadaId = null;
        }
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
      this.error = "";

      if (status === 401) {
        this.error = "Tu sesión expiró. Iniciá sesión nuevamente.";
        return;
      }

      if (status === 403) {
        this.error =
          mensaje || "No tenés acceso al cronograma de este proyecto.";
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
          : mensajeErrorApi(error, "No se pudo cargar el cronograma.");
        return;
      }

      if (status === 409) {
        this.error =
          mensaje ||
          "El cronograma no es viable: revisá las dependencias y la fecha de entrega.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al calcular el cronograma. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(error, "No se pudo cargar el cronograma.");
    },
    seleccionar(idActividad) {
      this.seleccionadaId =
        this.seleccionadaId != null &&
        String(this.seleccionadaId) === String(idActividad)
          ? null
          : idActividad;
      this.detalleCompleto = null;
      this.errorDetalle = "";
    },
    cerrarDetalle() {
      this.seleccionadaId = null;
      this.detalleCompleto = null;
      this.errorDetalle = "";
      this.abortarDetalle();
    },
    async verDetalleCompleto() {
      if (!this.actividadSeleccionada || this.cargandoDetalle) return;

      this.abortarDetalle();
      this.controladorDetalle = new AbortController();
      this.cargandoDetalle = true;
      this.errorDetalle = "";

      try {
        const response = await actividadService.obtener(
          this.idProyecto,
          this.actividadSeleccionada.idActividad,
          this.controladorDetalle.signal
        );
        this.detalleCompleto = response?.data || null;
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.errorDetalle =
          error?.response?.data?.message ||
          "No se pudo cargar el detalle completo de la actividad.";
      } finally {
        this.cargandoDetalle = false;
      }
    },
    nombrePorId(idActividad) {
      const actividad = this.actividades.find(
        (item) => String(item.idActividad) === String(idActividad)
      );
      return actividad?.nombre || "";
    },
    textoConflicto(conflicto) {
      if (!conflicto) return "";
      if (typeof conflicto === "string") return conflicto;
      return (
        conflicto.motivoConflicto ||
        conflicto.motivo ||
        conflicto.mensaje ||
        conflicto.nombre ||
        "Conflicto CPM detectado."
      );
    },
    resetear() {
      this.abortar();
      this.cronograma = null;
      this.cargado = false;
      this.desactualizado = false;
      this.seleccionadaId = null;
      this.detalleCompleto = null;
      this.error = "";
      this.errorDetalle = "";
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    abortarDetalle() {
      if (this.controladorDetalle) {
        this.controladorDetalle.abort();
        this.controladorDetalle = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    etiquetaEstadoCronograma,
    formatearDuracionMinutos,
  },
};
</script>

<style scoped>
.cronograma-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cronograma-proyecto__estado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.cronograma-proyecto__estado-icono {
  animation: girar 1.2s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

.cronograma-proyecto__reintento {
  display: flex;
  justify-content: flex-start;
}

.cronograma-proyecto__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.cronograma-proyecto__aviso--peligro {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.cronograma-proyecto__aviso-titulo {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
}

.cronograma-proyecto__aviso-texto {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  line-height: 1.45;
}

.cronograma-proyecto__tarjetas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.cronograma-proyecto__tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.cronograma-proyecto__tarjeta-label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 500;
}

.cronograma-proyecto__tarjeta-valor {
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.cronograma-proyecto__tarjeta-valor--alerta {
  color: var(--color-danger-text);
}

.cronograma-proyecto__tarjeta-hint {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  line-height: 1.4;
}

.cronograma-proyecto__estado-chip {
  align-self: flex-start;
  padding: 0.15rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
}

.cronograma-proyecto__panel {
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.cronograma-proyecto__panel-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.cronograma-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.cronograma-proyecto__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.cronograma-proyecto__subtitulo-fuerte {
  margin: 0 0 0.4rem;
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
}

.cronograma-proyecto__cerrar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
}

.cronograma-proyecto__cerrar:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.cronograma-proyecto__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.8rem;
}

.cronograma-proyecto__chip {
  display: inline-block;
  padding: 0.12rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.cronograma-proyecto__chip--proyectada {
  border-color: var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.cronograma-proyecto__chip--estimada {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.cronograma-proyecto__chip--critica {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.cronograma-proyecto__chip--conflicto {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.cronograma-proyecto__chip--parcial {
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.cronograma-proyecto__detalle-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.65rem;
  margin: 0 0 0.85rem;
}

.cronograma-proyecto__detalle-lista div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cronograma-proyecto__detalle-lista dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.cronograma-proyecto__detalle-lista dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.82rem;
}

.cronograma-proyecto__conflicto-texto {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0 0 0.85rem;
  color: var(--color-danger-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.cronograma-proyecto__detalle-alerta {
  margin-top: 0.75rem !important;
}

.cronograma-proyecto__detalle-completo {
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-soft);
}

.cronograma-proyecto__detalle-texto {
  margin: 0.2rem 0 0;
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.cronograma-proyecto__tabla-scroll {
  overflow-x: auto;
}

.cronograma-proyecto__tabla {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.cronograma-proyecto__tabla th {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.cronograma-proyecto__tabla td {
  padding: 0.7rem 0.6rem;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text);
  font-size: 0.84rem;
  vertical-align: middle;
}

.cronograma-proyecto__fila {
  cursor: pointer;
}

.cronograma-proyecto__fila:hover {
  background: var(--color-surface-muted);
}

.cronograma-proyecto__fila--seleccionada {
  background: var(--color-info-soft);
}

.cronograma-proyecto__fila--seleccionada td:first-child {
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.cronograma-proyecto__nombre-actividad {
  display: block;
  font-weight: 600;
}

.cronograma-proyecto__secundario {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.cronograma-proyecto__ahora {
  white-space: nowrap;
}

.cronograma-proyecto__conflictos {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cronograma-proyecto__conflictos li {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  color: var(--color-danger-text);
  font-size: 0.82rem;
  line-height: 1.45;
}

.cronograma-proyecto__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-style: italic;
}
</style>
