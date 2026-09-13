<template>
  <div class="home-layout" @click="cerrarMenu">
    <header class="home-layout__topbar">
      <div class="home-layout__brand">
        <span class="material-symbols-outlined">apps</span>
        <strong>ModaLink</strong>
      </div>

      <div class="home-layout__search">
        <span class="material-symbols-outlined">search</span>
        <input v-model="busqueda" type="search" placeholder="Buscar perfil por nombre o profesión..." />
      </div>

      <nav class="home-layout__navigation" aria-label="Navegación principal">
        <button class="home-layout__nav-item home-layout__nav-item--active" @click.stop="$router.push({ name: 'home' })">
          <span class="material-symbols-outlined">home</span>
          <span>Inicio</span>
        </button>
        <button class="home-layout__nav-item" @click.stop="$router.push({ name: 'dashboard-usuario' })">
          <span class="material-symbols-outlined">business_center</span>
          <span>Proyectos</span>
        </button>
        <button class="home-layout__nav-item">
          <span class="material-symbols-outlined">group</span>
          <span>Mi red</span>
        </button>
        <button class="home-layout__nav-item">
          <span class="material-symbols-outlined">chat_bubble</span>
          <span>Mensajes</span>
        </button>
        <button class="home-layout__nav-item">
          <span class="material-symbols-outlined">notifications</span>
          <span>Notificaciones</span>
        </button>
      </nav>

      <div class="home-layout__profile-wrapper" @click.stop>
        <button class="home-layout__profile-trigger" @click="alternarMenu">
          <span class="home-layout__avatar">{{ inicialPerfil }}</span>
          <span>{{ nombreArtisticoActivo || "Perfil" }}</span>
          <span class="material-symbols-outlined">expand_more</span>
        </button>

        <div
          v-if="menuAbierto"
          class="home-layout__profile-menu"
          :class="`home-layout__profile-menu--${direccionMenu}`"
        >
          <button @click="verPerfil">Ver perfil</button>
          <button @click="$router.push({ name: 'modificar-datos' })">Ajustes</button>
          <div class="home-layout__switcher">
            <button @click="perfilesAbiertos = !perfilesAbiertos">
              <span>Cambiar perfil activo</span>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
            <div
              v-if="perfilesAbiertos"
              class="home-layout__profiles"
              :class="`home-layout__profiles--${direccionSubmenu}`"
            >
              <button
                v-for="perfil in perfilesAlternativos"
                :key="perfil.idPerfil"
                :disabled="perfil.estado !== 'Activo' || cambiandoPerfilId !== null"
                @click="cambiarPerfil(perfil)"
              >
                <span class="home-layout__mini-avatar">{{ inicialDe(perfil.nombreArtistico) }}</span>
                {{ perfil.nombreArtistico }}
              </button>
              <span v-if="!perfilesAlternativos.length" class="home-layout__empty">No hay perfiles alternativos</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="home-layout__body">
      <aside class="home-layout__sidebar">
        <section
          class="home-layout__profile-card home-layout__profile-card--clickeable"
          role="button"
          tabindex="0"
          @click="$router.push({ name: 'inicioperfil' })"
          @keydown.enter="$router.push({ name: 'inicioperfil' })"
        >
          <div class="home-layout__profile-summary">
            <span class="home-layout__large-avatar">{{ inicialPerfil }}</span>
            <div>
              <strong>{{ perfilActual?.nombreArtistico || nombreArtisticoActivo || "Perfil activo" }}</strong>
              <span>{{ perfilActual?.profesion || perfilActual?.profesiones?.[0]?.nombre || "Profesión" }}</span>
            </div>
          </div>
          <p>{{ perfilActual?.biografia || "Tu biografía aparecerá aquí." }}</p>
          <span class="home-layout__location">
            <span class="material-symbols-outlined">location_on</span>
            {{ ubicacionTexto }}
          </span>
        </section>

        <nav class="home-layout__quick-links">
          <button @click="$router.push({ name: 'inicioperfil' })"><span class="material-symbols-outlined">person</span>Mi perfil</button>
          <button @click="$router.push({ name: 'dashboard-usuario' })"><span class="material-symbols-outlined">business_center</span>Proyectos</button>
          <button><span class="material-symbols-outlined">chat_bubble</span>Contactos</button>
          <button @click="$router.push({ name: 'calendario' })"><span class="material-symbols-outlined">calendar_month</span>Calendario</button>
          <button @click="$router.push({ name: 'dashboard-usuario' })"><span class="material-symbols-outlined">dashboard</span>Dashboard</button>
        </nav>

        <button class="home-layout__logout" @click="cerrarSesion">
          <span class="material-symbols-outlined">power_settings_new</span>
          Cerrar sesión
        </button>
      </aside>

      <main class="home-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import authService from "../../services/authService";
import perfilService from "../../services/perfilService";
import usuarioService from "../../services/usuarioService";
import { state, limpiarSesion, setPerfilActivo, idPerfilActivo } from "../../services/authState";
import { nextTick } from "vue";

