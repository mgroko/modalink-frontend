<template>
  <div class="buscar-contratos-view">
    <ListadoContratos
      titulo="Contratos"
      subtitulo="Buscá los contratos de tus proyectos, revisá su estado y gestioná tu firma."
      sincronizar-query
    />
  </div>
</template>

<script>
import ListadoContratos from "../../components/contrato/ListadoContratos.vue";

export default {
  name: "BuscarContratosView",
  components: { ListadoContratos },
};
</script>

<style scoped>
.buscar-contratos-view {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}
</style>
