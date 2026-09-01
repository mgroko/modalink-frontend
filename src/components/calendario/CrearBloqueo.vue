<template>
  <VaModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    size="medium"
    close-button
    hide-default-actions
  >
    <template #header>
      <h3 class="va-h5">Agregar bloqueo de disponibilidad</h3>
    </template>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <VaForm ref="form" :immediate="false" class="crear-bloqueo">
      <div class="crear-bloqueo__campo">
        <VaInput
          v-model="fechaInicio"
          :rules="[reglas.requerido]"
          label="Fecha y hora de inicio"
          type="datetime-local"
        />
      </div>

      <div class="crear-bloqueo__campo">
        <VaInput
          v-model="fechaFin"
          :rules="[reglas.requerido]"
          label="Fecha y hora de fin"
          type="datetime-local"
          hint="Debe ser posterior a la fecha de inicio."
        />
      </div>

      <div class="crear-bloqueo__campo">
        <VaInput
          v-model="motivo"
          label="Motivo (opcional)"
          type="text"
          placeholder="Ej: Vacaciones, compromiso personal..."
          maxlength="200"
          hint="Máximo 200 caracteres."
        />
      </div>
    </VaForm>

    <template #footer>
      <div class="crear-bloqueo__modal-footer">
        <VaButton preset="secondary" @click="$emit('update:modelValue', false)">Cancelar</VaButton>
        <VaButton color="primary" :loading="creando" @click="crear">Agregar bloqueo</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import calendarioService from "../../services/calendarioService";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "CrearBloqueo",
  emits: ["update:modelValue", "creado"],
  components: {
    BaseAlert,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      fechaInicio: "",
      fechaFin: "",
      motivo: "",
      creando: false,
      mensajeError: "",
      reglas: {
        requerido: (v) => !!v || "Campo requerido.",
      },
    };
  },
  watch: {
    modelValue(valor) {
      if (valor) {
        this.mensajeError = "";
        this.fechaInicio = "";
        this.fechaFin = "";
        this.motivo = "";
      }
    },
  },
  methods: {
    async crear() {
      const validado = await this.$refs.form.validate();
      if (!validado) return;

      const inicio = this.parseFecha(this.fechaInicio);
      const fin = this.parseFecha(this.fechaFin);

      if (!inicio || !fin) {
        this.mensajeError = "Formato de fecha inválido.";
        return;
      }

      if (fin <= inicio) {
        this.mensajeError = "La fecha y hora de fin debe ser posterior a la de inicio.";
        return;
      }

      this.creando = true;
      this.mensajeError = "";
      try {
        await calendarioService.crearBloqueo({
          fechaHoraInicio: inicio,
          fechaHoraFin: fin,
          motivo: this.motivo || null,
        });
        this.$emit("creado");
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo crear el bloqueo.";
      } finally {
        this.creando = false;
      }
    },
    parseFecha(valor) {
      if (!valor) return null;
      return valor;
    },
  },
};
</script>

<style scoped>
.crear-bloqueo {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.crear-bloqueo__campo {
  display: flex;
  flex-direction: column;
}

.crear-bloqueo__modal-footer {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  width: 100%;
}
</style>
