<template>
  <div class="mi-red">
    <section class="mi-red__hero">
      <div class="mi-red__hero-texto">
        <h1 class="mi-red__titulo">Mi red</h1>
        <p class="mi-red__subtitulo">
          {{ totalConexiones }} conexiones · {{ totalEnLinea }} en línea ahora
        </p>
      </div>

      <div class="mi-red__rail-wrap">
        <span class="mi-red__rail-titulo">En línea ahora</span>
        <div class="mi-red__rail">
          <button
            v-for="conexion in conexionesEnLineaVisibles"
            :key="conexion.idConexion"
            type="button"
            class="mi-red__rail-item"
            :title="`${nombreDe(conexion)} · En línea`"
            @click="verPerfil(conexion)"
          >
            <AvatarPresencia
              :nombre="nombreDe(conexion)"
              :foto-url="conexion.perfil?.fotoUrl"
              :en-linea="true"
              :tamano="54"
              borde="var(--color-primary)"
            />
            <span class="mi-red__rail-nombre">{{ nombreDe(conexion) }}</span>
            <small>{{ conexion.perfil?.nombreProfesion || "Profesión" }}</small>
          </button>

          <span v-if="!conexionesEnLineaVisibles.length" class="mi-red__rail-vacio">
            Nadie de tu red está en línea.
          </span>
        </div>
      </div>
    </section>

    <div class="mi-red__tabs" role="tablist" aria-label="Mi red">
      <button
        type="button"
        class="mi-red__tab"
        :class="{ 'mi-red__tab--activo': tab === 'conexiones' }"
        role="tab"
        :aria-selected="tab === 'conexiones'"
        @click="cambiarTab('conexiones')"
      >
        Conexiones
        <span class="mi-red__tab-count">{{ totalConexiones }}</span>
      </button>
      <button
        type="button"
        class="mi-red__tab"
        :class="{ 'mi-red__tab--activo': tab === 'recibidas' }"
        role="tab"
        :aria-selected="tab === 'recibidas'"
        @click="cambiarTab('recibidas')"
      >
        Recibidas
        <span v-if="pendientesRecibidas > 0" class="mi-red__tab-badge">
          {{ pendientesRecibidas }}
        </span>
      </button>
      <button
        type="button"
        class="mi-red__tab"
        :class="{ 'mi-red__tab--activo': tab === 'enviadas' }"
        role="tab"
        :aria-selected="tab === 'enviadas'"
        @click="cambiarTab('enviadas')"
      >
        Enviadas
        <span class="mi-red__tab-count">{{ totalEnviadas }}</span>
      </button>
    </div>

    <section class="mi-red__panel" role="tabpanel">
      <ConexionesPanel
        v-if="tab === 'conexiones'"
        :resumen="resumenConexiones"
        :id-conexion-destacada="idConexionDestacada"
        @actualizado="onConexionesActualizadas"
      />
      <SolicitudesConexionPanel
        v-else
        :direccion="tab === 'recibidas' ? 'RECIBIDA' : 'ENVIADA'"
        @actualizado="onSolicitudesActualizadas"
      />
    </section>
  </div>
</template>

<script>
import ConexionesPanel from "../../components/conexion/ConexionesPanel.vue";
import SolicitudesConexionPanel from "../../components/conexion/SolicitudesConexionPanel.vue";
import AvatarPresencia from "../../components/conexion/AvatarPresencia.vue";
import conexionService from "../../services/conexionService";
import {
  enLineaDe,
  desuscribirPerfiles,
  reconciliarSuscripciones,
} from "../../services/presenciaState";
import {
  state as solicitudConexionState,
  cargarConteosSolicitudesConexion,
} from "../../services/solicitudConexionState";

const TABS = ["conexiones", "recibidas", "enviadas"];

function normalizarTab(valor) {
  if (TABS.includes(valor)) return valor;
  return "conexiones";
}

