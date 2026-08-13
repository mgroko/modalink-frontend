<template>
  <VaForm ref="form" @submit.prevent="iniciarSesion" class="auth-page">
    <h1 class="font-semibold text-4xl mb-4">Iniciar Sesión</h1>
    <p class="text-base mb-4 leading-5">
      ¿Nuevo en ModaLink?
      <RouterLink :to="{ name: 'registro' }" class="font-semibold text-primary">Regístrate</RouterLink>
    </p>

    <VaInput
      v-model="credenciales.correo"
      :rules="[reglas.requerido, reglas.email]"
      class="mb-4"
      label="Correo"
      type="email"
    />

    <!-- VaValue nos permite manejar el estado de visibilidad del password en el template sin usar refs -->
    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="credenciales.password"
        :rules="[reglas.requerido]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
        class="mb-4"
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

    <p class="text-sm mb-4 text-right">
      <RouterLink :to="{ name: 'recuperar-password' }" class="text-primary">¿Olvidaste tu contraseña?</RouterLink>
    </p>


    <div class="flex justify-center mt-4">
      <VaButton class="w-full" type="submit">Ingresar</VaButton>
    </div>

    <!-- alertas nuevas -->
    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

</VaForm>
  
</template>

<script>
import authService from "../../services/authService";
import { setUsuario } from "../../services/authState";
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
      // Disparamos las validaciones de Vuestic
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      this.successMessage = "";
      this.errorMessage = "";

      try {
        const response = await authService.login(this.credenciales);
        const usuario = response?.data?.usuario || null;
        setUsuario(usuario);
        console.log("Usuario autenticado:", usuario);
        this.successMessage = "Inicio de sesión exitoso.";
        // Si usás vue-router, podés agregar: this.$router.push({ name: 'dashboard' })
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
</style>