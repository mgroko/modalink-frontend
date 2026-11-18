<template>
  <div class="admin-perfiles">
    <header class="admin-perfiles__header">
      <div>
        <h1>Perfiles</h1>
        <p>Consultá los perfiles registrados en la plataforma. Vista de solo lectura.</p>
      </div>
      <button type="button" class="admin-perfiles__refresh" :disabled="cargando" @click="cargarPerfiles(paginacion.paginaActual)">
        <span class="material-symbols-outlined">refresh</span>
        Actualizar
      </button>
    </header>

    <div class="admin-perfiles__toolbar">
      <input
        v-model="texto"
        type="search"
        placeholder="Nombre, apellido, correo, DNI o nombre artístico"
        class="admin-perfiles__input"
        @keyup.enter="buscarAhora"
      />

      <select v-model="idProfesion" class="admin-perfiles__select" @change="buscarAhora">
        <option value="">Todas las profesiones</option>
        <option v-for="profesion in profesiones" :key="profesion.idProfesion" :value="String(profesion.idProfesion)">
          {{ profesion.nombre }}
        </option>
      </select>

      <select v-model="estado" class="admin-perfiles__select" @change="buscarAhora">
        <option value="">Todos los estados</option>
        <option value="ACTIVO">Activo</option>
        <option value="DESHABILITADO">Deshabilitado</option>
        <option value="PENDIENTE_BAJA">Pendiente de baja</option>
        <option value="BAJA">Baja</option>
      </select>

      <button type="button" class="admin-perfiles__search" :disabled="cargando" @click="buscarAhora">
        Buscar
      </button>
    </div>

    <p v-if="errorMessage" class="admin-perfiles__error">{{ errorMessage }}</p>
    <div v-if="cargando" class="admin-perfiles__state">Cargando perfiles...</div>
    <div v-else-if="!perfiles.length" class="admin-perfiles__state">No hay perfiles para mostrar.</div>
    <div v-else class="admin-perfiles__table-wrapper">
      <table class="admin-perfiles__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Perfil</th>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Profesión</th>
            <th>Estado</th>
            <th>Baja</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="perfil in perfiles" :key="perfil.idPerfil">
            <td class="admin-perfiles__mono">{{ perfil.idPerfil }}</td>
            <td>
              <div class="admin-perfiles__profile">
                <img v-if="perfil.fotoUrl" :src="resolverFotoUrl(perfil.fotoUrl)" alt="" class="admin-perfiles__avatar" />
                <span v-else class="admin-perfiles__avatar admin-perfiles__avatar--placeholder">P</span>
                <span>{{ perfil.nombreArtistico || 'Sin nombre artístico' }}</span>
              </div>
            </td>
            <td>{{ nombreUsuario(perfil) }}</td>
            <td>{{ perfil.correo || '—' }}</td>
            <td>{{ perfil.profesion || '—' }}</td>
            <td><span class="admin-perfiles__badge" :class="estadoClase(perfil.estado)">{{ estadoAmigable(perfil.estado) }}</span></td>
            <td>{{ perfil.fechaSolicitudBaja ? formatearFecha(perfil.fechaSolicitudBaja) : '—' }}</td>
            <td>
              <button type="button" class="admin-perfiles__detail" @click="verDetalle(perfil)">
                Ver detalle
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="paginacion.totalPaginas > 1" class="admin-perfiles__pagination">
      <button type="button" :disabled="paginacion.primera || cargando" @click="cargarPerfiles(paginacion.paginaActual - 1)">Anterior</button>
      <span>Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }} · {{ paginacion.totalElementos }} perfiles</span>
      <button type="button" :disabled="paginacion.ultima || cargando" @click="cargarPerfiles(paginacion.paginaActual + 1)">Siguiente</button>
    </div>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import adminCaracteristicasService from "../../services/adminCaracteristicasService";
import { formatearFecha } from "../../utils/fechas";
import { resolverFotoUrl } from "../../utils/fotos";

