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

        <button
          class="sidebar__notifications"
          @click="$router.push({ name: 'notificaciones-usuario' })"
        >
          <span class="material-symbols-outlined">notifications</span>
          <span>Notificaciones</span>
          <span v-if="noLeidasUsuario > 0" class="sidebar__badge">{{ noLeidasUsuario }}</span>
        </button>

        <div class="sidebar__section">
          <span class="sidebar__section-title">Acciones</span>
          <button class="sidebar__action" @click="$router.push({ name: 'dashboard-usuario' })">
            Mis perfiles
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
          <button
            v-if="!esCuentaPendienteBaja"
            class="sidebar__action"
            @click="modalBajaVisible = true"
          >
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
          <ThemeToggle />

          <VaDropdown v-if="usuario" placement="bottom-end">
            <template #anchor>
              <button class="perfil-switcher">
                <span class="perfil-switcher__avatar">
                  <img
                    v-if="fotoPerfilActiva && !fotoRota"
                    :src="fotoPerfilActiva"
                    :alt="nombreArtisticoActivo || 'Perfil activo'"
                    @error="fotoRota = true"
                  />
                  <template v-else>{{ inicialPerfil }}</template>
                </span>
                <span v-if="idActivo" class="perfil-switcher__labels">
                  <span class="perfil-switcher__nombre">{{ nombreArtisticoActivo || "Perfil" }}</span>
                  <span v-if="profesionActiva" class="perfil-switcher__profesion">{{ profesionActiva }}</span>
                  <span class="perfil-switcher__estado-linea">
                    <span class="perfil-switcher__punto"></span>
                    En línea
                  </span>
                </span>
                <span v-else class="perfil-switcher__nombre">Sin perfil activo</span>
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
                    <span class="perfil-switcher__avatar perfil-switcher__avatar--mini">
                      <img
                        v-if="fotoDe(perfil)"
                        :src="fotoDe(perfil)"
                        :alt="perfil.nombreArtistico"
                      />
                      <template v-else>{{ inicialDe(perfil.nombreArtistico) }}</template>
                    </span>
                    <span class="perfil-switcher__item-info">
                      <span class="perfil-switcher__item-nombre">{{ perfil.nombreArtistico }}</span>
                      <span v-if="profesionDe(perfil)" class="perfil-switcher__item-profesion">{{ profesionDe(perfil) }}</span>
                      <span class="perfil-switcher__item-estado">
                        <span class="perfil-switcher__punto perfil-switcher__punto--offline"></span>
                        Offline
                      </span>
                    </span>
                  </VaMenuItem>
                </div>

                <VaMenuItem class="perfil-switcher__item" icon="mso-add" @click="$router.push({ name: 'crear-perfil' })">
                  Crear nuevo perfil
                </VaMenuItem>
                <VaMenuItem class="perfil-switcher__item perfil-switcher__item--peligro" icon="mso-logout" @click="cerrarSesion">
                  Cerrar sesión
                </VaMenuItem>
              </template>
            </VaDropdownContent>
          </VaDropdown>

          <div class="modalink-main__brand">
            <BrandLogo :alto="38" variante="gradient" />
          </div>
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
import usuarioService from "../../services/usuarioService";
import perfilService from "../../services/perfilService";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  state,
  setPerfilActivo,
  idPerfilActivo,
  finalizarSesion,
  guardarBajaCuenta,
} from "../../services/authState";
import ThemeToggle from "../ThemeToggle.vue";
import BrandLogo from "../BrandLogo.vue";
import {
  state as notificacionState,
  cargarResumenUsuario,
} from "../../services/notificacionState";

