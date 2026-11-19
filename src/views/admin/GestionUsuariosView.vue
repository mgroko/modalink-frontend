<template>
  <div class="gestion-usuarios">
    <section class="gestion-usuarios__encabezado">
      <h1>Gestión de usuarios</h1>
      <p class="gestion-usuarios__subtitulo">
        Administrá las cuentas registradas en ModaLink.
      </p>
    </section>

    <BaseAlert :message="successMessage" type="success" />
    <BaseAlert :message="errorMessage" type="error" />

    <AdminTablaPanel class="gestion-usuarios__panel">
      <template #toolbar>
        <div class="gestion-usuarios__toolbar">
          <VaInput
            v-model="busqueda"
            preset="bordered"
            placeholder="Buscar por nombre, apellido o correo"
            removable
            class="gestion-usuarios__buscador"
            @input="programarBusqueda"
            @keyup.enter="buscarAhora"
          >
            <template #prependInner>
              <VaIcon name="mso-search" color="grey" size="small" />
            </template>
          </VaInput>

          <div class="gestion-usuarios__toolbar-acciones">
            <VaSelect
              v-model="estadoFiltro"
              :options="opcionesEstado"
              value-by="value"
              text-by="text"
              placeholder="Estado"
              clearable
              class="gestion-usuarios__select-estado"
              @update:modelValue="buscarAhora"
            />

            <VaSelect
              v-model="tamanoPagina"
              :options="opcionesTamano"
              value-by="value"
              text-by="text"
              class="gestion-usuarios__select-tamano"
              @update:modelValue="buscarAhora"
            />

            <VaButton
              preset="secondary"
              icon="mso-refresh"
              :loading="cargando"
              @click="recargarActual"
            >
              Actualizar
            </VaButton>
          </div>
        </div>
      </template>

      <VaDataTable
      class="gestion-usuarios__tabla"
      :items="usuariosOrdenados"
      :columns="columnas"
      :loading="cargando"
      striped
      hoverable
      no-pagination
    >
      <template #cell(idUsuario)="{ value }">
        <span class="gestion-usuarios__id">#{{ value }}</span>
      </template>

      <template #cell(nombre)="{ rowData }">
        <div class="gestion-usuarios__usuario">
          <span
            class="gestion-usuarios__avatar"
            :class="`gestion-usuarios__avatar--${varianteAvatar(rowData)}`"
            aria-hidden="true"
          >
            {{ inicialesUsuario(rowData) }}
          </span>
          <div class="gestion-usuarios__usuario-datos">
            <strong class="gestion-usuarios__usuario-nombre">
              {{ [rowData.nombre, rowData.apellido].filter(Boolean).join(" ") || "—" }}
            </strong>
            <span class="gestion-usuarios__usuario-meta">
              <VaBadge :text="rowData.rolGlobal || '—'" color="info" />
              <span class="gestion-usuarios__usuario-genero">
                {{ textoGenero(rowData.genero) }}
              </span>
            </span>
          </div>
        </div>
      </template>

      <template #cell(estado)="{ rowData }">
        <div class="gestion-usuarios__estado-cuenta">
          <span
            class="gestion-usuarios__estado"
            :class="`gestion-usuarios__estado--${claseEstado(rowData.estado)}`"
          >
            <span class="gestion-usuarios__estado-dot" aria-hidden="true"></span>
            {{ rowData.estado }}
          </span>

          <div
            v-if="rowData.estado === 'Deshabilitado'"
            class="gestion-usuarios__estado-detalle"
          >
            <span class="gestion-usuarios__estado-motivo">
              {{ rowData.motivoDeshabilitacion || '—' }}
            </span>
            <span class="gestion-usuarios__estado-fecha">
              {{ rowData.fechaHastaDeshabilitacion ? `Hasta ${formatearFecha(rowData.fechaHastaDeshabilitacion)}` : 'Indefinido' }}
            </span>
          </div>

          <span
            v-if="rowData.fechaSolicitudBaja"
            class="gestion-usuarios__estado-fecha"
          >
            Baja solicitada: {{ formatearFecha(rowData.fechaSolicitudBaja) }}
          </span>
        </div>
      </template>

      <template #cell(acciones)="{ rowData }">
        <div class="gestion-usuarios__acciones">
          <VaButton
            size="small"
            preset="secondary"
            icon="mso-person"
            @click="abrirDetalle(rowData)"
          >
            Ver perfil
          </VaButton>

          <template v-if="obtenerId(rowData) !== idAdmin">
            <VaButton
              v-if="rowData.estado === 'Activo'"
              size="small"
              preset="secondary"
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
              preset="secondary"
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

      <template #footer>
        <span v-if="!cargando" class="gestion-usuarios__pie-info">
          {{ paginacion.totalElementos }} usuario(s) encontrado(s)
          <template v-if="!esTodos">
            · Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
          </template>
        </span>
        <span v-else class="gestion-usuarios__pie-info">Cargando usuarios…</span>

        <div v-if="!esTodos && paginacion.totalPaginas > 1" class="gestion-usuarios__paginacion">
          <VaPagination
            :model-value="paginacion.paginaActual + 1"
            :total="paginacion.totalElementos"
            :page-size="tamanoPagina || paginacion.totalElementos || 1"
            :visible-pages="5"
            boundary-links
            direction-links
            @update:model-value="irAPagina"
          />
        </div>
      </template>
    </AdminTablaPanel>

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
            <div v-if="usuarioDetalle.estado === 'Deshabilitado'" class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Deshabilitación</span>
              <span>{{ usuarioDetalle.motivoDeshabilitacion || '—' }}</span>
              <span class="detalle-usuario__texto-muted">
                {{ usuarioDetalle.fechaHastaDeshabilitacion ? `Hasta ${formatearFecha(usuarioDetalle.fechaHastaDeshabilitacion)}` : 'Indefinido' }}
              </span>
            </div>
            <div class="detalle-usuario__campo">
              <span class="detalle-usuario__label">Fecha de nacimiento</span>
              <span>{{ usuarioDetalle.fechaNacimiento ? formatearFechaCorta(usuarioDetalle.fechaNacimiento) : '—' }}</span>
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
                  @click="verPerfilCompleto(rowData)"
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
            :src="resolverFoto(perfilDetalle.fotoUrl)"
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
      hide-default-actions
      blur
    >
      <h3 class="va-h5">¿Deshabilitar cuenta?</h3>
      <p class="mt-2">
        El usuario
        <strong>{{ usuarioSeleccionado?.correo }}</strong>
        no podrá iniciar sesión hasta que lo habilites nuevamente.
      </p>

      <VaForm ref="formDeshabilitar" :immediate="false" class="deshabilitar-form">
        <VaTextarea
          v-model="motivoDeshabilitacion"
          :rules="[reglasDeshabilitar.motivoRequerido, reglasDeshabilitar.motivoMax]"
          label="Motivo"
          placeholder="Ej: Incumplimiento de normas"
          :max-length="200"
          counter
          :rows="3"
        />

        <div class="deshabilitar-form__duracion">
          <span class="deshabilitar-form__label">Duración</span>
          <VaRadio
            v-model="duracionIndefinida"
            :options="opcionesDuracion"
            text-by="text"
            value-by="value"
            class="deshabilitar-form__radio"
          />
          <VaInput
            v-if="!duracionIndefinida"
            v-model="duracionDias"
            :rules="[reglasDeshabilitar.duracionValida]"
            type="number"
            min="1"
            label="Días"
            class="deshabilitar-form__dias"
          />
        </div>
      </VaForm>

      <template #footer>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; width: 100%; margin-top: 1rem;">
          <VaButton preset="secondary" @click="modalDeshabilitarVisible = false">Cancelar</VaButton>
          <VaButton
            color="danger"
            :loading="procesandoId !== null"
            @click="deshabilitarSeleccionado"
          >
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
import AdminTablaPanel from "../../components/admin/AdminTablaPanel.vue";
import { state } from "../../services/authState";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";

