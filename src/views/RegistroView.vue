<template>
  <section class="auth-page">
    <h1>Registro</h1>

    <form class="auth-form" @submit.prevent="registrarUsuario">
      <label>
        Nombre
        <input v-model="datosUsuario.nombre" type="text" autocomplete="given-name" required />
      </label>

      <label>
        Apellido
        <input v-model="datosUsuario.apellido" type="text" autocomplete="family-name" required />
      </label>

      <label>
        DNI
        <input v-model="datosUsuario.dni" type="text" required />
      </label>

      <label>
        Fecha de nacimiento
        <input v-model="datosUsuario.fechaNacimiento" type="date" required />
      </label>

      <label>
        Correo
        <input v-model="datosUsuario.correo" type="email" autocomplete="email" required />
      </label>

      <label>
        Contraseña
        <input v-model="datosUsuario.password" type="password" autocomplete="new-password" required />
      </label>

      <button type="submit">Registrarme</button>
    </form>

    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </section>
</template>

<script>
import authService from "../services/authService";
import { setUsuario } from "../services/authState";

export default {
  name: "RegistroView",
  data() {
    return {
      datosUsuario: {
        nombre: "",
        apellido: "",
        dni: "",
        fechaNacimiento: "",
        correo: "",
        password: "",
      },
      successMessage: "",
      errorMessage: "",
    };
  },
  methods: {
    async registrarUsuario() {
      this.successMessage = "";
      this.errorMessage = "";

      try {
        const response = await authService.registrar(this.datosUsuario);
        const usuario = response?.data?.usuario || null;
        setUsuario(usuario);
        console.log("Usuario registrado/autenticado:", usuario);
        this.successMessage = "Registro exitoso.";
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo completar el registro. Verificá los datos ingresados.";
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
