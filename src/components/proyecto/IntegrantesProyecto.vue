<template>
  <section class="integrantes-proyecto">
    <header class="integrantes-proyecto__cabecera">
      <div>
        <h2 class="integrantes-proyecto__titulo">Integrantes</h2>
        <p v-if="!cargando" class="integrantes-proyecto__subtitulo">
          {{ resumenCantidad }}
        </p>
      </div>

      <VaButton
        preset="secondary"
        size="small"
        icon="mso-refresh"
        :disabled="cargando"
        @click="refrescar"
      >
        Actualizar
      </VaButton>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="integrantes-proyecto__reintento">
      <VaButton preset="primary" size="small" @click="refrescar">
        Reintentar
      </VaButton>
    </div>

    <p v-if="cargando && !miembros.length" class="integrantes-proyecto__nota">
      Cargando integrantes...
    </p>

    <p
      v-else-if="!error && !miembros.length"
      class="integrantes-proyecto__vacio"
    >
      Este proyecto todavía no tiene integrantes activos.
    </p>

    <ul v-else-if="!error" class="integrantes-proyecto__lista">
      <li
        v-for="miembro in miembros"
        :key="claveMiembro(miembro)"
        class="integrante-card"
      >
        <span class="integrante-card__avatar" aria-hidden="true">
          {{ inicialesMiembro(miembro) }}
        </span>

        <div class="integrante-card__datos">
          <p class="integrante-card__nombre">
            {{ miembro.nombreArtistico || "Perfil" }}
          </p>

          <p class="integrante-card__secundario">
            {{ nombreCompletoMiembro(miembro) || `Usuario #${miembro.idUsuario}` }}
            <template v-if="miembro.nombreProfesion">
              · {{ miembro.nombreProfesion }}
            </template>
          </p>

          <div class="integrante-card__chips">
            <span class="integrante-card__chip">
              {{ etiquetaRolProyecto(miembro.rol) || "Miembro" }}
            </span>
          </div>
        </div>

        <div class="integrante-card__accion">
          <VaButton
            v-if="estadoAccion(miembro) === 'habilitada'"
            color="danger"
            size="small"
            @click="$emit('eliminar', miembro)"
          >
            Eliminar
          </VaButton>

          <span
            v-else-if="estadoAccion(miembro) === 'deshabilitada'"
            class="integrante-card__tooltip"
            :title="textoMotivoNoEliminable(miembro.motivoNoEliminable)"
          >
            <VaButton color="danger" size="small" disabled>
              Eliminar
            </VaButton>
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import proyectoService from "../../services/proyectoService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import { etiquetaRolProyecto } from "../../utils/proyectoConstants.js";
import {
  estadoAccionIntegrante,
  inicialesMiembro,
  nombreCompletoMiembro,
  textoMotivoNoEliminable,
} from "../../utils/integranteConstants.js";

/*
 * Listado de integrantes activos del proyecto (UC-38).
 * La acción de eliminar se decide exclusivamente con `eliminable` y
 * `motivoNoEliminable`; acá no se recalculan permisos ni reglas de negocio.
 */
export default {
  name: "IntegrantesProyecto",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    /** Cambia para forzar una recarga (p. ej. después de un 204). */
    tokenRefresco: {
      type: Number,
      default: 0,
    },
  },
  emits: ["eliminar"],
  data() {
    return {
      miembros: [],
      cargando: false,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  computed: {
    resumenCantidad() {
      const total = this.miembros.length;
      if (total === 1) return "1 integrante activo";
      return `${total} integrantes activos`;
    },
  },
  watch: {
    idProyecto() {
      this.cargar();
    },
    tokenRefresco() {
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
    this.abortar();
  },
  methods: {
    etiquetaRolProyecto,
    inicialesMiembro,
    nombreCompletoMiembro,
    textoMotivoNoEliminable,
    estadoAccion(miembro) {
      return estadoAccionIntegrante(miembro);
    },
    claveMiembro(miembro) {
      return `${miembro.idMiembro ?? "miembro"}-${miembro.idPerfil ?? "perfil"}`;
    },
    refrescar() {
      this.cargar();
    },
    async cargar() {
      if (this.idProyecto == null || this.idProyecto === "") return;

      const corrida = ++this.idCarga;
      this.abortar();
      this.controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.listarMiembros(
          this.idProyecto,
          { todos: true },
          this.controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const data = response?.data;
        const lista = Array.isArray(data) ? data : data?.contenido;
        this.miembros = this.ordenar(Array.isArray(lista) ? lista : []);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    ordenar(lista) {
      return [...lista].sort((a, b) => {
        const rolA = String(a?.rol || "").toUpperCase() === "DIRECTOR" ? 0 : 1;
        const rolB = String(b?.rol || "").toUpperCase() === "DIRECTOR" ? 0 : 1;
        if (rolA !== rolB) return rolA - rolB;
        return String(a?.nombreArtistico || "").localeCompare(
          String(b?.nombreArtistico || ""),
          "es"
        );
      });
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      this.miembros = [];
      this.error = "";
      this.puedeReintentar = false;

      if (error?._esSesionExpirada || status === 401) {
        // El interceptor global limpia la sesión y redirige a login.
        return;
      }

      if (status === 403) {
        this.error =
          mensaje ||
          "No tenés permiso para ver los integrantes de este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.error =
          mensaje || "El proyecto ya no está disponible o no tenés acceso.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar los integrantes. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar los integrantes del proyecto."
      );
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    esCancelacion(error) {
      return (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError"
      );
    },
  },
};
</script>

<style scoped>
.integrantes-proyecto {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.35rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.integrantes-proyecto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.integrantes-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.integrantes-proyecto__subtitulo {
  margin: 0.2rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.integrantes-proyecto__nota,
.integrantes-proyecto__vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.integrantes-proyecto__reintento {
  display: flex;
  justify-content: flex-start;
}

.integrantes-proyecto__lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.integrante-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.integrante-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-info-soft, #eef2ff);
  color: var(--color-primary, #3730a3);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.integrante-card__datos {
  flex: 1 1 auto;
  min-width: 0;
}

.integrante-card__nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.integrante-card__secundario {
  margin: 0.12rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
}

.integrante-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}

.integrante-card__chip {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-chip, var(--color-bg));
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.integrante-card__accion {
  flex: 0 0 auto;
}

.integrante-card__tooltip {
  display: inline-flex;
}
</style>
