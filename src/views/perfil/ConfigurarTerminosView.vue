<template>
  <div class="configurar-tyc">
    <header class="configurar-tyc__header">
      <nav class="configurar-tyc__migas" aria-label="Migas de pan">
        <router-link
          :to="{ name: 'ajustes-perfil-inicio' }"
          class="configurar-tyc__miga"
        >
          Ajustes de perfil
        </router-link>
        <span aria-hidden="true">›</span>
        <span>Términos y condiciones</span>
      </nav>
      <h1 class="configurar-tyc__titulo">
        Configurar términos y condiciones
      </h1>
    </header>

    <section
      v-if="cargando"
      class="configurar-tyc__panel configurar-tyc__estado"
      aria-live="polite"
    >
      <span class="material-symbols-outlined configurar-tyc__estado-icono">
        hourglass_empty
      </span>
      Cargando términos y condiciones...
    </section>

    <section
      v-else-if="errorCarga"
      class="configurar-tyc__panel configurar-tyc__estado"
    >
      <span class="material-symbols-outlined configurar-tyc__estado-icono">
        error
      </span>
      <p class="configurar-tyc__estado-texto">{{ errorCarga }}</p>
      <div class="configurar-tyc__estado-acciones">
        <VaButton preset="secondary" @click="cargar">Reintentar</VaButton>
        <VaButton preset="primary" @click="volverAAjustes">
          Volver a Ajustes
        </VaButton>
      </div>
    </section>

    <section v-else class="configurar-tyc__panel">
      <p class="configurar-tyc__intro">
        Estas cláusulas se muestran en tu perfil a quienes lo visiten. Al
        guardar un cambio se crea una nueva versión vigente.
      </p>

      <div
        v-if="!esActivo"
        class="configurar-tyc__aviso configurar-tyc__aviso--warning"
        role="status"
      >
        <span class="material-symbols-outlined" aria-hidden="true">warning</span>
        <span>
          Solo los perfiles activos pueden configurar términos y condiciones.
          {{ textoEstadoInactivo }}
        </span>
      </div>

      <div
        v-else-if="terminos?.esPlantilla"
        class="configurar-tyc__aviso configurar-tyc__aviso--info"
        role="status"
      >
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        <span>
          Estás usando la plantilla base del sistema. Guardá para convertirla
          en tus condiciones.
        </span>
      </div>

      <BaseAlert
        v-if="errorGeneral"
        :message="errorGeneral"
        type="error"
        class="configurar-tyc__alerta"
      />

      <div class="configurar-tyc__campo">
        <label for="terminos-descripcion" class="configurar-tyc__label">
          Texto de los términos y condiciones
        </label>

        <VaTextarea
          id="terminos-descripcion"
          v-model="descripcion"
          class="configurar-tyc__textarea"
          :max-length="LIMITE_DESCRIPCION_TERMINOS"
          :rows="16"
          :disabled="!esActivo || guardando"
          :error="Boolean(errorDescripcion)"
          placeholder="Redactá aquí tus términos y condiciones..."
          aria-describedby="terminos-contador terminos-error"
          @update:model-value="limpiarErrorDescripcion"
        />

        <div class="configurar-tyc__pie-campo">
          <p
            v-if="errorDescripcion"
            id="terminos-error"
            class="configurar-tyc__error-campo"
            role="alert"
          >
            <span class="material-symbols-outlined" aria-hidden="true">error</span>
            {{ errorDescripcion }}
          </p>
          <span v-else></span>

          <span
            id="terminos-contador"
            class="configurar-tyc__contador"
            :class="{
              'configurar-tyc__contador--limite':
                descripcion.length > LIMITE_DESCRIPCION_TERMINOS,
            }"
            aria-live="polite"
          >
            {{ contador }} / {{ limiteFormateado }} caracteres
          </span>
        </div>
      </div>

      <div class="configurar-tyc__acciones">
        <VaButton
          preset="secondary"
          :disabled="guardando"
          @click="intentarSalir"
        >
          Cancelar
        </VaButton>
        <VaButton
          preset="primary"
          :loading="guardando"
          :disabled="!puedeGuardar"
          :aria-busy="guardando ? 'true' : 'false'"
          @click="guardar"
        >
          Guardar cambios
        </VaButton>
      </div>
    </section>

    <VaModal
      v-model="modalDescartar"
      size="small"
      close-button
      hide-default-actions
      :no-dismiss="guardando"
    >
      <template #header>
        <h3 class="va-h5">Descartar cambios</h3>
      </template>
      <p>Tenés cambios sin guardar. ¿Querés descartarlos?</p>
      <template #footer>
        <div class="configurar-tyc__modal-acciones">
          <VaButton preset="secondary" @click="cancelarDescarte">
            Seguir editando
          </VaButton>
          <VaButton color="danger" @click="confirmarDescarte">
            Descartar cambios
          </VaButton>
        </div>
      </template>
    </VaModal>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import { idPerfilActivo } from "../../services/authState";
