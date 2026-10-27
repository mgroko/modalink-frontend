<template>
  <div class="crear-actividad">
    <div v-if="cargando" class="crear-actividad__estado">
      <span class="material-symbols-outlined crear-actividad__estado-icono">
        hourglass_empty
      </span>
      Cargando proyecto...
    </div>

    <template v-else>
      <template v-if="proyecto">
        <VaButton
          preset="secondary"
          icon="mso-arrow_back"
          class="crear-actividad__volver"
          @click="volverAlProyecto"
        >
          Volver a la planificación
        </VaButton>

        <ProyectoEncabezado
          :proyecto="proyecto"
          tab-activa="planificacion"
          :mostrar-planificacion="true"
          @cambiar-tab="cambiarTabEncabezado"
        />

        <section v-if="errorBloqueante" class="crear-actividad__panel">
          <BaseAlert :message="errorBloqueante" type="error" />
          <div class="crear-actividad__acciones crear-actividad__acciones--bloqueo">
            <VaButton preset="primary" @click="volverAlProyecto">
              Volver al proyecto
            </VaButton>
          </div>
        </section>

        <template v-else>
          <header class="crear-actividad__intro">
            <h1 class="crear-actividad__titulo">Nueva actividad</h1>
            <p class="crear-actividad__subtitulo">
              Definí la duración, las dependencias y el personal necesario para
              esta actividad.
            </p>
          </header>

          <div class="crear-actividad__layout">
            <VaForm
              ref="formRef"
              class="crear-actividad__form"
              @submit.prevent="crearActividad"
            >
              <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

              <div v-if="!tieneFechaEntrega" class="crear-actividad__aviso">
                <p class="crear-actividad__aviso-titulo">
                  El proyecto no tiene fecha de entrega
                </p>
                <p class="crear-actividad__aviso-texto">
                  La actividad se programa desde el final del proyecto. Completá la
                  fecha de entrega para poder crearla.
                </p>
                <VaButton
                  v-if="puedeModificar"
                  preset="secondary"
                  @click="irAModificarProyecto"
                >
                  Completar fecha de entrega
                </VaButton>
                <p v-else class="crear-actividad__aviso-texto">
                  Pedile a un miembro con permiso de edición que complete la fecha.
                </p>
              </div>

              <section class="crear-actividad__panel">
                <h2 class="crear-actividad__seccion-titulo">Datos de la actividad</h2>

                <VaInput
                  ref="nombreInput"
                  v-model="form.nombre"
                  label="Nombre de la actividad*"
                  placeholder="Ej: Sesión de fotos"
                  :max-length="LIMITES_ACTIVIDAD.NOMBRE"
                  counter
                  :error="!!errores.nombre"
                  :error-messages="errores.nombre || undefined"
                />

                <div class="crear-actividad__duracion">
                  <VaInput
                    ref="duracionInput"
                    v-model="form.duracion"
                    type="number"
                    label="Duración*"
                    placeholder="Ej: 3"
                    min="1"
                    step="1"
                    :error="!!errores.duracion"
                    :error-messages="errores.duracion || undefined"
                  />

                  <div class="crear-actividad__unidad-grupo">
                    <span class="crear-actividad__unidad-label">Unidad</span>
                    <div class="crear-actividad__unidad" role="group" aria-label="Unidad de duración">
                      <button
                        v-for="unidad in unidadesDuracion"
                        :key="unidad"
                        type="button"
                        class="crear-actividad__unidad-boton"
                        :class="{
                          'crear-actividad__unidad-boton--activa':
                            form.unidadDuracion === unidad,
                        }"
                        @click="form.unidadDuracion = unidad"
                      >
                        {{ ETIQUETAS_UNIDAD_DURACION[unidad] }}
                      </button>
                    </div>
                  </div>
                </div>

                <p v-if="errores.unidadDuracion" class="crear-actividad__error">
                  {{ errores.unidadDuracion }}
                </p>

                <VaInput
                  v-model="form.horarioPreferenciaInicio"
                  type="time"
                  label="Horario preferido de inicio"
                  hint="Opcional. No es el horario definitivo de la actividad."
                  :error="!!errores.horarioPreferenciaInicio"
                  :error-messages="errores.horarioPreferenciaInicio || undefined"
                />

                <VaTextarea
                  v-model="form.descripcion"
                  label="Descripción"
                  placeholder="Detallá el alcance de la actividad..."
                  :max-length="LIMITES_ACTIVIDAD.DESCRIPCION"
                  :rows="3"
                  counter
                  :error="!!errores.descripcion"
                  :error-messages="errores.descripcion || undefined"
                />
              </section>

              <section class="crear-actividad__panel">
                <h2 class="crear-actividad__seccion-titulo">Ubicación</h2>
                <p class="crear-actividad__seccion-ayuda">
                  Opcional. Si la actividad no se realiza en la ubicación del
                  proyecto, indicá dónde será.
                </p>

                <SelectorUbicacion
                  v-model="form.ubicacion"
                  :error="!!errores.ubicacion"
                  :error-message="errores.ubicacion || ''"
                />
              </section>

              <section class="crear-actividad__panel">
                <h2 class="crear-actividad__seccion-titulo">Predecesoras</h2>
                <p class="crear-actividad__seccion-ayuda">
                  Opcional. Seleccioná las actividades que deben finalizar antes de
                  que empiece esta.
                </p>

                <VaSelect
                  :model-value="form.predecesoras"
                  :options="actividades"
                  value-by="idActividad"
                  :text-by="etiquetaActividad"
                  label="Actividades predecesoras"
                  placeholder="Sin predecesoras"
                  multiple
                  clearable
                  :loading="cargandoActividades"
                  :error="!!errores.predecesoras"
                  :error-messages="errores.predecesoras || undefined"
                  no-options-text="No hay actividades disponibles"
                  @update:model-value="form.predecesoras = Array.isArray($event) ? $event : []"
                />

                <p v-if="!cargandoActividades && !actividades.length" class="crear-actividad__hint">
                  Todavía no hay otras actividades en el proyecto para usar como
                  predecesoras.
                </p>
                <p v-if="advertenciaActividades" class="crear-actividad__hint">
                  {{ advertenciaActividades }}
                </p>
              </section>

              <section ref="requerimientosRef" class="crear-actividad__panel">
                <header class="crear-actividad__seccion-cabecera">
                  <div>
                    <h2 class="crear-actividad__seccion-titulo">
                      Requerimientos de personal
                    </h2>
                    <p class="crear-actividad__seccion-ayuda">
                      Opcional. Agregá el personal que necesitás para esta actividad.
                    </p>
                  </div>
                  <span class="crear-actividad__contador">
                    {{ form.requerimientos.length }} cargados
                  </span>
                </header>

                <div v-if="form.requerimientos.length" class="crear-actividad__requerimientos">
                  <article
                    v-for="(requerimiento, indice) in form.requerimientos"
                    :key="requerimiento.uid"
                    class="crear-actividad__requerimiento"
                  >
                    <div class="crear-actividad__requerimiento-cabecera">
                      <div>
                        <strong class="crear-actividad__requerimiento-titulo">
                          Requerimiento {{ indice + 1 }} · {{ nombreProfesion(requerimiento.idProfesion) }}
                        </strong>
                        <span class="crear-actividad__requerimiento-meta">
                          {{ requerimiento.cantidad }}
                          {{ Number(requerimiento.cantidad) === 1 ? "persona" : "personas" }}
                        </span>
                      </div>

                      <VaButton
                        preset="secondary"
                        size="small"
                        color="danger"
                        icon="mso-delete"
                        title="Quitar requerimiento"
                        @click="quitarRequerimiento(indice)"
                      >
                        Quitar
                      </VaButton>
                    </div>

                    <p v-if="requerimiento.descripcion" class="crear-actividad__requerimiento-desc">
                      {{ requerimiento.descripcion }}
                    </p>
                    <p class="crear-actividad__requerimiento-meta">
                      {{ (requerimiento.caracteristicas || []).length }}
                      {{ (requerimiento.caracteristicas || []).length === 1 ? "característica" : "características" }}
                      configuradas
                    </p>

                    <ul
                      v-if="mensajesRequerimiento(indice).length"
                      class="crear-actividad__lista-errores"
                    >
                      <li v-for="(mensaje, i) in mensajesRequerimiento(indice)" :key="i">
                        {{ mensaje }}
                      </li>
                    </ul>
                  </article>
                </div>

                <div v-if="mostrandoDraft" class="crear-actividad__nuevo-requerimiento">
                  <div class="crear-actividad__nuevo-cabecera">
                    <h3 class="crear-actividad__nuevo-titulo">Nuevo requerimiento</h3>
                  </div>

                  <RequerimientoForm
                    v-model="requerimientoDraft"
                    :indice="form.requerimientos.length"
                    :profesiones="profesiones"
                    :errores="erroresDraft"
                    :mostrar-habilidades="false"
                    @eliminar="descartarRequerimiento"
                    @catalogo-cargado="guardarCatalogo"
                  />

                  <ul v-if="errorDraftSeccion.length" class="crear-actividad__lista-errores">
                    <li v-for="(mensaje, i) in errorDraftSeccion" :key="i">
                      {{ mensaje }}
                    </li>
                  </ul>

                  <div class="crear-actividad__nuevo-acciones">
                    <VaButton
                      preset="secondary"
                      size="small"
                      color="danger"
                      icon="mso-close"
                      title="Cancelar requerimiento"
                      aria-label="Cancelar requerimiento"
                      @click="descartarRequerimiento"
                    />
                    <VaButton
                      preset="secondary"
                      size="small"
                      color="success"
                      icon="mso-check"
                      title="Confirmar requerimiento"
                      aria-label="Confirmar requerimiento"
                      @click="agregarRequerimiento"
                    />
                  </div>
                </div>

                <VaButton
                  v-if="!mostrandoDraft"
                  preset="secondary"
                  icon="mso-add"
                  class="crear-actividad__agregar-requerimiento"
                  @click="iniciarRequerimiento"
                >
                  Agregar requerimiento
                </VaButton>

                <ul
                  v-if="seccionErrores.requerimientos?.length"
                  class="crear-actividad__lista-errores"
                >
                  <li v-for="(mensaje, i) in seccionErrores.requerimientos" :key="i">
                    {{ mensaje }}
                  </li>
                </ul>
              </section>

              <div class="crear-actividad__acciones">
                <VaButton
                  preset="secondary"
                  :disabled="guardando"
                  @click="cancelar"
                >
                  Cancelar
                </VaButton>
                <VaButton
                  type="submit"
                  preset="primary"
                  :loading="guardando"
                  :disabled="guardando"
                >
                  Crear actividad
                </VaButton>
              </div>
            </VaForm>

            <aside class="crear-actividad__resumen">
              <h2 class="crear-actividad__resumen-titulo">Resumen de planificación</h2>

              <dl class="crear-actividad__resumen-lista">
                <div>
                  <dt>Fecha de entrega</dt>
                  <dd>{{ fechaEntregaTexto }}</dd>
                </div>
                <div>
                  <dt>Duración</dt>
                  <dd>{{ duracionResumen }}</dd>
                </div>
                <div>
                  <dt>Inicio estimado</dt>
                  <dd>{{ inicioEstimadoTexto }}</dd>
                </div>
                <div>
                  <dt>Fin estimado</dt>
                  <dd>{{ finEstimadoTexto }}</dd>
                </div>
                <div>
                  <dt>Predecesoras</dt>
                  <dd>{{ form.predecesoras.length }}</dd>
                </div>
                <div>
                  <dt>Personal requerido</dt>
                  <dd>{{ totalPersonasRequeridas }}</dd>
                </div>
              </dl>

              <p v-if="advertenciaInicio" class="crear-actividad__resumen-aviso">
                {{ advertenciaInicio }}
              </p>

              <p class="crear-actividad__resumen-nota">
                El inicio definitivo se calcula automáticamente al guardar la
                actividad.
              </p>
            </aside>
          </div>
        </template>
      </template>

      <section v-else class="crear-actividad__estado">
        <span class="material-symbols-outlined crear-actividad__estado-icono">
          folder_open
        </span>
        <p class="crear-actividad__estado-titulo">No se pudo cargar el proyecto</p>
        <p class="crear-actividad__estado-texto">
          {{ errorCarga || "No encontramos el proyecto que estás buscando." }}
        </p>
        <div class="crear-actividad__estado-acciones">
          <VaButton v-if="puedeReintentar" preset="primary" @click="cargar">
            Reintentar
          </VaButton>
          <VaButton preset="secondary" @click="irAProyectos">
            Volver a Proyectos
          </VaButton>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService";
