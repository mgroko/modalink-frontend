<template>
  <div class="dashboard-usuario">
    <div class="dashboard-usuario__tabs">
      <button
        class="dashboard-usuario__tab"
        :class="{ 'dashboard-usuario__tab--active': tabActiva === 'perfiles' }"
        @click="tabActiva = 'perfiles'"
      >
        Perfiles
      </button>
      <button
        class="dashboard-usuario__tab"
        :class="{ 'dashboard-usuario__tab--active': tabActiva === 'calendario' }"
        @click="$router.push({ name: 'calendario' })"
      >
        Calendario
      </button>
    </div>

    <div v-if="tabActiva === 'perfiles'" class="dashboard-usuario__perfiles">
      <div class="dashboard-usuario__toolbar">
        <div class="dashboard-usuario__search">
          <span class="material-symbols-outlined">search</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar perfil"
            class="dashboard-usuario__search-input"
          />
        </div>

        <div class="dashboard-usuario__toolbar-right">
          <VaButton
            class="dashboard-usuario__crear"
            color="primary"
            @click="$router.push({ name: 'crear-perfil' })"
          >
            <span class="material-symbols-outlined" style="font-size: 1.15rem; margin-right: 0.35rem;">add</span>
            Crear perfil
          </VaButton>
          <div class="dashboard-usuario__view-toggle">
            <button
              type="button"
              class="dashboard-usuario__view-btn"
              :class="{ 'dashboard-usuario__view-btn--active': vista === 'lista' }"
              title="Ver en filas"
              aria-label="Ver perfiles en filas"
              :aria-pressed="vista === 'lista'"
              @click="vista = 'lista'"
            >
              <span class="material-symbols-outlined">view_list</span>
            </button>
            <button
              type="button"
              class="dashboard-usuario__view-btn"
              :class="{ 'dashboard-usuario__view-btn--active': vista === 'cuadricula' }"
              title="Ver en cuadrícula"
              aria-label="Ver perfiles en cuadrícula"
              :aria-pressed="vista === 'cuadricula'"
              @click="vista = 'cuadricula'"
            >
              <span class="material-symbols-outlined">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
      <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

      <div v-if="cargando" class="dashboard-usuario__estado">
        <span class="material-symbols-outlined dashboard-usuario__estado-icono">hourglass_empty</span>
        Cargando perfiles...
      </div>

      <div v-else-if="perfilesFiltrados.length === 0" class="dashboard-usuario__estado">
        <span class="material-symbols-outlined dashboard-usuario__estado-icono">person_off</span>
        No se encontraron perfiles.
      </div>

      <template v-else>
        <div v-if="vista === 'lista'" class="dashboard-usuario__lista">
          <div
            v-for="perfil in perfilesFiltrados"
            :key="perfil.idPerfil"
            class="perfil-fila"
            :class="{ 'perfil-fila--activo': perfil.idPerfil === idPerfilActivo }"
            role="button"
            tabindex="0"
            @click="verDetalle(perfil)"
            @keydown.enter="verDetalle(perfil)"
            @keydown.space.prevent="verDetalle(perfil)"
          >
            <div class="perfil-fila__identidad">
              <div class="perfil-fila__avatar">
                <img
                  v-if="perfil.fotoUrl"
                  :src="resolverFoto(perfil.fotoUrl)"
                  :alt="perfil.nombreArtistico"
                  class="perfil-fila__foto"
                />
                <span v-else class="perfil-fila__iniciales">{{ inicialesPerfil(perfil) }}</span>
                <span
                  class="perfil-fila__indicador"
                  :class="`perfil-fila__indicador--${claseEstado(perfil.estado)}`"
                  :title="perfil.estado || '—'"
                ></span>
              </div>
              <div class="perfil-fila__datos">
                <span class="perfil-fila__nombre">{{ perfil.nombreArtistico }}</span>
                <span class="perfil-fila__meta">
                  {{ perfil.profesion || "Profesión" }} · #{{ perfil.idPerfil }}
                </span>
              </div>
            </div>

            <p class="perfil-fila__biografia">{{ perfil.biografia || "" }}</p>

            <div class="perfil-fila__acciones">
              <span
                v-if="perfil.idPerfil === idPerfilActivo"
                class="perfil-fila__sesion"
              >
                En sesión
              </span>
              <button
                type="button"
                class="perfil-fila__icono"
                title="Ver detalle"
                @click.stop="verDetalle(perfil)"
              >
                <span class="material-symbols-outlined">person</span>
              </button>
              <button
                v-if="perfil.estado === 'Activo'"
                type="button"
                class="perfil-fila__icono"
                title="Editar perfil"
                @click.stop="irAEditar(perfil)"
              >
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button
                v-if="puedeIngresar(perfil)"
                type="button"
                class="perfil-fila__accion"
                :disabled="activandoId === perfil.idPerfil"
                @click.stop="activarPerfil(perfil)"
              >
                {{ activandoId === perfil.idPerfil ? "Ingresando..." : "Ingresar" }}
              </button>
              <button
                v-else-if="perfil.idPerfil === idPerfilActivo"
                type="button"
                class="perfil-fila__accion"
                @click.stop="irAHome"
              >
                Ir al inicio
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="dashboard-usuario__grid">
          <div
            v-for="perfil in perfilesFiltrados"
            :key="perfil.idPerfil"
            class="perfil-card"
            :style="{ '--perfil-color': colorPorProfesion(perfil) }"
            role="button"
            tabindex="0"
            @click="verDetalle(perfil)"
            @keydown.enter="verDetalle(perfil)"
            @keydown.space.prevent="verDetalle(perfil)"
          >
            <div class="perfil-card__header">
              <span class="perfil-card__header-name">{{ perfil.nombreArtistico }}</span>
              <div class="perfil-card__header-right">
                <span
                  v-if="perfil.idPerfil === idPerfilActivo"
                  class="perfil-card__header-activo"
                  title="Perfil en sesión"
                >
                  <span class="material-symbols-outlined">check_circle</span>
                  En sesión
                </span>
              </div>
            </div>

            <div class="perfil-card__body">
              <div class="perfil-card__avatar">
                <img
                  v-if="perfil.fotoUrl"
                  :src="resolverFoto(perfil.fotoUrl)"
                  :alt="perfil.nombreArtistico"
                  class="perfil-card__foto"
                />
                <span v-else class="material-symbols-outlined perfil-card__foto-placeholder">person</span>
              </div>
              <div class="perfil-card__info">
                <span class="perfil-card__profesion">{{ perfil.profesion || 'Profesión' }}</span>
                <span class="perfil-card__nombre">{{ perfil.nombreArtistico }}</span>
              </div>
            </div>

            <div class="perfil-card__meta">
              <div class="perfil-card__meta-item">
                <span class="perfil-card__meta-label">ID</span>
                <span class="perfil-card__meta-value">{{ perfil.idPerfil }}</span>
              </div>
              <div class="perfil-card__meta-item">
                <span class="perfil-card__meta-label">Estado</span>
                <VaBadge :text="perfil.estado || '—'" :color="colorEstado(perfil.estado)" outline />
              </div>
            </div>

            <p v-if="perfil.biografia" class="perfil-card__biografia">{{ perfil.biografia }}</p>

            <div class="perfil-card__footer">
              <div class="perfil-card__footer-icons">
                <button class="perfil-card__icon-btn" title="Ver detalle" @click.stop="verDetalle(perfil)">
                  <span class="material-symbols-outlined">person</span>
                </button>
                <button
                  v-if="perfil.estado === 'Activo'"
                  class="perfil-card__icon-btn"
                  title="Editar perfil"
                  @click.stop="irAEditar(perfil)"
                >
                  <span class="material-symbols-outlined">edit</span>
                </button>
              </div>
              <div class="perfil-card__footer-actions">
                <VaButton
                  v-if="puedeIngresar(perfil)"
                  class="perfil-card__iniciar"
                  color="success"
                  size="small"
                  :loading="activandoId === perfil.idPerfil"
                  @click.stop="activarPerfil(perfil)"
                >
                  Ingresar
                </VaButton>
                <VaButton
                  v-else-if="perfil.idPerfil === idPerfilActivo"
                  class="perfil-card__continuar"
                  color="#C96554"
                  size="small"
                  @click.stop="irAHome"
                >
                  Ir al inicio
                  <span class="material-symbols-outlined perfil-card__continuar-icon">chevron_right</span>
                </VaButton>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="dashboard-usuario__estado">
      <span class="material-symbols-outlined dashboard-usuario__estado-icono">calendar_month</span>
      Gestioná tu disponibilidad y jornada laboral desde el calendario.
      <button class="dashboard-usuario__calendario-link" @click="$router.push({ name: 'calendario' })">
        Ir al calendario
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>

    <VaModal
      v-model="modalPerfilVisible"
      size="large"
      max-width="980px"
      close-button
      hide-default-actions
    >
      <template #content>
        <div v-if="perfilSeleccionado" class="detalle-perfil">
          <header class="detalle-perfil__cabecera">
            <div class="detalle-perfil__identidad">
              <div class="detalle-perfil__avatar">
                <img
                  v-if="perfilSeleccionado.fotoUrl"
                  :src="resolverFoto(perfilSeleccionado.fotoUrl)"
                  :alt="perfilSeleccionado.nombreArtistico || 'Foto de perfil'"
                  class="detalle-perfil__foto"
                />
                <span v-else class="detalle-perfil__iniciales">
                  {{ inicialesPerfil(perfilSeleccionado) }}
                </span>
              </div>

              <div class="detalle-perfil__identidad-texto">
                <div class="detalle-perfil__nombre-linea">
                  <h4 class="detalle-perfil__nombre">
                    {{ perfilSeleccionado.nombreArtistico || "Sin nombre artístico" }}
                  </h4>
                  <span
                    class="detalle-perfil__estado"
                    :class="`detalle-perfil__estado--${claseEstado(perfilSeleccionado.estado)}`"
                  >
                    {{ perfilSeleccionado.estado || "—" }}
                  </span>
                </div>
                <p class="detalle-perfil__subtitulo">
                  {{ perfilSeleccionado.profesion || "Sin profesión" }} · Perfil #{{ perfilSeleccionado.idPerfil }}
                </p>
              </div>
            </div>
          </header>

          <p v-if="perfilSeleccionado.biografia" class="detalle-perfil__biografia-texto">
            {{ perfilSeleccionado.biografia }}
          </p>

          <p v-if="perfilSeleccionado.fechaSolicitudBaja" class="detalle-perfil__aviso">
            Solicitud de baja registrada: {{ formatearFecha(perfilSeleccionado.fechaSolicitudBaja) }}
          </p>

          <section v-if="caracteristicasMedidas.length" class="detalle-perfil__seccion">
            <h5 class="detalle-perfil__seccion-titulo">Medidas</h5>
            <div class="detalle-perfil__datos detalle-perfil__datos--medidas">
              <div
                v-for="carac in caracteristicasMedidas"
                :key="carac.idCaracteristica"
                class="detalle-perfil__dato"
              >
                <span class="detalle-perfil__dato-label">{{ carac._etiqueta }}</span>
                <span class="detalle-perfil__dato-valor">
                  {{ valorCarac(carac) }}<span class="detalle-perfil__unidad">{{ unidadCarac(carac) }}</span>
                </span>
              </div>
            </div>
          </section>

          <section v-if="caracteristicasApariencia.length" class="detalle-perfil__seccion">
            <h5 class="detalle-perfil__seccion-titulo">Apariencia</h5>
            <div class="detalle-perfil__datos detalle-perfil__datos--apariencia">
              <div
                v-for="carac in caracteristicasApariencia"
                :key="carac.idCaracteristica"
                class="detalle-perfil__dato detalle-perfil__dato--apariencia"
              >
                <span
                  class="detalle-perfil__swatch"
                  :class="{ 'detalle-perfil__swatch--icono': !carac.colorHex }"
                  :style="carac.colorHex ? { background: carac.colorHex } : null"
                >
                  <span v-if="!carac.colorHex" class="material-symbols-outlined">
                    {{ iconoCaracteristica(carac) }}
                  </span>
                </span>
                <span class="detalle-perfil__dato-texto">
                  <span class="detalle-perfil__dato-label">{{ carac._etiqueta }}</span>
                  <span class="detalle-perfil__dato-valor">{{ valorCarac(carac) }}</span>
                </span>
              </div>
            </div>
          </section>

          <footer class="detalle-perfil__footer">
            <div class="detalle-perfil__footer-izq">
              <button
                v-if="puedeEliminar"
                type="button"
                class="detalle-perfil__eliminar"
                @click="confirmarEliminar(perfilSeleccionado)"
              >
                <span class="material-symbols-outlined">delete</span>
                Eliminar
              </button>
              <VaButton
                v-if="perfilSeleccionado.estado === 'PendienteBaja'"
                preset="secondary"
                color="success"
                @click="reactivarPerfil(perfilSeleccionado)"
              >
                <span class="material-symbols-outlined detalle-perfil__footer-icono">refresh</span>
                Reactivar perfil
              </VaButton>
            </div>

            <div class="detalle-perfil__footer-der">
              <VaButton preset="secondary" @click="modalPerfilVisible = false">Cancelar</VaButton>
              <VaButton
                v-if="puedeEditar"
                preset="secondary"
                @click="irAEditar(perfilSeleccionado)"
              >
                <span class="material-symbols-outlined detalle-perfil__footer-icono">edit</span>
                Editar
              </VaButton>
              <VaButton
                v-if="puedeIngresar(perfilSeleccionado)"
                color="primary"
                :loading="activandoId === perfilSeleccionado.idPerfil"
                @click="activarPerfil(perfilSeleccionado)"
              >
                <span class="material-symbols-outlined detalle-perfil__footer-icono">login</span>
                Ingresar
              </VaButton>
              <VaButton
                v-else-if="perfilSeleccionado.estado === 'Activo' && perfilSeleccionado.idPerfil === idPerfilActivo"
                color="primary"
                @click="irAHome"
              >
                Ir al inicio
                <span class="material-symbols-outlined detalle-perfil__continuar-icon">chevron_right</span>
              </VaButton>
            </div>
          </footer>
        </div>
      </template>
    </VaModal>

    <VaModal
      v-model="modalEliminarVisible"
      size="small"
      close-button
      hide-default-actions
    >
      <template #header>
        <h3 class="va-h5">Eliminar perfil</h3>
      </template>
      <p>¿Estás seguro que querés solicitar la baja del perfil
        <strong>{{ perfilAEliminar?.nombreArtistico }}</strong>?
        Tendrás el plazo configurado para reactivarlo (30 días por defecto):
        el <strong>{{ fechaLimiteBaja }}</strong> pasará al estado Baja y quedará inaccesible para la comunidad.</p>
      <template #footer>
        <div class="detalle-perfil__footer detalle-perfil__footer--der">
          <VaButton preset="secondary" @click="modalEliminarVisible = false">Cancelar</VaButton>
          <VaButton color="danger" :loading="eliminando" @click="ejecutarEliminar">Confirmar baja</VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import { state as authState, setPerfilActivo } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import {
  ETIQUETAS_CARAC,
  ETIQUETAS_VALORES,
  ORDEN_CARAC,
  CODIGOS_ALTURA,
  CODIGOS_MEDIDAS,
  CODIGOS_PIEL_OJOS,
  CODIGOS_CABELLO_TIPO,
  TODOS_CODIGOS,
  UNIDADES_POR_CODIGO,
  normCodigo,
  inLista,
} from "../../utils/perfilConstants.js";
import { fechaExpiracionBaja, formatearFecha as formatearFechaHora } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";

