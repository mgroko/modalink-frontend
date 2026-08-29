<template>
  <div class="gestion-usuarios">
    <section class="gestion-usuarios__encabezado">
      <h1>Gestión de usuarios</h1>
      <p class="gestion-usuarios__subtitulo">
        Administrá las cuentas registradas en ModaLink.
      </p>
    </section>

    <div class="gestion-usuarios__toolbar">
      <VaInput
        v-model="busqueda"
        preset="bordered"
        placeholder="Buscar por nombre, apellido o correo"
        removable
        class="gestion-usuarios__buscador"
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="grey" size="small" />
        </template>
      </VaInput>

      <VaButton
        preset="secondary"
        icon="mso-refresh"
        :loading="cargando"
        @click="cargarUsuarios"
      >
        Actualizar
      </VaButton>
    </div>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <VaDataTable
      class="gestion-usuarios__tabla"
      :items="usuariosFiltrados"
      :columns="columnas"
      :loading="cargando"
      :per-page="10"
      striped
      hoverable
    >
      <template #cell(idUsuario)="{ value }">
        <span class="gestion-usuarios__id">{{ value }}</span>
      </template>

      <template #cell(rolGlobal)="{ value }">
        <VaBadge :text="value || '—'" color="info" />
      </template>

      <template #cell(estado)="{ value }">
        <VaBadge :text="value" :color="colorEstado(value)" outline />
      </template>

      <template #cell(fechaSolicitudBaja)="{ value }">
        {{ value ? formatearFecha(value) : 'No solicitó' }}
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="gestion-usuarios__acciones">
          <VaButton
            size="small"
            preset="primary"
            icon="mso-person"
            @click="abrirDetalle(rowData)"
          >
            Ver perfil
          </VaButton>

          <template v-if="obtenerId(rowData) !== idAdmin">
            <VaButton
              v-if="rowData.estado === 'Activo'"
              size="small"
              color="danger"
              icon="mso-block"
              :loading="estaProcesando(rowData)"
              @click="solicitarDeshabilitar(rowData)"
            >
              Deshabilitar
            </VaButton>

            <VaButton
              v-else-if="rowData.estado === 'Deshabilitado'"
              size="small"
              color="success"
              icon="mso-check_circle"
              :loading="estaProcesando(rowData)"
              @click="habilitar(rowData)"
            >
              Habilitar
            </VaButton>
          </template>
        </div>
      </template>
    </VaDataTable>

    <!-- Modal detalle de usuario -->
    <VaModal
      v-model="modalDetalleVisible"
      size="large"
      close-button
      hide-default-actions
    >
      <template #header>
        <h3 class="va-h5">Detalle de usuario</h3>
      </template>

      <VaInnerLoading :loading="cargandoDetalle">
        <div v-if="usuarioDetalle" class="detalle-usuario">
          <div class="detalle-usuario__grid">
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">ID</span>
              <span>{{ usuarioDetalle.idUsuario }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">DNI</span>
              <span>{{ usuarioDetalle.dni }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Nombre</span>
              <span>{{ usuarioDetalle.nombre }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Apellido</span>
              <span>{{ usuarioDetalle.apellido }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Correo</span>
              <span>{{ usuarioDetalle.correo }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Rol</span>
              <VaBadge :text="usuarioDetalle.rolGlobal || '—'" color="info" />
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Estado</span>
              <VaBadge :text="usuarioDetalle.estado" :color="colorEstado(usuarioDetalle.estado)" outline />
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Fecha de nacimiento</span>
              <span>{{ usuarioDetalle.fechaNacimiento ? formatearFecha(usuarioDetalle.fechaNacimiento) : '—' }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Género</span>
              <span>{{ textoGenero(usuarioDetalle.genero) }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Solicitud de baja</span>
              <span>{{ usuarioDetalle.fechaSolicitudBaja ? formatearFecha(usuarioDetalle.fechaSolicitudBaja) : 'No solicitó' }}</span>
            </div>
          </div>

          <!-- Perfiles asociados -->
          <section class="detalle-usuario__perfiles">
            <h4 class="va-h6">Perfiles asociados</h4>

            <p v-if="errorPerfiles" class="detalle-usuario__texto-muted">
              No se pudieron cargar los perfiles.
            </p>

            <p v-else-if="perfiles.length === 0 && !cargandoPerfiles" class="detalle-usuario__texto-muted">
              Este usuario no tiene perfiles registrados.
            </p>

            <VaDataTable
              v-else
              :items="perfiles"
              :columns="columnasPerfiles"
              :loading="cargandoPerfiles"
              striped
              hoverable
              :per-page="5"
            >
              <template #cell(idPerfil)="{ value }">
                <span class="gestion-usuarios__id">{{ value }}</span>
              </template>

              <template #cell(estado)="{ value }">
                <VaBadge :text="value" :color="colorEstado(value)" outline />
              </template>

              <template #cell(fechaSolicitudBaja)="{ value }">
                {{ value ? formatearFecha(value) : 'No solicitó' }}
              </template>

              <template #cell(acciones)="{ rowData }">
                <VaButton
                  size="small"
                  preset="primary"
                  icon="mso-visibility"
                  @click="abrirDetallePerfil(rowData)"
                >
                  Ver detalle
                </VaButton>
              </template>
            </VaDataTable>
          </section>
        </div>
      </VaInnerLoading>

      <template #footer>
        <VaButton preset="secondary" @click="modalDetalleVisible = false">Cerrar</VaButton>
      </template>
    </VaModal>

    <!-- Modal detalle de perfil -->
    <VaModal
      v-model="modalPerfilVisible"
      size="large"
      close-button
      hide-default-actions
    >
      <template #header>
        <h3 class="va-h5">Detalle de perfil</h3>
      </template>

      <div v-if="perfilDetalle" class="detalle-perfil">
        <div class="detalle-perfil__header">
          <img
            v-if="perfilDetalle.fotoUrl"
            :src="perfilDetalle.fotoUrl"
            :alt="perfilDetalle.nombreArtistico || 'Foto de perfil'"
            class="detalle-perfil__foto"
          />
          <div v-else class="detalle-perfil__foto detalle-perfil__foto--placeholder">
            <VaIcon name="mso-person" size="large" color="secondary" />
          </div>
          <div>
            <h4 class="va-h5">{{ perfilDetalle.nombreArtistico || 'Sin nombre artístico' }}</h4>
            <p class="detalle-perfil__texto-muted">{{ perfilDetalle.profesion || 'Sin profesión' }}</p>
          </div>
        </div>

        <div class="detalle-perfil__grid">
          <div class="detalle-perfil__campo">
            <span class="detalle-perfil__label">ID Perfil</span>
            <span>{{ perfilDetalle.idPerfil }}</span>
          </div>
          <div class="detalle-perfil__campo">
            <span class="detalle-perfil__label">Estado</span>
            <VaBadge :text="perfilDetalle.estado" :color="colorEstado(perfilDetalle.estado)" outline />
          </div>
          <div class="detalle-perfil__campo">
            <span class="detalle-perfil__label">Solicitud de baja</span>
            <span>{{ perfilDetalle.fechaSolicitudBaja ? formatearFecha(perfilDetalle.fechaSolicitudBaja) : 'No solicitó' }}</span>
          </div>
        </div>

        <div v-if="perfilDetalle.biografia" class="detalle-perfil__biografia">
          <span class="detalle-perfil__label">Biografía</span>
          <p>{{ perfilDetalle.biografia }}</p>
        </div>
      </div>

      <template #footer>
        <VaButton preset="secondary" @click="modalPerfilVisible = false">Cerrar</VaButton>
      </template>
    </VaModal>

    <!-- Modal deshabilitar -->
    <VaModal
      v-model="modalDeshabilitarVisible"
      ok-text="Deshabilitar"
      cancel-text="Cancelar"
      ok-color="danger"
      blur
      @ok="deshabilitarSeleccionado"
    >
      <h3 class="va-h5">¿Deshabilitar cuenta?</h3>
      <p class="mt-2">
        El usuario
        <strong>{{ usuarioSeleccionado?.correo }}</strong>
        no podrá iniciar sesión hasta que lo habilites nuevamente.
      </p>
    </VaModal>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import BaseAlert from "../../components/AlertaBase.vue";
import { state } from "../../services/authState";

export default {
  name: "GestionUsuariosView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      usuarios: [],
      busqueda: "",
      cargando: false,
      procesandoId: null,
      successMessage: "",
      errorMessage: "",

      // Detalle usuario
      modalDetalleVisible: false,
      usuarioDetalle: null,
      cargandoDetalle: false,
      perfiles: [],
      cargandoPerfiles: false,
      errorPerfiles: false,

      // Detalle perfil
      modalPerfilVisible: false,
      perfilDetalle: null,

      // Deshabilitar
      modalDeshabilitarVisible: false,
      usuarioSeleccionado: null,

      columnas: [
        { key: "idUsuario", label: "ID", sortable: true },
        { key: "nombre", label: "Nombre", sortable: true },
        { key: "apellido", label: "Apellido", sortable: true },
        { key: "dni", label: "DNI", sortable: true },
        { key: "correo", label: "Correo", sortable: true },
        { key: "rolGlobal", label: "Rol" },
        { key: "estado", label: "Estado", sortable: true },
        { key: "fechaSolicitudBaja", label: "Solicitud de baja" },
        { key: "acciones", label: "Acciones" },
      ],

      columnasPerfiles: [
        { key: "idPerfil", label: "ID", sortable: true },
        { key: "profesion", label: "Profesión", sortable: true },
        { key: "nombreArtistico", label: "Nombre artístico" },
        { key: "estado", label: "Estado", sortable: true },
        { key: "fechaSolicitudBaja", label: "Solicitud de baja" },
        { key: "acciones", label: "Detalle" },
      ],
    };
  },
  computed: {
    idAdmin() {
      return this.obtenerId(state.usuario);
    },
    usuariosFiltrados() {
      const texto = this.busqueda.trim().toLowerCase();
      let lista = this.usuarios;
      if (texto) {
        lista = lista.filter((usuario) =>
          [usuario.nombre, usuario.apellido, usuario.correo].some((campo) =>
            String(campo || "").toLowerCase().includes(texto)
          )
        );
      }
      return [...lista].sort((a, b) => {
        const aEsAdmin = this.obtenerId(a) === this.idAdmin;
        const bEsAdmin = this.obtenerId(b) === this.idAdmin;
        if (aEsAdmin && !bEsAdmin) return -1;
        if (!aEsAdmin && bEsAdmin) return 1;
        return 0;
      });
    },
  },
  async mounted() {
    if (state.usuario?.rolGlobal !== "Administrador") {
      this.$router.replace({ name: "login" });
      return;
    }
    await this.cargarUsuarios();
  },
  methods: {
    obtenerId(usuario) {
      return usuario.id ?? usuario.idUsuario;
    },

    colorEstado(estado) {
      if (estado === "Activo") return "success";
      if (estado === "Deshabilitado") return "danger";
      if (estado === "Baja") return "backgroundElement";
      return "backgroundBorder";
    },

    estaProcesando(usuario) {
      return this.procesandoId === this.obtenerId(usuario);
    },

    textoGenero(genero) {
      if (!genero) return "—";
      const codigos = {
        mujer: "Mujer",
        hombre: "Hombre",
        no_binario: "No binario",
        no_decirlo: "Prefiero no decirlo",
      };
      if (typeof genero === "object") {
        return codigos[genero.codigo] || genero.codigo || "—";
      }
      return codigos[genero] || genero;
    },

    formatearFecha(fecha) {
      if (!fecha) return "—";
      const partes = fecha.split("T")[0].split("-");
      if (partes.length !== 3) return fecha;
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    },

    async cargarUsuarios() {
      this.cargando = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const response = await adminService.listarUsuarios();
        const datos = response?.data;
        this.usuarios = Array.isArray(datos) ? datos : datos?.usuarios || [];
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudieron cargar los usuarios. Verificá tu sesión.";
      } finally {
        this.cargando = false;
      }
    },

    // Detalle usuario
    async abrirDetalle(usuario) {
      const id = this.obtenerId(usuario);
      this.modalDetalleVisible = true;
      this.cargandoDetalle = true;
      this.usuarioDetalle = null;
      this.perfiles = [];
      this.errorPerfiles = false;

      try {
        const response = await adminService.detalleUsuario(id);
        this.usuarioDetalle = response?.data || null;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo cargar el detalle del usuario.";
        this.modalDetalleVisible = false;
        return;
      } finally {
        this.cargandoDetalle = false;
      }

      this.cargandoPerfiles = true;
      try {
        const response = await adminService.perfilesUsuario(id);
        const datos = response?.data;
        this.perfiles = Array.isArray(datos) ? datos : datos?.perfiles || [];
      } catch {
        this.errorPerfiles = true;
      } finally {
        this.cargandoPerfiles = false;
      }
    },

    // Detalle perfil
    abrirDetallePerfil(perfil) {
      this.perfilDetalle = perfil;
      this.modalPerfilVisible = true;
    },

    // Deshabilitar
    solicitarDeshabilitar(usuario) {
      this.usuarioSeleccionado = usuario;
      this.modalDeshabilitarVisible = true;
    },

    deshabilitarSeleccionado() {
      if (this.usuarioSeleccionado) {
        this.deshabilitar(this.usuarioSeleccionado);
      }
    },

    async habilitar(usuario) {
      const id = this.obtenerId(usuario);
      this.procesandoId = id;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        await adminService.habilitarUsuario(id);
        usuario.estado = "Activo";
        this.successMessage = `La cuenta de ${usuario.correo} fue habilitada.`;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo habilitar el usuario.";
      } finally {
        this.procesandoId = null;
      }
    },

    async deshabilitar(usuario) {
      const id = this.obtenerId(usuario);
      this.procesandoId = id;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        await adminService.deshabilitarUsuario(id);
        usuario.estado = "Deshabilitado";
        this.successMessage = `La cuenta de ${usuario.correo} fue deshabilitada.`;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "No se pudo deshabilitar el usuario.";
      } finally {
        this.procesandoId = null;
        this.modalDeshabilitarVisible = false;
        this.usuarioSeleccionado = null;
      }
    },
  },
};
</script>

<style scoped>
.gestion-usuarios {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.gestion-usuarios__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gestion-usuarios__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.gestion-usuarios__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.gestion-usuarios__buscador {
  width: 100%;
  height: 1.4rem;
  max-width: 320px;
}

.gestion-usuarios__tabla {
  --va-table-padding: 0.5rem;
}

.gestion-usuarios__id {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.gestion-usuarios__acciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Detalle usuario */
.detalle-usuario__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detalle-usuario__campo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detalle-usuario__label,
.detalle-perfil__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.detalle-usuario__perfiles {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 1.25rem;
  margin-top: 1.25rem;
}

.detalle-usuario__perfiles h4 {
  margin-bottom: 0.75rem;
}

.detalle-usuario__texto-muted {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Detalle perfil */
.detalle-perfil__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detalle-perfil__foto {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.detalle-perfil__foto--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
}

.detalle-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.detalle-perfil__campo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detalle-perfil__biografia {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 1rem;
}

.detalle-perfil__biografia p {
  margin-top: 0.35rem;
  white-space: pre-wrap;
  color: var(--color-text);
}

.detalle-perfil__texto-muted {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
</style>