export default {
  name: "UserDashboardLayout",
  components: {
    ThemeToggle,
    BrandLogo,
  },
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
      fotoRota: false,
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
    noLeidasUsuario() {
      return notificacionState.noLeidasUsuario;
    },
    nombreArtisticoActivo() {
      return state.usuario?.nombreArtisticoActivo || null;
    },
  
    esCuentaPendienteBaja() {
      return this.usuario?.estado === "PENDIENTE_BAJA";
    },
    inicialPerfil() {
      const nombre = this.nombreArtisticoActivo || "";
      return nombre.charAt(0).toUpperCase() || "?";
    },
    perfilActual() {
      return this.perfiles.find((p) => p.idPerfil === this.idActivo) || null;
    },
    fotoPerfilActiva() {
      const perfil = this.perfilActual;
      return resolverFotoUrl(perfil?.urlFoto || perfil?.fotoPerfil || perfil?.fotoUrl);
    },
    profesionActiva() {
      return this.perfilActual?.profesion || this.perfilActual?.profesiones?.[0]?.nombre || "";
    },
    perfilesAlternativos() {
      return this.perfiles.filter((p) => p.idPerfil !== this.idActivo);
    },
  },
  watch: {
    fotoPerfilActiva() {
      this.fotoRota = false;
    },
  },
  mounted() {
    this.cargarPerfiles();
    cargarResumenUsuario();
  },
  methods: {
    inicialDe(valor) {
      return String(valor || "?").charAt(0).toUpperCase();
    },
    fotoDe(perfil) {
      return resolverFotoUrl(perfil?.urlFoto || perfil?.fotoPerfil || perfil?.fotoUrl);
    },
    profesionDe(perfil) {
      return perfil?.profesion || perfil?.profesiones?.[0]?.nombre || "";
    },
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
        const response = await usuarioService.solicitarBaja();
        const data = response?.data || {};
        // Se persiste antes de cerrar sesión para mostrar la respuesta
        // (mensaje + fecha límite) en la vista de login (ficha §4.2).
        guardarBajaCuenta({ mensaje: data.mensaje, fechaLimite: data.fechaLimite });
        await finalizarSesion();
        this.$router.push({ name: "login" });
      } catch (error) {
        const mensaje = error.response?.data?.message || "Error al solicitar la baja. Intentá nuevamente.";
        alert(mensaje);
      }
    },
    async cerrarSesion() {
      await finalizarSesion();
      this.$router.push({ name: "login" });
    },
  },
};
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-dashboard-bg);
}

/* ── Sidebar ── */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
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
  border-bottom: 1px solid var(--color-border-soft);
}

.sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
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
  background: var(--color-surface-muted);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--color-text);
  text-align: left;
}

.sidebar__notifications:hover {
  background: var(--color-info-soft);
}

.sidebar__notifications .material-symbols-outlined {
  font-size: 1.15rem;
  color: var(--color-secondary);
}

.sidebar__badge {
  margin-left: auto;
  background: var(--color-danger-fill);
  color: var(--color-on-primary);
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

/* ModaLink */
.modalink-main__brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  border-top: 1px solid var(--color-border-soft);
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--va-danger);
  font-weight: 500;
}

.sidebar__logout:hover {
  background: var(--color-danger-soft);
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
  border-bottom: 1px solid var(--color-border);
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
  padding: 0.45rem 0.75rem;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  color: var(--color-text);
}

.perfil-switcher:hover {
  background: var(--color-surface-muted);
}

.perfil-switcher__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.perfil-switcher__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-switcher__nombre {
  font-size: 0.82rem;
  font-weight: 600;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-switcher__labels {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  line-height: 1.15;
  min-width: 0;
}

.perfil-switcher__profesion {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perfil-switcher__estado-linea {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--color-success-text);
}

.perfil-switcher__nombre .material-symbols-outlined {
  font-size: 1rem;
}

.perfil-switcher__menu {
  width: 260px !important;
  min-width: 260px;
  max-width: 260px;
  padding: 0.75rem 0;
  box-sizing: border-box;
  overflow: hidden; 
  border-radius: 16px !important;
}

.perfil-switcher__estado {
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.perfil-switcher__grupo {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.perfil-switcher__titulo {
  display: block;
  padding: 0 1rem 0.5rem;
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
  padding: 0.5rem 1rem;
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
  background: var(--color-success);
  flex-shrink: 0;
}

.perfil-switcher__item {
  padding: 0.65rem 1rem !important; 
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.perfil-switcher__avatar--mini {
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
  flex-shrink: 0;
  overflow: hidden;
}

.perfil-switcher__avatar--mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-switcher__item-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  line-height: 1.2;
  min-width: 0;
}

.perfil-switcher__item-nombre {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
}

.perfil-switcher__item-profesion {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.perfil-switcher__item-estado {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--color-text-subtle);
}

.perfil-switcher__punto--offline {
  background: var(--color-text-subtle);
}

.perfil-switcher__item--peligro {
  color: var(--va-danger);
}

.dashboard-main__icon-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.35rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.dashboard-main__icon-btn:hover {
  background: var(--color-surface-muted);
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
