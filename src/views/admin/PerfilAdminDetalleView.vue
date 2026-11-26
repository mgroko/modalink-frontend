<template>
  <div class="admin-perfil-detalle">
    <button type="button" class="admin-perfil-detalle__back" @click="$router.push({ name: 'perfiles-admin' })">
      ← Volver a perfiles
    </button>

    <div v-if="cargando" class="admin-perfil-detalle__state">Cargando perfil...</div>
    <p v-else-if="errorMessage" class="admin-perfil-detalle__error">{{ errorMessage }}</p>

    <template v-else-if="perfil">
      <header class="admin-perfil-detalle__header">
        <div class="admin-perfil-detalle__identity">
          <img v-if="perfil.fotoUrl" :src="resolverFotoUrl(perfil.fotoUrl)" alt="" class="admin-perfil-detalle__photo" />
          <div v-else class="admin-perfil-detalle__photo admin-perfil-detalle__photo--placeholder">P</div>
          <div>
            <div class="admin-perfil-detalle__eyebrow">Perfil #{{ perfil.idPerfil }}</div>
            <h1>{{ perfil.nombreArtistico || 'Sin nombre artístico' }}</h1>
            <p>{{ perfil.profesion || 'Sin profesión' }} · {{ nombreUsuario() }}</p>
          </div>
        </div>
        <div class="admin-perfil-detalle__header-actions">
          <span class="admin-perfil-detalle__readonly">Solo lectura</span>
          <span class="admin-perfil-detalle__badge">{{ estadoAmigable(perfil.estado) }}</span>
        </div>
      </header>

      <section class="admin-perfil-detalle__card">
        <h2>Datos del perfil</h2>
        <div class="admin-perfil-detalle__grid">
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Estado</span>
            <span>{{ estadoAmigable(perfil.estado) }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Profesión</span>
            <span>{{ perfil.profesion || '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Solicitud de baja</span>
            <span>{{ perfil.fechaSolicitudBaja ? formatearFecha(perfil.fechaSolicitudBaja) : 'No solicitó' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Fecha límite de baja</span>
            <span>{{ perfil.fechaLimiteBaja ? formatearFecha(perfil.fechaLimiteBaja) : '—' }}</span>
          </div>
        </div>
        <div v-if="perfil.biografia" class="admin-perfil-detalle__bio">
          <span class="admin-perfil-detalle__label">Biografía</span>
          <p>{{ perfil.biografia }}</p>
        </div>
      </section>

      <section class="admin-perfil-detalle__card">
        <h2>Usuario propietario</h2>
        <div class="admin-perfil-detalle__grid">
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Nombre completo</span>
            <span>{{ nombreUsuario() }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Correo</span>
            <span>{{ perfil.usuario?.correo || '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">DNI</span>
            <span>{{ perfil.usuario?.dni || '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Fecha de nacimiento</span>
            <span>{{ perfil.usuario?.fechaNacimiento ? formatearFecha(perfil.usuario.fechaNacimiento) : '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Género</span>
            <span>{{ perfil.usuario?.genero || '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Estado de la cuenta</span>
            <span>{{ perfil.usuario?.estado || '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Rol global</span>
            <span>{{ perfil.usuario?.rolGlobal || '—' }}</span>
          </div>
          <div class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Ubicación</span>
            <span>{{ ubicacionTexto() }}</span>
          </div>
          <div v-if="perfil.usuario?.motivoDeshabilitacion" class="admin-perfil-detalle__field">
            <span class="admin-perfil-detalle__label">Motivo de deshabilitación</span>
            <span>{{ perfil.usuario.motivoDeshabilitacion }}</span>
          </div>
        </div>
      </section>

      <section class="admin-perfil-detalle__card">
        <h2>Habilidades y características</h2>
        <div v-if="perfil.habilidades?.length" class="admin-perfil-detalle__chips">
          <span v-for="habilidad in perfil.habilidades" :key="habilidad" class="admin-perfil-detalle__chip">{{ habilidad }}</span>
        </div>
        <p v-else class="admin-perfil-detalle__muted">Sin habilidades registradas.</p>

        <div v-if="perfil.caracteristicas?.length" class="admin-perfil-detalle__characteristics">
          <div v-for="caracteristica in perfil.caracteristicas" :key="`${caracteristica.idCaracteristica}-${caracteristica.valor}`" class="admin-perfil-detalle__characteristic">
            <span class="admin-perfil-detalle__label">{{ caracteristica.codigo }}</span>
            <span>{{ caracteristica.valor }}{{ caracteristica.codigoValor ? ` (${caracteristica.codigoValor})` : '' }}</span>
          </div>
        </div>
      </section>

      <section class="admin-perfil-detalle__card">
        <h2>Términos y condiciones vigentes</h2>
        <template v-if="hayTerminosConfigurados">
          <div class="admin-perfil-detalle__grid">
            <div class="admin-perfil-detalle__field">
              <span class="admin-perfil-detalle__label">Versión</span>
              <span>{{ perfil.terminosCondiciones.idTyc || '—' }}</span>
            </div>
            <div class="admin-perfil-detalle__field">
              <span class="admin-perfil-detalle__label">Desde</span>
              <span>{{ perfil.terminosCondiciones.fechaInicio ? formatearFecha(perfil.terminosCondiciones.fechaInicio) : '—' }}</span>
            </div>
            <div class="admin-perfil-detalle__field">
              <span class="admin-perfil-detalle__label">Hasta</span>
              <span>{{ perfil.terminosCondiciones.fechaFin ? formatearFecha(perfil.terminosCondiciones.fechaFin) : '—' }}</span>
            </div>
            <div class="admin-perfil-detalle__field">
              <span class="admin-perfil-detalle__label">Origen</span>
              <span>Configurado por el perfil</span>
            </div>
          </div>
          <p v-if="perfil.terminosCondiciones.descripcion" class="admin-perfil-detalle__text">{{ perfil.terminosCondiciones.descripcion }}</p>
          <button
            type="button"
            class="admin-perfil-detalle__link admin-perfil-detalle__link--block"
            @click="modalHistorial = true"
          >
            Ver historial
          </button>
        </template>
        <p v-else class="admin-perfil-detalle__muted">
          Sin términos y condiciones configurados.
        </p>
      </section>

      <section class="admin-perfil-detalle__card">
        <h2>Proyectos relacionados <span>{{ perfil.resumenRelacionados?.totalProyectos || 0 }}</span></h2>
        <div v-if="perfil.proyectos?.length" class="admin-perfil-detalle__table-wrapper admin-tabla-responsive-wrapper">
          <table class="admin-perfil-detalle__table admin-tabla-responsive">
            <thead>
              <tr><th>Proyecto</th><th>Estado</th><th>Rol</th><th>Participación</th><th>Alta</th><th>Baja</th></tr>
            </thead>
            <tbody>
              <tr v-for="proyecto in perfil.proyectos" :key="`${proyecto.idProyecto}-${proyecto.fechaAlta}`">
                <td data-label="Proyecto">{{ proyecto.nombre || '—' }}</td>
                <td data-label="Estado">{{ proyecto.estadoProyecto || '—' }}</td>
                <td data-label="Rol">{{ proyecto.rolProyecto || '—' }}</td>
                <td data-label="Participación">{{ proyecto.estadoParticipacion || '—' }}</td>
                <td data-label="Alta">{{ proyecto.fechaAlta ? formatearFecha(proyecto.fechaAlta) : '—' }}</td>
                <td data-label="Baja">{{ proyecto.fechaBaja ? formatearFecha(proyecto.fechaBaja) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-perfil-detalle__muted">Sin proyectos relacionados.</p>
      </section>

      <section class="admin-perfil-detalle__card">
        <h2>Contratos relacionados <span>{{ perfil.resumenRelacionados?.totalContratos || 0 }}</span></h2>
        <div v-if="perfil.contratos?.length" class="admin-perfil-detalle__table-wrapper admin-tabla-responsive-wrapper">
          <table class="admin-perfil-detalle__table admin-tabla-responsive">
            <thead>
              <tr><th>Contrato</th><th>Proyecto</th><th>Estado</th><th>Parte</th><th>Firma</th><th>Emisión</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="contrato in perfil.contratos" :key="contrato.idContrato">
                <td data-label="Contrato">{{ contrato.nombre || '—' }}</td>
                <td data-label="Proyecto">{{ contrato.nombreProyecto || '—' }}</td>
                <td data-label="Estado">{{ contrato.estado || '—' }}</td>
                <td data-label="Parte">{{ contrato.rolParte || '—' }}</td>
                <td data-label="Firma">{{ contrato.estadoFirma || '—' }}</td>
                <td data-label="Emisión">{{ contrato.fechaEmision ? formatearFecha(contrato.fechaEmision) : '—' }}</td>
                <td data-label="Acciones">
                  <button type="button" class="admin-perfil-detalle__link" @click="$router.push({ name: 'admin-contrato-detalle', params: { id: contrato.idContrato } })">
                    Ver
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-perfil-detalle__muted">Sin contratos relacionados.</p>
      </section>

      <section class="admin-perfil-detalle__card">
        <h2>Publicaciones relacionadas <span>{{ perfil.resumenRelacionados?.totalPublicaciones || 0 }}</span></h2>
        <div v-if="perfil.publicaciones?.length" class="admin-perfil-detalle__table-wrapper admin-tabla-responsive-wrapper">
          <table class="admin-perfil-detalle__table admin-tabla-responsive">
            <thead>
              <tr><th>Publicación</th><th>Estado</th><th>Fecha</th><th>Proyecto</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="publicacion in perfil.publicaciones" :key="publicacion.idPublicacion">
                <td data-label="Publicación">{{ publicacion.titulo || '—' }}</td>
                <td data-label="Estado">{{ publicacion.estado || '—' }}</td>
                <td data-label="Fecha">{{ publicacion.fechaPublicacion ? formatearFecha(publicacion.fechaPublicacion) : '—' }}</td>
                <td data-label="Proyecto">{{ publicacion.nombreProyecto || '—' }}</td>
                <td data-label="Acciones">
                  <button type="button" class="admin-perfil-detalle__link" @click="abrirPublicacion(publicacion)">
                    Ver
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="admin-perfil-detalle__muted">Sin publicaciones relacionadas.</p>
      </section>
    </template>

    <TerminosCondicionesHistorialModal
      v-if="perfil"
      v-model="modalHistorial"
      :id-perfil="perfil.idPerfil"
      modo="admin"
    />

    <PublicacionAdminDetalleModal
      v-model="modalPublicacion"
      :id-publicacion="publicacionSeleccionada?.idPublicacion"
    />
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import TerminosCondicionesHistorialModal from "../../components/perfil/TerminosCondicionesHistorialModal.vue";
import PublicacionAdminDetalleModal from "../../components/admin/PublicacionAdminDetalleModal.vue";
import { formatearFecha } from "../../utils/fechas";
import { resolverFotoUrl } from "../../utils/fotos";

export default {
  name: "PerfilAdminDetalleView",
  components: { TerminosCondicionesHistorialModal, PublicacionAdminDetalleModal },
  data() {
    return {
      perfil: null,
      modalHistorial: false,
      modalPublicacion: false,
      publicacionSeleccionada: null,
      cargando: false,
      errorMessage: "",
    };
  },
  computed: {
    hayTerminosConfigurados() {
      return Boolean(
        this.perfil?.terminosCondiciones &&
        !this.perfil.terminosCondiciones.esPlantilla
      );
    },
  },
  async mounted() {
    await this.cargarPerfil();
  },
  methods: {
    formatearFecha,
    resolverFotoUrl,
    async cargarPerfil() {
      this.cargando = true;
      this.errorMessage = "";
      try {
        this.perfil = (await adminService.detallePerfil(this.$route.params.id))?.data || null;
      } catch (error) {
        this.perfil = null;
        this.errorMessage = error?.response?.data?.message || "No se pudo cargar el perfil.";
      } finally {
        this.cargando = false;
      }
    },
    abrirPublicacion(publicacion) {
      if (publicacion?.idPublicacion == null) return;
      this.publicacionSeleccionada = publicacion;
      this.modalPublicacion = true;
    },
    nombreUsuario() {
      const usuario = this.perfil?.usuario;
      return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || "—";
    },
    ubicacionTexto() {
      const ciudad = this.perfil?.ubicacion?.ciudad;
      if (!ciudad) return "—";
      return [ciudad.nombre, ciudad.provincia?.nombre, ciudad.provincia?.pais?.nombre].filter(Boolean).join(", ") || "—";
    },
    estadoAmigable(estado) {
      const etiquetas = {
        ACTIVO: "Activo",
        DESHABILITADO: "Deshabilitado",
        PENDIENTE_BAJA: "Pendiente de baja",
        BAJA: "Baja",
      };
      return etiquetas[estado] || estado || "—";
    },
  },
};
</script>

<style scoped>
.admin-perfil-detalle {
  max-width: 1150px;
  margin: 0 auto;
}
.admin-perfil-detalle__back {
  margin-bottom: 1rem;
  padding: 0;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}
.admin-perfil-detalle__state,
.admin-perfil-detalle__error {
  padding: 2rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  text-align: center;
}
.admin-perfil-detalle__error {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border-color: var(--color-danger-border);
}
.admin-perfil-detalle__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.admin-perfil-detalle__identity {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.admin-perfil-detalle__photo {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
}
.admin-perfil-detalle__photo--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-chip);
  font-size: 1.5rem;
  font-weight: 800;
}
.admin-perfil-detalle__eyebrow {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.admin-perfil-detalle h1 {
  margin: 0.15rem 0;
  color: var(--color-text);
  font-size: 1.9rem;
}
.admin-perfil-detalle__identity p {
  margin: 0;
  color: var(--color-text-muted);
}
.admin-perfil-detalle__header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.admin-perfil-detalle__readonly,
.admin-perfil-detalle__badge {
  padding: 0.28rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
}
.admin-perfil-detalle__readonly {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}
.admin-perfil-detalle__badge {
  color: var(--color-primary);
  background: var(--color-chip);
}
.admin-perfil-detalle__card {
  margin-bottom: 1rem;
  padding: 1.15rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
}
.admin-perfil-detalle__card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: var(--color-text);
  font-size: 1.05rem;
}
.admin-perfil-detalle__card h2 span {
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  color: var(--color-primary);
  background: var(--color-chip);
  font-size: 0.75rem;
}
.admin-perfil-detalle__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.admin-perfil-detalle__field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.admin-perfil-detalle__label {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-perfil-detalle__bio,
.admin-perfil-detalle__text {
  margin-top: 1rem;
  color: var(--color-text);
  white-space: pre-wrap;
  line-height: 1.55;
}
.admin-perfil-detalle__muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.admin-perfil-detalle__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.admin-perfil-detalle__chip {
  padding: 0.25rem 0.55rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 1rem;
  font-size: 0.78rem;
}
.admin-perfil-detalle__characteristics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}
.admin-perfil-detalle__characteristic {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.admin-perfil-detalle__table-wrapper {
  overflow-x: auto;
}
.admin-perfil-detalle__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.admin-perfil-detalle__table th,
.admin-perfil-detalle__table td {
  padding: 0.65rem 0.7rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
}
.admin-perfil-detalle__table th {
  color: var(--color-text-muted);
  font-weight: 600;
}
.admin-perfil-detalle__link--block {
  margin-top: 0.75rem;
}
.admin-perfil-detalle__link {
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
  .admin-perfil-detalle__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
