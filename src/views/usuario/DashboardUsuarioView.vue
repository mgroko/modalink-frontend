<template>
  <div class="dashboard-usuario">
    <div class="dashboard-usuario__tabs">
      <button
        class="dashboard-usuario__tab"
        :class="{ 'dashboard-usuario__tab--active': tabActiva === 'perfiles' }"
        @click="tabActiva = 'perfiles'"
      >
        Perfiles
      </button>
      <button
        class="dashboard-usuario__tab"
        :class="{ 'dashboard-usuario__tab--active': tabActiva === 'calendario' }"
        @click="tabActiva = 'calendario'"
      >
        Calendario
      </button>
    </div>

    <div v-if="tabActiva === 'perfiles'" class="dashboard-usuario__perfiles">
      <div class="dashboard-usuario__toolbar">
        <div class="dashboard-usuario__search">
          <span class="material-symbols-outlined">search</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar perfil"
            class="dashboard-usuario__search-input"
          />
        </div>

        <div class="dashboard-usuario__toolbar-right">
          <VaButton color="#b865a4" size="small">
            <span class="material-symbols-outlined" style="font-size: 1rem; margin-right: 0.25rem;">add</span>
            Crear perfil
          </VaButton>
          <div class="dashboard-usuario__view-toggle">
            <button
              class="dashboard-usuario__view-btn"
              :class="{ 'dashboard-usuario__view-btn--active': vista === 'lista' }"
              @click="vista = 'lista'"
            >
              <span class="material-symbols-outlined">view_list</span>
            </button>
            <button
              class="dashboard-usuario__view-btn"
              :class="{ 'dashboard-usuario__view-btn--active': vista === 'cuadricula' }"
              @click="vista = 'cuadricula'"
            >
              <span class="material-symbols-outlined">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="cargando" class="dashboard-usuario__estado">
        <span class="material-symbols-outlined dashboard-usuario__estado-icono">hourglass_empty</span>
        Cargando perfiles...
      </div>

      <div v-else-if="perfilesFiltrados.length === 0" class="dashboard-usuario__estado">
        <span class="material-symbols-outlined dashboard-usuario__estado-icono">person_off</span>
        No se encontraron perfiles.
      </div>

      <div v-else class="dashboard-usuario__grid">
        <div
          v-for="perfil in perfilesFiltrados"
          :key="perfil.idPerfil"
          class="perfil-card"
        >
          <div class="perfil-card__header">
            <span class="perfil-card__header-name">{{ perfil.nombreArtistico }}</span>
            <button class="perfil-card__header-btn">
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>

          <div class="perfil-card__body">
            <div class="perfil-card__avatar">
              <img
                v-if="perfil.fotoUrl"
                :src="perfil.fotoUrl"
                :alt="perfil.nombreArtistico"
                class="perfil-card__foto"
              />
              <span v-else class="material-symbols-outlined perfil-card__foto-placeholder">person</span>
            </div>
            <div class="perfil-card__info">
              <span class="perfil-card__profesion">{{ perfil.profesion || 'Profesión' }}</span>
              <span class="perfil-card__nombre">{{ perfil.nombreArtistico }}</span>
            </div>
          </div>

          <div class="perfil-card__notifications">
            <span class="material-symbols-outlined">notifications</span>
            <span>Notificaciones</span>
            <span class="perfil-card__badge">0</span>
          </div>

          <div class="perfil-card__footer">
            <div class="perfil-card__footer-icons">
              <button class="perfil-card__icon-btn">
                <span class="material-symbols-outlined">settings</span>
              </button>
              <button class="perfil-card__icon-btn">
                <span class="material-symbols-outlined">person</span>
              </button>
            </div>
            <button class="perfil-card__ingresar">
              Ingresar
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="dashboard-usuario__estado">
      <span class="material-symbols-outlined dashboard-usuario__estado-icono">calendar_month</span>
      Calendario — Próximamente
    </div>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";

