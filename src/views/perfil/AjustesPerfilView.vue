<template>
  <div class="ajustes-perfil">
    <div v-if="mensajeError" class="ajustes-perfil__error">
      <BaseAlert :message="mensajeError" type="error" />
      <VaButton
        v-if="errorCarga"
        size="small"
        preset="secondary"
        icon="mso-refresh"
        @click="cargarPerfil"
      >
        Reintentar
      </VaButton>
    </div>

    <header class="ajustes-perfil__header">
      <h1 class="ajustes-perfil__titulo">Ajustes de perfil</h1>
    </header>

    <section v-if="cargando" class="ajustes-perfil__panel ajustes-perfil__estado">
      <span class="material-symbols-outlined ajustes-perfil__estado-icono">hourglass_empty</span>
      Cargando ajustes...
    </section>

    <section v-else-if="!perfil" class="ajustes-perfil__panel ajustes-perfil__estado">
      <span class="material-symbols-outlined ajustes-perfil__estado-icono">person_off</span>
      No se encontró el perfil activo.
      <VaButton preset="secondary" @click="$router.push({ name: 'dashboard-usuario' })">
        Volver al panel
      </VaButton>
    </section>

    <section v-else class="ajustes-perfil__panel" aria-label="Opciones de ajustes de perfil">
      <div class="ajustes-perfil__opciones">
        <button
          type="button"
          class="ajustes-perfil__opcion"
          @click="irAEditar"
        >
          <span class="material-symbols-outlined ajustes-perfil__icono" aria-hidden="true">
            person
          </span>
          <span class="ajustes-perfil__texto">
            <span class="ajustes-perfil__opcion-titulo">Modificar perfil</span>
            <span class="ajustes-perfil__opcion-descripcion">
              Actualizá tu nombre artístico, biografía, foto, características y habilidades.
            </span>
          </span>
          <span class="material-symbols-outlined ajustes-perfil__chevron" aria-hidden="true">
            chevron_right
          </span>
        </button>

        <button
          type="button"
          class="ajustes-perfil__opcion"
          :class="{
            'ajustes-perfil__opcion--bloqueada': !puedeConfigurarTerminos,
          }"
          :disabled="!puedeConfigurarTerminos"
          :aria-disabled="!puedeConfigurarTerminos ? 'true' : 'false'"
          :title="
            puedeConfigurarTerminos
              ? undefined
              : 'Solo los perfiles activos pueden configurar términos y condiciones'
          "
          @click="irAConfigurarTerminos"
        >
          <span class="material-symbols-outlined ajustes-perfil__icono" aria-hidden="true">
            description
          </span>
          <span class="ajustes-perfil__texto">
            <span class="ajustes-perfil__opcion-titulo">
              Configurar términos y condiciones
            </span>
            <span class="ajustes-perfil__opcion-descripcion">
              Definí las cláusulas que se muestran en tu perfil.
            </span>
          </span>
          <span class="material-symbols-outlined ajustes-perfil__chevron" aria-hidden="true">
            chevron_right
          </span>
        </button>
      </div>

      <div class="ajustes-perfil__riesgo">
        <div class="ajustes-perfil__riesgo-texto">
          <h2 class="ajustes-perfil__riesgo-titulo">Zona de riesgo</h2>
          <p class="ajustes-perfil__riesgo-descripcion">
            Pedir la baja elimina tu perfil de ModaLink.
          </p>
          <p v-if="!puedeSolicitarBaja" class="ajustes-perfil__riesgo-nota">
            Solo podés solicitar la baja de un perfil activo.
          </p>
        </div>
        <VaButton
          class="ajustes-perfil__baja"
          color="danger"
          outline
          :disabled="!puedeSolicitarBaja"
          @click="abrirConfirmacionBaja"
        >
          Solicitar baja del perfil
        </VaButton>
      </div>
    </section>

    <VaModal
      v-model="modalBaja"
      size="small"
      close-button
      hide-default-actions
    >
      <template #header>
        <h3 class="va-h5">Solicitar baja del perfil</h3>
      </template>
      <p>
        ¿Querés solicitar la baja del perfil
        <strong>{{ perfil?.nombreArtistico }}</strong>?
        Tendrás el plazo configurado para reactivarlo (30 días por defecto):
        el <strong>{{ fechaLimiteBaja }}</strong> pasará al estado Baja y quedará inaccesible
        para la comunidad. Podés reactivarlo desde el panel de usuario.
      </p>
      <p v-if="errorBaja" class="ajustes-perfil__modal-error">{{ errorBaja }}</p>
      <template #footer>
        <div class="ajustes-perfil__modal-acciones">
          <VaButton preset="secondary" :disabled="eliminando" @click="modalBaja = false">
            Cancelar
          </VaButton>
          <VaButton color="danger" :loading="eliminando" @click="ejecutarBaja">
            Confirmar baja
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
import { fechaExpiracionBaja, formatearFecha } from "../../utils/fechas";
import { mensajeErrorApi } from "../../utils/apiError";
import { useToast } from "vuestic-ui";

