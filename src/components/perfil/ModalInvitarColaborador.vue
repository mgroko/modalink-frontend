<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="large"
    blur
    class="invitar-colaborador"
    @update:model-value="cambiarVisibilidad"
  >
    <template #header>
      <div class="invitar-colaborador__cabecera">
        <h3 class="va-h5">Invitar a colaborar</h3>
        <p v-if="publicacion" class="invitar-colaborador__subtitulo">
          {{ publicacion.titulo }}
        </p>
      </div>
    </template>

    <p class="invitar-colaborador__ayuda">
      Elegí un contacto de tu red para invitarlo a colaborar en esta
      publicación.
    </p>

    <div class="invitar-colaborador__buscador">
      <VaInput
        v-model="busqueda"
        placeholder="Buscar contacto por nombre o profesión"
        clearable
        @keyup.enter="buscar(0)"
      >
        <template #prependInner>
          <span class="material-symbols-outlined" aria-hidden="true">
            search
          </span>
        </template>
      </VaInput>
      <VaButton preset="secondary" :disabled="cargando" @click="buscar(0)">
        Buscar
      </VaButton>
    </div>

    <BaseAlert :message="error" type="error" />

    <div
      v-if="cargando"
      class="invitar-colaborador__estado"
      role="status"
      aria-live="polite"
    >
      <span class="material-symbols-outlined" aria-hidden="true">
        hourglass_empty
      </span>
      Cargando contactos...
    </div>

    <div v-else-if="!contactos.length" class="invitar-colaborador__estado">
      <span class="material-symbols-outlined" aria-hidden="true">
        group_off
      </span>
      No hay contactos disponibles para invitar.
    </div>

    <div v-else class="invitar-colaborador__lista">
      <button
        v-for="contacto in contactos"
        :key="contacto.idPerfil"
        type="button"
        class="invitar-colaborador__item"
        :class="{
          'invitar-colaborador__item--activo':
            seleccionado?.idPerfil === contacto.idPerfil,
        }"
        :aria-pressed="
          seleccionado?.idPerfil === contacto.idPerfil ? 'true' : 'false'
        "
        @click="seleccionar(contacto)"
      >
        <span class="invitar-colaborador__avatar" aria-hidden="true">
          <img
            v-if="fotoDe(contacto)"
            :src="fotoDe(contacto)"
            :alt="nombreDe(contacto)"
          />
          <template v-else>{{ inicialDe(nombreDe(contacto)) }}</template>
        </span>
        <span class="invitar-colaborador__datos">
          <strong>{{ nombreDe(contacto) }}</strong>
          <span>{{ profesionDe(contacto) }}</span>
        </span>
        <span class="material-symbols-outlined invitar-colaborador__check">
          {{
            seleccionado?.idPerfil === contacto.idPerfil
              ? "radio_button_checked"
              : "radio_button_unchecked"
          }}
        </span>
      </button>
    </div>

    <div
      v-if="totalPaginas > 1"
      class="invitar-colaborador__paginacion"
    >
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_left"
        :disabled="pagina <= 0 || cargando"
        @click="cambiarPagina(-1)"
      >
        Anterior
      </VaButton>
      <span>Página {{ pagina + 1 }} de {{ totalPaginas }}</span>
      <VaButton
        preset="secondary"
        size="small"
        icon="mso-chevron_right"
        :disabled="pagina >= totalPaginas - 1 || cargando"
        @click="cambiarPagina(1)"
      >
        Siguiente
      </VaButton>
    </div>

    <BaseAlert :message="errorEnvio" type="error" />

    <template #footer>
      <div class="invitar-colaborador__acciones">
        <VaButton
          preset="secondary"
          :disabled="enviando"
          @click="cambiarVisibilidad(false)"
        >
          Cancelar
        </VaButton>
        <VaButton
          color="primary"
          :loading="enviando"
          :disabled="!seleccionado || enviando"
          @click="enviar"
        >
          Enviar invitación
        </VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
import BaseAlert from "../AlertaBase.vue";
import conexionService from "../../services/conexionService";
import solicitudColaboracionService from "../../services/solicitudColaboracionService";
import { resolverFotoUrl } from "../../utils/fotos.js";
import {
  mensajeErrorSolicitudColaboracion,
} from "../../utils/solicitudesColaboracionConstants.js";

