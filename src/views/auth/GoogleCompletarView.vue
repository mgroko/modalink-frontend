<template>
  <VaForm ref="form" class="google-completar" @submit.prevent="finalizarRegistro">
    <h1>Completá tu registro</h1>
    <p class="google-completar__ayuda">
      Ya validamos tu identidad con Google. Solo faltan estos datos para terminar de crear tu cuenta.
    </p>

    <p v-if="correo" class="google-completar__correo">
      Cuenta de Google: <strong>{{ correo }}</strong>
    </p>

    <div v-if="cargando" class="google-completar__cargando">
      Cargando datos...
    </div>

    <div v-else class="google-completar__campos">
      <div class="flex flex-col sm:flex-row gap-3">
        <VaInput v-model="datos.nombre" :rules="[reglas.requerido]" class="flex-1" label="Nombre" />
        <VaInput v-model="datos.apellido" :rules="[reglas.requerido]" class="flex-1" label="Apellido" />
      </div>

      <VaInput v-model="datos.dni" :rules="[reglas.requerido, reglas.dni]" label="DNI" />
      <VaInput
        v-model="datos.fechaNacimiento"
        :rules="[reglas.requerido]"
        label="Fecha de nacimiento"
        type="date"
      />
      <VaSelect
        v-model="datos.genero"
        :options="opcionesGenero"
        value-by="value"
        text-by="text"
        :rules="[reglas.requerido]"
        class="w-full"
        label="Género con el que te identificas"
      />
    </div>

    <VaButton
      type="submit"
      size="medium"
      class="google-completar__boton"
      :disabled="cargando"
      :loading="enviando"
    >
      Finalizar registro
    </VaButton>

    <BaseAlert :message="errorMessage" type="error" />
  </VaForm>
</template>

<script>
import authService from "../../services/authService";
import { marcarSesionRestaurada, refrescarSesion } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "GoogleCompletarView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      datos: {
        nombre: "",
        apellido: "",
        dni: "",
        fechaNacimiento: "",
        genero: "",
      },
      correo: "",
      opcionesGenero: [
        { text: "Mujer", value: "MUJER" },
        { text: "Hombre", value: "HOMBRE" },
        { text: "No binario", value: "NO_BINARIO" },
        { text: "Prefiero no decirlo", value: "NO_DECIRLO" },
      ],
      cargando: true,
      enviando: false,
      errorMessage: "",
      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        dni: (v) => /^[0-9]+$/.test(v || "") || "El DNI debe contener solo números",
      },
    };
  },
  async mounted() {
    try {
      const response = await authService.obtenerRegistroPendienteGoogle();
      const pendiente = response?.data || {};
      this.datos.nombre = pendiente.nombre || "";
      this.datos.apellido = pendiente.apellido || "";
      this.correo = pendiente.correo || "";
    } catch {
      this.$router.replace({ name: "login", query: { googleError: "registro_expirado" } });
    } finally {
      this.cargando = false;
    }
  },
  methods: {
    async finalizarRegistro() {
      const isValid = await this.$refs.form.validate();
      if (!isValid) return;

      this.enviando = true;
      this.errorMessage = "";

      try {
        const response = await authService.completarRegistroGoogle(this.datos);
        const usuario = response?.data?.usuario || null;
        marcarSesionRestaurada(usuario);
        const refrescado = await refrescarSesion();
        this.entrarSegun({ ...usuario, ...refrescado });
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo completar el registro. Revisá los datos e intentá de nuevo.";
      } finally {
        this.enviando = false;
      }
    },
    entrarSegun(usuario) {
      if (usuario?.rolGlobal === "Administrador") {
        this.$router.replace({ name: "dashboard-admin" });
        return;
      }
      if (usuario?.idPerfilActivo != null) {
        this.$router.replace({ name: "home" });
        return;
      }
      this.$router.replace({ name: "dashboard-usuario" });
    },
  },
};
</script>

<style scoped>
.google-completar {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.google-completar h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.google-completar__ayuda {
  color: var(--va-secondary);
  margin-bottom: 1rem;
}

.google-completar__correo {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.google-completar__campos {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.google-completar__cargando {
  padding: 1rem 0;
  color: var(--va-secondary);
}

.google-completar__boton {
  width: 200px;
  display: flex;
  justify-content: center;
  margin: 0 auto 1rem auto;
}
</style>
