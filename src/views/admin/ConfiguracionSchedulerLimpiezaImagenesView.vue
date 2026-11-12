<template>
  <div class="limpieza-imagenes">
    <section class="limpieza-imagenes__encabezado">
      <h1>Limpieza de imágenes</h1>
      <p class="limpieza-imagenes__subtitulo">
        Configurá cada cuánto el sistema elimina archivos e imágenes huérfanas, y ejecutá la limpieza manualmente.
      </p>
    </section>

    <BaseAlert :message="errorMessage" type="error" />
    <BaseAlert :message="avisoLimpiando" type="warning" />

    <div v-if="!puedeConfigurar" class="limpieza-imagenes__estado">
      <span class="material-symbols-outlined limpieza-imagenes__estado-icono">lock</span>
      No tenés permiso para esta sección.
    </div>

    <div
      v-else-if="cargando"
      class="limpieza-imagenes__card limpieza-imagenes__card--estado"
      role="status"
      aria-live="polite"
    >
      <span class="limpieza-imagenes__spinner" aria-hidden="true"></span>
      <span>Cargando configuración...</span>
    </div>

    <div v-else-if="errorCarga" class="limpieza-imagenes__estado limpieza-imagenes__estado--error">
      <span class="material-symbols-outlined limpieza-imagenes__estado-icono">error</span>
      <p class="limpieza-imagenes__estado-texto">{{ errorCarga }}</p>
      <VaButton preset="secondary" icon="mso-refresh" @click="cargarConfiguracion()">
        Reintentar
      </VaButton>
    </div>

    <div v-else-if="configuracion" class="limpieza-imagenes__card">
      <form class="limpieza-imagenes__form" @submit.prevent="guardarConfiguracion">
        <div class="limpieza-imagenes__campo">
          <VaInput
            v-model.number="form.intervaloHoras"
            label="Intervalo de limpieza (horas)"
            type="number"
            min="1"
            max="168"
            step="1"
            required
            placeholder="Ej: 24"
            :disabled="guardando || ejecutando"
            :error="!!errorIntervalo"
            :error-messages="errorIntervalo || undefined"
            @update:model-value="errorIntervalo = ''"
          />
          <p class="limpieza-imagenes__ayuda">
            Cada <strong>{{ intervaloActual }}</strong> horas se ejecuta la limpieza automática.
            El intervalo debe ser un número entero entre 1 y 168.
          </p>
        </div>

        <div class="limpieza-imagenes__info-box">
          <div class="limpieza-imagenes__info-fila">
            <span class="material-symbols-outlined limpieza-imagenes__info-icono">hourglass_top</span>
            <div>
              <p class="limpieza-imagenes__info-label">Gracia actual</p>
              <p class="limpieza-imagenes__info-valor">{{ configuracion.graciaMinutos }} minutos</p>
            </div>
          </div>

          <div class="limpieza-imagenes__info-fila">
            <span class="material-symbols-outlined limpieza-imagenes__info-icono">update</span>
            <div>
              <p class="limpieza-imagenes__info-label">Próxima ejecución</p>
              <p class="limpieza-imagenes__info-valor">{{ proximaEjecucionTexto }}</p>
            </div>
          </div>

          <div class="limpieza-imagenes__info-fila">
            <span class="material-symbols-outlined limpieza-imagenes__info-icono">event_available</span>
            <div>
              <p class="limpieza-imagenes__info-label">Última ejecución</p>
              <p class="limpieza-imagenes__info-valor">{{ ultimaEjecucionTexto }}</p>
            </div>
          </div>
        </div>

        <div class="limpieza-imagenes__actions">
          <VaButton
            type="submit"
            color="primary"
            icon="mso-save"
            :loading="guardando"
            :disabled="guardando || ejecutando"
          >
            {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
          </VaButton>

          <VaButton
            type="button"
            preset="secondary"
            icon="mso-play_arrow"
            :loading="ejecutando"
            :disabled="guardando || ejecutando"
            @click="abrirConfirmacion"
          >
            {{ ejecutando ? 'Ejecutando...' : 'Ejecutar ahora' }}
          </VaButton>
        </div>
      </form>

      <section v-if="resultado" class="limpieza-imagenes__resultado" aria-live="polite">
        <header class="limpieza-imagenes__resultado-header">
          <span class="material-symbols-outlined limpieza-imagenes__resultado-icono">cleaning_services</span>
          <div>
            <h2>Resultado de la limpieza</h2>
            <p>{{ resultado.mensaje }}</p>
          </div>
        </header>

        <div class="limpieza-imagenes__conteos">
          <div class="limpieza-imagenes__conteo">
            <span>Archivos huérfanos eliminados</span>
            <strong>{{ resultado.archivosHuerfanos }}</strong>
          </div>
          <div class="limpieza-imagenes__conteo">
            <span>Imágenes sin referencia eliminadas</span>
            <strong>{{ resultado.imagenesHuerfanas }}</strong>
          </div>
          <div class="limpieza-imagenes__conteo">
            <span>Imágenes de perfiles en baja procesadas</span>
            <strong>{{ resultado.imagenesPerfilesBaja }}</strong>
          </div>
          <div
            class="limpieza-imagenes__conteo"
            :class="{ 'limpieza-imagenes__conteo--advertencia': resultado.errores > 0 }"
          >
            <span>Errores</span>
            <strong>{{ resultado.errores }}</strong>
          </div>
        </div>

        <p class="limpieza-imagenes__resultado-fecha">
          Ejecutado el {{ formatearFecha(resultado.ejecutadoEn) }}
        </p>
      </section>
    </div>

    <VaModal v-model="modalConfirmacionVisible" hide-default-actions blur>
      <h3 class="va-h5">¿Ejecutar la limpieza ahora?</h3>
      <p class="mt-2">
        Esta acción elimina archivos huérfanos de forma definitiva. ¿Querés ejecutar la limpieza ahora?
      </p>

      <template #footer>
        <div class="limpieza-imagenes__modal-footer">
          <VaButton preset="secondary" @click="modalConfirmacionVisible = false">
            Cancelar
          </VaButton>
          <VaButton
            color="primary"
            icon="mso-play_arrow"
            :loading="ejecutando"
            :disabled="guardando"
            @click="confirmarEjecucion"
          >
            Ejecutar limpieza
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminConfiguracionService from "../../services/adminConfiguracionService";
import { tienePermiso } from "../../services/authState";
import { formatearFecha } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";
import BaseAlert from "../../components/AlertaBase.vue";
import { useToast } from "vuestic-ui";

const INTERVALO_MINIMO = 1;
const INTERVALO_MAXIMO = 168;

export default {
  name: "ConfiguracionSchedulerLimpiezaImagenesView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      cargando: true,
      guardando: false,
      ejecutando: false,
      configuracion: null,
      form: {
        intervaloHoras: 24,
      },
      errorCarga: "",
      errorIntervalo: "",
      errorMessage: "",
      avisoLimpiando: "",
      resultado: null,
      modalConfirmacionVisible: false,
      toast: useToast(),
    };
  },
  computed: {
    puedeConfigurar() {
      return tienePermiso("ADMINISTRAR_CONFIGURACION");
    },
    intervaloActual() {
      const horas = Number(this.form.intervaloHoras);
      return Number.isInteger(horas) && horas > 0 ? horas : "—";
    },
    proximaEjecucionTexto() {
      return this.configuracion?.proximaEjecucion
        ? formatearFecha(this.configuracion.proximaEjecucion)
        : "No calculada";
    },
    ultimaEjecucionTexto() {
      return this.configuracion?.ultimaEjecucion
        ? formatearFecha(this.configuracion.ultimaEjecucion)
        : "Todavía no se ejecutó";
    },
  },
  async mounted() {
    await this.cargarConfiguracion();
  },
  methods: {
    async cargarConfiguracion({ silencioso = false } = {}) {
      if (!this.puedeConfigurar) return;

      if (!silencioso) {
        this.cargando = true;
        this.errorCarga = "";
        this.errorMessage = "";
        this.avisoLimpiando = "";
      }

      try {
        const response = await adminConfiguracionService.obtenerLimpiezaImagenes();
        const configuracion = response?.data || null;

        if (!configuracion) {
          if (!silencioso) {
            this.errorCarga = "No se pudo cargar la configuración del scheduler de limpieza de imágenes.";
          }
          return;
        }

        this.configuracion = configuracion;
        if (!silencioso) {
          this.form.intervaloHoras = configuracion.intervaloHoras;
        }
        this.errorCarga = "";
      } catch (error) {
        if (silencioso) return;

        const status = error?.response?.status;
        if (status === 403 && error?._esPermiso) {
          this.errorCarga = "No tenés permiso para esta sección.";
        } else {
          this.errorCarga = mensajeErrorApi(
            error,
            "No se pudo cargar la configuración del scheduler de limpieza de imágenes."
          );
        }
      } finally {
        if (!silencioso) this.cargando = false;
      }
    },

    validarIntervalo() {
      const horas = Number(this.form.intervaloHoras);

      if (
        !Number.isInteger(horas) ||
        horas < INTERVALO_MINIMO ||
        horas > INTERVALO_MAXIMO
      ) {
        this.errorIntervalo = `El intervalo debe ser un número entero entre ${INTERVALO_MINIMO} y ${INTERVALO_MAXIMO} horas.`;
        return false;
      }

      this.errorIntervalo = "";
      return true;
    },

    async guardarConfiguracion() {
      if (this.guardando || this.ejecutando) return;
      if (!this.validarIntervalo()) return;

      this.guardando = true;
      this.errorMessage = "";
      this.avisoLimpiando = "";

      try {
        const response = await adminConfiguracionService.actualizarLimpiezaImagenes({
          intervaloHoras: Number(this.form.intervaloHoras),
        });
        const configuracion = response?.data || null;

        if (configuracion) {
          this.configuracion = configuracion;
          this.form.intervaloHoras = configuracion.intervaloHoras;
        }

        this.toast.init({
          title: "Configuración guardada",
          message: "La próxima limpieza se ajustó al nuevo intervalo.",
          color: "success",
          position: "top-right",
          duration: 4000,
        });
      } catch (error) {
        const status = error?.response?.status;
        const mensaje = mensajeErrorApi(error, "No se pudo guardar la configuración.");

        if (status === 400) {
          this.errorIntervalo = mensaje;
        } else if (status === 403 && error?._esPermiso) {
          this.errorMessage = "No tenés permiso para esta sección.";
        } else {
          this.errorMessage = mensaje;
          if (!status || status >= 500) {
            this.toast.init({
              title: "Error del servidor",
              message: "No se pudo guardar la configuración. Intentalo nuevamente.",
              color: "danger",
              position: "top-right",
              duration: 6000,
            });
          }
        }
      } finally {
        this.guardando = false;
      }
    },

    abrirConfirmacion() {
      if (this.guardando || this.ejecutando) return;
      this.errorMessage = "";
      this.avisoLimpiando = "";
      this.modalConfirmacionVisible = true;
    },

    async confirmarEjecucion() {
      this.modalConfirmacionVisible = false;
      await this.ejecutarAhora();
    },

    async ejecutarAhora() {
      if (this.guardando || this.ejecutando) return;

      this.ejecutando = true;
      this.resultado = null;
      this.errorMessage = "";
      this.avisoLimpiando = "";

      try {
        const response = await adminConfiguracionService.ejecutarLimpiezaImagenesAhora();
        this.resultado = response?.data || null;

        if (this.resultado?.errores > 0) {
          this.toast.init({
            title: "Limpieza finalizada con errores",
            message: `${this.resultado.errores} operación(es) no se pudieron completar.`,
            color: "warning",
            position: "top-right",
            duration: 6000,
          });
        }

        await this.cargarConfiguracion({ silencioso: true });
      } catch (error) {
        const status = error?.response?.status;

        if (status === 409) {
          this.avisoLimpiando =
            error?.response?.data?.message ||
            "Ya hay una limpieza de imágenes en curso. Esperá a que termine e intentá nuevamente.";
        } else if (status === 403 && error?._esPermiso) {
          this.errorMessage = "No tenés permiso para esta sección.";
        } else {
          this.errorMessage = mensajeErrorApi(
            error,
            "No se pudo ejecutar la limpieza de imágenes."
          );

          if (!status || status >= 500) {
            this.toast.init({
              title: "Error del servidor",
              message: "No se pudo ejecutar la limpieza. Intentalo nuevamente.",
              color: "danger",
              position: "top-right",
              duration: 6000,
            });
          }
        }
      } finally {
        this.ejecutando = false;
      }
    },

    formatearFecha,
  },
};
</script>

