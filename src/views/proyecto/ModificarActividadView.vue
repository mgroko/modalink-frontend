<template>
  <div class="modificar-actividad">
    <div v-if="cargando" class="modificar-actividad__estado">
      <span class="material-symbols-outlined modificar-actividad__estado-icono">
        hourglass_empty
      </span>
      Cargando actividad...
    </div>

    <template v-else>
      <template v-if="proyecto">
        <VaButton
          preset="secondary"
          icon="mso-arrow_back"
          class="modificar-actividad__volver"
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

        <section v-if="errorBloqueante" class="modificar-actividad__panel">
          <BaseAlert :message="errorBloqueante" type="error" />
          <div class="modificar-actividad__acciones modificar-actividad__acciones--bloqueo">
            <VaButton preset="primary" @click="volverAlProyecto">
              Volver a la planificación
            </VaButton>
          </div>
        </section>

        <template v-else-if="actividad">
          <header class="modificar-actividad__intro">
            <div>
              <h1 class="modificar-actividad__titulo">Editar actividad</h1>
              <p class="modificar-actividad__subtitulo">
                Actualizá los datos de la actividad. Los cambios recalculan el
                cronograma del proyecto.
              </p>
            </div>
            <span
              class="modificar-actividad__estado-actual"
              :style="estiloEstado(form.estado)"
            >
              {{ etiquetaEstadoActividad(form.estado) }}
            </span>
          </header>

          <div class="modificar-actividad__layout">
            <VaForm
              ref="formRef"
              class="modificar-actividad__form"
              @submit.prevent="guardar"
            >
              <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

              <div v-if="!tieneFechaEntrega" class="modificar-actividad__aviso">
                <p class="modificar-actividad__aviso-titulo">
                  El proyecto no tiene fecha de entrega
                </p>
                <p class="modificar-actividad__aviso-texto">
                  No se puede reprogramar la actividad sin una fecha de entrega.
                  Completala desde la edición del proyecto.
                </p>
                <VaButton
                  v-if="puedeModificarProyecto"
                  preset="secondary"
                  @click="irAModificarProyecto"
                >
                  Completar fecha de entrega
                </VaButton>
              </div>

              <section class="modificar-actividad__panel">
                <h2 class="modificar-actividad__seccion-titulo">Datos de la actividad</h2>

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

                <div class="modificar-actividad__duracion">
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

                  <div class="modificar-actividad__unidad-grupo">
                    <span class="modificar-actividad__unidad-label">Unidad</span>
                    <div
                      class="modificar-actividad__unidad"
                      role="group"
                      aria-label="Unidad de duración"
                    >
                      <button
                        v-for="unidad in unidadesDuracion"
                        :key="unidad"
                        type="button"
                        class="modificar-actividad__unidad-boton"
                        :class="{
                          'modificar-actividad__unidad-boton--activa':
                            form.unidadDuracion === unidad,
                        }"
                        @click="form.unidadDuracion = unidad"
                      >
                        {{ ETIQUETAS_UNIDAD_DURACION[unidad] }}
                      </button>
                    </div>
                  </div>
                </div>

                <p v-if="errores.unidadDuracion" class="modificar-actividad__error">
                  {{ errores.unidadDuracion }}
                </p>

                <VaSelect
                  ref="estadoSelect"
                  v-model="form.estado"
                  :options="opcionesEstado"
                  value-by="value"
                  text-by="text"
                  label="Estado*"
                  :error="!!errores.estado"
                  :error-messages="errores.estado || undefined"
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

              <section class="modificar-actividad__panel">
                <div class="modificar-actividad__seccion-cabecera">
                  <div>
                    <h2 class="modificar-actividad__seccion-titulo">Ubicación</h2>
                    <p class="modificar-actividad__seccion-ayuda">
                      Opcional. Si la quitás, la actividad queda sin ubicación.
                    </p>
                  </div>
                  <VaButton
                    v-if="form.ubicacion"
                    preset="secondary"
                    size="small"
                    color="danger"
                    icon="mso-close"
                    title="Quitar ubicación"
                    @click="quitarUbicacion"
                  >
                    Quitar ubicación
                  </VaButton>
                </div>

                <SelectorUbicacion
                  v-model="form.ubicacion"
                  :error="!!errores.ubicacion"
                  :error-message="errores.ubicacion || ''"
                />
              </section>

              <section class="modificar-actividad__panel">
                <h2 class="modificar-actividad__seccion-titulo">Predecesoras</h2>
                <p class="modificar-actividad__seccion-ayuda">
                  Seleccioná las actividades que deben finalizar antes de que
                  empiece esta.
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

                <p
                  v-if="!cargandoActividades && !actividades.length"
                  class="modificar-actividad__hint"
                >
                  No hay otras actividades en el proyecto para usar como predecesoras.
                </p>
                <p v-if="advertenciaActividades" class="modificar-actividad__hint">
                  {{ advertenciaActividades }}
                </p>
              </section>

              <section ref="requerimientosRef" class="modificar-actividad__panel">
                <header class="modificar-actividad__seccion-cabecera">
                  <div>
                    <h2 class="modificar-actividad__seccion-titulo">
                      Requerimientos de personal
                    </h2>
                    <p class="modificar-actividad__seccion-ayuda">
                      Podés editar o quitar los requerimientos existentes y agregar nuevos.
                    </p>
                  </div>
                  <span class="modificar-actividad__contador">
                    {{ form.requerimientos.length }} cargados
                  </span>
                </header>

                <div
                  v-if="form.requerimientos.length"
                  class="modificar-actividad__requerimientos"
                >
                  <article
                    v-for="(requerimiento, indice) in form.requerimientos"
                    :key="requerimiento.uid"
                    class="modificar-actividad__requerimiento"
                  >
                    <div class="modificar-actividad__requerimiento-cabecera">
                      <div>
                        <strong class="modificar-actividad__requerimiento-titulo">
                          Requerimiento {{ indice + 1 }} · {{ nombreProfesion(requerimiento.idProfesion) }}
                        </strong>
                        <span class="modificar-actividad__requerimiento-meta">
                          {{ requerimiento.cantidad }}
                          {{ Number(requerimiento.cantidad) === 1 ? "persona" : "personas" }}
                        </span>
                      </div>

                      <div class="modificar-actividad__requerimiento-acciones">
                        <VaButton
                          preset="secondary"
                          size="small"
                          icon="mso-edit"
                          @click="abrirEditarRequerimiento(indice)"
                        >
                          Editar
                        </VaButton>
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
                    </div>

                    <p
                      v-if="requerimiento.descripcion"
                      class="modificar-actividad__requerimiento-desc"
                    >
                      {{ requerimiento.descripcion }}
                    </p>
                    <p class="modificar-actividad__requerimiento-meta">
                      {{ (requerimiento.caracteristicas || []).length }}
                      {{ (requerimiento.caracteristicas || []).length === 1 ? "característica" : "características" }}
                      · {{ (requerimiento.habilidades || []).length }}
                      {{ (requerimiento.habilidades || []).length === 1 ? "habilidad" : "habilidades" }}
                    </p>

                    <ul
                      v-if="mensajesRequerimiento(indice).length"
                      class="modificar-actividad__lista-errores"
                    >
                      <li v-for="(mensaje, i) in mensajesRequerimiento(indice)" :key="i">
                        {{ mensaje }}
                      </li>
                    </ul>
                  </article>
                </div>

                <p v-else class="modificar-actividad__hint">
                  Esta actividad no tiene requerimientos de personal cargados.
                </p>

                <VaButton
                  preset="secondary"
                  icon="mso-add"
                  class="modificar-actividad__agregar-requerimiento"
                  @click="abrirNuevoRequerimiento"
                >
                  Agregar requerimiento
                </VaButton>

                <ul
                  v-if="seccionErrores.requerimientos?.length"
                  class="modificar-actividad__lista-errores"
                >
                  <li v-for="(mensaje, i) in seccionErrores.requerimientos" :key="i">
                    {{ mensaje }}
                  </li>
                </ul>
              </section>

              <div class="modificar-actividad__acciones">
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
                  :disabled="guardando || !tieneFechaEntrega"
                >
                  Guardar cambios
                </VaButton>
              </div>
            </VaForm>

            <aside class="modificar-actividad__resumen">
              <h2 class="modificar-actividad__resumen-titulo">Resumen</h2>

              <dl class="modificar-actividad__resumen-lista">
                <div>
                  <dt>Estado actual</dt>
                  <dd>{{ etiquetaEstadoActividad(estadoOriginal) }}</dd>
                </div>
                <div>
                  <dt>Estado del cronograma</dt>
                  <dd>{{ estadoCronogramaTexto }}</dd>
                </div>
                <div>
                  <dt>Requerimientos</dt>
                  <dd>{{ form.requerimientos.length }} cargados</dd>
                </div>
                <div>
                  <dt>Personal requerido</dt>
                  <dd>{{ totalPersonasRequeridas }}</dd>
                </div>
                <div>
                  <dt>Fecha de entrega</dt>
                  <dd>{{ fechaEntregaTexto }}</dd>
                </div>
              </dl>

              <div class="modificar-actividad__resumen-fechas">
                <span class="modificar-actividad__resumen-fechas-label">
                  Fechas actuales
                </span>
                <span>{{ rangoFechasActuales }}</span>
              </div>

              <p class="modificar-actividad__resumen-nota">
                Al guardar, el cronograma se recalcula y las fechas de otras
                actividades pueden cambiar.
              </p>
            </aside>
          </div>
        </template>

        <section v-else class="modificar-actividad__estado">
          <span class="material-symbols-outlined modificar-actividad__estado-icono">
            error
          </span>
          <p class="modificar-actividad__estado-titulo">
            No se pudo cargar la actividad
          </p>
          <p class="modificar-actividad__estado-texto">
            {{ errorCarga || "No encontramos la actividad que estás buscando." }}
          </p>
          <div class="modificar-actividad__estado-acciones">
            <VaButton v-if="puedeReintentar" preset="primary" @click="cargar">
              Reintentar
            </VaButton>
            <VaButton preset="secondary" @click="volverAlProyecto">
              Volver a la planificación
            </VaButton>
          </div>
        </section>
      </template>

      <section v-else class="modificar-actividad__estado">
        <span class="material-symbols-outlined modificar-actividad__estado-icono">
          folder_open
        </span>
        <p class="modificar-actividad__estado-titulo">No se pudo cargar el proyecto</p>
        <p class="modificar-actividad__estado-texto">
          {{ errorCarga || "No encontramos el proyecto que estás buscando." }}
        </p>
        <div class="modificar-actividad__estado-acciones">
          <VaButton v-if="puedeReintentar" preset="primary" @click="cargar">
            Reintentar
          </VaButton>
          <VaButton preset="secondary" @click="irAProyectos">
            Volver a Proyectos
          </VaButton>
        </div>
      </section>
    </template>

    <VaModal
      v-model="modalRequerimientoVisible"
      hide-default-actions
      size="large"
      :no-dismiss="guardandoRequerimiento"
      blur
      class="modificar-actividad-modal"
    >
      <template #header>
        <h3 class="va-h5 modificar-actividad-modal__titulo">
          {{ tituloModalRequerimiento }}
        </h3>
      </template>

      <RequerimientoForm
        :key="modalRequerimientoKey"
        v-model="requerimientoDraft"
        :indice="indiceDraft"
        :profesiones="profesiones"
        :habilidades="habilidades"
        :cargando-habilidades="cargandoHabilidades"
        :errores="erroresDraft"
        :mostrar-eliminar="false"
        @catalogo-cargado="guardarCatalogo"
      />

      <ul v-if="errorDraftSeccion.length" class="modificar-actividad__lista-errores">
        <li v-for="(mensaje, i) in errorDraftSeccion" :key="i">
          {{ mensaje }}
        </li>
      </ul>

      <template #footer>
        <div class="modificar-actividad-modal__acciones">
          <VaButton
            preset="secondary"
            :disabled="guardandoRequerimiento"
            @click="cerrarModalRequerimiento"
          >
            Cancelar
          </VaButton>
          <VaButton
            preset="primary"
            :loading="guardandoRequerimiento"
            @click="guardarRequerimiento"
          >
            {{ indiceRequerimientoEnEdicion == null ? "Agregar" : "Guardar" }}
          </VaButton>
        </div>
      </template>
    </VaModal>

    <VaModal
      v-model="modalEstadoVisible"
      hide-default-actions
      size="small"
      :no-dismiss="guardando"
      blur
      class="modificar-actividad-modal"
    >
      <template #header>
        <h3 class="va-h5 modificar-actividad-modal__titulo">Cambiar estado</h3>
      </template>

      <p class="modificar-actividad-modal__mensaje">
        {{ mensajeConfirmacionEstado }}
      </p>

      <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

      <template #footer>
        <div class="modificar-actividad-modal__acciones">
          <VaButton
            preset="secondary"
            :disabled="guardando"
            @click="cancelarConfirmacionEstado"
          >
            Cancelar
          </VaButton>
          <VaButton
            preset="primary"
            :loading="guardando"
            @click="confirmarCambioEstado"
          >
            Continuar
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService";
import perfilService from "../../services/perfilService.js";
import actividadService from "../../services/actividadService.js";
import habilidadService from "../../services/habilidadService.js";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import BaseAlert from "../../components/AlertaBase.vue";
import ProyectoEncabezado from "../../components/proyecto/ProyectoEncabezado.vue";
import SelectorUbicacion from "../../components/proyecto/SelectorUbicacion.vue";
import RequerimientoForm from "../../components/proyecto/RequerimientoForm.vue";
import {
  ESTADOS_ACTIVIDAD,
  ESTADOS_CRONOGRAMA,
  ETIQUETAS_ESTADO_ACTIVIDAD,
  ETIQUETAS_ESTADO_CRONOGRAMA,
  ETIQUETAS_UNIDAD_DURACION,
  LIMITES_ACTIVIDAD,
  MINUTOS_POR_UNIDAD,
  UNIDADES_DURACION,
  coloresEstadoActividad,
  descomponerDuracionMinutos,
  estadosPermitidosActividad,
  etiquetaEstadoActividad,
  formatearDuracionMinutos,
  normalizarEstadoActividad,
  puedeEditarActividad,
} from "../../utils/actividadConstants.js";
import {
  buildModificarActividadRequest,
  mapearErroresActividad,
  validarActividadEdicion,
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
let controladorGuardado = null;

export default {
  name: "ModificarActividadView",
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
      actividad: null,
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
      habilidades: [],
      cargandoHabilidades: false,
      catalogosPorProfesion: {},
      form: {
        nombre: "",
        descripcion: "",
        duracion: "",
        unidadDuracion: UNIDADES_DURACION.HORAS,
        estado: ESTADOS_ACTIVIDAD.PENDIENTE,
        ubicacion: null,
        predecesoras: [],
        requerimientos: [],
      },
      errores: {},
      seccionErrores: {},
      modalRequerimientoVisible: false,
      indiceRequerimientoEnEdicion: null,
      indiceDraft: 0,
      requerimientoDraft: this.nuevoRequerimiento(0),
      erroresDraft: {},
      errorDraftSeccion: [],
      guardandoRequerimiento: false,
      modalRequerimientoKey: 0,
      modalEstadoVisible: false,
      siguienteUid: 0,
      idCarga: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    idActividad() {
      return this.$route.params.idActividad;
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
    puedeModificarActividad() {
      return this.permisos.includes("MODIFICAR_ACTIVIDAD");
    },
    puedeModificarProyecto() {
      return this.permisos.includes("MODIFICAR_PROYECTO");
    },
    tieneFechaEntrega() {
      return !!this.proyecto?.fechaEntregaEstipulada;
    },
    estadoOriginal() {
      return this.actividad
        ? normalizarEstadoActividad(this.actividad.estado)
        : ESTADOS_ACTIVIDAD.PENDIENTE;
    },
    opcionesEstado() {
      return estadosPermitidosActividad(this.estadoOriginal).map((value) => ({
        value,
        text: ETIQUETAS_ESTADO_ACTIVIDAD[value],
      }));
    },
    estadoCronogramaTexto() {
      const estado = this.actividad?.estadoCronograma;
      return ETIQUETAS_ESTADO_CRONOGRAMA[estado] || "—";
    },
    fechaEntregaTexto() {
      return formatearFechaCorta(this.proyecto?.fechaEntregaEstipulada);
    },
    rangoFechasActuales() {
      const inicio = formatearFecha(this.actividad?.fechaHoraInicio);
      const fin = formatearFecha(this.actividad?.fechaHoraFin);
      return `${inicio} – ${fin}`;
    },
    totalPersonasRequeridas() {
      return this.form.requerimientos.reduce(
        (total, requerimiento) => total + (Number(requerimiento.cantidad) || 0),
        0
      );
    },
    tituloModalRequerimiento() {
      return this.indiceRequerimientoEnEdicion == null
        ? "Nuevo requerimiento"
        : "Editar requerimiento";
    },
    mensajeConfirmacionEstado() {
      if (this.form.estado === ESTADOS_ACTIVIDAD.CANCELADA) {
        return "La actividad quedará CANCELADA. Esta acción es irreversible: no se podrá modificar ni reactivar. ¿Querés continuar?";
      }
      if (this.form.estado === ESTADOS_ACTIVIDAD.FINALIZADA) {
        return "La actividad quedará FINALIZADA. Esta acción es irreversible: no se podrá modificar ni reactivar. ¿Querés continuar?";
      }
      return "Se actualizará el estado de la actividad. ¿Querés continuar?";
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.cargar();
    },
    idActividad(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.cargar();
    },
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
    if (controladorGuardado) controladorGuardado.abort();
  },
  methods: {
    nuevoRequerimiento(uid) {
      return {
        uid,
        idRequerimiento: null,
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
      this.proyecto = null;
      this.actividad = null;

      try {
        const proyectoResponse = await proyectoService.obtener(
          this.idProyecto,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;

        const proyecto = proyectoResponse?.data || null;
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
          this.errorBloqueante = `El proyecto está ${this.estadoNormalizado.toLowerCase()} y no admite modificaciones de actividades.`;
          return;
        }

        if (!this.puedeModificarActividad) {
          this.errorBloqueante =
            "No tenés permiso para modificar actividades en este proyecto.";
          return;
        }

        const actividadResponse = await actividadService.obtener(
          this.idProyecto,
          this.idActividad,
          controladorCarga.signal
        );
        if (corrida !== this.idCarga) return;

        const actividad = actividadResponse?.data || null;
        if (!actividad) {
          this.errorCarga = "No encontramos la actividad que estás buscando.";
          return;
        }

        this.actividad = actividad;

        if (!puedeEditarActividad(actividad.estado)) {
          this.errorBloqueante = `La actividad está ${etiquetaEstadoActividad(actividad.estado).toLowerCase()} y no se puede modificar.`;
          return;
        }

        this.precargarFormulario(actividad);

        await Promise.all([
          this.cargarProfesiones(),
          this.cargarHabilidades(),
          this.cargarActividades(),
        ]);

        await this.cargarCaracteristicas();
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
    precargarFormulario(actividad) {
      const { duracion, unidadDuracion } = descomponerDuracionMinutos(
        actividad.duracionMinutos
      );

      this.siguienteUid = 0;
      this.form = {
        nombre: actividad.nombre || "",
        descripcion: actividad.descripcion || "",
        duracion,
        unidadDuracion,
        estado: normalizarEstadoActividad(actividad.estado),
        ubicacion: this.mapearUbicacion(actividad.ubicacion),
        predecesoras: (actividad.predecesoras || []).map(
          (predecesora) => predecesora.idActividad
        ),
        requerimientos: (actividad.requerimientos || []).map((requerimiento) =>
          this.mapearRequerimiento(requerimiento)
        ),
      };

      this.errores = {};
      this.seccionErrores = {};
    },
    mapearRequerimiento(requerimiento) {
      this.siguienteUid += 1;
      return {
        uid: this.siguienteUid,
        idRequerimiento: requerimiento.idRequerimiento,
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
    async cargarProfesiones() {
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      }
    },
    async cargarHabilidades() {
      this.cargandoHabilidades = true;
      try {
        const response = await habilidadService.listar();
        const datos = response?.data;
        this.habilidades = Array.isArray(datos) ? datos : datos?.habilidades || [];
      } catch {
        this.habilidades = [];
      } finally {
        this.cargandoHabilidades = false;
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
        const lista = Array.isArray(contenido) ? contenido : [];

        const actividades = lista.filter(
          (actividad) =>
            String(actividad.idActividad) !== String(this.idActividad)
        );

        const ids = new Set(
          actividades.map((actividad) => String(actividad.idActividad))
        );
        for (const predecesora of this.actividad?.predecesoras || []) {
          if (ids.has(String(predecesora.idActividad))) continue;
          actividades.push({
            idActividad: predecesora.idActividad,
            nombre: predecesora.nombre,
          });
        }

        this.actividades = actividades;
      } catch {
        this.actividades = [...(this.actividad?.predecesoras || [])];
        this.advertenciaActividades =
          "No se pudieron cargar las actividades existentes. Podés continuar con las predecesoras actuales, pero no agregar nuevas.";
      } finally {
        this.cargandoActividades = false;
      }
    },
    async cargarCaracteristicas() {
      const idsProfesion = [
        ...new Set(
          (this.form.requerimientos || [])
            .map((requerimiento) => requerimiento.idProfesion)
            .filter(Boolean)
        ),
      ];

      if (idsProfesion.length === 0) return;

      const resultados = await Promise.allSettled(
        idsProfesion.map((id) =>
          perfilService.caracteristicasPorProfesion(id)
        )
      );

      const catalogos = { ...this.catalogosPorProfesion };
      idsProfesion.forEach((id, indice) => {
        const resultado = resultados[indice];
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
    async asegurarCatalogo(idProfesion) {
      if (!idProfesion) return [];
      if (Array.isArray(this.catalogosPorProfesion[idProfesion])) {
        return this.catalogosPorProfesion[idProfesion];
      }

      try {
        const response = await perfilService.caracteristicasPorProfesion(
          idProfesion
        );
        const datos = response?.data;
        const caracteristicas = Array.isArray(datos)
          ? datos
          : datos?.caracteristicas || [];
        this.catalogosPorProfesion = {
          ...this.catalogosPorProfesion,
          [idProfesion]: caracteristicas,
        };
        return caracteristicas;
      } catch {
        this.catalogosPorProfesion = {
          ...this.catalogosPorProfesion,
          [idProfesion]: [],
        };
        return [];
      }
    },
    guardarCatalogo({ idProfesion, caracteristicas }) {
      this.catalogosPorProfesion = {
        ...this.catalogosPorProfesion,
        [idProfesion]: caracteristicas,
      };
    },
    abrirNuevoRequerimiento() {
      this.indiceRequerimientoEnEdicion = null;
      this.indiceDraft = this.form.requerimientos.length;
      this.requerimientoDraft = this.crearRequerimientoVacio();
      this.erroresDraft = {};
      this.errorDraftSeccion = [];
      this.modalRequerimientoKey += 1;
      this.modalRequerimientoVisible = true;
    },
    abrirEditarRequerimiento(indice) {
      const requerimiento = this.form.requerimientos[indice];
      if (!requerimiento) return;

      this.indiceRequerimientoEnEdicion = indice;
      this.indiceDraft = indice;
      this.requerimientoDraft = JSON.parse(JSON.stringify(requerimiento));
      this.erroresDraft = {};
      this.errorDraftSeccion = [];
      this.modalRequerimientoKey += 1;
      this.modalRequerimientoVisible = true;
    },
    cerrarModalRequerimiento() {
      if (this.guardandoRequerimiento) return;
      this.modalRequerimientoVisible = false;
    },
    async guardarRequerimiento() {
      if (this.guardandoRequerimiento) return;

      this.guardandoRequerimiento = true;
      this.erroresDraft = {};
      this.errorDraftSeccion = [];

      try {
        const idProfesion = this.requerimientoDraft.idProfesion;
        const catalogo = await this.asegurarCatalogo(idProfesion);
        const { campos, seccion } = validarRequerimiento(
          this.requerimientoDraft,
          catalogo
        );

        this.erroresDraft = campos;
        this.errorDraftSeccion = seccion;

        if (Object.keys(campos).length || seccion.length) {
          this.mensajeError = "Revisá el requerimiento antes de guardarlo.";
          return;
        }

        if (this.indiceRequerimientoEnEdicion == null) {
          this.form.requerimientos.push(
            JSON.parse(JSON.stringify(this.requerimientoDraft))
          );
        } else {
          this.form.requerimientos.splice(
            this.indiceRequerimientoEnEdicion,
            1,
            JSON.parse(JSON.stringify(this.requerimientoDraft))
          );
        }

        this.modalRequerimientoVisible = false;
        this.indiceRequerimientoEnEdicion = null;
        this.mensajeError = "";
      } finally {
        this.guardandoRequerimiento = false;
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
    quitarUbicacion() {
      this.form.ubicacion = null;
      if (this.errores.ubicacion) {
        const errores = { ...this.errores };
        delete errores.ubicacion;
        this.errores = errores;
      }
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
      if (!actividad.estado) return actividad.nombre;
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
    estiloEstado(estado) {
      const colores = coloresEstadoActividad(estado);
      return {
        backgroundColor: colores.fondo,
        color: colores.texto,
        borderColor: colores.borde,
      };
    },
    etiquetaEstadoActividad(estado) {
      return etiquetaEstadoActividad(estado);
    },
    formatearDuracionMinutos(minutos) {
      return formatearDuracionMinutos(minutos);
    },
    guardar() {
      if (this.guardando || this.errorBloqueante) return;

      this.mensajeError = "";
      this.errores = {};
      this.seccionErrores = {};

      if (!this.tieneFechaEntrega) {
        this.mensajeError =
          "El proyecto necesita una fecha de entrega para reprogramar actividades.";
        return;
      }

      const { campos, secciones } = validarActividadEdicion(
        this.form,
        this.catalogosPorProfesion,
        this.actividades,
        this.actividad
      );

      this.errores = campos;
      this.seccionErrores = secciones;

      if (Object.keys(campos).length || Object.keys(secciones).length) {
        this.mensajeError = "Revisá los datos marcados antes de continuar.";
        this.enfocarPrimerError();
        return;
      }

      if (
        [ESTADOS_ACTIVIDAD.FINALIZADA, ESTADOS_ACTIVIDAD.CANCELADA].includes(
          this.form.estado
        )
      ) {
        this.modalEstadoVisible = true;
        return;
      }

      this.ejecutarGuardado();
    },
    cancelarConfirmacionEstado() {
      if (this.guardando) return;
      this.modalEstadoVisible = false;
      this.mensajeError = "";
    },
    confirmarCambioEstado() {
      if (this.guardando) return;
      this.ejecutarGuardado();
    },
    async ejecutarGuardado() {
      if (this.guardando) return;

      this.guardando = true;
      this.mensajeError = "";

      if (controladorGuardado) controladorGuardado.abort();
      controladorGuardado = new AbortController();

      try {
        const response = await actividadService.modificar(
          this.idProyecto,
          this.idActividad,
          buildModificarActividadRequest(this.form),
          controladorGuardado.signal
        );

        const actividad = response?.data;
        const alerta =
          actividad?.estadoCronograma === ESTADOS_CRONOGRAMA.ALERTA_DESBORDE;

        this.modalEstadoVisible = false;

        this.toast.init({
          title: alerta ? "Actividad modificada con alerta" : "Actividad modificada",
          message: alerta
            ? "Los cambios se guardaron, pero el cronograma supera la fecha de entrega del proyecto."
            : "La actividad se actualizó y el cronograma fue recalculado.",
          color: alerta ? "warning" : "success",
          position: "top-right",
          duration: alerta ? 8000 : 5000,
        });

        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
          query: {
            tab: "planificacion",
            editada: actividad?.idActividad ?? this.idActividad,
          },
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        await this.manejarErrorGuardado(error);
      } finally {
        this.guardando = false;
      }
    },
    async manejarErrorCarga(error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);

      this.proyecto = null;
      this.actividad = null;

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
        if (/actividad/i.test(mensaje)) {
          this.errorCarga =
            mensaje || "La actividad ya no existe o no pertenece al proyecto.";
          return;
        }
        if (/proyecto/i.test(mensaje)) {
          this.errorCarga = mensaje;
          return;
        }
        this.errorCarga = mensajeErrorApi(
          error,
          "No se pudo cargar la actividad."
        );
        return;
      }

      if (status === 409 || clasificacion?.tipo === "perfil-baja") {
        this.errorCarga = "El perfil no se encuentra activo.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.errorCarga =
          "Ocurrió un error al cargar la actividad. Inténtalo nuevamente.";
        return;
      }

      this.errorCarga = mensajeErrorApi(
        error,
        "No se pudo cargar la actividad."
      );
    },
    async manejarErrorGuardado(error) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      const mensaje = data.message || data.mensaje || "";
      const clasificacion = clasificarErrorProyecto(error);

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
          this.enfocarPrimerError();
          return;
        }

        if (/fecha/i.test(mensaje)) {
          this.mensajeError = mensaje;
          return;
        }

        if (/duraci[oó]n/i.test(mensaje)) {
          this.errores = { ...this.errores, duracion: mensaje };
          this.mensajeError = "Revisá la duración de la actividad.";
          this.enfocarPrimerError();
          return;
        }

        if (/predecesora/i.test(mensaje)) {
          this.errores = { ...this.errores, predecesoras: mensaje };
          this.mensajeError = "Revisá las predecesoras de la actividad.";
          await this.cargarActividades();
          return;
        }

        if (/requerimiento|caracter|valor|habilidad|cantidad/i.test(mensaje)) {
          this.seccionErrores = {
            ...this.seccionErrores,
            requerimientos: [mensaje],
          };
          this.mensajeError = "Revisá los requerimientos de personal.";
          this.$refs.requerimientosRef?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }

        if (/localidad|provincia|ubicaci/i.test(mensaje)) {
          this.errores = { ...this.errores, ubicacion: mensaje };
          this.mensajeError = "Revisá la ubicación de la actividad.";
          return;
        }

        this.mensajeError =
          mensaje || "No se pudo modificar la actividad. Revisá los datos.";
        return;
      }

      if (status === 403) {
        this.errorBloqueante =
          mensaje ||
          "No tenés permiso para modificar actividades en este proyecto.";
        this.modalEstadoVisible = false;
        return;
      }

      if (status === 404) {
        if (/perfil/i.test(mensaje)) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (/habilidad/i.test(mensaje)) {
          this.seccionErrores = {
            ...this.seccionErrores,
            requerimientos: [
              mensaje ||
                "Una de las habilidades seleccionadas ya no existe. Actualizá la selección.",
            ],
          };
          this.mensajeError =
            "Una de las habilidades seleccionadas ya no existe. Actualizá la selección.";
          this.modalEstadoVisible = false;
          await this.cargarHabilidades();
          this.$refs.requerimientosRef?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return;
        }

        this.errorBloqueante =
          mensaje ||
          "El proyecto o la actividad ya no están disponibles.";
        this.modalEstadoVisible = false;
        return;
      }

      if (status === 409) {
        if (
          clasificacion?.tipo === "perfil-baja" ||
          /perfil.*(baja|inactiv|no se encuentra activo)/i.test(mensaje)
        ) {
          await refrescarSesion();
          this.$router.push({ name: "dashboard-usuario" });
          return;
        }

        if (/nombre|duplicad|existe/i.test(mensaje)) {
          this.errores = {
            ...this.errores,
            nombre: mensaje || "Ya existe una actividad con ese nombre.",
          };
          this.mensajeError = "Revisá el nombre de la actividad.";
          this.modalEstadoVisible = false;
          this.enfocarPrimerError();
          return;
        }

        if (/v[ií]nculo|postulaci|invitaci/i.test(mensaje)) {
          this.errorBloqueante =
            mensaje ||
            "No se puede guardar la actividad porque uno de sus requerimientos tiene postulaciones o invitaciones asociadas. Resolvé esos vínculos antes de editar la actividad.";
          this.modalEstadoVisible = false;
          return;
        }

        if (/ciclo/i.test(mensaje)) {
          this.mensajeError = `${mensaje} Revisá las predecesoras seleccionadas.`;
          this.modalEstadoVisible = false;
          await this.cargarActividades();
          return;
        }

        if (/transici|estado destino|no puede pasar/i.test(mensaje)) {
          this.errores = { ...this.errores, estado: mensaje };
          this.mensajeError = "Revisá el estado seleccionado.";
          this.modalEstadoVisible = false;
          this.enfocarPrimerError();
          return;
        }

        if (/actividad.*(finaliz|cancel)|no se puede modificar una actividad/i.test(mensaje)) {
          this.errorBloqueante =
            mensaje || "La actividad ya no se puede modificar.";
          this.modalEstadoVisible = false;
          return;
        }

        if (/proyecto.*(finaliz|cancel)|no permite modificar actividades/i.test(mensaje)) {
          this.errorBloqueante =
            mensaje || "El proyecto ya no admite modificaciones de actividades.";
          this.modalEstadoVisible = false;
          return;
        }

        if (/cronograma|desborde/i.test(mensaje)) {
          this.mensajeError = mensaje;
          this.modalEstadoVisible = false;
          return;
        }

        this.mensajeError = mensaje || "No se pudo modificar la actividad.";
        this.modalEstadoVisible = false;
        return;
      }

      if (!status || status >= 500) {
        this.mensajeError =
          "Ocurrió un error al modificar la actividad. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "No se pudo modificar la actividad."
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
        if (claves.includes("estado")) {
          this.$refs.estadoSelect?.focus?.();
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
        query: {
          tab: tab === "planificacion" ? "planificacion" : "informacion",
        },
      });
    },
    irAModificarProyecto() {
      if (!this.puedeModificarProyecto || this.guardando) return;
      this.$router.push({
        name: "modificar-proyecto",
        params: { id: this.idProyecto },
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
    irAProyectos() {
      this.$router.push({ name: "proyectos-inicio" });
    },
  },
};
</script>

<style scoped>
.modificar-actividad {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.modificar-actividad__volver {
  align-self: flex-start;
}

.modificar-actividad__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0 0;
}

.modificar-actividad__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 600;
}

.modificar-actividad__subtitulo {
  margin: 0.25rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.modificar-actividad__estado-actual {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}

.modificar-actividad__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1rem;
  align-items: start;
}

.modificar-actividad__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modificar-actividad__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.modificar-actividad__seccion-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modificar-actividad__seccion-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.modificar-actividad__seccion-ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.modificar-actividad__contador {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.modificar-actividad__duracion {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) auto;
  gap: 1rem;
  align-items: end;
}

.modificar-actividad__unidad-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.modificar-actividad__unidad-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.modificar-actividad__unidad {
  display: inline-flex;
  padding: 0.2rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.modificar-actividad__unidad-boton {
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

.modificar-actividad__unidad-boton--activa {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
}

.modificar-actividad__error {
  margin: -0.35rem 0 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.modificar-actividad__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.modificar-actividad__requerimientos {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.modificar-actividad__requerimiento {
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border-soft);
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.modificar-actividad__requerimiento-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.modificar-actividad__requerimiento-titulo {
  display: block;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.modificar-actividad__requerimiento-meta {
  display: block;
  margin-top: 0.15rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.modificar-actividad__requerimiento-desc {
  margin: 0.4rem 0 0;
  color: var(--color-text);
  font-size: 0.8rem;
}

.modificar-actividad__requerimiento-acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modificar-actividad__agregar-requerimiento {
  align-self: flex-start;
}

.modificar-actividad__lista-errores {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.modificar-actividad__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.modificar-actividad__acciones--bloqueo {
  margin-top: 0.25rem;
  justify-content: flex-start;
}

.modificar-actividad__resumen {
  position: sticky;
  top: 1rem;
  padding: 1.1rem 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}

.modificar-actividad__resumen-titulo {
  margin: 0 0 0.85rem;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.modificar-actividad__resumen-lista {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.modificar-actividad__resumen-lista div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}

.modificar-actividad__resumen-lista dt {
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.modificar-actividad__resumen-lista dd {
  margin: 0;
  color: var(--color-text);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: right;
}

.modificar-actividad__resumen-fechas {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-soft);
  color: var(--color-text);
  font-size: 0.76rem;
}

.modificar-actividad__resumen-fechas-label {
  color: var(--color-text-muted);
}

.modificar-actividad__resumen-nota {
  margin: 0.9rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1.4;
}

.modificar-actividad__aviso {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  background: var(--color-warning-soft);
}

.modificar-actividad__aviso-titulo {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.modificar-actividad__aviso-texto {
  margin: 0;
  color: var(--color-warning-text);
  font-size: 0.8rem;
}

.modificar-actividad__estado {
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

.modificar-actividad__estado-icono {
  font-size: 2.1rem;
}

.modificar-actividad__estado-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 600;
}

.modificar-actividad__estado-texto {
  margin: 0;
  max-width: 440px;
  font-size: 0.84rem;
}

.modificar-actividad__estado-acciones {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.modificar-actividad-modal__titulo {
  margin: 0;
}

.modificar-actividad-modal__mensaje {
  margin: 0.25rem 0 0.5rem;
  color: var(--color-text, #232134);
  font-size: 0.95rem;
}

.modificar-actividad-modal__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
}

@media (max-width: 900px) {
  .modificar-actividad__layout {
    grid-template-columns: 1fr;
  }

  .modificar-actividad__resumen {
    position: static;
  }
}

@media (max-width: 560px) {
  .modificar-actividad__duracion {
    grid-template-columns: 1fr;
  }

  .modificar-actividad__intro {
    flex-direction: column;
  }

  .modificar-actividad__requerimiento-cabecera,
  .modificar-actividad__seccion-cabecera {
    flex-direction: column;
  }
}
</style>
