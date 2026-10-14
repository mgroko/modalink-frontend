<template>
  <div class="crear-proyecto">
    <h1 class="crear-proyecto__titulo">Proyectos / Crear proyecto</h1>
    <p class="crear-proyecto__subtitulo">
      Completá los datos para crear un nuevo proyecto con tu perfil activo.
    </p>

    <div class="crear-proyecto__stepper" aria-label="Pasos de creación del proyecto">
      <template v-for="(nombrePaso, i) in pasos" :key="nombrePaso">
        <div
          v-if="i > 0"
          class="crear-proyecto__paso-linea"
          :class="{ 'crear-proyecto__paso-linea--activa': paso > i }"
          aria-hidden="true"
        />
        <div
          class="crear-proyecto__paso"
          :class="{ 'crear-proyecto__paso--activo': paso === i + 1 }"
          :aria-current="paso === i + 1 ? 'step' : undefined"
        >
          <span class="crear-proyecto__paso-numero">{{ i + 1 }}</span>
          <span class="crear-proyecto__paso-nombre">{{ nombrePaso }}</span>
        </div>
      </template>
    </div>

    <VaForm
      ref="form"
      :immediate="false"
      class="crear-proyecto__form"
      @submit.prevent="paso === pasos.length ? guardar() : siguiente()"
    >
      <section v-if="paso === 1" class="crear-proyecto__seccion">
        <h2 class="crear-proyecto__seccion-titulo">Datos generales</h2>

        <VaInput
          v-model="form.nombre"
          label="Nombre del proyecto*"
          placeholder="Ej: Colección Madoka"
          :max-length="50"
          counter
          :rules="[reglas.requerido, reglas.noBlanco, reglas.max50]"
          :error="errorCampo('nombre')"
          :error-messages="mensajeCampo('nombre')"
          @update:model-value="limpiarError('nombre')"
        />

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

        <div class="crear-proyecto__fila">
          <SegmentadoPrivacidad v-model="form.privacidad" label="Privacidad*" />
        </div>

        <div class="crear-proyecto__campo-fecha">
          <VaInput
            v-model="form.fechaEntregaEstipulada"
            type="date"
            label="Fecha de entrega"
            :min="hoy"
            :rules="[reglas.fechaEntregaNoPasada(hoy)]"
            :error="errorCampo('fechaEntregaEstipulada')"
            :error-messages="mensajeCampo('fechaEntregaEstipulada')"
            @update:model-value="limpiarError('fechaEntregaEstipulada')"
          />
          <p class="crear-proyecto__seccion-ayuda">
            Fecha límite para finalizar el proyecto. Se usa para estimar su duración y
            calcular los caminos críticos.
          </p>
        </div>

        <div class="crear-proyecto__subseccion">
          <p class="crear-proyecto__subseccion-titulo">Ubicación</p>
          <p class="crear-proyecto__seccion-ayuda">
            Opcional. Ayuda a visibilizar el proyecto.
          </p>
          <SelectorUbicacion v-model="form.ubicacion" />
        </div>
      </section>

      <section v-else-if="paso === 2" class="crear-proyecto__seccion">
        <h2 class="crear-proyecto__seccion-titulo">Objetivos</h2>
        <p class="crear-proyecto__seccion-ayuda">
          Definí qué objetivos querés lograr con el proyecto (opcional)
        </p>

        <VaButton
          preset="secondary"
          size="small"
          icon="mso-add"
          class="crear-proyecto__agregar"
          @click="agregarObjetivo"
        >
          Agregar objetivo
        </VaButton>

        <ListaDinamicaObjetivos
          v-model="form.objetivos"
          :errores="erroresBackend"
          :mostrar-encabezado="false"
        />
      </section>

      <section v-else-if="paso === 3" class="crear-proyecto__seccion">
        <h2 class="crear-proyecto__seccion-titulo">Requerimiento de personal</h2>
        <p class="crear-proyecto__seccion-ayuda">
          Definí qué perfil necesitás para el proyecto (opcional)
        </p>

        <VaButton
          preset="secondary"
          size="small"
          icon="mso-add"
          class="crear-proyecto__agregar"
          @click="agregarRequerimiento"
        >
          Agregar requerimiento
        </VaButton>

        <p v-if="form.requerimientosGral.length === 0" class="crear-proyecto__vacio">
          <span class="material-symbols-outlined">groups</span>
          Aún no agregaste requerimientos de personal.
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
          :eliminar-permitido="true"
          @eliminar="quitarRequerimiento(i)"
          @catalogo-cargado="guardarCatalogo"
        />

        <ul
          v-if="seccionErrores.requerimientosGral?.length"
          class="crear-proyecto__errores-seccion"
        >
          <li v-for="(msg, i) in seccionErrores.requerimientosGral" :key="i">{{ msg }}</li>
        </ul>

        <div class="crear-proyecto__postulaciones">
          <VaSwitch
            v-model="form.aceptaPostulacionGral"
            label="Acepta postulaciones abiertas"
          />
          <p class="crear-proyecto__seccion-ayuda">
            Cualquier persona que pueda ver el proyecto podrá postularse a estos
            requerimientos. Si lo dejás desactivado, solo se cubrirán por invitación.
          </p>
        </div>
      </section>

      <section v-else class="crear-proyecto__seccion">
        <h2 class="crear-proyecto__seccion-titulo">Moodboard</h2>
        <p class="crear-proyecto__seccion-ayuda">
          Definí la inspiración del proyecto (opcional)
        </p>
        <MoodboardSeccion
          v-model="form.moodboard"
          :mostrar-encabezado="false"
          :error="errorCampo('moodboard.descripcion')"
          :error-messages="mensajeCampo('moodboard.descripcion')"
        />
      </section>

      <div class="crear-proyecto__alertas">
        <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
        <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
      </div>

      <div class="crear-proyecto__acciones">
        <span class="crear-proyecto__nota">Los campos marcados con (*) son obligatorios</span>

        <div class="crear-proyecto__acciones-pie">
          <VaButton
            preset="secondary"
            class="crear-proyecto__btn-texto"
            :disabled="cargando"
            @click="cancelar"
          >
            Cancelar
          </VaButton>

          <div class="crear-proyecto__acciones-derecha">
            <VaButton v-if="paso > 1" preset="secondary" :disabled="cargando" @click="anterior">
              Atrás
            </VaButton>
            <VaButton type="submit" :loading="cargando">
              {{ paso === pasos.length ? "Finalizar" : "Siguiente" }}
            </VaButton>
          </div>
        </div>
      </div>
    </VaForm>

    <ModalExitoProyecto
      v-model="modalExito"
      :proyecto="proyectoCreado"
      @ir-al-proyecto="irAlProyecto"
    />

    <ModalCancelarCreacion v-model="modalCancelar" @confirmar="descartarCreacion" />
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService.js";
import perfilService from "../../services/perfilService.js";
import habilidadService from "../../services/habilidadService.js";
import BaseAlert from "../../components/AlertaBase.vue";
import SegmentadoPrivacidad from "../../components/proyecto/SegmentadoPrivacidad.vue";
import SelectorUbicacion from "../../components/proyecto/SelectorUbicacion.vue";
import ListaDinamicaObjetivos from "../../components/proyecto/ListaDinamicaObjetivos.vue";
import RequerimientoForm from "../../components/proyecto/RequerimientoForm.vue";
import MoodboardSeccion from "../../components/proyecto/MoodboardSeccion.vue";
import ModalExitoProyecto from "../../components/proyecto/ModalExitoProyecto.vue";
import ModalCancelarCreacion from "../../components/proyecto/ModalCancelarCreacion.vue";
import { reglasProyecto, hoyISO } from "../../utils/reglas.js";
import { PRIVACIDADES } from "../../utils/proyectoConstants.js";
import {
  validarProyecto,
  mapearErroresBackend,
  raizConocida,
} from "../../utils/validacionesProyecto.js";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { mensajeErrorApi } from "../../utils/apiError.js";
import { refrescarSesion } from "../../services/authState.js";

