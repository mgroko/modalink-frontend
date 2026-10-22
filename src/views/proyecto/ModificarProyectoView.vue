<template>
  <div class="modificar-proyecto">
    <h1 class="modificar-proyecto__titulo">Proyectos / Modificar proyecto</h1>
    <p class="modificar-proyecto__subtitulo">
      Actualizá los datos del proyecto. El nombre no se puede modificar.
    </p>

    <div v-if="cargando" class="modificar-proyecto__estado">
      <span class="material-symbols-outlined modificar-proyecto__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <section v-else-if="errorCarga" class="modificar-proyecto__estado">
      <span class="material-symbols-outlined modificar-proyecto__estado-icono">
        error
      </span>
      <p class="modificar-proyecto__estado-texto">{{ errorCarga }}</p>
      <VaButton preset="secondary" @click="volverAlProyecto">
        Volver al proyecto
      </VaButton>
    </section>

    <template v-else>
      <div class="modificar-proyecto__stepper" aria-label="Pasos de modificación del proyecto">
        <template v-for="(nombrePaso, i) in pasos" :key="nombrePaso">
          <div
            v-if="i > 0"
            class="modificar-proyecto__paso-linea"
            :class="{ 'modificar-proyecto__paso-linea--activa': paso > i }"
            aria-hidden="true"
          />
          <div
            class="modificar-proyecto__paso"
            :class="{ 'modificar-proyecto__paso--activo': paso === i + 1 }"
            :aria-current="paso === i + 1 ? 'step' : undefined"
          >
            <span class="modificar-proyecto__paso-numero">{{ i + 1 }}</span>
            <span class="modificar-proyecto__paso-nombre">{{ nombrePaso }}</span>
          </div>
        </template>
      </div>

      <VaForm
        ref="form"
        :immediate="false"
        class="modificar-proyecto__form"
        @submit.prevent="paso === pasos.length ? guardar() : siguiente()"
      >
        <section v-if="paso === 1" class="modificar-proyecto__seccion">
          <h2 class="modificar-proyecto__seccion-titulo">Datos generales</h2>

          <VaInput
            v-model="form.nombre"
            label="Nombre del proyecto"
            disabled
          />
          <p class="modificar-proyecto__seccion-ayuda">
            El nombre del proyecto no se puede modificar.
          </p>

          <VaTextarea
            v-model="form.descripcion"
            label="Descripción*"
            placeholder="Contá de qué se trata el proyecto..."
            :max-length="200"
            counter
            :rows="3"
            :rules="[reglas.requerido, reglas.noBlanco, reglas.max200]"
            :error="errorCampo('descripcion')"
            :error-messages="mensajeCampo('descripcion')"
            @update:model-value="limpiarError('descripcion')"
          />

          <div class="modificar-proyecto__fila">
            <SegmentadoPrivacidad v-model="form.privacidad" label="Privacidad*" />
          </div>

          <div class="modificar-proyecto__campo-fecha">
            <VaInput
              :model-value="form.fechaEntregaEstipulada"
              type="date"
              label="Fecha de entrega"
              :min="hoy"
              :rules="reglasFecha"
              :error="errorCampo('fechaEntregaEstipulada')"
              :error-messages="mensajeCampo('fechaEntregaEstipulada')"
              @update:model-value="onFechaChange"
            />
            <p class="modificar-proyecto__seccion-ayuda">
              Fecha límite para finalizar el proyecto. Se usa para estimar su duración y
              calcular los caminos críticos.
            </p>
            <p v-if="advertenciaFecha" class="modificar-proyecto__aviso">
              {{ advertenciaFecha }}
            </p>
          </div>

          <div class="modificar-proyecto__subseccion">
            <p class="modificar-proyecto__subseccion-titulo">Ubicación</p>
            <p class="modificar-proyecto__seccion-ayuda">
              {{ ayudaUbicacion }}
            </p>
            <SelectorUbicacion
              :model-value="form.ubicacion"
              @update:model-value="onUbicacionChange"
            />
            <p v-if="advertenciaUbicacion" class="modificar-proyecto__aviso">
              {{ advertenciaUbicacion }}
            </p>
          </div>
        </section>

        <section v-else-if="paso === 2" class="modificar-proyecto__seccion">
          <h2 class="modificar-proyecto__seccion-titulo">Objetivos</h2>
          <p class="modificar-proyecto__seccion-ayuda">
            Si modificás esta sección, el listado reemplaza por completo a los objetivos
            actuales.
          </p>

          <VaButton
            preset="secondary"
            size="small"
            icon="mso-add"
            class="modificar-proyecto__agregar"
            @click="agregarObjetivo"
          >
            Agregar objetivo
          </VaButton>

          <ListaDinamicaObjetivos
            :model-value="form.objetivos"
            :errores="erroresBackend"
            :mostrar-encabezado="false"
            @update:model-value="onObjetivosChange"
          />
        </section>

        <section v-else-if="paso === 3" class="modificar-proyecto__seccion">
          <h2 class="modificar-proyecto__seccion-titulo">Requerimiento de personal</h2>
          <p class="modificar-proyecto__seccion-ayuda">
            Los requerimientos con postulaciones aceptadas se muestran bloqueados: no se
            pueden editar ni eliminar.
          </p>

          <VaButton
            preset="secondary"
            size="small"
            icon="mso-add"
            class="modificar-proyecto__agregar"
            @click="agregarRequerimiento"
          >
            Agregar requerimiento
          </VaButton>

          <p v-if="form.requerimientosGral.length === 0" class="modificar-proyecto__vacio">
            <span class="material-symbols-outlined">groups</span>
            Este proyecto no tiene requerimientos de personal.
          </p>

          <RequerimientoForm
            v-for="(requerimiento, i) in form.requerimientosGral"
            :key="requerimiento.uid"
            v-model="form.requerimientosGral[i]"
            :indice="i"
            :profesiones="profesiones"
            :habilidades="habilidades"
            :cargando-habilidades="cargandoHabilidades"
            :errores="erroresDeRequerimiento(i)"
            :eliminar-permitido="!requerimiento.satisfecho"
            :solo-lectura="requerimiento.satisfecho"
            @eliminar="quitarRequerimiento(i)"
            @catalogo-cargado="guardarCatalogo"
          />

          <ul
            v-if="seccionErrores.requerimientosGral?.length"
            class="modificar-proyecto__errores-seccion"
          >
            <li v-for="(msg, i) in seccionErrores.requerimientosGral" :key="i">{{ msg }}</li>
          </ul>

          <div class="modificar-proyecto__postulaciones">
            <VaSwitch
              v-model="form.aceptaPostulacionGral"
              label="Acepta postulaciones abiertas"
            />
            <p class="modificar-proyecto__seccion-ayuda">
              Cualquier persona que pueda ver el proyecto podrá postularse a estos
              requerimientos. Si lo dejás desactivado, solo se cubrirán por invitación.
            </p>
          </div>
        </section>

        <section v-else class="modificar-proyecto__seccion">
          <h2 class="modificar-proyecto__seccion-titulo">Moodboard</h2>
          <p class="modificar-proyecto__seccion-ayuda">
            Solo se modifica la descripción: las imágenes no se pueden cambiar desde acá.
          </p>
          <MoodboardSeccion
            :model-value="form.moodboard"
            :imagenes="imagenesMoodboard"
            :mostrar-encabezado="false"
            :error="errorCampo('moodboard.descripcion')"
            :error-messages="mensajeCampo('moodboard.descripcion')"
            solo-lectura
            @update:model-value="onMoodboardChange"
          />
        </section>

        <div class="modificar-proyecto__alertas">
          <BaseAlert v-if="mensajeError && !modalConfirmar" :message="mensajeError" type="error" />
          <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
        </div>

        <div class="modificar-proyecto__acciones">
          <span class="modificar-proyecto__nota">Los campos marcados con (*) son obligatorios</span>

          <div class="modificar-proyecto__acciones-pie">
            <VaButton
              preset="secondary"
              class="modificar-proyecto__btn-texto"
              :disabled="guardando"
              @click="cancelar"
            >
              Cancelar
            </VaButton>

            <div class="modificar-proyecto__acciones-derecha">
              <VaButton v-if="paso > 1" preset="secondary" :disabled="guardando" @click="anterior">
                Atrás
              </VaButton>
              <VaButton type="submit" :loading="guardando">
                {{ esUltimoPaso ? "Guardar cambios" : "Siguiente" }}
              </VaButton>
            </div>
          </div>
        </div>
      </VaForm>
    </template>

    <VaModal
      v-model="modalConfirmar"
      hide-default-actions
      size="small"
      :no-dismiss="guardando"
      blur
      class="modificar-proyecto-modal"
    >
      <template #header>
        <h3 class="va-h5 modificar-proyecto-modal__titulo">Guardar cambios</h3>
      </template>

      <p class="modificar-proyecto-modal__mensaje">
        El proyecto está {{ estadoLegible.toLowerCase() }}. Los cambios se aplicarán de
        inmediato y serán visibles según su privacidad. ¿Querés guardar los cambios?
      </p>

      <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

      <template #footer>
        <div class="modificar-proyecto-modal__acciones">
          <VaButton preset="secondary" :disabled="guardando" @click="cancelarConfirmacion">
            Cancelar
          </VaButton>
          <VaButton preset="primary" :loading="guardando" @click="confirmarGuardado">
            Guardar cambios
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService.js";
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import { refrescarSesion } from "../../services/authState.js";
import BaseAlert from "../../components/AlertaBase.vue";
import SegmentadoPrivacidad from "../../components/proyecto/SegmentadoPrivacidad.vue";
import SelectorUbicacion from "../../components/proyecto/SelectorUbicacion.vue";
import ListaDinamicaObjetivos from "../../components/proyecto/ListaDinamicaObjetivos.vue";
import RequerimientoForm from "../../components/proyecto/RequerimientoForm.vue";
import MoodboardSeccion from "../../components/proyecto/MoodboardSeccion.vue";
import { reglasProyecto, hoyISO } from "../../utils/reglas.js";
import {
  PRIVACIDADES,
  ESTADOS_PROYECTO,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";
import {
  validarRequerimiento,
  validarFechaEntregaProyecto,
  mapearErroresBackend,
  raizConocida,
} from "../../utils/validacionesProyecto.js";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { mensajeErrorApi } from "../../utils/apiError.js";
import { resolverFotoUrl } from "../../utils/fotos.js";

const RAICES_PASO = {
  1: ["descripcion", "privacidad", "fechaEntregaEstipulada", "ubicacion"],
  2: ["objetivos"],
  3: ["requerimientosGral", "aceptaPostulacionGral"],
  4: ["moodboard"],
};

let controladorCarga = null;
let controladorGuardado = null;

export default {
  name: "ModificarProyectoView",
  components: {
    BaseAlert,
    SegmentadoPrivacidad,
    SelectorUbicacion,
    ListaDinamicaObjetivos,
    RequerimientoForm,
    MoodboardSeccion,
  },
  data() {
    return {
      pasos: ["Datos generales", "Objetivos", "Personal", "Moodboard"],
      paso: 1,
      form: {
        nombre: "",
        descripcion: "",
        privacidad: PRIVACIDADES.PUBLICO,
        fechaEntregaEstipulada: "",
        aceptaPostulacionGral: false,
        ubicacion: null,
        objetivos: [],
        requerimientosGral: [],
        moodboard: "",
      },
      imagenesMoodboard: [],
      proyectoOriginal: null,
      estado: ESTADOS_PROYECTO.BORRADOR,
      precargado: false,
      hoy: hoyISO(),
      profesiones: [],
      habilidades: [],
      cargandoHabilidades: false,
      catalogosPorProfesion: {},
      erroresBackend: {},
      seccionErrores: {},
      dirty: { objetivos: false, personal: false, moodboard: false },
      ubicacionQuitada: false,
      advertenciaUbicacion: "",
      advertenciaFecha: "",
      cargando: true,
      errorCarga: "",
      guardando: false,
      mensajeError: "",
      mensajeExito: "",
      modalConfirmar: false,
      siguienteUid: 0,
      idCarga: 0,
      reglas: reglasProyecto,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    esUltimoPaso() {
      return this.paso === this.pasos.length;
    },
    estadoLegible() {
      return normalizarEstadoProyecto(this.estado);
    },
    esBorrador() {
      return this.estado === ESTADOS_PROYECTO.BORRADOR;
    },
    esPublicadoOConfirmado() {
      return [ESTADOS_PROYECTO.PUBLICADO, ESTADOS_PROYECTO.CONFIRMADO].includes(
        this.estado
      );
    },
    requiereConfirmacion() {
      return this.esPublicadoOConfirmado;
    },
    ayudaUbicacion() {
      if (this.esPublicadoOConfirmado) {
        return "Obligatoria en proyectos publicados o confirmados.";
      }
      return "Opcional. Si la quitás, el proyecto queda sin ubicación.";
    },
    reglasFecha() {
      const fechaOriginal = this.proyectoOriginal?.fechaEntregaEstipulada || "";
      if (this.form.fechaEntregaEstipulada === fechaOriginal) return [];
      return [reglasProyecto.fechaEntregaNoPasada(this.hoy)];
    },
  },
  watch: {
    "form.objetivos": {
      deep: true,
      handler() {
        if (this.precargado) this.dirty.objetivos = true;
      },
    },
    "form.requerimientosGral": {
      deep: true,
      handler() {
        if (this.precargado) this.dirty.personal = true;
      },
    },
    "form.moodboard"() {
      if (this.precargado) this.dirty.moodboard = true;
    },
  },
  mounted() {
    this.cargarProyecto();
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
    if (controladorGuardado) controladorGuardado.abort();
  },
  methods: {
    async cargarProyecto() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      this.cargando = true;
      this.errorCarga = "";

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;

        const proyecto = response?.data;
        if (!proyecto) {
          this.errorCarga = "No encontramos el proyecto que querés modificar.";
          return;
        }

        this.proyectoOriginal = proyecto;
        this.estado = normalizarEstadoProyecto(proyecto.estado);

        if (!proyecto.esMiembro || !(proyecto.permisos || []).includes("MODIFICAR_PROYECTO")) {
          this.errorCarga = "No tenés permiso para modificar este proyecto.";
          return;
        }

        if ([ESTADOS_PROYECTO.FINALIZADO, ESTADOS_PROYECTO.CANCELADO].includes(this.estado)) {
          this.errorCarga = `No se puede modificar un proyecto en estado ${this.estado}.`;
          return;
        }

        this.precargarFormulario(proyecto);
        await this.cargarCatalogos();
      } catch (error) {
        if (
          corrida !== this.idCarga ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },

    precargarFormulario(proyecto) {
      this.siguienteUid = 0;
      this.form = {
        nombre: proyecto.nombre || "",
        descripcion: proyecto.descripcion || "",
        privacidad: proyecto.privacidad || PRIVACIDADES.PUBLICO,
        fechaEntregaEstipulada: proyecto.fechaEntregaEstipulada || "",
        aceptaPostulacionGral: !!proyecto.aceptaPostulacionGral,
        ubicacion: this.mapearUbicacion(proyecto.ubicacion),
        objetivos: (proyecto.objetivos || []).map((objetivo) => ({
          nombre: objetivo.nombre || "",
          descripcion: objetivo.descripcion || "",
        })),
        requerimientosGral: (proyecto.requerimientosGral || []).map((requerimiento) =>
          this.mapearRequerimiento(requerimiento)
        ),
        moodboard: proyecto.moodboard?.descripcion || "",
      };

      this.imagenesMoodboard = (proyecto.moodboard?.imagenes || []).map(
        (imagen, indice) => ({
          id: imagen.idImagen,
          nombre: `Imagen ${indice + 1}`,
          preview: resolverFotoUrl(imagen.url),
        })
      );

      this.ubicacionQuitada = false;
      this.advertenciaUbicacion = "";
      this.advertenciaFecha = "";
      this.erroresBackend = {};
      this.seccionErrores = {};
      this.dirty = { objetivos: false, personal: false, moodboard: false };

      this.$nextTick(() => {
        this.precargado = true;
        this.dirty = { objetivos: false, personal: false, moodboard: false };
      });
    },

    mapearRequerimiento(requerimiento) {
      this.siguienteUid += 1;
      return {
        uid: this.siguienteUid,
        idRequerimientoGral: requerimiento.idRequerimientoGral,
        satisfecho: !!requerimiento.satisfecho,
        cantidad: requerimiento.cantidad,
        idProfesion: requerimiento.idProfesion,
        descripcion: requerimiento.descripcion || "",
        caracteristicas: (requerimiento.caracteristicas || []).map((carac) => ({
          idCaracteristica: carac.idCaracteristica,
          valorMin: carac.valorMin ?? null,
          valorMax: carac.valorMax ?? null,
          valores: Array.isArray(carac.valores) ? [...carac.valores] : [],
        })),
        habilidades: Array.isArray(requerimiento.habilidades)
          ? [...requerimiento.habilidades]
          : [],
      };
    },

    mapearUbicacion(ubicacion) {
      const ciudad = ubicacion?.ciudad;
      const provinciaId = ciudad?.provincia?.idExterno;
      const localidadId = ciudad?.idExterno;
      if (!provinciaId || !localidadId) return null;
      return {
        provinciaId: String(provinciaId),
        localidadId: String(localidadId),
      };
    },

    async cargarCatalogos() {
      const resultados = await Promise.allSettled([
        this.cargarProfesiones(),
        this.cargarHabilidades(),
      ]);
      if (resultados[0].status === "rejected") {
        this.mensajeError = "No se pudieron cargar las profesiones. Intentá nuevamente.";
      }
      if (resultados[1].status === "rejected") {
        this.habilidades = [];
      }
    },

    async cargarProfesiones() {
      const response = await perfilService.listarProfesiones();
      const datos = response?.data;
      this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
    },

    async cargarHabilidades() {
      this.cargandoHabilidades = true;
      try {
        const response = await habilidadService.listar();
        const datos = response?.data;
        this.habilidades = Array.isArray(datos) ? datos : datos?.habilidades || [];
      } finally {
        this.cargandoHabilidades = false;
      }
    },

    guardarCatalogo({ idProfesion, caracteristicas }) {
      this.catalogosPorProfesion[idProfesion] = caracteristicas;
    },

    nuevoRequerimiento() {
      this.siguienteUid += 1;
      return {
        uid: this.siguienteUid,
        idRequerimientoGral: null,
        satisfecho: false,
        cantidad: "",
        idProfesion: null,
        descripcion: "",
        caracteristicas: [],
        habilidades: [],
      };
    },

    agregarRequerimiento() {
      this.form.requerimientosGral.push(this.nuevoRequerimiento());
    },

    quitarRequerimiento(indice) {
      const requerimiento = this.form.requerimientosGral[indice];
      if (requerimiento?.satisfecho) return;
      this.form.requerimientosGral.splice(indice, 1);
    },

    agregarObjetivo() {
      this.form.objetivos = [...this.form.objetivos, { nombre: "", descripcion: "" }];
    },

    onObjetivosChange(objetivos) {
      this.form.objetivos = Array.isArray(objetivos) ? objetivos : [];
      this.dirty.objetivos = true;
    },

    onMoodboardChange(descripcion) {
      this.form.moodboard = descripcion;
      this.dirty.moodboard = true;
    },

    onFechaChange(fecha) {
      if (this.esPublicadoOConfirmado && !fecha) {
        this.advertenciaFecha =
          "La fecha de entrega es obligatoria en proyectos publicados o confirmados.";
        return;
      }
      this.advertenciaFecha = "";
      this.form.fechaEntregaEstipulada = fecha;
      this.limpiarError("fechaEntregaEstipulada");
    },

    onUbicacionChange(ubicacion) {
      this.form.ubicacion = ubicacion;
      this.ubicacionQuitada = !ubicacion && !!this.proyectoOriginal?.ubicacion;
      this.advertenciaUbicacion =
        this.esPublicadoOConfirmado && !ubicacion?.localidadId
          ? "La ubicación (provincia y ciudad) es obligatoria en proyectos publicados o confirmados."
          : "";
      this.limpiarError("ubicacion");
    },

    errorCampo(campo) {
      return this.erroresBackend[campo] ? true : undefined;
    },

    mensajeCampo(campo) {
      return this.erroresBackend[campo] || undefined;
    },

    limpiarError(campo) {
      if (this.erroresBackend[campo]) {
        const errores = { ...this.erroresBackend };
        delete errores[campo];
        this.erroresBackend = errores;
      }
    },

    erroresDeRequerimiento(indice) {
      const prefijo = `requerimientosGral.${indice}.`;
      const relativos = {};
      for (const [clave, msg] of Object.entries(this.erroresBackend)) {
        if (clave.startsWith(prefijo)) {
          relativos[clave.slice(prefijo.length)] = msg;
        }
      }
      return relativos;
    },

    validarFormulario() {
      const campos = {};
      const secciones = {};

      const descripcion = String(this.form.descripcion || "").trim();
      if (!descripcion) {
        campos.descripcion = "La descripción del proyecto es obligatoria.";
      } else if (descripcion.length > 200) {
        campos.descripcion = "No puede superar los 200 caracteres.";
      }

      if (this.form.ubicacion && !this.form.ubicacion.localidadId) {
        campos.ubicacion = "Seleccioná una ciudad para la ubicación.";
      }

      const fechaOriginal = this.proyectoOriginal?.fechaEntregaEstipulada || "";
      if (this.form.fechaEntregaEstipulada !== fechaOriginal) {
        Object.assign(
          campos,
          validarFechaEntregaProyecto(this.form.fechaEntregaEstipulada, this.hoy)
        );
      }

      const mensajesRequerimiento = [];
      this.form.requerimientosGral.forEach((requerimiento, indice) => {
        if (requerimiento.satisfecho) return;

        const catalogo = this.catalogosPorProfesion[requerimiento.idProfesion];
        const validable = Array.isArray(catalogo)
          ? requerimiento
          : { ...requerimiento, caracteristicas: [] };

        const { campos: camposReq, seccion } = validarRequerimiento(validable, catalogo);
        for (const [clave, msg] of Object.entries(camposReq)) {
          campos[`requerimientosGral.${indice}.${clave}`] = msg;
        }
        mensajesRequerimiento.push(...seccion);
      });

      if (mensajesRequerimiento.length > 0) {
        secciones.requerimientosGral = [...new Set(mensajesRequerimiento)];
      }

      return { campos, secciones };
    },

    aplicarValidacion(campos, secciones) {
      this.erroresBackend = campos;
      this.seccionErrores = secciones;
      const hayErrores =
        Object.keys(campos).length > 0 || Object.keys(secciones).length > 0;
      if (!hayErrores) return false;

      this.mensajeError = "Revisá los datos marcados antes de continuar.";
      this.irAlPasoDeErrores([
        ...Object.keys(campos),
        ...(secciones.requerimientosGral ? ["requerimientosGral"] : []),
      ]);
      return true;
    },

    siguiente() {
      this.mensajeError = "";
      this.mensajeExito = "";

      if (!this.$refs.form.validate()) {
        this.mensajeError = "Revisá los campos marcados antes de continuar.";
        return false;
      }

      const { campos, secciones } = this.validarFormulario();
      const raices = RAICES_PASO[this.paso] || [];
      const camposPaso = {};
      for (const [clave, msg] of Object.entries(campos)) {
        if (raices.includes(clave.split(".")[0])) camposPaso[clave] = msg;
      }
      const seccionesPaso = {};
      if (raices.includes("requerimientosGral") && secciones.requerimientosGral) {
        seccionesPaso.requerimientosGral = secciones.requerimientosGral;
      }

      if (
        Object.keys(camposPaso).length > 0 ||
        Object.keys(seccionesPaso).length > 0
      ) {
        this.aplicarValidacion(camposPaso, seccionesPaso);
        return false;
      }

      this.irAPaso(this.paso + 1);
      return true;
    },

    anterior() {
      if (this.paso <= 1) return;
      this.mensajeError = "";
      this.irAPaso(this.paso - 1);
    },

    irAPaso(paso) {
      this.paso = Math.min(Math.max(paso, 1), this.pasos.length);
      this.$nextTick(() => {
        this.$refs.form?.resetValidation?.();
      });
    },

    pasoDeClave(clave) {
      const raiz = String(clave || "").split(".")[0];
      const encontrado = Object.entries(RAICES_PASO).find(([, raices]) =>
        raices.includes(raiz)
      );
      return encontrado ? Number(encontrado[0]) : 1;
    },

    irAlPasoDeErrores(claves) {
      const pasos = (claves || []).map((clave) => this.pasoDeClave(clave));
      if (pasos.length === 0) return;
      const destino = Math.min(...pasos);
      if (destino !== this.paso) this.irAPaso(destino);
    },

    validarInformacionBasica() {
      if (!this.esPublicadoOConfirmado) return [];

      const faltantes = [];
      if (!this.form.ubicacion?.localidadId) faltantes.push("ubicación");
      if (!this.form.fechaEntregaEstipulada) faltantes.push("fecha de entrega");

      const tieneMoodboard =
        !!this.proyectoOriginal?.moodboard || !!String(this.form.moodboard || "").trim();
      if (!tieneMoodboard) faltantes.push("moodboard");

      if (this.form.requerimientosGral.length === 0) {
        faltantes.push("al menos un requerimiento de personal");
      }

      return faltantes;
    },

    mensajeInformacionBasica(faltantes) {
      return `El proyecto tiene información básica incompleta. Faltan: ${faltantes.join(
        ", "
      )}.`;
    },

    guardar() {
      this.mensajeError = "";
      this.mensajeExito = "";

      if (!this.$refs.form.validate()) {
        this.mensajeError = "Revisá los campos marcados antes de continuar.";
        return;
      }

      const { campos, secciones } = this.validarFormulario();
      if (this.aplicarValidacion(campos, secciones)) return;

      const faltantes = this.validarInformacionBasica();
      if (faltantes.length > 0) {
        this.mensajeError = this.mensajeInformacionBasica(faltantes);
        this.irAPaso(1);
        return;
      }

      if (this.requiereConfirmacion) {
        this.modalConfirmar = true;
        return;
      }

      this.ejecutarGuardado();
    },

    cancelarConfirmacion() {
      if (this.guardando) return;
      this.modalConfirmar = false;
      this.mensajeError = "";
    },

    confirmarGuardado() {
      if (this.guardando) return;
      this.ejecutarGuardado();
    },

    async ejecutarGuardado() {
      if (this.guardando) return;
      this.guardando = true;
      this.mensajeError = "";
      this.mensajeExito = "";

      if (controladorGuardado) controladorGuardado.abort();
      controladorGuardado = new AbortController();

      try {
        const response = await proyectoService.modificar(
          this.idProyecto,
          this.buildRequest(),
          controladorGuardado.signal
        );
        const proyecto = response?.data;
        this.modalConfirmar = false;
        this.mensajeExito = "Los cambios se guardaron correctamente.";
        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
          state: { proyecto },
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        await this.manejarError(error);
      } finally {
        this.guardando = false;
      }
    },

    buildRequest() {
      const request = {
        descripcion: String(this.form.descripcion || "").trim(),
        privacidad: this.form.privacidad,
      };

      const fecha = this.form.fechaEntregaEstipulada || "";
      const fechaOriginal = this.proyectoOriginal?.fechaEntregaEstipulada || "";
      if (fecha && fecha !== fechaOriginal) {
        request.fechaEntregaEstipulada = fecha;
      }

      const aceptaOriginal = !!this.proyectoOriginal?.aceptaPostulacionGral;
      if (!!this.form.aceptaPostulacionGral !== aceptaOriginal) {
        request.aceptaPostulacionGral = !!this.form.aceptaPostulacionGral;
      }

      if (this.form.ubicacion?.localidadId) {
        request.ubicacion = {
          provinciaId: this.form.ubicacion.provinciaId,
          localidadId: this.form.ubicacion.localidadId,
        };
      } else if (this.ubicacionQuitada && this.esBorrador) {
        request.ubicacion = null;
      }

      if (this.dirty.objetivos) {
        request.objetivos = this.form.objetivos
          .map((objetivo) => ({
            nombre: String(objetivo.nombre || "").trim(),
            descripcion: String(objetivo.descripcion || "").trim(),
          }))
          .filter((objetivo) => objetivo.nombre);
      }

      if (this.dirty.personal) {
        request.requerimientosGral = this.form.requerimientosGral
          .filter((requerimiento) => !requerimiento.satisfecho)
          .map((requerimiento) => {
            const item = {
              cantidad: Number(requerimiento.cantidad),
              idProfesion: requerimiento.idProfesion,
              descripcion: String(requerimiento.descripcion || "").trim() || undefined,
              caracteristicas: (requerimiento.caracteristicas || []).map((carac) => ({
                idCaracteristica: carac.idCaracteristica,
                valorMin: this.aNumeroONull(carac.valorMin),
                valorMax: this.aNumeroONull(carac.valorMax),
                valores: Array.isArray(carac.valores) ? carac.valores : [],
              })),
              habilidades: Array.isArray(requerimiento.habilidades)
                ? requerimiento.habilidades
                : [],
            };
            if (requerimiento.idRequerimientoGral != null) {
              item.idRequerimientoGral = requerimiento.idRequerimientoGral;
            }
            return item;
          });
      }

      if (this.dirty.moodboard) {
        const descripcion = String(this.form.moodboard || "").trim();
        if (descripcion || this.proyectoOriginal?.moodboard) {
          request.moodboard = { descripcion: descripcion || null };
        }
      }

      return request;
    },

    aNumeroONull(valor) {
      if (valor === "" || valor === null || valor === undefined) return null;
      return Number(valor);
    },

    manejarErrorCarga(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      if (clasificacion?.tipo === "perfil-activo") {
        this.errorCarga = "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion?.tipo === "perfil-no-encontrado") {
        refrescarSesion();
        this.errorCarga = "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (status === 403) {
        this.errorCarga = /perfil/i.test(mensaje)
          ? "El perfil no se encuentra activo."
          : "No tenés acceso a este proyecto.";
        return;
      }

      if (status === 404) {
        this.errorCarga = mensaje || "El proyecto no existe.";
        return;
      }

      this.errorCarga = mensajeErrorApi(
        error,
        "No se pudo cargar el proyecto. Intentá nuevamente."
      );
    },

    async manejarError(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);
      const fallback = "No se pudo modificar el proyecto. Intentá nuevamente.";

      if (!clasificacion) {
        this.mensajeError =
          status === 403 && mensaje && !error?._esSesionExpirada
            ? mensaje
            : mensajeErrorApi(error, fallback);
        return;
      }

      switch (clasificacion.tipo) {
        case "campos": {
          const errores = mapearErroresBackend(clasificacion.errores);
          const conocidos = {};
          for (const [clave, msg] of Object.entries(errores)) {
            if (raizConocida(clave)) conocidos[clave] = msg;
          }
          if (Object.keys(conocidos).length > 0) {
            this.modalConfirmar = false;
            this.erroresBackend = { ...this.erroresBackend, ...conocidos };
            this.mensajeError = "Revisá los datos marcados antes de continuar.";
            this.irAlPasoDeErrores(Object.keys(conocidos));
          } else {
            this.mensajeError = "Revisá los datos cargados.";
          }
          break;
        }

        case "campo": {
          this.modalConfirmar = false;
          this.erroresBackend = {
            ...this.erroresBackend,
            [clasificacion.campo]: clasificacion.mensaje || "Valor inválido.",
          };
          this.mensajeError = clasificacion.mensaje || "Revisá los datos marcados.";
          this.irAlPasoDeErrores([clasificacion.campo]);
          break;
        }

        case "seccion": {
          this.modalConfirmar = false;
          this.seccionErrores = {
            ...this.seccionErrores,
            requerimientosGral: [clasificacion.mensaje],
          };
          this.mensajeError = "Revisá los requerimientos de personal.";
          this.irAlPasoDeErrores(["requerimientosGral"]);
          break;
        }

        case "informacion-basica": {
          this.modalConfirmar = false;
          this.mensajeError = clasificacion.mensaje;
          this.irAPaso(1);
          break;
        }

        case "requerimiento-satisfecho":
        case "estado-inmutable": {
          this.mensajeError = clasificacion.mensaje || fallback;
          break;
        }

        case "perfil-activo": {
          this.mensajeError =
            "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
          this.$router.push({ name: "dashboard-usuario" });
          break;
        }

        case "perfil-no-encontrado": {
          await refrescarSesion();
          this.mensajeError =
            "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
          this.$router.push({ name: "dashboard-usuario" });
          break;
        }

        case "perfil-baja": {
          this.mensajeError =
            clasificacion.mensaje || "Tu perfil está dado de baja: no podés modificar proyectos.";
          break;
        }

        case "habilidad":
        case "profesion": {
          const esHabilidad = clasificacion.tipo === "habilidad";
          const mensaje =
            clasificacion.mensaje ||
            (esHabilidad
              ? "Una de las habilidades seleccionadas ya no existe. Actualizá la selección."
              : "La profesión seleccionada ya no existe.");
          this.asignarErrorRequerimiento(
            esHabilidad ? "habilidades" : "idProfesion",
            mensaje
          );
          this.mensajeError = "Revisá los requerimientos de personal.";
          this.irAlPasoDeErrores(["requerimientosGral"]);
          break;
        }

        case "duplicado": {
          this.mensajeError =
            clasificacion.mensaje || "No se pudo modificar el proyecto.";
          break;
        }

        case "generico": {
          this.mensajeError =
            clasificacion.mensaje ||
            "No se pudo modificar el proyecto. Verificá los datos ingresados.";
          break;
        }

        default: {
          this.mensajeError = mensajeErrorApi(error, fallback);
        }
      }

      if (status === 403 && !this.mensajeError) {
        this.mensajeError = mensajeErrorApi(error, fallback);
      }
    },

    asignarErrorRequerimiento(campo, mensaje) {
      const indice = this.form.requerimientosGral.findIndex(
        (requerimiento) =>
          !requerimiento.satisfecho &&
          (campo === "habilidades"
            ? (requerimiento.habilidades || []).length > 0
            : !!requerimiento.idProfesion)
      );
      if (indice >= 0) {
        this.erroresBackend = {
          ...this.erroresBackend,
          [`requerimientosGral.${indice}.${campo}`]: mensaje,
        };
        return;
      }
      this.seccionErrores = {
        ...this.seccionErrores,
        requerimientosGral: [mensaje],
      };
    },

    cancelar() {
      if (this.guardando) return;
      this.volverAlProyecto();
    },

    volverAlProyecto() {
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
      });
    },
  },
};
</script>