export default {
  name: "DashboardUsuarioView",
  data() {
    return {
      tabActiva: "perfiles",
      busqueda: "",
      vista: "cuadricula",
      perfiles: [],
      cargando: true,
    };
  },
  computed: {
    perfilesFiltrados() {
      const texto = this.busqueda.toLowerCase().trim();
      if (!texto) return this.perfiles;
      return this.perfiles.filter(
        (p) =>
          (p.nombreArtistico || "").toLowerCase().includes(texto) ||
          (p.profesion || "").toLowerCase().includes(texto)
      );
    },
  },
  mounted() {
    this.cargarPerfiles();
  },
  methods: {
    async cargarPerfiles() {
      this.cargando = true;
      try {
        const response = await perfilService.listarMisPerfiles();
        this.perfiles = response.data || [];
      } catch {
        this.perfiles = [];
      } finally {
        this.cargando = false;
      }
    },
  },
};
</script>

<style scoped>
.dashboard-usuario {
  width: 100%;
}

/* Tabs */
.dashboard-usuario__tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.25rem;
}

.dashboard-usuario__tab {
  background: none;
  border: none;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.dashboard-usuario__tab:hover {
  color: #374151;
}

.dashboard-usuario__tab--active {
  color: #1f2937;
  font-weight: 600;
  border-bottom-color: #b865a4;
}

/* Toolbar */
.dashboard-usuario__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.dashboard-usuario__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  background: #fff;
  min-width: 220px;
}

.dashboard-usuario__search .material-symbols-outlined {
  font-size: 1.1rem;
  color: #9ca3af;
}

.dashboard-usuario__search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: #374151;
  width: 100%;
}

.dashboard-usuario__search-input::placeholder {
  color: #9ca3af;
}

.dashboard-usuario__toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* View toggle */
.dashboard-usuario__view-toggle {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.dashboard-usuario__view-btn {
  background: #fff;
  border: none;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #9ca3af;
  transition: background 0.15s, color 0.15s;
}

.dashboard-usuario__view-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.dashboard-usuario__view-btn--active {
  background: #f3f4f6;
  color: #374151;
}

.dashboard-usuario__view-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

/* Estado vacío / carga */
.dashboard-usuario__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.dashboard-usuario__estado-icono {
  font-size: 2.5rem;
}

/* Grid de perfiles */
.dashboard-usuario__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* ── Tarjeta de perfil ── */
.perfil-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.perfil-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f59e0b;
  padding: 0.6rem 1rem;
}

.perfil-card__header-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
}

.perfil-card__header-btn {
  background: rgba(255, 255, 255, 0.25);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}

.perfil-card__header-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.perfil-card__header-btn .material-symbols-outlined {
  font-size: 1rem;
}

.perfil-card__body {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.perfil-card__avatar {
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

.perfil-card__foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-card__foto-placeholder {
  font-size: 1.6rem;
  color: #9ca3af;
}

.perfil-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.perfil-card__profesion {
  font-size: 0.72rem;
  color: #9ca3af;
}

.perfil-card__nombre {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

/* Notificaciones dentro de la tarjeta */
.perfil-card__notifications {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.78rem;
  color: #6b7280;
}

.perfil-card__notifications .material-symbols-outlined {
  font-size: 1rem;
  color: #6366f1;
}

.perfil-card__badge {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* Footer de la tarjeta */
.perfil-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  border-top: 1px solid #f3f4f6;
}

.perfil-card__footer-icons {
  display: flex;
  gap: 0.5rem;
}

.perfil-card__icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 0.2rem;
  display: flex;
  align-items: center;
}

.perfil-card__icon-btn:hover {
  color: #374151;
}

.perfil-card__icon-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

.perfil-card__ingresar {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: #22c55e;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.perfil-card__ingresar:hover {
  background: #f0fdf4;
}

.perfil-card__ingresar .material-symbols-outlined {
  font-size: 1rem;
}
</style>
