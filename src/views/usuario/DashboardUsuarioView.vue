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
        @click="tabActiva = 'calendario'"
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
          <VaButton color="primary" size="small" @click="$router.push({ name: 'crear-perfil' })">
            <span class="material-symbols-outlined" style="font-size: 1rem; margin-right: 0.25rem;">add</span>
            Crear perfil
          </VaButton>
          <div class="dashboard-usuario__view-toggle">
            <button
              class="dashboard-usuario__view-btn"
              :class="{ 'dashboard-usuario__view-btn--active': vista === 'lista' }"
              @click="vista = 'lista'"
            >
              <span class="material-symbols-outlined">view_list</span>
            </button>
            <button
              class="dashboard-usuario__view-btn"
              :class="{ 'dashboard-usuario__view-btn--active': vista === 'cuadricula' }"
              @click="vista = 'cuadricula'"
            >
              <span class="material-symbols-outlined">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      <BaseAlert v-if="mensajeBaja" :message="mensajeBaja" type="success" />
      <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

      <div v-if="cargando" class="dashboard-usuario__estado">
        <span class="material-symbols-outlined dashboard-usuario__estado-icono">hourglass_empty</span>
        Cargando perfiles...
      </div>

      <div v-else-if="perfilesFiltrados.length === 0" class="dashboard-usuario__estado">
        <span class="material-symbols-outlined dashboard-usuario__estado-icono">person_off</span>
        No se encontraron perfiles.
      </div>

      <div v-else class="dashboard-usuario__grid">
        <div
          v-for="perfil in perfilesFiltrados"
          :key="perfil.idPerfil"
          class="perfil-card"
        >
          <div class="perfil-card__header">
            <span class="perfil-card__header-name">{{ perfil.nombreArtistico }}</span>
            <button class="perfil-card__header-btn">
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>

          <div class="perfil-card__body">
            <div class="perfil-card__avatar">
              <img
                v-if="perfil.fotoUrl"
                :src="perfil.fotoUrl"
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
              <button class="perfil-card__icon-btn" title="Ver detalle" @click="verDetalle(perfil)">
                <span class="material-symbols-outlined">person</span>
              </button>
              <button
                v-if="perfil.estado === 'Activo'"
                class="perfil-card__icon-btn"
                title="Editar perfil"
                @click="irAEditar(perfil)"
              >
                <span class="material-symbols-outlined">edit</span>
              </button>
            </div>
            <button class="perfil-card__ingresar" @click="verDetalle(perfil)">
              Ver detalle
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="dashboard-usuario__estado">
      <span class="material-symbols-outlined dashboard-usuario__estado-icono">calendar_month</span>
      Calendario — Próximamente
    </div>

    <VaModal
      v-model="modalPerfilVisible"
      size="large"
      close-button
      hide-default-actions
    >
      <template #header>
        <h3 class="va-h5">Detalle de perfil</h3>
      </template>

      <div v-if="perfilSeleccionado" class="detalle-perfil">
        <div class="detalle-perfil__header">
          <img
            v-if="perfilSeleccionado.fotoUrl"
            :src="perfilSeleccionado.fotoUrl"
            :alt="perfilSeleccionado.nombreArtistico || 'Foto de perfil'"
            class="detalle-perfil__foto"
          />
          <div v-else class="detalle-perfil__foto detalle-perfil__foto--placeholder">
            <span class="material-symbols-outlined">person</span>
          </div>
          <div>
            <h4 class="va-h5">{{ perfilSeleccionado.nombreArtistico || 'Sin nombre artístico' }}</h4>
            <p class="detalle-perfil__texto-muted">{{ perfilSeleccionado.profesion || 'Sin profesión' }}</p>
          </div>
        </div>

        <div class="detalle-perfil__grid">
          <div class="detalle-perfil__campo">
            <span class="detalle-perfil__label">ID Perfil</span>
            <span>{{ perfilSeleccionado.idPerfil }}</span>
          </div>
          <div class="detalle-perfil__campo">
            <span class="detalle-perfil__label">Estado</span>
            <VaBadge :text="perfilSeleccionado.estado || '—'" :color="colorEstado(perfilSeleccionado.estado)" outline />
          </div>
          <div class="detalle-perfil__campo">
            <span class="detalle-perfil__label">Solicitud de baja</span>
            <span>{{ perfilSeleccionado.fechaSolicitudBaja ? formatearFecha(perfilSeleccionado.fechaSolicitudBaja) : 'No solicitó' }}</span>
          </div>
        </div>

        <div v-if="perfilSeleccionado.biografia" class="detalle-perfil__biografia">
          <span class="detalle-perfil__label">Biografía</span>
          <p>{{ perfilSeleccionado.biografia }}</p>
        </div>

        <div
          v-if="perfilSeleccionado.caracteristicas && perfilSeleccionado.caracteristicas.length > 0"
          class="detalle-perfil__caracteristicas"
        >
          <span class="detalle-perfil__titulo-bloque">Características físicas</span>

          <div v-if="renAltura.length" class="detalle-perfil__caracteristicas-grid">
            <div
              class="detalle-perfil__campo"
              v-for="carac in renAltura"
              :key="carac.idCaracteristica"
            >
              <span class="detalle-perfil__label">{{ carac._etiqueta }}</span>
              <span class="detalle-perfil__valor-carac">
                <span
                  v-if="carac.colorHex"
                  class="detalle-perfil__swatch"
                  :style="{ background: carac.colorHex }"
                ></span>
                {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
              </span>
            </div>
          </div>

          <div v-if="renMedidas.length" class="detalle-perfil__caracteristicas-grid">
            <div
              class="detalle-perfil__campo"
              v-for="carac in renMedidas"
              :key="carac.idCaracteristica"
            >
              <span class="detalle-perfil__label">{{ carac._etiqueta }}</span>
              <span class="detalle-perfil__valor-carac">
                <span
                  v-if="carac.colorHex"
                  class="detalle-perfil__swatch"
                  :style="{ background: carac.colorHex }"
                ></span>
                {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
              </span>
            </div>
          </div>

          <div v-if="renPielOjos.length" class="detalle-perfil__caracteristicas-grid">
            <div
              class="detalle-perfil__campo"
              v-for="carac in renPielOjos"
              :key="carac.idCaracteristica"
            >
              <span class="detalle-perfil__label">{{ carac._etiqueta }}</span>
              <span class="detalle-perfil__valor-carac">
                <span
                  v-if="carac.colorHex"
                  class="detalle-perfil__swatch"
                  :style="{ background: carac.colorHex }"
                ></span>
                {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
              </span>
            </div>
          </div>

          <div v-if="renCabelloTipo.length" class="detalle-perfil__caracteristicas-grid">
            <div
              class="detalle-perfil__campo"
              v-for="carac in renCabelloTipo"
              :key="carac.idCaracteristica"
            >
              <span class="detalle-perfil__label">{{ carac._etiqueta }}</span>
              <span class="detalle-perfil__valor-carac">
                <span
                  v-if="carac.colorHex"
                  class="detalle-perfil__swatch"
                  :style="{ background: carac.colorHex }"
                ></span>
                {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
              </span>
            </div>
          </div>

          <div v-if="renOtras.length" class="detalle-perfil__caracteristicas-grid">
            <div
              class="detalle-perfil__campo"
              v-for="carac in renOtras"
              :key="carac.idCaracteristica"
            >
              <span class="detalle-perfil__label">{{ carac._etiqueta }}</span>
              <span class="detalle-perfil__valor-carac">
                <span
                  v-if="carac.colorHex"
                  class="detalle-perfil__swatch"
                  :style="{ background: carac.colorHex }"
                ></span>
                {{ valorCarac(carac) }}{{ unidadCarac(carac) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="detalle-perfil__footer">
          <VaButton
            v-if="perfilSeleccionado && perfilSeleccionado.estado === 'PendienteBaja'"
            preset="secondary"
            color="success"
            @click="reactivarPerfil(perfilSeleccionado)"
          >
            <span class="material-symbols-outlined detalle-perfil__footer-icono">refresh</span>
            Reactivar perfil
          </VaButton>
          <div class="detalle-perfil__footer-der">
            <VaButton preset="secondary" @click="modalPerfilVisible = false">Cerrar</VaButton>
            <VaButton
              v-if="perfilSeleccionado && puedeEliminar"
              color="danger"
              outline
              @click="confirmarEliminar(perfilSeleccionado)"
            >
              <span class="material-symbols-outlined detalle-perfil__footer-icono">delete</span>
              Eliminar
            </VaButton>
            <VaButton
              v-if="perfilSeleccionado && puedeEditar"
              color="primary"
              @click="irAEditar(perfilSeleccionado)"
            >
              <span class="material-symbols-outlined detalle-perfil__footer-icono">edit</span>
              Editar
            </VaButton>
          </div>
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
        Tendrás 30 días para reactivarlo antes de que se elimine definitivamente.</p>
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
import BaseAlert from "../../components/AlertaBase.vue";

const ETIQUETAS_CARAC = {
  color_piel: "Color de piel",
  piel: "Color de piel",
  color_ojos: "Color de ojos",
  ojos: "Color de ojos",
  color_cabello: "Color de cabello",
  cabello: "Color de cabello",
  pelo: "Color de cabello",
  tipo_cabello: "Tipo de cabello",
  tipo_de_cabello: "Tipo de cabello",
  tipo_cabello_2: "Tipo de cabello",
  altura: "Altura",
  medida_pecho: "Pecho",
  pecho: "Pecho",
  busto: "Pecho",
  medida_cintura: "Cintura",
  cintura: "Cintura",
  medida_cadera: "Cadera",
  cadera: "Cadera",
};

const ETIQUETAS_VALORES = {
  marron: "Marrón",
  marrón: "Marrón",
  negro: "Negro",
  caoba: "Caoba",
  castanio: "Castaño",
  castano: "Castaño",
  castaño: "Castaño",
  rubio: "Rubio",
  rubia: "Rubia",
  pelirrojo: "Pelirrojo",
  pelirroja: "Pelirroja",
  otto: "Otro",
  otro: "Otro",
  celeste: "Celeste",
  verde: "Verde",
  azul: "Azul",
  gris: "Gris",
  blanco: "Blanco",
  avellana: "Avellana",
  miel: "Miel",
  clara: "Clara",
  media: "Media",
  oscura: "Oscura",
  muy_clara: "Muy clara",
  muy_oscura: "Muy oscura",
};

const ORDEN_CARAC = {
  color_piel: 10,
  piel: 10,
  color_ojos: 20,
  ojos: 20,
  color_cabello: 30,
  cabello: 30,
  pelo: 30,
  tipo_cabello: 40,
  tipo_de_cabello: 40,
  tipo_cabello_2: 40,
  altura: 100,
  medida_pecho: 200,
  pecho: 200,
  busto: 200,
  medida_cintura: 210,
  cintura: 210,
  medida_cadera: 220,
  cadera: 220,
};

const CODIGOS_ALTURA = ["altura"];
const CODIGOS_MEDIDAS = ["medida_pecho", "pecho", "busto", "medida_cintura", "cintura", "medida_cadera", "cadera"];
const CODIGOS_PIEL_OJOS = ["color_piel", "piel", "color_ojos", "ojos"];
const CODIGOS_CABELLO_TIPO = ["color_cabello", "cabello", "pelo", "tipo_cabello", "tipo_de_cabello", "tipo_cabello_2"];
const TODOS_CODIGOS = [
  ...CODIGOS_ALTURA,
  ...CODIGOS_MEDIDAS,
  ...CODIGOS_PIEL_OJOS,
  ...CODIGOS_CABELLO_TIPO,
];

const UNIDADES_POR_CODIGO = {
  altura: "cm",
  medida_pecho: "cm",
  pecho: "cm",
  busto: "cm",
  medida_cintura: "cm",
  cintura: "cm",
  medida_cadera: "cm",
  cadera: "cm",
};

function normCodigo(codigo) {
  return (codigo || "").toLowerCase().trim();
}

function inLista(codigo, lista) {
  return lista.some((c) => normCodigo(c) === normCodigo(codigo));
}

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
      mensajeBaja: "",
      mensajeError: "",
    };
  },
  computed: {
    puedeEliminar() {
      return this.perfilSeleccionado?.estado === "Activo";
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
  },
  mounted() {
    this.cargarPerfiles();
  },
  methods: {
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
      this.mensajeBaja = "";
      this.mensajeError = "";
      this.modalPerfilVisible = true;
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
        this.mensajeBaja = data?.mensaje || "Solicitud de baja registrada. Tenés 30 días para activar el perfil.";
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
        this.mensajeBaja = "Perfil reactivado correctamente.";
        this.modalPerfilVisible = false;
        await this.cargarPerfiles();
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo reactivar el perfil.";
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
      if (!fecha) return "—";
      const partes = fecha.split("T")[0].split("-");
      if (partes.length !== 3) return fecha;
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
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
  border-bottom: 2px solid #e5e7eb;
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.dashboard-usuario__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  background: var(--color-surface);
  min-width: 220px;
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
  align-items: center;
  gap: 0.75rem;
}

/* View toggle */
.dashboard-usuario__view-toggle {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.dashboard-usuario__view-btn {
  background: var(--color-surface);
  border: none;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}

.dashboard-usuario__view-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.dashboard-usuario__view-btn--active {
  background: #f3f4f6;
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

/* Grid de perfiles */
.dashboard-usuario__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

/* ── Tarjeta de perfil ── */
.perfil-card {
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.perfil-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-support);
  padding: 0.6rem 1rem;
}

.perfil-card__header-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
}

.perfil-card__header-btn {
  background: rgba(255, 255, 255, 0.25);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}

.perfil-card__header-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.perfil-card__header-btn .material-symbols-outlined {
  font-size: 1rem;
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
  background: #f3f4f6;
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
  color: var(--color-text-muted);
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
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
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
  border-bottom: 1px solid #f3f4f6;
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
  border-top: 1px solid #f3f4f6;
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
  background: #f0fdf4;
}

.perfil-card__ingresar .material-symbols-outlined {
  font-size: 1rem;
}

/* ── Detalle de perfil (modal) ── */
.detalle-perfil {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detalle-perfil__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.detalle-perfil__foto {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.detalle-perfil__foto--placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.detalle-perfil__foto--placeholder .material-symbols-outlined {
  font-size: 2rem;
}

.detalle-perfil__texto-muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin: 0;
}

.detalle-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.detalle-perfil__campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-text);
}

.detalle-perfil__label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.detalle-perfil__biografia p {
  margin: 0.35rem 0 0;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.detalle-perfil__caracteristicas {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detalle-perfil__titulo-bloque {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
}

.detalle-perfil__caracteristicas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.detalle-perfil__valor-carac {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.detalle-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.detalle-perfil__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.detalle-perfil__footer-der {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 0.5rem;
}

.detalle-perfil__footer--der {
  justify-content: flex-end;
}

.detalle-perfil__footer-icono {
  font-size: 1.1rem;
}

</style>
