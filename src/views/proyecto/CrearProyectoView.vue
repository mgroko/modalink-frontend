<template>
  <div class="crear-proyecto">
    <h1 class="crear-proyecto__titulo">Crear proyecto</h1>
    <p class="crear-proyecto__subtitulo">
      Completá los datos para crear un nuevo proyecto con tu perfil activo.
    </p>

    <VaForm ref="form" :immediate="false" @submit.prevent="guardar" class="crear-proyecto__form">
      <section class="crear-proyecto__seccion">
        <h2 class="crear-proyecto__seccion-titulo">Datos generales</h2>

        <VaInput
          v-model="form.nombre"
          label="Nombre del proyecto"
          placeholder="Ej: Colección Primavera-Verano"
          :max-length="50"
          counter
          :rules="[reglas.requerido, reglas.noBlanco, reglas.max50]"
          :error="errorCampo('nombre')"
          :error-messages="mensajeCampo('nombre')"
          @update:model-value="limpiarError('nombre')"
        />

        <VaTextarea
          v-model="form.descripcion"
          label="Descripción"
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
          <SegmentadoPrivacidad v-model="form.privacidad" />

          <VaSwitch
            v-model="form.aceptaPostulacionGral"
            label="Acepta postulaciones abiertas"
          />
        </div>

        <div class="crear-proyecto__fila">
          <VaInput
            v-model="form.fechaInicio"
            type="date"
            label="Fecha de inicio"
            :rules="[reglas.requerido]"
            :error="errorCampo('fechaInicio')"
            :error-messages="mensajeCampo('fechaInicio')"
            @update:model-value="limpiarError('fechaInicio')"
          />
          <VaInput
            v-model="form.fechaFinEstipulada"
            type="date"
            label="Fecha de fin estimada (opcional)"
            :min="form.fechaInicio || undefined"
            :rules="[reglas.fechaFinNoAnterior(form.fechaInicio)]"
            :error="errorCampo('fechaFinEstipulada')"
            :error-messages="mensajeCampo('fechaFinEstipulada')"
            @update:model-value="limpiarError('fechaFinEstipulada')"
          />
        </div>
      </section>

      <section class="crear-proyecto__seccion">
        <h2 class="crear-proyecto__seccion-titulo">Ubicación</h2>
        <p class="crear-proyecto__seccion-ayuda">Opcional. Ayuda a visibilizar el proyecto.</p>
        <SelectorUbicacion v-model="form.ubicacion" />
      </section>

      <section class="crear-proyecto__seccion">
        <ListaDinamicaObjetivos v-model="form.objetivos" :errores="erroresBackend" />
      </section>

      <section class="crear-proyecto__seccion">
        <div class="crear-proyecto__seccion-encabezado">
          <div>
            <h2 class="crear-proyecto__seccion-titulo">Requerimientos de personal</h2>
            <p class="crear-proyecto__seccion-ayuda">
              Perfiles que necesitás para el proyecto (opcional).
            </p>
          </div>
          <VaButton preset="secondary" icon="mso-add" @click="agregarRequerimiento">
            Agregar requerimiento
          </VaButton>
        </div>

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
      </section>

      <section class="crear-proyecto__seccion">
        <MoodboardSeccion
          v-model="form.moodboard"
          :error="errorCampo('moodboard.descripcion')"
          :error-messages="mensajeCampo('moodboard.descripcion')"
        />
      </section>

      <div class="crear-proyecto__alertas">
        <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
        <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
      </div>

      <div class="crear-proyecto__acciones">
        <VaButton preset="secondary" :disabled="cargando" @click="cancelar">Cancelar</VaButton>
        <VaButton type="submit" :loading="cargando">Crear proyecto</VaButton>
      </div>
    </VaForm>
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
import { reglasProyecto } from "../../utils/reglas.js";
import { PRIVACIDADES } from "../../utils/proyectoConstants.js";
import {
  validarProyecto,
  mapearErroresBackend,
  raizConocida,
} from "../../utils/validacionesProyecto.js";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { mensajeErrorApi } from "../../utils/apiError.js";
import { refrescarSesion } from "../../services/authState.js";

export default {
  name: "CrearProyectoView",
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
      form: {
        nombre: "",
        descripcion: "",
        privacidad: PRIVACIDADES.PUBLICO,
        fechaInicio: "",
        fechaFinEstipulada: "",
        aceptaPostulacionGral: false,
        ubicacion: null,
        objetivos: [],
        requerimientosGral: [],
        moodboard: "",
      },
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

    errorCampo(campo) {
      return !!this.erroresBackend[campo];
    },
    mensajeCampo(campo) {
      return this.erroresBackend[campo] || "";
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

    async guardar() {
      this.mensajeExito = "";
      this.mensajeError = "";

      const valido = this.$refs.form.validate();
      if (!valido) return;

      const { campos, secciones } = validarProyecto(this.form, this.catalogosPorProfesion);
      this.erroresBackend = campos;
      this.seccionErrores = secciones;
      if (Object.keys(campos).length > 0 || Object.keys(secciones).length > 0) {
        this.mensajeError = "Revisá los datos marcados antes de continuar.";
        return;
      }

      this.cargando = true;
      try {
        const response = await proyectoService.crear(this.buildRequest());
        const proyecto = response?.data;
        this.mensajeExito = `Proyecto "${proyecto?.nombre || this.form.nombre}" creado correctamente. Estado inicial: ${proyecto?.estado || "Borrador"}.`;

        if (proyecto?.idProyecto != null) {
          this.$router.push({
            name: "dashboard-proyecto",
            params: { id: proyecto.idProyecto },
            state: { proyecto },
          });
          return;
        }
        this.$refs.form.resetValidation();
      } catch (error) {
        await this.manejarError(error);
      } finally {
        this.cargando = false;
      }
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
        fechaInicio: this.form.fechaInicio,
        aceptaPostulacionGral: !!this.form.aceptaPostulacionGral,
        requerimientosGral,
      };

      if (this.form.fechaFinEstipulada) {
        request.fechaFinEstipulada = this.form.fechaFinEstipulada;
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
          break;
        }

        case "seccion": {
          this.seccionErrores = {
            ...this.seccionErrores,
            requerimientosGral: [clasificacion.mensaje],
          };
          this.mensajeError = "Revisá los requerimientos de personal.";
          break;
        }

        case "duplicado": {
          this.erroresBackend = {
            ...this.erroresBackend,
            nombre: clasificacion.mensaje || "Ya existe un proyecto con ese nombre.",
          };
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

.crear-proyecto__seccion {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.crear-proyecto__seccion-encabezado {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.crear-proyecto__seccion-titulo {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
}

.crear-proyecto__seccion-ayuda {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
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

.crear-proyecto__errores-seccion li + li {
  margin-top: 0.25rem;
}

.crear-proyecto__alertas:empty {
  display: none;
}

.crear-proyecto__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
