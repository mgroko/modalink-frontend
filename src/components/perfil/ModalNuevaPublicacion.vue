<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="nueva-publicacion"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 nueva-publicacion__titulo">Nueva publicación</h3>
    </template>

    <BaseAlert :message="errorGeneral" type="error" />

    <div class="nueva-publicacion__form">
      <VaInput
        v-model="form.titulo"
        label="Título*"
        placeholder="Ej: Editorial Otoño"
        :max-length="LIMITES_PUBLICACION.TITULO"
        counter
        :disabled="subiendo"
        :error="!!errores.titulo"
        :error-messages="errores.titulo || undefined"
      />

      <VaTextarea
        v-model="form.descripcion"
        label="Descripción"
        placeholder="Contá el contexto de la publicación..."
        :max-length="LIMITES_PUBLICACION.DESCRIPCION"
        :rows="3"
        counter
        :disabled="subiendo"
        :error="!!errores.descripcion"
        :error-messages="errores.descripcion || undefined"
      />

      <div class="nueva-publicacion__fila">
        <VaSelect
          v-model="form.idProyecto"
          label="Proyecto asociado"
          placeholder="Sin proyecto"
          :options="proyectos"
          value-by="idProyecto"
          text-by="nombre"
          :loading="cargandoProyectos"
          :disabled="subiendo"
          :error="!!errores.idProyecto"
          :error-messages="errores.idProyecto || undefined"
          clearable
          allow-search
          no-options-text="No tenés proyectos confirmados o finalizados"
        />

        <div class="nueva-publicacion__ubicacion">
          <div class="nueva-publicacion__ubicacion-cabecera">
            <span class="nueva-publicacion__label">Ubicación (opcional)</span>
            <VaButton
              v-if="form.ubicacion"
              preset="secondary"
              size="small"
              color="danger"
              icon="mso-close"
              :disabled="subiendo"
              @click="quitarUbicacion"
            >
              Quitar
            </VaButton>
          </div>

          <SelectorUbicacion
            v-model="form.ubicacion"
            :disabled="subiendo"
            :error="!!errores.ubicacion"
            :error-message="errores.ubicacion || ''"
          />
        </div>
      </div>

      <p v-if="errorProyectos" class="nueva-publicacion__nota">
        {{ errorProyectos }}
      </p>

      <section class="nueva-publicacion__imagenes">
        <div class="nueva-publicacion__imagenes-cabecera">
          <div>
            <h4 class="nueva-publicacion__label">Imágenes*</h4>
            <p class="nueva-publicacion__ayuda">
              De 1 a {{ PUBLICACION_IMAGENES.MAX_IMAGENES }} imágenes. La primera
              será la portada.
            </p>
          </div>
          <span class="nueva-publicacion__contador">
            {{ archivos.length }} / {{ PUBLICACION_IMAGENES.MAX_IMAGENES }}
          </span>
        </div>

        <DropzoneImagenes
          :compacta="archivos.length > 0"
          :deshabilitada="subiendo || archivos.length >= PUBLICACION_IMAGENES.MAX_IMAGENES"
          @agregar="agregarArchivos"
        />

        <div v-if="archivos.length" class="nueva-publicacion__previews">
          <figure
            v-for="(imagen, indice) in archivos"
            :key="imagen.id"
            class="nueva-publicacion__preview"
          >
            <img
              :src="imagen.preview"
              :alt="imagen.nombre"
              class="nueva-publicacion__preview-img"
            />
            <span v-if="indice === 0" class="nueva-publicacion__portada">
              Portada
            </span>
            <button
              type="button"
              class="nueva-publicacion__quitar"
              :disabled="subiendo"
              :title="`Quitar ${imagen.nombre}`"
              :aria-label="`Quitar ${imagen.nombre}`"
              @click="quitarImagen(indice)"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </figure>
        </div>

        <ul v-if="rechazadas.length" class="nueva-publicacion__rechazadas">
          <li v-for="(rechazada, i) in rechazadas" :key="i">
            {{ rechazada.motivo }}
          </li>
        </ul>

        <p v-if="errores.archivos" class="nueva-publicacion__error" role="alert">
          {{ errores.archivos }}
        </p>
      </section>

      <div v-if="subiendo" class="nueva-publicacion__progreso" role="status">
        <div class="nueva-publicacion__barra">
          <span
            class="nueva-publicacion__barra-relleno"
            :style="{ width: `${progreso}%` }"
          ></span>
        </div>
        <span class="nueva-publicacion__progreso-texto">
          {{ progreso >= 100 ? "Procesando imágenes..." : `Subiendo... ${progreso}%` }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="nueva-publicacion__acciones">
        <VaButton
          preset="secondary"
          :disabled="subiendo"
          @click="cambiarVisibilidad(false)"
        >
          Cancelar
        </VaButton>
        <VaButton
          :loading="subiendo"
          :disabled="subiendo"
          icon="mso-publish"
          @click="publicar"
        >
          Publicar
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import publicacionService from "../../services/publicacionService";
import proyectoService from "../../services/proyectoService";
import BaseAlert from "../AlertaBase.vue";
import DropzoneImagenes from "../proyecto/DropzoneImagenes.vue";
import SelectorUbicacion from "../proyecto/SelectorUbicacion.vue";
import {
  LIMITES_PUBLICACION,
  PUBLICACION_IMAGENES,
  validarFormularioPublicacion,
  normalizarPublicacion,
} from "../../utils/publicacionConstants.js";
import {
  agregarImagenesPublicacion,
  crearItemImagenPublicacion,
  revocarPreviewsPublicacion,
} from "../../utils/publicacionImagenes.js";
import { ESTADOS_PROYECTO, normalizarEstadoProyecto } from "../../utils/proyectoConstants.js";
import { mensajeErrorApi } from "../../utils/apiError";

const ESTADOS_ASOCIABLES = [
  ESTADOS_PROYECTO.CONFIRMADO,
  ESTADOS_PROYECTO.FINALIZADO,
];

export default {
  name: "ModalNuevaPublicacion",
  components: {
    BaseAlert,
    DropzoneImagenes,
    SelectorUbicacion,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "creada"],
  data() {
    return {
      LIMITES_PUBLICACION,
      PUBLICACION_IMAGENES,
      form: {
        titulo: "",
        descripcion: "",
        idProyecto: null,
        ubicacion: null,
      },
      archivos: [],
      rechazadas: [],
      proyectos: [],
      cargandoProyectos: false,
      errorProyectos: "",
      errores: {},
      errorGeneral: "",
      subiendo: false,
      progreso: 0,
      controladorProyectos: null,
    };
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.reiniciarFormulario();
        this.cargarProyectos();
        return;
      }
      if (this.controladorProyectos) {
        this.controladorProyectos.abort();
        this.controladorProyectos = null;
      }
      this.cargandoProyectos = false;
      revocarPreviewsPublicacion(this.archivos);
    },
    "form.titulo"() {
      this.limpiarError("titulo");
    },
    "form.descripcion"() {
      this.limpiarError("descripcion");
    },
    "form.idProyecto"() {
      this.limpiarError("idProyecto");
    },
    "form.ubicacion"() {
      this.limpiarError("ubicacion");
    },
  },
  beforeUnmount() {
    if (this.controladorProyectos) this.controladorProyectos.abort();
    revocarPreviewsPublicacion(this.archivos);
  },
  methods: {
    cambiarVisibilidad(abierto) {
      if (this.subiendo && !abierto) return;
      this.$emit("update:modelValue", abierto);
    },
    reiniciarFormulario() {
      revocarPreviewsPublicacion(this.archivos);
      this.form = {
        titulo: "",
        descripcion: "",
        idProyecto: null,
        ubicacion: null,
      };
      this.archivos = [];
      this.rechazadas = [];
      this.errores = {};
      this.errorGeneral = "";
      this.progreso = 0;
      this.errorProyectos = "";
    },
    limpiarError(campo) {
      if (this.errorGeneral) this.errorGeneral = "";
      if (!this.errores[campo]) return;
      const errores = { ...this.errores };
      delete errores[campo];
      this.errores = errores;
    },
    quitarUbicacion() {
      this.form.ubicacion = null;
      this.limpiarError("ubicacion");
    },
    async cargarProyectos() {
      if (this.controladorProyectos) this.controladorProyectos.abort();
      const controller = new AbortController();
      this.controladorProyectos = controller;

      this.cargandoProyectos = true;
      this.errorProyectos = "";

      try {
        const response = await proyectoService.propios(
          { todos: true },
          controller.signal
        );
        if (this.controladorProyectos !== controller) return;

        const contenido = Array.isArray(response?.data?.contenido)
          ? response.data.contenido
          : Array.isArray(response?.data)
            ? response.data
            : [];

        this.proyectos = contenido
          .filter((proyecto) =>
            ESTADOS_ASOCIABLES.includes(
              normalizarEstadoProyecto(proyecto?.estado)
            )
          )
          .map((proyecto) => ({
            idProyecto: proyecto.idProyecto,
            nombre: proyecto.nombre,
            estado: proyecto.estado,
          }));
      } catch (error) {
        if (
          this.controladorProyectos !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          error?.name === "AbortError"
        ) {
          return;
        }

        this.proyectos = [];
        this.errorProyectos = mensajeErrorApi(
          error,
          "No se pudieron cargar tus proyectos. Podés publicar sin asociar uno."
        );
      } finally {
        if (this.controladorProyectos === controller) {
          this.cargandoProyectos = false;
          this.controladorProyectos = null;
        }
      }
    },
    async agregarArchivos(nuevas) {
      if (this.subiendo) return;

      this.rechazadas = [];
      const existentes = this.archivos.map((imagen) => imagen.archivo);
      const { validas, rechazadas } = await agregarImagenesPublicacion(
        existentes,
        nuevas
      );

      this.rechazadas = rechazadas;
      if (validas.length) {
        this.archivos = [
          ...this.archivos,
          ...validas.map(crearItemImagenPublicacion),
        ];
        this.limpiarError("archivos");
        this.errorGeneral = "";
      }
    },
    quitarImagen(indice) {
      const imagen = this.archivos[indice];
      if (!imagen || this.subiendo) return;
      revocarPreviewsPublicacion([imagen]);
      this.archivos = this.archivos.filter((_, i) => i !== indice);
    },
    validar() {
      const errores = validarFormularioPublicacion({
        ...this.form,
        archivos: this.archivos.map((imagen) => imagen.archivo),
      });
      this.errores = errores;
      if (Object.keys(errores).length) {
        this.errorGeneral = "Revisá los datos marcados antes de continuar.";
        return false;
      }
      this.errorGeneral = "";
      return true;
    },
    async publicar() {
      if (this.subiendo) return;
      if (!this.validar()) return;

      this.subiendo = true;
      this.progreso = 0;
      this.errorGeneral = "";

      try {
        const response = await publicacionService.crear(
          {
            titulo: this.form.titulo,
            descripcion: this.form.descripcion,
            idProyecto: this.form.idProyecto,
            localidadId: this.form.ubicacion?.localidadId || null,
            provinciaId: this.form.ubicacion?.provinciaId || null,
            archivos: this.archivos.map((imagen) => imagen.archivo),
          },
          (porcentaje) => {
            this.progreso = porcentaje;
          }
        );

        this.subiendo = false;
        this.$emit("creada", normalizarPublicacion(response?.data));
        this.$emit("update:modelValue", false);
      } catch (error) {
        this.manejarError(error);
      } finally {
        this.subiendo = false;
      }
    },
    manejarError(error) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};
      const mensaje = data.message || data.mensaje || "";

      if (data.errores && typeof data.errores === "object") {
        const errores = { ...data.errores };
        if (errores.localidadId || errores.provinciaId) {
          errores.ubicacion = errores.localidadId || errores.provinciaId;
          delete errores.localidadId;
          delete errores.provinciaId;
        }
        this.errores = errores;
        this.errorGeneral = "Revisá los datos marcados antes de continuar.";
        return;
      }

      if (data.codigo === "PROYECTO_NO_ASOCIABLE") {
        this.errores = {
          ...this.errores,
          idProyecto: mensaje || "El proyecto seleccionado no es asociable.",
        };
        this.errorGeneral = "";
        return;
      }

      if (status === 400) {
        this.errores = {
          ...this.errores,
          archivos: mensaje || "No se pudieron procesar las imágenes.",
        };
        this.errorGeneral = "";
        return;
      }

      if (status === 403) {
        this.errorGeneral =
          mensaje || "No tenés permisos para publicar con este perfil.";
        return;
      }

      if (status === 404) {
        this.errorGeneral =
          mensaje || "No se encontró el perfil activo o el proyecto seleccionado.";
        return;
      }

      if (status === 409) {
        this.errorGeneral =
          mensaje || "No se pudo asociar el proyecto a la publicación.";
        return;
      }

      this.errorGeneral = mensajeErrorApi(
        error,
        "No se pudo crear la publicación. Intentalo nuevamente."
      );
    },
  },
};
</script>

