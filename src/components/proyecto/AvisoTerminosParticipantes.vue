<template>
  <aside
    class="aviso-tyc-participantes"
    role="note"
    aria-label="Aviso de términos y condiciones de los participantes"
  >
    <span class="material-symbols-outlined" aria-hidden="true">info</span>
    <p class="aviso-tyc-participantes__texto">
      <template v-if="contexto === 'postulacion'">
        Modalink establece como regla de convivencia que, al incorporarte a un
        proyecto, aceptás que se aplican los términos y condiciones vigentes de
        todos sus participantes. Al postularte, aceptás esta regla para el caso
        de que el director te incorpore.
      </template>
      <template v-else-if="contexto === 'reemplazo'">
        Al aceptar esta invitación de reemplazo y unirte a
        <strong>{{ nombreProyectoTexto }}</strong>, aceptás la regla de
        convivencia de Modalink: se aplican los términos y condiciones vigentes
        de todos los participantes.
      </template>
      <template v-else>
        Al aceptar esta invitación y unirte a
        <strong>{{ nombreProyectoTexto }}</strong>, aceptás la regla de
        convivencia de Modalink: se aplican los términos y condiciones vigentes
        de todos los participantes.
      </template>
      <RouterLink
        :to="{ name: 'normas-convivencia' }"
        class="aviso-tyc-participantes__enlace"
        target="_blank"
        rel="noopener noreferrer"
      >
        Leer las normas completas
      </RouterLink>.
    </p>
  </aside>
</template>

<script>
/*
 * Aviso informativo para el participante que ingresa o se postula a un
 * proyecto. La aceptación de los T&C de todos los participantes es implícita:
 * no hay checkbox ni request adicional.
 */
export default {
  name: "AvisoTerminosParticipantes",
  props: {
    nombreProyecto: {
      type: String,
      default: "",
    },
    /** "invitacion" | "reemplazo" | "postulacion" */
    contexto: {
      type: String,
      default: "invitacion",
    },
  },
  computed: {
    nombreProyectoTexto() {
      return String(this.nombreProyecto || "").trim() || "este proyecto";
    },
  },
};
</script>

<style scoped>
.aviso-tyc-participantes {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--color-info-border);
  border-radius: 10px;
  background: var(--color-info-soft);
  color: var(--color-info-text);
  font-size: 0.82rem;
  line-height: 1.5;
}

.aviso-tyc-participantes .material-symbols-outlined {
  flex: 0 0 auto;
  margin-top: 0.05rem;
  font-size: 1.05rem;
}

.aviso-tyc-participantes__texto {
  margin: 0;
  overflow-wrap: anywhere;
}

.aviso-tyc-participantes__texto strong {
  font-weight: 700;
}

.aviso-tyc-participantes__enlace {
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: underline;
}

.aviso-tyc-participantes__enlace:hover {
  color: var(--color-primary-dark);
}
</style>
