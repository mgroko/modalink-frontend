<template>
  <div class="modificar-contrato">
    <p class="modificar-contrato__migas">
      <router-link :to="{ name: 'proyectos-inicio' }" class="modificar-contrato__miga">
        Proyectos
      </router-link>
      <span aria-hidden="true">›</span>
      <router-link :to="rutaContratos" class="modificar-contrato__miga">
        Contratos
      </router-link>
      <span aria-hidden="true">›</span>
      <router-link :to="rutaDetalle" class="modificar-contrato__miga">
        Detalle
      </router-link>
      <span aria-hidden="true">›</span>
      <span>Modificar</span>
    </p>

    <div v-if="cargando" class="modificar-contrato__estado">
      <span class="material-symbols-outlined modificar-contrato__estado-icono">
        hourglass_empty
      </span>
      Cargando contrato...
    </div>

    <section v-else-if="bloqueado" class="modificar-contrato__estado">
      <span class="material-symbols-outlined modificar-contrato__estado-icono">
        lock
      </span>
      <h1 class="modificar-contrato__estado-titulo">No se puede modificar</h1>
      <p class="modificar-contrato__estado-texto">{{ motivoBloqueo }}</p>
      <VaButton preset="primary" @click="volverAlDetalle">
        Volver al detalle
      </VaButton>
    </section>

    <section v-else-if="errorCarga" class="modificar-contrato__estado">
      <span class="material-symbols-outlined modificar-contrato__estado-icono">
        {{ estadoNoEncontrado ? "description" : "lock" }}
      </span>
      <h1 class="modificar-contrato__estado-titulo">{{ tituloError }}</h1>
      <p class="modificar-contrato__estado-texto">{{ errorCarga }}</p>
      <div class="modificar-contrato__estado-acciones">
        <VaButton v-if="puedeReintentar" preset="secondary" @click="cargar">
          Reintentar
        </VaButton>
        <VaButton preset="primary" @click="volverAlDetalle">
          Volver al detalle
        </VaButton>
      </div>
    </section>

    <template v-else-if="contrato">
      <header class="modificar-contrato__cabecera">
        <div>
          <h1 class="modificar-contrato__titulo">Modificar contrato</h1>
          <p class="modificar-contrato__subtitulo">
            {{ contrato.nombre || `Contrato #${contrato.idContrato}` }}
            <template v-if="contrato.nombreProyecto">
              · {{ contrato.nombreProyecto }}
            </template>
          </p>
        </div>

        <VaButton preset="secondary" @click="volverAlDetalle">
          Volver al detalle
        </VaButton>
      </header>

      <BaseAlert
        v-if="errorPreview"
        :message="errorPreview"
        type="error"
      />

      <BaseAlert
        v-if="errorGuardado && !modalConfirmarVisible"
        :message="errorGuardado"
        type="error"
      />

      <div class="modificar-contrato__columnas">
        <div class="modificar-contrato__principal">
          <section class="modificar-contrato__panel">
            <h2 class="modificar-contrato__seccion-titulo">Tipo de acuerdo</h2>

            <div class="modificar-contrato__opciones">
              <button
                v-for="tipo in tiposAcuerdo"
                :key="tipo.idTipoAcuerdo"
                type="button"
                class="modificar-contrato__opcion"
                :class="{
                  'modificar-contrato__opcion--seleccionada':
                    String(idTipoAcuerdo) === String(tipo.idTipoAcuerdo),
                }"
                :aria-pressed="
                  String(idTipoAcuerdo) === String(tipo.idTipoAcuerdo)
                    ? 'true'
                    : 'false'
                "
                :disabled="guardando"
                @click="seleccionarTipo(tipo)"
              >
                <span class="modificar-contrato__radio" aria-hidden="true">
                  <span
                    v-if="String(idTipoAcuerdo) === String(tipo.idTipoAcuerdo)"
                    class="modificar-contrato__radio-punto"
                  ></span>
                </span>
                <span class="modificar-contrato__opcion-texto">
                  <span class="modificar-contrato__opcion-titulo">
                    {{ tipo.nombre }}
                  </span>
                  <span
                    v-if="tipo.descripcion"
                    class="modificar-contrato__opcion-descripcion"
                  >
                    {{ tipo.descripcion }}
                  </span>
                </span>
              </button>
            </div>

            <p v-if="!tiposAcuerdo.length" class="modificar-contrato__nota">
              No hay tipos de acuerdo activos disponibles.
            </p>
          </section>

          <section class="modificar-contrato__panel">
            <div class="modificar-contrato__seccion-cabecera">
              <h2 class="modificar-contrato__seccion-titulo">Destinatarios</h2>

              <button
                type="button"
                class="modificar-contrato__toggle-todos"
                :disabled="guardando || !miembrosSeleccionables.length"
                @click="alternarTodosMiembros"
              >
                {{
                  todosMiembrosSeleccionados
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"
                }}
              </button>
            </div>

            <p
              v-if="destinatariosInactivos.length"
              class="modificar-contrato__aviso modificar-contrato__aviso--warning"
            >
              Estos destinatarios actuales ya no están activos en el proyecto y
              no se conservarán:
              <strong>{{ destinatariosInactivos.join(", ") }}</strong>.
            </p>

            <p
              v-if="destinatariosEnConflicto.length"
              class="modificar-contrato__aviso modificar-contrato__aviso--warning"
            >
              Estos destinatarios actuales ya tienen un contrato activo de este
              tipo y no se conservarán:
              <strong>{{ destinatariosEnConflicto.join(", ") }}</strong>.
            </p>

            <div class="modificar-contrato__miembros">
              <label
                v-for="miembro in miembros"
                :key="miembro.idMiembro"
                class="miembro-contrato"
                :class="{
                  'miembro-contrato--seleccionado': estaSeleccionado(miembro),
                  'miembro-contrato--bloqueado': !!miembroConflicto(miembro),
                }"
              >
                <input
                  type="checkbox"
                  class="miembro-contrato__check"
                  :checked="estaSeleccionado(miembro)"
                  :disabled="!!miembroConflicto(miembro) || guardando"
                  @change="onCambioMiembro(miembro, $event)"
                />

                <span class="miembro-contrato__datos">
                  <span class="miembro-contrato__nombre">
                    {{ nombreCortoContrato(miembro) }}
                    <span v-if="miembro.esEmisor" class="miembro-contrato__rol">
                      Director
                    </span>
                  </span>
                  <span class="miembro-contrato__meta">
                    {{ miembro.profesion || "Sin profesión" }}
                  </span>
                  <span
                    v-if="miembroConflicto(miembro)"
                    class="miembro-contrato__conflicto"
                  >
                    {{ miembroConflicto(miembro).mensaje }}
                  </span>
                </span>
              </label>
            </div>

            <p class="modificar-contrato__contador">
              {{ textoCantidadSeleccionados }}
            </p>
          </section>

          <section class="modificar-contrato__panel">
            <h2 class="modificar-contrato__seccion-titulo">Nombre y descripción</h2>

            <VaInput
              :model-value="nombre"
              label="Nombre"
              placeholder="Nombre del contrato"
              :max-length="LIMITE_NOMBRE_CONTRATO"
              counter
              :disabled="guardando"
              @update:model-value="onNombre"
            />

            <VaTextarea
              :model-value="descripcion"
              label="Descripción"
              placeholder="Descripción del contrato"
              :max-length="LIMITE_DESCRIPCION_CONTRATO"
              counter
              :rows="3"
              :disabled="guardando"
              @update:model-value="onDescripcion"
            />

            <p class="modificar-contrato__nota">
              Si dejás el nombre vacío y cambia el tipo de acuerdo, el backend
              lo regenera como “tipo - proyecto”. La descripción vacía conserva
              la actual.
            </p>
          </section>

          <section class="modificar-contrato__panel">
            <h2 class="modificar-contrato__seccion-titulo">Texto del contrato</h2>

            <div class="modificar-contrato__modos" role="group" aria-label="Modo de texto">
              <button
                type="button"
                class="modificar-contrato__modo"
                :class="{
                  'modificar-contrato__modo--activo': modoTexto === 'final',
                }"
                :aria-pressed="modoTexto === 'final' ? 'true' : 'false'"
                :disabled="guardando"
                @click="cambiarModoTexto('final')"
              >
                Editar texto final
              </button>
              <button
                type="button"
                class="modificar-contrato__modo"
                :class="{
                  'modificar-contrato__modo--activo': modoTexto === 'regenerar',
                }"
                :aria-pressed="modoTexto === 'regenerar' ? 'true' : 'false'"
                :disabled="guardando"
                @click="cambiarModoTexto('regenerar')"
              >
                Regenerar desde plantilla
              </button>
            </div>

            <template v-if="modoTexto === 'final'">
              <VaTextarea
                :model-value="texto"
                label="Texto final"
                :max-length="LIMITE_TEXTO_CONTRATO"
                :rows="14"
                :disabled="guardando"
                @update:model-value="onTexto"
              />

              <p class="modificar-contrato__nota">
                El texto se envía tal cual. En este modo las cláusulas
                adicionales no se aplican.
              </p>

              <p
                v-if="cambioTipoODestinatarios"
                class="modificar-contrato__aviso modificar-contrato__aviso--warning"
              >
                Cambiaste el tipo de acuerdo o los destinatarios. El texto actual
                puede tener datos desactualizados; regeneralo si querés que se
                actualice con la plantilla.
              </p>
            </template>

            <template v-else>
              <p class="modificar-contrato__aviso modificar-contrato__aviso--warning">
                Al guardar en este modo se descarta el texto actual y se genera
                uno nuevo desde la plantilla del tipo y las cláusulas.
              </p>

              <VaTextarea
                id="clausula-adicional-contrato"
                :model-value="textoClausula"
                label="Cláusula adicional (opcional)"
                placeholder="Escribí una cláusula para agregar al contrato..."
                :max-length="LIMITE_CLAUSULA_CONTRATO"
                counter
                :rows="4"
                :error="!!errorClausula"
                :error-messages="errorClausula || undefined"
                :disabled="guardando"
                @update:model-value="onTextoClausula"
              />

              <div class="modificar-contrato__clausula-acciones">
                <span class="modificar-contrato__contador">
                  {{ textoClausula.length }} / {{ LIMITE_CLAUSULA_CONTRATO }} caracteres
                </span>
                <VaButton
                  preset="secondary"
                  size="small"
                  :disabled="!puedeAgregarClausula || guardando"
                  @click="agregarClausula"
                >
                  Agregar cláusula
                </VaButton>
              </div>

              <ul v-if="clausulas.length" class="modificar-contrato__clausulas">
                <li
                  v-for="(clausula, indice) in clausulas"
                  :key="`${indice}-${clausula}`"
                  class="modificar-contrato__clausula"
                >
                  <span>
                    <strong>Cláusula {{ indice + 1 }}.</strong> {{ clausula }}
                  </span>
                  <button
                    type="button"
                    class="modificar-contrato__quitar"
                    :aria-label="`Quitar cláusula ${indice + 1}`"
                    :disabled="guardando"
                    @click="quitarClausula(indice)"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">
                      close
                    </span>
                  </button>
                </li>
              </ul>
            </template>
          </section>
        </div>

        <aside class="modificar-contrato__lateral">
          <section class="modificar-contrato__panel modificar-contrato__panel--compacto">
            <div class="modificar-contrato__preview-cabecera">
              <h2 class="modificar-contrato__seccion-titulo">Previsualización</h2>
              <span v-if="cargandoPreview" class="modificar-contrato__preview-estado">
                Generando...
              </span>
            </div>

            <p v-if="!preview && !cargandoPreview" class="modificar-contrato__nota">
              Previsualizá los cambios para validar el texto y los conflictos
              antes de guardar.
            </p>
            <div v-else-if="preview" class="modificar-contrato__preview-texto">
              {{ preview.texto || "Sin texto generado." }}
            </div>

            <p v-if="preview && !previewVigente" class="modificar-contrato__nota">
              Hay cambios posteriores a la previsualización. Volvé a
              previsualizar antes de guardar.
            </p>

            <div
              v-if="hayConflictosPreview"
              class="modificar-contrato__aviso modificar-contrato__aviso--conflicto"
            >
              <p class="modificar-contrato__aviso-titulo">
                No se puede guardar todavía
              </p>
              <ul
                v-if="preview.conflictos.length"
                class="modificar-contrato__conflictos"
              >
                <li
                  v-for="(conflicto, indice) in preview.conflictos"
                  :key="`${conflicto.codigo}-${conflicto.idMiembro}-${indice}`"
                >
                  {{ conflicto.mensaje || conflicto.nombre }}
                </li>
              </ul>
              <p v-else class="modificar-contrato__aviso-titulo">
                La previsualización no habilitó la modificación. Revisá los
                datos o volvé al detalle.
              </p>
            </div>

            <VaButton
              preset="secondary"
              :loading="cargandoPreview"
              :disabled="!puedePrevisualizar || guardando"
              @click="previsualizar"
            >
              Previsualizar cambios
            </VaButton>
          </section>

          <section class="modificar-contrato__panel modificar-contrato__panel--compacto">
            <h2 class="modificar-contrato__seccion-titulo">Partes previstas</h2>
            <PartesContrato :partes="partesPrevistas" />
          </section>

          <section class="modificar-contrato__panel modificar-contrato__panel--compacto">
            <h2 class="modificar-contrato__seccion-titulo">Guardar</h2>
            <p class="modificar-contrato__nota">
              El backend reconcilia las firmas y genera la nueva versión. Sólo se
              habilita después de una previsualización válida.
            </p>
            <VaButton
              preset="primary"
              :disabled="!puedeGuardar"
              @click="abrirConfirmacion"
            >
              Guardar cambios
            </VaButton>
          </section>
        </aside>
      </div>
    </template>

    <ModalConfirmarModificacionContrato
      v-model="modalConfirmarVisible"
      :contrato="contrato"
      :resumen="resumenConfirmacion"
      :guardando="guardando"
      :error="errorGuardado"
      @confirmar="guardar"
    />
  </div>