<style scoped>
.nueva-publicacion__titulo {
  margin: 0;
}

.nueva-publicacion__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nueva-publicacion__fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 1rem;
}

.nueva-publicacion__ubicacion {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.nueva-publicacion__ubicacion-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.6rem;
}

.nueva-publicacion__label {
  margin: 0;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.nueva-publicacion__ayuda {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.nueva-publicacion__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.nueva-publicacion__imagenes {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.nueva-publicacion__imagenes-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.nueva-publicacion__contador {
  padding: 0.15rem 0.5rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.nueva-publicacion__previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.55rem;
}

.nueva-publicacion__preview {
  position: relative;
  margin: 0;
}

.nueva-publicacion__preview-img {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.nueva-publicacion__portada {
  position: absolute;
  bottom: 0.3rem;
  left: 0.3rem;
  padding: 0.1rem 0.35rem;
  color: var(--color-on-primary);
  background: rgba(35, 33, 52, 0.78);
  border-radius: 4px;
  font-size: 0.62rem;
  font-weight: 600;
}

.nueva-publicacion__quitar {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  place-items: center;
  color: white;
  background: rgba(35, 33, 52, 0.78);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.nueva-publicacion__quitar:disabled {
  cursor: default;
  opacity: 0.5;
}

.nueva-publicacion__quitar .material-symbols-outlined {
  font-size: 0.9rem;
}

.nueva-publicacion__rechazadas {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-warning-text);
  font-size: 0.78rem;
}

.nueva-publicacion__error {
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
}

.nueva-publicacion__progreso {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.nueva-publicacion__barra {
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: var(--color-surface-muted);
  border-radius: 999px;
}

.nueva-publicacion__barra-relleno {
  display: block;
  height: 100%;
  background: var(--color-primary);
  border-radius: inherit;
  transition: width 0.2s ease;
}

.nueva-publicacion__progreso-texto {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

.nueva-publicacion__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  width: 100%;
}

@media (max-width: 700px) {
  .nueva-publicacion__fila {
    grid-template-columns: 1fr;
  }

  .nueva-publicacion__acciones {
    flex-direction: column-reverse;
  }
}
</style>
