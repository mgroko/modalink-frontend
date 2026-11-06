<template>
  <div class="buscador-requerimiento">
    <VaInput
      v-model="busqueda"
      class="buscador-requerimiento__input"
      placeholder="Buscar requerimiento por nombre..."
      clearable
      :disabled="deshabilitado"
    >
      <template #prependInner>
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
      </template>
    </VaInput>

    <BaseAlert v-if="error" :message="error" type="error" />

    <div v-if="error && puedeReintentar" class="buscador-requerimiento__reintento">
      <VaButton preset="secondary" size="small" @click="cargar">
        Reintentar
      </VaButton>
    </div>

    <p v-if="cargando" class="buscador-requerimiento__nota">
      Cargando requerimientos...
    </p>

    <p
      v-else-if="!error && !requerimientosDisponibles.length"
      class="buscador-requerimiento__vacio"
    >
      <span class="material-symbols-outlined" aria-hidden="true">work_off</span>
      No hay requerimientos de actividad disponibles para invitar.
    </p>

    <p
      v-else-if="!error && !filtrados.length"
      class="buscador-requerimiento__vacio"
    >
      <span class="material-symbols-outlined" aria-hidden="true">search_off</span>
      No hay requerimientos que coincidan con la búsqueda.
    </p>

    <ul v-else-if="!error" class="buscador-requerimiento__lista">
      <li v-for="requerimiento in filtrados" :key="requerimiento.idRequerimiento">
        <button
          type="button"
          class="buscador-requerimiento__item"
          :class="{
            'buscador-requerimiento__item--seleccionado':
              estaSeleccionado(requerimiento),
          }"
          :disabled="deshabilitado"
          :aria-pressed="estaSeleccionado(requerimiento) ? 'true' : 'false'"
          @click="seleccionar(requerimiento)"
        >
          <span class="buscador-requerimiento__radio" aria-hidden="true">
            <span
              v-if="estaSeleccionado(requerimiento)"
              class="buscador-requerimiento__radio-punto"
            ></span>
          </span>

          <span class="buscador-requerimiento__cuerpo">
            <span class="buscador-requerimiento__titulo">
              {{ requerimiento.nombreActividad || "Actividad sin nombre" }}
            </span>

            <span class="buscador-requerimiento__meta">
              {{ requerimiento.nombreProfesion || "Sin profesión" }}
              <template v-if="requerimiento.cantidad != null">
                · {{ requerimiento.cantidad }}
                {{ requerimiento.cantidad === 1 ? "persona" : "personas" }}
              </template>
            </span>

            <span
              v-if="requerimiento.descripcion"
              class="buscador-requerimiento__descripcion"
            >
              {{ requerimiento.descripcion }}
            </span>

            <span
              v-if="chipsDe(requerimiento).length"
              class="buscador-requerimiento__chips"
            >
              <span
                v-for="chip in chipsDe(requerimiento)"
                :key="chip"
                class="buscador-requerimiento__chip"
              >
                {{ chip }}
              </span>
            </span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import proyectoService from "../../services/proyectoService.js";
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  ETIQUETAS_CARACTERISTICAS,
  UNIDADES_POR_CODIGO,
  normCodigo,
  simboloUnidad,
} from "../../utils/perfilConstants.js";
import {
  esEnumerado,
  esNumerico,
} from "../../utils/proyectoConstants.js";
import {
  normalizarRequerimientoActividad,
  requerimientoAdmiteInvitacion,
} from "../../utils/invitacionConstants.js";

let controlador = null;

/*
 * Buscador de requerimientos de actividad para UC-31. El endpoint devuelve
 * todos los requerimientos del proyecto: el filtro por texto y el descarte de
 * actividades canceladas/finalizadas se resuelve acá.
 */
