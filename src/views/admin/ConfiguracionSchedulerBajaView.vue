<template>
  <div class="configuracion-baja">
    <section class="configuracion-baja__encabezado">
      <h1>Programación de Bajas</h1>
      <p class="configuracion-baja__subtitulo">
        Configurá la hora en que el sistema marca como BAJA las cuentas y perfiles PENDIENTE_BAJA cuyo plazo venció.
      </p>
    </section>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <div v-if="!puedeConfigurar" class="configuracion-baja__estado">
      <span class="material-symbols-outlined configuracion-baja__estado-icono">lock</span>
      No tenés permisos para administrar la configuración del scheduler de bajas.
    </div>

    <div v-else-if="cargando" class="configuracion-baja__estado">
      <span class="material-symbols-outlined configuracion-baja__estado-icono">hourglass_empty</span>
      Cargando configuración...
    </div>

    <div v-else class="configuracion-baja__card">
      <form @submit.prevent="guardarConfiguracion" class="configuracion-baja__form">
        <div class="configuracion-baja__form-row">
          <div class="configuracion-baja__field-group">
            <VaInput
              v-model.number="form.hora"
              label="Hora (0 - 23)"
              type="number"
              min="0"
              max="23"
              required
              placeholder="Ej: 3"
              :rules="[reglas.hora]"
            />
          </div>

          <div class="configuracion-baja__field-group">
            <VaInput
              v-model.number="form.minuto"
              label="Minuto (0 - 59)"
              type="number"
              min="0"
              max="59"
              required
              placeholder="Ej: 30"
              :rules="[reglas.minuto]"
            />
          </div>

          <div class="configuracion-baja__field-group">
            <VaInput
              v-model.number="form.diasBaja"
              label="Días de plazo de baja (1 - 365)"
              type="number"
              min="1"
              max="365"
              required
              placeholder="Ej: 30"
              :rules="[reglas.diasBaja]"
            />
          </div>
        </div>

        <div v-if="configuracion" class="configuracion-baja__info-box">
          <div class="configuracion-baja__info-fila">
            <span class="material-symbols-outlined configuracion-baja__info-icono">schedule</span>
            <div>
              <p class="configuracion-baja__info-label">Expresión Cron</p>
              <code class="configuracion-baja__info-cron">{{ configuracion.cron }}</code>
            </div>
          </div>
          <div class="configuracion-baja__info-fila">
            <span class="material-symbols-outlined configuracion-baja__info-icono">update</span>
            <div>
              <p class="configuracion-baja__info-label">Próxima ejecución</p>
              <p class="configuracion-baja__info-valor">{{ formatearFecha(configuracion.proximaEjecucion) }}</p>
            </div>
          </div>
          <div class="configuracion-baja__info-fila">
            <span class="material-symbols-outlined configuracion-baja__info-icono">event_available</span>
            <div>
              <p class="configuracion-baja__info-label">Plazo de baja</p>
              <p class="configuracion-baja__info-valor">{{ configuracion.diasBaja }} día(s)</p>
            </div>
          </div>
        </div>

        <div class="configuracion-baja__actions">
          <VaButton
            type="submit"
            color="primary"
            icon="mso-save"
            :loading="guardando"
            :disabled="ejecutando"
          >
            {{ guardando ? 'Guardando...' : 'Guardar Configuración' }}
          </VaButton>

          <VaButton
            type="button"
            preset="secondary"
            icon="mso-play_arrow"
            :loading="ejecutando"
            :disabled="guardando"
            @click="ejecutarManualmente"
          >
            {{ ejecutando ? 'Ejecutando...' : 'Ejecutar Ahora' }}
          </VaButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import adminConfiguracionService from "../../services/adminConfiguracionService";