/*
 * Raíz de cada clave del formulario (claves planas de `erroresBackend`) → paso
 * del wizard que la contiene. Sirve para validar de a un paso y para volver al
 * paso correspondiente cuando el backend responde 400/409 con errores de campo.
 */
const RAICES_PASO = {
  1: ["nombre", "descripcion", "privacidad", "fechaEntregaEstipulada", "ubicacion"],
  2: ["objetivos"],
  3: ["requerimientosGral", "aceptaPostulacionGral"],
  4: ["moodboard"],
};

export default {
  name: "CrearProyectoView",
  components: {
    BaseAlert,
    SegmentadoPrivacidad,
    SelectorUbicacion,
    ListaDinamicaObjetivos,
    RequerimientoForm,
    MoodboardSeccion,
    ModalExitoProyecto,
    ModalCancelarCreacion,
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
      hoy: hoyISO(),
      profesiones: [],
      habilidades: [],
      cargandoProfesiones: false,
      cargandoHabilidades: false,
      catalogosPorProfesion: {},
      erroresBackend: {},
      seccionErrores: {},
      cargando: false,
      mensajeExito: "",
      mensajeError: "",
      modalExito: false,
      modalCancelar: false,
      proyectoCreado: null,
      siguienteUid: 0,
      reglas: reglasProyecto,
    };
  },
  created() {
    this.agregarRequerimiento();
  },
  mounted() {
    this.cargarCatalogos();
  },
  methods: {
    async cargarCatalogos() {
      const [profesionesRes, habilidadesRes] = await Promise.allSettled([
        this.cargarProfesiones(),
        this.cargarHabilidades(),
      ]);
      if (profesionesRes.status === "rejected") {
        this.mensajeError = "No se pudieron cargar las profesiones. Intentá nuevamente.";
      }
      if (habilidadesRes.status === "rejected") {
        this.habilidades = [];
      }
    },
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } finally {
        this.cargandoProfesiones = false;
      }
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

    nuevoRequerimiento() {
      this.siguienteUid += 1;
      return {
        uid: this.siguienteUid,
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
      this.form.requerimientosGral.splice(indice, 1);
    },
    guardarCatalogo({ idProfesion, caracteristicas }) {
      this.catalogosPorProfesion[idProfesion] = caracteristicas;
    },

    /**
     * `undefined` (y no `false`) cuando no hay error propio: si el prop llega
     * con valor definido, Vuestic lo toma en lugar de su estado interno y la
     * validación de `rules` queda anulada en el campo.
     */
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

    agregarObjetivo() {
      this.form.objetivos = [...this.form.objetivos, { nombre: "", descripcion: "" }];
    },

    /**
     * Valida el paso actual (reglas de los campos visibles + validación de
     * cruce sólo para las raíces de este paso) y avanza si no hay errores.
     */
    siguiente() {
      this.mensajeExito = "";
      this.mensajeError = "";

      const valido = this.$refs.form.validate();
      if (!valido) {
        // El form no valida: acá no llega `validarProyecto`, así que hay que
        // avisar igual (los mensajes inline los pinta cada campo).
        this.mensajeError = "Revisá los campos marcados antes de continuar.";
        return false;
      }

      const { campos, secciones } = validarProyecto(
        this.form,
        this.catalogosPorProfesion,
        this.hoy
      );
      const raices = RAICES_PASO[this.paso] || [];

      const camposPaso = {};
      for (const [clave, msg] of Object.entries(campos)) {
        if (raices.includes(clave.split(".")[0])) camposPaso[clave] = msg;
      }
      const seccionesPaso = {};
      if (raices.includes("requerimientosGral") && secciones.requerimientosGral) {
        seccionesPaso.requerimientosGral = secciones.requerimientosGral;
      }

      if (Object.keys(camposPaso).length > 0 || Object.keys(seccionesPaso).length > 0) {
        this.erroresBackend = { ...this.erroresBackend, ...camposPaso };
        this.seccionErrores = { ...this.seccionErrores, ...seccionesPaso };
        this.mensajeError = "Revisá los datos marcados antes de continuar.";
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

    /** Paso que contiene una clave de error ("objetivos.0.nombre" → 2). */
    pasoDeClave(clave) {
      const raiz = String(clave || "").split(".")[0];
      const encontrado = Object.entries(RAICES_PASO).find(([, raices]) =>
        raices.includes(raiz)
      );
      return encontrado ? Number(encontrado[0]) : 1;
    },

    /** Tras un error del backend, lleva al paso donde está el campo malo. */
    irAlPasoDeErrores(claves) {
      const pasos = (claves || []).map((c) => this.pasoDeClave(c));
      if (pasos.length === 0) return;
      const destino = Math.min(...pasos);
      if (destino !== this.paso) this.irAPaso(destino);
    },

    async guardar() {
      this.mensajeExito = "";
      this.mensajeError = "";

      const valido = this.$refs.form.validate();
      if (!valido) {
        this.mensajeError = "Revisá los campos marcados antes de continuar.";
        return;
      }

      const { campos, secciones } = validarProyecto(
        this.form,
        this.catalogosPorProfesion,
        this.hoy
      );
      this.erroresBackend = campos;
      this.seccionErrores = secciones;
      if (Object.keys(campos).length > 0 || Object.keys(secciones).length > 0) {
        this.mensajeError = "Revisá los datos marcados antes de continuar.";
        this.irAlPasoDeErrores([
          ...Object.keys(campos),
          ...(secciones.requerimientosGral ? ["requerimientosGral"] : []),
        ]);
        return;
      }

      this.cargando = true;
      try {
        const response = await proyectoService.crear(this.buildRequest());
        const proyecto = response?.data;

        if (proyecto?.idProyecto != null) {
          this.proyectoCreado = proyecto;
          this.modalExito = true;
          this.reiniciarFormulario();
          return;
        }
        this.mensajeExito = `Proyecto "${proyecto?.nombre || this.form.nombre}" creado correctamente. Estado inicial: ${proyecto?.estado || "Borrador"}.`;
        this.$refs.form.resetValidation();
      } catch (error) {
        await this.manejarError(error);
      } finally {
        this.cargando = false;
      }
    },

    reiniciarFormulario() {
      this.form = {
        nombre: "",
        descripcion: "",
        privacidad: PRIVACIDADES.PUBLICO,
        fechaEntregaEstipulada: "",
        aceptaPostulacionGral: false,
        ubicacion: null,
        objetivos: [],
        requerimientosGral: [],
        moodboard: "",
      };
      this.erroresBackend = {};
      this.seccionErrores = {};
      this.mensajeExito = "";
      this.mensajeError = "";
      this.paso = 1;
      this.agregarRequerimiento();
      this.$refs.form?.resetValidation();
    },

    irAlProyecto() {
      const proyecto = this.proyectoCreado;
      if (proyecto?.idProyecto != null) {
        this.$router.push({
          name: "dashboard-proyecto",
          params: { id: proyecto.idProyecto },
          state: { proyecto },
        });
        return;
      }
      this.$router.push({ name: "home" });
    },

    buildRequest() {
      const requerimientosGral = this.form.requerimientosGral.map(({ uid, ...req }) => ({
        cantidad: Number(req.cantidad),
        idProfesion: req.idProfesion,
        descripcion: (req.descripcion || "").trim() || undefined,
        caracteristicas: (req.caracteristicas || []).map((c) => ({
          idCaracteristica: c.idCaracteristica,
          valorMin: this.aNumeroONull(c.valorMin),
          valorMax: this.aNumeroONull(c.valorMax),
          valores: Array.isArray(c.valores) ? c.valores : [],
        })),
        habilidades: Array.isArray(req.habilidades) ? req.habilidades : [],
      }));

      const request = {
        nombre: this.form.nombre.trim(),
        descripcion: this.form.descripcion.trim(),
        privacidad: this.form.privacidad,
        aceptaPostulacionGral: !!this.form.aceptaPostulacionGral,
        requerimientosGral,
      };

      if (this.form.fechaEntregaEstipulada) {
        request.fechaEntregaEstipulada = this.form.fechaEntregaEstipulada;
      }
      if (this.form.ubicacion?.localidadId) {
        request.ubicacion = {
          provinciaId: this.form.ubicacion.provinciaId,
          localidadId: this.form.ubicacion.localidadId,
        };
      }

      const objetivos = this.form.objetivos
        .map((o) => ({
          nombre: (o.nombre || "").trim(),
          descripcion: (o.descripcion || "").trim(),
        }))
        .filter((o) => o.nombre);
      if (objetivos.length > 0) {
        request.objetivos = objetivos;
      }

      const moodboard = (this.form.moodboard || "").trim();
      if (moodboard) {
        request.moodboard = { descripcion: moodboard };
      }

      return request;
    },
    aNumeroONull(valor) {
      if (valor === "" || valor === null || valor === undefined) return null;
      return Number(valor);
    },

    async manejarError(error) {
      const clasificacion = clasificarErrorProyecto(error);
      const fallback = "No se pudo crear el proyecto. Intentá nuevamente.";

      if (!clasificacion) {
        this.mensajeError = mensajeErrorApi(error, fallback);
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
            this.erroresBackend = { ...this.erroresBackend, ...conocidos };
            this.mensajeError = "Revisá los datos marcados antes de continuar.";
            this.irAlPasoDeErrores(Object.keys(conocidos));
          } else {
            this.mensajeError = "Revisá los datos cargados.";
          }
          break;
        }

        case "campo": {
          this.erroresBackend = {
            ...this.erroresBackend,
            [clasificacion.campo]: clasificacion.mensaje || "Fecha inválida.",
          };
          this.mensajeError = "Revisá los datos marcados antes de continuar.";
          this.irAlPasoDeErrores([clasificacion.campo]);
          break;
        }

        case "seccion": {
          this.seccionErrores = {
            ...this.seccionErrores,
            requerimientosGral: [clasificacion.mensaje],
          };
          this.mensajeError = "Revisá los requerimientos de personal.";
          this.irAlPasoDeErrores(["requerimientosGral"]);
          break;
        }

        case "duplicado": {
          this.erroresBackend = {
            ...this.erroresBackend,
            nombre: clasificacion.mensaje || "Ya existe un proyecto con ese nombre.",
          };
          this.irAlPasoDeErrores(["nombre"]);
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
            clasificacion.mensaje ||
            "Tu perfil está dado de baja: no podés crear proyectos.";
          break;
        }

        case "habilidad":
        case "profesion": {
          const esHabilidad = clasificacion.tipo === "habilidad";
          const mensaje = clasificacion.mensaje ||
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

        case "generico": {
          this.mensajeError =
            "No se pudo crear el proyecto. Verificá los datos ingresados.";
          break;
        }

        default: {
          this.mensajeError = mensajeErrorApi(error, fallback);
        }
      }
    },

    asignarErrorRequerimiento(campo, mensaje) {
      const indice = this.form.requerimientosGral.findIndex((r) =>
        campo === "habilidades" ? (r.habilidades || []).length > 0 : !!r.idProfesion
      );
      if (indice >= 0) {
        this.erroresBackend = {
          ...this.erroresBackend,
          [`requerimientosGral.${indice}.${campo}`]: mensaje,
        };
        return;
      }
      this.seccionErrores = { ...this.seccionErrores, requerimientosGral: [mensaje] };
    },

    cancelar() {
      if (this.cargando) return;
      this.modalCancelar = true;
    },
    descartarCreacion() {
      this.$router.push({ name: "home" });
    },
  },
};
</script>

