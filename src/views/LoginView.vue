<template>
  <section class="auth-page">
    <h1>Login</h1>

    <form class="auth-form" @submit.prevent="iniciarSesion">
      <label>
        Correo
        <input v-model="credenciales.correo" type="email" autocomplete="email" required />
      </label>

      <label>
        Contraseña
        <input v-model="credenciales.password" type="password" autocomplete="current-password" required />
      </label>

      <button type="submit">Ingresar</button>
    </form>

    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </section>
</template>

<script>
import authService from "../services/authService";
import { setUsuario } from "../services/authState";

export default {
  name: "LoginView",
  data() {
    return {
      credenciales: {
        correo: "",
        password: "",
      },
      successMessage: "",
      errorMessage: "",
    };
  },
  methods: {
    async iniciarSesion() {
      this.successMessage = "";
      this.errorMessage = "";

      try {
        const response = await authService.login(this.credenciales);
        const usuario = response?.data?.usuario || null;
        setUsuario(usuario);
        console.log("Usuario autenticado:", usuario);
        this.successMessage = "Inicio de sesión exitoso.";
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo iniciar sesión. Verificá los datos ingresados.";
      }
    },
  },
};
</script>

<style scoped>
.auth-page {
  max-width: 360px;
}

.auth-form {
  display: grid;
  gap: 12px;
}

.auth-form label {
  display: grid;
  gap: 6px;
}

.auth-form input,
.auth-form button {
  font: inherit;
  padding: 10px 12px;
}

.success-message {
  color: #176f2c;
}

.error-message {
  color: #b42318;
}
</style>
