<template>
  <div class="dashboard-admin">
    <section class="dashboard-admin__encabezado">
      <h1>Panel de administración</h1>
      <p class="dashboard-admin__subtitulo">
        Bienvenido/a, {{ usuario?.nombre || 'Administrador' }}. Seleccioná una opción para comenzar.
      </p>
    </section>

    <div class="dashboard-admin__grid">
      <button
        class="admin-card"
        @click="$router.push({ name: 'gestion-usuarios' })"
      >
        <div class="admin-card__icon">
          <span class="material-symbols-outlined">groups</span>
        </div>
        <div class="admin-card__info">
          <span class="admin-card__titulo">Gestión de usuarios</span>
          <span class="admin-card__descripcion">
            Administrar cuentas, visualizar usuarios y sus perfiles.
          </span>
        </div>
        <span class="admin-card__arrow">
          <span class="material-symbols-outlined">chevron_right</span>
        </span>
      </button>

      <button
        class="admin-card"
        @click="$router.push({ name: 'gestionar-caracteristicas' })"
      >
        <div class="admin-card__icon">
          <span class="material-symbols-outlined">tune</span>
        </div>
        <div class="admin-card__info">
          <span class="admin-card__titulo">Gestionar características técnicas</span>
          <span class="admin-card__descripcion">
            Configurar características técnicas y sus valores por profesión.
          </span>
        </div>
        <span class="admin-card__arrow">
          <span class="material-symbols-outlined">chevron_right</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script>
import { state } from "../../services/authState";

export default {
  name: "DashboardAdminView",
  computed: {
    usuario() {
      return state.usuario;
    },
  },
};
</script>

<style scoped>
.dashboard-admin {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.dashboard-admin__encabezado h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 0.25rem 0;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dashboard-admin__subtitulo {
  margin: 0 0 1.75rem 0;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.dashboard-admin__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.admin-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  font-family: inherit;
}

.admin-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.admin-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-card__icon .material-symbols-outlined {
  font-size: 1.6rem;
}

.admin-card__info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.admin-card__titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.admin-card__descripcion {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.admin-card__arrow {
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.admin-card__arrow .material-symbols-outlined {
  font-size: 1.3rem;
}

.admin-card:hover .admin-card__arrow {
  color: var(--color-primary);
}
</style>
