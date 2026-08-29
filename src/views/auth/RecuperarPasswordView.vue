<template>
  <VaForm ref="form" @submit.prevent="solicitarRecuperacion" class="auth-page">
    <h1 class="font-semibold text-4xl mb-3">Recuperar Contraseña</h1>
    <p class="text-base mb-4 leading-5 color-gray-700">
      Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
      <br />
      
    </p>

    <VaInput
      v-model="correo"
      :rules="[reglas.requerido, reglas.email]"
      class="mb-4"
      label="Correo"
      type="email"
      :disabled="enviado"
    />

    <div class="flex flex-col items-center">
      <VaButton type="submit":disabled="enviado" class="auth-button"> Enviar enlace</VaButton>
      <RouterLink :to="{ name: 'login' }" class="link-login">Volver a Iniciar Sesión</RouterLink>
  
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
.auth-page h1 {
  font-size: 30px;
  font-weight: 800;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
  margin: 0 0 1.25rem 0;
}
.auth-button {
  width: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  margin-bottom: 10px;
}

.link-login {
  font-size: 12px; 
  color: var(--color-primary); 
  text-decoration: none; 
  transition: color 0.2s ease; 
  text-align: center;
}

.link-login:hover {
  color: var(--color-primary-dark); 
  text-decoration: underline;
}

</style>