export default {
  name: "HomeLayout",
  data() {
    return {
      busqueda: "",
      menuAbierto: false,
      perfilesAbiertos: false,
      perfiles: [],
      ubicacion: null,
      cambiandoPerfilId: null,
      direccionMenu: "izquierda",
      direccionSubmenu: "derecha",
    };
  },
  computed: {
    usuario() {
      return state.usuario;
    },
    idActivo() {
      return idPerfilActivo();
    },
    nombreArtisticoActivo() {
      return this.usuario?.nombreArtisticoActivo || null;
    },
    perfilActual() {
      return this.perfiles.find((perfil) => perfil.idPerfil === this.idActivo) || null;
    },
    perfilesAlternativos() {
      return this.perfiles.filter((perfil) => perfil.idPerfil !== this.idActivo);
    },
    inicialPerfil() {
      return this.inicialDe(this.nombreArtisticoActivo || this.perfilActual?.nombreArtistico || "?");
    },
    ubicacionTexto() {
      const ubicacion = this.ubicacion;
      if (!ubicacion) return "Ubicación no definida";
      return [ubicacion.localidad?.nombre || ubicacion.localidad, ubicacion.provincia?.nombre || ubicacion.provincia]
        .filter(Boolean)
        .join(", ") || "Ubicación no definida";
    },
  },
  mounted() {
    this.cargarDatos();
    window.addEventListener("resize", this.recalcularPosicionDropdown);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.recalcularPosicionDropdown);
  },
  methods: {
    async cargarDatos() {
      const [perfilesResponse, ubicacionResponse] = await Promise.allSettled([
        perfilService.listarMisPerfiles(),
        usuarioService.obtenerUbicacion(),
      ]);
      if (perfilesResponse.status === "fulfilled") this.perfiles = perfilesResponse.value?.data || [];
      if (ubicacionResponse.status === "fulfilled") this.ubicacion = ubicacionResponse.value?.data || null;
    },
    inicialDe(valor) {
      return String(valor || "?").charAt(0).toUpperCase();
    },
    cerrarMenu() {
      this.menuAbierto = false;
      this.perfilesAbiertos = false;
    },
    async alternarMenu() {
      this.menuAbierto = !this.menuAbierto;
      if (this.menuAbierto) {
        await this.recalcularPosicionDropdown();
      }
    },
    async recalcularPosicionDropdown() {
      await nextTick();
      const trigger = this.$el.querySelector(".home-layout__profile-trigger");
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const menuWidth = 255;
      const submenuWidth = 175;
      const margin = 12;
      const espacioDerecho = window.innerWidth - triggerRect.right;

      this.direccionMenu =
        espacioDerecho >= menuWidth + margin ? "derecha" : "izquierda";

      const menuLeft = this.direccionMenu === "derecha"
        ? triggerRect.left
        : triggerRect.right - menuWidth;
      const espacioSubmenuDerecho = window.innerWidth - (menuLeft + menuWidth);

      this.direccionSubmenu =
        espacioSubmenuDerecho >= submenuWidth + margin ? "derecha" : "izquierda";
    },
    verPerfil() {
      this.menuAbierto = false;
      this.perfilesAbiertos = false;
      this.$router.push({ name: "inicioperfil" });
    },
    async cambiarPerfil(perfil) {
      if (!perfil || perfil.estado !== "Activo" || perfil.idPerfil === this.idActivo) return;
      this.cambiandoPerfilId = perfil.idPerfil;
      try {
        const response = await perfilService.activar(perfil.idPerfil);
        setPerfilActivo(response?.data || perfil);
        this.menuAbierto = false;
        this.perfilesAbiertos = false;
        await this.$router.push({ name: "home" });
      } catch (error) {
        const mensaje = error?.response?.data?.message || "No se pudo cambiar el perfil activo.";
        alert(mensaje);
      } finally {
        this.cambiandoPerfilId = null;
      }
    },
    async cerrarSesion() {
      try {
        await authService.cerrarSesion();
      } finally {
        limpiarSesion();
        this.$router.push({ name: "login" });
      }
    },
  },
};
</script>

