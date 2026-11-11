<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    :no-dismiss="guardando"
    blur
    size="medium"
    class="polaroid-form"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 polaroid-form__titulo">{{ titulo }}</h3>
    </template>

    <div class="polaroid-form__contenido">
      <section v-if="!esTipo" class="polaroid-form__seccion">
        <h4 class="polaroid-form__label">Imagen</h4>

        <div
          v-if="!previewActual"
          class="polaroid-form__dropzone"
          @dragover.prevent
          @drop.prevent="alSoltarArchivo"
        >
          <span class="material-symbols-outlined" aria-hidden="true">
            upload
          </span>
          <p class="polaroid-form__dropzone-titulo">
            Arrastrá una imagen acá
          </p>
          <p class="polaroid-form__ayuda">
            JPG, PNG o WebP · hasta 10 MB
          </p>
          <VaButton
            preset="primary"
            :disabled="guardando"
            @click="seleccionarArchivo"
          >
            Elegir imagen
          </VaButton>
        </div>

        <div v-else class="polaroid-form__preview">
          <img
            :src="previewActual"
            alt="Vista previa de la polaroid"
            class="polaroid-form__preview-img"
          />
          <div class="polaroid-form__preview-datos">
            <strong>{{ nombreArchivo }}</strong>
            <span v-if="pesoArchivo">{{ pesoArchivo }}</span>
            <VaButton
              preset="secondary"
              size="small"
              :disabled="guardando"
              @click="seleccionarArchivo"
            >
              Cambiar imagen
            </VaButton>
          </div>
        </div>

        <input
          ref="inputArchivo"
          class="polaroid-form__input"
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          :disabled="guardando"
          @change="alSeleccionarArchivo"
        />

        <p v-if="esCrear" class="polaroid-form__ayuda">
          Fondo liso y luz natural. Sin filtros ni retoques: así se ve el
          aspecto real.
        </p>
      </section>

      <section
        v-if="!esReemplazar && (!esCrear || !!archivo)"
        class="polaroid-form__seccion"
      >
        <h4 class="polaroid-form__label">Tipo de foto</h4>

        <p
          v-if="cargandoCatalogo"
          class="polaroid-form__nota"
          role="status"
        >
          Cargando tipos de polaroid...
        </p>

        <div v-else-if="errorCatalogo" class="polaroid-form__catalogo-error">
          <BaseAlert :message="errorCatalogo" type="error" />
          <VaButton
            preset="secondary"
            size="small"
            icon="mso-refresh"
            @click="cargarCatalogo"
          >
            Reintentar
          </VaButton>
        </div>

        <div v-else class="polaroid-form__grupos">
          <div
            v-for="grupo in catalogo"
            :key="grupo.codigo || grupo.nombre"
            class="polaroid-form__grupo"
          >
            <p class="polaroid-form__grupo-titulo">{{ grupo.nombre }}</p>
            <div class="polaroid-form__tipos">
              <button
                v-for="tipo in grupo.tipos"
                :key="tipo.idTipoPolaroid"
                type="button"
                class="polaroid-form__tipo"
                :class="{
                  'polaroid-form__tipo--activo':
                    String(idTipoSeleccionado) ===
                    String(tipo.idTipoPolaroid),
                }"
                :aria-pressed="
                  String(idTipoSeleccionado) ===
                  String(tipo.idTipoPolaroid)
                    ? 'true'
                    : 'false'
                "
                :disabled="guardando"
                @click="seleccionarTipo(tipo)"
              >
                <span
                  class="polaroid-form__tipo-punto"
                  aria-hidden="true"
                ></span>
                {{ tipo.nombre }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="!esTipo" class="polaroid-form__ayuda">
          Podés repetir un tipo en distintas fotos.
        </p>
      </section>

      <BaseAlert v-if="error" :message="error" type="error" />
    </div>

    <template #footer>
      <div class="polaroid-form__acciones">
        <VaButton
          preset="secondary"
          :disabled="guardando"
          @click="cerrar"
        >
          Cancelar
        </VaButton>
        <VaButton
          color="primary"
          :loading="guardando"
          :disabled="!puedeGuardar || guardando"
          @click="guardar"
        >
          {{ textoGuardar }}
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import polaroidService from "../../services/polaroidService";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  MODOS_FORM_POLAROID,
  formatearPesoArchivo,
  mensajeErrorPolaroid,
  prepararCatalogoPolaroids,
  validarArchivoPolaroid,
} from "../../utils/polaroidConstants.js";

