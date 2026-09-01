<template>
  <VaModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    size="medium"
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
          <label class="configurar-jornada__dia-toggle">
            <VaCheckbox
              :model-value="curso.habilitado"
              @update:model-value="(v) => toggleDia(curso, v)"
            />
            <span>{{ curso.nombre }}</span>
          </label>

          <div v-if="curso.habilitado" class="configurar-jornada__dia-horarios">
            <VaInput
              v-model="curso.horaInicio"
              type="time"
              label="Inicio"
              :rules="[reglas.horaValida]"
              :disabled="!curso.habilitado"
            />
            <VaInput
              v-model="curso.horaFin"
              type="time"
              label="Fin"
              :rules="[reglas.horaValida, (v) => reglas.finPosterior(curso, v)]"
              :disabled="!curso.habilitado"
            />
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
      margen: 60,
      dias: [],
      guardando: false,
      mensajeError: "",
      reglas: {
        requerido: (v) => !!v || "Campo requerido.",
        margenMinimo: (v) => (v == null || v === "" || parseInt(v, 10) >= 0) || "Debe ser un número mayor o igual a 0.",
        horaValida: (v) => !!v || "Horario requerido.",
        finPosterior: (curso, v) => {
          if (!v || !curso.horaInicio) return "Horario requerido.";
          return v > curso.horaInicio || "El horario de fin debe ser posterior al de inicio.";
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

      this.margen = this.jornada?.margenActividadMinutos ?? 60;

      this.dias = NOMBRES_DIAS.map((nombre, i) => {
        const diaSemana = i + 1;
        const guardado = diasGuardados[diaSemana];
        return {
          diaSemana,
          nombre,
          habilitado: !!guardado,
          horaInicio: guardado?.horaInicio || "09:00:00",
          horaFin: guardado?.horaFin || "18:00:00",
        };
      });
    },
    toggleDia(curso, valor) {
      curso.habilitado = valor;
    },
    async guardar() {
      const validado = await this.$refs.form.validate();
      if (!validado) return;

      const dias = this.dias
        .filter((d) => d.habilitado)
        .map((d) => ({
          diaSemana: d.diaSemana,
          horaInicio: this.normalizarHora(d.horaInicio),
          horaFin: this.normalizarHora(d.horaFin),
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
        this.mensajeError =
          error?.response?.data?.message || "No se pudo guardar la jornada.";
      } finally {
        this.guardando = false;
      }
    },
    normalizarHora(hora) {
      const partes = (hora || "").split(":");
      if (partes.length === 2) return `${hora}:00`;
      return hora;
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
  gap: 0.35rem;
}

.configurar-jornada__dia {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: var(--color-surface);
}

.configurar-jornada__dia--inactivo {
  background: #f9fafb;
  opacity: 0.75;
}

.configurar-jornada__dia-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  min-width: 120px;
  cursor: pointer;
}

.configurar-jornada__dia-horarios {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
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
