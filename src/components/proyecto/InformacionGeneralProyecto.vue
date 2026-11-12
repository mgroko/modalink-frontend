<template>
  <div class="info-proyecto">
    <section class="info-proyecto__panel">
      <h2 class="info-proyecto__titulo">Datos generales</h2>
      <p v-if="proyecto.descripcion" class="info-proyecto__descripcion">
        {{ proyecto.descripcion }}
      </p>

      <div class="info-proyecto__datos">
        <div
          class="info-proyecto__dato"
          :class="{ 'info-proyecto__dato--destacado': !!proyecto.fechaEntregaEstipulada }"
        >
          <span class="info-proyecto__dato-label">Fecha de entrega</span>
          <span class="info-proyecto__dato-valor">{{ fechaEntregaTexto }}</span>
          <span v-if="textoDiasEntrega" class="info-proyecto__dato-hint">
            {{ textoDiasEntrega }}
          </span>
        </div>

        <div class="info-proyecto__dato">
          <span class="info-proyecto__dato-label">Fecha de inicio</span>
          <span class="info-proyecto__dato-valor">{{ fechaInicioTexto }}</span>
        </div>

        <div class="info-proyecto__dato">
          <span class="info-proyecto__dato-label">Ubicación</span>
          <span class="info-proyecto__dato-valor">{{ ubicacionTexto }}</span>
        </div>

        <div class="info-proyecto__dato">
          <span class="info-proyecto__dato-label">Director</span>
          <span class="info-proyecto__dato-valor">{{ proyecto.nombreDirector || "—" }}</span>
        </div>

        <div class="info-proyecto__dato">
          <span class="info-proyecto__dato-label">Privacidad</span>
          <span class="info-proyecto__dato-valor">{{ privacidadTexto }}</span>
          <span v-if="privacidadHint" class="info-proyecto__dato-hint">
            {{ privacidadHint }}
          </span>
        </div>

        <div v-if="proyecto.fechaFinalizacion" class="info-proyecto__dato">
          <span class="info-proyecto__dato-label">Finalizado el</span>
          <span class="info-proyecto__dato-valor">
            {{ formatearFecha(proyecto.fechaFinalizacion) }}
          </span>
          <span
            v-if="proyecto.finalizacionPrematura"
            class="info-proyecto__chip info-proyecto__chip--prematura"
          >
            Finalizado anticipadamente
          </span>
        </div>

        <div v-if="proyecto.aceptaPostulacionGral" class="info-proyecto__dato">
          <span class="info-proyecto__dato-label">Postulaciones</span>
          <span class="info-proyecto__chip">Acepta postulaciones</span>
        </div>
      </div>
    </section>

    <div class="info-proyecto__columnas">
      <section class="info-proyecto__panel info-proyecto__panel--objetivos">
        <header class="info-proyecto__panel-cabecera">
          <h2 class="info-proyecto__titulo">Objetivos</h2>
          <button
            v-if="puedeModificar"
            type="button"
            class="info-proyecto__accion"
            @click="irAAgregarObjetivo"
          >
            Agregar objetivo
          </button>
        </header>

        <ul v-if="objetivos.length" class="info-proyecto__objetivos">
          <li
            v-for="objetivo in objetivos"
            :key="objetivo.idObjetivo"
            class="info-proyecto__objetivo"
          >
            <p class="info-proyecto__objetivo-nombre">{{ objetivo.nombre }}</p>
            <p v-if="objetivo.descripcion" class="info-proyecto__objetivo-desc">
              {{ objetivo.descripcion }}
            </p>
          </li>
        </ul>
        <p v-else class="info-proyecto__vacio">
          Este proyecto no tiene objetivos cargados.
        </p>
      </section>

      <section class="info-proyecto__panel info-proyecto__panel--moodboard">
        <header class="info-proyecto__panel-cabecera">
          <div class="info-proyecto__cabecera-texto">
            <h2 class="info-proyecto__titulo">Moodboard</h2>
            <p class="info-proyecto__ayuda">
              La referencia visual que el equipo debe respetar.
            </p>
          </div>
          <button
            v-if="puedeModificar && imagenes.length < maximoImagenes"
            type="button"
            class="info-proyecto__accion"
            @click="irAAgregarImagen"
          >
            Agregar imagen
          </button>
        </header>

        <div
          class="info-proyecto__moodboard"
          :class="{ 'info-proyecto__moodboard--solo-agregar': !imagenes.length && puedeModificar }"
          :style="{ '--filas-principales': filasPrincipales }"
        >
          <button
            v-for="(imagen, indice) in imagenes"
            :key="imagen.id"
            type="button"
            class="info-proyecto__moodboard-item"
            :class="{
              'info-proyecto__moodboard-item--principal': indice === 0,
            }"
            :aria-label="`Ampliar ${imagen.nombre}`"
            @click="galeriaAbierta = true"
          >
            <img :src="imagen.preview" :alt="imagen.nombre" loading="lazy" />
            <span v-if="indice === 0" class="info-proyecto__moodboard-label">
              Imagen de referencia
            </span>
          </button>

          <button
            v-if="puedeModificar && imagenes.length < maximoImagenes"
            type="button"
            class="info-proyecto__moodboard-agregar"
            @click="irAAgregarImagen"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              add_photo_alternate
            </span>
            <span>Subir imagen</span>
          </button>
        </div>

        <p v-if="!imagenes.length && !puedeModificar" class="info-proyecto__vacio">
          Este proyecto no tiene imágenes en el moodboard.
        </p>

        <p v-if="proyecto.moodboard?.descripcion" class="info-proyecto__moodboard-desc">
          {{ proyecto.moodboard.descripcion }}
        </p>
      </section>
    </div>

    <section class="info-proyecto__panel">
      <header class="info-proyecto__panel-cabecera">
        <div class="info-proyecto__cabecera-texto">
          <h2 class="info-proyecto__titulo">Personal requerido</h2>
          <p class="info-proyecto__ayuda">{{ textoTotalPersonas }}</p>
        </div>
        <button
          v-if="puedeModificar"
          type="button"
          class="info-proyecto__accion"
          @click="irAAgregarRequerimiento"
        >
          Agregar requerimiento
        </button>
      </header>

      <div class="info-proyecto__personal">
        <div class="info-proyecto__personal-columna">
          <h3 class="info-proyecto__subtitulo">Para todo el proyecto</h3>

          <ul v-if="requerimientosGenerales.length" class="info-proyecto__requerimientos">
            <li
              v-for="requerimiento in requerimientosGenerales"
              :key="requerimiento.id"
              class="info-proyecto__requerimiento"
            >
              <span class="info-proyecto__numero">{{ requerimiento.cantidad }}</span>
              <div class="info-proyecto__requerimiento-cuerpo">
                <p class="info-proyecto__profesion">{{ requerimiento.nombreProfesion }}</p>
                <p
                  v-if="requerimiento.descripcion"
                  class="info-proyecto__requerimiento-desc"
                >
                  {{ requerimiento.descripcion }}
                </p>
              </div>
            </li>
          </ul>
          <p v-else class="info-proyecto__vacio">
            No hay requerimientos generales.
          </p>
        </div>

        <div class="info-proyecto__personal-columna">
          <h3 class="info-proyecto__subtitulo">Por actividad</h3>

          <p v-if="cargandoActividades" class="info-proyecto__cargando">
            Cargando actividades...
          </p>

          <div
            v-else-if="actividadesConRequerimientos.length"
            class="info-proyecto__actividades"
          >
            <article
              v-for="grupo in actividadesConRequerimientos"
              :key="grupo.idActividad"
              class="info-proyecto__actividad"
            >
              <header class="info-proyecto__actividad-cabecera">
                <span class="info-proyecto__actividad-nombre">{{ grupo.nombre }}</span>
                <span v-if="grupo.fecha" class="info-proyecto__actividad-fecha">
                  {{ grupo.fecha }}
                </span>
              </header>

              <ul class="info-proyecto__requerimientos info-proyecto__requerimientos--actividad">
                <li
                  v-for="requerimiento in grupo.requerimientos"
                  :key="requerimiento.id"
                  class="info-proyecto__requerimiento"
                >
                  <span class="info-proyecto__numero">{{ requerimiento.cantidad }}</span>
                  <div class="info-proyecto__requerimiento-cuerpo">
                    <p class="info-proyecto__profesion">
                      {{ requerimiento.nombreProfesion }}
                    </p>
                    <p
                      v-if="requerimiento.descripcion"
                      class="info-proyecto__requerimiento-desc"
                    >
                      {{ requerimiento.descripcion }}
                    </p>
                  </div>
                </li>
              </ul>
            </article>
          </div>

          <p v-else-if="errorActividades" class="info-proyecto__vacio">
            {{ errorActividades }}
          </p>
          <p v-else class="info-proyecto__vacio">
            No hay actividades con requerimientos abiertos.
          </p>
        </div>
      </div>
    </section>

    <ModalGaleriaMoodboard
      :model-value="galeriaAbierta"
      :imagenes="imagenes"
      solo-lectura
      @update:model-value="galeriaAbierta = $event"
    />
  </div>
