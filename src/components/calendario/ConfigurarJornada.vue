<template>
  <VaModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    size="large"
    close-button
    hide-default-actions
  >
    <template #header>
      <h3 class="va-h5">Configurar jornada laboral</h3>
    </template>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <VaForm ref="form" :immediate="false" class="configurar-jornada">
      <div class="configurar-jornada__campo">
        <VaInput
          v-model="margen"
          :rules="[reglas.requerido, reglas.margenMinimo]"
          label="Margen de actividad (minutos)"
          type="number"
          hint="Buffer aplicado antes y después de cada actividad de proyecto."
        />
      </div>

      <div class="configurar-jornada__dias">
        <div
          v-for="curso in dias"
          :key="curso.diaSemana"
          class="configurar-jornada__dia"
          :class="{ 'configurar-jornada__dia--inactivo': !curso.habilitado }"
        >
          <div class="configurar-jornada__dia-cabecera">
            <label class="configurar-jornada__dia-toggle">
              <VaCheckbox
                :model-value="curso.habilitado"
                @update:model-value="(v) => toggleDia(curso, v)"
              />
              <span class="configurar-jornada__dia-nombre">{{ curso.nombre }}</span>
            </label>

            <label v-if="curso.habilitado" class="configurar-jornada__dia-partida-toggle">
              <VaSwitch
                v-model="curso.partida"
                size="small"
                @update:model-value="(v) => togglePartida(curso, v)"
              />
              <span>Jornada partida</span>
            </label>
          </div>

          <!-- Bloque de Horarios cuando el día está habilitado -->
          <div v-if="curso.habilitado" class="configurar-jornada__horarios-contenedor">
            <!-- Modalidad Corrida -->
            <div v-if="!curso.partida" class="configurar-jornada__bloque-horarios">
              <VaInput
                v-model="curso.horaInicioManana"
                type="time"
                label="Inicio de jornada"
                :rules="[reglas.requerido]"
              />
              <VaInput
                v-model="curso.horaFinTarde"
                type="time"
                label="Fin de jornada"
                :rules="[reglas.requerido, (v) => reglas.finPosteriorAInicio(curso.horaInicioManana, v)]"
              />
            </div>

            <!-- Modalidad Partida -->
            <div v-else class="configurar-jornada__partida-grid">
              <div class="configurar-jornada__seccion-turno">
                <span class="configurar-jornada__seccion-titulo">Mañana</span>
                <div class="configurar-jornada__bloque-horarios">
                  <VaInput
                    v-model="curso.horaInicioManana"
                    type="time"
                    label="Inicio mañana"
                    :rules="[reglas.requerido]"
                  />
                  <VaInput
                    v-model="curso.horaFinManana"
                    type="time"
                    label="Fin mañana"
                    :rules="[reglas.requerido, (v) => reglas.finPosteriorAInicio(curso.horaInicioManana, v, 'El fin de la mañana debe ser posterior a su inicio.')]"
                  />
                </div>
              </div>

              <div class="configurar-jornada__seccion-turno">
                <span class="configurar-jornada__seccion-titulo">Tarde</span>
                <div class="configurar-jornada__bloque-horarios">
                  <VaInput
                    v-model="curso.horaInicioTarde"
                    type="time"
                    label="Inicio tarde"
                    :rules="[reglas.requerido, (v) => reglas.finPosteriorAInicio(curso.horaFinManana, v, 'El bloque de la tarde debe comenzar después del fin del bloque de la mañana.')]"
                  />
                  <VaInput
                    v-model="curso.horaFinTarde"
                    type="time"
                    label="Fin tarde"
                    :rules="[reglas.requerido, (v) => reglas.finPosteriorAInicio(curso.horaInicioTarde, v, 'El fin de la tarde debe ser posterior a su inicio.')]"
                  />
                </div>
              </div>
            </div>
          </div>

          <span v-else class="configurar-jornada__dia-no">No laborable</span>
        </div>
      </div>
    </VaForm>

    <template #footer>
      <div class="configurar-jornada__modal-footer">
        <VaButton preset="secondary" @click="$emit('update:modelValue', false)">Cancelar</VaButton>
        <VaButton color="primary" :loading="guardando" @click="guardar">Guardar jornada</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import calendarioService from "../../services/calendarioService";
import BaseAlert from "../../components/AlertaBase.vue";
import { horaCorta, normalizarHoraEnvio } from "../../utils/horas";
import { mensajeErrorApi } from "../../utils/apiError";