import BaseAlert from "../../components/AlertaBase.vue";
import { useToast } from "vuestic-ui";
import {
  LIMITE_DESCRIPCION_TERMINOS,
  TIPOS_ERROR_TERMINOS,
  clasificarErrorTerminos,
  contadorCaracteres,
  descripcionTerminosValida,
  normalizarTerminos,
  puedeGuardarTerminos,
} from "../../utils/terminosCondiciones.js";

const NOMBRE_ESTADO = {
  PendienteBaja: "El perfil tiene una solicitud de baja pendiente.",
  Deshabilitado: "El perfil está deshabilitado.",
  Baja: "El perfil está dado de baja.",
};

export default {
  name: "ConfigurarTerminosView",
  components: { BaseAlert },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      LIMITE_DESCRIPCION_TERMINOS,
      perfil: null,
      terminos: null,
      descripcion: "",
      originalDescripcion: "",
      cargando: true,
      guardando: false,
      errorCarga: "",
      errorGeneral: "",
      errorDescripcion: "",
      modalDescartar: false,
      destinoPendiente: null,
      saliendo: false,
    };
  },
  computed: {
    idPerfil() {
      return idPerfilActivo();
    },
    esActivo() {
      return this.perfil?.estado === "Activo";
    },
    textoEstadoInactivo() {
      return NOMBRE_ESTADO[this.perfil?.estado] || "";
    },
    caracteres() {
      return String(this.descripcion || "").length;
    },
    contador() {
      return contadorCaracteres(this.caracteres);
    },
    limiteFormateado() {
      return contadorCaracteres(LIMITE_DESCRIPCION_TERMINOS);
    },
    hayCambios() {
      return (
        String(this.descripcion || "").trim() !==
        String(this.originalDescripcion || "").trim()
      );
    },
    puedeGuardar() {
      return (
        this.esActivo &&
        !this.cargando &&
        puedeGuardarTerminos({
          descripcion: this.descripcion,
          originalDescripcion: this.originalDescripcion,
          esPlantilla: this.terminos?.esPlantilla === true,
          guardando: this.guardando,
        })
      );
    },
  },
  beforeMount() {
    this.controladorCarga = new AbortController();
    this.controladorGuardado = null;
  },
  mounted() {
    this.cargar();
  },
  beforeUnmount() {
    this.abortar(this.controladorCarga);
    this.abortar(this.controladorGuardado);
  },
  beforeRouteLeave(to, from, next) {
    if (this.saliendo || this.guardando || !this.hayCambios) {
      next();
      return;
    }
    this.destinoPendiente = to.fullPath;
    this.modalDescartar = true;
    next(false);
  },
  methods: {
    abortar(controlador) {
      if (controlador) controlador.abort();
    },
    esCancelacion(error) {
      return error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
    },
    volverAAjustes() {
      this.$router.push({ name: "ajustes-perfil-inicio" });
    },
    aplicarTerminos(data) {
      const normalizados = normalizarTerminos(data);
      this.terminos = normalizados;
      this.descripcion = normalizados.descripcion;
      this.originalDescripcion = normalizados.descripcion;
    },
    async cargar() {
      this.cargando = true;
      this.errorCarga = "";
      this.errorGeneral = "";
      this.errorDescripcion = "";

      const id = this.idPerfil;
      if (id == null) {
        this.cargando = false;
        this.errorCarga = "No hay un perfil activo seleccionado.";
        return;
      }

      this.abortar(this.controladorCarga);
      this.controladorCarga = new AbortController();
      const signal = this.controladorCarga.signal;

      try {
        const [perfilRes, terminosRes] = await Promise.allSettled([
          perfilService.obtener(id, signal),
          perfilService.obtenerTerminos(id, signal),
        ]);

        if (perfilRes.status === "rejected") {
          if (this.esCancelacion(perfilRes.reason)) return;
          const clasificacion = clasificarErrorTerminos(perfilRes.reason);
          if (clasificacion.tipo === TIPOS_ERROR_TERMINOS.SESION) return;
          this.errorCarga =
            clasificacion.mensaje ||
            "No se pudo cargar el perfil. Intentá nuevamente.";
          this.perfil = null;
          return;
        }

        this.perfil = perfilRes.value?.data || null;
        if (!this.perfil) {
          this.errorCarga = "No se encontró el perfil activo.";
          return;
        }

        if (terminosRes.status === "fulfilled") {
          this.aplicarTerminos(terminosRes.value?.data);
          return;
        }

        if (this.esCancelacion(terminosRes.reason)) return;

        // Contrato actual: GET /perfiles/{id} ya incluye los T&C. Se usa como
        // respaldo si el endpoint dedicado falla, salvo que el perfil no esté
        // activo (en ese estado el GET dedicado responde 404).
        if (this.perfil.terminosCondiciones) {
          this.aplicarTerminos(this.perfil.terminosCondiciones);
          return;
        }

        if (this.esActivo) {
          const clasificacion = clasificarErrorTerminos(terminosRes.reason);
          if (clasificacion.tipo === TIPOS_ERROR_TERMINOS.SESION) return;
          this.errorCarga =
            clasificacion.mensaje ||
            "No se pudieron cargar los términos y condiciones.";
        }
      } catch (error) {
        if (this.esCancelacion(error)) return;
        this.errorCarga =
          "No se pudieron cargar los términos y condiciones. Intentá nuevamente.";
      } finally {
        this.cargando = false;
      }
    },
    limpiarErrorDescripcion() {
      if (this.errorDescripcion) this.errorDescripcion = "";
      if (this.errorGeneral) this.errorGeneral = "";
    },
    async guardar() {
      if (!this.puedeGuardar || this.guardando) return;

      const texto = String(this.descripcion || "").trim();
      if (!descripcionTerminosValida(texto)) {
        this.errorDescripcion =
          "El texto no puede estar vacío. Escribí tus términos antes de guardar.";
        return;
      }

      this.guardando = true;
      this.errorGeneral = "";
      this.errorDescripcion = "";

      this.abortar(this.controladorGuardado);
      this.controladorGuardado = new AbortController();

      try {
        const response = await perfilService.actualizarTerminos(
          this.idPerfil,
          { descripcion: texto },
          this.controladorGuardado.signal
        );

        const data = response?.data;
        if (data && typeof data.descripcion === "string") {
          this.aplicarTerminos(data);
        } else {
          // Defensivo: el contrato devuelve 200 con body, pero si faltara se
          // vuelve a leer la versión vigente.
          const terminosRes = await perfilService.obtenerTerminos(
            this.idPerfil,
            this.controladorGuardado.signal
          );
          this.aplicarTerminos(terminosRes?.data);
        }

        this.terminos = { ...this.terminos, esPlantilla: false };
        this.toast.init({
          title: "Términos y condiciones guardados",
          message: "Tu perfil ya muestra la nueva versión vigente.",
          color: "success",
          position: "top-right",
          duration: 5000,
        });
      } catch (error) {
        if (this.esCancelacion(error)) return;
        const clasificacion = clasificarErrorTerminos(error);

        if (clasificacion.tipo === TIPOS_ERROR_TERMINOS.SESION) return;

        if (clasificacion.tipo === TIPOS_ERROR_TERMINOS.VALIDACION) {
          this.errorDescripcion =
            clasificacion.mensajeCampo ||
            clasificacion.mensaje ||
            "Revisá el texto ingresado.";
          return;
        }

        if (clasificacion.tipo === TIPOS_ERROR_TERMINOS.PERFIL_INACTIVO) {
          this.errorGeneral = clasificacion.mensaje;
          // El 409 del PUT es sólo perfil inactivo y el GET de T&C responde
          // 404 en ese estado: no se recarga la versión.
          await this.recargarPerfil();
          return;
        }

        this.errorGeneral =
          clasificacion.mensaje ||
          "No se pudieron guardar los términos. Intentá nuevamente.";
      } finally {
        this.guardando = false;
      }
    },
    async recargarPerfil() {
      try {
        const response = await perfilService.obtener(this.idPerfil);
        this.perfil = response?.data || this.perfil;
      } catch {
        // El mensaje del 409 ya se muestra; no se pisa con otro error.
      }
    },
    intentarSalir() {
      if (this.guardando) return;
      if (this.hayCambios) {
        this.destinoPendiente = null;
        this.modalDescartar = true;
        return;
      }
      this.volverAAjustes();
    },
    cancelarDescarte() {
      this.modalDescartar = false;
      this.destinoPendiente = null;
    },
    confirmarDescarte() {
      const destino = this.destinoPendiente;
      this.destinoPendiente = null;
      this.modalDescartar = false;
      this.saliendo = true;

      const navegacion = destino
        ? this.$router.push(destino)
        : this.$router.push({ name: "ajustes-perfil-inicio" });

      Promise.resolve(navegacion)
        .catch(() => {})
        .finally(() => {
          this.saliendo = false;
        });
    },
  },
};
</script>

