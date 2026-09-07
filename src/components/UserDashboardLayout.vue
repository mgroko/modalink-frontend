<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar__top">
        <div class="sidebar__user">
          <div class="sidebar__avatar">{{ inicialUsuario }}</div>
          <div class="sidebar__user-info">
            <span class="sidebar__user-name">{{ usuario?.nombre }} {{ usuario?.apellido }}</span>
            <span class="sidebar__user-email">{{ usuario?.correo }}</span>
          </div>
        </div>

        <button class="sidebar__notifications">
          <span class="material-symbols-outlined">notifications</span>
          <span>Notificaciones</span>
          <span class="sidebar__badge">2</span>
        </button>

        <div class="sidebar__section">
          <span class="sidebar__section-title">Acciones</span>
          <button class="sidebar__action" @click="$router.push({ name: 'dashboard-usuario' })">
            Inicio
          </button>
          <button class="sidebar__action" @click="$router.push({ name: 'crear-perfil' })">
            Crear nuevo perfil
          </button>
          <button class="sidebar__action" @click="$router.push({ name: 'modificar-datos' })">
            Modificar datos personales
          </button>
          <button class="sidebar__action" @click="$router.push({ name: 'calendario' })">
            Calendario
          </button>
          <button class="sidebar__action" @click="modalBajaVisible = true">
            Solicitar baja del sistema
          </button>
        </div>
      </div>

      <button class="sidebar__logout" @click="cerrarSesion">
        <span class="material-symbols-outlined">power_settings_new</span>
        Cerrar sesión
      </button>
    </aside>

    <div class="dashboard-main">
      <header class="dashboard-main__header">
        <div>
          <h1 class="dashboard-main__title">DASHBOARD</h1>
          <span class="dashboard-main__subtitle">{{ titulo }}</span>
        </div>
        <div class="dashboard-main__header-actions">
          <VaDropdown v-if="usuario" placement="bottom-end">
            <template #anchor>
              <button class="perfil-switcher">
                <span class="perfil-switcher__avatar">{{ inicialPerfil }}</span>
                <span class="perfil-switcher__nombre">{{ nombreArtisticoActivo || "Sin perfil activo" }}</span>
                <span class="material-symbols-outlined">expand_more</span>
              </button>
            </template>

            <VaDropdownContent class="perfil-switcher__menu">
              <div v-if="perfilesCargando" class="perfil-switcher__estado">
                Cargando perfiles...
              </div>

              <template v-else>
                <div class="perfil-switcher__grupo">
                  <span class="perfil-switcher__titulo">Perfil actual</span>
                  <div v-if="perfilActual" class="perfil-switcher__actual">
                    <span class="perfil-switcher__punto"></span>
                    {{ perfilActual.nombreArtistico }}
                  </div>
                  <div v-else class="perfil-switcher__actual perfil-switcher__actual--vacio">
                    Sin perfil activo
                  </div>
                </div>

                <div v-if="perfilesAlternativos.length" class="perfil-switcher__grupo">
                  <span class="perfil-switcher__titulo">Cambiar a</span>
                  <VaMenuItem
                    v-for="perfil in perfilesAlternativos"
                    :key="perfil.idPerfil"
                    class="perfil-switcher__item"
                    :disabled="perfil.estado !== 'Activo'"
                    @click="cambiarPerfil(perfil)"
                  >
                    {{ perfil.nombreArtistico }}
                  </VaMenuItem>
                </div>

                <VaMenuItem icon="mso-add" @click="$router.push({ name: 'crear-perfil' })">
                  Crear nuevo perfil
                </VaMenuItem>
                <VaMenuItem icon="mso-logout" class="perfil-switcher__item--peligro" @click="cerrarSesion">
                  Cerrar sesión
                </VaMenuItem>
              </template>
            </VaDropdownContent>
          </VaDropdown>

          <h1 class="modalink-main__title">ModaLink</h1>
        </div>
      </header>

      <main class="dashboard-main__content">
        <slot />
      </main>
    </div>

   <VaModal
  v-model="modalBajaVisible"
  hide-default-actions
  blur
>
  <h3 class="va-h5">¿Solicitar baja del sistema?</h3>
  <p class="mt-3">
   Tenés <strong>30 días</strong> para volver a activar tu cuenta. Durante ese periodo, tus perfiles no serán visibles para otros usuarios.
  </p>
  <p class="mt-3">
    Pasados los 30 días, tu cuenta se eliminará permanentemente del sistema.
  </p>
  <p class="mt-3">
    Para reactivar tu cuenta, solo necesitás iniciar sesión nuevamente.
  </p>

  <template #footer>
    <div style="display: flex; gap: 1rem; justify-content: flex-end; width: 100%; margin-top: 1rem;">
      <VaButton 
        preset="secondary" 
        color="primary"
        @click="modalBajaVisible = false"
      >
        Cancelar
      </VaButton>
      <VaButton 
        color="danger" 
        @click="confirmarBaja"
      >
        Solicitar baja
      </VaButton>
    </div>
  </template>
</VaModal>

  </div>
</template>

<script>
import authService from "../services/authService";
import usuarioService from "../services/usuarioService";
import perfilService from "../services/perfilService";
import { state, limpiarSesion, setPerfilActivo, idPerfilActivo } from "../services/authState";

