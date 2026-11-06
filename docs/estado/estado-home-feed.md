# Estado del Home con feed y filtros

**Fecha:** 2026-11-05  
**Rama:** `modulo-proyectos`  
**Alcance:** primera versión del feed del Home con pestañas y datos reales.

## 1. Resumen

El Home de `/home` ahora muestra un feed con:

- Encabezado **Inicio** y subtítulo según la pestaña activa.
- Botón **Nueva publicación** deshabilitado con tooltip **Próximamente**.
- Pestañas **Todo**, **Proyectos** y **Postulaciones**.
- Sección **Proyectos** con datos de `GET /proyectos/buscar`.
- Sección **Postulaciones disponibles** con el bloque `oportunidades` de
  `GET /home/resumen?limite=20`.
- Acción **Postular** reutilizando `ModalPostulacion.vue`.

La pestaña **Todo** muestra hasta 3 proyectos y 3 oportunidades. Las pestañas
específicas muestran hasta 12 proyectos y 20 oportunidades respectivamente.
En **Proyectos**, **Ver todos** navega a `/proyectos`.

## 2. Archivos

### Nuevos

- `src/components/home/HomeFeed.vue`
- `src/components/home/HomeFeedTabs.vue`
- `src/components/home/HomeFeedSection.vue`
- `src/components/home/ProyectoHomeCard.vue`
- `src/components/home/OportunidadCard.vue`

### Modificados

- `src/views/perfil/HomeView.vue`: orquesta la carga, las pestañas y la
  postulación.
- `src/services/homeService.js`: `obtenerResumen(limite = 5)` envía `limite`.

## 3. Contratos usados

- `GET /home/resumen?limite=20`:
  - `perfilActivo`
  - `oportunidades`
  - `totalOportunidadesGenerales`
  - `totalOportunidadesActividad`
- `GET /proyectos/buscar?page=0&size=12`:
  - `contenido`, `totalElementos`
- `POST /proyectos/{idProyecto}/postulaciones/general`
- `POST /proyectos/{idProyecto}/postulaciones/actividad`

## 4. Reglas de presentación

- **Postular** sólo se habilita con
  `puedePostularse === true && yaPostulado === false`.
- Si `yaPostulado`, se muestra `EstadoPostulacionBadge`.
- Si no es postulable, se muestra el motivo informado por el backend.
- No se muestran cupos en proyectos porque `GET /proyectos/buscar` no los
  incluye.
- No se muestran ubicación ni remuneración en oportunidades porque no forman
  parte del contrato.
- Se reutilizan los tokens de `src/style.css` para claro/oscuro.

## 5. Diferido

- **Publicaciones:** el backend no tiene tabla ni endpoint; no se renderiza.
- **Actividad de contactos:** no existe modelo de seguidores; no se renderiza.
- **Usuarios recomendados:** no existe endpoint de recomendaciones; no se
  renderiza.
- **Paginación dentro del Home:** se resolvió con **Ver todos** hacia
  `/proyectos`. Las oportunidades quedan limitadas a 20.
- **Cupos de proyectos:** requiere ampliar el DTO de búsqueda o consultar el
  detalle por proyecto.

## 6. Validación

```bash
npm run build
```

Resultado: build exitoso. Se mantienen las advertencias preexistentes de Vite
sobre chunks mayores a 500 kB y la importación dinámica del router.