export default {
  name: "ModalInvitarColaborador",
  components: { BaseAlert },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    publicacion: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:modelValue", "enviada"],
  data() {
    return {
      busqueda: "",
      contactos: [],
      cargando: false,
      error: "",
      pagina: 0,
      totalPaginas: 0,
      seleccionado: null,
      enviando: false,
      errorEnvio: "",
      controlador: null,
    };
  },
  watch: {
    modelValue(abierto) {
      if (abierto) {
        this.reiniciar();
        this.buscar(0);
        return;
      }
      this.abortar();
    },
  },
  beforeUnmount() {
    this.abortar();
  },
  methods: {
    reiniciar() {
      this.busqueda = "";
      this.contactos = [];
      this.seleccionado = null;
      this.error = "";
      this.errorEnvio = "";
      this.pagina = 0;
      this.totalPaginas = 0;
    },
    cambiarVisibilidad(abierto) {
      if (this.enviando && !abierto) return;
      this.$emit("update:modelValue", abierto);
    },
    abortar() {
      if (this.controlador) {
        this.controlador.abort();
        this.controlador = null;
      }
    },
    fotoDe(perfil) {
      return resolverFotoUrl(perfil?.fotoUrl);
    },
    nombreDe(perfil) {
      return perfil?.nombreArtistico || "Perfil";
    },
    profesionDe(perfil) {
      return perfil?.nombreProfesion || perfil?.profesion || "Sin profesión";
    },
    inicialDe(nombre) {
      return String(nombre || "?").trim().charAt(0).toUpperCase() || "?";
    },
    seleccionar(perfil) {
      if (this.enviando) return;
      this.seleccionado =
        this.seleccionado?.idPerfil === perfil?.idPerfil ? null : perfil;
    },
    cambiarPagina(delta) {
      const destino = this.pagina + delta;
      if (destino < 0 || destino >= this.totalPaginas) return;
      this.buscar(destino);
    },
    async buscar(pagina = 0) {
      this.abortar();
      const controller = new AbortController();
      this.controlador = controller;
      this.cargando = true;
      this.error = "";

      try {
        const texto = String(this.busqueda || "").trim();
        const response = await conexionService.listar(
          {
            ...(texto ? { texto } : {}),
            page: pagina,
            size: 20,
          },
          controller.signal
        );
        if (this.controlador !== controller) return;

        const data = response?.data || {};
        const conexiones = Array.isArray(data.contenido)
          ? data.contenido
          : [];

        this.contactos = conexiones
          .map((conexion) => conexion?.perfil)
          .filter((perfil) => perfil?.idPerfil != null);
        this.pagina = Number(data.paginaActual) || 0;
        this.totalPaginas = Number(data.totalPaginas) || 0;
      } catch (error) {
        if (
          this.controlador !== controller ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        this.contactos = [];
        this.error = mensajeErrorSolicitudColaboracion(
          error,
          "No se pudieron cargar los contactos."
        );
      } finally {
        if (this.controlador === controller) {
          this.cargando = false;
          this.controlador = null;
        }
      }
    },
    async enviar() {
      const idPerfilDestinatario = this.seleccionado?.idPerfil;
      const idPublicacion = this.publicacion?.idPublicacion;
      if (!idPerfilDestinatario || idPublicacion == null || this.enviando) {
        return;
      }

      this.enviando = true;
      this.errorEnvio = "";

      try {
        await solicitudColaboracionService.crear(
          idPublicacion,
          idPerfilDestinatario
        );
        this.$emit("enviada", {
          idPublicacion,
          idPerfilDestinatario,
          nombre: this.nombreDe(this.seleccionado),
        });
        this.$emit("update:modelValue", false);
      } catch (error) {
        this.errorEnvio = mensajeErrorSolicitudColaboracion(
          error,
          "No se pudo enviar la invitación."
        );
      } finally {
        this.enviando = false;
      }
    },
  },
};
</script>

<style scoped>
.invitar-colaborador__cabecera {
  display: grid;
  gap: 0.15rem;
}

.invitar-colaborador__subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.invitar-colaborador__ayuda {
  margin: 0 0 0.85rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.invitar-colaborador__buscador {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.invitar-colaborador__buscador > :first-child {
  flex: 1;
}

.invitar-colaborador__lista {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 22rem;
  overflow-y: auto;
}

.invitar-colaborador__item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.65rem;
  color: var(--color-text);
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  border-radius: 9px;
  font: inherit;
  cursor: pointer;
}

.invitar-colaborador__item--activo {
  border-color: var(--color-primary);
  background: var(--color-chip);
}

.invitar-colaborador__avatar {
  display: grid;
  width: 2.3rem;
  height: 2.3rem;
  flex: 0 0 2.3rem;
  place-items: center;
  overflow: hidden;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
}

.invitar-colaborador__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invitar-colaborador__datos {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.invitar-colaborador__datos strong {
  font-size: 0.85rem;
}

.invitar-colaborador__datos span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
}

.invitar-colaborador__check {
  margin-left: auto;
  color: var(--color-primary);
}

.invitar-colaborador__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.85rem;
  color: var(--color-text-muted);
  font-size: 0.76rem;
}

.invitar-colaborador__estado {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.invitar-colaborador__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  width: 100%;
}
</style>
