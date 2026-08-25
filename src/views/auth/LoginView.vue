<template>
  <VaForm ref="form" @submit.prevent="iniciarSesion" class="auth-page">
    <h1 class="font-semibold text-4xl mb-3">Iniciar Sesión</h1>
    
    
    <VaInput
      v-model="credenciales.correo"
      :rules="[reglas.requerido, reglas.email]"
      class="mb-4"
      label="Correo"
      type="email"
    />

    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="credenciales.password"
        :rules="[reglas.requerido]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-1"
        label="Contraseña"
        @clickAppendInner.stop="isPasswordVisible.value = !isPasswordVisible.value"
      >
        <template #appendInner>
          <VaIcon
            :name="isPasswordVisible.value ? 'mso-visibility_off' : 'mso-visibility'"
            class="cursor-pointer"
            color="grey"
          />
        </template>
      </VaInput>
    </VaValue>

    <p class="text-xs mb-4 text-left">
      <RouterLink :to="{ name: 'recuperar-password' }" class="link-recuperar">Olvidé mi contraseña</RouterLink>
    </p>

   <VaButton type="submit" size="medium" class="auth-button">Iniciar sesión</VaButton>

    <p class="text-base mb-4 leading-9 text-center" color="gray-700">
      ¿Nuevo en ModaLink?
      <RouterLink :to="{ name: 'registro' }" class="font-semibold text-primary">Regístrate</RouterLink>
    </p>

    <!-- alertas -->
    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

</VaForm>
  
</template>

<script>
import authService from "../../services/authService";
import { marcarSesionRestaurada } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "LoginView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      credenciales: {
        correo: "",
        password: "",
      },
      successMessage: "",
      errorMessage: "",
      reglas: {
        requerido: (v) => !!v || 'Este campo es requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
      }
    };
  },
  methods: {
    async iniciarSesion() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      this.successMessage = "";
      this.errorMessage = "";

      try {
        const response = await authService.login(this.credenciales);
        const usuario = response?.data?.usuario || null;
        marcarSesionRestaurada(usuario);
        this.successMessage = "Inicio de sesión exitoso.";

        if (usuario?.rolGlobal === "Administrador") {
          this.$router.push({ name: "gestion-usuarios" });
        } else {
          this.$router.push({ name: "home" });
        }
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
  max-width: 400px;
  margin: 0 auto;
}


.auth-page h1 {
  font-size: 2.5rem;
  font-weight: 800;
  text-transform: uppercase;
  background: linear-gradient(135deg, #FF512F 0%, #b865a4 50%, #240b36 100%);
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
}

.link-recuperar {
  font-size: 12px; 
  color: #6a7385; 
  text-decoration: none; 
  transition: color 0.2s ease; 
}

.link-recuperar:hover {
  color: #374151; 
  text-decoration: underline;
}

</style>