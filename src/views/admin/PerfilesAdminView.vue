<template>
  <div class="admin-perfiles">
    <header class="admin-perfiles__header">
      <div>
        <h1>Perfiles</h1>
        <p>Consultá los perfiles registrados en la plataforma. Vista de solo lectura.</p>
      </div>
      <button type="button" class="admin-perfiles__refresh" :disabled="cargando" @click="cargarPerfiles">
        <span class="material-symbols-outlined">refresh</span>
        Actualizar
      </button>
    </header>

    <p v-if="errorMessage" class="admin-perfiles__error">{{ errorMessage }}</p>

    <AdminTablaFiltrable
      :columns="columnas"
      :items="perfilesTabla"
      :loading="cargando"
      entidad="perfiles"
      empty-text="No hay perfiles para mostrar."
    >
      <template #toolbar>
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
      </template>

      <template #cell(idPerfil)="{ value }">
        <span class="admin-perfiles__mono">{{ value }}</span>
      </template>

      <template #cell(nombreArtistico)="{ rowData }">
        <div class="admin-perfiles__profile">
          <img v-if="rowData.fotoUrl" :src="resolverFotoUrl(rowData.fotoUrl)" alt="" class="admin-perfiles__avatar" />
          <span v-else class="admin-perfiles__avatar admin-perfiles__avatar--placeholder">P</span>
          <span>{{ rowData.nombreArtistico || 'Sin nombre artístico' }}</span>
        </div>
      </template>

      <template #cell(usuarioCompleto)="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell(correo)="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell(profesion)="{ value }">
        {{ value || '—' }}
      </template>

      <template #cell(estado)="{ value }">
        <span class="admin-perfiles__badge" :class="estadoClase(value)">{{ estadoAmigable(value) }}</span>
      </template>

      <template #cell(fechaSolicitudBaja)="{ value }">
        {{ value ? formatearFecha(value) : '—' }}
      </template>

      <template #cell(acciones)="{ rowData }">
        <button type="button" class="admin-perfiles__detail" @click="verDetalle(rowData)">
          Ver detalle
        </button>
      </template>
    </AdminTablaFiltrable>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import adminCaracteristicasService from "../../services/adminCaracteristicasService";
import { formatearFecha } from "../../utils/fechas";
import { resolverFotoUrl } from "../../utils/fotos";
import AdminTablaFiltrable from "../../components/admin/AdminTablaFiltrable.vue";

export default {
  name: "PerfilesAdminView",
  components: { AdminTablaFiltrable },
  data() {
    return {
      perfiles: [],
      profesiones: [],
      texto: "",
      idProfesion: "",
      estado: "",
      cargando: false,
      errorMessage: "",
      opcionesEstado: [
        { value: "ACTIVO", label: "Activo" },
        { value: "DESHABILITADO", label: "Deshabilitado" },
        { value: "PENDIENTE_BAJA", label: "Pendiente de baja" },
        { value: "BAJA", label: "Baja" },
      ],
    };
  },
  computed: {
    /**
     * Agrega el nombre completo del usuario para ordenar/filtrar esa columna
     * sin depender de dos campos separados.
     */
    perfilesTabla() {
      return this.perfiles.map((perfil) => ({
        ...perfil,
        usuarioCompleto: this.nombreUsuario(perfil),
      }));
    },
    columnas() {
      return [
        {
          key: "idPerfil",
          label: "ID",
          sortable: true,
          filter: { type: "text", placeholder: "ID" },
        },
        {
          key: "nombreArtistico",
          label: "Perfil",
          sortable: true,
          filter: { type: "text", placeholder: "Perfil" },
        },
        {
          key: "usuarioCompleto",
          label: "Usuario",
          sortable: true,
          filter: { type: "text", placeholder: "Usuario" },
        },
        {
          key: "correo",
          label: "Correo",
          sortable: true,
          filter: { type: "text", placeholder: "Correo" },
        },
        {
          key: "profesion",
          label: "Profesión",
          sortable: true,
          filter: { type: "text", placeholder: "Profesión" },
        },
        {
          key: "estado",
          label: "Estado",
          sortable: true,
          filter: {
            type: "select",
            options: this.opcionesEstado.map((opcion) => ({
              value: opcion.value,
              text: opcion.label,
            })),
          },
        },
        {
          key: "fechaSolicitudBaja",
          label: "Baja",
          sortable: true,
          filter: { type: "text", placeholder: "Fecha" },
          value: (perfil) =>
            perfil.fechaSolicitudBaja
              ? this.formatearFecha(perfil.fechaSolicitudBaja)
              : "",
        },
        { key: "acciones", label: "Acciones", sortable: false },
      ];
    },
  },
  async mounted() {
    await this.cargarProfesiones();
    await this.cargarPerfiles();
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
    /**
     * `todos: true` trae el listado completo (sin paginar) para que el orden
     * y los filtros por columna se apliquen sobre todos los perfiles.
     */
    async cargarPerfiles() {
      this.cargando = true;
      this.errorMessage = "";
      try {
        const params = { todos: true };
        if (this.texto.trim()) params.texto = this.texto.trim();
        if (this.idProfesion) params.idProfesion = Number(this.idProfesion);
        if (this.estado) params.estado = this.estado;

        const data = (await adminService.buscarPerfiles(params))?.data || {};
        this.perfiles = Array.isArray(data.contenido) ? data.contenido : [];
      } catch (error) {
        this.perfiles = [];
        this.errorMessage = error?.response?.data?.message || "No se pudieron cargar los perfiles.";
      } finally {
        this.cargando = false;
      }
    },
    buscarAhora() {
      this.cargarPerfiles();
    },
    verDetalle(perfil) {
      this.$router.push({ name: "admin-perfil-detalle", params: { id: perfil.idPerfil } });
    },
    nombreUsuario(perfil) {
      return [perfil.nombreUsuario, perfil.apellidoUsuario].filter(Boolean).join(" ") || "—";
    },
    estadoAmigable(estado) {
      return this.opcionesEstado.find((opcion) => opcion.value === estado)?.label || estado || "—";
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
.admin-perfiles__toolbar {
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
  color: var(--color-primary);
  font-size: 2.25rem;
  font-weight: 800;
}
.admin-perfiles p {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
}
.admin-perfiles__refresh,
.admin-perfiles__search,
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
.admin-perfiles__search:disabled {
  cursor: wait;
  opacity: 0.5;
}
.admin-perfiles__toolbar {
  justify-content: flex-start;
  flex-wrap: wrap;
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
