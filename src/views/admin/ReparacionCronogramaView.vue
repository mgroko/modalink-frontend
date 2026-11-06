<template>
  <div class="reparacion-cronograma">
    <header class="reparacion-cronograma__header">
      <h1>Reparación de cronogramas</h1>
      <p>
        Detectá actividades con datos inconsistentes y simulá la reparación
        antes de aplicarla. Sólo se mueven actividades pendientes.
      </p>
    </header>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <div v-if="!puedeConfigurar" class="reparacion-cronograma__estado">
      <span class="material-symbols-outlined reparacion-cronograma__estado-icono">
        lock
      </span>
      No tenés permisos para administrar los cronogramas del sistema.
    </div>

    <template v-else>
      <section class="reparacion-cronograma__card">
        <h2 class="reparacion-cronograma__titulo">Filtros</h2>

        <div class="reparacion-cronograma__filtros">
          <VaInput
            v-model="filtros.idProyecto"
            class="reparacion-cronograma__campo"
            label="ID de proyecto"
            placeholder="Todos"
            type="number"
            min="1"
            clearable
            :disabled="detectando || reparando"
          />
          <VaInput
            v-model="filtros.idActividad"
            class="reparacion-cronograma__campo"
            label="ID de actividad"
            placeholder="Todas"
            type="number"
            min="1"
            clearable
            :disabled="detectando || reparando"
          />
          <VaInput
            v-model="filtros.limite"
            class="reparacion-cronograma__campo"
            label="Límite de proyectos"
            type="number"
            min="1"
            :disabled="detectando || reparando"
            hint="Limita cuántos proyectos se procesan, no la cantidad de filas."
          />
        </div>

        <p v-if="hayFiltrosInvalidos" class="reparacion-cronograma__aviso">
          <span class="material-symbols-outlined" aria-hidden="true">info</span>
          Los IDs deben ser números mayores a 0 y el límite debe ser al menos 1.
        </p>

        <div class="reparacion-cronograma__acciones">
          <VaButton
            icon="mso-search"
            :loading="detectando"
            :disabled="hayFiltrosInvalidos || reparando"
            @click="detectar()"
          >
            Detectar inconsistencias
          </VaButton>
          <VaButton
            preset="secondary"
            :disabled="detectando || reparando || !tieneFiltros"
            @click="limpiar"
          >
            Limpiar
          </VaButton>
        </div>
      </section>

      <section class="reparacion-cronograma__card">
        <header class="reparacion-cronograma__card-cabecera">
          <h2 class="reparacion-cronograma__titulo">
            Inconsistencias
            <span class="reparacion-cronograma__contador">
              · {{ inconsistencias.length }}
            </span>
          </h2>
        </header>

        <p v-if="detectando" class="reparacion-cronograma__nota">
          Detectando inconsistencias...
        </p>

        <p
          v-else-if="!inconsistencias.length"
          class="reparacion-cronograma__nota"
        >
          No se detectaron inconsistencias con los filtros actuales.
        </p>

        <div v-else class="reparacion-cronograma__tabla-wrapper">
          <table class="reparacion-cronograma__tabla">
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Actividad</th>
                <th>Tipo</th>
                <th>Detalle</th>
                <th>Inicio actual</th>
                <th>Fin máx. predecesoras</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, indice) in inconsistencias"
                :key="`${item.idProyecto}-${item.idActividad}-${indice}`"
              >
                <td>
                  <strong>{{ item.nombreProyecto || "—" }}</strong>
                  <span v-if="item.idProyecto != null" class="reparacion-cronograma__secundario">
                    #{{ item.idProyecto }}
                  </span>
                </td>
                <td>
                  <strong>{{ item.nombreActividad || "—" }}</strong>
                  <span v-if="item.idActividad != null" class="reparacion-cronograma__secundario">
                    #{{ item.idActividad }}
                  </span>
                </td>
                <td>
                  <span class="reparacion-cronograma__chip">
                    {{ etiquetaTipoInconsistencia(item.tipo) }}
                  </span>
                </td>
                <td>{{ item.detalle || "—" }}</td>
                <td>{{ formatearFecha(item.inicioActual) }}</td>
                <td>{{ formatearFecha(item.finMaximoPredecesoras) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="reparacion-cronograma__acciones">
          <VaButton
            preset="secondary"
            :loading="reparando"
            :disabled="!inconsistencias.length || detectando"
            @click="simularReparacion"
          >
            Simular reparación
          </VaButton>
          <VaButton
            v-if="puedeAplicar"
            color="danger"
            icon="mso-build"
            :disabled="aplicando"
            @click="abrirAplicacion"
          >
            Aplicar reparación
          </VaButton>
        </div>
      </section>

      <section v-if="resultado" class="reparacion-cronograma__card">
        <header class="reparacion-cronograma__card-cabecera">
          <h2 class="reparacion-cronograma__titulo">
            {{ resultado.dryRun ? "Simulación de reparación" : "Resultado de la reparación" }}
          </h2>
        </header>

        <p class="reparacion-cronograma__resultado-texto">
          {{ mensajeResultado }}
        </p>

        <div class="reparacion-cronograma__resumen">
          <div class="reparacion-cronograma__resumen-item">
            <span>Detectadas</span>
            <strong>{{ resultado.totalDetectadas }}</strong>
          </div>
          <div class="reparacion-cronograma__resumen-item">
            <span>Reparadas</span>
            <strong>{{ resultado.totalReparadas }}</strong>
          </div>
          <div class="reparacion-cronograma__resumen-item">
            <span>Fallidas</span>
            <strong>{{ resultado.totalFallidas }}</strong>
          </div>
        </div>

        <ul v-if="resultado.errores.length" class="reparacion-cronograma__errores">
          <li v-for="(error, indice) in resultado.errores" :key="indice">
            {{ error }}
          </li>
        </ul>

        <p class="reparacion-cronograma__nota">
          La reparación no mueve actividades en curso ni finalizadas. Los
          cronogramas de los proyectos se actualizan al volver a abrirlos.
        </p>
      </section>
    </template>

    <VaModal
      v-model="modalAplicarVisible"
      hide-default-actions
      blur
      size="small"
      :no-dismiss="aplicando"
    >
      <template #header>
        <h3 class="va-h5 reparacion-cronograma__modal-titulo">
          Aplicar reparación
        </h3>
      </template>

      <p class="reparacion-cronograma__modal-texto">
        Se aplicarán los cambios sobre las actividades pendientes detectadas.
        Esta acción modifica los cronogramas de los proyectos afectados.
      </p>

      <p v-if="resultado" class="reparacion-cronograma__modal-texto">
        La simulación detectó <strong>{{ resultado.totalDetectadas }}</strong>
        inconsistencia(s): se repararían
        <strong>{{ resultado.totalReparadas }}</strong> y quedarían
        <strong>{{ resultado.totalFallidas }}</strong> pendientes.
      </p>

      <template #footer>
        <div class="reparacion-cronograma__modal-acciones">
          <VaButton
            preset="secondary"
            :disabled="aplicando"
            @click="cerrarAplicacion"
          >
            Volver
          </VaButton>
          <VaButton
            color="danger"
            :loading="aplicando"
            @click="aplicarReparacion"
          >
            Aplicar
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import { tienePermiso } from "../../services/authState";
import { cargarResumenUsuario } from "../../services/notificacionState";
import BaseAlert from "../../components/AlertaBase.vue";
import { formatearFecha } from "../../utils/fechas.js";
import {
  LIMITE_PROYECTOS_DEFAULT,
  etiquetaTipoInconsistencia,
  mensajeErrorCronograma,
  mensajeResultadoReparacion,
  normalizarInconsistencias,
  normalizarRespuestaReparacion,
} from "../../utils/cronogramaAdminConstants.js";

let controlador = null;

/*
 * Administración de cronogramas (ficha §7): primero se detecta, luego se
 * simula con `dryRun` y recién después se aplica. Un 200 con fallos parciales
 * no es un error: los errores se muestran en el resultado.
 */
export default {
  name: "ReparacionCronogramaView",
  components: { BaseAlert },
  data() {
    return {
      filtros: {
        idProyecto: "",
        idActividad: "",
        limite: LIMITE_PROYECTOS_DEFAULT,
      },
      inconsistencias: [],
      resultado: null,
      detectando: false,
      reparando: false,
      aplicando: false,
      modalAplicarVisible: false,
      successMessage: "",
      errorMessage: "",
      idCorrida: 0,
    };
  },
  computed: {
    puedeConfigurar() {
      return tienePermiso("ADMINISTRAR_CONFIGURACION");
    },
    tieneFiltros() {
      return (
        String(this.filtros.idProyecto ?? "").trim() !== "" ||
        String(this.filtros.idActividad ?? "").trim() !== "" ||
        Number(this.filtros.limite) !== LIMITE_PROYECTOS_DEFAULT
      );
    },
    hayFiltrosInvalidos() {
      return (
        !this.idValido(this.filtros.idProyecto) ||
        !this.idValido(this.filtros.idActividad) ||
        !this.limiteValido(this.filtros.limite)
      );
    },
    mensajeResultado() {
      return mensajeResultadoReparacion(this.resultado);
    },
    puedeAplicar() {
      return (
        this.resultado?.dryRun === true &&
        !this.reparando &&
        !this.aplicando &&
        !this.detectando
      );
    },
  },
  created() {
    controlador = null;
  },
  async mounted() {
    if (!this.puedeConfigurar) return;
    await this.detectar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    formatearFecha,
    etiquetaTipoInconsistencia,
    idValido(valor) {
      const texto = String(valor ?? "").trim();
      if (!texto) return true;
      const total = Number(texto);
      return Number.isFinite(total) && total > 0;
    },
    limiteValido(valor) {
      const texto = String(valor ?? "").trim();
      if (!texto) return true;
      const total = Number(texto);
      return Number.isFinite(total) && total >= 1;
    },
    construirParametros() {
      const parametros = {
        limite: this.limiteValido(this.filtros.limite)
          ? Number(this.filtros.limite || LIMITE_PROYECTOS_DEFAULT)
          : LIMITE_PROYECTOS_DEFAULT,
      };
      const idProyecto = Number(String(this.filtros.idProyecto ?? "").trim());
      const idActividad = Number(String(this.filtros.idActividad ?? "").trim());
      if (Number.isFinite(idProyecto) && idProyecto > 0) {
        parametros.idProyecto = idProyecto;
      }
      if (Number.isFinite(idActividad) && idActividad > 0) {
        parametros.idActividad = idActividad;
      }
      return parametros;
    },
    async detectar({ preservarResultado = false } = {}) {
      if (this.detectando || this.hayFiltrosInvalidos) return;

      const corrida = Date.now();
      this.idCorrida = corrida;
      this.abortar();
      controlador = new AbortController();

      this.detectando = true;
      this.errorMessage = "";
      this.successMessage = "";
      if (!preservarResultado) this.resultado = null;

      try {
        const response = await adminService.listarInconsistenciasCronograma(
          this.construirParametros(),
          controlador.signal
        );
        if (this.idCorrida !== corrida) return;
        this.inconsistencias = normalizarInconsistencias(response?.data);
      } catch (error) {
        if (this.esCancelacion(error) || this.idCorrida !== corrida) return;
        this.inconsistencias = [];
        this.errorMessage = mensajeErrorCronograma(
          error,
          "No se pudieron detectar las inconsistencias."
        );
      } finally {
        if (this.idCorrida === corrida) this.detectando = false;
      }
    },
    async simularReparacion() {
      if (this.reparando || this.detectando || !this.inconsistencias.length) {
        return;
      }

      this.reparando = true;
      this.errorMessage = "";
      this.successMessage = "";
      this.abortar();
      controlador = new AbortController();

      try {
        const response = await adminService.repararCronograma(
          { ...this.construirParametros(), dryRun: true },
          controlador.signal
        );
        this.resultado = normalizarRespuestaReparacion(response?.data);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.errorMessage = mensajeErrorCronograma(
          error,
          "No se pudo simular la reparación."
        );
      } finally {
        this.reparando = false;
      }
    },
    abrirAplicacion() {
      if (!this.puedeAplicar) return;
      this.modalAplicarVisible = true;
    },
    cerrarAplicacion() {
      if (this.aplicando) return;
      this.modalAplicarVisible = false;
    },
    async aplicarReparacion() {
      if (this.aplicando) return;

      this.aplicando = true;
      this.errorMessage = "";
      this.successMessage = "";
      this.abortar();
      controlador = new AbortController();

      try {
        const response = await adminService.repararCronograma(
          { ...this.construirParametros(), dryRun: false },
          controlador.signal
        );
        this.resultado = normalizarRespuestaReparacion(response?.data);
        this.modalAplicarVisible = false;
        const mensajeExito = mensajeResultadoReparacion(this.resultado);
        await this.refrescarNotificaciones();
        await this.detectar({ preservarResultado: true });
        if (!this.errorMessage) {
          this.successMessage = mensajeExito;
        }
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.modalAplicarVisible = false;
        this.errorMessage = mensajeErrorCronograma(
          error,
          "No se pudo aplicar la reparación."
        );
      } finally {
        this.aplicando = false;
      }
    },
    async refrescarNotificaciones() {
      try {
        await cargarResumenUsuario();
      } catch {
        // La actualización de notificaciones es best-effort.
      }
    },
    limpiar() {
      this.filtros = {
        idProyecto: "",
        idActividad: "",
        limite: LIMITE_PROYECTOS_DEFAULT,
      };
      this.inconsistencias = [];
      this.resultado = null;
      this.successMessage = "";
      this.errorMessage = "";
      this.detectar();
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
.reparacion-cronograma {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reparacion-cronograma__header h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2vw, 2rem);
}

.reparacion-cronograma__header p {
  margin: 0.4rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.reparacion-cronograma__card {
  padding: 1.25rem 1.35rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 1rem;
  box-shadow: 0 0.3rem 1.3rem rgba(35, 33, 52, 0.04);
}

.reparacion-cronograma__card-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.reparacion-cronograma__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.reparacion-cronograma__contador {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.reparacion-cronograma__filtros {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  margin: 0.85rem 0 0;
}

.reparacion-cronograma__acciones {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.reparacion-cronograma__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.reparacion-cronograma__aviso .material-symbols-outlined {
  font-size: 1rem;
}

.reparacion-cronograma__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}

.reparacion-cronograma__tabla-wrapper {
  overflow-x: auto;
}

.reparacion-cronograma__tabla {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.reparacion-cronograma__tabla th {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.reparacion-cronograma__tabla td {
  padding: 0.65rem 0.6rem;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text);
  font-size: 0.82rem;
  vertical-align: top;
}

.reparacion-cronograma__tabla td strong {
  display: block;
  font-weight: 700;
}

.reparacion-cronograma__secundario {
  display: block;
  margin-top: 0.1rem;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.reparacion-cronograma__chip {
  display: inline-flex;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.reparacion-cronograma__resultado-texto {
  margin: 0 0 0.85rem;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reparacion-cronograma__resumen {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.reparacion-cronograma__resumen-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.reparacion-cronograma__resumen-item strong {
  color: var(--color-text);
  font-size: 1.25rem;
}

.reparacion-cronograma__errores {
  margin: 0 0 0.85rem;
  padding: 0.6rem 0.7rem 0.6rem 1.5rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.8rem;
  line-height: 1.45;
}

.reparacion-cronograma__estado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.reparacion-cronograma__modal-titulo {
  margin: 0;
}

.reparacion-cronograma__modal-texto {
  margin: 0.25rem 0 0.6rem;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.reparacion-cronograma__modal-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

@media (max-width: 820px) {
  .reparacion-cronograma__filtros,
  .reparacion-cronograma__resumen {
    grid-template-columns: 1fr;
  }
}
</style>
