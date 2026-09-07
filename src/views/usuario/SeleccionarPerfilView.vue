<template>
  <div class="seleccionar-perfil">
    <div class="seleccionar-perfil__encabezado">
      <h2 class="seleccionar-perfil__titulo">Seleccioná tu perfil</h2>
      <p class="seleccionar-perfil__subtitulo">
        Iniciá sesión en el perfil con el que querés operar.
      </p>
    </div>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="cargando" class="seleccionar-perfil__estado">
      <span class="material-symbols-outlined seleccionar-perfil__estado-icono">hourglass_empty</span>
      Cargando perfiles...
    </div>

    <div v-else-if="perfiles.length === 0" class="seleccionar-perfil__estado">
      <span class="material-symbols-outlined seleccionar-perfil__estado-icono">person_off</span>
      No tenés perfiles creados.
    </div>

    <div v-else class="seleccionar-perfil__grid">
      <div
        v-for="perfil in perfiles"
        :key="perfil.idPerfil"
        class="perfil-opcion"
        :class="{ 'perfil-opcion--deshabilitado': perfil.estado !== 'Activo' }"
        @click="activarPerfil(perfil)"
      >
        <div class="perfil-opcion__avatar">
          <img
            v-if="perfil.fotoUrl || perfil.fotoPerfil"
            :src="perfil.fotoUrl || perfil.fotoPerfil"
            :alt="perfil.nombreArtistico"
            class="perfil-opcion__foto"
          />
          <span v-else class="material-symbols-outlined perfil-opcion__foto-placeholder">person</span>
        </div>
        <div class="perfil-opcion__info">
          <span class="perfil-opcion__nombre">{{ perfil.nombreArtistico }}</span>
          <span class="perfil-opcion__profesion">{{ profesionDe(perfil) }}</span>
        </div>
        <VaButton
          size="small"
          :loading="activandoId === perfil.idPerfil"
          :disabled="perfil.estado !== 'Activo'"
          @click.stop="activarPerfil(perfil)"
        >
          {{ perfil.estado === 'Activo' ? 'Ingresar' : perfil.estado }}
        </VaButton>
      </div>
    </div>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import { setPerfilActivo } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";

export default {
  name: "SeleccionarPerfilView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      perfiles: [],
      cargando: true,
      activandoId: null,
      mensajeError: "",
    };
  },
  mounted() {
    this.cargarPerfiles();
  },
  methods: {
    async cargarPerfiles() {
      this.cargando = true;
      try {
        const response = await perfilService.listarMisPerfiles();
        this.perfiles = response?.data || [];
      } catch {
        this.perfiles = [];
      } finally {
        this.cargando = false;
      }
    },
    profesionDe(perfil) {
      if (perfil.profesion) return perfil.profesion;
      const profesiones = perfil.profesiones || [];
      return profesiones.map((p) => p.nombre).join(", ") || "Profesión";
    },
    async activarPerfil(perfil) {
      if (!perfil || perfil.estado !== 'Activo' || this.activandoId === perfil.idPerfil) return;
      this.activandoId = perfil.idPerfil;
      this.mensajeError = "";
      try {
        const response = await perfilService.activar(perfil.idPerfil);
        const activado = response?.data || perfil;
        setPerfilActivo(activado);
        this.$router.push({ name: "home" });
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404) {
          this.mensajeError = "El perfil no existe o no te pertenece.";
        } else if (status === 400) {
          this.mensajeError =
            error?.response?.data?.message ||
            "El perfil está en proceso de baja y no puede activarse.";
        } else {
          this.mensajeError = "No se pudo iniciar sesión en el perfil. Intentá nuevamente.";
        }
      } finally {
        this.activandoId = null;
      }
    },
  },
};
</script>

<style scoped>
.seleccionar-perfil {
  width: 100%;
}

.seleccionar-perfil__encabezado {
  margin-bottom: 1.25rem;
}

.seleccionar-perfil__titulo {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
}

.seleccionar-perfil__subtitulo {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.seleccionar-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.seleccionar-perfil__estado-icono {
  font-size: 2.5rem;
}

.seleccionar-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.perfil-opcion {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.perfil-opcion:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.perfil-opcion--deshabilitado {
  opacity: 0.55;
  cursor: not-allowed;
}

.perfil-opcion__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.perfil-opcion__foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-opcion__foto-placeholder {
  font-size: 1.6rem;
  color: var(--color-text-muted);
}

.perfil-opcion__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.perfil-opcion__nombre {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.perfil-opcion__profesion {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>