import perfilService from "../../services/perfilService.js";
import actividadService from "../../services/actividadService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import ProyectoEncabezado from "../../components/proyecto/ProyectoEncabezado.vue";
import SelectorUbicacion from "../../components/proyecto/SelectorUbicacion.vue";
import RequerimientoForm from "../../components/proyecto/RequerimientoForm.vue";
import {
  ETIQUETAS_UNIDAD_DURACION,
  LIMITES_ACTIVIDAD,
  MINUTOS_POR_UNIDAD,
  UNIDADES_DURACION,
  calcularInicioEstimado,
  etiquetaEstadoActividad,
  finDelDiaEntrega,
  formatearDuracionMinutos,
  parseFechaLocal,
} from "../../utils/actividadConstants.js";
import {
  buildActividadRequest,
  mapearErroresActividad,
  validarActividad,
} from "../../utils/validacionesActividad.js";
import { validarRequerimiento } from "../../utils/validacionesProyecto.js";
import { formatearFecha, formatearFechaCorta } from "../../utils/fechas.js";
import { mensajeErrorApi } from "../../utils/apiError";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import {
  ESTADOS_PROYECTO,
  normalizarEstadoProyecto,
} from "../../utils/proyectoConstants.js";

const ESTADOS_CON_ACTIVIDADES = [
  ESTADOS_PROYECTO.BORRADOR,
  ESTADOS_PROYECTO.PUBLICADO,
  ESTADOS_PROYECTO.CONFIRMADO,
];