export default {
  name: "AjustesPerfilView",
  components: {
    BaseAlert,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      perfil: null,
      cargando: true,
      errorCarga: false,
      mensajeError: "",
      errorBaja: "",
      modalBaja: false,
      eliminando: false,
    };
  },
  computed: {
    puedeSolicitarBaja() {
      return this.perfil?.estado === "Activo";
    },
    puedeConfigurarTerminos() {
      return this.perfil?.estado === "Activo";
    },
    fechaLimiteBaja() {
      const fecha = this.perfil?.fechaLimite || fechaExpiracionBaja(new Date());
      return fecha ? formatearFecha(fecha) : "";
    },
  },
  mounted() {
    this.cargarPerfil();
  },
  methods: {
    async cargarPerfil() {
      this.cargando = true;
      this.errorCarga = false;
      this.mensajeError = "";
      this.errorBaja = "";

      const id = idPerfilActivo();
      if (id == null) {
        this.cargando = false;
        this.perfil = null;
        return;
      }

      try {
        const response = await perfilService.obtener(id);
        this.perfil = response?.data || null;
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          this.$router.push({ name: "login", query: { redirect: this.$route.fullPath } });
          return;
        }
        this.perfil = null;
        if (status === 404) {
          this.mensajeError =
            error?.response?.data?.message ||
            "El perfil que buscás no está disponible o fue dado de baja.";
        } else {
          this.errorCarga = true;
          this.mensajeError = mensajeErrorApi(
            error,
            "No se pudieron cargar los ajustes. Intentá nuevamente."
          );
        }
      } finally {
        this.cargando = false;
      }
    },
    irAEditar() {
      if (!this.perfil?.idPerfil) return;
      this.$router.push({
        name: "editar-perfil-ajustes",
        params: { id: this.perfil.idPerfil },
      });
    },
    irAConfigurarTerminos() {
      if (!this.puedeConfigurarTerminos) return;
      this.$router.push({ name: "configurar-terminos-perfil" });
    },
    abrirConfirmacionBaja() {
      if (!this.puedeSolicitarBaja) return;
      this.mensajeError = "";
      this.errorBaja = "";
      this.modalBaja = true;
    },
    async ejecutarBaja() {
      if (!this.perfil?.idPerfil || this.eliminando) return;

      this.eliminando = true;
      this.mensajeError = "";
      this.errorBaja = "";

      try {
        const response = await perfilService.eliminar(this.perfil.idPerfil);
        const data = response?.data;
        const mensaje =
          data?.mensaje ||
          (data?.fechaLimite
            ? `Solicitud de baja registrada. Reactivá el perfil antes del ${formatearFecha(data.fechaLimite)}.`
            : "Solicitud de baja registrada. Podés reactivar el perfil desde el panel de usuario.");

        this.modalBaja = false;
        this.perfil = {
          ...this.perfil,
          estado: "PendienteBaja",
          fechaLimite: data?.fechaLimite || this.perfil.fechaLimite,
        };

        this.toast.init({
          title: "Solicitud de baja registrada",
          message: mensaje,
          color: "success",
          position: "top-right",
          duration: 6000,
        });

        // La reactivación de un perfil PendienteBaja se gestiona desde el
        // panel de usuario, no desde el Home.
        await this.$router.push({ name: "dashboard-usuario" });
      } catch (error) {
        const mensaje = mensajeErrorApi(
          error,
          "No se pudo solicitar la baja del perfil. Intentá nuevamente."
        );
        this.mensajeError = mensaje;
        this.errorBaja = mensaje;
      } finally {
        this.eliminando = false;
      }
    },
  },
};
</script>

