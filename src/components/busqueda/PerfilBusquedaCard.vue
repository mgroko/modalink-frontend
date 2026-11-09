<template>
  <article
    class="perfil-busqueda"
    role="button"
    tabindex="0"
    @click="$emit('abrir', perfil)"
    @keydown.enter="$emit('abrir', perfil)"
    @keydown.space.prevent="$emit('abrir', perfil)"
  >
    <div class="perfil-busqueda__foto">
      <img
        v-if="perfil.fotoUrl"
        :src="fotoDe(perfil)"
        :alt="perfil.nombreArtistico"
      />
      <span v-else class="perfil-busqueda__inicial">
        {{ inicialDe(perfil.nombreArtistico) }}
      </span>
    </div>

    <div class="perfil-busqueda__cuerpo">
      <h3 class="perfil-busqueda__nombre">{{ perfil.nombreArtistico }}</h3>

      <VaBadge
        v-if="perfil.profesion"
        :text="perfil.profesion"
        color="secondary"
        outline
        class="perfil-busqueda__profesion"
      />

      <p v-if="perfil.nombreUsuario" class="perfil-busqueda__nombre-real">
        {{ perfil.nombreUsuario }} {{ perfil.apellidoUsuario }}
      </p>

      <p v-if="ubicacionTexto(perfil)" class="perfil-busqueda__ubicacion">
        <span class="material-symbols-outlined">location_on</span>
        {{ ubicacionTexto(perfil) }}
      </p>

      <div
        v-if="habilidadesVisibles(perfil).length"
        class="perfil-busqueda__habilidades"
      >
        <span
          v-for="habilidad in habilidadesVisibles(perfil)"
          :key="habilidad"
          class="perfil-busqueda__habilidad"
        >
          {{ habilidad }}
        </span>
        <span
          v-if="habilidadesExtras(perfil) > 0"
          class="perfil-busqueda__habilidad perfil-busqueda__habilidad--mas"
        >
          +{{ habilidadesExtras(perfil) }}
        </span>
      </div>

      <div
        v-if="caracteristicasVisibles(perfil).length"
        class="perfil-busqueda__caracteristicas"
      >
        <span
          v-for="caracteristica in caracteristicasVisibles(perfil)"
          :key="caracteristica.idCaracteristica"
          class="perfil-busqueda__caracteristica"
          :class="{
            'perfil-busqueda__caracteristica--colorida':
              colorValido(caracteristica),
          }"
          :style="estiloColorCaracteristica(caracteristica)"
        >
          {{ textoCaracteristica(caracteristica) }}
        </span>
        <span
          v-if="caracteristicasExtras(perfil) > 0"
          class="perfil-busqueda__caracteristica perfil-busqueda__caracteristica--mas"
        >
          +{{ caracteristicasExtras(perfil) }}
        </span>
      </div>
    </div>

    <div class="perfil-busqueda__footer">
      <VaButton
        color="primary"
        size="small"
        @click.stop="$emit('abrir', perfil)"
      >
        Ver perfil
      </VaButton>
      <VaButton
        v-if="!permitirConexion"
        preset="secondary"
        size="small"
        disabled
        title="Próximamente"
        aria-label="Conectar: próximamente"
        @click.stop
      >
        Conectar · Próximamente
      </VaButton>
      <VaButton
        v-else-if="estadoNormalizado === ESTADOS_CONEXION.NINGUNA"
        color="#5CA4A9"
        size="small"
        :disabled="conectando"
        :loading="conectando"
        @click.stop="$emit('conectar', perfil)"
      >
        {{ etiquetaConexion }}
      </VaButton>
      <VaButton
        v-else
        preset="secondary"
        size="small"
        disabled
        :title="etiquetaConexion"
      >
        {{ etiquetaConexion }}
      </VaButton>
    </div>
  </article>
</template>

<script>
import { formatUbicacion } from "../../utils/ubicacion.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  ESTADOS_CONEXION,
  etiquetaAccionConexion,
  normalizarEstadoConexion,
} from "../../utils/conexionConstants.js";
import {
  ETIQUETAS_CARAC,
  ETIQUETAS_VALORES,
  UNIDADES_POR_CODIGO,
  normCodigo,
} from "../../utils/perfilConstants.js";

const LIMITE_CARACTERISTICAS_CARD = 3;

/*
 * Tarjeta de perfil de la búsqueda unificada. Extraída de BuscarPerfilView
 * para reutilizarla en la grilla y en la sección "Todo".
 */
