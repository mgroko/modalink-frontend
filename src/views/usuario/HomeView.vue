<template>
  <div class="home-view">
    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="cargando" class="home-view__estado">
      <span class="material-symbols-outlined">hourglass_empty</span>
      Cargando inicio...
    </div>

    <template v-else-if="perfilActivo">
      <PerfilActivoWidget :perfil="perfilActivo" />
      <main class="home-view__feed">
        <ProyectosSection :proyectos="proyectos" />
        <PublicacionesFeed :publicaciones="publicaciones" />
      </main>
    </template>
  </div>
</template>

<script>
import homeService from "../../services/homeService";
import BaseAlert from "../../components/AlertaBase.vue";
import PerfilActivoWidget from "../../components/home/PerfilActivoWidget.vue";
import ProyectosSection from "../../components/home/ProyectosSection.vue";
import PublicacionesFeed from "../../components/home/PublicacionesFeed.vue";
import { setPerfilActivo } from "../../services/authState";

export default {
  name: "HomeView",
  components: {
    BaseAlert,
    PerfilActivoWidget,
    ProyectosSection,
    PublicacionesFeed,
  },
  data() {
    return {
      perfilActivo: null,
      proyectos: [],
      publicaciones: [],
      cargando: true,
      mensajeError: "",
    };
  },
  mounted() {
    this.cargarHome();
  },
  methods: {
    async cargarHome() {
      this.cargando = true;
      this.mensajeError = "";

      try {
        const response = await homeService.obtenerResumen();
        const resumen = response?.data || {};
        this.perfilActivo = resumen.perfilActivo;
        this.proyectos = Array.isArray(resumen.proyectosDestacados)
          ? resumen.proyectosDestacados
          : [];
        this.publicaciones = Array.isArray(resumen.publicacionesRecientes)
          ? resumen.publicacionesRecientes
          : [];

        if (!this.perfilActivo) {
          this.$router.push({ name: "seleccionar-perfil" });
          return;
        }

        setPerfilActivo(this.perfilActivo);
      } catch (error) {
        if (error?.response?.status === 404) {
          try {
            const response = await homeService.obtenerPerfilActivo();
            this.perfilActivo = response?.data || null;
            if (this.perfilActivo) setPerfilActivo(this.perfilActivo);
          } catch (perfilError) {
            if (perfilError?.response?.status === 404) {
              this.$router.push({ name: "seleccionar-perfil" });
              return;
            }
            this.mensajeError = "No se pudo cargar el perfil activo.";
          }
        } else {
          this.mensajeError = "No se pudo cargar el inicio. Intentá nuevamente.";
        }
      } finally {
        this.cargando = false;
      }
    },
  },
};
</script>

<style scoped>
.home-view {
  display: grid;
  gap: 1rem;
}

.home-view__feed {
  display: grid;
  gap: 1rem;
}

.home-view__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}
</style>