import { tienePermiso } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "ConfiguracionSchedulerBajaView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      cargando: false,
      guardando: false,
      ejecutando: false,
      configuracion: null,
      form: {
        hora: 3,
        minuto: 0,
        diasBaja: 30,
      },
      successMessage: "",
      errorMessage: "",
      reglas: {
        hora: (v) =>
          (v >= 0 && v <= 23 && Number.isInteger(Number(v))) || "La hora debe estar entre 0 y 23.",
        minuto: (v) =>
          (v >= 0 && v <= 59 && Number.isInteger(Number(v))) || "El minuto debe estar entre 0 y 59.",
        diasBaja: (v) =>
          (v >= 1 && v <= 365 && Number.isInteger(Number(v))) || "El plazo debe estar entre 1 y 365 días.",
      },
    };
  },
  computed: {
    puedeConfigurar() {
      return tienePermiso("ADMINISTRAR_CONFIGURACION");
    },
  },
  async mounted() {
    await this.cargarDatos();
  },
  methods: {
    async cargarDatos() {
      if (!this.puedeConfigurar) return;
      this.cargando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminConfiguracionService.obtenerBaja();
        this.configuracion = response?.data || null;
        if (this.configuracion) {
          this.form.hora = this.configuracion.hora;
          this.form.minuto = this.configuracion.minuto;
          this.form.diasBaja = this.configuracion.diasBaja;
        }
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo cargar la configuración del scheduler de bajas.";
      } finally {
        this.cargando = false;
      }
    },

    async guardarConfiguracion() {
      if (!this.validarFormulario()) return;

      this.guardando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminConfiguracionService.actualizarBaja({
          hora: Number(this.form.hora),
          minuto: Number(this.form.minuto),
          diasBaja: Number(this.form.diasBaja),
        });
        this.configuracion = response?.data || null;
        if (this.configuracion) {
          this.form.hora = this.configuracion.hora;
          this.form.minuto = this.configuracion.minuto;
          this.form.diasBaja = this.configuracion.diasBaja;
        }
        this.successMessage = "Configuración del scheduler de bajas actualizada con éxito.";
      } catch (error) {
        const mensaje = error?.response?.data?.message || "No se pudieron guardar los cambios.";
        this.errorMessage = mensaje;
      } finally {
        this.guardando = false;
      }
    },

    ejecutarManualmente() {
      if (!window.confirm("¿Desea ejecutar ahora la expiración de bajas vencidas? Las cuentas y perfiles PENDIENTE_BAJA con plazo vencido pasarán a BAJA.")) {
        return;
      }
      this.ejecutarAhora();
    },

    async ejecutarAhora() {
      this.ejecutando = true;
      this.successMessage = "";
      this.errorMessage = "";
      try {
        const response = await adminConfiguracionService.ejecutarBajaAhora();
        const res = response?.data;
        this.successMessage = res?.mensaje || "Tarea ejecutada con éxito.";
        if (res?.registrosAfectados != null) {
          this.successMessage += ` (${res.registrosAfectados} registro(s) afectado(s))`;
        }
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo ejecutar la tarea manual.";
      } finally {
        this.ejecutando = false;
      }
    },

    validarFormulario() {
      const hora = Number(this.form.hora);
      const minuto = Number(this.form.minuto);
      const diasBaja = Number(this.form.diasBaja);

      if (!Number.isInteger(hora) || hora < 0 || hora > 23) {
        this.errorMessage = "La hora debe ser un número entero entre 0 y 23.";
        return false;
      }
      if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) {
        this.errorMessage = "El minuto debe ser un número entero entre 0 y 59.";
        return false;
      }
      if (!Number.isInteger(diasBaja) || diasBaja < 1 || diasBaja > 365) {
        this.errorMessage = "El plazo de baja debe ser un número entero entre 1 y 365 días.";
        return false;
      }
      this.errorMessage = "";
      return true;
    },

    formatearFecha(iso) {
      if (!iso) return "No calculada";
      return new Date(iso).toLocaleString();
    },
  },
};
</script>

<style scoped>
.configuracion-baja {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.configuracion-baja__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.configuracion-baja__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.configuracion-baja__card {
  margin-top: 1.5rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.configuracion-baja__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.configuracion-baja__form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.configuracion-baja__info-box {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.configuracion-baja__info-fila {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.configuracion-baja__info-icono {
  font-size: 1.4rem;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.configuracion-baja__info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  margin-bottom: 0.15rem;
}

.configuracion-baja__info-cron {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-text);
  background: #ececf3;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.configuracion-baja__info-valor {
  font-size: 0.95rem;
  color: var(--color-text);
}

.configuracion-baja__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.configuracion-baja__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.configuracion-baja__estado-icono {
  font-size: 2.5rem;
}
</style>