const NOMBRES_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default {
  name: "ConfigurarJornada",
  emits: ["update:modelValue", "guardada"],
  components: {
    BaseAlert,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    jornada: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      margen: 30,
      dias: [],
      guardando: false,
      mensajeError: "",
      reglas: {
        requerido: (v) => (v != null && v !== "") || "Campo requerido.",
        margenMinimo: (v) => (v == null || v === "" || parseInt(v, 10) >= 0) || "Debe ser un número mayor o igual a 0.",
        finPosteriorAInicio: (inicio, fin, mensajePersonalizado) => {
          if (!fin || !inicio) return true;
          return fin > inicio || (mensajePersonalizado || "El horario de fin debe ser posterior al horario de inicio.");
        },
      },
    };
  },
  watch: {
    modelValue(valor) {
      if (valor) this.inicializar();
    },
  },
  methods: {
    inicializar() {
      this.mensajeError = "";
      const diasGuardados = (this.jornada?.dias || []).reduce((acc, d) => {
        acc[d.diaSemana] = d;
        return acc;
      }, {});

      this.margen = this.jornada?.margenActividadMinutos ?? 30;

      this.dias = NOMBRES_DIAS.map((nombre, i) => {
        const diaSemana = i + 1;
        const guardado = diasGuardados[diaSemana];
        const esPartida = !!(guardado?.horaFinManana && guardado?.horaInicioTarde);

        return {
          diaSemana,
          nombre,
          habilitado: !!guardado,
          partida: esPartida,
          horaInicioManana: horaCorta(guardado?.horaInicioManana) || "09:00",
          horaFinManana: horaCorta(guardado?.horaFinManana) || "13:00",
          horaInicioTarde: horaCorta(guardado?.horaInicioTarde) || "15:00",
          horaFinTarde: horaCorta(guardado?.horaFinTarde) || "18:00",
        };
      });
    },
    toggleDia(curso, valor) {
      curso.habilitado = valor;
    },
    togglePartida(curso, valor) {
      curso.partida = valor;
      if (valor) {
        if (!curso.horaFinManana) curso.horaFinManana = "13:00";
        if (!curso.horaInicioTarde) curso.horaInicioTarde = "15:00";
      }
    },
    validarDiaPartida(d) {
      const { horaInicioManana, horaFinManana, horaInicioTarde, horaFinTarde } = d;
      if (!horaInicioManana || !horaFinManana || !horaInicioTarde || !horaFinTarde) {
        return "Para una jornada partida se deben informar el fin del bloque de la mañana y el inicio del bloque de la tarde; para una jornada de corrido, ninguno de los dos.";
      }
      if (horaFinManana <= horaInicioManana) {
        return `En ${d.nombre}: El fin de la mañana debe ser posterior a su inicio.`;
      }
      if (horaInicioTarde <= horaFinManana) {
        return `En ${d.nombre}: El bloque de la tarde debe comenzar después del fin del bloque de la mañana.`;
      }
      if (horaFinTarde <= horaInicioTarde) {
        return `En ${d.nombre}: El fin de la tarde debe ser posterior a su inicio.`;
      }
      return null;
    },
    validarDiaCorrido(d) {
      const { horaInicioManana, horaFinTarde } = d;
      if (!horaInicioManana || !horaFinTarde) {
        return `En ${d.nombre}: Los horarios de inicio y fin son obligatorios.`;
      }
      if (horaFinTarde <= horaInicioManana) {
        return `En ${d.nombre}: El horario de fin debe ser posterior al horario de inicio.`;
      }
      return null;
    },
    async guardar() {
      const validado = await this.$refs.form.validate();
      if (!validado) return;

      const diasHabilitados = this.dias.filter((d) => d.habilitado);
      if (diasHabilitados.length === 0) {
        this.mensajeError = "Debes habilitar al menos un día en la jornada laboral.";
        return;
      }

      for (const d of diasHabilitados) {
        const errorValidacion = d.partida ? this.validarDiaPartida(d) : this.validarDiaCorrido(d);
        if (errorValidacion) {
          this.mensajeError = errorValidacion;
          return;
        }
      }

      const dias = diasHabilitados.map((d) => ({
        diaSemana: d.diaSemana,
        horaInicioManana: normalizarHoraEnvio(d.horaInicioManana),
        horaFinManana: d.partida ? normalizarHoraEnvio(d.horaFinManana) : null,
        horaInicioTarde: d.partida ? normalizarHoraEnvio(d.horaInicioTarde) : null,
        horaFinTarde: normalizarHoraEnvio(d.horaFinTarde),
      }));

      if (new Set(dias.map((d) => d.diaSemana)).size !== dias.length) {
        this.mensajeError = "No se puede repetir el mismo día de la semana en la jornada.";
        return;
      }

      this.guardando = true;
      this.mensajeError = "";
      try {
        await calendarioService.configurarJornada({
          margenActividadMinutos: parseInt(this.margen, 10),
          dias,
        });
        this.$emit("guardada");
      } catch (error) {
        this.mensajeError = mensajeErrorApi(error, "No se pudo guardar la jornada.");
      } finally {
        this.guardando = false;
      }
    },
  },
};
</script>

<style scoped>
.configurar-jornada {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.configurar-jornada__campo {
  max-width: 260px;
}

.configurar-jornada__dias {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.configurar-jornada__dia {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: var(--color-surface);
  transition: all 0.2s ease;
}

.configurar-jornada__dia--inactivo {
  background: #f9fafb;
  opacity: 0.75;
}

.configurar-jornada__dia-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.configurar-jornada__dia-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
}

.configurar-jornada__dia-nombre {
  min-width: 90px;
}

.configurar-jornada__dia-partida-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
}

.configurar-jornada__horarios-contenedor {
  width: 100%;
}

.configurar-jornada__bloque-horarios {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.configurar-jornada__partida-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

@media (max-width: 640px) {
  .configurar-jornada__partida-grid {
    grid-template-columns: 1fr;
  }
}

.configurar-jornada__seccion-turno {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.configurar-jornada__seccion-titulo {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-primary);
}

.configurar-jornada__dia-no {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.configurar-jornada__modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
}
</style>