</template>

<script>
import actividadService from "../../services/actividadService.js";
import ModalGaleriaMoodboard from "./ModalGaleriaMoodboard.vue";
import {
  diasRestantes,
  fechaLargaSinDia,
  formatearFecha,
} from "../../utils/fechas.js";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  ESTADOS_ACTIVIDAD,
  normalizarEstadoActividad,
} from "../../utils/actividadConstants.js";
import {
  ETIQUETAS_PRIVACIDAD,
  MOODBOARD_IMAGENES,
  PRIVACIDADES,
} from "../../utils/proyectoConstants.js";

let controladorActividades = null;

/*
 * Pestaña Información general del proyecto. Resume datos generales,
 * objetivos, moodboard (imágenes + descripción) y personal requerido.
 * Las acciones de alta navegan al paso correspondiente del wizard de
 * modificación; no crean entidades desde acá.
 */
export default {
  name: "InformacionGeneralProyecto",
  components: { ModalGaleriaMoodboard },
  props: {
    proyecto: {
      type: Object,
      required: true,
    },
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    /** Habilita los accesos directos a los pasos de edición. */
    puedeModificar: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      actividades: [],
      cargandoActividades: true,
      errorActividades: "",
      idCargaActividades: 0,
      galeriaAbierta: false,
      maximoImagenes: MOODBOARD_IMAGENES.MAX_IMAGENES,
    };
  },
  computed: {
    objetivos() {
      return Array.isArray(this.proyecto?.objetivos) ? this.proyecto.objetivos : [];
    },
    imagenes() {
      const imagenes = this.proyecto?.moodboard?.imagenes || [];
      return imagenes.map((imagen, indice) => ({
        id: imagen.idImagen,
        nombre: `Imagen ${indice + 1}`,
        preview: resolverFotoUrl(imagen.url),
      }));
    },
    /**
     * La imagen principal ocupa la columna izquierda. Se estira tantas filas
     * como elementos tenga la columna derecha para no dejar un hueco cuando
     * el moodboard tiene muchas imágenes.
     */
    filasPrincipales() {
      const puedeAgregar =
        this.puedeModificar && this.imagenes.length < this.maximoImagenes;
      const derecha = this.imagenes.length - 1 + (puedeAgregar ? 1 : 0);
      return Math.max(derecha, 1);
    },
    esPrivado() {
      return this.proyecto?.privacidad === PRIVACIDADES.PRIVADO;
    },
    privacidadTexto() {
      return (
        ETIQUETAS_PRIVACIDAD[this.proyecto?.privacidad] ||
        this.proyecto?.privacidad ||
        "—"
      );
    },
    privacidadHint() {
      return this.esPrivado
        ? "Visible para tus contactos y los miembros del proyecto"
        : "";
    },
    ubicacionTexto() {
      const ciudad = this.proyecto?.ubicacion?.ciudad?.nombre;
      const provincia = this.proyecto?.ubicacion?.ciudad?.provincia?.nombre;
      if (ciudad && provincia) return `${ciudad}, ${provincia}`;
      return ciudad || provincia || "—";
    },
    fechaEntregaTexto() {
      return fechaLargaSinDia(this.proyecto?.fechaEntregaEstipulada) || "Sin definir";
    },
    fechaInicioTexto() {
      return fechaLargaSinDia(this.proyecto?.fechaInicio) || "Sin definir";
    },
    diasParaEntrega() {
      return diasRestantes(this.proyecto?.fechaEntregaEstipulada);
    },
    textoDiasEntrega() {
      if (this.diasParaEntrega == null) return "";
      return this.diasParaEntrega === 1
        ? "Falta 1 día"
        : `Faltan ${this.diasParaEntrega} días`;
    },
    requerimientosGenerales() {
      const requerimientos = Array.isArray(this.proyecto?.requerimientosGral)
        ? this.proyecto.requerimientosGral
        : [];

      return requerimientos.map((requerimiento) => ({
        id: requerimiento.idRequerimientoGral,
        cantidad: Number(requerimiento.cantidad) || 0,
        nombreProfesion: requerimiento.nombreProfesion || "Profesión",
        descripcion: requerimiento.descripcion || "",
      }));
    },
    actividadesConRequerimientos() {
      return this.actividades
        .map((actividad) => {
          const requerimientos = Array.isArray(actividad?.requerimientos)
            ? actividad.requerimientos
            : [];
          if (!requerimientos.length) return null;

          return {
            idActividad: actividad.idActividad,
            nombre: actividad.nombre || "Actividad",
            fecha: this.fechaActividad(actividad),
            requerimientos: requerimientos.map((requerimiento) => ({
              id: requerimiento.idRequerimiento,
              cantidad: Number(requerimiento.cantidad) || 0,
              nombreProfesion: requerimiento.nombreProfesion || "Profesión",
              descripcion: requerimiento.descripcion || "",
            })),
          };
        })
        .filter(Boolean);
    },
    totalPersonas() {
      const generales = this.requerimientosGenerales.reduce(
        (total, requerimiento) => total + requerimiento.cantidad,
        0
      );
      const actividades = this.actividadesConRequerimientos.reduce(
        (total, grupo) =>
          total +
          grupo.requerimientos.reduce(
            (subtotal, requerimiento) => subtotal + requerimiento.cantidad,
            0
          ),
        0
      );
      return generales + actividades;
    },
    textoTotalPersonas() {
      if (this.cargandoActividades && this.totalPersonas === 0) {
        return "Cargando personal requerido...";
      }
      if (this.totalPersonas === 0) return "Sin personal requerido";
      return this.totalPersonas === 1
        ? "1 persona en total"
        : `${this.totalPersonas} personas en total`;
    },
  },
  watch: {
    idProyecto(nuevo, anterior) {
      if (String(nuevo) === String(anterior)) return;
      this.actividades = [];
      this.cargarActividades();
    },
  },
  mounted() {
    this.cargarActividades();
  },
  beforeUnmount() {
    if (controladorActividades) {
      controladorActividades.abort();
      controladorActividades = null;
    }
  },
  methods: {
    formatearFecha,
    fechaActividad(actividad) {
      return fechaLargaSinDia(
        actividad?.fechaHoraInicio || actividad?.inicioProyectado
      );
    },
    async cargarActividades() {
      const corrida = ++this.idCargaActividades;
      if (controladorActividades) controladorActividades.abort();
      controladorActividades = new AbortController();

      this.cargandoActividades = true;
      this.errorActividades = "";

      try {
        const response = await actividadService.buscar(
          this.idProyecto,
          { estado: "PENDIENTE", todos: true },
          controladorActividades.signal
        );
        if (corrida !== this.idCargaActividades) return;

        const contenido = response?.data?.contenido;
        const lista = Array.isArray(contenido) ? contenido : [];
        this.actividades = lista.filter(
          (actividad) =>
            normalizarEstadoActividad(actividad?.estado) ===
            ESTADOS_ACTIVIDAD.PENDIENTE
        );
      } catch (error) {
        if (
          corrida !== this.idCargaActividades ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError" ||
          error?.name === "AbortError"
        ) {
          return;
        }
        // La información general no debe romperse si el perfil no puede
        // consultar actividades (por ejemplo, en la vista pública). Para
        // errores de permisos se degrada en silencio; para fallos reales se
        // avisa sin bloquear el resto del panel.
        this.actividades = [];
        this.errorActividades =
          error?.response?.status === 403
            ? ""
            : "No se pudieron cargar las actividades.";
      } finally {
        if (corrida === this.idCargaActividades) {
          this.cargandoActividades = false;
        }
      }
    },
    irAAgregarObjetivo() {
      if (!this.puedeModificar) return;
      this.irAModificar(2, true);
    },
    irAAgregarRequerimiento() {
      if (!this.puedeModificar) return;
      this.irAModificar(3, true);
    },
    irAAgregarImagen() {
      if (!this.puedeModificar) return;
      this.irAModificar(4, false);
    },
    irAModificar(paso, nuevo) {
      this.$router.push({
        name: "modificar-proyecto",
        params: { id: this.idProyecto },
        query: {
          paso: String(paso),
          ...(nuevo ? { nuevo: "1" } : {}),
        },
      });
    },
  },
};
</script>