export default {
  name: "ModalFormPolaroid",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    idPerfil: {
      type: [Number, String],
      required: true,
    },
    modo: {
      type: String,
      default: MODOS_FORM_POLAROID.CREAR,
      validator: (valor) =>
        Object.values(MODOS_FORM_POLAROID).includes(valor),
    },
    polaroid: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "actualizado"],
  data() {
    return {
      archivo: null,
      previewNuevo: null,
      idTipoSeleccionado: null,
      catalogo: [],
      cargandoCatalogo: false,
      errorCatalogo: "",
      error: "",
      guardando: false,
      controladorCatalogo: null,
    };
  },
  computed: {
    esCrear() {
      return this.modo === MODOS_FORM_POLAROID.CREAR;
    },
    esReemplazar() {
      return this.modo === MODOS_FORM_POLAROID.REEMPLAZAR;
    },
    esTipo() {
      return this.modo === MODOS_FORM_POLAROID.TIPO;
    },
    titulo() {
      if (this.esReemplazar) return "Reemplazar imagen";
      if (this.esTipo) return "Cambiar tipo de polaroid";
      return "Agregar polaroid";
    },
    textoGuardar() {
      if (this.esReemplazar) return "Reemplazar imagen";
      if (this.esTipo) return "Guardar tipo";
      return "Agregar polaroid";
    },
    previewActual() {
      if (this.previewNuevo) return this.previewNuevo;
      if (this.esReemplazar) return resolverFotoUrl(this.polaroid?.url);
      return "";
    },
    nombreArchivo() {
      if (this.archivo) return this.archivo.name;
      return "Imagen actual";
    },
    pesoArchivo() {
      return this.archivo ? formatearPesoArchivo(this.archivo.size) : "";
    },
    puedeGuardar() {
      if (this.guardando) return false;
      if (this.esCrear) {
        return !!this.archivo && this.idTipoSeleccionado != null;
      }
      if (this.esReemplazar) return !!this.archivo;
      if (this.esTipo) {
        return (
          this.idTipoSeleccionado != null &&
          String(this.idTipoSeleccionado) !==
            String(this.polaroid?.tipo?.idTipoPolaroid)
        );
      }
      return false;
    },
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.reiniciar();
        return;
      }
      this.abortarCatalogo();
      this.revocarPreview();
    },
  },
  beforeUnmount() {
    this.abortarCatalogo();
    this.revocarPreview();
  },
  methods: {
    reiniciar() {
      this.archivo = null;
      this.idTipoSeleccionado = this.polaroid?.tipo?.idTipoPolaroid ?? null;
      this.error = "";
      this.errorCatalogo = "";
      this.revocarPreview();

      if (this.esCrear || this.esTipo) {
        this.cargarCatalogo();
      }
    },
    revocarPreview() {
      if (this.previewNuevo) {
        URL.revokeObjectURL(this.previewNuevo);
        this.previewNuevo = null;
      }
    },
    abortarCatalogo() {
      if (this.controladorCatalogo) {
        this.controladorCatalogo.abort();
        this.controladorCatalogo = null;
      }
    },
    seleccionarArchivo() {
      if (this.guardando) return;
      this.$refs.inputArchivo?.click();
    },
    alSeleccionarArchivo(evento) {
      const archivo = evento.target.files?.[0] || null;
      evento.target.value = "";
      this.asignarArchivo(archivo);
    },
    alSoltarArchivo(evento) {
      if (this.guardando) return;
      const archivo = evento.dataTransfer?.files?.[0] || null;
      this.asignarArchivo(archivo);
    },
    asignarArchivo(archivo) {
      if (!archivo) return;
      const error = validarArchivoPolaroid(archivo);
      if (error) {
        this.error = error;
        return;
      }
      this.error = "";
      this.revocarPreview();
      this.archivo = archivo;
      this.previewNuevo = URL.createObjectURL(archivo);
    },
    async cargarCatalogo() {
      this.abortarCatalogo();
      const controller = new AbortController();
      this.controladorCatalogo = controller;
      this.cargandoCatalogo = true;
      this.errorCatalogo = "";

      try {
        const response = await polaroidService.listarTipos(
          controller.signal
        );
        if (this.controladorCatalogo !== controller) return;
        const preparado = prepararCatalogoPolaroids(response?.data);
        this.catalogo = preparado.grupos;
      } catch (error) {
        if (
          this.controladorCatalogo !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.catalogo = [];
        this.errorCatalogo = mensajeErrorPolaroid(
          error,
          "No se pudieron cargar los tipos de polaroid."
        );
      } finally {
        if (this.controladorCatalogo === controller) {
          this.cargandoCatalogo = false;
          this.controladorCatalogo = null;
        }
      }
    },
    seleccionarTipo(tipo) {
      if (this.guardando) return;
      this.error = "";
      this.idTipoSeleccionado = tipo.idTipoPolaroid;
    },
    async guardar() {
      if (!this.puedeGuardar) return;
      this.guardando = true;
      this.error = "";

      try {
        if (this.esCrear) {
          await polaroidService.crear(this.idPerfil, {
            archivo: this.archivo,
            idTipoPolaroid: this.idTipoSeleccionado,
          });
        } else if (this.esReemplazar) {
          await polaroidService.modificar(
            this.idPerfil,
            this.polaroid.idPolaroid,
            { archivo: this.archivo }
          );
        } else {
          await polaroidService.modificar(
            this.idPerfil,
            this.polaroid.idPolaroid,
            { idTipoPolaroid: this.idTipoSeleccionado }
          );
        }

        this.$emit("actualizado");
        this.$emit("update:modelValue", false);
      } catch (error) {
        this.error = mensajeErrorPolaroid(
          error,
          "No se pudo guardar la polaroid."
        );
      } finally {
        this.guardando = false;
      }
    },
    cambiarVisibilidad(valor) {
      if (this.guardando && !valor) return;
      this.$emit("update:modelValue", valor);
    },
    cerrar() {
      if (this.guardando) return;
      this.$emit("update:modelValue", false);
    },
  },
};
</script>