export default {
  name: "GestionUsuariosView",
  components: {
    BaseAlert,
    AdminTablaPanel,
  },
  data() {
    return {
      usuarios: [],
      busqueda: "",
      estadoFiltro: null,
      tamanoPagina: 20,
      opcionesEstado: [
        { text: "Activo", value: "Activo" },
        { text: "Deshabilitado", value: "Deshabilitado" },
        { text: "Pendiente de baja", value: "PendienteBaja" },
        { text: "Baja", value: "Baja" },
      ],
      opcionesTamano: [
        { text: "20 por página", value: 20 },
        { text: "50 por página", value: 50 },
        { text: "Ver todos", value: 0 },
      ],
      paginacion: {
        paginaActual: 0,
        totalPaginas: 1,
        totalElementos: 0,
        primera: true,
        ultima: true,
      },
      debounceHandle: null,
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
      motivoDeshabilitacion: "",
      duracionIndefinida: true,
      duracionDias: "",
      opcionesDuracion: [
        { text: "Indefinida", value: true },
        { text: "Días", value: false },
      ],
      reglasDeshabilitar: {
        motivoRequerido: (v) => (!!v && v.trim().length > 0) || "El motivo es obligatorio.",
        motivoMax: (v) => !v || v.length <= 200 || "El motivo no puede superar los 200 caracteres.",
        duracionValida: (v) => {
          if (this.duracionIndefinida) return true;
          return (!!v && parseInt(v, 10) > 0) || "Ingresá una duración mayor a 0 días.";
        },
      },

      columnas: [
        { key: "idUsuario", label: "ID", sortable: true },
        { key: "nombre", label: "Usuario", sortable: true },
        { key: "dni", label: "DNI", sortable: true },
        { key: "correo", label: "Correo", sortable: true },
        { key: "estado", label: "Estado de cuenta", sortable: true },
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
    esTodos() {
      return this.tamanoPagina === 0;
    },
    usuariosOrdenados() {
      return [...this.usuarios].sort((a, b) => {
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

    const idUsuario = Number(this.$route.query.usuario);
    if (Number.isInteger(idUsuario) && idUsuario > 0) {
      await this.abrirDetalle({ idUsuario });
    }
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
  },
  methods: {
    obtenerId(usuario) {
      return usuario.id ?? usuario.idUsuario;
    },

    resolverFoto(url) {
      return resolverFotoUrl(url);
    },

    colorEstado(estado) {
      if (estado === "Activo") return "success";
      if (estado === "Deshabilitado") return "danger";
      if (estado === "PendienteBaja") return "warning";
      if (estado === "Baja") return "backgroundElement";
      return "backgroundBorder";
    },

    estaProcesando(usuario) {
      return this.procesandoId === this.obtenerId(usuario);
    },

    textoGenero(genero) {
      if (!genero) return "—";
      if (typeof genero === "object") {
        return genero.nombre || genero.codigo || "—";
      }
      const codigos = {
        MUJER: "Mujer",
        HOMBRE: "Hombre",
        NO_BINARIO: "No binario",
        NO_DECIRLO: "Prefiero no decirlo",
      };
      return codigos[genero] || genero;
    },

    inicialesUsuario(usuario) {
      const nombre = String(usuario?.nombre || "").trim();
      const apellido = String(usuario?.apellido || "").trim();
      const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`;
      return iniciales.toUpperCase() || "?";
    },

    varianteAvatar(usuario) {
      const id = Number(this.obtenerId(usuario));
      const base = Number.isFinite(id) ? id : String(usuario?.nombre || "").length;
      return base % 6;
    },

    claseEstado(estado) {
      if (estado === "Activo") return "activo";
      if (estado === "Deshabilitado") return "deshabilitado";
      if (estado === "PendienteBaja") return "pendiente";
      return "baja";
    },

    formatearFecha,
    formatearFechaCorta,

    async cargarUsuarios() {
      return this.buscar(0);
    },

    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), 300);
    },

    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },

    recargarActual() {
      this.buscar(this.paginacion.paginaActual);
    },

    irAPagina(pagina) {
      const destino = Math.max(0, Number(pagina) - 1);
      if (destino === this.paginacion.paginaActual) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    buildParams(page) {
      const params = { page, size: this.tamanoPagina };

      if (this.tamanoPagina === 0) {
        params.todos = true;
        delete params.size;
        delete params.page;
      }

      const texto = this.busqueda.trim();
      if (texto.includes("@")) {
        params.correo = texto;
      } else if (texto) {
        params.nombre = texto;
      }
      if (this.estadoFiltro) params.estado = this.estadoFiltro;

      return params;
    },

    async buscar(page = 0) {
      this.cargando = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const params = this.buildParams(page);
        let data;

        const response = await adminService.buscarUsuarios(params);
        data = response?.data || {};

        // Si el texto libre no matcheó como nombre, se reintenta como
        // apellido y luego como correo (el campo único cubre los tres).
        if ((data.totalElementos ?? 0) === 0 && params.nombre) {
          let alt = await adminService.buscarUsuarios({ ...params, apellido: params.nombre, nombre: undefined });
          let dataAlt = alt?.data || {};
          if ((dataAlt.totalElementos ?? 0) === 0) {
            alt = await adminService.buscarUsuarios({ ...params, correo: params.nombre, nombre: undefined });
            dataAlt = alt?.data || {};
          }
          if ((dataAlt.totalElementos ?? 0) > 0) data = dataAlt;
        }

        this.usuarios = Array.isArray(data.contenido) ? data.contenido : [];
        this.paginacion = {
          paginaActual: data.paginaActual ?? 0,
          totalPaginas: data.totalPaginas ?? 1,
          totalElementos: data.totalElementos ?? this.usuarios.length,
          primera: data.primera ?? true,
          ultima: data.ultima ?? true,
        };
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

    // Detalle perfil: vista administrativa completa de solo lectura.
    verPerfilCompleto(perfil) {
      this.$router.push({
        name: "admin-perfil-detalle",
        params: { id: perfil.idPerfil },
      });
    },

    // Deshabilitar
    solicitarDeshabilitar(usuario) {
      this.usuarioSeleccionado = usuario;
      this.motivoDeshabilitacion = "";
      this.duracionIndefinida = true;
      this.duracionDias = "";
      this.errorMessage = "";
      this.modalDeshabilitarVisible = true;
    },

    deshabilitarSeleccionado() {
      const isValid = this.$refs.formDeshabilitar?.validate();
      if (isValid === false) return;
      if (!this.usuarioSeleccionado) return;

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
          error?.response?.data?.message ||
          "No se pudo habilitar el usuario.";
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
        this.errorMessage = this.mensajeErrorDeshabilitar(error);
      } finally {
        this.procesandoId = null;
        this.modalDeshabilitarVisible = false;
        this.usuarioSeleccionado = null;
      }
    },

    mensajeErrorDeshabilitar(error) {
      const data = error?.response?.data;
      if (data?.errores) {
        const errores = Object.values(data.errores).filter(Boolean).join(" ");
        if (errores) return errores;
      }
      return data?.message || "No se pudo deshabilitar el usuario.";
    },
  },
};
</script>

<style scoped>
.gestion-usuarios {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.gestion-usuarios__panel {
  margin-top: 1rem;
}

.gestion-usuarios__encabezado h1 {
  margin: 0;
  color: var(--color-primary);
  font-size: 2.25rem;
  font-weight: 800;
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
}

.gestion-usuarios__buscador {
  width: 100%;
  max-width: 420px;
}

.gestion-usuarios__toolbar-acciones {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gestion-usuarios__select-estado {
  min-width: 180px;
}

.gestion-usuarios__select-tamano {
  min-width: 150px;
}

.gestion-usuarios__pie-info {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.gestion-usuarios__paginacion {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 0;
}

.gestion-usuarios__tabla {
  --va-data-table-cell-padding: 0.45rem 0.6rem;
  font-size: 0.85rem;
}

.gestion-usuarios__id {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.gestion-usuarios__usuario {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.gestion-usuarios__usuario-datos {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.gestion-usuarios__avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.gestion-usuarios__avatar--0 {
  background: #e9e5ff;
  color: #4c4670;
}

.gestion-usuarios__avatar--1 {
  background: #fdf0d5;
  color: #8a6a1c;
}

.gestion-usuarios__avatar--2 {
  background: #e3f2fd;
  color: #1e5a8a;
}

.gestion-usuarios__avatar--3 {
  background: #e7f6ec;
  color: #2f6b45;
}

.gestion-usuarios__avatar--4 {
  background: #fde8f1;
  color: #9c3565;
}

.gestion-usuarios__avatar--5 {
  background: #ede7f6;
  color: #5b3f8a;
}

.gestion-usuarios__usuario-nombre {
  color: var(--color-text);
  font-size: 0.88rem;
}

.gestion-usuarios__usuario-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  color: var(--color-text-muted);
}

.gestion-usuarios__usuario-genero {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gestion-usuarios__estado-cuenta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.gestion-usuarios__estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.gestion-usuarios__estado-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.gestion-usuarios__estado--activo {
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.gestion-usuarios__estado--deshabilitado {
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.gestion-usuarios__estado--pendiente {
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.gestion-usuarios__estado--baja {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.gestion-usuarios__estado-detalle {
  display: flex;
  flex-direction: column;
}

.gestion-usuarios__estado-motivo {
  font-size: 0.78rem;
  color: var(--color-text);
}

.gestion-usuarios__estado-fecha {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.gestion-usuarios__acciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.deshabilitar-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.deshabilitar-form__duracion {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.deshabilitar-form__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
}

.deshabilitar-form__radio {
  margin-bottom: 0.25rem;
}

.deshabilitar-form__dias {
  max-width: 160px;
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
  border-top: 1px solid var(--color-border);
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
  background: var(--color-surface-muted);
  border: 1px dashed var(--color-border-strong);
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
  border-top: 1px solid var(--color-border);
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