</template>

<script>
import BaseAlert from "../../components/AlertaBase.vue";
import PartesContrato from "../../components/contrato/PartesContrato.vue";
import ModalConfirmarModificacionContrato from "../../components/contrato/ModalConfirmarModificacionContrato.vue";
import contratoService from "../../services/contratoService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import {
  CODIGOS_CONTRATO,
  LIMITE_CLAUSULA_CONTRATO,
  LIMITE_DESCRIPCION_CONTRATO,
  LIMITE_NOMBRE_CONTRATO,
  LIMITE_TEXTO_CONTRATO,
  TEXTO_CONFLICTO_CONTRATO_ACTIVO,
  clasificarErrorContrato,
  etiquetaMotivoNoModificable,
  idsDestinatariosDePartes,
  mensajeErrorContrato,
  nombreCortoContrato,
  normalizarDetalleContrato,
  normalizarOpcionesContrato,
  normalizarPreviewModificacion,
  partesPrevistasContrato,
  puedeModificarContrato,
} from "../../utils/contratoConstants.js";
import { ROLES_PROYECTO } from "../../utils/proyectoConstants.js";
import {
  conVolver,
  leerVolver,
  resolverVolver,
} from "../../utils/navegacionContratos.js";

let controladorCarga = null;
let controladorPreview = null;
let controladorGuardado = null;