<style scoped>
.polaroid-form__titulo {
  margin: 0;
}

.polaroid-form__contenido {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.polaroid-form__seccion {
  display: grid;
  gap: 0.6rem;
}

.polaroid-form__label {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
}

.polaroid-form__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 1.6rem 1rem;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 2px dashed var(--color-info-border);
  border-radius: 11px;
  text-align: center;
}

.polaroid-form__dropzone .material-symbols-outlined {
  color: var(--color-primary);
  font-size: 2rem;
}

.polaroid-form__dropzone-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
}

.polaroid-form__ayuda {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.77rem;
  line-height: 1.45;
}

.polaroid-form__preview {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.polaroid-form__preview-img {
  width: 7rem;
  height: 9rem;
  flex: 0 0 7rem;
  object-fit: cover;
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.polaroid-form__preview-datos {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.polaroid-form__preview-datos strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.polaroid-form__preview-datos span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.polaroid-form__input {
  display: none;
}

.polaroid-form__grupos {
  display: grid;
  gap: 0.9rem;
}

.polaroid-form__grupo {
  display: grid;
  gap: 0.4rem;
}

.polaroid-form__grupo-titulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.polaroid-form__tipos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.polaroid-form__tipo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 0.4rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.polaroid-form__tipo--activo {
  color: var(--color-primary);
  background: var(--color-chip);
  border-color: var(--color-primary);
}

.polaroid-form__tipo-punto {
  width: 0.5rem;
  height: 0.5rem;
  flex: 0 0 0.5rem;
  background: var(--color-border-strong);
  border-radius: 50%;
}

.polaroid-form__tipo--activo .polaroid-form__tipo-punto {
  background: var(--color-primary);
}

.polaroid-form__catalogo-error {
  display: grid;
  gap: 0.5rem;
  justify-items: start;
}

.polaroid-form__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.polaroid-form__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

@media (max-width: 560px) {
  .polaroid-form__tipos {
    grid-template-columns: 1fr;
  }

  .polaroid-form__preview {
    flex-direction: column;
    align-items: stretch;
  }

  .polaroid-form__preview-img {
    width: 100%;
    height: auto;
    max-height: 16rem;
    flex-basis: auto;
  }

  .polaroid-form__acciones {
    flex-direction: column-reverse;
  }
}
</style>
