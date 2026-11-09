<template>
  <section class="historial-proyecto">
    <header class="historial-proyecto__cabecera">
      <div>
        <h2 class="historial-proyecto__titulo">Miembros</h2>
        <p class="historial-proyecto__subtitulo">
          Eliminaciones y bajas voluntarias de integrantes del proyecto.
        </p>
      </div>
      <span v-if="!cargando && !error" class="historial-proyecto__contador">
        {{ paginacion.totalElementos }}
        movimiento{{ paginacion.totalElementos === 1 ? "" : "s" }}
      </span>
    </header>

    <div class="historial-proyecto__filtros">
      <VaInput
        v-model="filtros.nombre"
        class="historial-proyecto__filtro"
        label="Buscar miembro"
        placeholder="Nombre artístico, nombre o apellido"
        clearable
        :disabled="cargando"
        @keyup.enter="cargar(0)"
      />

      <VaSelect
        class="historial-proyecto__filtro"
        label="Tipo de movimiento"
        placeholder="Todos"
        :model-value="filtros.tipo"
        :options="opcionesTipo"
        value-by="value"
        text-by="text"
        clearable
        :disabled="cargando"
        @update:model-value="filtros.tipo = $event || ''"
      />

      <div class="historial-proyecto__acciones-filtro">
        <VaButton
          preset="primary"
          :loading="cargando"
          :disabled="cargando"
          @click="cargar(0)"
        >
          Filtrar
        </VaButton>
        <VaButton
          v-if="hayFiltrosActivos"
          preset="secondary"
          :disabled="cargando"
          @click="limpiarFiltros"
        >
          Limpiar
        </VaButton>
      </div>
    </div>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div
      v-if="error && puedeReintentar"
      class="historial-proyecto__reintento"
    >
      <VaButton preset="primary" icon="mso-refresh" @click="cargar()">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="historial-proyecto__estado">
      <span class="material-symbols-outlined historial-proyecto__estado-icono">
        hourglass_empty
      </span>
      Cargando historial...
    </div>

    <div
      v-else-if="!error && !eventos.length"
      class="historial-proyecto__estado historial-proyecto__vacio"
    >
      <span class="material-symbols-outlined historial-proyecto__estado-icono">
        history
      </span>
      <p class="historial-proyecto__vacio-titulo">
        {{ mensajeVacio }}
      </p>
      <VaButton
        v-if="hayFiltrosActivos"
        preset="secondary"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </VaButton>
    </div>

    <template v-else-if="!error">
      <div class="historial-proyecto__tabla-wrapper">
        <table class="historial-proyecto__tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Movimiento</th>
              <th>Miembro</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Responsable</th>
              <th title="Actividades asignadas al integrante al momento de la consulta">
                Actividades registradas
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="evento in eventos" :key="evento.clave">
              <td class="historial-proyecto__fecha">
                {{ formatearFecha(evento.fecha) }}
              </td>

              <td>
                <span
                  class="historial-proyecto__chip"
                  :style="estiloTipo(evento.tipo)"
                >
                  {{ etiquetaTipoEventoHistorial(evento.tipo) }}
                </span>
              </td>

              <td>
                <div class="historial-proyecto__perfil">
                  <strong>{{ nombreAfectadoHistorial(evento) }}</strong>
                  <span v-if="evento.nombreProfesionAfectado">
                    {{ evento.nombreProfesionAfectado }}
                  </span>
                  <span v-if="evento.rolAfectado">
                    {{ etiquetaRol(evento.rolAfectado) }}
                  </span>
                  <span
                    v-if="!evento.nombreProfesionAfectado && !evento.rolAfectado"
                  >
                    —
                  </span>
                </div>
              </td>

              <td>
                <span class="historial-proyecto__estado-participacion">
                  {{ etiquetaEstadoParticipacionHistorial(evento.estadoParticipacion) }}
                </span>
              </td>

              <td class="historial-proyecto__motivo">
                {{ evento.motivo || "—" }}
              </td>

              <td>
                <div class="historial-proyecto__perfil">
                  <strong>{{ nombreActorHistorial(evento) }}</strong>
                </div>
              </td>

              <td class="historial-proyecto__actividad">
                <ul
                  v-if="actividadesEvento(evento).length"
                  class="historial-proyecto__actividades"
                >
                  <li
                    v-for="(actividad, indice) in actividadesEvento(evento)"
                    :key="`${evento.clave}-${indice}`"
                  >
                    <span class="historial-proyecto__actividad-nombre">
                      {{ actividad.nombreActividad }}
                    </span>
                    <span
                      v-if="actividad.nombreProfesion"
                      class="historial-proyecto__actividad-detalle"
                    >
                      {{ actividad.nombreProfesion }}
                    </span>
                  </li>
                </ul>
                <template v-else-if="evento.idActividad != null">
                  Actividad #{{ evento.idActividad }}
                </template>
                <template v-else>—</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="paginacion.totalPaginas > 1"
        class="historial-proyecto__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera || cargando"
          @click="irAPagina(-1)"
        >
          Anterior
        </VaButton>
        <span class="historial-proyecto__pagina">
          Página {{ paginacion.paginaActual + 1 }} de
          {{ paginacion.totalPaginas }}
        </span>
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_right"
          :disabled="paginacion.ultima || cargando"
          @click="irAPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import proyectoService from "../../services/proyectoService.js";