export default {
  name: "BuscadorRequerimientoActividad",
  components: { BaseAlert },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    modelValue: {
      type: [Number, String],
      default: null,
    },
    tokenRefresco: {
      type: Number,
      default: 0,
    },
    deshabilitado: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "seleccionado"],
  data() {
    return {
      busqueda: "",
      requerimientos: [],
      cargando: true,
      error: "",
      puedeReintentar: false,
      idCarga: 0,
      habilidadesCatalogo: [],
      catalogosPorProfesion: {},
    };
  },
  computed: {
    requerimientosDisponibles() {
      return this.requerimientos.filter(requerimientoAdmiteInvitacion);
    },
    filtrados() {
      const texto = this.normalizarTexto(this.busqueda);
      if (!texto) return this.requerimientosDisponibles;

      return this.requerimientosDisponibles.filter((requerimiento) => {
        const contenido = [
          requerimiento.nombreActividad,
          requerimiento.nombreProfesion,
          requerimiento.descripcion,
        ]
          .filter(Boolean)
          .join(" ");
        return this.normalizarTexto(contenido).includes(texto);
      });
    },
  },
  watch: {
    idProyecto() {
      this.$emit("update:modelValue", null);
      this.$emit("seleccionado", null);
      this.cargar();
    },
    tokenRefresco() {
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    normalizarTexto(valor) {
      return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    },
    estaSeleccionado(requerimiento) {
      return (
        this.modelValue != null &&
        String(this.modelValue) === String(requerimiento.idRequerimiento)
      );
    },
    seleccionar(requerimiento) {
      if (this.deshabilitado) return;
      this.$emit("update:modelValue", requerimiento.idRequerimiento);
      this.$emit("seleccionado", requerimiento);
    },
    capitalizar(valor) {
      return String(valor || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" ");
    },
    textoCaracteristica(caracteristica, idProfesion) {
      if (caracteristica == null) return "";
      if (typeof caracteristica === "string") return caracteristica;

      const codigo = caracteristica.codigo || caracteristica.nombre;
      const etiqueta =
        ETIQUETAS_CARACTERISTICAS[normCodigo(codigo)] ||
        caracteristica.nombre ||
        this.capitalizar(codigo);

      if (esNumerico(caracteristica.tipoDato)) {
        const sufijo = simboloUnidad(
          UNIDADES_POR_CODIGO[normCodigo(codigo)]
        );
        const rango = this.textoRango(caracteristica);
        if (!rango) return etiqueta;
        return `${etiqueta}: ${rango}${sufijo ? ` ${sufijo}` : ""}`;
      }

      if (esEnumerado(caracteristica.tipoDato)) {
        const valores = this.textoValoresEnumerados(
          caracteristica,
          idProfesion
        );
        if (!valores) return etiqueta;
        return `${etiqueta}: ${valores}`;
      }

      const valor =
        caracteristica.codigoValor ||
        caracteristica.valor ||
        caracteristica.nombreValor ||
        "";

      if (!etiqueta && !valor) return "";
      if (!valor) return etiqueta;
      return `${etiqueta}: ${valor}`;
    },
    textoRango(caracteristica) {
      const min = caracteristica?.valorMin;
      const max = caracteristica?.valorMax;
      if (min != null && max != null) return `${min}–${max}`;
      if (min != null) return `${min} o más`;
      if (max != null) return `hasta ${max}`;
      return "";
    },
    textoValoresEnumerados(caracteristica, idProfesion) {
      const valores = Array.isArray(caracteristica?.valores)
        ? caracteristica.valores
        : [];
      if (!valores.length) {
        return caracteristica.codigoValor || caracteristica.valor || "";
      }

      const catalogo = (this.catalogosPorProfesion[idProfesion] || []).find(
        (item) =>
          String(item.idCaracteristica) ===
          String(caracteristica.idCaracteristica)
      );
      if (!catalogo) {
        return caracteristica.codigoValor || caracteristica.valor || "";
      }

      return valores
        .map((idValor) => {
          const valor = (catalogo?.valores || []).find(
            (item) => String(item.idValor) === String(idValor)
          );
          return (
            valor?.nombre ||
            this.capitalizar(valor?.codigo) ||
            String(idValor)
          );
        })
        .filter(Boolean)
        .join(", ");
    },
    textoHabilidad(habilidad) {
      if (habilidad == null) return "";
      if (typeof habilidad === "string") return habilidad;

      const id = habilidad.idHabilidad ?? habilidad;
      if (typeof id === "number" || /^\d+$/.test(String(id))) {
        const encontrada = this.habilidadesCatalogo.find(
          (item) => String(item.idHabilidad) === String(id)
        );
        return String(encontrada?.nombre || "").trim();
      }

      return String(habilidad.nombre || habilidad.codigo || "").trim();
    },
    chipsDe(requerimiento) {
      const caracteristicas = (requerimiento.caracteristicas || [])
        .map((item) =>
          this.textoCaracteristica(item, requerimiento.idProfesion)
        )
        .filter(Boolean);
      const habilidades = (requerimiento.habilidades || [])
        .map((item) => this.textoHabilidad(item))
        .filter(Boolean);
      return [...caracteristicas, ...habilidades].slice(0, 5);
    },
    async cargarCatalogos() {
      const idsProfesion = [
        ...new Set(
          this.requerimientos
            .map((item) => item.idProfesion)
            .filter((id) => id != null)
        ),
      ];

      const resultados = await Promise.allSettled([
        habilidadService.listar(),
        ...idsProfesion.map((id) =>
          perfilService.caracteristicasPorProfesion(id)
        ),
      ]);

      const habilidades = resultados[0];
      const datosHabilidades =
        habilidades.status === "fulfilled" ? habilidades.value?.data : null;
      this.habilidadesCatalogo = Array.isArray(datosHabilidades)
        ? datosHabilidades
        : datosHabilidades?.habilidades || [];

      const catalogos = {};
      idsProfesion.forEach((id, indice) => {
        const resultado = resultados[indice + 1];
        if (resultado?.status !== "fulfilled") {
          catalogos[id] = [];
          return;
        }
        const datos = resultado.value?.data;
        catalogos[id] = Array.isArray(datos)
          ? datos
          : datos?.caracteristicas || [];
      });
      this.catalogosPorProfesion = catalogos;
    },
    abortar() {
      if (controlador) {
        controlador.abort();
        controlador = null;
      }
    },
    async cargar() {
      if (this.idProyecto == null || this.idProyecto === "") return;

      const corrida = ++this.idCarga;
      this.abortar();
      controlador = new AbortController();

      this.cargando = true;
      this.error = "";
      this.puedeReintentar = false;

      try {
        const response = await proyectoService.buscarRequerimientosActividad(
          this.idProyecto,
          { todos: true },
          controlador.signal
        );
        if (corrida !== this.idCarga) return;

        const datos = response?.data?.contenido;
        this.requerimientos = (Array.isArray(datos) ? datos : []).map(
          normalizarRequerimientoActividad
        );
        await this.cargarCatalogos();

        if (
          this.modelValue != null &&
          !this.requerimientosDisponibles.some(
            (item) => String(item.idRequerimiento) === String(this.modelValue)
          )
        ) {
          this.$emit("update:modelValue", null);
          this.$emit("seleccionado", null);
        }
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarError(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      this.requerimientos = [];
      this.error = "";
      this.puedeReintentar = false;

      if (status === 401) {
        this.error = mensajeErrorApi(
          error,
          "Tu cuenta no se encuentra activa."
        );
        return;
      }

      if (status === 403) {
        this.error =
          mensaje ||
          "No tenés permiso para consultar los requerimientos del proyecto.";
        return;
      }

      if (status === 404) {
        this.error =
          mensaje || "El proyecto ya no está disponible o no tenés acceso.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.error =
          "Ocurrió un error al cargar los requerimientos. Inténtalo nuevamente.";
        return;
      }

      this.error = mensajeErrorApi(
        error,
        "No se pudieron cargar los requerimientos."
      );
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
.buscador-requerimiento {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.buscador-requerimiento__input {
  width: 100%;
}

.buscador-requerimiento__lista {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 360px;
  margin: 0;
  padding: 0 0.15rem 0 0;
  overflow-y: auto;
  list-style: none;
}

.buscador-requerimiento__item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.buscador-requerimiento__item:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.buscador-requerimiento__item--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.buscador-requerimiento__item:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.buscador-requerimiento__radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 0.15rem;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
}

.buscador-requerimiento__item--seleccionado .buscador-requerimiento__radio {
  border-color: var(--color-primary);
}

.buscador-requerimiento__radio-punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.buscador-requerimiento__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.buscador-requerimiento__titulo {
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
}

.buscador-requerimiento__meta {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}

.buscador-requerimiento__descripcion {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.buscador-requerimiento__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.2rem;
}

.buscador-requerimiento__chip {
  display: inline-block;
  padding: 0.08rem 0.42rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
}

.buscador-requerimiento__nota,
.buscador-requerimiento__vacio {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 1.1rem 0.9rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.buscador-requerimiento__vacio .material-symbols-outlined {
  font-size: 1.2rem;
}

.buscador-requerimiento__reintento {
  display: flex;
  justify-content: flex-start;
}
</style>
