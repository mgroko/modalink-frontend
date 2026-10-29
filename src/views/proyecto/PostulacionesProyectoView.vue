<template>
  <div class="postulaciones-proyecto">
    <div v-if="cargandoProyecto" class="postulaciones-proyecto__estado">
      <span class="material-symbols-outlined postulaciones-proyecto__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <template v-else>
      <BaseAlert
        v-if="mensajeError && !estadoNoEncontrado && !sinAcceso"
        :message="mensajeError"
        type="error"
      />

      <div v-if="puedeReintentar" class="postulaciones-proyecto__reintento">
        <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
          Reintentar
        </VaButton>
      </div>

      <section v-if="estadoNoEncontrado" class="postulaciones-proyecto__estado">
        <span class="material-symbols-outlined postulaciones-proyecto__estado-icono">
          folder_open
        </span>
        <p class="postulaciones-proyecto__estado-titulo">Proyecto no encontrado</p>
        <p class="postulaciones-proyecto__estado-texto">
          {{ mensajeError || "No encontramos el proyecto que estás buscando." }}
        </p>
        <VaButton preset="secondary" @click="irAProyectos">
          Volver a Proyectos
        </VaButton>
      </section>

      <section v-else-if="sinAcceso" class="postulaciones-proyecto__estado">
        <span class="material-symbols-outlined postulaciones-proyecto__estado-icono">
          lock
        </span>
        <p class="postulaciones-proyecto__estado-titulo">Sin acceso</p>
        <p class="postulaciones-proyecto__estado-texto">
          {{ mensajeError || "No tenés acceso a este proyecto." }}
        </p>
        <VaButton preset="secondary" @click="irAProyectos">
          Volver a Proyectos
        </VaButton>
      </section>

      <section v-else-if="sinPermiso" class="postulaciones-proyecto__estado">
        <span class="material-symbols-outlined postulaciones-proyecto__estado-icono">
          lock
        </span>
        <p class="postulaciones-proyecto__estado-titulo">
          No podés gestionar postulaciones
        </p>
        <p class="postulaciones-proyecto__estado-texto">
          Esta sección está disponible sólo para el director del proyecto con el
          permiso de gestión de postulaciones.
        </p>
        <VaButton preset="secondary" @click="volverAlProyecto">
          Volver al proyecto
        </VaButton>
      </section>

      <template v-else-if="proyecto">
        <header class="postulaciones-proyecto__cabecera">
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-arrow_back"
            class="postulaciones-proyecto__volver"
            @click="volverAlProyecto"
          >
            Volver al proyecto
          </VaButton>

          <div class="postulaciones-proyecto__titulo-grupo">
            <h1 class="postulaciones-proyecto__titulo">{{ proyecto.nombre }}</h1>
            <EstadoProyectoBadge :estado="proyecto.estado" />
          </div>

          <p class="postulaciones-proyecto__subtitulo">
            Gestioná las postulaciones del proyecto: aceptá o rechazá a los
            perfiles que se postularon.
          </p>
        </header>

        <GestionPostulaciones
          :id-proyecto="idProyecto"
          :nombre-proyecto="proyecto.nombre"
          :sin-fecha-entrega="!proyecto.fechaEntregaEstipulada"
          @gestionada="cargar"
        />
      </template>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService.js";
import { refrescarSesion } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import EstadoProyectoBadge from "../../components/proyecto/EstadoProyectoBadge.vue";
import GestionPostulaciones from "../../components/proyecto/GestionPostulaciones.vue";
import { mensajeErrorApi } from "../../utils/apiError";
import { ROLES_PROYECTO } from "../../utils/proyectoConstants.js";

/*
 * UC-34/UC-74: subpágina de gestión de postulaciones de un proyecto.
 * Valida el acceso con GET /proyectos/{id} antes de montar el listado: el
 * endpoint de postulaciones responde 403 a quien no es director con
 * GESTIONAR_POSTULACIONES.
 */
export default {
  name: "PostulacionesProyectoView",
  components: { BaseAlert, EstadoProyectoBadge, GestionPostulaciones },
  data() {
    return {
      proyecto: null,
      cargandoProyecto: true,
      mensajeError: "",
      puedeReintentar: false,
      estadoNoEncontrado: false,
      sinAcceso: false,
      idCarga: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    puedeGestionar() {
      return (
        this.proyecto?.rolUsuario === ROLES_PROYECTO.DIRECTOR &&
        (this.proyecto?.permisos || []).includes("GESTIONAR_POSTULACIONES")
      );
    },
    sinPermiso() {
      return !!this.proyecto && !this.puedeGestionar;
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
    this.controlador = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (this.controlador) this.controlador.abort();
  },
  methods: {
    async cargar() {
      const corrida = ++this.idCarga;
      if (this.controlador) this.controlador.abort();
      this.controlador = new AbortController();

      this.cargandoProyecto = true;
      this.proyecto = null;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.estadoNoEncontrado = false;
      this.sinAcceso = false;

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        this.proyecto = response?.data || null;
        if (!this.proyecto) {
          this.estadoNoEncontrado = true;
        }
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
        if (corrida === this.idCarga) this.cargandoProyecto = false;
      }
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (error?._esSesionExpirada) {
        this.mensajeError = mensajeErrorApi(error);
        return;
      }

      if (status === 401) {
        this.mensajeError = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 403) {
        if (error?._esCsrf) {
          this.mensajeError = mensajeErrorApi(error);
          return;
        }
        this.sinAcceso = true;
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.estadoNoEncontrado = true;
        this.mensajeError =
          mensaje || "El proyecto ya no existe o no está disponible.";
        return;
      }

      if (status === 409) {
        this.mensajeError = mensajeErrorApi(error);
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al cargar el proyecto. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudo cargar el proyecto."
      );
    },
    reintentar() {
      this.cargar();
    },
    volverAlProyecto() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
      });
    },
    irAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
  },
};
</script>

<style scoped>
.postulaciones-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.postulaciones-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.postulaciones-proyecto__estado-icono {
  font-size: 2rem;
}

.postulaciones-proyecto__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.postulaciones-proyecto__estado-texto {
  margin: 0;
  max-width: 32rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.postulaciones-proyecto__reintento {
  display: flex;
  justify-content: center;
}

.postulaciones-proyecto__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.postulaciones-proyecto__volver {
  align-self: flex-start;
}

.postulaciones-proyecto__titulo-grupo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.postulaciones-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
}

.postulaciones-proyecto__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}
</style>