export default {
  name: "PerfilesAdminView",
  data() {
    return {
      perfiles: [],
      profesiones: [],
      texto: "",
      idProfesion: "",
      estado: "",
      cargando: false,
      errorMessage: "",
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
    };
  },
  async mounted() {
    await this.cargarProfesiones();
    await this.cargarPerfiles(0);
  },
  methods: {
    formatearFecha,
    resolverFotoUrl,
    async cargarProfesiones() {
      try {
        const response = await adminCaracteristicasService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      }
    },
    async cargarPerfiles(page = 0) {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const params = { page, size: 20 };
        if (this.texto.trim()) params.texto = this.texto.trim();
        if (this.idProfesion) params.idProfesion = Number(this.idProfesion);
        if (this.estado) params.estado = this.estado;

        const data = (await adminService.buscarPerfiles(params))?.data || {};
        this.perfiles = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: data.paginaActual ?? page,
          totalPaginas: data.totalPaginas ?? 1,
          totalElementos: data.totalElementos ?? this.perfiles.length,
          primera: data.primera ?? true,
          ultima: data.ultima ?? true,
        };
      } catch (error) {
        this.perfiles = [];
        this.errorMessage = error?.response?.data?.message || "No se pudieron cargar los perfiles.";
      } finally {
        this.cargando = false;
      }
    },
    buscarAhora() {
      this.cargarPerfiles(0);
    },
    verDetalle(perfil) {
      this.$router.push({ name: "admin-perfil-detalle", params: { id: perfil.idPerfil } });
    },
    nombreUsuario(perfil) {
      return [perfil.nombreUsuario, perfil.apellidoUsuario].filter(Boolean).join(" ") || "—";
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
    estadoClase(estado) {
      return {
        "admin-perfiles__badge--activo": estado === "ACTIVO",
        "admin-perfiles__badge--deshabilitado": estado === "DESHABILITADO",
        "admin-perfiles__badge--pendiente": estado === "PENDIENTE_BAJA",
        "admin-perfiles__badge--baja": estado === "BAJA",
      };
    },
  },
};
</script>

<style scoped>
.admin-perfiles {
  max-width: 1250px;
  margin: 0 auto;
}
.admin-perfiles__header,
.admin-perfiles__toolbar,
.admin-perfiles__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.admin-perfiles__header {
  margin-bottom: 1.5rem;
}
.admin-perfiles h1 {
  margin: 0;
  color: var(--color-text);
}
.admin-perfiles p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}
.admin-perfiles__refresh,
.admin-perfiles__search,
.admin-perfiles__pagination button,
.admin-perfiles__detail {
  padding: 0.6rem 0.85rem;
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}
.admin-perfiles__refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.admin-perfiles__refresh:disabled,
.admin-perfiles__search:disabled,
.admin-perfiles__pagination button:disabled {
  cursor: wait;
  opacity: 0.5;
}
.admin-perfiles__toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.admin-perfiles__input,
.admin-perfiles__select {
  min-height: 2.4rem;
  padding: 0.6rem 0.75rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.85rem;
}
.admin-perfiles__input {
  min-width: 320px;
  flex: 1 1 320px;
}
.admin-perfiles__select {
  min-width: 190px;
}
.admin-perfiles__error {
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger-border);
  border-radius: 0.5rem;
  font-size: 0.85rem;
}
.admin-perfiles__state {
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
  text-align: center;
}
.admin-perfiles__table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 0.75rem;
}
.admin-perfiles__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;
}
.admin-perfiles__table th,
.admin-perfiles__table td {
  padding: 0.8rem 0.85rem;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: middle;
}
.admin-perfiles__table th {
  color: var(--color-text-muted);
  font-weight: 600;
}
.admin-perfiles__table td {
  color: var(--color-text);
}
.admin-perfiles__mono {
  font-family: monospace;
  color: var(--color-text-muted);
}
.admin-perfiles__profile {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 180px;
}
.admin-perfiles__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}
.admin-perfiles__avatar--placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-chip);
  font-size: 0.75rem;
  font-weight: 700;
}
.admin-perfiles__badge {
  display: inline-block;
  padding: 0.22rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.73rem;
  background: var(--color-chip);
  color: var(--color-primary);
}
.admin-perfiles__badge--deshabilitado {
  color: var(--color-danger-text);
  background: var(--color-danger-soft);
}
.admin-perfiles__badge--pendiente {
  color: #8a6100;
  background: #fff3cd;
}
.admin-perfiles__badge--baja {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}
.admin-perfiles__pagination {
  justify-content: center;
  margin-top: 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
@media (max-width: 720px) {
  .admin-perfiles__header,
  .admin-perfiles__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .admin-perfiles__input {
    min-width: 100%;
  }
}
</style>