<style scoped>
.modificar-proyecto {
  display: grid;
  gap: 1rem;
  max-width: 1280px;
  margin: 0 auto;
}

.modificar-proyecto__titulo {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-text);
}

.modificar-proyecto__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.modificar-proyecto__form {
  display: grid;
  gap: 1.25rem;
}

.modificar-proyecto__stepper {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.modificar-proyecto__paso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.modificar-proyecto__paso-numero {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.modificar-proyecto__paso--activo {
  color: var(--color-text);
  font-weight: 600;
}

.modificar-proyecto__paso--activo .modificar-proyecto__paso-numero {
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}

.modificar-proyecto__paso-linea {
  flex: 1;
  min-width: 24px;
  height: 2px;
  margin: 0 0.75rem;
  background: var(--color-border);
}

.modificar-proyecto__paso-linea--activa {
  background: var(--color-primary);
}

.modificar-proyecto__seccion {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.modificar-proyecto__seccion-titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-text);
}

.modificar-proyecto__seccion-ayuda {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.modificar-proyecto__aviso {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--color-warning-text);
}

.modificar-proyecto__subseccion {
  display: grid;
  gap: 0.35rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.modificar-proyecto__subseccion-titulo {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.modificar-proyecto__campo-fecha {
  display: grid;
  gap: 0.2rem;
  max-width: 320px;
}

.modificar-proyecto__agregar {
  align-self: flex-start;
}

.modificar-proyecto__fila {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  align-items: center;
}

.modificar-proyecto__vacio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.modificar-proyecto__errores-seccion {
  margin: 0;
  padding: 0.75rem 1rem 0.75rem 2rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
  font-size: 0.85rem;
}

.modificar-proyecto__errores-seccion li + li {
  margin-top: 0.25rem;
}

.modificar-proyecto__postulaciones {
  display: grid;
  gap: 0.35rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.modificar-proyecto__alertas:empty {
  display: none;
}

.modificar-proyecto__acciones {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-top: 0.5rem;
}

.modificar-proyecto__nota {
  padding-left: 1.25rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.modificar-proyecto__acciones-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.modificar-proyecto__acciones-derecha {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modificar-proyecto__btn-texto {
  border-color: transparent !important;
  background: transparent !important;
  color: var(--color-text) !important;
}

.modificar-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.modificar-proyecto__estado-icono {
  font-size: 2rem;
}

.modificar-proyecto__estado-texto {
  margin: 0;
  max-width: 520px;
}

.modificar-proyecto-modal__titulo {
  margin: 0;
}

.modificar-proyecto-modal__mensaje {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.95rem;
}

.modificar-proyecto-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}
</style>
