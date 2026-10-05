<template>
  <div class="busqueda-usuarios">
    <section class="busqueda-usuarios__encabezado">
      <h1>Búsqueda de usuarios</h1>
      <p class="busqueda-usuarios__subtitulo">
        Buscá usuarios del sistema aplicando criterios combinables.
      </p>
    </section>

    <section class="busqueda-usuarios__filtros">
      <VaInput
        v-model="filtros.nombre"
        preset="bordered"
        placeholder="Nombre"
        class="busqueda-usuarios__campo"
        @input="programarBusqueda"
      >
        <template #prependInner>
          <VaIcon name="mso-person" color="grey" size="small" />
        </template>
      </VaInput>

      <VaInput
        v-model="filtros.apellido"
        preset="bordered"
        placeholder="Apellido"
        class="busqueda-usuarios__campo"
        @input="programarBusqueda"
      />

      <VaInput
        v-model="filtros.correo"
        preset="bordered"
        placeholder="Correo"
        class="busqueda-usuarios__campo"
        @input="programarBusqueda"
      >
        <template #prependInner>
          <VaIcon name="mso-mail" color="grey" size="small" />
        </template>
      </VaInput>

      <VaSelect
        v-model="filtros.estado"
        :options="opcionesEstado"
        value-by="value"
        text-by="text"
        placeholder="Estado"
        class="busqueda-usuarios__campo"
        clearable
        @update:modelValue="buscarAhora"
      />

      <VaInput
        v-model="filtros.idProfesion"
        preset="bordered"
        placeholder="Profesión ID"
        class="busqueda-usuarios__campo"
        @input="programarBusqueda"
      />

      <VaInput
        v-model="filtros.nombreArtisticoPerfil"
        preset="bordered"
        placeholder="Nombre artístico de perfil"
        class="busqueda-usuarios__campo busqueda-usuarios__campo--amplio"
        @input="programarBusqueda"
      >
        <template #prependInner>
          <VaIcon name="mso-badge" color="grey" size="small" />
        </template>
      </VaInput>

      <VaInput
        v-model="filtros.nombreProfesion"
        preset="bordered"
        placeholder="Profesión"
        class="busqueda-usuarios__campo"
        @input="programarBusqueda"
      />

      <VaSelect
        v-model="filtros.tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        class="busqueda-usuarios__campo busqueda-usuarios__campo--tamano"
        @update:modelValue="buscarAhora"
      />

      <VaButton preset="secondary" icon="mso-filter_alt_off" @click="limpiarFiltros">
        Limpiar filtros
      </VaButton>
    </section>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <p v-if="!cargando && paginacion.totalElementos > 0" class="busqueda-usuarios__resumen">
      {{ paginacion.totalElementos }} usuario(s) encontrado(s)
      <template v-if="!esTodos">
        · Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
      </template>
    </p>

    <div v-if="cargando" class="busqueda-usuarios__estado">
      <span class="material-symbols-outlined busqueda-usuarios__estado-icono">hourglass_empty</span>
      Buscando usuarios...
    </div>

    <div v-else-if="usuarios.length === 0" class="busqueda-usuarios__estado">
      <span class="material-symbols-outlined busqueda-usuarios__estado-icono">search_off</span>
      No se encontraron usuarios con los filtros aplicados.
    </div>

    <VaDataTable
      v-if="puedeVer"
      class="busqueda-usuarios__tabla"
      :items="usuarios"
      :columns="columnas"
      striped
      hoverable
      no-pagination
    >
      <template #cell(idUsuario)="{ value }">
        <span class="busqueda-usuarios__id">{{ value }}</span>
      </template>

      <template #cell(rolGlobal)="{ value }">
        <VaBadge :text="value || '—'" color="info" />
      </template>

      <template #cell(estado)="{ value }">
        <VaBadge :text="value" :color="colorEstado(value)" outline />
      </template>

      <template #cell(deshabilitacion)="{ rowData }">
        <div v-if="rowData.estado === 'Deshabilitado'" class="busqueda-usuarios__deshabilitacion">
          <span class="busqueda-usuarios__deshabilitacion-motivo">{{ rowData.motivoDeshabilitacion || '—' }}</span>
          <span class="busqueda-usuarios__deshabilitacion-hasta">
            {{ rowData.fechaHastaDeshabilitacion ? `Hasta ${formatearFecha(rowData.fechaHastaDeshabilitacion)}` : 'Indefinido' }}
          </span>
        </div>
        <span v-else class="busqueda-usuarios__deshabilitacion-vacio">—</span>
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="busqueda-usuarios__acciones">
          <VaButton
            size="small"
            preset="primary"
            icon="mso-visibility"
            @click="abrirDetalle(rowData)"
          >
            Ver detalle
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

    <div v-else class="busqueda-usuarios__estado">
      <span class="material-symbols-outlined busqueda-usuarios__estado-icono">lock</span>
      No tenés permisos para ver usuarios.
    </div>

    <div v-if="!esTodos && paginacion.totalPaginas > 1" class="busqueda-usuarios__paginacion">
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_left"
        :disabled="paginacion.primera"
        @click="cambiarPagina(-1)"
      >
        Anterior
      </VaButton>
      <VaButton
        preset="secondary"
        size="small"
        icon-right="mso-chevron_right"
        :disabled="paginacion.ultima"
        @click="cambiarPagina(1)"
      >
        Siguiente
      </VaButton>
    </div>

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
              <span class="detalle-usuario__label">Nombre</span>
              <span>{{ usuarioDetalle.nombre }} {{ usuarioDetalle.apellido }}</span>
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
              <span>{{ usuarioDetalle.fechaNacimiento ? formatearFechaCorta(usuarioDetalle.fechaNacimiento) : '—' }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">DNI</span>
              <span>{{ usuarioDetalle.dni || '—' }}</span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Solicitud de baja</span>
              <span>{{ usuarioDetalle.fechaSolicitudBaja ? formatearFecha(usuarioDetalle.fechaSolicitudBaja) : 'No solicitó' }}</span>
            </div>
          </div>

          <section class="detalle-usuario__perfiles">
            <h4 class="va-h6">Perfiles asociados</h4>
            <VaInnerLoading :loading="cargandoPerfiles" />

            <p v-if="!cargandoPerfiles && perfiles.length === 0" class="detalle-usuario__texto-muted">
              Este usuario no tiene perfiles registrados.
            </p>

            <div v-else class="detalle-usuario__perfiles-lista">
              <div
                v-for="perfil in perfiles"
                :key="perfil.idPerfil"
                class="detalle-usuario__perfil"
              >
                <div class="detalle-usuario__perfil-datos">
                  <span class="detalle-usuario__perfil-nombre">{{ perfil.nombreArtistico || '—' }}</span>
                  <span class="detalle-usuario__texto-muted">{{ perfil.profesion || '—' }}</span>
                </div>
                <VaBadge :text="perfil.estado" :color="colorEstado(perfil.estado)" outline />
              </div>
            </div>
          </section>
        </div>
      </VaInnerLoading>

      <template #footer>
        <VaButton preset="secondary" @click="modalDetalleVisible = false">Cerrar</VaButton>
      </template>
    </VaModal>

    <!-- Modal deshabilitar -->
    <VaModal v-model="modalDeshabilitarVisible" hide-default-actions blur>
      <h3 class="va-h5">¿Deshabilitar cuenta?</h3>
      <p class="mt-2">
        El usuario <strong>{{ usuarioSeleccionado?.correo }}</strong> no podrá iniciar sesión hasta que lo habilites nuevamente.
      </p>

      <VaForm ref="formDeshabilitar" :immediate="false" class="busqueda-usuarios__deshabilitar-form">
        <VaTextarea
          v-model="motivoDeshabilitacion"
          :rules="[reglas.motivoRequerido, reglas.motivoMax]"
          label="Motivo"
          :max-length="200"
          counter
          :rows="3"
        />
        <div class="busqueda-usuarios__duracion">
          <span class="busqueda-usuarios__label">Duración</span>
          <VaRadio
            v-model="duracionIndefinida"
            :options="opcionesDuracion"
            text-by="text"
            value-by="value"
          />
          <VaInput
            v-if="!duracionIndefinida"
            v-model="duracionDias"
            :rules="[reglas.duracionValida]"
            type="number"
            min="1"
            label="Días"
            class="busqueda-usuarios__dias"
          />
        </div>
      </VaForm>

      <template #footer>
        <div class="busqueda-usuarios__modal-footer">
          <VaButton preset="secondary" @click="modalDeshabilitarVisible = false">Cancelar</VaButton>
          <VaButton color="danger" :loading="procesandoId !== null" @click="deshabilitarSeleccionado">
            Deshabilitar
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import adminService from "../../services/adminService";
import BaseAlert from "../../components/AlertaBase.vue";
import { state, tienePermiso } from "../../services/authState";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";

const DEBOUNCE_MS = 300;

export default {
  name: "BusquedaUsuariosView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      filtros: {
        nombre: "",
        apellido: "",
        correo: "",
        estado: null,
        nombreArtisticoPerfil: "",
        nombreProfesion: "",
        tamano: 20,
      },
      opcionesEstado: [
        { text: "Activo", value: "Activo" },
        { text: "Deshabilitado", value: "Deshabilitado" },
        { text: "Pendiente de baja", value: "PendienteBaja" },
        { text: "Baja", value: "Baja" },
      ],
      idProfesion: "",
      opcionesProfesion: [],
      opcionesTamano: [
        { text: "20 por página", value: 20 },
        { text: "50 por página", value: 50 },
        { text: "Ver todos", value: 0 },
      ],
      usuarios: [],
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      cargando: false,
      successMessage: "",
      errorMessage: "",
      procesandoId: null,
      debounceHandle: null,

      modalDetalleVisible: false,
      usuarioDetalle: null,
      cargandoDetalle: false,
      perfiles: [],
      cargandoPerfiles: false,

      modalDeshabilitarVisible: false,
      usuarioSeleccionado: null,
      motivoDeshabilitacion: "",
      duracionIndefinida: true,
      duracionDias: "",
      opcionesDuracion: [
        { text: "Indefinida", value: true },
        { text: "Días", value: false },
      ],
      reglas: {
        motivoRequerido: (v) => (!!v && v.trim().length > 0) || "El motivo es obligatorio.",
        motivoMax: (v) => !v || v.length <= 200 || "Máximo 200 caracteres.",
        duracionValida: (v) => {
          if (this.duracionIndefinida) return true;
          return (!!v && parseInt(v, 10) > 0) || "Ingresá una duración mayor a 0 días.";
        },
      },

      columnas: [
        { key: "idUsuario", label: "ID" },
        { key: "nombre", label: "Nombre" },
        { key: "apellido", label: "Apellido" },
        { key: "correo", label: "Correo" },
        { key: "rolGlobal", label: "Rol" },
        { key: "estado", label: "Estado" },
        { key: "deshabilitacion", label: "Deshabilitación" },
        { key: "acciones", label: "Acciones" },
      ],
    };
  },
  computed: {
    idAdmin() {
      return this.obtenerId(state.usuario);
    },
    esTodos() {
      return this.filtros.tamano === 0;
    },
    puedeVer() {
      return tienePermiso("VER_USUARIOS");
    },
  },
  async mounted() {
    await this.buscar(0);
  },
  methods: {
    obtenerId(usuario) {
      return usuario.id ?? usuario.idUsuario;
    },
    colorEstado(estado) {
      if (estado === "Activo") return "success";
      if (estado === "Deshabilitado") return "danger";
      if (estado === "PendienteBaja") return "warning";
      if (estado === "Baja") return "backgroundElement";
      return "backgroundBorder";
    },
    formatearFecha,
    formatearFechaCorta,
    estaProcesando(usuario) {
      return this.procesandoId === this.obtenerId(usuario);
    },

    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    limpiarFiltros() {
      this.filtros = {
        nombre: "",
        apellido: "",
        correo: "",
        estado: null,
        nombreArtisticoPerfil: "",
        nombreProfesion: "",
        tamano: 20,
      };
      this.buscarAhora();
    },

    buildParams(page) {
      const params = { page, size: this.filtros.tamano };

      if (this.filtros.tamano === 0) {
        params.todos = true;
        delete params.size;
        delete params.page;
      }

      const nombre = this.filtros.nombre.trim();
      const apellido = this.filtros.apellido.trim();
      const correo = this.filtros.correo.trim();
      const nombreArtisticoPerfil = this.filtros.nombreArtisticoPerfil.trim();
      const nombreProfesion = this.filtros.nombreProfesion.trim();

      if (nombre) params.nombre = nombre;
      if (apellido) params.apellido = apellido;
      if (correo) params.correo = correo;
      if (this.filtros.estado) params.estado = this.filtros.estado;
      if (nombreArtisticoPerfil) params.nombreArtisticoPerfil = nombreArtisticoPerfil;
      if (nombreProfesion) params.nombreProfesion = nombreProfesion;
      if (this.filtros.idProfesion) params.idProfesion = this.filtros.idProfesion;

      return params;
    },

    async buscar(page = 0) {
      this.cargando = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const response = await adminService.buscarUsuarios(this.buildParams(page));
        const data = response?.data || {};

        this.usuarios = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: data.paginaActual ?? 0,
          totalPaginas: data.totalPaginas ?? 1,
          totalElementos: data.totalElementos ?? this.usuarios.length,
          primera: data.primera ?? true,
          ultima: data.ultima ?? true,
        };
      } catch (error) {
        const status = error?.response?.status;
        this.usuarios = [];
        if (status === 401) {
          this.$router.push({ name: "login", query: { redirect: this.$route.fullPath } });
        } else if (status === 403) {
          this.errorMessage = "No tenés permisos para buscar usuarios.";
        } else {
          this.errorMessage = "Ocurrió un error al buscar usuarios. Intentalo nuevamente.";
        }
      } finally {
        this.cargando = false;
      }
    },

    async abrirDetalle(usuario) {
      const id = this.obtenerId(usuario);
      this.modalDetalleVisible = true;
      this.cargandoDetalle = true;
      this.usuarioDetalle = null;
      this.perfiles = [];

      try {
        const response = await adminService.detalleUsuario(id);
        this.usuarioDetalle = response?.data || null;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo cargar el detalle del usuario.";
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
        this.perfiles = [];
      } finally {
        this.cargandoPerfiles = false;
      }
    },

    solicitarDeshabilitar(usuario) {
      this.usuarioSeleccionado = usuario;
      this.motivoDeshabilitacion = "";
      this.duracionIndefinida = true;
      this.duracionDias = "";
      this.modalDeshabilitarVisible = true;
    },

    deshabilitarSeleccionado() {
      const isValid = this.$refs.formDeshabilitar?.validate();
      if (isValid === false || !this.usuarioSeleccionado) return;

      const payload = { motivo: this.motivoDeshabilitacion.trim() };
      if (!this.duracionIndefinida) {
        payload.duracionDias = parseInt(this.duracionDias, 10);
      }
      this.deshabilitar(this.usuarioSeleccionado, payload);
    },

    async habilitar(usuario) {
      const id = this.obtenerId(usuario);
      this.procesandoId = id;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        await adminService.habilitarUsuario(id);
        usuario.estado = "Activo";
        usuario.motivoDeshabilitacion = null;
        usuario.fechaHastaDeshabilitacion = null;
        this.successMessage = `La cuenta de ${usuario.correo} fue habilitada.`;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo habilitar el usuario.";
      } finally {
        this.procesandoId = null;
      }
    },

    async deshabilitar(usuario, payload) {
      const id = this.obtenerId(usuario);
      this.procesandoId = id;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const response = await adminService.deshabilitarUsuario(id, payload);
        const datos = response?.data;
        usuario.estado = "Deshabilitado";
        usuario.motivoDeshabilitacion = datos?.motivoDeshabilitacion ?? null;
        usuario.fechaHastaDeshabilitacion = datos?.fechaHastaDeshabilitacion ?? null;
        this.successMessage = `La cuenta de ${usuario.correo} fue deshabilitada.`;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message || "No se pudo deshabilitar el usuario.";
      } finally {
        this.procesandoId = null;
        this.modalDeshabilitarVisible = false;
        this.usuarioSeleccionado = null;
      }
    },
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
  },
};
</script>