//TODO ver aca que onda los colores!!!!!
const COLORES_POR_PROFESION = ["#5ca4a9", "rgb(192, 71, 117)", "#de8b42", "#6866a9", "#86407b"];

export default {
  name: "DashboardUsuarioView",
  components: {
    BaseAlert,
  },
  data() {
    return {
      tabActiva: "perfiles",
      busqueda: "",
      vista: "cuadricula",
      perfiles: [],
      cargando: true,
      modalPerfilVisible: false,
      perfilSeleccionado: null,
      modalEliminarVisible: false,
      perfilAEliminar: null,
      eliminando: false,
      mensajeExito: "",
      mensajeError: "",
      activandoId: null,
    };
  },
  computed: {
    idPerfilActivo() {
      return authState.usuario?.idPerfilActivo ?? null;
    },
    puedeEliminar() {
      return this.perfilSeleccionado?.estado === "Activo";
    },
    fechaLimiteBaja() {
      const fechaLimite = this.perfilAEliminar?.fechaLimite;
      const expira = fechaLimite || fechaExpiracionBaja(new Date());
      return expira ? formatearFechaHora(expira) : "";
    },
    puedeEditar() {
      return this.perfilSeleccionado?.estado === "Activo";
    },
    perfilesFiltrados() {
      const texto = this.busqueda.toLowerCase().trim();
      if (!texto) return this.perfiles;
      return this.perfiles.filter(
        (p) =>
          (p.nombreArtistico || "").toLowerCase().includes(texto) ||
          (p.profesion || "").toLowerCase().includes(texto)
      );
    },
    renAltura() {
      return this._ordenarCarac(CODIGOS_ALTURA);
    },
    renMedidas() {
      return this._ordenarCarac(CODIGOS_MEDIDAS);
    },
    renPielOjos() {
      return this._ordenarCarac(CODIGOS_PIEL_OJOS);
    },
    renCabelloTipo() {
      return this._ordenarCarac(CODIGOS_CABELLO_TIPO);
    },
    renOtras() {
      const caracs = this.perfilSeleccionado?.caracteristicas || [];
      return caracs
        .filter((c) => !inLista(c.codigo, TODOS_CODIGOS))
        .map((c) => ({ ...c, _etiqueta: this.etiquetaCarac(c.codigo) }));
    },
    caracteristicasMedidas() {
      return [...this.renAltura, ...this.renMedidas];
    },
    caracteristicasApariencia() {
      return [...this.renPielOjos, ...this.renCabelloTipo, ...this.renOtras];
    },
  },
  mounted() {
    this.cargarPerfiles();
  },
  methods: {
    resolverFoto(url) {
      return resolverFotoUrl(url);
    },
    inicialesPerfil(perfil) {
      const nombre = (perfil?.nombreArtistico || "").trim();
      if (!nombre) return "?";
      const partes = nombre.split(/\s+/).filter(Boolean);
      const inicial = partes[0]?.charAt(0) || "";
      const final = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
      return `${inicial}${final}`.toUpperCase() || "?";
    },
    claseEstado(estado) {
      if (estado === "Activo") return "activo";
      if (estado === "PendienteBaja") return "pendiente";
      if (estado === "Deshabilitado") return "deshabilitado";
      return "baja";
    },
    iconoCaracteristica(carac) {
      const codigo = normCodigo(carac?.codigo);
      if (codigo.includes("cabello") || codigo.includes("pelo")) return "content_cut";
      if (codigo.includes("piel")) return "face";
      if (codigo.includes("ojo")) return "visibility";
      return "tune";
    },
    async cargarPerfiles() {
      this.cargando = true;
      try {
        const response = await perfilService.listarMisPerfiles();
        this.perfiles = response.data || [];
      } catch {
        this.perfiles = [];
      } finally {
        this.cargando = false;
      }
    },
    verDetalle(perfil) {
      this.perfilSeleccionado = perfil;
      this.mensajeExito = "";
      this.mensajeError = "";
      this.modalPerfilVisible = true;
    },
    puedeIngresar(perfil) {
      return perfil?.estado === "Activo" && perfil?.idPerfil !== this.idPerfilActivo;
    },
    irAHome() {
      this.modalPerfilVisible = false;
      this.$router.push({ name: "home" });
    },
    colorPorProfesion(perfil) {
      const profesion = perfil?.profesion || perfil?.profesiones?.[0]?.nombre || "sin-profesion";
      const texto = profesion.toLowerCase().trim();
      let hash = 0;

      for (let indice = 0; indice < texto.length; indice += 1) {
        hash = (hash * 31 + texto.charCodeAt(indice)) >>> 0;
      }

      return COLORES_POR_PROFESION[hash % COLORES_POR_PROFESION.length];
    },
    async activarPerfil(perfil) {
      if (!perfil || this.activandoId === perfil.idPerfil) return;
      this.activandoId = perfil.idPerfil;
      this.mensajeExito = "";
      this.mensajeError = "";
      try {
        const response = await perfilService.activar(perfil.idPerfil);
        const activado = response?.data || perfil;
        setPerfilActivo(activado);
        this.modalPerfilVisible = false;
        await this.$router.push({ name: "home" });
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404) {
          this.mensajeError = "El perfil no existe o no te pertenece.";
        } else if (status === 400) {
          this.mensajeError =
            error?.response?.data?.message ||
            "El perfil está en proceso de baja y no puede activarse.";
        } else {
          this.mensajeError = "No se pudo iniciar sesión en el perfil. Intentá nuevamente.";
        }
      } finally {
        this.activandoId = null;
      }
    },
    irAEditar(perfil) {
      this.$router.push({ name: "editar-perfil", params: { id: perfil.idPerfil } });
    },
    confirmarEliminar(perfil) {
      this.perfilAEliminar = perfil;
      this.mensajeError = "";
      this.modalEliminarVisible = true;
    },
    async ejecutarEliminar() {
      if (!this.perfilAEliminar) return;
      this.eliminando = true;
      this.mensajeError = "";
      try {
        const response = await perfilService.eliminar(this.perfilAEliminar.idPerfil);
        const data = response?.data;
        this.mensajeExito =
          data?.mensaje ||
          (data?.fechaLimite
            ? `Solicitud de baja registrada. Reactivá el perfil antes del ${formatearFechaHora(data.fechaLimite)}.`
            : "Solicitud de baja registrada.");
        this.modalEliminarVisible = false;
        this.modalPerfilVisible = false;
        await this.cargarPerfiles();
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo solicitar la baja del perfil.";
      } finally {
        this.eliminando = false;
      }
    },
    async reactivarPerfil(perfil) {
      this.cargando = true;
      this.mensajeError = "";
      try {
        const response = await perfilService.reactivar(perfil.idPerfil);
        this.mensajeExito = "Perfil reactivado correctamente.";
        this.modalPerfilVisible = false;
        await this.cargarPerfiles();
      } catch (error) {
        const status = error?.response?.status;
        this.mensajeError =
          error?.response?.data?.message ||
          (status === 409
            ? "El plazo de reactivación venció: el perfil ya está en estado Baja."
            : "No se pudo reactivar el perfil.");
      } finally {
        this.cargando = false;
      }
    },
    colorEstado(estado) {
      if (estado === "Activo") return "success";
      if (estado === "PendienteBaja") return "warning";
      if (estado === "Deshabilitado") return "danger";
      if (estado === "Baja") return "backgroundElement";
      return "backgroundBorder";
    },
    formatearFecha(fecha) {
      return formatearFechaHora(fecha);
    },
    _ordenarCarac(codigos) {
      const caracs = this.perfilSeleccionado?.caracteristicas || [];
      return caracs
        .filter((c) => inLista(c.codigo, codigos))
        .map((c) => ({ ...c, _etiqueta: this.etiquetaCarac(c.codigo) }))
        .sort((a, b) => {
          const na = normCodigo(a.codigo);
          const nb = normCodigo(b.codigo);
          const oa = ORDEN_CARAC[na] ?? codigos.indexOf(na);
          const ob = ORDEN_CARAC[nb] ?? codigos.indexOf(nb);
          return oa - ob;
        });
    },
    etiquetaCarac(codigo) {
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARAC[n]) return ETIQUETAS_CARAC[n];
      const palabras = String(codigo || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ") || "—";
    },
    valorCarac(carac) {
      const raw = carac.codigoValor || carac.valor;
      if (raw == null || raw === "") return "—";
      const n = normCodigo(raw);
      if (ETIQUETAS_VALORES[n]) return ETIQUETAS_VALORES[n];
      const palabras = String(raw)
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ") || raw;
    },
    unidadCarac(carac) {
      const unidad = UNIDADES_POR_CODIGO[normCodigo(carac.codigo)];
      return unidad ? ` ${unidad}` : "";
    },
  },
};
</script>