import { formatearFecha } from "../../utils/fechas.js";
import {
  OPCIONES_TIPO_EVENTO_HISTORIAL,
  coloresTipoEventoHistorial,
  etiquetaEstadoParticipacionHistorial,
  etiquetaTipoEventoHistorial,
  mensajeErrorHistorial,
  nombreActorHistorial,
  nombreAfectadoHistorial,
  normalizarPaginaHistorial,
} from "../../utils/historialProyectoConstants.js";

const PAGINA_INICIAL = {
  paginaActual: 0,
  tamanoPagina: 20,
  totalElementos: 0,
  totalPaginas: 0,
  primera: true,
  ultima: true,
};

/*
 * Historial de membresías del proyecto. Solo se monta para el Director activo.
 * La visibilidad real la valida el backend.
 */
export default {
  name: "HistorialMiembrosProyecto",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
  },
  data() {
    return {
      eventos: [],
      cargando: false,
      error: "",
      puedeReintentar: false,
      paginacion: { ...PAGINA_INICIAL },
      filtros: {
        nombre: "",
        tipo: "",
      },
      opcionesTipo: OPCIONES_TIPO_EVENTO_HISTORIAL,
      idCarga: 0,
    };
  },
  computed: {
    hayFiltrosActivos() {
      return (
        String(this.filtros.nombre || "").trim() !== "" ||
        String(this.filtros.tipo || "").trim() !== ""
      );
    },
    mensajeVacio() {
      if (this.hayFiltrosActivos) {
        return "No hay movimientos para los filtros seleccionados.";
      }
      if (this.paginacion.paginaActual > 0) {
        return "No hay movimientos en esta página.";
      }
      return "Todavía no hay movimientos de miembros en este proyecto.";
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (String(nuevo) === String(anterior)) return;
      this.resetear();
      this.cargar(0);
    },
  },
  created() {
    this.controlador = null;
  },
  mounted() {
    this.cargar(0);
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    formatearFecha,
    etiquetaTipoEventoHistorial,
    etiquetaEstadoParticipacionHistorial,
    nombreAfectadoHistorial,
    nombreActorHistorial,
    estiloTipo(tipo) {
      const colores = coloresTipoEventoHistorial(tipo);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
    etiquetaRol(rol) {
      const clave = String(rol || "").toUpperCase();
      if (clave === "DIRECTOR") return "Director";
      if (clave === "MIEMBRO") return "Miembro";
      return clave || "—";
    },
    actividadesEvento(evento) {
      const actividades = Array.isArray(evento?.actividades)
        ? evento.actividades.filter((actividad) => actividad?.nombreActividad)
        : [];
      if (actividades.length) return actividades;

      // Compatibilidad con respuestas previas que solo traían una actividad.
      if (evento?.nombreActividad) {
        return [
          {
            nombreActividad: evento.nombreActividad,
            nombreProfesion: null,
          },
        ];
      }
      return [];
    },
    resetear() {
      this.eventos = [];
      this.paginacion = { ...PAGINA_INICIAL };
      this.error = "";
      this.puedeReintentar = false;
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
    async cargar(pagina = this.paginacion.paginaActual) {
      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.listarHistorial(
          this.idProyecto,
          {
            tipo: this.filtros.tipo || "",
            nombre: String(this.filtros.nombre || "").trim(),
            page: Math.max(0, Number(pagina) || 0),
            size:
              this.paginacion.tamanoPagina > 0
                ? this.paginacion.tamanoPagina
                : PAGINA_INICIAL.tamanoPagina,
          },
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const normalizada = normalizarPaginaHistorial(response?.data);
        this.eventos = normalizada.contenido;
        this.paginacion = {
          paginaActual: normalizada.paginaActual,
          tamanoPagina: normalizada.tamanoPagina,
          totalElementos: normalizada.totalElementos,
          totalPaginas: normalizada.totalPaginas,
          primera: normalizada.primera,
          ultima: normalizada.ultima,
        };
      } catch (error) {
        if (corrida !== this.idCarga || this.esCancelacion(error)) return;
        this.eventos = [];
        this.error = mensajeErrorHistorial(error);
        const status = error?.response?.status;
        this.puedeReintentar = !status || status >= 500;
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    limpiarFiltros() {
      this.filtros = { nombre: "", tipo: "" };
      this.cargar(0);
    },
    irAPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.cargar(destino);
    },
  },
};
</script>

<style scoped>
.historial-proyecto {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.historial-proyecto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.historial-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.historial-proyecto__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.historial-proyecto__contador {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  white-space: nowrap;
}

.historial-proyecto__filtros {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.historial-proyecto__filtro {
  min-width: 220px;
  flex: 1 1 220px;
}

.historial-proyecto__acciones-filtro {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.historial-proyecto__reintento {
  display: flex;
  justify-content: center;
}

.historial-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.25rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.historial-proyecto__estado-icono {
  font-size: 1.6rem;
}

.historial-proyecto__vacio-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.historial-proyecto__tabla-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.historial-proyecto__tabla {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.historial-proyecto__tabla th {
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.historial-proyecto__tabla td {
  padding: 0.75rem 0.8rem;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text);
  vertical-align: top;
}

.historial-proyecto__tabla tbody tr:last-child td {
  border-bottom: 0;
}

.historial-proyecto__fecha {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.historial-proyecto__perfil {
  display: grid;
  gap: 0.15rem;
}

.historial-proyecto__perfil strong {
  font-size: 0.84rem;
  font-weight: 600;
}

.historial-proyecto__perfil span {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.historial-proyecto__motivo,
.historial-proyecto__actividad {
  color: var(--color-text-muted);
  max-width: 220px;
}

.historial-proyecto__actividades {
  display: grid;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.historial-proyecto__actividades li {
  display: grid;
  gap: 0.05rem;
}

.historial-proyecto__actividad-nombre {
  color: var(--color-text);
}

.historial-proyecto__actividad-detalle {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.historial-proyecto__chip {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.historial-proyecto__estado-participacion {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

.historial-proyecto__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.historial-proyecto__pagina {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

@media (max-width: 700px) {
  .historial-proyecto__filtros {
    align-items: stretch;
    flex-direction: column;
  }

  .historial-proyecto__filtro {
    min-width: 0;
    width: 100%;
  }

  .historial-proyecto__acciones-filtro {
    justify-content: flex-end;
  }
}
</style>
