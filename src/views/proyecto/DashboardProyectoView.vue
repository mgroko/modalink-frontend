<template>
  <div class="dashboard-proyecto">
    <div v-if="cargando" class="dashboard-proyecto__estado">
      <span class="material-symbols-outlined dashboard-proyecto__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <template v-else>
      <BaseAlert v-if="mensajeError && !estadoNoEncontrado" :message="mensajeError" type="error" />

      <div v-if="puedeReintentar" class="dashboard-proyecto__reintento">
        <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
          Reintentar
        </VaButton>
      </div>

      <section v-if="estadoNoEncontrado" class="dashboard-proyecto__estado">
        <span class="material-symbols-outlined dashboard-proyecto__estado-icono">folder_open</span>
        <p class="dashboard-proyecto__estado-titulo">Proyecto no encontrado</p>
        <p class="dashboard-proyecto__estado-texto">
          {{ mensajeError || "No encontramos el proyecto que estás buscando." }}
        </p>
        <VaButton preset="secondary" @click="irAProyectos">Volver a Proyectos</VaButton>
      </section>

      <div v-else-if="mostrarVolver && !proyecto" class="dashboard-proyecto__reintento">
        <VaButton preset="secondary" @click="irAProyectos">Volver a Proyectos</VaButton>
      </div>

      <template v-if="proyecto">
        <section class="dashboard-proyecto__panel dashboard-proyecto__hero">
          <div class="dashboard-proyecto__hero-cuerpo">
            <div class="dashboard-proyecto__hero-titular">
              <h1 class="dashboard-proyecto__nombre">{{ proyecto.nombre }}</h1>
              <EstadoProyectoBadge :estado="proyecto.estado" />
            </div>
            <p class="dashboard-proyecto__hero-descripcion">{{ proyecto.descripcion }}</p>
            <p class="dashboard-proyecto__hero-rol">{{ subtituloRol }}</p>
          </div>

          <div class="dashboard-proyecto__hero-acciones">
            <VaButton
              v-if="puedeEditar"
              preset="secondary"
              disabled
              title="Próximamente"
            >
              Editar
            </VaButton>
            <VaButton
              v-if="puedePublicar"
              preset="primary"
              disabled
              title="Próximamente"
            >
              Publicar
            </VaButton>
            <VaButton
              v-if="puedePostularse"
              preset="primary"
              disabled
              title="Próximamente..."
            >
              Próximamente...
            </VaButton>
          </div>
        </section>

        <section class="dashboard-proyecto__panel">
          <h2 class="dashboard-proyecto__titulo">Datos generales</h2>
          <p class="dashboard-proyecto__parrafo">{{ proyecto.descripcion }}</p>

          <div class="dashboard-proyecto__grilla">
            <div class="dashboard-proyecto__dato">
              <span class="dashboard-proyecto__dato-label">Privacidad</span>
              <span class="dashboard-proyecto__dato-valor">
                {{ ETIQUETAS_PRIVACIDAD[proyecto.privacidad] || proyecto.privacidad }}
              </span>
              <span v-if="esPrivado" class="dashboard-proyecto__dato-hint">
                Visible solo para tus perfiles miembros
              </span>
            </div>

            <div class="dashboard-proyecto__dato">
              <span class="dashboard-proyecto__dato-label">Ubicación</span>
              <span class="dashboard-proyecto__dato-valor">{{ ubicacionTexto }}</span>
            </div>

            <div class="dashboard-proyecto__dato">
              <span class="dashboard-proyecto__dato-label">Fecha de entrega</span>
              <span class="dashboard-proyecto__dato-valor">
                {{ formatearFechaCorta(proyecto.fechaEntregaEstipulada) }}
              </span>
            </div>

            <div class="dashboard-proyecto__dato">
              <span class="dashboard-proyecto__dato-label">Fecha de inicio</span>
              <span class="dashboard-proyecto__dato-valor">
                {{ formatearFechaCorta(proyecto.fechaInicio) }}
              </span>
            </div>

            <div class="dashboard-proyecto__dato">
              <span class="dashboard-proyecto__dato-label">Director</span>
              <span class="dashboard-proyecto__dato-valor">
                {{ proyecto.nombreDirector || "—" }}
              </span>
            </div>

            <div v-if="proyecto.aceptaPostulacionGral" class="dashboard-proyecto__dato">
              <span class="dashboard-proyecto__dato-label">Postulaciones</span>
              <span class="dashboard-proyecto__chip-postulaciones">Acepta postulaciones</span>
            </div>
          </div>
        </section>

        <section class="dashboard-proyecto__panel">
          <h2 class="dashboard-proyecto__titulo">Objetivos</h2>
          <div
            v-if="(proyecto.objetivos || []).length"
            class="dashboard-proyecto__objetivos"
          >
            <article
              v-for="objetivo in proyecto.objetivos"
              :key="objetivo.idObjetivo"
              class="dashboard-proyecto__objetivo"
            >
              <p class="dashboard-proyecto__objetivo-nombre">{{ objetivo.nombre }}</p>
              <p v-if="objetivo.descripcion" class="dashboard-proyecto__objetivo-desc">
                {{ objetivo.descripcion }}
              </p>
            </article>
          </div>
          <p v-else class="dashboard-proyecto__vacio">
            Este proyecto no tiene objetivos cargados.
          </p>
        </section>

        <section class="dashboard-proyecto__panel">
          <h2 class="dashboard-proyecto__titulo">Personal requerido</h2>
          <div
            v-if="(proyecto.requerimientosGral || []).length"
            class="dashboard-proyecto__requerimientos"
          >
            <RequerimientoDetalle
              v-for="requerimiento in proyecto.requerimientosGral"
              :key="requerimiento.idRequerimientoGral"
              :requerimiento="requerimiento"
              :habilidades="habilidades"
              :catalogo-caracteristicas="catalogosCaracteristicas[requerimiento.idProfesion] || null"
            />
          </div>
          <p v-else class="dashboard-proyecto__vacio">
            Este proyecto no tiene personal requerido cargado.
          </p>
        </section>

        <section v-if="proyecto.moodboard" class="dashboard-proyecto__panel">
          <h2 class="dashboard-proyecto__titulo">Moodboard</h2>

          <CollageMoodboard
            v-if="imagenesMoodboard.length"
            :imagenes="imagenesMoodboard"
            solo-lectura
            @ampliar="galeriaAbierta = true"
          />
          <p v-else class="dashboard-proyecto__contador">
            0 de {{ MOODBOARD_IMAGENES.MAX_IMAGENES }} imágenes
          </p>

          <p v-if="proyecto.moodboard.descripcion" class="dashboard-proyecto__parrafo">
            {{ proyecto.moodboard.descripcion }}
          </p>
        </section>

        <section v-if="esMiembro" class="dashboard-proyecto__panel dashboard-proyecto__proximamente">
          <h2 class="dashboard-proyecto__titulo">Próximamente</h2>
          <p class="dashboard-proyecto__parrafo">
            Los miembros del equipo, el cronograma de actividades y las
            postulaciones se habilitarán en una iteración siguiente.
          </p>
        </section>

        <ModalGaleriaMoodboard
          :model-value="galeriaAbierta"
          :imagenes="imagenesMoodboard"
          solo-lectura
          @update:modelValue="galeriaAbierta = $event"
        />
      </template>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService";
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import { refrescarSesion } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoProyectoBadge from "../../components/proyecto/EstadoProyectoBadge.vue";
import RequerimientoDetalle from "../../components/proyecto/RequerimientoDetalle.vue";
import CollageMoodboard from "../../components/proyecto/CollageMoodboard.vue";
import ModalGaleriaMoodboard from "../../components/proyecto/ModalGaleriaMoodboard.vue";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { formatearFechaCorta } from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  ETIQUETAS_PRIVACIDAD,
  ESTADOS_PROYECTO,
  MOODBOARD_IMAGENES,
  PRIVACIDADES,
  ROLES_PROYECTO,
  etiquetaRolProyecto,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

