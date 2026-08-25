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
        placeholder="Buscar por nombre o correo"
        removable
        class="gestion-usuarios__buscador"
      >
        <template #prependInner>
          <VaIcon name="mso-search" color="secondary" size="small" />
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
      <template #cell(nombre)="{ rowData }">
        {{ rowData.nombre || "Sin nombre" }}
      </template>

      <template #cell(rolGlobal)="{ value }">
        <VaBadge :text="value || '—'" color="info" />
      </template>

      <template #cell(estado)="{ value }">
        <VaBadge :text="etiquetaEstado(value)" :color="colorEstado(value)" outline />
      </template>

      <template #cell(acciones)="{ rowData }">
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

        <span v-else class="gestion-usuarios__sin-accion">—</span>
      </template>
    </VaDataTable>

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
      modalDeshabilitarVisible: false,
      usuarioSeleccionado: null,
      columnas: [
        { key: "nombre", label: "Nombre", sortable: true },
        { key: "correo", label: "Correo", sortable: true },
        { key: "rolGlobal", label: "Rol" },
        { key: "estado", label: "Estado", sortable: true },
        { key: "acciones", label: "Acciones" },
      ],
    };
  },
  computed: {
    usuariosFiltrados() {
      const texto = this.busqueda.trim().toLowerCase();
      if (!texto) return this.usuarios;
      return this.usuarios.filter((usuario) =>
        [usuario.nombre, usuario.correo].some((campo) =>
          String(campo || "").toLowerCase().includes(texto)
        )
      );
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

    etiquetaEstado(estado) {
      const etiquetas = {
        Activo: "Activo",
        Deshabilitado: "Deshabilitado",
        Baja: "Baja",
      };
      return etiquetas[estado] || estado || "Desconocido";
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
  max-width: 1000px;
  margin: 0 auto;
}

.gestion-usuarios__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff512f 0%, #b865a4 50%, #240b36 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gestion-usuarios__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: #6a7385;
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
  max-width: 320px;
}

.gestion-usuarios__tabla {
  --va-table-padding: 0.5rem;
}

.gestion-usuarios__sin-accion {
  color: #9ca3af;
}
</style>
