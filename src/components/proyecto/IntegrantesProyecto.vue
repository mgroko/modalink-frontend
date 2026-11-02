<template>
  <section class="miembros-proyecto">
    <header class="miembros-proyecto__cabecera">
      <h2 class="miembros-proyecto__titulo">
        Miembros
        <span v-if="!cargando && !error" class="miembros-proyecto__contador">
          · {{ miembros.length }}
        </span>
      </h2>

      <span
        v-if="puedeInvitar"
        class="miembros-proyecto__tooltip"
        title="Próximamente: la invitación de miembros estará disponible en una próxima versión."
      >
        <VaButton preset="primary" size="small" disabled>
          Invitar miembro
        </VaButton>
      </span>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="miembros-proyecto__reintento">
      <VaButton preset="primary" size="small" @click="refrescar">
        Reintentar
      </VaButton>
    </div>

    <p v-if="cargando && !miembros.length" class="miembros-proyecto__nota">
      Cargando miembros...
    </p>

    <p
      v-else-if="!error && !miembros.length"
      class="miembros-proyecto__vacio"
    >
      Este proyecto todavía no tiene miembros activos.
    </p>

    <ul
      v-else-if="!error"
      class="miembros-proyecto__lista"
      aria-label="Miembros activos del proyecto"
    >
      <li
        v-for="miembro in miembros"
        :key="claveMiembro(miembro)"
        class="miembro-fila"
      >
        <span
          class="miembro-fila__avatar"
          :style="{ background: colorAvatar(miembro) }"
          aria-hidden="true"
        >
          <img
            v-if="fotoMiembro(miembro) && !fotoRota(miembro)"
            :src="fotoMiembro(miembro)"
            alt=""
            class="miembro-fila__avatar-img"
            @error="marcarFotoRota(miembro)"
          />
          <template v-else>{{ inicialesMiembro(miembro) }}</template>
        </span>

        <div class="miembro-fila__datos">
          <p
            class="miembro-fila__nombre"
            :title="nombreCompletoMiembro(miembro) || undefined"
          >
            <span class="miembro-fila__nombre-texto">
              {{ nombreArtisticoMiembro(miembro) }}
            </span>
            <span v-if="esVos(miembro)" class="miembro-fila__vos">Vos</span>
          </p>

          <p class="miembro-fila__rol">{{ textoRolMiembro(miembro) }}</p>
        </div>

        <span
          class="miembro-fila__chip"
          :title="miembro.nombreProfesion || undefined"
        >
          {{ miembro.nombreProfesion || "Sin profesión" }}
        </span>

        <div class="miembro-fila__acciones">
          <VaButton
            v-if="puedeVerPerfilMiembro(miembro)"
            preset="secondary"
            size="small"
            :aria-label="`Ver perfil de ${nombreArtisticoMiembro(miembro)}`"
            @click="verPerfil(miembro)"
          >
            Ver perfil
          </VaButton>

          <VaButton
            v-if="estadoAccion(miembro) === 'habilitada'"
            preset="secondary"
            color="danger"
            size="small"
            :aria-label="`Eliminar a ${nombreArtisticoMiembro(miembro)} del proyecto`"
            @click="$emit('eliminar', miembro)"
          >
            Eliminar
          </VaButton>

          <span
            v-else-if="estadoAccion(miembro) === 'deshabilitada'"
            class="miembro-fila__tooltip"
            :title="textoMotivoNoEliminable(miembro.motivoNoEliminable)"
          >
            <VaButton preset="secondary" color="danger" size="small" disabled>
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
import perfilService from "../../services/perfilService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  colorAvatarMiembro,
  esPerfilActivoDelMiembro,
  estadoAccionIntegrante,
  inicialesMiembro,
  nombreCompletoMiembro,
  puedeVerPerfilMiembro,
  textoMotivoNoEliminable,
  textoRolMiembro,
} from "../../utils/integranteConstants.js";

