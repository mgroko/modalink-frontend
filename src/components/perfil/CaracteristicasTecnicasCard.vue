<template>
  <section
    v-if="tieneCaracteristicas"
    class="caracteristicas-card inicio-perfil__panel"
  >
    <h2 class="inicio-perfil__panel-titulo">Características</h2>

    <div v-if="altura" class="caracteristicas-card__altura">
      <span class="caracteristicas-card__label">Altura</span>
      <strong>{{ valorCarac(altura) }}</strong>
    </div>

    <div v-if="medidas.length" class="caracteristicas-card__medidas">
      <div
        v-for="medida in medidas"
        :key="medida.idCaracteristica || medida.codigo"
      >
        <span class="caracteristicas-card__label">
          {{ etiquetaCarac(medida.codigo) }}
        </span>
        <strong>{{ valorCarac(medida) }}</strong>
      </div>
    </div>

    <dl class="caracteristicas-card__lista">
      <div v-if="piel">
        <dt>Piel</dt>
        <dd>
          <span
            v-if="piel.colorHex"
            class="caracteristicas-card__swatch"
            :style="{ background: piel.colorHex }"
            aria-hidden="true"
          ></span>
          {{ valorCarac(piel) }}
        </dd>
      </div>

      <div v-if="ojos">
        <dt>Ojos</dt>
        <dd>
          <span
            v-if="ojos.colorHex"
            class="caracteristicas-card__swatch"
            :style="{ background: ojos.colorHex }"
            aria-hidden="true"
          ></span>
          {{ valorCarac(ojos) }}
        </dd>
      </div>

      <div v-if="cabello">
        <dt>Cabello</dt>
        <dd>
          <span
            v-if="cabello.colorHex"
            class="caracteristicas-card__swatch"
            :style="{ background: cabello.colorHex }"
            aria-hidden="true"
          ></span>
          {{ valorCarac(cabello) }}
        </dd>
      </div>

      <div v-if="tipoCabello">
        <dt>Tipo de cabello</dt>
        <dd>{{ valorCarac(tipoCabello) }}</dd>
      </div>

      <div
        v-for="carac in otras"
        :key="carac.idCaracteristica || carac.codigo"
      >
        <dt>{{ etiquetaCarac(carac.codigo) }}</dt>
        <dd>{{ valorCarac(carac) }}</dd>
      </div>
    </dl>
  </section>
</template>

<script>
import {
  CODIGOS_ALTURA,
  CODIGOS_CABELLO_TIPO,
  CODIGOS_MEDIDAS,
  CODIGOS_PIEL_OJOS,
  ETIQUETAS_CARAC,
  ETIQUETAS_VALORES,
  TODOS_CODIGOS,
  UNIDADES_POR_CODIGO,
  inLista,
  normCodigo,
} from "../../utils/perfilConstants.js";

const ETIQUETAS_SIMPLE = {
  color_piel: "Piel",
  piel: "Piel",
  color_ojos: "Ojos",
  ojos: "Ojos",
  color_cabello: "Cabello",
  cabello: "Cabello",
  pelo: "Cabello",
};

export default {
  name: "CaracteristicasTecnicasCard",
  props: {
    caracteristicas: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    tieneCaracteristicas() {
      return this.caracteristicas.length > 0;
    },
    altura() {
      return this.buscar(CODIGOS_ALTURA);
    },
    medidas() {
      const usados = new Set();
      return this.caracteristicas
        .filter((carac) => inLista(carac?.codigo, CODIGOS_MEDIDAS))
        .filter((carac) => {
          const clave = normCodigo(carac?.codigo);
          const grupo =
            clave.includes("pecho") || clave === "busto"
              ? "pecho"
              : clave.includes("cintura")
                ? "cintura"
                : clave.includes("cadera")
                  ? "cadera"
                  : clave;
          if (usados.has(grupo)) return false;
          usados.add(grupo);
          return true;
        })
        .sort(
          (a, b) =>
            CODIGOS_MEDIDAS.indexOf(normCodigo(a.codigo)) -
            CODIGOS_MEDIDAS.indexOf(normCodigo(b.codigo))
        );
    },
    piel() {
      return this.buscar(["color_piel", "piel"]);
    },
    ojos() {
      return this.buscar(["color_ojos", "ojos"]);
    },
    cabello() {
      return this.buscar(["color_cabello", "cabello", "pelo"]);
    },
    tipoCabello() {
      return this.buscar([
        "tipo_cabello",
        "tipo_de_cabello",
        "tipo_cabello_2",
      ]);
    },
    otras() {
      return this.caracteristicas.filter(
        (carac) => !inLista(carac?.codigo, TODOS_CODIGOS)
      );
    },
  },
  methods: {
    buscar(codigos) {
      return (
        this.caracteristicas.find((carac) =>
          inLista(carac?.codigo, codigos)
        ) || null
      );
    },
    etiquetaCarac(codigo) {
      const clave = normCodigo(codigo);
      return (
        ETIQUETAS_SIMPLE[clave] ||
        ETIQUETAS_CARAC[clave] ||
        this.capitalizar(codigo)
      );
    },
    valorCarac(carac) {
      const crudo = carac?.codigoValor || carac?.valor || "—";
      const clave = String(crudo)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const valor = ETIQUETAS_VALORES[clave] || crudo;
      const unidad = UNIDADES_POR_CODIGO[normCodigo(carac?.codigo)];
      return unidad ? `${valor} ${unidad}` : String(valor);
    },
    capitalizar(texto) {
      return String(texto || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" ");
    },
  },
};
</script>

<style scoped>
.caracteristicas-card {
  display: grid;
  gap: 0.85rem;
}

.caracteristicas-card .inicio-perfil__panel-titulo {
  margin: 0;
}

.caracteristicas-card__altura {
  display: grid;
  gap: 0.15rem;
}

.caracteristicas-card__label {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.caracteristicas-card__altura strong {
  color: var(--color-text);
  font-size: 1.08rem;
  line-height: 1.2;
}

.caracteristicas-card__medidas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.caracteristicas-card__medidas > div {
  display: grid;
  gap: 0.15rem;
}

.caracteristicas-card__medidas strong {
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.2;
}

.caracteristicas-card__lista {
  display: grid;
  gap: 0;
  margin: 0;
  padding-top: 0.2rem;
  border-top: 1px solid var(--color-border-soft);
}

.caracteristicas-card__lista > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.62rem 0;
  border-bottom: 1px solid var(--color-border-soft);
}

.caracteristicas-card__lista > div:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.caracteristicas-card__lista dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.caracteristicas-card__lista dd {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: right;
}

.caracteristicas-card__swatch {
  width: 0.85rem;
  height: 0.85rem;
  flex: 0 0 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
}
</style>
