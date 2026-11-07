<template>
  <section class="contratos-proyecto">
    <header class="contratos-proyecto__cabecera">
      <div>
        <h2 class="contratos-proyecto__titulo">Contratos</h2>
        <p class="contratos-proyecto__subtitulo">
          Contratos del proyecto y accesos para generar uno nuevo con los
          miembros activos.
        </p>
      </div>

      <VaButton
        v-if="puedeGenerar"
        preset="primary"
        size="small"
        @click="$emit('nuevo-contrato')"
      >
        Nuevo contrato
      </VaButton>
    </header>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="contratos-proyecto__reintento">
      <VaButton preset="primary" size="small" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <p
      v-if="cargando && !opciones"
      class="contratos-proyecto__estado"
    >
      Cargando contratos...
    </p>

    <template v-else-if="!error">
      <p v-if="!proyectoApto" class="contratos-proyecto__aviso">
        El proyecto debe estar Publicado o Confirmado para generar contratos.
      </p>

      <section v-if="contratos.length" class="contratos-proyecto__bloque">
        <h3 class="contratos-proyecto__subtitulo-bloque">
          Contratos activos
          <span class="contratos-proyecto__contador">
            · {{ contratos.length }}
          </span>
        </h3>

        <ul class="contratos-proyecto__lista" aria-label="Contratos activos del proyecto">
          <li
            v-for="contrato in contratos"
            :key="`${contrato.idContrato}-${contrato.idMiembro}-${contrato.idTipoAcuerdo}`"
            class="contrato-card"
          >
            <span class="contrato-card__icono" aria-hidden="true">
              <span class="material-symbols-outlined">description</span>
            </span>

            <span class="contrato-card__datos">
              <span class="contrato-card__nombre">{{ contrato.nombre }}</span>
              <span class="contrato-card__meta">
                {{ contrato.miembro }} · {{ contrato.tipo }}
              </span>
            </span>

            <span class="contrato-card__chip">Activo</span>
          </li>
        </ul>
      </section>

      <p v-else class="contratos-proyecto__vacio">
        Este proyecto todavía no tiene contratos activos.
      </p>

      <p class="contratos-proyecto__nota">
        Se muestran las combinaciones de miembro y tipo de acuerdo con un
        contrato activo. El listado completo de contratos estará disponible en
        una próxima actualización.
      </p>
    </template>
  </section>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import contratoService from "../../services/contratoService.js";
import { refrescarSesion } from "../../services/authState";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  esProyectoAptoParaContrato,
  nombreCortoContrato,
  normalizarOpcionesContrato,
} from "../../utils/contratoConstants.js";

let controladorCarga = null;

/*
 * Pestaña Contratos del proyecto (UC-39).
 *
 * La ficha de UC-39 no expone un endpoint de listado completo: sólo
 * `contratosActivos` dentro de GET /opciones, que trae las combinaciones
 * miembro + tipo con contrato ACTIVO. Se muestra ese resumen parcial y se
 * delega el listado completo a UC-68.
 *
 * La navegación al wizard y las validaciones de permisos se delegan al
 * contenedor; acá sólo se consulta el contexto del proyecto.
 */
export default {
  name: "ContratosProyecto",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    /** Director activo en Publicado/Confirmado: habilita "Nuevo contrato". */
    puedeGenerar: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["nuevo-contrato"],
  data() {
    return {
      opciones: null,
      cargando: false,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  computed: {
    proyecto() {
      return this.opciones?.proyecto || null;
    },
    proyectoApto() {
      return esProyectoAptoParaContrato(this.proyecto);
    },
    tiposPorId() {
      const mapa = {};
      (this.opciones?.tiposAcuerdo || []).forEach((tipo) => {
        if (tipo?.idTipoAcuerdo != null) {
          mapa[String(tipo.idTipoAcuerdo)] = tipo;
        }
      });
      return mapa;
    },
    miembrosPorId() {
      const mapa = {};
      (this.opciones?.miembros || []).forEach((miembro) => {
        if (miembro?.idMiembro != null) {
          mapa[String(miembro.idMiembro)] = miembro;
        }
      });
      return mapa;
    },
    contratos() {
      return (this.opciones?.contratosActivos || []).map((contrato) => {
        const tipo = this.tiposPorId[String(contrato.idTipoAcuerdo)];
        const miembro = this.miembrosPorId[String(contrato.idMiembro)];

        return {
          idContrato: contrato.idContrato,
          idMiembro: contrato.idMiembro,
          idTipoAcuerdo: contrato.idTipoAcuerdo,
          nombre: contrato.nombre || "Contrato",
          tipo:
            tipo?.nombre ||
            (contrato.idTipoAcuerdo != null
              ? `Tipo de acuerdo #${contrato.idTipoAcuerdo}`
              : "Tipo de acuerdo sin identificar"),
          miembro: miembro
            ? nombreCortoContrato(miembro)
            : contrato.idMiembro != null
              ? `Miembro #${contrato.idMiembro}`
              : "Miembro sin identificar",
        };
      });
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
  },
  methods: {
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await contratoService.obtenerOpciones(
          this.idProyecto,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;
        this.opciones = normalizarOpcionesContrato(response?.data);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarErrorCarga(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (status === 403) {
        this.error =
          mensaje ||
          "No tenés permiso para consultar los contratos de este proyecto.";
        return;
      }

      if (status === 404) {
        this.error =
          mensaje ||
          "El proyecto no existe o el perfil activo ya no está disponible.";
        return;
      }

      if (status === 409) {
        this.error =
          mensaje ||
          "El proyecto no está en un estado que permita generar contratos.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar los contratos. Inténtalo nuevamente."
      );
      this.puedeReintentar = true;
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
.contratos-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contratos-proyecto__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.contratos-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.15rem;
  font-weight: 700;
}

.contratos-proyecto__subtitulo {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.contratos-proyecto__reintento {
  display: flex;
  justify-content: flex-start;
}

.contratos-proyecto__estado,
.contratos-proyecto__vacio {
  margin: 0;
  padding: 1.5rem 1.25rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.contratos-proyecto__aviso {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.84rem;
  line-height: 1.45;
}

.contratos-proyecto__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contratos-proyecto__subtitulo-bloque {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.contratos-proyecto__contador {
  color: var(--color-text-muted);
  font-weight: 500;
}

.contratos-proyecto__lista {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.contrato-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.contrato-card__icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.contrato-card__icono .material-symbols-outlined {
  font-size: 1.25rem;
}

.contrato-card__datos {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
  flex: 1;
}

.contrato-card__nombre {
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.contrato-card__meta {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.contrato-card__chip {
  flex: 0 0 auto;
  padding: 0.18rem 0.55rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.72rem;
  font-weight: 700;
}

.contratos-proyecto__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
