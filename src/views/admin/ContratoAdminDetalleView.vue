<template>
  <div class="admin-contrato-detalle">
    <button type="button" class="admin-contrato-detalle__back" @click="$router.push({ name: 'contratos-admin' })">
      ← Volver a contratos
    </button>

    <div v-if="cargando" class="admin-contrato-detalle__state">Cargando contrato...</div>
    <p v-else-if="errorMessage" class="admin-contrato-detalle__error">{{ errorMessage }}</p>

    <template v-else-if="contrato">
      <header class="admin-contrato-detalle__header">
        <div>
          <div class="admin-contrato-detalle__eyebrow">Contrato #{{ contrato.idContrato }}</div>
          <h1>{{ contrato.nombre }}</h1>
          <p>{{ contrato.proyecto?.nombre || 'Sin proyecto' }} · versión {{ contrato.versionActual ?? '—' }}</p>
        </div>
        <div class="admin-contrato-detalle__header-actions">
          <span class="admin-contrato-detalle__readonly">Solo lectura</span>
          <span class="admin-contrato-detalle__badge">{{ estadoAmigable(contrato.estado) }}</span>
        </div>
      </header>

      <section class="admin-contrato-detalle__card">
        <h2>Datos generales</h2>
        <div v-if="contrato.descripcion" class="admin-contrato-detalle__description">
          <span class="admin-contrato-detalle__label">Descripción</span>
          <p>{{ contrato.descripcion }}</p>
        </div>
        <div class="admin-contrato-detalle__grid">
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Estado</span>
            <span>{{ estadoAmigable(contrato.estado) }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Proyecto</span>
            <span>{{ contrato.proyecto?.nombre || '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Estado del proyecto</span>
            <span>{{ contrato.proyecto?.estado || '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Tipo de acuerdo</span>
            <span>{{ contrato.tipoAcuerdo?.nombre || contrato.tipoAcuerdo?.codigo || '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Emisor</span>
            <span>{{ contrato.emisor?.nombreCompleto || contrato.emisor?.nombreArtistico || '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">DNI del emisor</span>
            <span>{{ contrato.emisor?.dni || '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Creación</span>
            <span>{{ contrato.fechaCreacion ? formatearFecha(contrato.fechaCreacion) : '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Emisión</span>
            <span>{{ contrato.fechaEmision ? formatearFecha(contrato.fechaEmision) : '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Modificación</span>
            <span>{{ contrato.fechaModificacion ? formatearFecha(contrato.fechaModificacion) : '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Baja</span>
            <span>{{ contrato.fechaBaja ? formatearFecha(contrato.fechaBaja) : '—' }}</span>
          </div>
          <div class="admin-contrato-detalle__field">
            <span class="admin-contrato-detalle__label">Firmas</span>
            <span>{{ contrato.firmados }}/{{ contrato.totalPartes }}</span>
          </div>
        </div>
        <div v-if="contrato.motivoCancelacion" class="admin-contrato-detalle__description">
          <span class="admin-contrato-detalle__label">Motivo de cancelación</span>
          <p>{{ contrato.motivoCancelacion }}</p>
        </div>
      </section>

      <section class="admin-contrato-detalle__card">
        <h2>Partes y firmas <span>{{ contrato.partes?.length || 0 }}</span></h2>
        <div v-if="contrato.partes?.length" class="admin-contrato-detalle__table-wrapper">
          <table class="admin-contrato-detalle__table">
            <thead>
              <tr><th>Parte</th><th>Perfil</th><th>DNI</th><th>Rol</th><th>Estado</th><th>Fecha de firma</th></tr>
            </thead>
            <tbody>
              <tr v-for="parte in contrato.partes" :key="parte.idMiembro">
                <td>{{ parte.nombreCompleto || parte.nombreArtistico || '—' }}</td>
                <td>{{ parte.idPerfil ?? '—' }}</td>
                <td>{{ parte.dni || '—' }}</td>
                <td>{{ parte.rolParte || '—' }}</td>
                <td>{{ parte.estadoFirma || '—' }}</td>
                <td>{{ parte.fechaFirma ? formatearFecha(parte.fechaFirma) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-contrato-detalle__muted">Sin partes registradas.</p>
      </section>

      <section class="admin-contrato-detalle__card">
        <h2>Texto del contrato</h2>
        <pre v-if="contrato.texto" class="admin-contrato-detalle__text">{{ contrato.texto }}</pre>
        <p v-else class="admin-contrato-detalle__muted">El contrato no tiene texto registrado.</p>
      </section>

      <section class="admin-contrato-detalle__card">
        <h2>Eventos <span>{{ eventos.length }}</span></h2>
        <div v-if="eventos.length" class="admin-contrato-detalle__table-wrapper">
          <table class="admin-contrato-detalle__table">
            <thead>
              <tr><th>Evento</th><th>Fecha</th><th>Parte</th><th>Operador</th><th>Versión</th><th>Motivo</th></tr>
            </thead>
            <tbody>
              <tr v-for="evento in eventos" :key="evento.idEvento">
                <td>{{ evento.tipoEvento || '—' }}</td>
                <td>{{ evento.fechaHora ? formatearFecha(evento.fechaHora) : '—' }}</td>
                <td>{{ evento.nombreParte || '—' }}</td>
                <td>{{ evento.nombreOperador || '—' }}</td>
                <td>{{ evento.version ?? '—' }}</td>
                <td>{{ evento.motivo || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-contrato-detalle__muted">Sin eventos registrados.</p>
      </section>
    </template>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import { formatearFecha } from "../../utils/fechas";

export default {
  name: "ContratoAdminDetalleView",
  data() {
    return {
      contrato: null,
      eventos: [],
      cargando: false,
      errorMessage: "",
    };
  },
  async mounted() {
    await this.cargarContrato();
  },
  methods: {
    formatearFecha,
    async cargarContrato() {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const id = this.$route.params.id;
        const [contratoResponse, eventosResponse] = await Promise.all([
          adminService.detalleContrato(id),
          adminService.eventosContrato(id),
        ]);
        this.contrato = contratoResponse?.data || null;
        this.eventos = Array.isArray(eventosResponse?.data) ? eventosResponse.data : [];
      } catch (error) {
        this.contrato = null;
        this.eventos = [];
        this.errorMessage = error?.response?.data?.message || "No se pudo cargar el contrato.";
      } finally {
        this.cargando = false;
      }
    },
    estadoAmigable(estado) {
      const etiquetas = {
        BORRADOR: "Borrador",
        PENDIENTE_FIRMA: "Pendiente de firma",
        ACTIVO: "Activo",
        RECHAZADO_POR_PARTES: "Rechazado por las partes",
        CANCELADO: "Cancelado",
        ELIMINADO: "Eliminado",
      };
      return etiquetas[estado] || estado || "—";
    },
  },
};
</script>

<style scoped>
.admin-contrato-detalle {
  max-width: 1150px;
  margin: 0 auto;
}
.admin-contrato-detalle__back {
  margin-bottom: 1rem;
  padding: 0;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}
.admin-contrato-detalle__state,
.admin-contrato-detalle__error {
  padding: 2rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  text-align: center;
}
.admin-contrato-detalle__error {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border-color: var(--color-danger-border);
}
.admin-contrato-detalle__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.admin-contrato-detalle__eyebrow {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.admin-contrato-detalle h1 {
  margin: 0.15rem 0;
  color: var(--color-text);
  font-size: 1.9rem;
}
.admin-contrato-detalle__header p {
  margin: 0;
  color: var(--color-text-muted);
}
.admin-contrato-detalle__header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.admin-contrato-detalle__readonly,
.admin-contrato-detalle__badge {
  padding: 0.28rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
}
.admin-contrato-detalle__readonly {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}
.admin-contrato-detalle__badge {
  color: var(--color-primary);
  background: var(--color-chip);
}
.admin-contrato-detalle__card {
  margin-bottom: 1rem;
  padding: 1.15rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
}
.admin-contrato-detalle__card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 1.05rem;
}
.admin-contrato-detalle__card h2 span {
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  color: var(--color-primary);
  background: var(--color-chip);
  font-size: 0.75rem;
}
.admin-contrato-detalle__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.admin-contrato-detalle__field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.admin-contrato-detalle__label {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-contrato-detalle__description {
  margin-bottom: 1rem;
  color: var(--color-text);
}
.admin-contrato-detalle__description p {
  margin: 0.35rem 0 0;
  white-space: pre-wrap;
}
.admin-contrato-detalle__text {
  margin: 0;
  padding: 1rem;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border-radius: 0.6rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: inherit;
  font-size: 0.88rem;
  line-height: 1.6;
}
.admin-contrato-detalle__muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.admin-contrato-detalle__table-wrapper {
  overflow-x: auto;
}
.admin-contrato-detalle__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.admin-contrato-detalle__table th,
.admin-contrato-detalle__table td {
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
}
.admin-contrato-detalle__table th {
  color: var(--color-text-muted);
  font-weight: 600;
}
@media (max-width: 720px) {
  .admin-contrato-detalle__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
