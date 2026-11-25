/*
 * Comportamiento compartido para tablas de administración.
 *
 * Vuestic expone `grid` en VaDataTable para mostrar cada fila como tarjeta.
 * No es una prop responsive por sí sola, así que este mixin escucha el
 * viewport y expone `propsTablaResponsive` para aplicarla con v-bind.
 */
export const tablaResponsiveMixin = {
  data() {
    return {
      esPantallaAngosta: false,
      mediaQueryTabla: null,
      manejadorMediaTabla: null,
    };
  },
  computed: {
    propsTablaResponsive() {
      return this.esPantallaAngosta
        ? { grid: true, gridColumns: 1 }
        : { grid: false };
    },
  },
  mounted() {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(max-width: 768px)");
    this.mediaQueryTabla = query;
    this.esPantallaAngosta = query.matches;
    this.manejadorMediaTabla = (evento) => {
      this.esPantallaAngosta = evento.matches;
    };

    if (query.addEventListener) {
      query.addEventListener("change", this.manejadorMediaTabla);
    } else if (query.addListener) {
      query.addListener(this.manejadorMediaTabla);
    }
  },
  beforeUnmount() {
    if (!this.mediaQueryTabla || !this.manejadorMediaTabla) return;
    if (this.mediaQueryTabla.removeEventListener) {
      this.mediaQueryTabla.removeEventListener(
        "change",
        this.manejadorMediaTabla
      );
    } else if (this.mediaQueryTabla.removeListener) {
      this.mediaQueryTabla.removeListener(this.manejadorMediaTabla);
    }
  },
};

export default tablaResponsiveMixin;
