<template>
  <VaForm ref="form" @submit.prevent="iniciarSesion" class="auth-page">
    <h1 class="auth-title">Te damos la bienvenida</h1>
    <p class="auth-subtitle">Ingresá para seguir conectando con tu red de moda.</p>

    <button type="button" class="auth-google" @click="iniciarConGoogle">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.802 9.89C34.153 6.242 29.335 4 24 4 12.953 4 4 12.953 4 24s8.953 20 20 20 20-8.953 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 2.024C14.427 12.087 18.868 9 24 9c3.059 0 5.842 1.154 7.961 3.039l5.841-4.148C34.153 6.242 29.335 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 2.016C9.451 39.139 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      Continuar con Google
    </button>

    <div class="auth-divider"><span>o con tu correo</span></div>

    <VaInput
      v-model="credenciales.correo"
      :rules="[reglas.requerido, reglas.email]"
      label="Correo"
      type="email"
    />

    <VaValue v-slot="isPasswordVisible" :default-value="false">
      <VaInput
        v-model="credenciales.password"
        :rules="[reglas.requerido]"
        :type="isPasswordVisible.value ? 'text' : 'password'"
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

    <VaButton type="submit" size="large" block class="auth-submit">Iniciar sesión</VaButton>

    <p class="auth-footer">
      ¿Nuevo en ModaLink?
      <RouterLink :to="{ name: 'registro' }">Registrate</RouterLink>
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
import "../../styles/auth.css";
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
    this.mostrarErrorGoogle();
    this.mostrarAvisoBajaCuenta();
  },
  methods: {
    iniciarConGoogle() {
      this.errorMessage = "";
      authService.iniciarSesionGoogle();
    },
    mostrarErrorGoogle() {
      const codigo = this.$route.query?.googleError;
      if (!codigo) return;

      const mensajes = {
        google_auth_failed: "No se pudo completar el inicio de sesión con Google. Intentá de nuevo.",
        sesion_activa: "Ya tenés una sesión activa. Cerrá sesión antes de usar Google.",
        registro_expirado: "El proceso de registro con Google expiró. Volvé a intentarlo.",
      };
      this.errorMessage = mensajes[codigo] || "No se pudo iniciar sesión con Google.";
    },
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
      // Destino guardado (?redirect=...) para volver a la ruta de origen
      // tras re-autenticarse (ej. ver un perfil con sesión expirada).
      const destino = this.destinoSeguro();
      if (destino) {
        this.$router.push(destino);
        return;
      }
      if (usuario?.rolGlobal === "Administrador") {
        this.$router.push({ name: "dashboard-admin" });
      } else if (usuario?.idPerfilActivo != null) {
        this.$router.push({ name: "home" });
      } else {
        this.$router.push({ name: "dashboard-usuario" });
      }
    },
    destinoSeguro() {
      const redirect = this.$route.query?.redirect;
      if (typeof redirect !== "string") return null;
      // Solo rutas internas (mismo origin): evita open redirects.
      if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
      if (redirect.startsWith("/login")) return null;
      return redirect;
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
