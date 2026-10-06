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

    <VaModal
      v-model="modalReactivarVisible"
      blur
      hide-default-actions
    >
      <h3 class="va-h5">Tu cuenta está pendiente de baja</h3>
      <p class="mt-2">{{ textoBajaModal }}</p>
      <p class="mt-2" v-if="diasBajaModal != null">
        Quedan <strong>{{ diasBajaModal }} días</strong> para reactivarla. Si reactivás tu cuenta,
        se cancelará la solicitud de baja y todo volverá a la normalidad.
      </p>
      <p class="mt-2">
        Si preferís no continuar, cerrá este mensaje y volvé cuando quieras.
      </p>

      <template #footer>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; width: 100%; margin-top: 1rem;">
          <VaButton 
            preset="secondary" 
            color="primary" 
            :disabled="reactivando"
            @click="cancelarReactivacion"
          >
            Cancelar
          </VaButton>
          <VaButton 
            color="primary" 
            :loading="reactivando"
            @click="reactivarCuenta"
          >
            Reactivar cuenta
          </VaButton>
        </div>
      </template>
    </VaModal>
  </VaForm>
  
</template>

<script>
import authService from "../../services/authService";
import {
  marcarSesionRestaurada,
  refrescarSesion,
  consumirAvisoBajaCuenta,
  limpiarBajaCuenta,
} from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import { formatearFecha, diasRestantes } from "../../utils/fechas";

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
      modalReactivarVisible: false,
      bajaPendiente: null,
      reactivando: false,
      reglas: {
        requerido: (v) => !!v || 'Este campo es requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
      }
    };
  },
  computed: {
    textoBajaModal() {
      const baja = this.bajaPendiente;
      if (baja?.message) return baja.message;
      if (baja?.fechaLimite) {
        return `Tu cuenta está pendiente de baja. Reactívala antes del ${formatearFecha(baja.fechaLimite)} para poder iniciar sesión.`;
      }
      return "Tu cuenta está pendiente de baja. Reactívala para poder iniciar sesión.";
    },
    diasBajaModal() {
      const baja = this.bajaPendiente;
      if (baja?.diasRestantes != null) return baja.diasRestantes;
      return diasRestantes(baja?.fechaLimite);
    },
  },
  mounted() {
    this.mostrarAvisoBajaCuenta();
  },
  methods: {
    async iniciarSesion() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;

      this.successMessage = "";
      this.errorMessage = "";

      try {
        const response = await authService.login(this.credenciales);
        const usuarioLogin = response?.data?.usuario || null;
        marcarSesionRestaurada(usuarioLogin);

        // Flujo 1: re-consultar /auth/me para obtener idPerfilActivo autoritativo,
        // conservando campos del login que /auth/me podría no exponer.
        const refrescado = await refrescarSesion();

        this.successMessage = "Inicio de sesión exitoso.";
        this.entrarSegun({ ...usuarioLogin, ...refrescado });
      } catch (error) {
        const data = error?.response?.data;
        if (error?.response?.status === 403 && data?.codigo === "CUENTA_PENDIENTE_BAJA") {
          this.bajaPendiente = {
            message: data?.message || null,
            fechaLimite: data?.fechaLimite || null,
            diasRestantes: data?.diasRestantes ?? null,
          };
          this.modalReactivarVisible = true;
          return;
        }
        this.errorMessage =
          data?.message || "No se pudo iniciar sesión. Verificá los datos ingresados.";
      }
    },
    entrarSegun(usuario) {
      if (usuario?.rolGlobal === "Administrador") {
        this.$router.push({ name: "dashboard-admin" });
      } else if (usuario?.idPerfilActivo != null) {
        this.$router.push({ name: "home" });
      } else {
        this.$router.push({ name: "dashboard-usuario" });
      }
    },
    async reactivarCuenta() {
      if (this.reactivando) return;
      this.reactivando = true;
      this.errorMessage = "";

      try {
        // Sin sesión previa (el login 403 no emite cookie): se reenvían credenciales.
        const response = await authService.reactivarCuentaDesdeLogin(this.credenciales);
        const usuarioLogin = response?.data?.usuario || null;

        limpiarBajaCuenta();
        this.modalReactivarVisible = false;
        this.bajaPendiente = null;
        marcarSesionRestaurada(usuarioLogin);
        const refrescado = await refrescarSesion();

        this.successMessage = "Cuenta reactivada. Tu solicitud de baja fue cancelada.";
        this.entrarSegun({ ...usuarioLogin, ...refrescado });
      } catch (error) {
        const data = error?.response?.data;
        if (error?.response?.status === 409) {
          this.modalReactivarVisible = false;
          this.bajaPendiente = null;
          this.errorMessage =
            data?.message || "El plazo para reactivar la cuenta ha expirado.";
        } else {
          this.errorMessage = data?.message || "No se pudo reactivar la cuenta.";
        }
      } finally {
        this.reactivando = false;
      }
    },
    cancelarReactivacion() {
      this.modalReactivarVisible = false;
      this.bajaPendiente = null;
    },
    mostrarAvisoBajaCuenta() {
      const aviso = consumirAvisoBajaCuenta();
      if (!aviso) return;
      let texto = aviso.mensaje || "Solicitud de baja registrada.";
      if (aviso.fechaLimite) {
        texto += ` Podés reactivarla antes del ${formatearFecha(aviso.fechaLimite)}.`;
      }
      this.successMessage = texto;
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
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
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
  color: var(--color-text-muted); 
  text-decoration: none; 
  transition: color 0.2s ease; 
}

.link-recuperar:hover {
  color: var(--color-text); 
  text-decoration: underline;
}

</style>