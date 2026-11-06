<template>
  <div class="calificaciones-proyecto">
    <header class="calificaciones-proyecto__header">
      <div>
        <p class="calificaciones-proyecto__breadcrumb">
          Proyectos<span v-if="nombreProyecto"> / {{ nombreProyecto }}</span>
        </p>
        <h1 class="calificaciones-proyecto__titulo">
          Calificaciones del equipo
        </h1>
      </div>

      <VaButton preset="secondary" @click="volverAlProyecto">
        Volver al proyecto
      </VaButton>
    </header>

    <div v-if="cargando" class="calificaciones-proyecto__estado">
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando calificaciones...
    </div>

    <template v-else>
      <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

      <div v-if="puedeReintentar" class="calificaciones-proyecto__reintento">
        <VaButton preset="primary" @click="cargar">Reintentar</VaButton>
      </div>

      <template v-if="datos">
        <section class="calificaciones-proyecto__panel">
          <div class="calificaciones-proyecto__resumen">
            <div>
              <h2 class="calificaciones-proyecto__subtitulo">Progreso</h2>
              <p class="calificaciones-proyecto__texto">
                {{ realizadas }} de {{ requeridas }} integrantes calificados.
              </p>
            </div>
            <span
              class="calificaciones-proyecto__chip"
              :class="{
                'calificaciones-proyecto__chip--completo':
                  datos.calificacionesCompletas,
              }"
            >
              {{
                datos.calificacionesCompletas
                  ? "Completo"
                  : `${datos.calificacionesPendientes} pendiente(s)`
              }}
            </span>
          </div>

          <div class="calificaciones-proyecto__barra" aria-hidden="true">
            <div
              class="calificaciones-proyecto__barra-relleno"
              :style="{ width: `${porcentaje}%` }"
            />
          </div>
        </section>

        <BaseAlert
          v-if="datos.calificacionesCompletas"
          message="Ya calificaste a todo el equipo. Podés volver al proyecto."
          type="success"
        />

        <section
          v-if="miembrosPendientes.length"
          class="calificaciones-proyecto__panel"
        >
          <div class="calificaciones-proyecto__seccion-cabecera">
            <div>
              <h2 class="calificaciones-proyecto__subtitulo">
                Calificá al equipo
              </h2>
              <p class="calificaciones-proyecto__texto">
                La valoración es de 1 a 5 estrellas y la reseña es obligatoria
                (máximo 200 caracteres).
              </p>
            </div>
            <span class="calificaciones-proyecto__contador">
              {{ miembrosPendientes.length }} por calificar
            </span>
          </div>

          <BaseAlert
            v-if="errorEnvio"
            :message="errorEnvio"
            type="error"
          />

          <div class="calificaciones-proyecto__lista">
            <CalificacionMiembroCard
              v-for="miembro in miembrosPendientes"
              :key="miembro.idPerfil"
              :miembro="miembro"
              :valoracion="valoracionDe(miembro)"
              :resenia="reseniaDe(miembro)"
              :nombre-profesion="profesiones[miembro.idPerfil]"
              :disabled="enviando"
              :error-valoracion="errorValoracionDe(miembro)"
              :error-resenia="errorReseniaDe(miembro)"
              @update:valoracion="actualizarValoracion(miembro, $event)"
              @update:resenia="actualizarResenia(miembro, $event)"
              @touch-resenia="marcarTocado(miembro, 'resenia')"
            />
          </div>

          <p v-if="!puedeEnviar && !enviando" class="calificaciones-proyecto__ayuda">
            Completá la valoración y la reseña de todos los integrantes
            pendientes para enviar.
          </p>

          <div class="calificaciones-proyecto__acciones">
            <VaButton
              preset="secondary"
              :disabled="enviando"
              @click="volverAlProyecto"
            >
              Cancelar
            </VaButton>
            <VaButton
              preset="primary"
              :disabled="!puedeEnviar"
              :loading="enviando"
              @click="enviar"
            >
              Enviar calificaciones
            </VaButton>
          </div>
        </section>

        <section
          v-if="calificacionesEmitidas.length"
          class="calificaciones-proyecto__panel"
        >
          <h2 class="calificaciones-proyecto__subtitulo">Tus calificaciones</h2>
          <p class="calificaciones-proyecto__texto">
            Calificaciones que ya emitiste en este proyecto.
          </p>

          <ul class="calificaciones-proyecto__emitidas">
            <li
              v-for="calificacion in calificacionesEmitidas"
              :key="calificacion.idCalificacion"
              class="calificaciones-proyecto__emitida"
            >
              <div class="calificaciones-proyecto__emitida-cabecera">
                <div class="calificaciones-proyecto__emitida-info">
                  <p class="calificaciones-proyecto__emitida-nombre">
                    {{ nombreReceptor(calificacion) }}
                  </p>
                  <p class="calificaciones-proyecto__emitida-fecha">
                    {{ formatearFecha(calificacion.fechaRegistro) }}
                  </p>
                </div>

                <span
                  class="calificaciones-proyecto__estrellas"
                  :aria-label="`${calificacion.valoracion} de 5 estrellas`"
                >
                  <span
                    v-for="numero in 5"
                    :key="numero"
                    class="material-symbols-outlined"
                    :class="{
                      'calificaciones-proyecto__estrella--activa':
                        numero <= calificacion.valoracion,
                    }"
                    aria-hidden="true"
                  >
                    star
                  </span>
                </span>
              </div>

              <p class="calificaciones-proyecto__emitida-resenia">
                {{ calificacion.resenia }}
              </p>
            </li>
          </ul>
        </section>
      </template>
    </template>
  </div>
