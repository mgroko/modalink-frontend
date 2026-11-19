<template>
  <div class="admin-proyecto-detalle">
    <button type="button" class="admin-proyecto-detalle__back" @click="$router.push({ name: 'proyectos-admin' })">
      ← Volver a proyectos
    </button>

    <div v-if="cargando" class="admin-proyecto-detalle__state">Cargando proyecto...</div>
    <p v-else-if="errorMessage" class="admin-proyecto-detalle__error">{{ errorMessage }}</p>

    <template v-else-if="proyecto">
      <header class="admin-proyecto-detalle__header">
        <div>
          <div class="admin-proyecto-detalle__eyebrow">Proyecto #{{ proyecto.idProyecto }}</div>
          <h1>{{ proyecto.nombre }}</h1>
          <p>{{ estadoAmigable(proyecto.estado) }} · {{ privacidadAmigable(proyecto.privacidad) }}</p>
        </div>
        <div class="admin-proyecto-detalle__header-actions">
          <span class="admin-proyecto-detalle__readonly">Solo lectura</span>
          <span class="admin-proyecto-detalle__badge">{{ estadoAmigable(proyecto.estado) }}</span>
        </div>
      </header>

      <section class="admin-proyecto-detalle__card">
        <h2>Datos generales</h2>
        <div v-if="proyecto.descripcion" class="admin-proyecto-detalle__description">
          <span class="admin-proyecto-detalle__label">Descripción</span>
          <p>{{ proyecto.descripcion }}</p>
        </div>
        <div class="admin-proyecto-detalle__grid">
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Estado</span>
            <span>{{ estadoAmigable(proyecto.estado) }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Privacidad</span>
            <span>{{ privacidadAmigable(proyecto.privacidad) }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Acepta postulación general</span>
            <span>{{ proyecto.aceptaPostulacionGral ? 'Sí' : 'No' }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Inicio</span>
            <span>{{ proyecto.fechaInicio ? formatearFecha(proyecto.fechaInicio) : '—' }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Entrega estipulada</span>
            <span>{{ proyecto.fechaEntregaEstipulada ? formatearFecha(proyecto.fechaEntregaEstipulada) : '—' }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Finalización</span>
            <span>{{ proyecto.fechaFinalizacion ? formatearFecha(proyecto.fechaFinalizacion) : '—' }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Cancelación</span>
            <span>{{ proyecto.fechaCancelacion ? formatearFecha(proyecto.fechaCancelacion) : '—' }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Finalización prematura</span>
            <span>{{ proyecto.finalizacionPrematura ? 'Sí' : 'No' }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Ubicación</span>
            <span>{{ ubicacionTexto() }}</span>
          </div>
          <div class="admin-proyecto-detalle__field">
            <span class="admin-proyecto-detalle__label">Director</span>
            <span>{{ proyecto.director?.nombreCompleto || proyecto.director?.nombreArtistico || '—' }}</span>
          </div>
        </div>
        <div v-if="proyecto.motivoCancelacion" class="admin-proyecto-detalle__description">
          <span class="admin-proyecto-detalle__label">Motivo de cancelación</span>
          <p>{{ proyecto.motivoCancelacion }}</p>
        </div>
      </section>

      <section class="admin-proyecto-detalle__card">
        <h2>Objetivos <span>{{ proyecto.objetivos?.length || 0 }}</span></h2>
        <ul v-if="proyecto.objetivos?.length" class="admin-proyecto-detalle__list">
          <li v-for="objetivo in proyecto.objetivos" :key="objetivo.idObjetivo">
            <strong>{{ objetivo.nombre || 'Objetivo' }}</strong>
            <span v-if="objetivo.descripcion"> — {{ objetivo.descripcion }}</span>
          </li>
        </ul>
        <p v-else class="admin-proyecto-detalle__muted">Sin objetivos registrados.</p>
      </section>

      <section class="admin-proyecto-detalle__card">
        <h2>Requerimientos generales <span>{{ proyecto.requerimientosGral?.length || 0 }}</span></h2>
        <div v-if="proyecto.requerimientosGral?.length" class="admin-proyecto-detalle__requirements">
          <article v-for="requerimiento in proyecto.requerimientosGral" :key="requerimiento.idRequerimientoGral" class="admin-proyecto-detalle__requirement">
            <header>
              <strong>{{ requerimiento.nombreProfesion || 'Sin profesión' }}</strong>
              <span>Cantidad: {{ requerimiento.cantidad }}</span>
            </header>
            <p v-if="requerimiento.descripcion">{{ requerimiento.descripcion }}</p>
            <div v-if="requerimiento.caracteristicas?.length" class="admin-proyecto-detalle__chips">
              <span v-for="caracteristica in requerimiento.caracteristicas" :key="caracteristica.idCaracteristica" class="admin-proyecto-detalle__chip">
                {{ caracteristica.codigo }}{{ rangoCaracteristica(caracteristica) }}
              </span>
            </div>
            <div v-if="requerimiento.habilidades?.length" class="admin-proyecto-detalle__chips">
              <span v-for="habilidad in requerimiento.habilidades" :key="habilidad" class="admin-proyecto-detalle__chip admin-proyecto-detalle__chip--soft">{{ habilidad }}</span>
            </div>
          </article>
        </div>
        <p v-else class="admin-proyecto-detalle__muted">Sin requerimientos generales.</p>
      </section>

      <section class="admin-proyecto-detalle__card">
        <h2>Moodboard</h2>
        <p v-if="proyecto.moodboard?.descripcion" class="admin-proyecto-detalle__text">{{ proyecto.moodboard.descripcion }}</p>
        <div v-if="proyecto.moodboard?.imagenes?.length" class="admin-proyecto-detalle__moodboard">
          <img v-for="imagen in proyecto.moodboard.imagenes" :key="imagen.idImagen" :src="resolverFotoUrl(imagen.url)" alt="" />
        </div>
        <p v-else class="admin-proyecto-detalle__muted">Sin imágenes de moodboard.</p>
      </section>

      <section class="admin-proyecto-detalle__card">
        <h2>Miembros <span>{{ proyecto.miembros?.length || 0 }}</span></h2>
        <div v-if="proyecto.miembros?.length" class="admin-proyecto-detalle__table-wrapper">
          <table class="admin-proyecto-detalle__table">
            <thead>
              <tr><th>Miembro</th><th>Profesión</th><th>Rol</th><th>Participación</th><th>Alta</th><th>Baja</th><th>Motivo</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              <tr v-for="miembro in proyecto.miembros" :key="miembro.idMiembro">
                <td>{{ miembro.nombreCompleto || miembro.nombreArtistico || '—' }}</td>
                <td>{{ miembro.profesion || '—' }}</td>
                <td>{{ miembro.rolProyecto || '—' }}</td>
                <td>{{ miembro.estadoParticipacion || '—' }}</td>
                <td>{{ miembro.fechaAlta ? formatearFecha(miembro.fechaAlta) : '—' }}</td>
                <td>{{ miembro.fechaBaja ? formatearFecha(miembro.fechaBaja) : '—' }}</td>
                <td>{{ miembro.motivoBaja || '—' }}</td>
                <td>
                  <button
                    v-if="miembro.idPerfil"
                    type="button"
                    class="admin-proyecto-detalle__link"
                    title="Ver perfil y usuario"
                    @click="verPerfil(miembro)"
                  >
                    Ver perfil
                  </button>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-proyecto-detalle__muted">Sin miembros registrados.</p>
      </section>

      <section class="admin-proyecto-detalle__card">
        <h2>Contratos <span>{{ proyecto.totalContratos || 0 }}</span></h2>
        <div v-if="proyecto.contratos?.length" class="admin-proyecto-detalle__table-wrapper">
          <table class="admin-proyecto-detalle__table">
            <thead>
              <tr><th>Contrato</th><th>Estado</th><th>Versión</th><th>Firmados</th><th>Emisión</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="contrato in proyecto.contratos" :key="contrato.idContrato">
                <td>{{ contrato.nombre || '—' }}</td>
                <td>{{ contrato.estado || '—' }}</td>
                <td>{{ contrato.versionActual ?? '—' }}</td>
                <td>{{ contrato.firmados }}/{{ contrato.totalPartes }}</td>
                <td>{{ contrato.fechaEmision ? formatearFecha(contrato.fechaEmision) : '—' }}</td>
                <td>
                  <button type="button" class="admin-proyecto-detalle__link" @click="$router.push({ name: 'admin-contrato-detalle', params: { id: contrato.idContrato } })">
                    Ver
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-proyecto-detalle__muted">Sin contratos registrados.</p>
      </section>
    </template>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import { formatearFecha } from "../../utils/fechas";
import { resolverFotoUrl } from "../../utils/fotos";

export default {
  name: "ProyectoAdminDetalleView",
  data() {
    return {
      proyecto: null,
      cargando: false,
      errorMessage: "",
    };
  },
  async mounted() {
    await this.cargarProyecto();
  },
  methods: {
    formatearFecha,
    resolverFotoUrl,
    verPerfil(miembro) {
      if (!miembro?.idPerfil) return;
      this.$router.push({
        name: "admin-perfil-detalle",
        params: { id: miembro.idPerfil },
      });
    },
    async cargarProyecto() {
      this.cargando = true;
      this.errorMessage = "";
      try {
        this.proyecto = (await adminService.detalleProyecto(this.$route.params.id))?.data || null;
      } catch (error) {
        this.proyecto = null;
        this.errorMessage = error?.response?.data?.message || "No se pudo cargar el proyecto.";
      } finally {
        this.cargando = false;
      }
    },
    estadoAmigable(estado) {
      const etiquetas = {
        BORRADOR: "Borrador",
        PUBLICADO: "Publicado",
        CONFIRMADO: "Confirmado",
        FINALIZADO: "Finalizado",
        CANCELADO: "Cancelado",
      };
      return etiquetas[estado] || estado || "—";
    },
    privacidadAmigable(privacidad) {
      return privacidad === "PUBLICO" ? "Público" : privacidad === "PRIVADO" ? "Privado" : privacidad || "—";
    },
    ubicacionTexto() {
      const ciudad = this.proyecto?.ubicacion?.ciudad;
      if (!ciudad) return "—";
      return [ciudad.nombre, ciudad.provincia?.nombre, ciudad.provincia?.pais?.nombre].filter(Boolean).join(", ") || "—";
    },
    rangoCaracteristica(caracteristica) {
      if (caracteristica.valorMin == null && caracteristica.valorMax == null) return "";
      if (caracteristica.valorMin != null && caracteristica.valorMax != null) {
        return `: ${caracteristica.valorMin} - ${caracteristica.valorMax}`;
      }
      return `: ${caracteristica.valorMin ?? caracteristica.valorMax}`;
    },
  },
};
</script>

<style scoped>
.admin-proyecto-detalle {
  max-width: 1150px;
  margin: 0 auto;
}
.admin-proyecto-detalle__back {
  margin-bottom: 1rem;
  padding: 0;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}
.admin-proyecto-detalle__state,
.admin-proyecto-detalle__error {
  padding: 2rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  text-align: center;
}
.admin-proyecto-detalle__error {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border-color: var(--color-danger-border);
}
.admin-proyecto-detalle__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.admin-proyecto-detalle__eyebrow {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.admin-proyecto-detalle h1 {
  margin: 0.15rem 0;
  color: var(--color-text);
  font-size: 1.9rem;
}
.admin-proyecto-detalle__header p {
  margin: 0;
  color: var(--color-text-muted);
}
.admin-proyecto-detalle__header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.admin-proyecto-detalle__readonly,
.admin-proyecto-detalle__badge {
  padding: 0.28rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
}
.admin-proyecto-detalle__readonly {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}
.admin-proyecto-detalle__badge {
  color: var(--color-primary);
  background: var(--color-chip);
}
.admin-proyecto-detalle__card {
  margin-bottom: 1rem;
  padding: 1.15rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
}
.admin-proyecto-detalle__card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 1.05rem;
}
.admin-proyecto-detalle__card h2 span {
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  color: var(--color-primary);
  background: var(--color-chip);
  font-size: 0.75rem;
}
.admin-proyecto-detalle__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.admin-proyecto-detalle__field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.admin-proyecto-detalle__label {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-proyecto-detalle__description,
.admin-proyecto-detalle__text {
  margin-bottom: 1rem;
  color: var(--color-text);
  white-space: pre-wrap;
  line-height: 1.55;
}
.admin-proyecto-detalle__description p {
  margin: 0.35rem 0 0;
}
.admin-proyecto-detalle__muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.admin-proyecto-detalle__list {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--color-text);
  line-height: 1.7;
}
.admin-proyecto-detalle__requirements {
  display: grid;
  gap: 0.8rem;
}
.admin-proyecto-detalle__requirement {
  padding: 0.85rem;
  background: var(--color-surface-muted);
  border-radius: 0.6rem;
}
.admin-proyecto-detalle__requirement header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-text);
}
.admin-proyecto-detalle__requirement p {
  margin: 0.5rem 0;
  color: var(--color-text-muted);
}
.admin-proyecto-detalle__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.admin-proyecto-detalle__chip {
  padding: 0.22rem 0.5rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 1rem;
  font-size: 0.74rem;
}
.admin-proyecto-detalle__chip--soft {
  color: var(--color-text-muted);
  background: var(--color-surface);
}
.admin-proyecto-detalle__moodboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.65rem;
}
.admin-proyecto-detalle__moodboard img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  object-fit: cover;
}
.admin-proyecto-detalle__table-wrapper {
  overflow-x: auto;
}
.admin-proyecto-detalle__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.admin-proyecto-detalle__table th,
.admin-proyecto-detalle__table td {
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
}
.admin-proyecto-detalle__table th {
  color: var(--color-text-muted);
  font-weight: 600;
}
.admin-proyecto-detalle__link {
  padding: 0.35rem 0.55rem;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.4rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}
@media (max-width: 720px) {
  .admin-proyecto-detalle__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