<style scoped>
.busqueda-usuarios {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.busqueda-usuarios__encabezado h1 {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 50%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.busqueda-usuarios__subtitulo {
  margin-top: 0.25rem;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

.busqueda-usuarios__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin: 1.25rem 0 1rem;
}

.busqueda-usuarios__campo {
  min-width: 180px;
  flex: 1;
}

.busqueda-usuarios__campo--amplio {
  flex: 2;
  min-width: 240px;
}

.busqueda-usuarios__campo--tamano {
  max-width: 170px;
}

.busqueda-usuarios__resumen {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.busqueda-usuarios__tabla {
  --va-table-padding: 0.5rem;
}

.busqueda-usuarios__id {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.busqueda-usuarios__acciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.busqueda-usuarios__deshabilitacion {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 220px;
}

.busqueda-usuarios__deshabilitacion-motivo {
  font-size: 0.82rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.busqueda-usuarios__deshabilitacion-hasta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.busqueda-usuarios__deshabilitacion-vacio {
  color: var(--color-text-muted);
}

.busqueda-usuarios__paginacion {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.busqueda-usuarios__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.busqueda-usuarios__estado-icono {
  font-size: 2.5rem;
}

.busqueda-usuarios__deshabilitar-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.busqueda-usuarios__duracion {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.busqueda-usuarios__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
}

.busqueda-usuarios__dias {
  max-width: 160px;
}

.busqueda-usuarios__modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  width: 100%;
  margin-top: 1rem;
}

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

.detalle-usuario__label {
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

.detalle-usuario__perfiles-lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detalle-usuario__perfil {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.detalle-usuario__perfil-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detalle-usuario__perfil-nombre {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text);
}

.detalle-usuario__texto-muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
</style>
