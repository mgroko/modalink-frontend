<template>
  <ListadoContratos
    :id-proyecto="idProyecto"
    :mostrar-filtro-proyecto="false"
    :puede-crear="puedeGenerar"
    :query-base="queryBase"
    sincronizar-query
    titulo="Contratos"
    subtitulo="Contratos visibles para tu perfil en este proyecto. El Director ve todos; cada firmante ve los suyos."
    @nuevo-contrato="$emit('nuevo-contrato')"
  />
</template>

<script>
import ListadoContratos from "../contrato/ListadoContratos.vue";

/*
 * Pestaña Contratos del proyecto (UC-68).
 *
 * Reutiliza el listado global con `idProyecto` fijo. La visibilidad la aplica
 * el backend: Director ve todos; firmante ve los contratos donde tiene firma;
 * un miembro sin contratos recibe una página vacía.
 */
export default {
  name: "ContratosProyecto",
  components: { ListadoContratos },
  props: {
    idProyecto: {
      type: [Number, String],
      required: true,
    },
    /** Director activo en Publicado/Confirmado: habilita "Nuevo contrato". */
    puedeGenerar: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // La pestaña del proyecto vive en la URL; el listado debe conservarla
      // al sincronizar sus filtros y su página.
      queryBase: { tab: "contratos" },
    };
  },
  emits: ["nuevo-contrato"],
};
</script>
