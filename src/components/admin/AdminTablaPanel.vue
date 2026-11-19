<template>
  <section class="admin-tabla-panel">
    <div v-if="$slots.toolbar" class="admin-tabla-panel__toolbar">
      <slot name="toolbar" />
    </div>

    <div class="admin-tabla-panel__contenido">
      <slot />
    </div>

    <div v-if="$slots.footer" class="admin-tabla-panel__pie">
      <slot name="footer" />
    </div>
  </section>
</template>

<script>
/*
 * Contenedor de tablas del panel de administración: agrupa la barra de
 * filtros, la tabla y el pie (conteo/paginación) en una tarjeta para que la
 * tabla no quede "flotando" sobre el fondo de la página.
 */
export default {
  name: "AdminTablaPanel",
};
</script>

<style scoped>
.admin-tabla-panel {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 1px 3px rgba(35, 33, 52, 0.06);
}

.admin-tabla-panel__toolbar {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.admin-tabla-panel__contenido {
  min-width: 0;
}

.admin-tabla-panel__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--color-border-soft);
}

/* Tabla: sin cebreado, con separadores suaves entre filas. */
.admin-tabla-panel :deep(.va-data-table) {
  --va-data-table-striped-tr-background-color: transparent;
}

.admin-tabla-panel :deep(.va-data-table__table-thead th) {
  background: var(--color-surface-soft);
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.admin-tabla-panel
  :deep(.va-data-table__table-tbody .va-data-table__table-td) {
  border-bottom: 1px solid var(--color-border-soft);
}

.admin-tabla-panel
  :deep(
    .va-data-table__table-tbody
      .va-data-table__table-tr:last-child
      .va-data-table__table-td
  ) {
  border-bottom: 0;
}
</style>