<style scoped>
.ajustes-perfil {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.ajustes-perfil__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.ajustes-perfil__header {
  padding: 1.5rem 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.ajustes-perfil__titulo {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.5rem, 2vw, 1.85rem);
  font-weight: 700;
  line-height: 1.2;
}

.ajustes-perfil__panel {
  display: flex;
  flex-direction: column;
  min-height: 560px;
  padding: 1.5rem 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.ajustes-perfil__opciones {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ajustes-perfil__opcion {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.95rem 1.1rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.ajustes-perfil__opcion:hover,
.ajustes-perfil__opcion:focus-visible {
  background: var(--color-surface-soft);
  border-color: var(--color-primary-light);
  box-shadow: 0 0.3rem 1rem var(--color-shadow);
  outline: none;
}

.ajustes-perfil__opcion--bloqueada,
.ajustes-perfil__opcion--bloqueada:hover,
.ajustes-perfil__opcion--bloqueada:focus-visible {
  background: var(--color-surface-soft);
  border-color: var(--color-border);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.72;
}

.ajustes-perfil__icono {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--color-primary);
  background: var(--color-chip);
  border-radius: 10px;
  font-size: 1.35rem;
}

.ajustes-perfil__texto {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.ajustes-perfil__opcion-titulo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.ajustes-perfil__opcion-descripcion {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.ajustes-perfil__chevron {
  color: var(--color-text-muted);
  font-size: 1.25rem;
}

.ajustes-perfil__opcion--bloqueada .ajustes-perfil__chevron {
  color: var(--color-text-subtle);
}

.ajustes-perfil__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  color: var(--color-primary);
  background: var(--color-chip);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.4;
}

.ajustes-perfil__riesgo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-top: auto;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border-soft);
}

.ajustes-perfil__riesgo-texto {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ajustes-perfil__riesgo-titulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.ajustes-perfil__riesgo-descripcion,
.ajustes-perfil__riesgo-nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.ajustes-perfil__riesgo-nota {
  color: var(--color-text-subtle);
}

.ajustes-perfil__baja {
  border-radius: 999px;
  white-space: nowrap;
}

.ajustes-perfil__estado {
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.ajustes-perfil__estado-icono {
  font-size: 2.2rem;
}

.ajustes-perfil__modal-error {
  margin: 0.75rem 0 0;
  color: var(--color-danger-text);
  font-size: 0.85rem;
}

.ajustes-perfil__modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .ajustes-perfil__header,
  .ajustes-perfil__panel {
    padding: 1.25rem;
  }

  .ajustes-perfil__panel {
    min-height: 420px;
  }

  .ajustes-perfil__opcion {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 0.75rem;
    padding: 0.85rem;
  }

  .ajustes-perfil__icono {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .ajustes-perfil__chevron {
    display: none;
  }

  .ajustes-perfil__riesgo {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.9rem;
  }

  .ajustes-perfil__baja {
    width: 100%;
  }
}
</style>