<style scoped>
.crear-proyecto {
  display: grid;
  gap: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

.crear-proyecto__titulo {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-text);
}

.crear-proyecto__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.crear-proyecto__form {
  display: grid;
  gap: 1.25rem;
}

/* Stepper: 1 Datos generales · 2 Objetivos · 3 Personal · 4 Moodboard */
.crear-proyecto__stepper {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
}

.crear-proyecto__paso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.crear-proyecto__paso-numero {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #e5e7eb;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.crear-proyecto__paso--activo {
  color: var(--color-text);
  font-weight: 600;
}

.crear-proyecto__paso--activo .crear-proyecto__paso-numero {
  background: var(--color-primary);
  color: #fff;
}

.crear-proyecto__paso-linea {
  flex: 1;
  min-width: 24px;
  height: 2px;
  margin: 0 0.75rem;
  background: #e5e7eb;
}

.crear-proyecto__paso-linea--activa {
  background: var(--color-primary);
}

.crear-proyecto__seccion {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.crear-proyecto__seccion-titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-text);
}

.crear-proyecto__seccion-ayuda {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.crear-proyecto__subseccion {
  display: grid;
  gap: 0.35rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.crear-proyecto__subseccion-titulo {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.crear-proyecto__campo-fecha {
  display: grid;
  gap: 0.2rem;
  max-width: 320px;
}

.crear-proyecto__agregar {
  align-self: flex-start;
}

.crear-proyecto__fila {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  align-items: center;
}

.crear-proyecto__vacio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 1rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.crear-proyecto__errores-seccion {
  margin: 0;
  padding: 0.75rem 1rem 0.75rem 2rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.85rem;
}

.crear-proyecto__postulaciones {
  display: grid;
  gap: 0.35rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.crear-proyecto__errores-seccion li + li {
  margin-top: 0.25rem;
}

.crear-proyecto__alertas:empty {
  display: none;
}

/*
 * Pie del wizard: la leyenda va en su propia fila y los botones debajo,
 * con Cancelar a la izquierda y Atrás/Siguiente a la derecha
 * (mockup CrearProyecto - Objetivos.png).
 */
.crear-proyecto__acciones {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding-top: 0.5rem;
}

.crear-proyecto__nota {
  padding-left: 1.25rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.crear-proyecto__acciones-pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.crear-proyecto__acciones-derecha {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.crear-proyecto__btn-texto {
  border-color: transparent !important;
  background: transparent !important;
  color: var(--color-text) !important;
}
</style>