// Cancela la request en vuelo si cambia el id o se reintenta
// (no reactivo a propósito: AbortController no debe pasar por reactive()).
let controladorCarga = null;

export default {
  name: "DashboardProyectoView",
  components: {
    BaseAlert,
    EstadoProyectoBadge,
    RequerimientoDetalle,
    CollageMoodboard,
    ModalGaleriaMoodboard,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      ETIQUETAS_PRIVACIDAD,
      MOODBOARD_IMAGENES,
      proyecto: null,
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      estadoNoEncontrado: false,
      mostrarVolver: false,
      habilidades: [],
      catalogosCaracteristicas: {},
      galeriaAbierta: false,
      idCarga: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    permisos() {
      return this.proyecto?.permisos || [];
    },
    esMiembro() {
      return !!this.proyecto?.esMiembro;
    },
    esDirector() {
      return this.proyecto?.rolUsuario === ROLES_PROYECTO.DIRECTOR;
    },
    esBorrador() {
      return normalizarEstadoProyecto(this.proyecto?.estado) === ESTADOS_PROYECTO.BORRADOR;
    },
    esPrivado() {
      return this.proyecto?.privacidad === PRIVACIDADES.PRIVADO;
    },
    puedeEditar() {
      return this.permisos.includes("MODIFICAR_PROYECTO");
    },
    puedePublicar() {
      return this.permisos.includes("PUBLICAR_PROYECTO") && this.esBorrador;
    },
    puedePostularse() {
      return (
        !this.esMiembro &&
        !!this.proyecto?.aceptaPostulacionGral &&
        !!this.proyecto?.elegibleParaPostularse
      );
    },
    /** Textos §4.1 de la ficha ver-proyecto. */
    subtituloRol() {
      if (!this.proyecto) return "";
      if (!this.esMiembro) return "Vista pública del proyecto";
      const rol = etiquetaRolProyecto(this.proyecto.rolUsuario);
      const base = `Tu rol: ${rol} de proyecto`;
      if (!this.esBorrador) return base;
      const detalle = this.esDirector
        ? "Solo vos podés ver el borrador hasta publicarlo"
        : "Este proyecto está en borrador: aún no es visible para otros perfiles";
      return `${base} · ${detalle}`;
    },
    ubicacionTexto() {
      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      if (ciudad && provincia) return `${ciudad}, ${provincia}`;
      return ciudad || provincia || "—";
    },
    /** Items del wizard ({id, nombre, preview}) desde las imágenes de la API. */
    imagenesMoodboard() {
      const imagenes = this.proyecto?.moodboard?.imagenes || [];
      return imagenes.map((imagen, indice) => ({
        id: imagen.idImagen,
        nombre: `Imagen ${indice + 1}`,
        preview: resolverFotoUrl(imagen.url),
      }));
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.proyecto = null;
      this.cargar();
    },
  },
  created() {
    // Pintado inmediato opcional desde history.state (CrearProyectoView);
    // la fuente sigue siendo el fetch de cargar() — ver ficha §7.2.
    const estado = window.history.state || {};
    if (estado.proyecto && String(estado.proyecto.idProyecto) === String(this.idProyecto)) {
      this.proyecto = estado.proyecto;
      this.cargando = false;
    }
  },
  async mounted() {
    await this.cargar();
  },
  methods: {
    formatearFechaCorta,
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      // Con precarga visible no se tapa con spinner; sin datos, spinner.
      this.cargando = !this.proyecto;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.estadoNoEncontrado = false;
      this.mostrarVolver = false;

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;
        this.proyecto = response?.data || null;
        if (!this.proyecto) {
          this.estadoNoEncontrado = true;
          this.mostrarVolver = true;
          return;
        }
        await this.cargarCatalogos(this.proyecto, corrida);
      } catch (error) {
        if (
          corrida !== this.idCarga ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    /**
     * Catálogos para traducir ids → nombres (ficha §3.2): habilidades y
     * características por profesión. Si un catálogo no está disponible la vista
     * degrada (chips sin traducir) sin bloquear la carga del proyecto.
     */
    async cargarCatalogos(proyecto, corrida) {
      const requerimientos = Array.isArray(proyecto.requerimientosGral)
        ? proyecto.requerimientosGral
        : [];
      const idsProfesion = [
        ...new Set(requerimientos.map((r) => r?.idProfesion).filter(Boolean)),
      ];

      const resultados = await Promise.allSettled([
        habilidadService.listar(),
        ...idsProfesion.map((id) => perfilService.caracteristicasPorProfesion(id)),
      ]);
      // La navegación pudo cambiar el id mientras cargaban los catálogos.
      if (corrida !== this.idCarga) return;

      const habilidadesRes = resultados[0];
      const datosHabilidades =
        habilidadesRes.status === "fulfilled" ? habilidadesRes.value?.data : null;
      this.habilidades = Array.isArray(datosHabilidades)
        ? datosHabilidades
        : datosHabilidades?.habilidades || [];

      const catalogos = {};
      idsProfesion.forEach((id, i) => {
        const resultado = resultados[i + 1];
        if (resultado?.status !== "fulfilled") {
          catalogos[id] = null;
          return;
        }
        const datos = resultado.value?.data;
        catalogos[id] = Array.isArray(datos) ? datos : datos?.caracteristicas || [];
      });
      this.catalogosCaracteristicas = catalogos;
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.proyecto = null;

      const clasificacion = clasificarErrorProyecto(error);

      if (clasificacion?.tipo === "perfil-activo") {
        this.mensajeError =
          "No hay un perfil activo seleccionado. Elegí un perfil para ver el proyecto.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion?.tipo === "perfil-no-encontrado") {
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (status === 403) {
        this.mensajeError = /perfil/i.test(mensaje)
          ? "El perfil no se encuentra activo."
          : "No tenés acceso a este proyecto: es privado o está en borrador y no sos miembro del equipo.";
        this.mostrarVolver = true;
        return;
      }

      if (status === 404) {
        if (/proyecto/i.test(mensaje)) {
          this.estadoNoEncontrado = true;
          this.mensajeError = mensaje;
          this.mostrarVolver = true;
          return;
        }
        this.mensajeError = mensajeErrorApi(error, "No se pudo cargar el proyecto.");
        return;
      }

      if (status === 409 || clasificacion?.tipo === "perfil-baja") {
        this.mensajeError = "El perfil no se encuentra activo.";
        this.mostrarVolver = true;
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError = "Ocurrió un error al cargar el proyecto. Inténtalo nuevamente.";
        this.toast.init({
          title: "Error del servidor",
          message: "No se pudo cargar el proyecto. Usá el botón de reintento.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar el proyecto."
      );
      this.mostrarVolver = true;
    },
    reintentar() {
      this.cargar();
    },
    irAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
  },
};
</script>

<style scoped>
.dashboard-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.dashboard-proyecto__panel {
  padding: 1.35rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.dashboard-proyecto__titulo {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.dashboard-proyecto__parrafo {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-text);
}

.dashboard-proyecto__vacio {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.dashboard-proyecto__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-proyecto__hero-cuerpo {
  flex: 1;
  min-width: 260px;
}

.dashboard-proyecto__hero-titular {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dashboard-proyecto__nombre {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__hero-descripcion {
  margin: 0.6rem 0 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-text);
}

.dashboard-proyecto__hero-rol {
  margin: 0.7rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__hero-acciones {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.dashboard-proyecto__grilla {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.1rem;
}

.dashboard-proyecto__dato {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dashboard-proyecto__dato-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__dato-valor {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__dato-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__chip-postulaciones {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 500;
}

.dashboard-proyecto__objetivos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.dashboard-proyecto__objetivo {
  padding: 0.85rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.dashboard-proyecto__objetivo-nombre {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}

.dashboard-proyecto__objetivo-desc {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.dashboard-proyecto__requerimientos {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dashboard-proyecto__contador {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.dashboard-proyecto__proximamente {
  border-style: dashed;
}

.dashboard-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.dashboard-proyecto__estado-icono {
  font-size: 2.5rem;
}

.dashboard-proyecto__estado-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.dashboard-proyecto__estado-texto {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
}

.dashboard-proyecto__reintento {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

@media (max-width: 900px) {
  .dashboard-proyecto__grilla,
  .dashboard-proyecto__objetivos {
    grid-template-columns: 1fr;
  }
}
</style>