export default {
  name: "PerfilBusquedaCard",
  props: {
    perfil: {
      type: Object,
      required: true,
    },
    /**
     * Habilita la acción real de conexión. Por defecto se mantiene el botón
     * deshabilitado de la búsqueda global.
     */
    permitirConexion: {
      type: Boolean,
      default: false,
    },
    estadoConexion: {
      type: String,
      default: ESTADOS_CONEXION.NINGUNA,
    },
    conectando: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["abrir", "conectar"],
  computed: {
    estadoNormalizado() {
      return normalizarEstadoConexion(this.estadoConexion);
    },
    etiquetaConexion() {
      return etiquetaAccionConexion(this.estadoNormalizado);
    },
  },
  methods: {
    inicialDe(valor) {
      return String(valor || "?").charAt(0).toUpperCase();
    },
    ubicacionTexto(perfil) {
      return formatUbicacion(perfil);
    },
    fotoDe(perfil) {
      return resolverFotoUrl(perfil?.fotoUrl);
    },
    habilidadesVisibles(perfil) {
      const lista = Array.isArray(perfil?.habilidades)
        ? perfil.habilidades
        : [];
      return lista.slice(0, 4);
    },
    habilidadesExtras(perfil) {
      const lista = Array.isArray(perfil?.habilidades)
        ? perfil.habilidades
        : [];
      return Math.max(0, lista.length - 4);
    },
    caracteristicasVisibles(perfil) {
      const lista = Array.isArray(perfil?.caracteristicas)
        ? perfil.caracteristicas
        : [];
      return lista.slice(0, LIMITE_CARACTERISTICAS_CARD);
    },
    caracteristicasExtras(perfil) {
      const lista = Array.isArray(perfil?.caracteristicas)
        ? perfil.caracteristicas
        : [];
      return Math.max(0, lista.length - LIMITE_CARACTERISTICAS_CARD);
    },
    etiquetaCarac(codigo) {
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARAC[n]) return ETIQUETAS_CARAC[n];
      return this.capitalizar(codigo) || "—";
    },
    valorCarac(caracteristica) {
      const raw = caracteristica?.codigoValor || caracteristica?.valor;
      if (raw == null || raw === "") return "—";
      const n = normCodigo(raw);
      if (ETIQUETAS_VALORES[n]) return ETIQUETAS_VALORES[n];
      return this.capitalizar(raw) || raw;
    },
    unidadCarac(caracteristica) {
      const unidad =
        UNIDADES_POR_CODIGO[normCodigo(caracteristica?.codigo)];
      return unidad ? ` ${unidad}` : "";
    },
    capitalizar(texto) {
      const palabras = String(texto || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ");
    },
    textoCaracteristica(caracteristica) {
      if (!caracteristica) return "";
      if (caracteristica.codigoValor) return this.valorCarac(caracteristica);
      const etiqueta = this.etiquetaCarac(caracteristica.codigo);
      const valor = caracteristica.valor;
      if (valor == null || valor === "") return etiqueta;
      return `${etiqueta} ${this.valorCarac(caracteristica)}${this.unidadCarac(
        caracteristica
      )}`;
    },
    colorValido(caracteristica) {
      const color = caracteristica?.codigoValor
        ? caracteristica?.colorHex
        : null;
      return typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color);
    },
    estiloColorCaracteristica(caracteristica) {
      if (!this.colorValido(caracteristica)) return {};
      const color = caracteristica.colorHex;
      return { backgroundColor: color, color: this.textoContraste(color) };
    },
    textoContraste(colorHex) {
      const hex = colorHex.replace("#", "");
      const canal = (valor) => {
        const v = parseInt(valor, 16) / 255;
        return v <= 0.03928
          ? v / 12.92
          : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const luminancia =
        0.2126 * canal(hex.slice(0, 2)) +
        0.7152 * canal(hex.slice(2, 4)) +
        0.0722 * canal(hex.slice(4, 6));
      return luminancia > 0.45 ? "#1f2937" : "#ffffff";
    },
  },
};
</script>

<style scoped>
.perfil-busqueda {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
  padding: 1.5rem 1.25rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    transform 0.15s,
    border-color 0.15s;
}

.perfil-busqueda:hover {
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.perfil-busqueda:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.perfil-busqueda__foto {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perfil-busqueda__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-busqueda__inicial {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.perfil-busqueda__cuerpo {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.perfil-busqueda__nombre {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.perfil-busqueda__profesion {
  font-size: 0.75rem;
}

.perfil-busqueda__nombre-real {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-busqueda__ubicacion {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-busqueda__ubicacion .material-symbols-outlined {
  font-size: 1rem;
}

.perfil-busqueda__habilidades,
.perfil-busqueda__caracteristicas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}

.perfil-busqueda__habilidad,
.perfil-busqueda__caracteristica {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.perfil-busqueda__habilidad--mas,
.perfil-busqueda__caracteristica--mas {
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.perfil-busqueda__caracteristica--colorida {
  border-color: transparent;
  font-weight: 600;
}

.perfil-busqueda__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
}
</style>
