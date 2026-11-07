<template>
  <div class="generar-contrato">
    <p class="generar-contrato__migas">
      <router-link :to="{ name: 'proyectos-inicio' }" class="generar-contrato__miga">
        Proyectos
      </router-link>
      <span aria-hidden="true">›</span>
      <router-link :to="rutaVolverProyecto" class="generar-contrato__miga">
        {{ nombreProyecto }}
      </router-link>
      <span aria-hidden="true">›</span>
      <router-link :to="rutaVolverProyecto" class="generar-contrato__miga">
        Contratos
      </router-link>
      <span aria-hidden="true">›</span>
      <span>Nuevo contrato</span>
    </p>

    <div v-if="cargando" class="generar-contrato__estado">
      <span class="material-symbols-outlined generar-contrato__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <section v-else-if="errorCarga || sinAcceso" class="generar-contrato__estado">
      <span class="material-symbols-outlined generar-contrato__estado-icono">
        {{ estadoNoEncontrado ? "folder_open" : "lock" }}
      </span>
      <p class="generar-contrato__estado-titulo">{{ tituloErrorCarga }}</p>
      <p class="generar-contrato__estado-texto">{{ errorCarga }}</p>
      <div class="generar-contrato__estado-acciones">
        <VaButton
          v-if="puedeReintentarCarga"
          preset="secondary"
          @click="cargar"
        >
          Reintentar
        </VaButton>
        <VaButton preset="primary" @click="volverAProyecto">
          {{ estadoNoEncontrado ? "Volver a Proyectos" : "Volver a Contratos" }}
        </VaButton>
      </div>
    </section>

    <template v-else>
      <header class="generar-contrato__cabecera">
        <div class="generar-contrato__cabecera-texto">
          <h1 class="generar-contrato__titulo">{{ tituloPaso }}</h1>
          <p class="generar-contrato__subtitulo">{{ subtituloPaso }}</p>
        </div>

        <ol class="generar-contrato__stepper" aria-label="Pasos del contrato">
          <template v-for="(item, indice) in pasos" :key="item.id">
            <li
              class="generar-contrato__paso"
              :class="{
                'generar-contrato__paso--completado': item.completado,
                'generar-contrato__paso--actual': item.actual,
              }"
            >
              <span class="generar-contrato__paso-circulo">
                <span
                  v-if="item.completado"
                  class="material-symbols-outlined"
                  aria-hidden="true"
                >
                  check
                </span>
                <template v-else>{{ item.id }}</template>
              </span>
              <span class="generar-contrato__paso-etiqueta">
                {{ item.etiqueta }}
              </span>
            </li>

            <li
              v-if="indice < pasos.length - 1"
              class="generar-contrato__linea"
              :class="{
                'generar-contrato__linea--completada': item.id < paso,
              }"
              aria-hidden="true"
            ></li>
          </template>
        </ol>
      </header>

      <BaseAlert
        v-if="errorEmision"
        :message="errorEmision"
        type="error"
        class="generar-contrato__alerta"
      />

      <template v-if="paso === 1">
        <div class="generar-contrato__columnas">
          <section class="generar-contrato__panel">
            <h2 class="generar-contrato__seccion-titulo">Tipo de acuerdo</h2>

            <div class="generar-contrato__opciones">
              <button
                v-for="tipo in tiposAcuerdo"
                :key="tipo.idTipoAcuerdo"
                type="button"
                class="generar-contrato__opcion"
                :class="{
                  'generar-contrato__opcion--seleccionada':
                    idTipoAcuerdo === tipo.idTipoAcuerdo,
                }"
                :aria-pressed="idTipoAcuerdo === tipo.idTipoAcuerdo ? 'true' : 'false'"
                :disabled="emitiendo"
                @click="seleccionarTipo(tipo)"
              >
                <span
                  class="generar-contrato__radio"
                  :class="{
                    'generar-contrato__radio--activo':
                      idTipoAcuerdo === tipo.idTipoAcuerdo,
                  }"
                  aria-hidden="true"
                >
                  <span
                    v-if="idTipoAcuerdo === tipo.idTipoAcuerdo"
                    class="generar-contrato__radio-punto"
                  ></span>
                </span>

                <span class="generar-contrato__opcion-texto">
                  <span class="generar-contrato__opcion-titulo">
                    {{ tipo.nombre }}
                  </span>
                  <span
                    v-if="tipo.descripcion"
                    class="generar-contrato__opcion-descripcion"
                  >
                    {{ tipo.descripcion }}
                  </span>
                </span>
              </button>
            </div>

            <p v-if="!tiposAcuerdo.length" class="generar-contrato__nota">
              No hay tipos de acuerdo activos disponibles.
            </p>
          </section>

          <section class="generar-contrato__panel">
            <h2 class="generar-contrato__seccion-titulo">
              Destinatarios (miembros activos)
            </h2>

            <div class="generar-contrato__miembros">
              <label
                v-for="miembro in miembros"
                :key="miembro.idMiembro"
                class="miembro-opcion"
                :class="{
                  'miembro-opcion--seleccionado': estaSeleccionado(miembro),
                  'miembro-opcion--bloqueado': !!miembroConflicto(miembro),
                }"
              >
                <input
                  type="checkbox"
                  class="miembro-opcion__check"
                  :checked="estaSeleccionado(miembro)"
                  :disabled="!!miembroConflicto(miembro) || emitiendo"
                  @change="onCambioMiembro(miembro, $event)"
                />

                <span class="miembro-opcion__avatar" aria-hidden="true">
                  {{ inicialParteContrato(miembro) }}
                </span>

                <span class="miembro-opcion__datos">
                  <span class="miembro-opcion__nombre">
                    {{ nombreCortoContrato(miembro) }}
                    <span v-if="miembro.esEmisor" class="miembro-opcion__rol">
                      Director
                    </span>
                  </span>
                  <span class="miembro-opcion__meta">
                    {{ miembro.profesion || "Sin profesión" }}
                  </span>
                  <span
                    v-if="miembroConflicto(miembro)"
                    class="miembro-opcion__conflicto"
                    :title="miembroConflicto(miembro).contrato || undefined"
                  >
                    {{ miembroConflicto(miembro).mensaje }}
                  </span>
                </span>
              </label>
            </div>

            <p class="generar-contrato__contador">
              {{ textoCantidadSeleccionados }}
            </p>
          </section>
        </div>

        <div class="generar-contrato__acciones">
          <VaButton
            preset="secondary"
            :disabled="emitiendo"
            @click="volverAProyecto"
          >
            Cancelar
          </VaButton>
          <VaButton
            preset="primary"
            :disabled="!puedeContinuarDatos || emitiendo"
            :loading="cargandoPreview"
            @click="continuarABorrador"
          >
            Continuar al borrador
          </VaButton>
        </div>
      </template>

      <template v-else-if="paso === 2">
        <BaseAlert
          v-if="errorPreview"
          :message="errorPreview"
          type="error"
          class="generar-contrato__alerta"
        />
        <div v-if="errorPreview" class="generar-contrato__acciones-error">
          <VaButton
            preset="secondary"
            size="small"
            :loading="cargandoPreview"
            @click="previsualizar"
          >
            Reintentar borrador
          </VaButton>
        </div>

        <div class="generar-contrato__columnas generar-contrato__columnas--borrador">
          <section class="generar-contrato__panel generar-contrato__panel--documento">
            <div class="generar-contrato__documento-encabezado">
              <h2 class="generar-contrato__seccion-titulo">Borrador del contrato</h2>
              <span
                v-if="cargandoPreview"
                class="generar-contrato__documento-estado"
              >
                {{ preview ? "Actualizando borrador..." : "Generando borrador..." }}
              </span>
            </div>

            <p
              v-if="!preview && cargandoPreview"
              class="generar-contrato__documento-cargando"
            >
              Generando el borrador con las cláusulas del tipo de acuerdo...
            </p>
            <p
              v-else-if="!preview && !errorPreview"
              class="generar-contrato__documento-cargando"
            >
              Todavía no hay un borrador disponible.
            </p>
            <div v-else-if="preview" class="generar-contrato__documento-texto">
              {{ preview.texto }}
            </div>
          </section>

          <aside class="generar-contrato__lateral">
            <section class="generar-contrato__panel generar-contrato__panel--compacto">
              <h3 class="generar-contrato__lateral-titulo">Partes</h3>

              <ul class="generar-contrato__partes">
                <li
                  v-for="parte in partes"
                  :key="`${parte.idMiembro}-${parte.rolParte}`"
                  class="parte-fila"
                >
                  <span class="parte-fila__datos">
                    <span
                      class="parte-fila__nombre"
                      :title="parte.nombreCompleto || parte.nombre"
                    >
                      {{ parte.nombre }}
                    </span>
                    <span class="parte-fila__rol">
                      {{ etiquetaRolParteContrato(parte.rolParte) }}
                    </span>
                  </span>
                  <span class="parte-fila__estado">
                    {{ etiquetaEstadoFirmaContrato(parte.estadoFirma) }}
                  </span>
                </li>
              </ul>
            </section>

            <section class="generar-contrato__panel generar-contrato__panel--compacto">
              <h3 class="generar-contrato__lateral-titulo">
                Cláusulas adicionales (opcional)
              </h3>

              <VaTextarea
                id="clausula-adicional"
                :model-value="textoClausula"
                placeholder="Escribí una cláusula para agregar al contrato..."
                :max-length="LIMITE_CLAUSULA"
                counter
                :rows="4"
                :error="!!errorClausula"
                :error-messages="errorClausula || undefined"
                :disabled="emitiendo"
                @update:model-value="onTextoClausula"
              />

              <div class="generar-contrato__clausula-acciones">
                <span class="generar-contrato__contador">
                  {{ textoClausula.length }} / {{ LIMITE_CLAUSULA }} caracteres
                </span>
                <VaButton
                  preset="secondary"
                  size="small"
                  :disabled="!puedeAgregarClausula || emitiendo"
                  @click="agregarClausula"
                >
                  Agregar cláusula
                </VaButton>
              </div>

              <ul v-if="clausulas.length" class="generar-contrato__clausulas">
                <li
                  v-for="(clausula, indice) in clausulas"
                  :key="`${indice}-${clausula}`"
                  class="clausula-item"
                >
                  <span class="clausula-item__texto">
                    <strong>Cláusula {{ indice + 1 }}.</strong> {{ clausula }}
                  </span>
                  <button
                    type="button"
                    class="clausula-item__quitar"
                    :aria-label="`Quitar cláusula ${indice + 1}`"
                    :disabled="emitiendo"
                    @click="quitarClausula(indice)"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">
                      close
                    </span>
                  </button>
                </li>
              </ul>
            </section>

            <div
              v-if="hayConflictosPreview"
              class="generar-contrato__aviso generar-contrato__aviso--conflicto"
            >
              <p class="generar-contrato__aviso-titulo">
                No se puede emitir todavía
              </p>
              <ul class="generar-contrato__conflictos">
                <li
                  v-for="(conflicto, indice) in preview.conflictos"
                  :key="`${conflicto.codigo}-${conflicto.idMiembro}-${indice}`"
                >
                  {{ conflicto.mensaje || conflicto.nombre }}
                </li>
              </ul>
              <p class="generar-contrato__aviso-texto">
                Volvé a los datos para corregir la selección de destinatarios.
              </p>
            </div>

            <div v-else class="generar-contrato__aviso generar-contrato__aviso--info">
              Al emitir, el contrato queda en estado
              <strong>Pendiente de firma</strong> y cada parte recibe una
              notificación.
            </div>
          </aside>
        </div>

        <div class="generar-contrato__acciones">
          <VaButton
            preset="secondary"
            :disabled="emitiendo"
            @click="volverADatos"
          >
            Volver a los datos
          </VaButton>
          <VaButton
            preset="primary"
            :loading="emitiendo"
            :disabled="!puedeEmitir"
            @click="emitir"
          >
            Emitir contrato
          </VaButton>
        </div>
      </template>

      <template v-else>
        <section class="generar-contrato__exito">
          <span class="generar-contrato__exito-icono" aria-hidden="true">
            <span class="material-symbols-outlined">check</span>
          </span>

          <h2 class="generar-contrato__exito-titulo">Contrato emitido</h2>
          <p class="generar-contrato__exito-texto">
            El contrato quedó en estado
            <strong>{{ etiquetaEstadoContrato(contratoEmitido?.estado) }}</strong>
            y cada parte recibió una notificación.
          </p>

          <dl class="generar-contrato__resumen">
            <div>
              <dt>Contrato</dt>
              <dd>{{ contratoEmitido?.nombre || "Contrato" }}</dd>
            </div>
            <div>
              <dt>Tipo de acuerdo</dt>
              <dd>{{ contratoEmitido?.tipoAcuerdo?.nombre || tipoSeleccionado?.nombre || "—" }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{{ etiquetaEstadoContrato(contratoEmitido?.estado) || "—" }}</dd>
            </div>
            <div>
              <dt>Versión</dt>
              <dd>{{ contratoEmitido?.versionActual ?? "—" }}</dd>
            </div>
            <div>
              <dt>Emisión</dt>
              <dd>{{ fechaEmisionTexto }}</dd>
            </div>
          </dl>

          <h3 class="generar-contrato__exito-subtitulo">Partes</h3>
          <ul class="generar-contrato__partes generar-contrato__partes--exito">
            <li
              v-for="parte in partesEmitidas"
              :key="`${parte.idMiembro}-${parte.rolParte}`"
              class="parte-fila"
            >
              <span class="parte-fila__datos">
                <span class="parte-fila__nombre">{{ parte.nombre }}</span>
                <span class="parte-fila__rol">
                  {{ etiquetaRolParteContrato(parte.rolParte) }}
                </span>
              </span>
              <span class="parte-fila__estado">
                {{ etiquetaEstadoFirmaContrato(parte.estadoFirma) }}
              </span>
            </li>
          </ul>

          <div class="generar-contrato__exito-acciones">
            <VaButton preset="secondary" @click="irAInformacionProyecto">
              Ir a la información del proyecto
            </VaButton>
            <VaButton preset="primary" @click="volverAProyecto">
              Volver a Contratos
            </VaButton>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import contratoService from "../../services/contratoService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import { formatearFecha } from "../../utils/fechas.js";
import {
  CODIGOS_CONTRATO,
  LIMITE_CLAUSULA_CONTRATO,
  PASOS_CONTRATO,
  TEXTO_CONFLICTO_CONTRATO_ACTIVO,
  clasificarErrorContrato,
  esProyectoAptoParaContrato,
  etiquetaEstadoContrato,
  etiquetaEstadoFirmaContrato,
  etiquetaRolParteContrato,
  inicialParteContrato,
  nombreCortoContrato,
  normalizarOpcionesContrato,
  normalizarPreviewContrato,
  partesPrevistasContrato,
} from "../../utils/contratoConstants.js";

let controladorOpciones = null;
let controladorPreview = null;
let controladorEmision = null;

/*
 * UC-39: wizard de generación de contrato (mockups Datos → Borrador → Emisión).
 *
 * El sistema es la fuente de verdad: el borrador, `puedeGenerarse` y los
 * conflictos llegan del backend. La previsualización es automática al entrar al
 * paso Borrador y se repite al agregar o quitar cláusulas. La emisión es un
 * único POST atómico; el frontend no crea firmas, eventos ni notificaciones.
 */
export default {
  name: "GenerarContratoView",
  components: { BaseAlert },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      opciones: null,
      cargando: true,
      errorCarga: "",
      sinAcceso: false,
      estadoNoEncontrado: false,
      puedeReintentarCarga: false,
      paso: 1,
      idTipoAcuerdo: null,
      idsSeleccionados: [],
      /** Conflictos devueltos por el 409 al emitir, para bloquear en Datos. */
      conflictosServidor: [],
      preview: null,
      cargandoPreview: false,
      errorPreview: "",
      clausulas: [],
      textoClausula: "",
      errorClausula: "",
      emitiendo: false,
      errorEmision: "",
      contratoEmitido: null,
      idCarga: 0,
      idCargaPreview: 0,
      LIMITE_CLAUSULA: LIMITE_CLAUSULA_CONTRATO,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    rutaVolverProyecto() {
      return {
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: "contratos" },
      };
    },
    nombreProyecto() {
      return this.opciones?.proyecto?.nombre || "Proyecto";
    },
    tiposAcuerdo() {
      return this.opciones?.tiposAcuerdo || [];
    },
    miembros() {
      return this.opciones?.miembros || [];
    },
    emisor() {
      return this.opciones?.emisor || null;
    },
    contratosActivos() {
      return this.opciones?.contratosActivos || [];
    },
    tipoSeleccionado() {
      return (
        this.tiposAcuerdo.find(
          (tipo) => String(tipo.idTipoAcuerdo) === String(this.idTipoAcuerdo)
        ) || null
      );
    },
    miembrosSeleccionados() {
      return this.miembros.filter((miembro) =>
        this.estaSeleccionado(miembro)
      );
    },
    /**
     * Combinación miembro → conflicto para el tipo elegido. Une los contratos
     * activos del GET /opciones con los conflictos que devolvió el 409 al
     * emitir (el backend puede tener datos más frescos).
     */
    conflictosPorMiembro() {
      const mapa = {};

      if (this.idTipoAcuerdo == null) return mapa;

      this.contratosActivos.forEach((contrato) => {
        if (
          String(contrato?.idTipoAcuerdo) === String(this.idTipoAcuerdo) &&
          contrato?.idMiembro != null
        ) {
          mapa[String(contrato.idMiembro)] = {
            mensaje: TEXTO_CONFLICTO_CONTRATO_ACTIVO,
            contrato: contrato.nombre || "",
            origen: "opciones",
          };
        }
      });

      this.conflictosServidor.forEach((conflicto) => {
        if (conflicto?.idMiembro == null) return;
        const clave = String(conflicto.idMiembro);
        mapa[clave] = {
          mensaje: conflicto.mensaje || TEXTO_CONFLICTO_CONTRATO_ACTIVO,
          contrato: mapa[clave]?.contrato || conflicto.nombre || "",
          origen: "servidor",
        };
      });

      return mapa;
    },
    puedeContinuarDatos() {
      return (
        this.idTipoAcuerdo != null &&
        this.idsSeleccionados.length > 0 &&
        !this.cargandoPreview
      );
    },
    textoCantidadSeleccionados() {
      const cantidad = this.idsSeleccionados.length;
      if (cantidad === 0) return "Ningún destinatario seleccionado";
      return `${cantidad} ${
        cantidad === 1 ? "destinatario seleccionado" : "destinatarios seleccionados"
      }`;
    },
    puedeAgregarClausula() {
      const texto = this.textoClausula.trim();
      return texto.length > 0 && texto.length <= LIMITE_CLAUSULA_CONTRATO;
    },
    partes() {
      return partesPrevistasContrato(this.emisor, this.miembrosSeleccionados);
    },
    hayConflictosPreview() {
      return (
        !!this.preview &&
        (!this.preview.puedeGenerarse || this.preview.conflictos.length > 0)
      );
    },
    puedeEmitir() {
      return (
        this.paso === 2 &&
        !!this.preview &&
        this.preview.puedeGenerarse === true &&
        this.preview.conflictos.length === 0 &&
        String(this.preview.texto || "").trim().length > 0 &&
        !this.cargandoPreview &&
        !this.emitiendo &&
        !this.errorPreview
      );
    },
    pasos() {
      return PASOS_CONTRATO.map((item) => ({
        ...item,
        completado: item.id < this.paso,
        actual: item.id === this.paso,
      }));
    },
    tituloPaso() {
      if (this.paso === 2) return "Revisá el borrador y emití el contrato";
      if (this.paso === 3) return "Contrato emitido";
      return "Nuevo contrato";
    },
    subtituloPaso() {
      if (this.paso === 2) {
        const tipo = this.tipoSeleccionado?.nombre || "Contrato";
        return `${tipo} · ${this.nombreProyecto}`;
      }
      if (this.paso === 3) {
        return `${this.nombreProyecto} · ${this.tipoSeleccionado?.nombre || "Contrato"}`;
      }
      return "Elegí el tipo de acuerdo y las personas con quienes lo vas a firmar.";
    },
    tituloErrorCarga() {
      if (this.estadoNoEncontrado) return "Proyecto no disponible";
      if (this.sinAcceso) return "No se puede generar el contrato";
      return "No se pudo cargar el proyecto";
    },
    fechaEmisionTexto() {
      return formatearFecha(this.contratoEmitido?.fechaEmision);
    },
    partesEmitidas() {
      return Array.isArray(this.contratoEmitido?.partes)
        ? this.contratoEmitido.partes
        : [];
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.reiniciar();
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorOpciones) controladorOpciones.abort();
    if (controladorPreview) controladorPreview.abort();
    if (controladorEmision) controladorEmision.abort();
  },
  methods: {
    etiquetaRolParteContrato,
    etiquetaEstadoFirmaContrato,
    etiquetaEstadoContrato,
    inicialParteContrato,
    nombreCortoContrato,
    reiniciar() {
      this.opciones = null;
      this.cargando = true;
      this.errorCarga = "";
      this.sinAcceso = false;
      this.estadoNoEncontrado = false;
      this.puedeReintentarCarga = false;
      this.paso = 1;
      this.idTipoAcuerdo = null;
      this.idsSeleccionados = [];
      this.conflictosServidor = [];
      this.preview = null;
      this.cargandoPreview = false;
      this.errorPreview = "";
      this.clausulas = [];
      this.textoClausula = "";
      this.errorClausula = "";
      this.emitiendo = false;
      this.errorEmision = "";
      this.contratoEmitido = null;
      this.idCargaPreview++;
      if (controladorPreview) {
        controladorPreview.abort();
        controladorPreview = null;
      }
      this.cargandoPreview = false;
    },
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorOpciones) controladorOpciones.abort();
      controladorOpciones = new AbortController();

      this.cargando = true;
      this.errorCarga = "";
      this.sinAcceso = false;
      this.estadoNoEncontrado = false;
      this.puedeReintentarCarga = false;

      try {
        const response = await contratoService.obtenerOpciones(
          this.idProyecto,
          controladorOpciones.signal
        );
        if (corrida !== this.idCarga) return;

        const opciones = normalizarOpcionesContrato(response?.data);
        this.opciones = this.completarEmisor(opciones);

        if (!this.opciones.proyecto) {
          this.estadoNoEncontrado = true;
          this.errorCarga =
            "El proyecto ya no existe o no está disponible para generar contratos.";
          return;
        }

        if (!esProyectoAptoParaContrato(this.opciones.proyecto)) {
          this.sinAcceso = true;
          this.errorCarga =
            "El proyecto debe estar Publicado o Confirmado para generar contratos.";
          return;
        }

        if (!this.opciones.emisor) {
          this.sinAcceso = true;
          this.errorCarga =
            "No se pudo identificar al Director que emite el contrato.";
          return;
        }

        if (!this.opciones.tiposAcuerdo.length) {
          this.sinAcceso = true;
          this.errorCarga = "No hay tipos de acuerdo activos disponibles.";
          return;
        }

        if (!this.opciones.miembros.length) {
          this.sinAcceso = true;
          this.errorCarga =
            "El proyecto no tiene miembros activos para generar un contrato.";
        }
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    /**
     * El DTO de `/opciones` ya incluye al Director emisor dentro de
     * `miembros` con `esEmisor: true`. El fallback queda sólo por robustez:
     * si faltara, se agrega para permitir seleccionarlo como destinatario
     * (rol DIRECTOR_DESTINATARIO, §5).
     * @param {ReturnType<typeof normalizarOpcionesContrato>} opciones
     */
    completarEmisor(opciones) {
      const emisor = opciones.emisor;
      if (!emisor?.idMiembro) return opciones;
      if (
        opciones.miembros.some(
          (miembro) => String(miembro?.idMiembro) === String(emisor.idMiembro)
        )
      ) {
        return opciones;
      }

      return {
        ...opciones,
        miembros: [
          {
            ...emisor,
            profesion: "Director de proyecto",
            rolProyecto: "DIRECTOR",
            esEmisor: true,
          },
          ...opciones.miembros,
        ],
      };
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
        this.sinAcceso = true;
        this.errorCarga =
          mensaje || "No tenés permiso para generar contratos en este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil\s*activo|no hay un perfil activo/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.estadoNoEncontrado = true;
        this.errorCarga = mensaje || "El proyecto ya no existe.";
        return;
      }

      if (status === 409) {
        this.sinAcceso = true;
        this.errorCarga =
          mensaje ||
          "El proyecto no está en un estado que permita generar contratos.";
        return;
      }

      this.errorCarga = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar el proyecto. Inténtalo nuevamente."
      );
      this.puedeReintentarCarga = true;
    },
    seleccionarTipo(tipo) {
      if (this.emitiendo || tipo?.idTipoAcuerdo == null) return;
      if (String(this.idTipoAcuerdo) === String(tipo.idTipoAcuerdo)) return;

      this.idTipoAcuerdo = Number(tipo.idTipoAcuerdo);
      this.conflictosServidor = [];
      this.cancelarPreview();
      this.preview = null;
      this.errorPreview = "";
      this.errorEmision = "";

      // Los miembros que quedan en conflicto para el nuevo tipo se deseleccionan.
      const conflictivos = new Set();
      this.contratosActivos.forEach((contrato) => {
        if (
          String(contrato?.idTipoAcuerdo) === String(tipo.idTipoAcuerdo) &&
          contrato?.idMiembro != null
        ) {
          conflictivos.add(String(contrato.idMiembro));
        }
      });
      this.idsSeleccionados = this.idsSeleccionados.filter(
        (id) => !conflictivos.has(String(id))
      );
    },
    estaSeleccionado(miembro) {
      return this.idsSeleccionados.some(
        (id) => String(id) === String(miembro?.idMiembro)
      );
    },
    miembroConflicto(miembro) {
      if (miembro?.idMiembro == null) return null;
      return this.conflictosPorMiembro[String(miembro.idMiembro)] || null;
    },
    onCambioMiembro(miembro, evento) {
      if (this.emitiendo || this.miembroConflicto(miembro)) return;

      const id = Number(miembro?.idMiembro);
      if (!Number.isFinite(id)) return;

      if (evento?.target?.checked) {
        if (!this.estaSeleccionado(miembro)) {
          this.idsSeleccionados = [...this.idsSeleccionados, id];
        }
      } else {
        this.idsSeleccionados = this.idsSeleccionados.filter(
          (seleccionado) => String(seleccionado) !== String(id)
        );
      }

      this.errorEmision = "";
      this.errorPreview = "";
    },
    async continuarABorrador() {
      if (!this.puedeContinuarDatos || this.emitiendo) return;
      this.paso = 2;
      this.errorEmision = "";
      await this.previsualizar();
    },
    volverADatos() {
      if (this.emitiendo) return;
      this.cancelarPreview();
      this.paso = 1;
      this.preview = null;
      this.errorPreview = "";
      this.errorEmision = "";
    },
    cancelarPreview() {
      this.idCargaPreview++;
      if (controladorPreview) {
        controladorPreview.abort();
        controladorPreview = null;
      }
      this.cargandoPreview = false;
    },
    construirRequest() {
      return {
        idTipoAcuerdo: Number(this.idTipoAcuerdo),
        idsMiembro: this.idsSeleccionados.map((id) => Number(id)),
        clausulasAdicionales: this.clausulas
          .map((clausula) => clausula.trim())
          .filter(Boolean),
      };
    },
    async previsualizar() {
      if (this.idTipoAcuerdo == null || !this.idsSeleccionados.length) {
        return;
      }

      const corrida = ++this.idCargaPreview;
      if (controladorPreview) controladorPreview.abort();
      controladorPreview = new AbortController();

      this.cargandoPreview = true;
      this.errorPreview = "";

      try {
        const response = await contratoService.previsualizar(
          this.idProyecto,
          this.construirRequest(),
          controladorPreview.signal
        );
        if (corrida !== this.idCargaPreview) return;
        this.preview = normalizarPreviewContrato(response?.data);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCargaPreview) return;
        this.manejarErrorPreview(error);
      } finally {
        if (corrida === this.idCargaPreview) this.cargandoPreview = false;
      }
    },
    manejarErrorPreview(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);

      if (error?._esSesionExpirada) {
        refrescarSesion().then(() => this.$router.push({ name: "login" }));
        return;
      }

      if (status === 403) {
        this.toast.init({
          title: "Sin permiso",
          message:
            clasificacion.mensaje ||
            "No tenés permiso para generar contratos en este proyecto.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAProyecto();
        return;
      }

      if (status === 404) {
        if (clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_NO_ENCONTRADO) {
          refrescarSesion().then(() =>
            this.$router.push({ name: "dashboard-usuario" })
          );
          return;
        }
        this.estadoNoEncontrado = true;
        this.cargando = false;
        this.errorCarga =
          clasificacion.mensaje || "El proyecto ya no existe.";
        return;
      }

      this.errorPreview = this.mensajeErrorContrato(clasificacion, error);
    },
    async emitir() {
      if (!this.puedeEmitir || this.emitiendo || this.contratoEmitido) return;

      this.emitiendo = true;
      this.errorEmision = "";
      if (controladorEmision) controladorEmision.abort();
      controladorEmision = new AbortController();

      try {
        const response = await contratoService.generar(
          this.idProyecto,
          this.construirRequest(),
          controladorEmision.signal
        );

        this.contratoEmitido = response?.data || null;
        this.paso = 3;
        this.toast.init({
          title: "Contrato emitido",
          message:
            "El contrato quedó pendiente de firma y las partes fueron notificadas.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorEmision(error);
      } finally {
        this.emitiendo = false;
      }
    },
    async manejarErrorEmision(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);
      const mensaje = this.mensajeErrorContrato(clasificacion, error);

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (status === 403) {
        this.toast.init({
          title: "Sin permiso",
          message:
            clasificacion.mensaje ||
            "No tenés permiso para generar contratos en este proyecto.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAProyecto();
        return;
      }

      if (status === 404) {
        if (
          clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_NO_ENCONTRADO
        ) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.estadoNoEncontrado = true;
        this.cargando = false;
        this.errorCarga = clasificacion.mensaje || "El proyecto ya no existe.";
        return;
      }

      if (clasificacion.esDuplicado) {
        this.conflictosServidor = clasificacion.conflictos;
        this.quitarMiembrosEnConflicto();
        this.paso = 1;
        this.preview = null;
        this.errorPreview = "";
        this.errorEmision =
          clasificacion.mensaje ||
          "Algunos destinatarios ya tienen un contrato activo de este tipo. Revisá la selección.";
        await this.refrescarOpciones();
        return;
      }

      if (
        clasificacion.codigo === CODIGOS_CONTRATO.TIPO_ACUERDO_INVALIDO
      ) {
        this.paso = 1;
        this.idTipoAcuerdo = null;
        this.preview = null;
        this.errorPreview = "";
        this.errorEmision =
          clasificacion.mensaje || "El tipo de acuerdo ya no está disponible.";
        await this.refrescarOpciones();
        return;
      }

      if (
        clasificacion.codigo === CODIGOS_CONTRATO.DESTINATARIO_INVALIDO ||
        clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_SIN_DESTINATARIOS
      ) {
        this.paso = 1;
        this.preview = null;
        this.errorPreview = "";
        this.errorEmision = mensaje;
        await this.refrescarOpciones();
        return;
      }

      if (clasificacion.esEstado) {
        this.toast.init({
          title: "No se pudo emitir",
          message: mensaje,
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.volverAProyecto();
        return;
      }

      if (status === 400 || clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_TEXTO_INVALIDO) {
        this.errorEmision = mensaje;
        return;
      }

      if (!status || status >= 500) {
        this.toast.init({
          title: "Error del servidor",
          message:
            "No se pudo emitir el contrato. Inténtalo nuevamente.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        return;
      }

      this.errorEmision = mensaje;
    },
    /**
     * Actualiza `contratosActivos` después de un 409 sin reiniciar el wizard.
     */
    async refrescarOpciones() {
      try {
        const response = await contratoService.obtenerOpciones(this.idProyecto);
        const opciones = this.completarEmisor(
          normalizarOpcionesContrato(response?.data)
        );
        this.opciones = opciones;

        const idsVigentes = new Set(
          opciones.miembros.map((miembro) => String(miembro.idMiembro))
        );
        this.idsSeleccionados = this.idsSeleccionados.filter((id) =>
          idsVigentes.has(String(id))
        );

        if (
          this.idTipoAcuerdo != null &&
          !opciones.tiposAcuerdo.some(
            (tipo) => String(tipo.idTipoAcuerdo) === String(this.idTipoAcuerdo)
          )
        ) {
          this.idTipoAcuerdo = null;
        }
      } catch {
        // Si el refresco falla se conserva el contexto actual; el backend ya
        // devolvió el conflicto y el usuario puede corregir la selección.
      }
    },
    quitarMiembrosEnConflicto() {
      const ids = new Set(
        this.conflictosServidor
          .map((conflicto) =>
            conflicto?.idMiembro != null ? String(conflicto.idMiembro) : null
          )
          .filter(Boolean)
      );
      if (!ids.size) return;
      this.idsSeleccionados = this.idsSeleccionados.filter(
        (id) => !ids.has(String(id))
      );
    },
    onTextoClausula(valor) {
      this.textoClausula = String(valor || "").slice(
        0,
        LIMITE_CLAUSULA_CONTRATO
      );
      if (this.errorClausula) this.errorClausula = "";
    },
    async agregarClausula() {
      const texto = this.textoClausula.trim();
      if (!texto) {
        this.errorClausula = "Escribí una cláusula antes de agregarla.";
        return;
      }
      if (texto.length > LIMITE_CLAUSULA_CONTRATO) {
        this.errorClausula = `La cláusula no puede superar los ${LIMITE_CLAUSULA_CONTRATO} caracteres.`;
        return;
      }

      this.clausulas = [...this.clausulas, texto];
      this.textoClausula = "";
      this.errorClausula = "";
      if (this.paso === 2) await this.previsualizar();
    },
    async quitarClausula(indice) {
      if (this.emitiendo) return;
      this.clausulas = this.clausulas.filter((_, i) => i !== indice);
      if (this.paso === 2) await this.previsualizar();
    },
    mensajeErrorContrato(clasificacion, error) {
      if (clasificacion?.mensaje) return clasificacion.mensaje;
      const errores = clasificacion?.errores || {};
      const valores = Object.values(errores).filter(Boolean);
      if (valores.length) return valores.join(" ");
      return mensajeErrorApi(error, "No se pudo completar la operación.");
    },
    volverAProyecto() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: "contratos" },
      });
    },
    irAInformacionProyecto() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
      });
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
.generar-contrato {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.generar-contrato__migas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.generar-contrato__miga {
  color: var(--color-primary);
  text-decoration: none;
}

.generar-contrato__miga:hover {
  text-decoration: underline;
}

.generar-contrato__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  flex-wrap: wrap;
}

.generar-contrato__cabecera-texto {
  flex: 1;
  min-width: 280px;
}

.generar-contrato__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
}

.generar-contrato__subtitulo {
  margin: 0.4rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
}

.generar-contrato__stepper {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 0 0 auto;
}

.generar-contrato__paso {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
}

.generar-contrato__paso-circulo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.generar-contrato__paso--completado .generar-contrato__paso-circulo {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.generar-contrato__paso--completado
  .generar-contrato__paso-circulo
  .material-symbols-outlined {
  font-size: 15px;
}

.generar-contrato__paso--actual .generar-contrato__paso-circulo {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.generar-contrato__paso--actual .generar-contrato__paso-etiqueta {
  color: var(--color-text);
  font-weight: 700;
}

.generar-contrato__linea {
  flex: 0 0 40px;
  height: 2px;
  margin: 0 0.55rem;
  background: var(--color-border-strong);
}

.generar-contrato__linea--completada {
  background: var(--color-primary);
}

.generar-contrato__columnas {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.generar-contrato__columnas--borrador {
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.9fr);
}

.generar-contrato__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  min-width: 0;
}

.generar-contrato__panel--compacto {
  gap: 0.75rem;
  padding: 1.1rem 1.2rem;
}

.generar-contrato__panel--documento {
  min-height: 480px;
}

.generar-contrato__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.generar-contrato__lateral {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.generar-contrato__lateral-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.generar-contrato__opciones {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.generar-contrato__opcion {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.generar-contrato__opcion:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.generar-contrato__opcion--seleccionada {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.generar-contrato__opcion:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.generar-contrato__radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  margin-top: 0.1rem;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
}

.generar-contrato__radio--activo {
  border-color: var(--color-primary);
}

.generar-contrato__radio-punto {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-primary);
}

.generar-contrato__opcion-texto {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.generar-contrato__opcion-titulo {
  font-size: 0.9rem;
  font-weight: 700;
}

.generar-contrato__opcion-descripcion {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.generar-contrato__miembros {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.miembro-opcion {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  cursor: pointer;
}

.miembro-opcion--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.miembro-opcion--bloqueado {
  cursor: not-allowed;
  background: var(--color-surface-muted);
  border-color: var(--color-border);
}

.miembro-opcion__check {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 0.55rem;
  accent-color: var(--color-primary);
  cursor: inherit;
}

.miembro-opcion__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-chip);
  color: var(--color-primary);
  font-size: 0.9rem;
  font-weight: 700;
}

.miembro-opcion__datos {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.miembro-opcion__nombre {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.miembro-opcion__rol {
  padding: 0.08rem 0.4rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.miembro-opcion__meta {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.miembro-opcion__conflicto {
  margin-top: 0.2rem;
  color: var(--color-warning-text);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
}

.generar-contrato__contador {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.generar-contrato__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.25rem;
}

.generar-contrato__documento-encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.generar-contrato__documento-estado {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-style: italic;
}

.generar-contrato__documento-cargando {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.generar-contrato__documento-texto {
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 62vh;
  overflow-y: auto;
}

.generar-contrato__partes {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.generar-contrato__partes--exito {
  width: 100%;
  max-width: 34rem;
}

.parte-fila {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.parte-fila:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.parte-fila__datos {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.parte-fila__nombre {
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.parte-fila__rol {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.parte-fila__estado {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  white-space: nowrap;
}

.generar-contrato__clausula-acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.generar-contrato__clausulas {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.clausula-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface-soft);
}

.clausula-item__texto {
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.clausula-item__quitar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.clausula-item__quitar:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--color-text);
}

.clausula-item__quitar:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.clausula-item__quitar .material-symbols-outlined {
  font-size: 1rem;
}

.generar-contrato__aviso {
  padding: 0.85rem 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  line-height: 1.5;
}

.generar-contrato__aviso--info {
  border: 1px solid var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.generar-contrato__aviso--conflicto {
  border: 1px solid var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.generar-contrato__aviso-titulo {
  margin: 0 0 0.35rem;
  font-size: 0.84rem;
  font-weight: 700;
}

.generar-contrato__aviso-texto {
  margin: 0.35rem 0 0;
}

.generar-contrato__conflictos {
  margin: 0;
  padding-left: 1.1rem;
}

.generar-contrato__acciones-error {
  display: flex;
  justify-content: flex-start;
}

.generar-contrato__alerta {
  margin: 0 !important;
}

.generar-contrato__exito {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  text-align: center;
}

.generar-contrato__exito-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.generar-contrato__exito-icono .material-symbols-outlined {
  font-size: 2rem;
}

.generar-contrato__exito-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 700;
}

.generar-contrato__exito-texto {
  margin: 0;
  max-width: 34rem;
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.55;
}

.generar-contrato__resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.9rem;
  width: 100%;
  max-width: 46rem;
  margin: 0.5rem 0;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
  text-align: left;
}

.generar-contrato__resumen div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.generar-contrato__resumen dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.generar-contrato__resumen dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.generar-contrato__exito-subtitulo {
  margin: 0.35rem 0 0;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.generar-contrato__exito-acciones {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.75rem;
}

.generar-contrato__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.generar-contrato__estado-icono {
  font-size: 2rem;
}

.generar-contrato__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.generar-contrato__estado-texto {
  margin: 0;
  max-width: 34rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.generar-contrato__estado-acciones {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.35rem;
}

.generar-contrato__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .generar-contrato__columnas,
  .generar-contrato__columnas--borrador {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .generar-contrato__cabecera {
    flex-direction: column;
  }

  .generar-contrato__stepper {
    flex-wrap: wrap;
    row-gap: 0.65rem;
  }

  .generar-contrato__linea {
    flex-basis: 24px;
    margin: 0 0.35rem;
  }

  .generar-contrato__acciones {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
