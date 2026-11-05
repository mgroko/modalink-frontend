<template>
  <VaModal
    :model-value="modelValue"
    hide-default-actions
    size="medium"
    blur
    class="resultado-invitaciones"
    @update:model-value="onCambioVisibilidad"
  >
    <template #header>
      <h3 class="va-h5 resultado-invitaciones__titulo">
        Resultado de la invitación
      </h3>
    </template>

    <div class="resultado-invitaciones__contenido">
      <p class="resultado-invitaciones__resumen">
        <template v-if="cantidadErrores === 0">
          Se enviaron <strong>{{ cantidadCreadas }}</strong>
          {{ cantidadCreadas === 1 ? "invitación" : "invitaciones" }}.
          {{ cantidadCreadas === 1 ? "Queda" : "Quedan" }} en estado
          <strong>PENDIENTE</strong>.
        </template>
        <template v-else>
          Se {{ cantidadCreadas === 1 ? "creó" : "crearon" }}
          <strong>{{ cantidadCreadas }}</strong>
          {{ cantidadCreadas === 1 ? "invitación" : "invitaciones" }} y
          <strong>{{ cantidadErrores }}</strong>
          {{ cantidadErrores === 1 ? "perfil tuvo" : "perfiles tuvieron" }}
          un error.
        </template>
      </p>

      <section v-if="cantidadErrores > 0" class="resultado-invitaciones__bloque">
        <h4 class="resultado-invitaciones__subtitulo">Perfiles con error</h4>
        <ul class="resultado-invitaciones__lista">
          <li
            v-for="error in erroresDetalle"
            :key="error.idPerfilDestinatario"
            class="resultado-invitaciones__error"
          >
            <span class="resultado-invitaciones__error-nombre">
              {{ error.nombre }}
            </span>
            <span class="resultado-invitaciones__error-mensaje">
              {{ error.mensaje }}
            </span>
          </li>
        </ul>
      </section>

      <section
        v-if="cantidadErrores > 0 && creadosDetalle.length"
        class="resultado-invitaciones__bloque"
      >
        <h4 class="resultado-invitaciones__subtitulo">Perfiles invitados</h4>
        <ul class="resultado-invitaciones__creados">
          <li v-for="perfil in creadosDetalle" :key="perfil.idPerfilDestinatario">
            {{ perfil.nombre }}
          </li>
        </ul>
      </section>

      <p class="resultado-invitaciones__nota">
        Los perfiles con error no se reintentan automáticamente.
      </p>
    </div>

    <template #footer>
      <div class="resultado-invitaciones__acciones">
        <VaButton preset="primary" @click="cerrar">Cerrar</VaButton>
      </div>
    </template>
  </VaModal>
</template>

<script>
export default {
  name: "ModalResultadoInvitaciones",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    creadas: {
      type: Array,
      default: () => [],
    },
    errores: {
      type: Array,
      default: () => [],
    },
    perfiles: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["update:modelValue", "cerrar"],
  computed: {
    cantidadCreadas() {
      return Array.isArray(this.creadas) ? this.creadas.length : 0;
    },
    cantidadErrores() {
      return Array.isArray(this.errores) ? this.errores.length : 0;
    },
    perfilesPorId() {
      const mapa = new Map();
      (Array.isArray(this.perfiles) ? this.perfiles : []).forEach((perfil) => {
        if (perfil?.idPerfil == null) return;
        mapa.set(String(perfil.idPerfil), perfil);
      });
      return mapa;
    },
    creadosDetalle() {
      return (Array.isArray(this.creadas) ? this.creadas : []).map(
        (invitacion) => ({
          idPerfilDestinatario: invitacion.idPerfilDestinatario,
          nombre: this.nombrePerfil(invitacion.idPerfilDestinatario),
        })
      );
    },
    erroresDetalle() {
      return (Array.isArray(this.errores) ? this.errores : []).map((error) => ({
        ...error,
        nombre: this.nombrePerfil(error.idPerfilDestinatario),
      }));
    },
  },
  methods: {
    nombrePerfil(idPerfil) {
      const perfil = this.perfilesPorId.get(String(idPerfil));
      return perfil?.nombreArtistico || `Perfil #${idPerfil}`;
    },
    onCambioVisibilidad(valor) {
      if (!valor) {
        this.cerrar();
        return;
      }
      this.$emit("update:modelValue", true);
    },
    cerrar() {
      this.$emit("update:modelValue", false);
      this.$emit("cerrar");
    },
  },
};
</script>

<style scoped>
.resultado-invitaciones__titulo {
  margin: 0;
}

.resultado-invitaciones__contenido {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resultado-invitaciones__resumen {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9rem;
  line-height: 1.5;
}

.resultado-invitaciones__bloque {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.resultado-invitaciones__subtitulo {
  margin: 0;
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
}

.resultado-invitaciones__lista {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.resultado-invitaciones__error {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--color-danger-border);
  border-radius: 8px;
  background: var(--color-danger-soft);
}

.resultado-invitaciones__error-nombre {
  color: var(--color-danger-text);
  font-size: 0.82rem;
  font-weight: 700;
}

.resultado-invitaciones__error-mensaje {
  color: var(--color-danger-text);
  font-size: 0.78rem;
  line-height: 1.4;
}

.resultado-invitaciones__creados {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.resultado-invitaciones__creados li {
  padding: 0.18rem 0.5rem;
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  background: var(--color-success-soft);
  color: var(--color-success-text);
  font-size: 0.72rem;
  font-weight: 600;
}

.resultado-invitaciones__nota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.resultado-invitaciones__acciones {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
