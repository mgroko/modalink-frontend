<template>
  <VaForm ref="form" @submit.prevent="solicitarRecuperacion" class="auth-page">
    <h1 class="font-semibold text-4xl mb-4">Recuperar Contraseña</h1>
    <p class="text-base mb-4 leading-5">
      Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
      <br />
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary">Volver a Iniciar Sesión</RouterLink>
    </p>

    <VaInput
      v-model="correo"
      :rules="[reglas.requerido, reglas.email]"
      class="mb-4"
      label="Correo"
      type="email"
      :disabled="enviado"
    />

    <div class="flex justify-center mt-4">
      <VaButton class="w-full" type="submit" :disabled="enviado">Enviar enlace</VaButton>
    </div>

    <p v-if="successMessage" class="mt-4 text-green-600 font-semibold text-center">{{ successMessage }}</p>
    <p v-if="errorMessage" class="mt-4 text-red-600 font-semibold text-center">{{ errorMessage }}</p>
  </VaForm>
</template>

<script>
import authService from "../../services/authService";

export default {
  name: "RecuperarPasswordView",
  data() {
    return {
      correo: "",
      enviado: false,
      successMessage: "",
      errorMessage: "",
      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        email: (v) => /.+@.+\..+/.test(v) || "El correo debe ser válido",
      },
    };
  },
  methods: {
    async solicitarRecuperacion() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      this.successMessage = "";
      this.errorMessage = "";

      try {
        // TODO backend: aún no existe el endpoint de recuperación de contraseña.
        // authService.recuperarPassword espera POST /auth/recuperar-password { correo }
        // y debería responder 200 sin importar si el correo existe o no (por seguridad).
        await authService.recuperarPassword(this.correo);
        this.enviado = true;
        this.successMessage = "Si el correo está registrado, vas a recibir un enlace para restablecer tu contraseña.";
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo procesar la solicitud. Intentá nuevamente más tarde.";
      }
    },
  },
};
</script>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 0 auto;
}
</style>