export default {
  name: "MiRedView",
  components: {
    ConexionesPanel,
    SolicitudesConexionPanel,
    AvatarPresencia,
  },
  data() {
    return {
      tab: "conexiones",
      resumenConexiones: {
        totalConexiones: 0,
        totalEnLinea: 0,
        profesiones: [],
      },
      conexionesEnLinea: [],
      idsPresenciaRail: [],
    };
  },
  computed: {
    pendientesRecibidas() {
      return solicitudConexionState.pendientesRecibidas;
    },
    totalEnviadas() {
      return solicitudConexionState.conteosEnviadas.TODAS || 0;
    },
    totalConexiones() {
      return Number(this.resumenConexiones?.totalConexiones) || 0;
    },
    totalEnLinea() {
      return Number(this.resumenConexiones?.totalEnLinea) || 0;
    },
    conexionesEnLineaVisibles() {
      return this.conexionesEnLinea.filter((conexion) =>
        this.enLineaDe(conexion)
      );
    },
    idConexionDestacada() {
      return this.$route.query.idConexion ?? null;
    },
  },
  watch: {
    "$route.query.tab"(nuevo) {
      const tab = this.normalizarTab(nuevo);
      if (tab !== this.tab) this.tab = tab;
    },
  },
  mounted() {
    this.tab = this.normalizarTab(this.$route.query.tab);
    this.cargarResumenConexiones();
    this.cargarConteos();
  },
  beforeUnmount() {
    this.desuscribirRail();
  },
  methods: {
    normalizarTab(valor) {
      if (TABS.includes(valor)) return valor;
      if (valor === "solicitudes") {
        return this.$route.query.direccion === "ENVIADA"
          ? "enviadas"
          : "recibidas";
      }
      return "conexiones";
    },
    cambiarTab(tab) {
      if (tab === this.tab) return;
      this.tab = tab;
      this.$router
        .replace({
          name: "mi-red",
          query: { tab },
        })
        .catch(() => {});
    },
    async cargarResumenConexiones() {
      const [resumen, enLinea] = await Promise.allSettled([
        conexionService.resumen(),
        conexionService.listar({
          estadoPresencia: "EN_LINEA",
          page: 0,
          size: 20,
        }),
      ]);

      if (resumen.status === "fulfilled" && resumen.value?.data) {
        this.resumenConexiones = {
          totalConexiones: resumen.value.data.totalConexiones ?? 0,
          totalEnLinea: resumen.value.data.totalEnLinea ?? 0,
          profesiones: Array.isArray(resumen.value.data.profesiones)
            ? resumen.value.data.profesiones
            : [],
        };
      }

      if (enLinea.status === "fulfilled") {
        const data = enLinea.value?.data || {};
        this.conexionesEnLinea = Array.isArray(data.contenido)
          ? data.contenido
          : [];
        this.actualizarSuscripcionRail();
      }
    },
    async cargarConteos() {
      await Promise.allSettled([
        cargarConteosSolicitudesConexion("RECIBIDA"),
        cargarConteosSolicitudesConexion("ENVIADA"),
      ]);
    },
    actualizarSuscripcionRail() {
      const nuevos = this.conexionesEnLinea
        .map((conexion) => conexion?.perfil?.idPerfil)
        .filter((id) => id != null);
      const previos = this.idsPresenciaRail;
      this.idsPresenciaRail = nuevos;
      reconciliarSuscripciones(previos, nuevos);
    },
    desuscribirRail() {
      if (this.idsPresenciaRail.length) {
        desuscribirPerfiles(this.idsPresenciaRail);
        this.idsPresenciaRail = [];
      }
    },
    enLineaDe(conexion) {
      return enLineaDe(
        conexion?.perfil?.idPerfil,
        conexion?.enLinea ?? conexion?.perfil?.enLinea
      );
    },
    nombreDe(conexion) {
      return conexion?.perfil?.nombreArtistico || "Perfil";
    },
    verPerfil(conexion) {
      const idPerfil = conexion?.perfil?.idPerfil;
      if (idPerfil == null) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: idPerfil },
      });
    },
    onConexionesActualizadas() {
      this.cargarResumenConexiones();
    },
    onSolicitudesActualizadas(payload) {
      if (payload?.conexionCreada) {
        this.cargarResumenConexiones();
      }
    },
  },
};
</script>

<style scoped>
.mi-red {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.mi-red__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 1.2fr);
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem;
  border-radius: 20px;
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.mi-red__titulo {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

.mi-red__subtitulo {
  margin: 0.35rem 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.mi-red__rail-wrap {
  min-width: 0;
}

.mi-red__rail-titulo {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.76rem;
  font-weight: 700;
  opacity: 0.85;
}

.mi-red__rail {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.mi-red__rail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  width: 86px;
  flex: none;
  padding: 0.3rem 0.15rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.mi-red__rail-item:hover {
  background: color-mix(in srgb, var(--color-on-primary) 10%, transparent);
}

.mi-red__rail-nombre {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  font-weight: 700;
}

.mi-red__rail-item small {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.62rem;
  opacity: 0.75;
}

.mi-red__rail-vacio {
  font-size: 0.82rem;
  opacity: 0.8;
}

.mi-red__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.mi-red__tab {
  min-height: 44px;
  padding: 0 1rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.mi-red__tab:hover {
  color: var(--color-primary);
}

.mi-red__tab--activo {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.mi-red__tab-count {
  margin-left: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 600;
}

.mi-red__tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 17px;
  margin-left: 0.3rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  background: var(--color-danger-fill);
  color: var(--color-on-primary);
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
}

.mi-red__panel {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

@media (max-width: 760px) {
  .mi-red__hero {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .mi-red__panel {
    padding: 1rem;
  }
}
</style>