<style scoped>
.info-proyecto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-proyecto__panel {
  padding: 1.35rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.info-proyecto__panel--objetivos,
.info-proyecto__panel--moodboard {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.info-proyecto__titulo {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.info-proyecto__descripcion {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.info-proyecto__datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 1px;
  margin-top: 1.1rem;
  background: var(--color-border-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  overflow: hidden;
}

.info-proyecto__dato {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.9rem 1rem;
  background: var(--color-surface);
}

.info-proyecto__dato--destacado {
  background: var(--color-info-soft);
}

.info-proyecto__dato-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.info-proyecto__dato-valor {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
}

.info-proyecto__dato-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.info-proyecto__dato--destacado .info-proyecto__dato-hint {
  color: var(--color-primary);
  font-weight: 600;
}

.info-proyecto__chip {
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.info-proyecto__chip--prematura {
  border: 1px solid var(--color-warning-border, var(--color-border));
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
  font-size: 0.72rem;
}

.info-proyecto__columnas {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 1rem;
  align-items: stretch;
}

.info-proyecto__panel-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-proyecto__cabecera-texto {
  min-width: 0;
}

.info-proyecto__ayuda {
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.info-proyecto__accion {
  flex: 0 0 auto;
  padding: 0.15rem 0.2rem;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-secondary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.info-proyecto__accion:hover {
  color: var(--color-secondary-dark);
  text-decoration: underline;
}

.info-proyecto__accion:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.info-proyecto__objetivos {
  display: grid;
  gap: 0.6rem;
  margin: 0.9rem 0 0;
  padding: 0;
  list-style: none;
}

.info-proyecto__objetivo {
  padding: 0.8rem 1rem;
  border-left: 4px solid var(--color-primary);
  border-radius: 0 8px 8px 0;
  background: var(--color-surface-soft);
}

.info-proyecto__objetivo-nombre {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}

.info-proyecto__objetivo-desc {
  margin: 0.3rem 0 0;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.info-proyecto__moodboard {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  grid-auto-rows: 145px;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

.info-proyecto__moodboard-item {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: var(--color-surface-muted);
  overflow: hidden;
  cursor: zoom-in;
}

.info-proyecto__moodboard-item--principal {
  grid-column: 1;
  grid-row: span var(--filas-principales, 2);
}

.info-proyecto__moodboard-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-proyecto__moodboard-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.info-proyecto__moodboard-label {
  position: absolute;
  bottom: 0.55rem;
  left: 0.6rem;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
}

.info-proyecto__moodboard-agregar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.info-proyecto__moodboard-agregar:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.info-proyecto__moodboard-agregar:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.info-proyecto__moodboard-agregar .material-symbols-outlined {
  font-size: 1.4rem;
}

.info-proyecto__moodboard--solo-agregar .info-proyecto__moodboard-agregar {
  grid-column: 1 / -1;
  min-height: 170px;
}

.info-proyecto__moodboard-desc {
  margin: 0.8rem 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--color-text);
}

.info-proyecto__personal {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.info-proyecto__personal-columna {
  min-width: 0;
}

.info-proyecto__subtitulo {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.info-proyecto__requerimientos {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.info-proyecto__requerimiento {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.info-proyecto__numero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 1.9rem;
  height: 1.9rem;
  padding: 0 0.35rem;
  border-radius: 8px;
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1;
}

.info-proyecto__requerimiento-cuerpo {
  min-width: 0;
}

.info-proyecto__profesion {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.info-proyecto__requerimiento-desc {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-muted);
}

.info-proyecto__actividades {
  display: grid;
  gap: 0.75rem;
}

.info-proyecto__actividad {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface);
}

.info-proyecto__actividad-cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.6rem 0.85rem;
  background: var(--color-surface-muted);
}

.info-proyecto__actividad-nombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.info-proyecto__actividad-fecha {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.info-proyecto__requerimientos--actividad {
  gap: 0;
}

.info-proyecto__requerimientos--actividad .info-proyecto__requerimiento {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.info-proyecto__requerimientos--actividad
  .info-proyecto__requerimiento
  + .info-proyecto__requerimiento {
  border-top: 1px solid var(--color-border-soft);
}

.info-proyecto__cargando {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.info-proyecto__vacio {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  font-style: italic;
  color: var(--color-text-muted);
}

@media (max-width: 1000px) {
  .info-proyecto__columnas,
  .info-proyecto__personal {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .info-proyecto__moodboard {
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 130px;
  }

  .info-proyecto__moodboard-item--principal {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}

@media (max-width: 600px) {
  .info-proyecto__panel {
    padding: 1.1rem 1rem;
  }

  .info-proyecto__moodboard {
    grid-template-columns: 1fr;
  }

  .info-proyecto__moodboard-item--principal {
    grid-column: auto;
    grid-row: auto;
  }
}
</style>
