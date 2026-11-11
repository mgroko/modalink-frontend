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
      <div class="nueva-publicacion__cabecera">
        <h3 class="va-h5 nueva-publicacion__titulo">{{ tituloModal }}</h3>
        <p class="nueva-publicacion__subtitulo">
          {{ subtituloModal }}
        </p>
      </div>
    </template>

    <div v-if="cargandoDetalle" class="nueva-publicacion__cargando" role="status">
      <span class="nueva-publicacion__spinner" aria-hidden="true"></span>
      Cargando publicación...
    </div>

    <div v-else-if="errorDetalle" class="nueva-publicacion__cargando">
      <BaseAlert :message="errorDetalle" type="error" />
      <VaButton preset="secondary" icon="mso-refresh" @click="cargarDetalle">
        Reintentar
      </VaButton>
    </div>

    <div v-else class="nueva-publicacion__form">
      <BaseAlert :message="errorGeneral" type="error" />
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
          <SelectorUbicacion
            v-model="form.ubicacion"
            horizontal
            :disabled="subiendo"
            :error="!!errores.ubicacion"
            :error-message="errores.ubicacion || ''"
          />
        </div>
      </div>

      <p v-if="errorProyectos" class="nueva-publicacion__nota">
        {{ errorProyectos }}
      </p>

      <div v-if="form.ubicacion" class="nueva-publicacion__quitar-ubicacion">
        <VaButton
          preset="secondary"
          size="small"
          color="danger"
          icon="mso-close"
          :disabled="subiendo"
          @click="quitarUbicacion"
        >
          Quitar ubicación
        </VaButton>
      </div>

      <section class="nueva-publicacion__imagenes">
        <div class="nueva-publicacion__imagenes-cabecera">
          <div class="nueva-publicacion__imagenes-titulo">
            <h4 class="nueva-publicacion__label">Imágenes*</h4>
            <p class="nueva-publicacion__ayuda">
              La primera será la portada.
            </p>
          </div>
          <span class="nueva-publicacion__contador">
            {{ archivos.length }} / {{ PUBLICACION_IMAGENES.MAX_IMAGENES }}
          </span>
        </div>

        <div class="nueva-publicacion__previews">
          <figure
            v-for="(imagen, indice) in archivos"
            :key="imagen.id"
            class="nueva-publicacion__preview"
            :class="{
              'nueva-publicacion__preview--arrastrando':
                indiceArrastrado === indice,
            }"
            draggable="true"
            @dragstart="iniciarArrastre(indice, $event)"
            @dragover.prevent
            @drop.prevent="soltarImagen(indice)"
            @dragend="terminarArrastre"
          >
            <img
              :src="imagen.preview"
              :alt="imagen.nombre"
              class="nueva-publicacion__preview-img"
              draggable="false"
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

          <button
            v-if="archivos.length < PUBLICACION_IMAGENES.MAX_IMAGENES"
            type="button"
            class="nueva-publicacion__agregar"
            :disabled="subiendo"
            @click="seleccionarArchivos"
          >
            <span class="material-symbols-outlined">upload</span>
            <span>Agregar</span>
          </button>
        </div>

        <input
          ref="inputArchivos"
          class="nueva-publicacion__input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          :disabled="subiendo"
          @change="alSeleccionarArchivos"
        />

        <p class="nueva-publicacion__ayuda">
          JPG, PNG o WEBP · hasta 10 MB por imagen
        </p>

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
          :disabled="subiendo || cargandoDetalle || !!errorDetalle || !hayImagenes"
          icon="mso-publish"
          @click="publicar"
        >
          {{ textoGuardar }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import publicacionService from "../../services/publicacionService";
import proyectoService from "../../services/proyectoService";
import BaseAlert from "../AlertaBase.vue";
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
import { resolverFotoUrl } from "../../utils/fotos.js";

const ESTADOS_ASOCIABLES = [
  ESTADOS_PROYECTO.CONFIRMADO,
  ESTADOS_PROYECTO.FINALIZADO,
];

export default {
  name: "ModalNuevaPublicacion",
  components: {
    BaseAlert,
    SelectorUbicacion,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    modo: {
      type: String,
      default: "crear",
      validator: (valor) => ["crear", "editar"].includes(valor),
    },
    publicacion: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "creada", "actualizada"],
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
      controladorDetalle: null,
      cargandoDetalle: false,
      errorDetalle: "",
      detalleOriginal: null,
      indiceArrastrado: null,
    };
  },
  computed: {
    esEdicion() {
      return this.modo === "editar";
    },
    tituloModal() {
      return this.esEdicion ? "Editar publicación" : "Nueva publicación";
    },
    subtituloModal() {
      return this.esEdicion
        ? "Actualizá el contenido de tu publicación."
        : "Mostrá tu trabajo a la red de ModaLink.";
    },
    textoGuardar() {
      return this.esEdicion ? "Guardar cambios" : "Publicar";
    },
    imagenesExistentes() {
      return this.archivos.filter((imagen) => imagen.tipo === "existente");
    },
    imagenesNuevas() {
      return this.archivos.filter((imagen) => imagen.tipo === "nueva");
    },
    hayImagenes() {
      return this.archivos.length > 0;
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.reiniciarFormulario();
        this.cargarProyectos();
        if (this.esEdicion) this.cargarDetalle();
        return;
      }
      if (this.controladorProyectos) {
        this.controladorProyectos.abort();
        this.controladorProyectos = null;
      }
      if (this.controladorDetalle) {
        this.controladorDetalle.abort();
        this.controladorDetalle = null;
      }
      this.cargandoProyectos = false;
      this.cargandoDetalle = false;
      revocarPreviewsPublicacion(this.imagenesNuevas);
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
    if (this.controladorDetalle) this.controladorDetalle.abort();
    revocarPreviewsPublicacion(this.imagenesNuevas);
  },
  methods: {
    cambiarVisibilidad(abierto) {
      if (this.subiendo && !abierto) return;
      this.$emit("update:modelValue", abierto);
    },
    async cargarDetalle() {
      const idPublicacion = this.publicacion?.idPublicacion;
      if (!idPublicacion) {
        this.errorDetalle = "No se encontró la publicación a editar.";
        return;
      }

      if (this.controladorDetalle) this.controladorDetalle.abort();
      const controller = new AbortController();
      this.controladorDetalle = controller;
      this.cargandoDetalle = true;
      this.errorDetalle = "";

      try {
        const response = await publicacionService.obtener(
          idPublicacion,
          controller.signal
        );
        if (this.controladorDetalle !== controller) return;

        const detalle = normalizarPublicacion(response?.data);
        if (!detalle) {
          this.errorDetalle = "No se pudo cargar la publicación.";
          return;
        }

        this.detalleOriginal = detalle;
        this.form = {
          titulo: detalle.titulo || "",
          descripcion: detalle.descripcion || "",
          idProyecto: detalle.proyecto?.idProyecto ?? null,
          ubicacion: this.mapearUbicacion(detalle.ubicacion),
        };
        this.archivos = (detalle.imagenes || []).map((imagen) => ({
          tipo: "existente",
          id: `existente-${imagen.idImagen}`,
          idImagen: imagen.idImagen,
          nombre: `Imagen ${imagen.idImagen}`,
          url: imagen.url,
          preview: resolverFotoUrl(imagen.url),
          orden: imagen.orden,
        }));
        this.incluirProyectoActual(detalle.proyecto);
      } catch (error) {
        if (
          this.controladorDetalle !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        const status = error?.response?.status;
        this.errorDetalle =
          status === 404
            ? "La publicación no existe o no pertenece a tu perfil."
            : mensajeErrorApi(
                error,
                "No se pudo cargar la publicación para editar."
              );
      } finally {
        if (this.controladorDetalle === controller) {
          this.cargandoDetalle = false;
          this.controladorDetalle = null;
        }
      }
    },
    mapearUbicacion(ubicacion) {
      const localidadId = ubicacion?.idExterno;
      const provinciaId = ubicacion?.provincia?.idExterno;
      if (!localidadId || !provinciaId) return null;
      return {
        localidadId: String(localidadId),
        provinciaId: String(provinciaId),
      };
    },
    incluirProyectoActual(proyecto) {
      if (proyecto?.idProyecto == null) return;
      const existe = this.proyectos.some(
        (item) => String(item.idProyecto) === String(proyecto.idProyecto)
      );
      if (existe) return;
      this.proyectos = [
        ...this.proyectos,
        {
          idProyecto: proyecto.idProyecto,
          nombre: `${proyecto.nombre || "Proyecto"} (actual)`,
          estado: null,
          actual: true,
        },
      ];
    },
    reiniciarFormulario() {
      revocarPreviewsPublicacion(this.imagenesNuevas);
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
      this.detalleOriginal = null;
      this.cargandoDetalle = false;
      this.errorDetalle = "";
      if (this.controladorDetalle) {
        this.controladorDetalle.abort();
        this.controladorDetalle = null;
      }
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
    seleccionarArchivos() {
      if (this.subiendo) return;
      this.$refs.inputArchivos?.click();
    },
    alSeleccionarArchivos(evento) {
      const archivos = Array.from(evento.target.files || []);
      if (archivos.length) this.agregarArchivos(archivos);
      evento.target.value = "";
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

        if (this.esEdicion) {
          this.incluirProyectoActual(this.detalleOriginal?.proyecto);
        }
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
      const archivosNuevos = this.archivos
        .filter((imagen) => imagen.tipo !== "existente" && imagen.archivo)
        .map((imagen) => imagen.archivo);
      const existentes = this.archivos
        .filter((imagen) => imagen.tipo === "existente")
        .map((_, indice) => ({
          name: `existente-${indice}`,
          size: 1,
          lastModified: 0,
        }));
      const { validas, rechazadas } = await agregarImagenesPublicacion(
        [...existentes, ...archivosNuevos],
        nuevas
      );

      this.rechazadas = rechazadas;
      if (validas.length) {
        this.archivos = [
          ...this.archivos,
          ...validas.map((archivo) => ({
            ...crearItemImagenPublicacion(archivo),
            tipo: "nueva",
          })),
        ];
        this.limpiarError("archivos");
        this.errorGeneral = "";
      }
    },
    quitarImagen(indice) {
      const imagen = this.archivos[indice];
      if (!imagen || this.subiendo) return;
      if (imagen.tipo !== "existente") {
        revocarPreviewsPublicacion([imagen]);
      }
      this.archivos = this.archivos.filter((_, i) => i !== indice);
    },
    iniciarArrastre(indice, evento) {
      if (this.subiendo) return;
      this.indiceArrastrado = indice;
      if (evento?.dataTransfer) {
        evento.dataTransfer.effectAllowed = "move";
        evento.dataTransfer.setData("text/plain", String(indice));
      }
    },
    soltarImagen(indiceDestino) {
      const indiceOrigen = this.indiceArrastrado;
      this.indiceArrastrado = null;
      if (
        this.subiendo ||
        indiceOrigen == null ||
        indiceOrigen === indiceDestino ||
        indiceOrigen < 0 ||
        indiceOrigen >= this.archivos.length
      ) {
        return;
      }

      const imagenes = [...this.archivos];
      const [movida] = imagenes.splice(indiceOrigen, 1);
      imagenes.splice(indiceDestino, 0, movida);
      this.archivos = imagenes;
    },
    terminarArrastre() {
      this.indiceArrastrado = null;
    },
    validar() {
      const errores = validarFormularioPublicacion(
        {
          ...this.form,
          archivos: this.imagenesNuevas.map((imagen) => imagen.archivo),
        },
        this.archivos.length
      );
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
      if (this.esEdicion) return this.guardarEdicion();
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
    async guardarEdicion() {
      if (!this.validar()) return;

      const idPublicacion =
        this.publicacion?.idPublicacion ||
        this.detalleOriginal?.idPublicacion;
      if (!idPublicacion) {
        this.errorGeneral = "No se encontró la publicación a editar.";
        return;
      }

      this.subiendo = true;
      this.progreso = 0;
      this.errorGeneral = "";

      const base = {
        titulo: this.form.titulo,
        descripcion: this.form.descripcion,
        idProyecto:
          this.form.idProyecto != null && this.form.idProyecto !== ""
            ? this.form.idProyecto
            : "",
        localidadId: this.form.ubicacion?.localidadId || "",
        provinciaId: this.form.ubicacion?.provinciaId || "",
      };

      const nuevas = this.imagenesNuevas;
      const existentes = this.imagenesExistentes;
      const idsExistentes = existentes.map((imagen) => imagen.idImagen);
      const originales = new Set(
        (this.detalleOriginal?.imagenes || []).map((imagen) =>
          String(imagen.idImagen)
        )
      );

      const idsNuevasDesdeRespuesta = (data) =>
        (data?.imagenes || [])
          .filter((imagen) => !originales.has(String(imagen.idImagen)))
          .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0))
          .map((imagen) => imagen.idImagen);

      const guardar = async (imagenesConservadas, archivos) => {
        const response = await publicacionService.actualizar(
          idPublicacion,
          {
            ...base,
            imagenesConservadas,
            archivos,
          },
          (porcentaje) => {
            this.progreso = porcentaje;
          }
        );
        return normalizarPublicacion(response?.data);
      };

      try {
        let resultado = null;

        if (!nuevas.length) {
          resultado = await guardar(idsExistentes, []);
        } else if (existentes.length > 0) {
          const dataSubida = await guardar(
            idsExistentes,
            nuevas.map((imagen) => imagen.archivo)
          );
          const idsNuevas = idsNuevasDesdeRespuesta(dataSubida);
          nuevas.forEach((imagen, indice) => {
            imagen.idImagen = idsNuevas[indice];
          });

          const ordenFinal = this.archivos
            .map((imagen) => imagen.idImagen)
            .filter((id) => id != null);
          resultado = await guardar(ordenFinal, []);
        } else {
          const ancla = this.detalleOriginal?.imagenes?.[0]?.idImagen;
          if (ancla == null) {
            throw new Error(
              "No hay una imagen existente para iniciar el reemplazo."
            );
          }

          if (nuevas.length <= 9) {
            const dataSubida = await guardar(
              [ancla],
              nuevas.map((imagen) => imagen.archivo)
            );
            const idsNuevas = idsNuevasDesdeRespuesta(dataSubida);
            nuevas.forEach((imagen, indice) => {
              imagen.idImagen = idsNuevas[indice];
            });
            const ordenFinal = nuevas.map((imagen) => imagen.idImagen);
            resultado = await guardar(ordenFinal, []);
          } else {
            const primeras = nuevas.slice(0, 9);
            const restante = nuevas[9];
            const dataPrimera = await guardar(
              [ancla],
              primeras.map((imagen) => imagen.archivo)
            );
            const idsPrimeras = idsNuevasDesdeRespuesta(dataPrimera);
            primeras.forEach((imagen, indice) => {
              imagen.idImagen = idsPrimeras[indice];
            });

            const dataSegunda = await guardar(idsPrimeras, [
              restante.archivo,
            ]);
            const idsTodas = idsNuevasDesdeRespuesta(dataSegunda);
            nuevas.forEach((imagen, indice) => {
              imagen.idImagen = idsTodas[indice];
            });

            const ordenFinal = nuevas.map((imagen) => imagen.idImagen);
            resultado = await guardar(ordenFinal, []);
          }
        }

        this.subiendo = false;
        this.$emit("actualizada", resultado);
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
.nueva-publicacion__cabecera {
  display: grid;
  gap: 0.2rem;
}

.nueva-publicacion__titulo {
  margin: 0;
}

.nueva-publicacion__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.nueva-publicacion__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nueva-publicacion__cargando {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.nueva-publicacion__spinner {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: nueva-publicacion-girar 0.8s linear infinite;
}

@keyframes nueva-publicacion-girar {
  to {
    transform: rotate(360deg);
  }
}

.nueva-publicacion__fila {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 0.75rem;
}

.nueva-publicacion__ubicacion {
  grid-column: span 2;
  min-width: 0;
}

.nueva-publicacion__quitar-ubicacion {
  display: flex;
  justify-content: flex-end;
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

.nueva-publicacion__imagenes-titulo {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
}

.nueva-publicacion__preview {
  position: relative;
  margin: 0;
  cursor: grab;
}

.nueva-publicacion__preview--arrastrando {
  opacity: 0.45;
}

.nueva-publicacion__preview-img {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-surface-muted);
}

.nueva-publicacion__agregar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  min-height: 120px;
  padding: 0.5rem;
  color: var(--color-primary);
  background: var(--color-surface-soft);
  border: 1.5px dashed var(--color-primary-light);
  border-radius: 8px;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.nueva-publicacion__agregar:disabled {
  cursor: default;
  opacity: 0.55;
}

.nueva-publicacion__agregar .material-symbols-outlined {
  font-size: 1.35rem;
}

.nueva-publicacion__input {
  display: none;
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

@media (max-width: 760px) {
  .nueva-publicacion__fila {
    grid-template-columns: 1fr;
  }

  .nueva-publicacion__ubicacion {
    grid-column: auto;
  }

  .nueva-publicacion__previews {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .nueva-publicacion__acciones {
    flex-direction: column-reverse;
  }
}
</style>