/*
 * UC-53. El formulario se inicializa con el detalle y las opciones de UC-39.
 * - Los destinatarios actuales se derivan de `partes[]`.
 * - En modo "texto final" se envía el texto tal cual y se ignoran cláusulas.
 * - En modo "regenerar" se envía texto null + cláusulas.
 * - El guardado sólo se habilita tras una previsualización vigente y válida.
 */
export default {
  name: "ModificarContratoView",
  components: {
    BaseAlert,
    PartesContrato,
    ModalConfirmarModificacionContrato,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      contrato: null,
      opciones: null,
      cargando: true,
      errorCarga: "",
      bloqueado: false,
      motivoBloqueo: "",
      sinAcceso: false,
      estadoNoEncontrado: false,
      puedeReintentar: false,
      idCarga: 0,
      idCargaPreview: 0,

      idTipoAcuerdo: null,
      idsSeleccionados: [],
      nombre: "",
      descripcion: "",
      modoTexto: "final",
      texto: "",
      clausulas: [],
      textoClausula: "",
      errorClausula: "",
      tipoOriginal: null,
      nombreOriginal: "",
      destinatariosOriginales: [],

      preview: null,
      previewKey: "",
      cargandoPreview: false,
      errorPreview: "",
      conflictosServidor: [],

      guardando: false,
      errorGuardado: "",
      modalConfirmarVisible: false,

      LIMITE_CLAUSULA_CONTRATO,
      LIMITE_DESCRIPCION_CONTRATO,
      LIMITE_NOMBRE_CONTRATO,
      LIMITE_TEXTO_CONTRATO,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.idProyecto;
    },
    idContrato() {
      return this.$route.params.idContrato;
    },
    rutaContratos() {
      return resolverVolver({
        route: this.$route,
        router: this.$router,
        idProyecto: this.idProyecto,
        fallback: {
          name: "buscar-contratos",
          query: this.idProyecto ? { idProyecto: this.idProyecto } : {},
        },
      });
    },
    rutaDetalle() {
      return conVolver(
        {
          name: "detalle-contrato",
          params: {
            idProyecto: this.idProyecto,
            idContrato: this.idContrato,
          },
        },
        leerVolver(this.$route)
      );
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
          (tipo) =>
            String(tipo.idTipoAcuerdo) === String(this.idTipoAcuerdo)
        ) || null
      );
    },
    miembrosSeleccionados() {
      return this.miembros.filter((miembro) => this.estaSeleccionado(miembro));
    },
    miembrosSeleccionables() {
      return this.miembros.filter(
        (miembro) => !this.miembroConflicto(miembro)
      );
    },
    todosMiembrosSeleccionados() {
      return (
        this.miembrosSeleccionables.length > 0 &&
        this.miembrosSeleccionables.every((miembro) =>
          this.estaSeleccionado(miembro)
        )
      );
    },
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
          };
        }
      });

      this.conflictosServidor.forEach((conflicto) => {
        if (conflicto?.idMiembro == null) return;
        const clave = String(conflicto.idMiembro);
        mapa[clave] = {
          mensaje: conflicto.mensaje || TEXTO_CONFLICTO_CONTRATO_ACTIVO,
          contrato: mapa[clave]?.contrato || conflicto.nombre || "",
        };
      });

      return mapa;
    },
    partesPrevistas() {
      return partesPrevistasContrato(this.emisor, this.miembrosSeleccionados);
    },
    destinatariosInactivos() {
      if (!this.contrato) return [];
      const activos = new Set(
        this.miembros.map((miembro) => String(miembro.idMiembro))
      );
      return (this.contrato.partes || [])
        .filter(
          (parte) =>
            (parte.rolParte === "DESTINATARIO" ||
              parte.rolParte === "DIRECTOR_DESTINATARIO") &&
            !activos.has(String(parte.idMiembro))
        )
        .map((parte) => parte.nombre || `Miembro #${parte.idMiembro}`);
    },
    destinatariosEnConflicto() {
      if (!this.contrato) return [];
      const activos = new Set(
        this.miembros.map((miembro) => String(miembro.idMiembro))
      );
      return (this.contrato.partes || [])
        .filter(
          (parte) =>
            (parte.rolParte === "DESTINATARIO" ||
              parte.rolParte === "DIRECTOR_DESTINATARIO") &&
            activos.has(String(parte.idMiembro)) &&
            !!this.conflictosPorMiembro[String(parte.idMiembro)]
        )
        .map((parte) => parte.nombre || `Miembro #${parte.idMiembro}`);
    },
    cambioTipoODestinatarios() {
      if (!this.contrato) return false;
      return (
        String(this.idTipoAcuerdo) !== String(this.tipoOriginal) ||
        !this.mismosIds(this.idsSeleccionados, this.destinatariosOriginales)
      );
    },
    textoCantidadSeleccionados() {
      const cantidad = this.idsSeleccionados.length;
      if (cantidad === 0) return "Ningún destinatario seleccionado";
      return `${cantidad} ${
        cantidad === 1
          ? "destinatario seleccionado"
          : "destinatarios seleccionados"
      }`;
    },
    puedeAgregarClausula() {
      const texto = String(this.textoClausula || "").trim();
      return (
        texto.length > 0 && texto.length <= LIMITE_CLAUSULA_CONTRATO
      );
    },
    requestKey() {
      return JSON.stringify(this.construirRequest());
    },
    previewVigente() {
      return !!this.preview && this.previewKey === this.requestKey;
    },
    hayConflictosPreview() {
      return (
        !!this.preview &&
        (!this.preview.puedeModificarse || this.preview.conflictos.length > 0)
      );
    },
    puedePrevisualizar() {
      if (
        this.idTipoAcuerdo == null ||
        !this.idsSeleccionados.length ||
        this.cargandoPreview ||
        this.guardando ||
        this.bloqueado
      ) {
        return false;
      }
      if (this.modoTexto === "final") {
        return String(this.texto || "").trim().length > 0;
      }
      return true;
    },
    puedeGuardar() {
      return (
        !this.guardando &&
        !this.bloqueado &&
        this.previewVigente &&
        this.preview.puedeModificarse === true &&
        this.preview.conflictos.length === 0
      );
    },
    resumenConfirmacion() {
      return {
        tipo: this.tipoSeleccionado?.nombre || "—",
        destinatarios: this.idsSeleccionados.length,
        modoTexto:
          this.modoTexto === "final"
            ? "Texto final editado"
            : "Regenerado desde plantilla",
      };
    },
    tituloError() {
      if (this.estadoNoEncontrado) return "Contrato no disponible";
      if (this.sinAcceso) return "No se puede modificar el contrato";
      return "No se pudo cargar el contrato";
    },
  },
  watch: {
    idContrato(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
    if (controladorPreview) controladorPreview.abort();
    if (controladorGuardado) controladorGuardado.abort();
  },
  methods: {
    etiquetaMotivoNoModificable,
    nombreCortoContrato,
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      this.cargando = true;
      this.errorCarga = "";
      this.bloqueado = false;
      this.motivoBloqueo = "";
      this.sinAcceso = false;
      this.estadoNoEncontrado = false;
      this.puedeReintentar = false;
      this.preview = null;
      this.previewKey = "";
      this.errorPreview = "";
      this.errorGuardado = "";
      this.cargandoPreview = false;
      this.idCargaPreview += 1;
      if (controladorPreview) {
        controladorPreview.abort();
        controladorPreview = null;
      }

      try {
        const [detalleResponse, opcionesResponse] = await Promise.all([
          contratoService.obtenerDetalle(
            this.idProyecto,
            this.idContrato,
            controladorCarga.signal
          ),
          contratoService.obtenerOpciones(
            this.idProyecto,
            controladorCarga.signal
          ),
        ]);
        if (corrida !== this.idCarga) return;

        const detalle = normalizarDetalleContrato(detalleResponse?.data);
        const opciones = this.completarEmisor(
          normalizarOpcionesContrato(opcionesResponse?.data)
        );

        this.contrato = detalle;
        this.opciones = opciones;

        if (!detalle.idContrato) {
          this.estadoNoEncontrado = true;
          this.errorCarga = "El contrato ya no existe o no está disponible.";
          return;
        }

        if (!puedeModificarContrato(detalle)) {
          this.bloqueado = true;
          this.motivoBloqueo =
            etiquetaMotivoNoModificable(detalle.motivoNoModificable) ||
            "Este contrato no se puede modificar en este momento.";
          return;
        }

        this.inicializarFormulario(detalle, opciones);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCarga) return;
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    completarEmisor(opciones) {
      const emisor = opciones?.emisor;
      if (!emisor?.idMiembro) return opciones;
      if (
        opciones.miembros.some(
          (miembro) =>
            String(miembro?.idMiembro) === String(emisor.idMiembro)
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
            rolProyecto: ROLES_PROYECTO.DIRECTOR,
            esEmisor: true,
          },
          ...opciones.miembros,
        ],
      };
    },
    inicializarFormulario(detalle, opciones) {
      const idsActivos = new Set(
        (opciones.miembros || []).map((miembro) => String(miembro.idMiembro))
      );
      const conflictivos = new Set(
        (opciones.contratosActivos || [])
          .filter(
            (contrato) =>
              String(contrato?.idTipoAcuerdo) === String(detalle.idTipoAcuerdo) &&
              contrato?.idMiembro != null
          )
          .map((contrato) => String(contrato.idMiembro))
      );
      const destinatarios = idsDestinatariosDePartes(detalle.partes)
        .filter((id) => idsActivos.has(String(id)))
        .filter((id) => !conflictivos.has(String(id)));

      this.idTipoAcuerdo = detalle.idTipoAcuerdo;
      this.idsSeleccionados = destinatarios;
      this.nombre = detalle.nombre || "";
      this.descripcion = detalle.descripcion || "";
      this.texto = detalle.texto || "";
      this.modoTexto = "final";
      this.clausulas = [];
      this.textoClausula = "";
      this.errorClausula = "";
      this.tipoOriginal = detalle.idTipoAcuerdo;
      this.nombreOriginal = detalle.nombre || "";
      this.destinatariosOriginales = [...destinatarios];
      this.preview = null;
      this.previewKey = "";
      this.errorPreview = "";
      this.conflictosServidor = [];
    },
    async manejarErrorCarga(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (
        status === 404 &&
        (clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_ACTIVO_NO_SELECCIONADO ||
          clasificacion.codigo === CODIGOS_CONTRATO.PERFIL_NO_ENCONTRADO)
      ) {
        await refrescarSesion();
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (status === 403) {
        this.sinAcceso = true;
        this.errorCarga =
          clasificacion.mensaje ||
          "No tenés permiso para modificar este contrato.";
        return;
      }

      if (status === 404) {
        this.estadoNoEncontrado = true;
        this.errorCarga =
          clasificacion.mensaje ||
          "El contrato no existe o pertenece a otro proyecto.";
        return;
      }

      if (status === 409) {
        this.sinAcceso = true;
        this.errorCarga =
          clasificacion.mensaje ||
          "El contrato o el proyecto ya no permiten la modificación.";
        return;
      }

      this.errorCarga = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar el contrato. Inténtalo nuevamente."
      );
      this.puedeReintentar = !status || status >= 500;
    },
    seleccionarTipo(tipo) {
      if (this.guardando || tipo?.idTipoAcuerdo == null) return;
      if (String(this.idTipoAcuerdo) === String(tipo.idTipoAcuerdo)) return;

      this.idTipoAcuerdo = Number(tipo.idTipoAcuerdo);
      this.conflictosServidor = [];
      // Si el nombre no fue editado, se deja vacío para que el backend lo
      // regenere como "{tipo} - {proyecto}" al cambiar el tipo de acuerdo.
      if (String(this.nombre || "") === String(this.nombreOriginal || "")) {
        this.nombre = "";
      }
      this.invalidarPreview();

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
    alternarTodosMiembros() {
      if (this.guardando || !this.miembrosSeleccionables.length) return;

      if (this.todosMiembrosSeleccionados) {
        this.idsSeleccionados = [];
      } else {
        const ids = this.miembrosSeleccionables
          .map((miembro) => Number(miembro?.idMiembro))
          .filter((id) => Number.isFinite(id));
        this.idsSeleccionados = [...new Set(ids)];
      }

      this.invalidarPreview();
    },
    onCambioMiembro(miembro, evento) {
      if (this.guardando || this.miembroConflicto(miembro)) return;

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
      this.invalidarPreview();
    },
    onNombre(valor) {
      this.nombre = String(valor || "").slice(0, LIMITE_NOMBRE_CONTRATO);
      this.invalidarPreview();
    },
    onDescripcion(valor) {
      this.descripcion = String(valor || "").slice(
        0,
        LIMITE_DESCRIPCION_CONTRATO
      );
      this.invalidarPreview();
    },
    onTexto(valor) {
      this.texto = String(valor || "").slice(0, LIMITE_TEXTO_CONTRATO);
      this.invalidarPreview();
    },
    cambiarModoTexto(modo) {
      if (this.guardando || this.modoTexto === modo) return;
      this.modoTexto = modo;
      this.errorClausula = "";
      this.invalidarPreview();
    },
    onTextoClausula(valor) {
      this.textoClausula = String(valor || "").slice(
        0,
        LIMITE_CLAUSULA_CONTRATO
      );
      if (this.errorClausula) this.errorClausula = "";
    },
    agregarClausula() {
      const texto = String(this.textoClausula || "").trim();
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
      this.invalidarPreview();
    },
    quitarClausula(indice) {
      if (this.guardando) return;
      this.clausulas = this.clausulas.filter((_, posicion) => posicion !== indice);
      this.invalidarPreview();
    },
    invalidarPreview() {
      this.preview = null;
      this.previewKey = "";
      this.errorPreview = "";
      this.errorGuardado = "";
    },
    construirRequest() {
      const texto = String(this.texto || "").trim();
      const esTextoFinal = this.modoTexto === "final";
      return {
        idTipoAcuerdo: Number(this.idTipoAcuerdo),
        idsMiembro: this.idsSeleccionados.map((id) => Number(id)),
        texto: esTextoFinal ? texto || null : null,
        clausulasAdicionales: esTextoFinal
          ? []
          : this.clausulas.map((clausula) => clausula.trim()).filter(Boolean),
        nombre: String(this.nombre || "").trim() || null,
        descripcion: String(this.descripcion || "").trim() || null,
      };
    },
    async previsualizar() {
      if (!this.puedePrevisualizar) {
        if (this.modoTexto === "final" && !String(this.texto || "").trim()) {
          this.errorPreview = "El texto final no puede estar vacío.";
        } else if (!this.idsSeleccionados.length) {
          this.errorPreview = "Seleccioná al menos un destinatario.";
        }
        return;
      }

      const corrida = ++this.idCargaPreview;
      if (controladorPreview) controladorPreview.abort();
      controladorPreview = new AbortController();
      this.cargandoPreview = true;
      this.errorPreview = "";
      this.errorGuardado = "";

      try {
        const request = this.construirRequest();
        const response = await contratoService.previsualizarModificacion(
          this.idProyecto,
          this.idContrato,
          request,
          controladorPreview.signal
        );
        if (corrida !== this.idCargaPreview) return;
        this.preview = normalizarPreviewModificacion(response?.data);
        this.previewKey = JSON.stringify(request);
      } catch (error) {
        if (this.esCancelacion(error) || corrida !== this.idCargaPreview) {
          return;
        }
        this.preview = null;
        this.previewKey = "";
        await this.manejarErrorPreview(error);
      } finally {
        if (corrida === this.idCargaPreview) this.cargandoPreview = false;
      }
    },
    async manejarErrorPreview(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);
      const mensaje = mensajeErrorContrato(
        error,
        "No se pudo previsualizar el contrato."
      );

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (status === 403) {
        this.sinAcceso = true;
        this.errorCarga =
          clasificacion.mensaje ||
          "No tenés permiso para modificar este contrato.";
        return;
      }

      if (status === 404) {
        this.estadoNoEncontrado = true;
        this.errorCarga =
          clasificacion.mensaje || "El contrato ya no existe.";
        return;
      }

      if (clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_DUPLICADO_ACTIVO) {
        this.conflictosServidor = clasificacion.conflictos;
        this.errorPreview = mensaje;
        return;
      }

      if (
        clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_NO_PENDIENTE_FIRMA ||
        clasificacion.codigo === CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_CONTRATO ||
        clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_CON_FIRMAS_REGISTRADAS
      ) {
        this.bloqueado = true;
        this.motivoBloqueo = mensaje;
        return;
      }

      this.errorPreview = mensaje;
    },
    abrirConfirmacion() {
      if (!this.puedeGuardar) return;
      this.errorGuardado = "";
      this.modalConfirmarVisible = true;
    },
    async guardar() {
      if (!this.puedeGuardar || this.guardando) return;

      this.guardando = true;
      this.errorGuardado = "";
      if (controladorGuardado) controladorGuardado.abort();
      controladorGuardado = new AbortController();

      try {
        await contratoService.modificar(
          this.idProyecto,
          this.idContrato,
          this.construirRequest(),
          controladorGuardado.signal
        );

        this.modalConfirmarVisible = false;
        this.toast.init({
          title: "Contrato modificado",
          message:
            "Los cambios quedaron guardados y las partes fueron notificadas.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        this.$router.push(this.rutaDetalle);
      } catch (error) {
        if (this.esCancelacion(error)) return;
        await this.manejarErrorGuardado(error);
      } finally {
        this.guardando = false;
      }
    },
    async manejarErrorGuardado(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorContrato(error);
      const mensaje = mensajeErrorContrato(
        error,
        "No se pudo modificar el contrato."
      );

      if (error?._esSesionExpirada) {
        await refrescarSesion();
        this.$router.push({ name: "login" });
        return;
      }

      if (status === 403) {
        this.modalConfirmarVisible = false;
        this.sinAcceso = true;
        this.errorCarga =
          clasificacion.mensaje ||
          "No tenés permiso para modificar este contrato.";
        return;
      }

      if (status === 404) {
        this.modalConfirmarVisible = false;
        this.estadoNoEncontrado = true;
        this.errorCarga =
          clasificacion.mensaje || "El contrato ya no existe.";
        return;
      }

      if (clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_DUPLICADO_ACTIVO) {
        this.modalConfirmarVisible = false;
        this.conflictosServidor = clasificacion.conflictos;
        this.invalidarPreview();
        this.errorPreview = mensaje;
        return;
      }

      if (
        clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_NO_PENDIENTE_FIRMA ||
        clasificacion.codigo === CODIGOS_CONTRATO.PROYECTO_NO_APTO_PARA_CONTRATO ||
        clasificacion.codigo === CODIGOS_CONTRATO.CONTRATO_CON_FIRMAS_REGISTRADAS
      ) {
        this.modalConfirmarVisible = false;
        this.bloqueado = true;
        this.motivoBloqueo = mensaje;
        return;
      }

      this.errorGuardado = mensaje;
    },
    volverAlDetalle() {
      this.$router.push(this.rutaDetalle);
    },
    mismosIds(a, b) {
      const izquierda = [...new Set((a || []).map(String))].sort();
      const derecha = [...new Set((b || []).map(String))].sort();
      return (
        izquierda.length === derecha.length &&
        izquierda.every((valor, indice) => valor === derecha[indice])
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
.modificar-contrato {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1220px;
  margin: 0 auto;
}

.modificar-contrato__migas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.modificar-contrato__miga {
  color: var(--color-primary);
  text-decoration: none;
}

.modificar-contrato__miga:hover {
  text-decoration: underline;
}

.modificar-contrato__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.3rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  flex-wrap: wrap;
}

.modificar-contrato__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 700;
}

.modificar-contrato__subtitulo {
  margin: 0.35rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.modificar-contrato__columnas {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.9fr);
  gap: 1.1rem;
  align-items: start;
}

.modificar-contrato__principal,
.modificar-contrato__lateral {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.modificar-contrato__panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  min-width: 0;
}

.modificar-contrato__panel--compacto {
  gap: 0.7rem;
  padding: 1rem 1.1rem;
}

.modificar-contrato__seccion-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.modificar-contrato__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.modificar-contrato__toggle-todos {
  padding: 0.1rem 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.modificar-contrato__toggle-todos:hover:not(:disabled) {
  text-decoration: underline;
}

.modificar-contrato__toggle-todos:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modificar-contrato__opciones,
.modificar-contrato__miembros {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.modificar-contrato__opcion {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 100%;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.modificar-contrato__opcion:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.modificar-contrato__opcion--seleccionada {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.modificar-contrato__opcion:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.modificar-contrato__radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 19px;
  height: 19px;
  margin-top: 0.15rem;
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
}

.modificar-contrato__radio-punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.modificar-contrato__opcion-texto {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.modificar-contrato__opcion-titulo {
  font-size: 0.88rem;
  font-weight: 700;
}

.modificar-contrato__opcion-descripcion {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.miembro-contrato {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background: var(--color-surface);
  cursor: pointer;
}

.miembro-contrato--seleccionado {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}

.miembro-contrato--bloqueado {
  cursor: not-allowed;
  background: var(--color-surface-muted);
  border-color: var(--color-border);
}

.miembro-contrato__check {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin-top: 0.45rem;
  accent-color: var(--color-primary);
}

.miembro-contrato__datos {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
  flex: 1;
}

.miembro-contrato__nombre {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 700;
}

.miembro-contrato__rol {
  padding: 0.08rem 0.4rem;
  border: 1px solid var(--color-info-border);
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.miembro-contrato__meta {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.miembro-contrato__conflicto {
  margin-top: 0.15rem;
  color: var(--color-warning-text);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.4;
}

.modificar-contrato__contador {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.modificar-contrato__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.modificar-contrato__aviso {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  font-size: 0.8rem;
  line-height: 1.45;
}

.modificar-contrato__aviso--warning {
  border: 1px solid var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.modificar-contrato__aviso--conflicto {
  border: 1px solid var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.modificar-contrato__aviso-titulo {
  margin: 0 0 0.35rem;
  font-weight: 700;
}

.modificar-contrato__conflictos {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.78rem;
  line-height: 1.45;
}

.modificar-contrato__modos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.modificar-contrato__modo {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.modificar-contrato__modo--activo {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.modificar-contrato__clausula-acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.modificar-contrato__clausulas {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.modificar-contrato__clausula {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 0.78rem;
  line-height: 1.45;
}

.modificar-contrato__quitar {
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

.modificar-contrato__quitar:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--color-text);
}

.modificar-contrato__quitar .material-symbols-outlined {
  font-size: 1rem;
}

.modificar-contrato__preview-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.modificar-contrato__preview-estado {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-style: italic;
}

.modificar-contrato__preview-texto {
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 46vh;
  overflow-y: auto;
}

.modificar-contrato__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.5rem 1.25rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  text-align: center;
}

.modificar-contrato__estado-icono {
  font-size: 2rem;
  color: var(--color-text-subtle);
}

.modificar-contrato__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
}

.modificar-contrato__estado-texto {
  margin: 0;
  max-width: 34rem;
  font-size: 0.86rem;
  line-height: 1.5;
}

.modificar-contrato__estado-acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}

@media (max-width: 960px) {
  .modificar-contrato__columnas {
    grid-template-columns: 1fr;
  }
}
</style>