<style scoped>
.limpieza-imagenes {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.limpieza-imagenes__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.limpieza-imagenes__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.limpieza-imagenes__card {
  margin-top: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.limpieza-imagenes__card--estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 8rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.limpieza-imagenes__spinner {
  width: 1.35rem;
  height: 1.35rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: limpieza-imagenes-girar 0.8s linear infinite;
}

@keyframes limpieza-imagenes-girar {
  to {
    transform: rotate(360deg);
  }
}

.limpieza-imagenes__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.limpieza-imagenes__campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-width: 22rem;
}

.limpieza-imagenes__ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.limpieza-imagenes__info-box {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.limpieza-imagenes__info-fila {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.limpieza-imagenes__info-icono {
  font-size: 1.4rem;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.limpieza-imagenes__info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin-bottom: 0.15rem;
}

.limpieza-imagenes__info-valor {
  font-size: 0.95rem;
  color: var(--color-text);
}

.limpieza-imagenes__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.limpieza-imagenes__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.limpieza-imagenes__estado-icono {
  font-size: 2.5rem;
}

.limpieza-imagenes__estado-texto {
  max-width: 32rem;
  margin: 0;
  line-height: 1.5;
}

.limpieza-imagenes__estado--error .limpieza-imagenes__estado-icono {
  color: var(--color-danger);
}

.limpieza-imagenes__resultado {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.limpieza-imagenes__resultado-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.limpieza-imagenes__resultado-icono {
  color: var(--color-primary);
  font-size: 1.6rem;
}

.limpieza-imagenes__resultado-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
}

.limpieza-imagenes__resultado-header p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

.limpieza-imagenes__conteos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.limpieza-imagenes__conteo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.75rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.limpieza-imagenes__conteo span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.limpieza-imagenes__conteo strong {
  color: var(--color-text);
  font-size: 1.35rem;
}

.limpieza-imagenes__conteo--advertencia {
  border-color: var(--color-warning);
}

.limpieza-imagenes__conteo--advertencia strong {
  color: var(--color-warning-text);
}

.limpieza-imagenes__resultado-fecha {
  margin: 0.75rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.limpieza-imagenes__modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 520px) {
  .limpieza-imagenes__card {
    padding: 1rem;
  }

  .limpieza-imagenes__actions {
    flex-direction: column;
  }

  .limpieza-imagenes__modal-footer {
    flex-direction: column-reverse;
  }
}
</style>
