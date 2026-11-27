# Guía de diseño responsive

Documento de referencia para mantener el frontend usable en teléfonos, tablets y
desktop. No es necesario reescribir todo el CSS existente: las pantallas que se
toquen deben migrar a estas convenciones.

## Estado de la implementación

- Fases 0 a 5 completadas: base global, layouts, área de usuario, proyectos,
  contratos, panel administrativo y pulido.
- Las tablas de datos usan tarjetas en móvil. Los Gantt y líneas de tiempo
  conservan scroll horizontal intencional.
- Safe-area y `100dvh` aplicados en layouts, modales, chat y barras principales.
- El documento sigue siendo la referencia para nuevas pantallas.

## Breakpoints oficiales

| Rango | Uso |
| --- | --- |
| `<= 479px` | Teléfono chico (320–479) |
| `480px – 639px` | Teléfono grande |
| `640px – 767px` | Móvil horizontal / tablet chica |
| `768px – 1023px` | Tablet |
| `>= 1024px` | Desktop |

Valores de referencia: **480, 640, 768, 1024 y 1280 px**. Evitar agregar nuevos
cortes si no son imprescindibles.

Criterio de migración:

- CSS existente: se mantiene `max-width` para no reescribir pantallas completas.
- Componentes nuevos o modificados: preferir mobile-first (`min-width`).
- No mezclar en un mismo componente mobile-first y desktop-first sin necesidad.

## Matriz mínima de prueba

| Ancho × alto | Referencia |
| --- | --- |
| 320 × 568 | iPhone SE (1.ª gen) |
| 360 × 800 | Android pequeño |
| 390 × 844 | iPhone 12/13/14 |
| 414 × 896 | iPhone Plus |
| 768 × 1024 | iPad vertical |
| 1024 × 768 | iPad horizontal |
| 1280 × 800 | Notebook |
| 1440 × 900 | Desktop |

Probar también:

- Orientación vertical y horizontal.
- Zoom del navegador al 200 %.
- iOS Safari y Android Chrome.
- Modo claro y oscuro.

## Checklist de aceptación

### Página

- [ ] No hay scroll horizontal en `body` entre 320 y 1440 px.
- [ ] El contenido no queda cortado ni superpuesto.
- [ ] Los textos largos envuelven o truncan de forma intencional.
- [ ] Las imágenes y videos respetan el ancho del contenedor.

### Navegación

- [ ] El menú principal es accesible en móvil (drawer, scroll o versión compacta).
- [ ] Se puede cerrar con botón, overlay y tecla Escape cuando corresponda.
- [ ] La navegación no tapa el contenido ni queda fuera del viewport.

### Formularios

- [ ] Una columna en móvil.
- [ ] Labels y mensajes de error visibles.
- [ ] El teclado no oculta el campo activo.
- [ ] Los campos tienen al menos 16 px de tipografía en móvil (evita zoom en iOS).
- [ ] Fechas, horas, selects y textareas son usables con touch.

### Acciones y tablas

- [ ] Toda acción principal se puede tocar sin hover.
- [ ] Área táctil mínima de 44 × 44 px.
- [ ] Tablas: modo tarjetas o scroll interno con encabezado visible.
- [ ] Los filtros son accesibles sin desplazarse horizontalmente.
- [ ] El pie de paginación se envuelve correctamente.

### Modales

- [ ] En móvil ocupan el ancho disponible o toda la pantalla.
- [ ] El cuerpo tiene scroll propio.
- [ ] Cabecera y footer quedan accesibles.
- [ ] El contenido no desborda el viewport.

## Patrones recomendados

### Grillas fluidas

Evitar mínimos mayores al ancho disponible:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
```

### Hijos flexibles

En flex/grid, permitir que el hijo se encoja:

```css
.hijo-flexible {
  min-width: 0;
}
```

### Textos largos

```css
.texto-largo {
  overflow-wrap: anywhere;
}
```

### Altura de viewport

```css
.pantalla {
  min-height: 100vh;
  min-height: 100dvh;
}
```

### Áreas seguras

Para barras fijas, chat o footers:

```css
.barra-fija {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
```

### Hover solo con puntero

```css
@media (hover: hover) {
  .accion:hover {
    background: var(--color-hover);
  }
}
```

### Tabla a tarjetas

Reutilizar el patrón de `TablaPostulaciones.vue` y `TablaContratos.vue`:
ocultar `thead`, mostrar cada fila como tarjeta y usar `data-label` en las
celdas.

### Modal responsive

```css
.modal__dialog {
  display: flex;
  flex-direction: column;
  max-height: 90dvh;
}

.modal__body {
  overflow-y: auto;
}

@media (max-width: 576px) {
  .modal__dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
}
```

## Reglas para no repetir problemas

- No usar `overflow-x: hidden` en `body` para ocultar desbordes: corregir el
  elemento que desborda.
- No usar `transform: scale()` para “adaptar” una pantalla.
- No dejar acciones importantes solo en `:hover`.
- No agregar nuevos breakpoints sin justificarlo.
- Al tocar un archivo monolítico, extraer la sección responsive a un
  subcomponente si es posible.
