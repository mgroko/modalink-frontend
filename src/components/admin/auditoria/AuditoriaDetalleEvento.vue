<template>
  <div class="auditoria-detalle" :class="`auditoria-detalle--${modo}`">
    <div class="auditoria-detalle__chip">
      <AuditoriaChipEvento :evento="evento" :catalogo="catalogo" />
      <span v-if="esHistorico" class="auditoria-detalle__marca-historico">Histórico</span>
    </div>

    <section class="auditoria-detalle__datos" aria-label="Datos del evento">
      <h3 class="auditoria-detalle__seccion">Datos del evento</h3>

      <dl class="auditoria-detalle__campos">
        <div v-for="campo in campos" :key="campo.etiqueta" class="auditoria-detalle__campo">
          <dt class="auditoria-detalle__dt">{{ campo.etiqueta }}</dt>
          <dd class="auditoria-detalle__dd">{{ campo.valor }}</dd>
        </div>
      </dl>
    </section>

    <section class="auditoria-detalle__cambios" aria-label="Cambios registrados">
      <h3 class="auditoria-detalle__seccion">
        Cambios registrados <span>({{ cambios.length }})</span>
      </h3>

      <p v-if="!cambios.length" class="auditoria-detalle__sin-cambios">
        Sin cambios registrados.
      </p>

      <!-- Desktop: tabla Campo / Valor anterior / Valor nuevo -->
      <table v-else-if="modo === 'desktop'" class="auditoria-detalle__tabla">
        <thead>
          <tr>
            <th scope="col">Campo</th>
            <th scope="col">Valor anterior</th>
            <th scope="col">Valor nuevo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cambio in cambios" :key="cambio.campo">
            <td class="auditoria-detalle__campo-codigo">{{ cambio.campo }}</td>
            <td>
              <span class="auditoria-detalle__valor auditoria-detalle__valor--anterior" :title="cambio.anteriorCompleto">
                {{ cambio.anterior }}
              </span>
              <button
                v-if="esLargo(cambio.anteriorCompleto)"
                type="button"
                class="auditoria-detalle__copiar"
                @click="copiarValor(cambio.campo, cambio.anteriorCompleto)"
              >
                {{ copiado === `anterior-${cambio.campo}` ? "Copiado" : "Copiar" }}
              </button>
            </td>
            <td>
              <span class="auditoria-detalle__valor auditoria-detalle__valor--nuevo" :title="cambio.nuevoCompleto">
                {{ cambio.nuevo }}
              </span>
              <button
                v-if="esLargo(cambio.nuevoCompleto)"
                type="button"
                class="auditoria-detalle__copiar"
                @click="copiarValor(cambio.campo, cambio.nuevoCompleto)"
              >
                {{ copiado === `nuevo-${cambio.campo}` ? "Copiado" : "Copiar" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Móvil: tarjetas apiladas Campo / Anterior / Nuevo -->
      <template v-else>
        <article
          v-for="cambio in cambios"
          :key="`movil-${cambio.campo}`"
          class="auditoria-detalle__cambio-movil"
        >
          <span class="auditoria-detalle__campo-codigo">{{ cambio.campo }}</span>
          <div class="auditoria-detalle__valor-movil">
            <span class="auditoria-detalle__rotulo">Anterior</span>
            <span class="auditoria-detalle__valor auditoria-detalle__valor--anterior">
              {{ cambio.anterior }}
            </span>
          </div>
          <div class="auditoria-detalle__valor-movil">
            <span class="auditoria-detalle__rotulo">Nuevo</span>
            <span class="auditoria-detalle__valor auditoria-detalle__valor--nuevo">
              {{ cambio.nuevo }}
            </span>
          </div>
        </article>
        <VaButton
          v-if="cambios.length"
          block
          preset="secondary"
          class="auditoria-detalle__copiar-todo"
          @click="copiarTextoCompleto"
        >
          {{ copiado === "todo" ? "Copiado" : "Copiar texto completo" }}
        </VaButton>
      </template>

      <p v-if="modo === 'desktop' && cambios.length" class="auditoria-detalle__nota">
        Los valores nulos se muestran como —. Los textos largos se truncan; usá
        Copiar para obtener el texto completo. El backend nunca envía
        contraseñas, tokens ni secretos.
      </p>
    </section>
  </div>
</template>

<script>
import AuditoriaChipEvento from "./AuditoriaChipEvento.vue";
import {
  etiquetaModuloAuditoria,
  esEventoHistorico,
  formatearFechaAuditoria,
  formatearHoraAuditoria,
  moduloDeEventoAuditoria,
  textoIdAfectadoDetalle,
  textoValorAuditoria,
} from "../../../utils/auditoriaConstants";

const LIMITE_CARACTERES_VALOR = 40;

/**
 * Panel expandido de un evento (UC-67 §5.3):
 * - modo "desktop": datos del evento Cambios@ + tabla de cambios (mockup 2 y 3).
 * - modo "movil": tarjeta apilada con "Copiar texto completo" (mockup móvil).
 */
export default {
  name: "AuditoriaDetalleEvento",
  components: { AuditoriaChipEvento },
  props: {
    evento: { type: Object, required: true },
    catalogo: { type: Array, default: () => [] },
    modo: {
      type: String,
      default: "desktop",
      validator: (valor) => ["desktop", "movil"].includes(valor),
    },
  },
  data() {
    return {
      copiado: "",
      temporizador: null,
    };
  },
  computed: {
    esHistorico() {
      return esEventoHistorico(this.evento);
    },
    cambios() {
      return (this.evento?.detalle || []).map((cambio) => {
        const anterior = textoValorAuditoria(cambio?.valorAnterior);
        const nuevo = textoValorAuditoria(cambio?.valorNuevo);
        return {
          campo: cambio?.campo || "—",
          anterior,
          nuevo,
          anteriorCompleto: textoValorAuditoria(cambio?.valorAnterior),
          nuevoCompleto: textoValorAuditoria(cambio?.valorNuevo),
        };
      });
    },
    campos() {
      const evento = this.evento;
      const campos = [
        { etiqueta: "ID de auditoría", valor: evento?.idAuditoria != null ? `#${evento.idAuditoria}` : "—" },
        {
          etiqueta: "Fecha y hora",
          valor: `${formatearFechaAuditoria(evento?.fechaHora)} ${formatearHoraAuditoria(evento?.fechaHora)}`,
        },
        { etiqueta: "Tipo de evento", valor: evento?.tipoEvento || "—" },
        {
          etiqueta: "Módulo",
          valor: etiquetaModuloAuditoria(moduloDeEventoAuditoria(evento, this.catalogo)),
        },
        { etiqueta: "Entidad afectada", valor: evento?.entidadAfectada || "—" },
        {
          etiqueta: "ID afectado",
          valor: textoIdAfectadoDetalle(evento),
        },
        { etiqueta: "Operador", valor: evento?.operador || "—" },
        { etiqueta: "Usuario de BD", valor: evento?.usuarioBd || "—" },
        { etiqueta: "IP de conexión", valor: evento?.ipUsuario || "—" },
      ];
      if (evento?.entidadClave) {
        campos.splice(5, 0, {
          etiqueta: "Clave de entidad",
          valor: evento.entidadClave,
        });
      }
      return campos;
    },
  },
  beforeUnmount() {
    if (this.temporizador) clearTimeout(this.temporizador);
  },
  methods: {
    esLargo(texto) {
      return typeof texto === "string" && texto.length > LIMITE_CARACTERES_VALOR;
    },
    async copiarValor(campo, valor, sufijo = "") {
      const ok = await this.copiarAlPortapapeles(valor);
      if (ok) this.mostrarFeedback(`${sufijo}-${campo}`);
    },
    async copiarTextoCompleto() {
      const texto = this.textoPlanoCambios();
      const ok = await this.copiarAlPortapapeles(texto);
      if (ok) this.mostrarFeedback("todo");
    },
    async copiarAlPortapapeles(texto) {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch {
        return this.copiarFallback(texto);
      }
    },
    copiarFallback(texto) {
      try {
        const area = document.createElement("textarea");
        area.value = texto;
        area.setAttribute("readonly", "");
        area.style.position = "absolute";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        return ok;
      } catch {
        return false;
      }
    },
    textoPlanoCambios() {
      const lineas = this.cambios.map(
        (cambio) =>
          `Campo: ${cambio.campo}\n  Valor anterior: ${cambio.anterior}\n  Valor nuevo: ${cambio.nuevo}`
      );
      return (
        `Evento #${this.evento?.idAuditoria ?? "—"} (${this.evento?.tipoEvento || "sin tipo"})\n` +
        lineas.join("\n")
      );
    },
    mostrarFeedback(clave) {
      this.copiado = clave;
      if (this.temporizador) clearTimeout(this.temporizador);
      this.temporizador = setTimeout(() => {
        this.copiado = "";
      }, 2000);
    },
  },
};
</script>

<style scoped>
.auditoria-detalle {
  display: grid;
  gap: 1rem;
  background: var(--color-surface-soft);
  border-top: 1px solid var(--color-border-soft);
}

.auditoria-detalle__chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auditoria-detalle__marca-historico {
  padding: 0.12rem 0.45rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auditoria-detalle--desktop {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 2rem;
  padding: 1.1rem 1.25rem 1.25rem;
}

.auditoria-detalle--desktop .auditoria-detalle__chip {
  grid-column: 1 / -1;
}

.auditoria-detalle--movil,
.auditoria-detalle--desktop {
  text-align: left;
}

.auditoria-detalle--movil .auditoria-detalle__chip {
  grid-column: 1 / -1;
  justify-content: center;
}

.auditoria-detalle--movil .auditoria-detalle__datos,
.auditoria-detalle--movil .auditoria-detalle__cambios {
  padding: 0.9rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
}

.auditoria-detalle__seccion {
  margin: 0 0 0.65rem;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.auditoria-detalle__seccion span {
  color: var(--color-text-muted);
}

.auditoria-detalle__campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem 1.25rem;
  margin: 0;
}

.auditoria-detalle--movil .auditoria-detalle__campos {
  grid-template-columns: 1fr;
  gap: 0.45rem;
}

.auditoria-detalle__campo {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.auditoria-detalle__dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.auditoria-detalle__dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: 0.82rem;
}

.auditoria-detalle__tabla {
  width: 100%;
  background: var(--color-surface);
  border-collapse: collapse;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.auditoria-detalle__tabla th,
.auditoria-detalle__tabla td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 0.8rem;
  text-align: left;
  vertical-align: top;
}

.auditoria-detalle__tabla thead th {
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 700;
}

.auditoria-detalle__tabla tbody tr:last-child td {
  border-bottom: 0;
}

.auditoria-detalle__campo-codigo {
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

/* Valores: anterior en terracota y nuevo en teal (mockup del detalle). */
.auditoria-detalle__valor {
  display: inline-block;
  max-width: 16rem;
  overflow: hidden;
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 600;
  vertical-align: middle;
}

.auditoria-detalle__valor--anterior {
  color: var(--color-accent-dark);
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.auditoria-detalle__valor--nuevo {
  color: var(--color-support);
  background: color-mix(in srgb, var(--color-support) 18%, transparent);
}

.auditoria-detalle__copiar {
  margin-left: 0.4rem;
  padding: 0.1rem 0.4rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 0.65rem;
  cursor: pointer;
}

.auditoria-detalle__copiar:hover {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.auditoria-detalle__nota {
  margin: 0.65rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.auditoria-detalle__sin-cambios {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

/* Móvil */
.auditoria-detalle--movil {
  gap: 0.8rem;
}

.auditoria-detalle__cambio-movil {
  display: grid;
  gap: 0.4rem;
  padding: 0.8rem 0.9rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 12px;
  margin-bottom: 0.6rem;
}

.auditoria-detalle__valor-movil {
  display: grid;
  gap: 0.2rem;
}

.auditoria-detalle__rotulo {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.auditoria-detalle--movil .auditoria-detalle__valor {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}

.auditoria-detalle__copiar-todo {
  margin-top: 0.25rem;
}
</style>