</template>

<script>
import proyectoService from "../../services/proyectoService";
import BaseAlert from "../../components/AlertaBase.vue";
import CalificacionMiembroCard from "../../components/proyecto/CalificacionMiembroCard.vue";
import { refrescarSesion } from "../../services/authState";
import { useToast } from "vuestic-ui";
import { mensajeErrorApi } from "../../utils/apiError";
import { clasificarErrorProyecto } from "../../utils/erroresProyecto.js";
import { formatearFecha } from "../../utils/fechas.js";
import {
  CODIGOS_FINALIZACION,
  clasificarErrorFinalizacion,
  contarCalificacionesCompletas,
  indexarProfesionesPorPerfil,
  normalizarCalificacionesProyecto,
  ordenarCalificacionesEmitidas,
  validarCalificaciones,
} from "../../utils/finalizacionConstants.js";

/*
 * UC-37: calificación posterior entre participantes.
 *
 * La vista consume GET /proyectos/{id}/calificaciones, cruza
 * calificacionesEmitidas con miembrosACalificar por idPerfil y envía todas
 * las calificaciones pendientes en un único POST. El backend devuelve el
 * estado actualizado y se reemplaza el estado local sin otro GET.
 */

let controladorCarga = null;
let controladorEnvio = null;

export default {
  name: "CalificacionesProyectoView",
  components: { BaseAlert, CalificacionMiembroCard },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      datos: null,
      proyecto: null,
      profesiones: {},
      formulario: {},
      tocado: {},
      faltantes: [],
      cargando: true,
      enviando: false,
      errorEnvio: "",
      mensajeError: "",
      puedeReintentar: false,
      idCarga: 0,
    };
  },
  computed: {
    idProyecto() {
      return this.$route.params.id;
    },
    nombreProyecto() {
      return this.proyecto?.nombre || "";
    },
    miembros() {
      return Array.isArray(this.datos?.miembrosACalificar)
        ? this.datos.miembrosACalificar
        : [];
    },
    miembrosPendientes() {
      return this.miembros.filter((miembro) => miembro.yaCalificado !== true);
    },
    mapaMiembros() {
      return this.miembros.reduce((mapa, miembro) => {
        mapa[miembro.idPerfil] = miembro;
        return mapa;
      }, {});
    },
    requeridas() {
      const requeridas = Number(this.datos?.calificacionesRequeridas);
      return Number.isInteger(requeridas) && requeridas >= 0
        ? requeridas
        : this.miembros.length;
    },
    realizadas() {
      return contarCalificacionesCompletas(this.miembros, this.formulario);
    },
    porcentaje() {
      if (!this.requeridas) return 0;
      return Math.min(
        100,
        Math.round((this.realizadas / this.requeridas) * 100)
      );
    },
    validacion() {
      return validarCalificaciones(this.miembros, this.formulario);
    },
    puedeEnviar() {
      return (
        !this.enviando &&
        this.miembrosPendientes.length > 0 &&
        this.validacion.valido
      );
    },
    calificacionesEmitidas() {
      return ordenarCalificacionesEmitidas(
        this.datos?.calificacionesEmitidas || []
      );
    },
  },
  watch: {
    "$route.params.id"(nuevo, anterior) {
      if (nuevo === anterior) return;
      this.cargar();
    },
  },
  async mounted() {
    await this.cargar();
  },
  beforeUnmount() {
    if (controladorCarga) controladorCarga.abort();
    if (controladorEnvio) controladorEnvio.abort();
  },
  methods: {
    formatearFecha,
    async cargar() {
      const corrida = ++this.idCarga;
      if (controladorCarga) controladorCarga.abort();
      controladorCarga = new AbortController();

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;
      this.datos = null;
      this.errorEnvio = "";
      this.formulario = {};
      this.tocado = {};
      this.faltantes = [];

      const resultados = await Promise.allSettled([
        proyectoService.obtenerCalificaciones(
          this.idProyecto,
          controladorCarga.signal
        ),
        proyectoService.obtener(this.idProyecto, controladorCarga.signal),
        proyectoService.listarMiembros(
          this.idProyecto,
          { todos: true },
          controladorCarga.signal
        ),
      ]);

      if (corrida !== this.idCarga) return;

      const [calificacionesRes, proyectoRes, miembrosRes] = resultados;

      if (calificacionesRes.status !== "fulfilled") {
        this.cargando = false;
        await this.manejarErrorCarga(calificacionesRes.reason);
        return;
      }

      this.datos = normalizarCalificacionesProyecto(
        calificacionesRes.value?.data
      );
      this.proyecto =
        proyectoRes.status === "fulfilled" ? proyectoRes.value?.data || null : null;
      this.profesiones =
        miembrosRes.status === "fulfilled"
          ? indexarProfesionesPorPerfil(miembrosRes.value?.data)
          : {};
      this.sincronizarFormulario();
      this.cargando = false;
    },
    async manejarErrorCarga(error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }

      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message || "";
      const clasificacion = clasificarErrorProyecto(error);
      const clasificacionFinalizacion = clasificarErrorFinalizacion(error);

      if (clasificacion?.tipo === "perfil-activo") {
        this.mensajeError =
          "No hay un perfil activo seleccionado. Elegí un perfil para continuar.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (clasificacion?.tipo === "perfil-no-encontrado") {
        await refrescarSesion();
        this.mensajeError =
          "Tu perfil activo ya no está disponible. Elegí un perfil desde el dashboard.";
        this.$router.push({ name: "dashboard-usuario" });
        return;
      }

      if (
        clasificacionFinalizacion.codigo ===
          CODIGOS_FINALIZACION.PROYECTO_NO_CALIFICABLE ||
        status === 409
      ) {
        this.toast.init({
          title: "Calificaciones no disponibles",
          message:
            clasificacionFinalizacion.mensaje ||
            mensaje ||
            "El proyecto todavía no está disponible para calificar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.$router.replace({
          name: "dashboard-proyecto",
          params: { id: this.idProyecto },
        });
        return;
      }

      if (status === 403) {
        this.mensajeError =
          mensaje ||
          "No tenés acceso a las calificaciones de este proyecto.";
        return;
      }

      if (status === 404) {
        this.mensajeError =
          mensaje || "No encontramos el proyecto o el perfil activo.";
        return;
      }

      if (!status || status >= 500) {
        this.puedeReintentar = true;
        this.mensajeError =
          "Ocurrió un error al cargar las calificaciones. Inténtalo nuevamente.";
        return;
      }

      this.mensajeError = mensajeErrorApi(
        error,
        "Ocurrió un error al cargar las calificaciones."
      );
    },
    sincronizarFormulario() {
      const siguiente = {};
      for (const miembro of this.miembrosPendientes) {
        const actual = this.formulario[miembro.idPerfil];
        siguiente[miembro.idPerfil] = {
          valoracion: actual?.valoracion ?? 0,
          resenia: actual?.resenia ?? "",
        };
      }
      this.formulario = siguiente;
    },
    valoracionDe(miembro) {
      return Number(this.formulario[miembro?.idPerfil]?.valoracion) || 0;
    },
    reseniaDe(miembro) {
      return this.formulario[miembro?.idPerfil]?.resenia || "";
    },
    actualizarValoracion(miembro, valoracion) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null) return;
      const actual = this.formulario[idPerfil] || { resenia: "" };
      this.formulario = {
        ...this.formulario,
        [idPerfil]: {
          ...actual,
          valoracion: Number(valoracion) || 0,
        },
      };
      this.marcarTocado(miembro, "valoracion");
    },
    actualizarResenia(miembro, resenia) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null) return;
      const actual = this.formulario[idPerfil] || { valoracion: 0 };
      this.formulario = {
        ...this.formulario,
        [idPerfil]: {
          ...actual,
          resenia: String(resenia ?? ""),
        },
      };
    },
    marcarTocado(miembro, campo) {
      const idPerfil = miembro?.idPerfil;
      if (idPerfil == null) return;
      const actual = this.tocado[idPerfil] || {};
      this.tocado = {
        ...this.tocado,
        [idPerfil]: { ...actual, [campo]: true },
      };
    },
    marcarFaltantes(valor) {
      if (!Array.isArray(valor) || !valor.length) return;
      const siguiente = { ...this.tocado };
      for (const item of valor) {
        const idPerfil = Number(item);
        if (!Number.isInteger(idPerfil) || idPerfil <= 0) continue;
        siguiente[idPerfil] = { valoracion: true, resenia: true };
      }
      this.tocado = siguiente;
    },
    errorValoracionDe(miembro) {
      const idPerfil = miembro?.idPerfil;
      if (!this.tocado[idPerfil]?.valoracion) return "";
      return this.validacion.errores[idPerfil]?.valoracion || "";
    },
    errorReseniaDe(miembro) {
      const idPerfil = miembro?.idPerfil;
      if (!this.tocado[idPerfil]?.resenia) return "";
      return this.validacion.errores[idPerfil]?.resenia || "";
    },
    nombreReceptor(calificacion) {
      const miembro = this.mapaMiembros[calificacion?.idPerfilReceptor];
      if (!miembro) {
        return `Integrante #${calificacion?.idPerfilReceptor ?? "—"}`;
      }
      return (
        miembro.nombreArtistico ||
        [miembro.nombreUsuario, miembro.apellidoUsuario]
          .filter(Boolean)
          .join(" ") ||
        `Integrante #${miembro.idPerfil}`
      );
    },
    async enviar() {
      if (!this.puedeEnviar || this.enviando) return;

      this.enviando = true;
      this.errorEnvio = "";
      this.faltantes = [];
      if (controladorEnvio) controladorEnvio.abort();
      controladorEnvio = new AbortController();

      try {
        const response = await proyectoService.calificarEquipo(
          this.idProyecto,
          this.validacion.calificaciones,
          controladorEnvio.signal
        );
        this.datos = normalizarCalificacionesProyecto(response?.data);
        this.formulario = {};
        this.tocado = {};
        this.faltantes = [];
        this.sincronizarFormulario();

        this.toast.init({
          title: "Calificaciones enviadas",
          message: "Tus calificaciones quedaron registradas.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        this.manejarErrorEnvio(error);
      } finally {
        this.enviando = false;
      }
    },
    manejarErrorEnvio(error) {
      const status = error?.response?.status;
      const clasificacion = clasificarErrorFinalizacion(error);

      if (clasificacion.esCalificacionesIncompletas) {
        this.faltantes = clasificacion.faltantes;
        this.marcarFaltantes(clasificacion.faltantes);
        this.errorEnvio =
          clasificacion.mensaje ||
          "Es obligatorio calificar a todos los integrantes pendientes.";
        return;
      }

      if (clasificacion.esCalificacionInvalida) {
        this.errorEnvio =
          clasificacion.mensaje ||
          "Revisá la valoración y la reseña de las calificaciones.";
        return;
      }

      if (clasificacion.esEstado || status === 409) {
        this.toast.init({
          title: "No se pudieron enviar",
          message:
            clasificacion.mensaje ||
            "El proyecto ya no se encuentra disponible para calificar.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.cargar();
        return;
      }

      if (status === 403) {
        this.toast.init({
          title: "No se pudieron enviar",
          message:
            clasificacion.mensaje ||
            "No tenés permiso para calificar en este proyecto.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.cargar();
        return;
      }

      if (status === 404) {
        this.toast.init({
          title: "No se pudieron enviar",
          message:
            clasificacion.mensaje ||
            "El proyecto o el perfil ya no está disponible.",
          color: "danger",
          position: "top-right",
          duration: 6000,
        });
        this.cargar();
        return;
      }

      if (!status || status >= 500) {
        this.errorEnvio =
          "Ocurrió un error al enviar las calificaciones. Inténtalo nuevamente.";
        return;
      }

      this.errorEnvio = mensajeErrorApi(
        error,
        "No se pudieron enviar las calificaciones."
      );
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
.calificaciones-proyecto {
  width: 100%;
}

.calificaciones-proyecto__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.calificaciones-proyecto__breadcrumb {
  margin: 0 0 0.2rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.calificaciones-proyecto__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 700;
}

.calificaciones-proyecto__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.calificaciones-proyecto__reintento {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.calificaciones-proyecto__panel {
  padding: 1.1rem;
  margin-bottom: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.calificaciones-proyecto__resumen,
.calificaciones-proyecto__seccion-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.calificaciones-proyecto__subtitulo {
  margin: 0 0 0.3rem;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
}

.calificaciones-proyecto__texto {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.calificaciones-proyecto__chip {
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.calificaciones-proyecto__chip--completo {
  border-color: var(--color-success-border, var(--color-border));
  background: var(--color-success-soft);
  color: var(--color-success-text);
}

.calificaciones-proyecto__barra {
  height: 6px;
  margin-top: 0.75rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  overflow: hidden;
}

.calificaciones-proyecto__barra-relleno {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}

.calificaciones-proyecto__contador {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
}

.calificaciones-proyecto__lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.calificaciones-proyecto__ayuda {
  margin: 0.75rem 0 0;
  color: var(--color-warning-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.calificaciones-proyecto__acciones {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--color-border-soft);
}

.calificaciones-proyecto__emitidas {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0.9rem 0 0;
  padding: 0;
  list-style: none;
}

.calificaciones-proyecto__emitida {
  padding: 0.75rem;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
}

.calificaciones-proyecto__emitida-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.calificaciones-proyecto__emitida-info {
  min-width: 0;
}

.calificaciones-proyecto__emitida-nombre {
  margin: 0;
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 600;
}

.calificaciones-proyecto__emitida-fecha {
  margin: 0.15rem 0 0;
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.calificaciones-proyecto__estrellas {
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;
}

.calificaciones-proyecto__estrellas .material-symbols-outlined {
  color: var(--color-border-strong);
  font-size: 1rem;
}

.calificaciones-proyecto__estrella--activa {
  color: var(--color-warning) !important;
}

.calificaciones-proyecto__emitida-resenia {
  margin: 0.45rem 0 0;
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .calificaciones-proyecto__header,
  .calificaciones-proyecto__acciones {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