export default {
  name: "UserDashboardLayout",
  props: {
    titulo: {
      type: String,
      default: "Perfiles",
    },
  },
  data() {
    return {
      modalBajaVisible: false,
      perfiles: [],
      perfilesCargando: false,
      cambiandoPerfilId: null,
    };
  },
  computed: {
    usuario() {
      return state.usuario;
    },
    inicialUsuario() {
      const nombre = this.usuario?.nombre || "";
      return nombre.charAt(0).toUpperCase();
    },
    idActivo() {
      return idPerfilActivo();
    },
    nombreArtisticoActivo() {
      return state.usuario?.nombreArtisticoActivo || null;
    },
    inicialPerfil() {
      const nombre = this.nombreArtisticoActivo || "";
      return nombre.charAt(0).toUpperCase() || "?";
    },
    perfilActual() {
      return this.perfiles.find((p) => p.idPerfil === this.idActivo) || null;
    },
    perfilesAlternativos() {
      return this.perfiles.filter((p) => p.idPerfil !== this.idActivo);
    },
  },
  mounted() {
    this.cargarPerfiles();
  },
  methods: {
    async cargarPerfiles() {
      this.perfilesCargando = true;
      try {
        const response = await perfilService.listarMisPerfiles();
        this.perfiles = response?.data || [];
      } catch {
        this.perfiles = [];
      } finally {
        this.perfilesCargando = false;
      }
    },
    async cambiarPerfil(perfil) {
      if (!perfil || perfil.estado !== 'Activo' || perfil.idPerfil === this.idActivo) return;
      if (this.cambiandoPerfilId) return;
      this.cambiandoPerfilId = perfil.idPerfil;
      try {
        const response = await perfilService.activar(perfil.idPerfil);
        const activado = response?.data || perfil;
        setPerfilActivo(activado);
        await this.cargarPerfiles();
      } catch (error) {
        const status = error?.response?.status;
        let mensaje = "No se pudo cambiar de perfil. Intentá nuevamente.";
        if (status === 404) mensaje = "El perfil no existe o no te pertenece.";
        else if (status === 400)
          mensaje = error?.response?.data?.message || "El perfil está en proceso de baja y no puede activarse.";
        alert(mensaje);
      } finally {
        this.cambiandoPerfilId = null;
      }
    },
    async confirmarBaja() {
      try {
        await usuarioService.solicitarBaja();
        limpiarSesion();
        this.$router.push({ name: "login" });
      } catch (error) {
        const mensaje = error.response?.data?.message || "Error al solicitar la baja. Intentá nuevamente.";
        alert(mensaje);
      }
    },
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
      } catch {
        // ignore
      } finally {
        limpiarSesion();
        this.$router.push({ name: "login" });
      }
    },
  },
};
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--va-background-secondary, #F5F5F8);
}

/* ── Sidebar ── */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: var(--color-surface);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem 0;
}

.sidebar__top {
  display: flex;
  flex-direction: column;
}

/* Usuario */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 1.25rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-text-muted);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar__user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__user-email {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Notificaciones */
.sidebar__notifications {
  
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 1.25rem;
  padding: 0.5rem 0.7rem;
  background: #f0f4ff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--color-text);
  text-align: left;
}

.sidebar__notifications:hover {
  background: #e0e7ff;
}

.sidebar__notifications .material-symbols-outlined {
  font-size: 1.15rem;
  color: var(--color-secondary);
}

.sidebar__badge {
  margin-left: auto;
  background: var(--va-danger);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

/* Sección acciones */
.sidebar__section {
  margin-top: 0.5rem;
  padding: 0 1.25rem;
}

.sidebar__section-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 750;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.sidebar__action {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.45rem 0;
  font-size: 0.82rem;
  color: var(--color-text);
  cursor: pointer;
}

.sidebar__action:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

/*Modalink*/
.modalink-main__title{
font-size: 1.5rem;
  font-weight: 750;
  letter-spacing: 0.15em;
  text-decoration: none;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Logout */
.sidebar__logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 1.25rem;
  padding: 0.55rem 0.7rem;
  background: none;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--va-danger);
  font-weight: 500;
}

.sidebar__logout:hover {
  background: #fef2f2;
}

.sidebar__logout .material-symbols-outlined {
  font-size: 1.15rem;
}

/* ── Main ── */
.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dashboard-main__header {
  display: flex;
  align-items: center;
  height: 72.5px;
  justify-content: space-between;
  padding: 0 2rem;
  background: var(--color-surface);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dashboard-main__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.04em;
  margin: 0;
}

.dashboard-main__subtitle {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.dashboard-main__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Switcher de perfil activo ── */
.perfil-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  cursor: pointer;
  color: var(--color-text);
}

.perfil-switcher:hover {
  background: #f3f4f6;
}

.perfil-switcher__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-secondary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.perfil-switcher__nombre {
  font-size: 0.82rem;
  font-weight: 600;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-switcher__nombre .material-symbols-outlined {
  font-size: 1rem;
}

.perfil-switcher__menu {
  min-width: 220px;
}

.perfil-switcher__estado {
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.perfil-switcher__grupo {
  padding: 0.5rem 0.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.perfil-switcher__titulo {
  display: block;
  padding: 0 0.6rem 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.perfil-switcher__actual {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.perfil-switcher__actual--vacio {
  font-weight: 400;
  color: var(--color-text-muted);
}

.perfil-switcher__punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

.perfil-switcher__item--peligro {
  color: var(--va-danger);
}

.dashboard-main__icon-btn {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.35rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.dashboard-main__icon-btn:hover {
  background: #f3f4f6;
  color: var(--color-text);
}

.dashboard-main__icon-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.dashboard-main__content {
  flex: 1;
  padding: 1.5rem 2rem;
}
</style>