<style scoped>
.dashboard-usuario {
  width: 100%;
}

/* Tabs */
.dashboard-usuario__tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 1.25rem;
}

.dashboard-usuario__tab {
  background: none;
  border: none;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.dashboard-usuario__tab:hover {
  color: var(--color-text);
}

.dashboard-usuario__tab--active {
  color: var(--color-text);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
}

/* Toolbar */
.dashboard-usuario__toolbar {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 0.9rem;
}

.dashboard-usuario__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0;
  height: 2.50rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0 0.9rem;
  background: var(--color-surface);
}

.dashboard-usuario__search .material-symbols-outlined {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.dashboard-usuario__search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--color-text);
  width: 100%;
}

.dashboard-usuario__search-input::placeholder {
  color: var(--color-text-muted);
}

.dashboard-usuario__toolbar-right {
  display: flex;
  align-items: stretch;
  gap: 0.6rem;
}

.dashboard-usuario__crear {
  height: 2.50rem;
  padding: 0 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* View toggle */
.dashboard-usuario__view-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.dashboard-usuario__view-btn {
  background: var(--color-surface);
  border: none;
  width: 3.1rem;
  min-height: 2.50rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}

.dashboard-usuario__view-btn:not(:last-child) {
  border-right: 1px solid var(--color-border);
}

.dashboard-usuario__view-btn--active {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.dashboard-usuario__view-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

/* Estado vacío / carga */
.dashboard-usuario__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.dashboard-usuario__estado-icono {
  font-size: 2.5rem;
}

.dashboard-usuario__calendario-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.dashboard-usuario__calendario-link:hover {
  background: var(--color-primary-dark);
}

.dashboard-usuario__calendario-link .material-symbols-outlined {
  font-size: 1.1rem;
}

/* Grid de perfiles */
.dashboard-usuario__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* Vista en filas ("renglón") */
.dashboard-usuario__lista {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface);
}

.perfil-fila {
  display: grid;
  grid-template-columns: minmax(200px, 0.9fr) minmax(180px, 1.6fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0.9rem;
  border-top: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s ease;
}

.perfil-fila:first-child {
  border-top: none;
}

.perfil-fila:hover {
  background: var(--color-hover);
}

.perfil-fila--activo,
.perfil-fila--activo:hover {
  background: var(--color-chip);
}

.perfil-fila:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.perfil-fila__identidad {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.perfil-fila__avatar {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.perfil-fila__foto {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.perfil-fila__iniciales {
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.perfil-fila__indicador {
  position: absolute;
  right: -0.05rem;
  bottom: -0.05rem;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  border: 1.5px solid var(--color-surface);
  background: var(--color-text-subtle);
}

.perfil-fila--activo .perfil-fila__indicador {
  border-color: var(--color-chip);
}

.perfil-fila__indicador--activo {
  background: var(--color-success);
}

.perfil-fila__indicador--pendiente {
  background: var(--color-warning);
}

.perfil-fila__indicador--deshabilitado {
  background: var(--color-danger);
}

.perfil-fila__indicador--baja {
  background: var(--color-text-subtle);
}

.perfil-fila__datos {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.perfil-fila__nombre {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perfil-fila__meta {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perfil-fila__biografia {
  margin: 0;
  min-width: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perfil-fila__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-shrink: 0;
}

.perfil-fila__sesion {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.perfil-fila__icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.4rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 7px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.perfil-fila__icono:hover {
  background: var(--color-hover);
  border-color: var(--color-primary);
  color: var(--color-text);
}

.perfil-fila__icono .material-symbols-outlined {
  font-size: 1.05rem;
}

.perfil-fila__accion {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-width: 6.5rem;
  height: 2.4rem;
  padding: 0 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 7px;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.perfil-fila__accion:hover:not(:disabled) {
  background: var(--color-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.perfil-fila__accion:disabled {
  opacity: 0.6;
  cursor: wait;
}

.perfil-fila__accion .material-symbols-outlined {
  font-size: 0.95rem;
}

@media (max-width: 1200px) {
  .perfil-fila {
    grid-template-columns: minmax(210px, 1fr) minmax(0, 1.2fr) auto;
    gap: 1rem;
  }
}

@media (max-width: 900px) {
  .perfil-fila {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "identidad acciones"
      "bio bio";
    row-gap: 0.75rem;
  }

  .perfil-fila__identidad {
    grid-area: identidad;
  }

  .perfil-fila__biografia {
    grid-area: bio;
  }

  .perfil-fila__acciones {
    grid-area: acciones;
  }
}

@media (max-width: 680px) {
  .dashboard-usuario__toolbar {
    flex-wrap: wrap;
  }

  .dashboard-usuario__search {
    flex: 1 1 100%;
  }

  .dashboard-usuario__toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .perfil-fila {
    grid-template-columns: 1fr;
    grid-template-areas:
      "identidad"
      "bio"
      "acciones";
  }

  .perfil-fila__acciones {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .perfil-fila__accion {
    flex: 1 1 100%;
  }
}

/* ── Tarjeta de perfil ── */
.perfil-card {
  background: var(--color-surface);
  border: 1px solid var(--perfil-color);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.perfil-card:focus-visible {
  outline: 2px solid var(--perfil-color);
  outline-offset: 2px;
}

.perfil-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--perfil-color);
  padding: 0.6rem 1rem;
}

.perfil-card__header-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
}

.perfil-card__header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.perfil-card__header-activo {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.perfil-card__header-activo .material-symbols-outlined {
  font-size: 0.9rem;
}

.perfil-card__body {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.perfil-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.perfil-card__foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-card__foto-placeholder {
  font-size: 1.6rem;
  color: var(--color-text-muted);
}

.perfil-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.perfil-card__profesion {
  font-size: 0.72rem;
  color: var(--perfil-color);
  font-weight: 600;
}

.perfil-card__nombre {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Meta dentro de la tarjeta */
.perfil-card__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--color-border-soft);
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 0.78rem;
}

.perfil-card__meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.perfil-card__meta-label {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.perfil-card__meta-value {
  color: var(--color-text);
  font-weight: 600;
}

.perfil-card__biografia {
  margin: 0;
  padding: 0.6rem 1rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer de la tarjeta */
.perfil-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--color-border-soft);
}

.perfil-card__footer-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.perfil-card__iniciar {
  color: var(--color-on-accent) !important;
}

.perfil-card__continuar {
  --va-background-color: var(--color-surface) !important;
  --va-background-mask-color: transparent !important;
  --va-background-mask-opacity: 0 !important;
  color: var(--color-accent) !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0.25rem 0.5rem !important;
}

.perfil-card__continuar :deep(.va-button__content) {
  color: var(--color-accent) !important;
}

.perfil-card__continuar-icon {
  font-size: 1rem;
  margin-left: 0.1rem;
}

.perfil-card__footer-icons {
  display: flex;
  gap: 0.5rem;
}

.perfil-card__icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0.2rem;
  display: flex;
  align-items: center;
}

.perfil-card__icon-btn:hover {
  color: var(--color-text);
}

.perfil-card__icon-btn .material-symbols-outlined {
  font-size: 1.15rem;
}

.perfil-card__ingresar {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: #22c55e;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.perfil-card__ingresar:hover {
  background: var(--color-success-soft);
}

.perfil-card__ingresar .material-symbols-outlined {
  font-size: 1rem;
}

/* ── Detalle de perfil (modal) ── */
.detalle-perfil {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.detalle-perfil__cabecera {
  padding: 1.5rem 3rem 0 1.5rem;
}

.detalle-perfil__identidad {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.detalle-perfil__avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}

.detalle-perfil__foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detalle-perfil__iniciales {
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.detalle-perfil__identidad-texto {
  min-width: 0;
}

.detalle-perfil__nombre-linea {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.detalle-perfil__nombre {
  margin: 0;
  font-size: 1.55rem;
  line-height: 1.2;
  font-weight: 700;
  color: var(--color-text);
}

.detalle-perfil__estado {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.detalle-perfil__estado--activo {
  background: var(--color-success-soft);
  color: var(--color-success-text);
  border-color: var(--color-success-border);
}

.detalle-perfil__estado--pendiente {
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  border-color: var(--color-warning-border);
}

.detalle-perfil__estado--deshabilitado {
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  border-color: var(--color-danger-border);
}

.detalle-perfil__estado--baja {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  border-color: var(--color-border);
}

.detalle-perfil__subtitulo {
  margin: 0.3rem 0 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}

.detalle-perfil__biografia-texto {
  margin: 0;
  padding: 1.35rem 1.75rem 0;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-text);
  white-space: pre-wrap;
}

.detalle-perfil__aviso {
  margin: 1rem 1.75rem 0;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.85rem;
}

.detalle-perfil__seccion {
  padding: 1.5rem 1.75rem 0;
}

.detalle-perfil__seccion-titulo {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.detalle-perfil__datos {
  display: grid;
  gap: 0.7rem;
}

.detalle-perfil__datos--medidas {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.detalle-perfil__datos--apariencia {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detalle-perfil__dato {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.9rem 1.1rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.detalle-perfil__dato--apariencia {
  flex-direction: row;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
}

.detalle-perfil__dato-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.detalle-perfil__dato-valor {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.detalle-perfil__dato--apariencia .detalle-perfil__dato-valor {
  font-size: 1.05rem;
  font-weight: 500;
}

.detalle-perfil__unidad {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.detalle-perfil__swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.detalle-perfil__swatch--icono {
  border-radius: 8px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.detalle-perfil__swatch--icono .material-symbols-outlined {
  font-size: 1.05rem;
}

.detalle-perfil__dato-texto {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.detalle-perfil__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.detalle-perfil > .detalle-perfil__footer {
  flex-wrap: wrap;
  margin-top: 1.5rem;
  padding: 1rem 1.75rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.detalle-perfil__footer--der {
  justify-content: flex-end;
}

.detalle-perfil__footer-izq,
.detalle-perfil__footer-der {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.detalle-perfil__footer-der {
  margin-left: auto;
}

.detalle-perfil__eliminar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.55rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-danger-text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.detalle-perfil__eliminar:hover {
  background: var(--color-danger-soft);
}

.detalle-perfil__eliminar .material-symbols-outlined {
  font-size: 1.1rem;
}

.detalle-perfil__footer-icono {
  font-size: 1.05rem;
  margin-right: 0.2rem;
}

.detalle-perfil__continuar-icon {
  font-size: 1rem;
  margin-left: 0.1rem;
}

@media (max-width: 760px) {
  .detalle-perfil__cabecera {
    padding: 1.25rem 2.75rem 0 1.25rem;
  }

  .detalle-perfil__avatar {
    width: 64px;
    height: 64px;
  }

  .detalle-perfil__iniciales {
    font-size: 1.35rem;
  }

  .detalle-perfil__nombre {
    font-size: 1.25rem;
  }

  .detalle-perfil__biografia-texto {
    padding: 1rem 1.25rem 0;
    font-size: 0.92rem;
  }

  .detalle-perfil__aviso {
    margin: 1rem 1.25rem 0;
  }

  .detalle-perfil__seccion {
    padding: 1.25rem 1.25rem 0;
  }

  .detalle-perfil__datos--medidas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detalle-perfil__datos--apariencia {
    grid-template-columns: 1fr;
  }

  .detalle-perfil > .detalle-perfil__footer {
    padding: 0.85rem 1.25rem;
  }

  .detalle-perfil__footer-der {
    width: 100%;
    justify-content: flex-end;
  }
}

</style>
