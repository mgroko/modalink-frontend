<template>
  <div class="contratos-pendientes-view">
    <ListadoContratos
      titulo="Pendientes de mi firma"
      subtitulo="Contratos donde tu firma todavía está pendiente. La firma y el rechazo se realizan desde el detalle."
      :mi-firma-pendiente-fijo="true"
      :sincronizar-query="true"
    />
  </div>
</template>

<script>
import ListadoContratos from "../../components/contrato/ListadoContratos.vue";

/*
 * Bandeja dedicada de UC-55. Reutiliza el listado de UC-68 con
 * `miFirmaPendiente=true` fijo; el backend devuelve solo los contratos donde
 * el perfil activo tiene una firma PENDIENTE.
 */
export default {
  name: "ContratosPendientesView",
  components: { ListadoContratos },
};
</script>

<style scoped>
.contratos-pendientes-view {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}
</style>