let controladorCarga = null;

export default {
  name: "CrearActividadView",
  components: {
    BaseAlert,
    ProyectoEncabezado,
    SelectorUbicacion,
    RequerimientoForm,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      ETIQUETAS_UNIDAD_DURACION,
      LIMITES_ACTIVIDAD,
      proyecto: null,
      cargando: true,
      errorCarga: "",
      puedeReintentar: false,
      errorBloqueante: "",
      mensajeError: "",
      guardando: false,
      profesiones: [],
      actividades: [],
      cargandoActividades: false,
      advertenciaActividades: "",
      catalogosPorProfesion: {},
      form: {
        nombre: "",
        descripcion: "",
        duracion: "",
        unidadDuracion: UNIDADES_DURACION.DIAS,
        horarioPreferenciaInicio: "",
        ubicacion: null,
        predecesoras: [],
        requerimientos: [],
      },
      mostrandoDraft: false,
      requerimientoDraft: this.nuevoRequerimiento(0),
      errores: {},
      seccionErrores: {},
      erroresDraft: {},
      errorDraftSeccion: [],
      siguienteUid: 0,
      idCarga: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    unidadesDuracion() {
      return Object.values(UNIDADES_DURACION);
    },
    permisos() {
      return this.proyecto?.permisos || [];
    },
    esMiembro() {
      return !!this.proyecto?.esMiembro;
    },
    estadoNormalizado() {
      return normalizarEstadoProyecto(this.proyecto?.estado);
    },
    estadoPermiteActividades() {
      return ESTADOS_CON_ACTIVIDADES.includes(this.estadoNormalizado);
    },
    puedeCrear() {
      return (
        this.permisos.includes("CREAR_ACTIVIDAD") && this.estadoPermiteActividades
      );
    },
    puedeModificar() {
      return this.permisos.includes("MODIFICAR_PROYECTO");
    },
    tieneFechaEntrega() {
      return !!this.proyecto?.fechaEntregaEstipulada;
    },
    inicioEstimado() {
      return calcularInicioEstimado(
        this.proyecto?.fechaEntregaEstipulada,
        this.form.duracion,
        this.form.unidadDuracion
      );
    },
    finEstimado() {
      return finDelDiaEntrega(this.proyecto?.fechaEntregaEstipulada);
    },
    fechaEntregaTexto() {
      return formatearFechaCorta(this.proyecto?.fechaEntregaEstipulada);
    },
    duracionResumen() {
      const cantidad = Number(this.form.duracion);
      const minutosPorUnidad = MINUTOS_POR_UNIDAD[this.form.unidadDuracion];
      if (!Number.isFinite(cantidad) || cantidad <= 0 || !minutosPorUnidad) {
        return "—";
      }
      return formatearDuracionMinutos(cantidad * minutosPorUnidad);
    },
    inicioEstimadoTexto() {
      return this.inicioEstimado ? formatearFecha(this.inicioEstimado) : "—";
    },
    finEstimadoTexto() {
      return this.finEstimado ? formatearFecha(this.finEstimado) : "—";
    },
    advertenciaInicio() {
      if (!this.inicioEstimado || !this.proyecto?.fechaInicio) return "";
      const inicioProyecto = parseFechaLocal(this.proyecto.fechaInicio);
      if (!inicioProyecto) return "";
      if (this.inicioEstimado.getTime() < inicioProyecto.getTime()) {
        return "La actividad podría comenzar antes de la fecha de inicio del proyecto. Revisá la duración.";
      }
      return "";
    },
    totalPersonasRequeridas() {
      return this.form.requerimientos.reduce(
        (total, requerimiento) => total + (Number(requerimiento.cantidad) || 0),
        0
      );
    },
    draftTieneDatos() {
      const draft = this.requerimientoDraft;
      return (
        !!draft.idProfesion ||
        String(draft.descripcion || "").trim() !== "" ||
        (draft.caracteristicas || []).length > 0 ||
        Number(draft.cantidad) !== 1
      );
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.proyecto = null;
      this.cargar();
    },
  },
  created() {
    this.controladorCarga = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
  },
  methods: {
    nuevoRequerimiento(uid) {
      return {
        uid,
        cantidad: 1,
        idProfesion: null,
        descripcion: "",
        caracteristicas: [],
        habilidades: [],
      };
    },
    crearRequerimientoVacio() {
      this.siguienteUid += 1;
      return this.nuevoRequerimiento(this.siguienteUid);
    },
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      this.cargando = true;
      this.errorCarga = "";
      this.puedeReintentar = false;
      this.errorBloqueante = "";
      this.mensajeError = "";

      try {
        const response = await proyectoService.obtener(
          this.idProyecto,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;

        const proyecto = response?.data || null;
        if (!proyecto) {
          this.errorCarga = "No encontramos el proyecto que estás buscando.";
          return;
        }

        this.proyecto = proyecto;

        if (!proyecto.esMiembro) {
          this.$router.replace({
            name: "dashboard-proyecto",
            params: { id: proyecto.idProyecto },
            query: { tab: "informacion" },
          });
          return;
        }

        if (!this.estadoPermiteActividades) {
          this.errorBloqueante = `El proyecto está ${this.estadoNormalizado.toLowerCase()} y no admite nuevas actividades.`;
          return;
        }

        if (!this.puedeCrear) {
          this.errorBloqueante =
            "No tenés permiso para crear actividades en este proyecto.";
          return;
        }

        await Promise.all([
          this.cargarProfesiones(),
          this.cargarActividades(),
        ]);
      } catch (error) {
        if (
          corrida !== this.idCarga ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        await this.manejarErrorCarga(error);
      } finally {
        if (corrida === this.idCarga) this.cargando = false;
      }
    },
    async cargarProfesiones() {
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      }
    },
    async cargarActividades() {
      this.cargandoActividades = true;
      this.advertenciaActividades = "";
      try {
        const response = await actividadService.buscar(this.idProyecto, {
          todos: true,
        });
        const contenido = response?.data?.contenido;
        this.actividades = Array.isArray(contenido) ? contenido : [];
      } catch {
        this.actividades = [];
        this.advertenciaActividades =
          "No se pudieron cargar las actividades existentes. Podés continuar, pero no vas a poder elegir predecesoras.";
      } finally {
        this.cargandoActividades = false;
      }
    },
    async manejarErrorCarga(error) {
      const clasificacion = clasificarErrorProyecto(error);
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";

      this.proyecto = null;

      if (clasificacion?.tipo === "perfil-activo") {
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion?.tipo === "perfil-no-encontrado") {
        await refrescarSesion();
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
        this.errorCarga = /proyecto/i.test(mensaje)
          ? mensaje
          : mensajeErrorApi(error, "No se pudo cargar el proyecto.");
        return;
      }

      if (status === 409 || clasificacion?.tipo === "perfil-baja") {
        this.errorCarga = "El perfil no se encuentra activo.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.errorCarga =
          "Ocurrió un error al cargar el proyecto. Inténtalo nuevamente.";
        return;
      }

      this.errorCarga = mensajeErrorApi(
        error,
        "No se pudo cargar el proyecto."
      );
    },
    guardarCatalogo({ idProfesion, caracteristicas }) {
      this.catalogosPorProfesion = {
        ...this.catalogosPorProfesion,
        [idProfesion]: caracteristicas,
      };
    },
    iniciarRequerimiento() {
      this.requerimientoDraft = this.crearRequerimientoVacio();
      this.erroresDraft = {};
      this.errorDraftSeccion = [];
      this.mostrandoDraft = true;
    },
    agregarRequerimiento() {
      const { campos, seccion } = validarRequerimiento(
        this.requerimientoDraft,
        this.catalogosPorProfesion[this.requerimientoDraft.idProfesion]
      );

      this.erroresDraft = campos;
      this.errorDraftSeccion = seccion;

      if (Object.keys(campos).length || seccion.length) {
        this.mensajeError = "Revisá el requerimiento antes de agregarlo.";
        this.$refs.requerimientosRef?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      this.form.requerimientos.push(
        JSON.parse(JSON.stringify(this.requerimientoDraft))
      );
      this.descartarRequerimiento();
      this.mensajeError = "";
    },
    descartarRequerimiento() {
      this.requerimientoDraft = this.crearRequerimientoVacio();
      this.erroresDraft = {};
      this.errorDraftSeccion = [];
      this.mostrandoDraft = false;
      if (this.mensajeError === "Revisá el requerimiento antes de agregarlo.") {
        this.mensajeError = "";
      }
    },
    quitarRequerimiento(indice) {
      this.form.requerimientos.splice(indice, 1);

      const errores = {};
      for (const [clave, mensaje] of Object.entries(this.errores)) {
        if (!clave.startsWith("requerimientos.")) errores[clave] = mensaje;
      }
      this.errores = errores;

      const secciones = { ...this.seccionErrores };
      delete secciones.requerimientos;
      this.seccionErrores = secciones;
    },
    nombreProfesion(idProfesion) {
      const profesion = this.profesiones.find(
        (p) => Number(p.idProfesion) === Number(idProfesion)
      );
      if (!profesion) return "Profesión sin definir";
      return this.capitalizar(profesion.nombre);
    },
    capitalizar(texto) {
      if (!texto) return "";
      return String(texto)
        .toLowerCase()
        .split(/[_\-.]+/)
        .filter(Boolean)
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(" ");
    },
    etiquetaActividad(actividad) {
      if (!actividad) return "";
      return `${actividad.nombre} · ${etiquetaEstadoActividad(actividad.estado)}`;
    },
    mensajesRequerimiento(indice) {
      return Object.values(this.erroresDeRequerimiento(indice));
    },
    erroresDeRequerimiento(indice) {
      const prefijo = `requerimientos.${indice}.`;
      const relativos = {};
      for (const [clave, mensaje] of Object.entries(this.errores)) {
        if (clave.startsWith(prefijo)) {
          relativos[clave.slice(prefijo.length)] = mensaje;
        }
      }
      return relativos;
    },
    async crearActividad() {
      if (this.guardando || this.errorBloqueante) return;

      this.mensajeError = "";
      this.errores = {};
      this.seccionErrores = {};

      if (!this.tieneFechaEntrega) {
        this.mensajeError =
          "El proyecto necesita una fecha de entrega para programar actividades.";
        return;
      }

      if (this.mostrandoDraft) {
        if (this.draftTieneDatos) {
          const { campos, seccion } = validarRequerimiento(
            this.requerimientoDraft,
            this.catalogosPorProfesion[this.requerimientoDraft.idProfesion]
          );
          this.erroresDraft = campos;
          this.errorDraftSeccion = seccion;
          this.mensajeError =
            "Agregá o descartá el requerimiento pendiente antes de crear la actividad.";
          this.$refs.requerimientosRef?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }

        this.descartarRequerimiento();
      }

      const { campos, secciones } = validarActividad(
        this.form,
        this.catalogosPorProfesion,
        this.actividades
      );
      this.errores = campos;
      this.seccionErrores = secciones;

      if (Object.keys(campos).length || Object.keys(secciones).length) {
        this.mensajeError = "Revisá los datos marcados antes de continuar.";
        this.enfocarPrimerError();
        return;
      }

      this.guardando = true;

      try {
        const response = await actividadService.crear(
          this.idProyecto,
          buildActividadRequest(this.form)
        );
        const actividad = response?.data;

        this.toast.init({
          title: "Actividad creada",
          message: "La actividad se agregó a la planificación del proyecto.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });

        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
          query: {
            tab: "planificacion",
            nueva: actividad?.idActividad,
          },
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorCreacion(error);
      } finally {
        this.guardando = false;
      }
    },
    async manejarErrorCreacion(error) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      const mensaje = data.message || data.mensaje || "";

      if (status === 400) {
        if (data.errores && typeof data.errores === "object") {
          this.errores = mapearErroresActividad(data.errores);
          const tieneRequerimientos = Object.keys(this.errores).some((clave) =>
            clave.startsWith("requerimientos.")
          );
          if (tieneRequerimientos) {
            this.seccionErrores = {
              ...this.seccionErrores,
              requerimientos: [
                "Revisá los requerimientos marcados. Si el error persiste, quitá el requerimiento y volvé a agregarlo.",
              ],
            };
          }
          this.mensajeError = "Revisá los datos marcados antes de continuar.";
        } else {
          this.mensajeError =
            mensaje || "No se pudo crear la actividad. Revisá los datos.";
        }

        if (/fecha/i.test(mensaje)) {
          this.mensajeError = mensaje;
        }
        this.enfocarPrimerError();
        return;
      }

      if (status === 403) {
        this.errorBloqueante =
          mensaje ||
          "No tenés permiso para crear actividades en este proyecto.";
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }
        this.errorBloqueante = /proyecto/i.test(mensaje)
          ? mensaje
          : mensaje ||
            "El proyecto o su planificación ya no están disponibles.";
        return;
      }

      if (status === 409) {
        if (/nombre|existe|duplicad/i.test(mensaje)) {
          this.errores = {
            ...this.errores,
            nombre: mensaje || "Ya existe una actividad con ese nombre.",
          };
          this.mensajeError = "Revisá el nombre de la actividad.";
          this.enfocarPrimerError();
          return;
        }

        if (/estado|finaliz|cancel/i.test(mensaje)) {
          this.errorBloqueante = mensaje;
          return;
        }

        this.mensajeError = `${mensaje || "El cronograma no admite esta actividad."} Probá reduciendo la duración o revisando las predecesoras.`;
        return;
      }

      if (!status || status >= 500) {
        this.mensajeError =
          "Ocurrió un error al crear la actividad. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudo crear la actividad."
      );
    },
    enfocarPrimerError() {
      this.$nextTick(() => {
        const claves = Object.keys(this.errores);
        if (claves.includes("nombre")) {
          this.$refs.nombreInput?.focus?.();
          return;
        }
        if (claves.includes("duracion")) {
          this.$refs.duracionInput?.focus?.();
          return;
        }
        if (claves.some((clave) => clave.startsWith("requerimientos."))) {
          this.$refs.requerimientosRef?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }
        this.$refs.formRef?.$el?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    cambiarTabEncabezado(tab) {
      if (this.guardando) return;
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab: tab === "planificacion" ? "planificacion" : "informacion" },
      });
    },
    cancelar() {
      if (this.guardando) return;
      this.volverAlProyecto();
    },
    volverAlProyecto() {
      const tab = this.esMiembro ? "planificacion" : "informacion";
      this.$router.push({
        name: "dashboard-proyecto",
        params: { id: this.idProyecto },
        query: { tab },
      });
    },
    irAModificarProyecto() {
      if (!this.puedeModificar) return;
      this.$router.push({
        name: "modificar-proyecto",
        params: { id: this.idProyecto },
      });
    },
    irAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
  },
};
</script>

<style scoped>
.crear-actividad {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.crear-actividad__volver {
  align-self: flex-start;
}

.crear-actividad__intro {
  padding: 0.4rem 0 0;
}

.crear-actividad__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 600;
}

.crear-actividad__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.crear-actividad__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1rem;
  align-items: start;
}