<style scoped>
.home-layout { min-height: 100vh; background: #f5f5f8; color: #232134; }
.home-layout__topbar { min-height: 72px; display: flex; align-items: center; justify-content: center; gap: 4rem; padding: 0 3rem; background: #fff; border-bottom: 1px solid #e5e7eb; }
.home-layout__brand { display: flex; align-items: center; gap: .4rem; min-width: 130px; color: #494776; font-size: 1.2rem; }
.home-layout__brand .material-symbols-outlined { font-size: 1.5rem; }
.home-layout__search { display: flex; align-items: center; gap: .5rem; width: 300px; padding: .5rem .75rem; border: 1px solid #e5e7eb; border-radius: 8px; color: #767171; }
.home-layout__search input { width: 100%; border: 0; outline: 0; font-size: .8rem; }
.home-layout__navigation { display: flex; align-self: stretch; gap: .7rem; }
.home-layout__nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .15rem; min-width: 58px; background: transparent; border: 0; color: #484848; font-size: .7rem; cursor: pointer; }
.home-layout__nav-item .material-symbols-outlined { font-size: 1.35rem; }
.home-layout__nav-item--active { border-bottom: 2px solid #494776; color: #494776; }
.home-layout__profile-wrapper { position: relative; }
.home-layout__profile-trigger { display: flex; align-items: center; gap: .45rem; border: 0; background: transparent; color: #232134; cursor: pointer; }
.home-layout__avatar, .home-layout__large-avatar, .home-layout__mini-avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #6866a9; color: #fff; font-weight: 600; }
.home-layout__avatar { width: 36px; height: 36px; }
.home-layout__large-avatar { width: 42px; height: 42px; flex-shrink: 0; }
.home-layout__mini-avatar { width: 28px; height: 28px; font-size: .75rem; }
.home-layout__profile-menu { position: absolute; z-index: 5; top: 48px; width: 255px; padding: .5rem 0; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; box-shadow: 0 8px 20px rgba(35,33,52,.12); }
.home-layout__profile-menu--derecha { left: 0; }
.home-layout__profile-menu--izquierda { right: 0; }
.home-layout__profile-menu > button, .home-layout__switcher > button { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: .75rem 1rem; border: 0; background: #fff; color: #232134; text-align: left; cursor: pointer; font-size: .82rem; }
.home-layout__profile-menu button:hover { background: #f5f5f8; }
.home-layout__switcher { position: relative; }
.home-layout__profiles { position: absolute; top: 0; width: 175px; padding: .5rem; background: #fff; border: 1px solid #ddd; box-shadow: 0 8px 20px rgba(35,33,52,.12); }
.home-layout__profiles--derecha { left: 100%; border-radius: 0 10px 10px 10px; }
.home-layout__profiles--izquierda { right: 100%; border-radius: 10px 0 10px 10px; }
.home-layout__profiles button { display: flex; align-items: center; gap: .5rem; width: 100%; padding: .5rem; border: 0; background: #fff; text-align: left; cursor: pointer; font-size: .8rem; }
.home-layout__profiles button:disabled { cursor: not-allowed; opacity: .5; }
.home-layout__empty { display: block; padding: .5rem; color: #767171; font-size: .8rem; }
.home-layout__body { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 2.5rem; max-width: 1050px; margin: 2rem auto; padding: 0 1rem; }
.home-layout__sidebar { display: flex; flex-direction: column; min-height: calc(100vh - 150px); gap: 1.25rem; }
.home-layout__profile-card, .home-layout__quick-links { padding: 1rem; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(35,33,52,.04); }
.home-layout__profile-card--clickeable { cursor: pointer; transition: box-shadow 0.15s; }
.home-layout__profile-card--clickeable:hover { box-shadow: 0 4px 12px rgba(35,33,52,.1); }
.home-layout__profile-summary { display: flex; align-items: center; gap: .6rem; }
.home-layout__profile-summary div { display: flex; flex-direction: column; gap: .15rem; min-width: 0; }
.home-layout__profile-summary strong { font-size: .85rem; overflow: hidden; text-overflow: ellipsis; }
.home-layout__profile-summary span { color: #767171; font-size: .75rem; }
.home-layout__profile-card p { margin: 1rem 0; color: #484848; font-size: .8rem; line-height: 1.4; }
.home-layout__location { display: flex; align-items: center; gap: .3rem; color: #767171; font-size: .78rem; }
.home-layout__location .material-symbols-outlined { font-size: 1rem; }
.home-layout__quick-links { display: grid; gap: .2rem; }
.home-layout__quick-links button { display: flex; align-items: center; gap: .6rem; padding: .55rem .25rem; border: 0; background: transparent; color: #232134; text-align: left; cursor: pointer; font-size: .82rem; }
.home-layout__quick-links button:hover { color: #6866a9; }
.home-layout__quick-links .material-symbols-outlined { font-size: 1.1rem; }
.home-layout__logout { display: flex; align-items: center; gap: .5rem; margin-top: auto; padding: .5rem 1rem; border: 0; background: transparent; color: #ef4444; cursor: pointer; font-size: .8rem; }
.home-layout__content { min-height: 530px; padding: 1.5rem; background: #fff; border-radius: 10px; }
@media (max-width: 900px) {
  .home-layout__topbar { flex-wrap: wrap; gap: 1rem; padding: 1rem; }
  .home-layout__navigation { order: 3; width: 100%; justify-content: space-around; }
  .home-layout__body { grid-template-columns: 1fr; margin-top: 1rem; }
  .home-layout__sidebar { min-height: auto; }
  .home-layout__logout { margin-top: 0; }
}
</style>