<style scoped>
.configurar-tyc {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.configurar-tyc__header {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1.35rem 1.75rem 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.configurar-tyc__migas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.configurar-tyc__miga {
  color: var(--color-text-muted);
  text-decoration: none;
}

.configurar-tyc__miga:hover,
.configurar-tyc__miga:focus-visible {
  color: var(--color-primary);
  text-decoration: underline;
}

.configurar-tyc__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.45rem, 2vw, 1.8rem);
  font-weight: 700;
  line-height: 1.2;
}

.configurar-tyc__panel {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  padding: 1.5rem 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.configurar-tyc__intro {
  margin: 0 0 1.1rem;
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.55;
}

.configurar-tyc__aviso {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.7rem 0.8rem;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.45;
}

.configurar-tyc__aviso .material-symbols-outlined {
  flex-shrink: 0;
  font-size: 1.05rem;
}

.configurar-tyc__aviso--info {
  border: 1px solid var(--color-info-border);
  background: var(--color-info-soft);
  color: var(--color-info-text);
}

.configurar-tyc__aviso--warning {
  border: 1px solid var(--color-warning-border);
  background: var(--color-warning-soft);
  color: var(--color-warning-text);
}

.configurar-tyc__alerta {
  margin: 0 0 1rem !important;
}

.configurar-tyc__campo {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.configurar-tyc__label {
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.configurar-tyc__textarea {
  width: 100%;
}

.configurar-tyc__textarea :deep(textarea) {
  min-height: 320px;
  line-height: 1.55;
  resize: vertical;
}

.configurar-tyc__pie-campo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  min-height: 1.2rem;
}

.configurar-tyc__error-campo {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.3rem;
  margin: 0;
  color: var(--color-danger-text);
  font-size: 0.78rem;
  line-height: 1.4;
}

.configurar-tyc__error-campo .material-symbols-outlined {
  flex-shrink: 0;
  font-size: 1rem;
}

.configurar-tyc__contador {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

.configurar-tyc__contador--limite {
  color: var(--color-danger-text);
  font-weight: 600;
}

.configurar-tyc__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.configurar-tyc__estado {
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.configurar-tyc__estado-icono {
  font-size: 2.2rem;
}

.configurar-tyc__estado-texto {
  margin: 0;
  max-width: 36rem;
  line-height: 1.5;
}

.configurar-tyc__estado-acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.configurar-tyc__modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .configurar-tyc__header,
  .configurar-tyc__panel {
    padding: 1.25rem;
  }

  .configurar-tyc__panel {
    min-height: 420px;
  }

  .configurar-tyc__pie-campo {
    flex-direction: column;
    gap: 0.35rem;
  }

  .configurar-tyc__contador {
    margin-left: 0;
  }

  .configurar-tyc__acciones {
    flex-direction: column-reverse;
  }

  .configurar-tyc__acciones :deep(.va-button) {
    width: 100%;
  }
}
</style>
