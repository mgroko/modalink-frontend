<template>
  <div class="dashboard-proyecto">
    <BaseAlert
      v-if="proyecto"
      message="Proyecto creado correctamente. Estado inicial: Borrador."
      type="success"
    />

    <section class="dashboard-proyecto__hero">
      <div class="dashboard-proyecto__hero-icono">
        <span class="material-symbols-outlined">folder_open</span>
      </div>
      <div class="dashboard-proyecto__hero-datos">
        <p class="dashboard-proyecto__id">Proyecto #{{ idProyecto }}</p>
        <h1 class="dashboard-proyecto__nombre">
          {{ proyecto?.nombre || "Proyecto sin nombre" }}
        </h1>
        <p v-if="proyecto?.descripcion" class="dashboard-proyecto__descripcion">
          {{ proyecto.descripcion }}
        </p>
      </div>
      <VaBadge :text="proyecto?.estado || 'Borrador'" color="info" />
    </section>

    <section v-if="proyecto" class="dashboard-proyecto__datos">
      <div class="dashboard-proyecto__dato">
        <span class="dashboard-proyecto__dato-label">Fecha de inicio</span>
        <span class="dashboard-proyecto__dato-valor">{{ formatearFechaCorta(proyecto.fechaInicio) }}</span>
      </div>
      <div class="dashboard-proyecto__dato">
        <span class="dashboard-proyecto__dato-label">Fecha de fin estimada</span>
        <span class="dashboard-proyecto__dato-valor">{{ formatearFechaCorta(proyecto.fechaFinEstipulada) }}</span>
      </div>
      <div class="dashboard-proyecto__dato">
        <span class="dashboard-proyecto__dato-label">Privacidad</span>
        <span class="dashboard-proyecto__dato-valor">{{ ETIQUETAS_PRIVACIDAD[proyecto.privacidad] || proyecto.privacidad }}</span>
      </div>
      <div class="dashboard-proyecto__dato">
        <span class="dashboard-proyecto__dato-label">Director</span>
        <span class="dashboard-proyecto__dato-valor">{{ proyecto.nombreDirector || "—" }}</span>
      </div>
      <div class="dashboard-proyecto__dato">
        <span class="dashboard-proyecto__dato-label">Objetivos</span>
        <span class="dashboard-proyecto__dato-valor">{{ (proyecto.objetivos || []).length }}</span>
      </div>
      <div class="dashboard-proyecto__dato">
        <span class="dashboard-proyecto__dato-label">Requerimientos</span>
        <span class="dashboard-proyecto__dato-valor">{{ (proyecto.requerimientosGral || []).length }}</span>
      </div>
    </section>

    <p v-else class="dashboard-proyecto__aviso">
      <span class="material-symbols-outlined">info</span>
      Abriste el proyecto #{{ idProyecto }} directamente: los datos del proyecto se
      mostrarán cuando el backend exponga GET /proyectos/{id}.
    </p>

    <section class="dashboard-proyecto__placeholder">
      <h2>Próximamente</h2>
      <p>
        El panel completo del proyecto (miembros, actividades, postulaciones y
        moodboard) se habilitará en una iteración siguiente.
      </p>
    </section>

    <div class="dashboard-proyecto__acciones">
      <VaButton preset="secondary" icon="mso-home" @click="$router.push({ name: 'home' })">
        Ir al inicio
      </VaButton>
      <VaButton preset="primary" icon="mso-add" @click="$router.push({ name: 'crear-proyecto' })">
        Crear otro proyecto
      </VaButton>
    </div>
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import { ETIQUETAS_PRIVACIDAD } from "../../utils/proyectoConstants.js";
import { formatearFechaCorta } from "../../utils/fechas.js";

export default {
  name: "DashboardProyectoView",
  components: { BaseAlert },
  data() {
    return {
      ETIQUETAS_PRIVACIDAD,
      proyecto: null,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
  },
  created() {
    const estado = window.history.state || {};
    this.proyecto = estado.proyecto && String(estado.proyecto.idProyecto) === String(this.idProyecto)
      ? estado.proyecto
      : null;
  },
  methods: {
    formatearFechaCorta,
  },
};
</script>

<style scoped>
.dashboard-proyecto {
  display: grid;
  gap: 1.25rem;
  max-width: 900px;
  margin: 0 auto;
}

.dashboard-proyecto__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.dashboard-proyecto__hero-icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: var(--color-primary, #494776);
  color: #fff;
  flex-shrink: 0;
}

.dashboard-proyecto__hero-datos {
  flex: 1;
  min-width: 0;
}

.dashboard-proyecto__id {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dashboard-proyecto__nombre {
  margin: 0.15rem 0 0;
  font-size: 1.3rem;
  color: var(--color-text);
}

.dashboard-proyecto__descripcion {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.dashboard-proyecto__dato {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dashboard-proyecto__dato-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.dashboard-proyecto__dato-valor {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__aviso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 1rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__placeholder {
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
}

.dashboard-proyecto__placeholder h2 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  color: var(--color-text);
}

.dashboard-proyecto__placeholder p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