.crear-actividad__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.crear-actividad__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.crear-actividad__seccion-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.crear-actividad__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.crear-actividad__seccion-ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.crear-actividad__contador {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.crear-actividad__duracion {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) auto;
  gap: 1rem;
  align-items: end;
}

.crear-actividad__unidad-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.crear-actividad__unidad-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.crear-actividad__unidad {
  display: inline-flex;
  padding: 0.2rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.crear-actividad__unidad-boton {
  padding: 0.45rem 0.9rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.crear-actividad__unidad-boton--activa {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
}

.crear-actividad__error {
  margin: -0.35rem 0 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.crear-actividad__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.crear-actividad__requerimientos {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.crear-actividad__requerimiento {
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.crear-actividad__requerimiento-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.crear-actividad__requerimiento-titulo {
  display: block;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.crear-actividad__requerimiento-meta {
  display: block;
  margin-top: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.crear-actividad__requerimiento-desc {
  margin: 0.4rem 0 0;
  color: var(--color-text);
  font-size: 0.8rem;
}

.crear-actividad__nuevo-requerimiento {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.35rem;
}

.crear-actividad__nuevo-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.crear-actividad__nuevo-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
}

.crear-actividad__nuevo-acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.crear-actividad__agregar-requerimiento {
  align-self: flex-start;
}

.crear-actividad__lista-errores {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.crear-actividad__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.crear-actividad__acciones--bloqueo {
  margin-top: 0.25rem;
  justify-content: flex-start;
}

.crear-actividad__resumen {
  position: sticky;
  top: 1rem;
  padding: 1.1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.crear-actividad__resumen-titulo {
  margin: 0 0 0.85rem;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.crear-actividad__resumen-lista {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.crear-actividad__resumen-lista div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}

.crear-actividad__resumen-lista dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.crear-actividad__resumen-lista dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: right;
}

.crear-actividad__resumen-aviso {
  margin: 0.9rem 0 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 7px;
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.76rem;
  line-height: 1.4;
}

.crear-actividad__resumen-nota {
  margin: 0.9rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.4;
}

.crear-actividad__aviso {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
}

.crear-actividad__aviso-titulo {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.crear-actividad__aviso-texto {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.8rem;
}

.crear-actividad__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-align: center;
}

.crear-actividad__estado-icono {
  font-size: 2.1rem;
}

.crear-actividad__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.crear-actividad__estado-texto {
  margin: 0;
  max-width: 440px;
  font-size: 0.84rem;
}

.crear-actividad__estado-acciones {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

@media (max-width: 900px) {
  .crear-actividad__layout {
    grid-template-columns: 1fr;
  }

  .crear-actividad__resumen {
    position: static;
  }
}

@media (max-width: 560px) {
  .crear-actividad__duracion {
    grid-template-columns: 1fr;
  }
}
</style>