/*
 * Listado de miembros activos del proyecto (UC-38).
 * La acción de eliminar se decide exclusivamente con `eliminable` y
 * `motivoNoEliminable`; acá no se recalculan permisos ni reglas de negocio.
 * "Invitar miembro" queda deshabilitado hasta que exista UC-31.
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
    /** Permiso `INVITAR_MIEMBRO` del rol en el proyecto. */
    puedeInvitar: {
      type: Boolean,
      default: false,
    },
    /** Habilita el chip "Vos" en la fila del perfil activo. */
    idPerfilActivo: {
      type: [Number, String],
      default: null,
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
      fotosPorPerfil: {},
      fotosIntentadas: {},
      fotosRotas: {},
    };
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
    colorAvatarMiembro,
    inicialesMiembro,
    nombreCompletoMiembro,
    puedeVerPerfilMiembro,
    textoMotivoNoEliminable,
    textoRolMiembro,
    estadoAccion(miembro) {
      return estadoAccionIntegrante(miembro);
    },
    esVos(miembro) {
      return esPerfilActivoDelMiembro(miembro, this.idPerfilActivo);
    },
    colorAvatar(miembro) {
      return colorAvatarMiembro(miembro?.idPerfil);
    },
    fotoMiembro(miembro) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null || this.fotosRotas[idPerfil]) return null;

      const fotoDirecta =
        miembro?.fotoUrl || miembro?.urlFoto || miembro?.fotoPerfil;
      return resolverFotoUrl(fotoDirecta || this.fotosPorPerfil[idPerfil]);
    },
    fotoRota(miembro) {
      return !!this.fotosRotas[miembro?.idPerfil];
    },
    marcarFotoRota(miembro) {
      if (miembro?.idPerfil == null) return;
      this.fotosRotas = {
        ...this.fotosRotas,
        [miembro.idPerfil]: true,
      };
    },
    async cargarFotos(lista, corrida) {
      const miembrosPorPerfil = new Map();
      (lista || []).forEach((miembro) => {
        if (miembro?.idPerfil != null && !miembrosPorPerfil.has(miembro.idPerfil)) {
          miembrosPorPerfil.set(miembro.idPerfil, miembro);
        }
      });

      const pendientes = [...miembrosPorPerfil.entries()].filter(
        ([idPerfil, miembro]) =>
          !this.fotosIntentadas[idPerfil] &&
          !miembro?.fotoUrl &&
          !miembro?.urlFoto &&
          !miembro?.fotoPerfil
      );
      if (!pendientes.length) return;

      pendientes.forEach(([idPerfil]) => {
        this.fotosIntentadas = {
          ...this.fotosIntentadas,
          [idPerfil]: true,
        };
      });

      await Promise.allSettled(
        pendientes.map(async ([idPerfil]) => {
          try {
            const response = await perfilService.obtener(idPerfil);
            if (corrida !== this.idCarga) return;
            const foto =
              response?.data?.fotoUrl ||
              response?.data?.urlFoto ||
              response?.data?.fotoPerfil ||
              null;
            this.fotosPorPerfil = {
              ...this.fotosPorPerfil,
              [idPerfil]: foto,
            };
          } catch {
            if (corrida !== this.idCarga) return;
            this.fotosPorPerfil = {
              ...this.fotosPorPerfil,
              [idPerfil]: null,
            };
          }
        })
      );
    },
    nombreArtisticoMiembro(miembro) {
      return miembro?.nombreArtistico || "Perfil";
    },
    claveMiembro(miembro) {
      return `${miembro.idMiembro ?? "miembro"}-${miembro.idPerfil ?? "perfil"}`;
    },
    verPerfil(miembro) {
      if (!puedeVerPerfilMiembro(miembro)) return;
      this.$router.push({
        name: "ver-perfil",
        params: { id: miembro.idPerfil },
      });
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
        void this.cargarFotos(this.miembros, corrida);
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
          "No tenés permiso para ver los miembros de este proyecto.";
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
          "Ocurrió un error al cargar los miembros. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar los miembros del proyecto."
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
.miembros-proyecto {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.15rem 1.5rem 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.miembros-proyecto__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
}

.miembros-proyecto__titulo {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 700;
}

.miembros-proyecto__contador {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.miembros-proyecto__tooltip {
  display: inline-flex;
}

.miembros-proyecto__nota,
.miembros-proyecto__vacio {
  margin: 0;
  padding-bottom: 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.miembros-proyecto__reintento {
  display: flex;
  justify-content: flex-start;
  padding-bottom: 0.9rem;
}

.miembros-proyecto__lista {
  display: flex;
  flex-direction: column;
  margin: 0 -1.5rem;
  padding: 0 0 0.35rem;
  list-style: none;
}

.miembro-fila {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1.5rem;
  border-top: 1px solid var(--color-border-soft);
}

.miembro-fila__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 50%;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.miembro-fila__avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.miembro-fila__datos {
  flex: 1 1 auto;
  min-width: 0;
}

.miembro-fila__nombre {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  color: var(--color-text);
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.3;
}

.miembro-fila__nombre-texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.miembro-fila__vos {
  flex: 0 0 auto;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.5;
}

.miembro-fila__rol {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
}

.miembro-fila__chip {
  flex: 0 0 auto;
  max-width: 16rem;
  overflow: hidden;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.miembro-fila__acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.miembro-fila__tooltip {
  display: inline-flex;
}

@media (max-width: 720px) {
  .miembro-fila {
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }

  .miembro-fila__datos {
    flex: 1 1 10rem;
  }

  .miembro-fila__chip {
    order: 3;
    max-width: 100%;
  }

  .miembro-fila__acciones {
    order: 4;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
