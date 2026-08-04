# ModaLink Frontend — Contexto para GitHub Copilot

## Qué es este proyecto
ModaLink es una plataforma de networking profesional para la industria creativa/moda —
conceptualmente "un LinkedIn para producciones de moda". Proyecto académico final de la
materia de Ingeniería de Software, desarrollado con metodología UP (Proceso Unificado).

Este repositorio es el **frontend**: una SPA (Single Page Application) separada del
backend, que consume una API REST vía HTTP. No es un proyecto con renderizado del lado
del servidor.

## Stack tecnológico
- **Framework:** Vue 3, usando **Options API** (no Composition API — priorizamos
  simplicidad, no uses `<script setup>` con `ref`/`reactive` salvo que se indique
  explícitamente lo contrario)
- **Build tool:** Vite
- **Ruteo:** Vue Router
- **HTTP client:** Axios, con un cliente base configurado apuntando al backend
  (`http://localhost:8080` en desarrollo)
- **Backend consumido:** Java + Spring Boot + PostgreSQL, expone API REST JSON en
  el mismo dominio funcional descripto abajo
- Sin librerías de gestión de estado global (Pinia, Vuex) por ahora — estado local de
  componente y props/eventos alcanza para el alcance actual
- Sin librería de componentes UI (Vuetify, PrimeVue, etc.) salvo pedido explícito

## Estado actual
Fase de implementación temprana del frontend. El backend ya tiene modelo de datos,
casos de uso y diagramas de secuencia definidos — este repo va construyendo pantallas
a medida que el backend expone endpoints reales.

## Contexto de dominio (para que las pantallas y formularios tengan sentido)

- **Roles:** un usuario tiene un rol global (Administrador o Usuario) y, dentro de cada
  proyecto en el que participa, un rol de proyecto (Director o Miembro).
- Un usuario puede ser Director de un proyecto y Miembro de otro simultáneamente.
- Un proyecto tiene un solo Director (sin co-dirección).
- Un perfil puede postularse a `requerimientos` de actividades dentro de un proyecto
  (0..N postulaciones por perfil). Las postulaciones tienen `fecha` y `estado`
  (pensar estados tipo pendiente/aceptada/rechazada al armar UI).
- Existe el rol de "colaborador general": miembro de proyecto sin actividad asignada
  (ej. asesor de imagen/estilo) — igual en jerarquía a los demás miembros.
- La agenda/bloqueo de disponibilidad se calcula en el backend, no es algo que el
  frontend deba calcular ni cachear como si fuera un dato estático.

Si algo de esto no coincide con lo que te muestra el endpoint real, avisame antes de
adaptar la UI a una suposición — puede ser que el backend todavía no lo implementó así.

## Cómo quiero trabajar con vos

- **Alcance acotado:** implementá exactamente lo que pido en el prompt. Si para
  completar la tarea creés necesario tocar otro componente/archivo no mencionado,
  explicámelo primero y esperá confirmación antes de tocarlo.
- **No refactorices** código fuera del alcance de la tarea actual, aunque veas algo
  mejorable. Sugerilo como comentario aparte, no como cambio aplicado.
- **No agregues dependencias/librerías nuevas** (UI kits, gestores de estado, etc.)
  sin preguntar antes — ver stack tecnológico arriba.
- **No generes archivos de configuración, tests, o documentación adicional** que no
  pedí explícitamente.
- En tareas grandes o poco claras, **explicame tu plan en texto antes de generar o
  editar código**, y esperá mi confirmación.
- Preferí explicaciones breves de *qué* hiciste y *por qué*, no un resumen extenso.
- Estoy aprendiendo el patrón SPA + API REST por primera vez (vengo de proyectos MVC
  con vistas HTML puras) — si el enfoque que proponés es distinto a lo que yo conocía,
  marcámelo explícitamente en vez de asumir que ya lo entiendo.

## Convenciones del proyecto

- Componentes en PascalCase (`PerfilCard.vue`, `LoginForm.vue`).
- Un componente por archivo, carpeta `src/components/` para reutilizables y
  `src/views/` para pantallas asociadas a una ruta.
- Llamadas HTTP centralizadas en `src/services/` (un archivo por recurso, ej.
  `perfilService.js`), nunca Axios llamado directo desde un componente.
- Nombres de props y variables en español cuando reflejan conceptos de dominio
  (ej. `perfil`, `requerimiento`, `postulacion`), en inglés cuando son genéricos
  de UI (ej. `isLoading`, `errorMessage`).

## Comandos del proyecto
<!-- Completar cuando estén definidos -->
- Instalar dependencias: `npm install`
- Correr en desarrollo: `npm run dev`
- Build de producción: `npm run build`

## Qué NO hacer nunca
- No hardcodear la URL del backend en múltiples archivos — usar una única config
  (ej. variable de entorno `VITE_API_URL` o archivo de config centralizado).
- No guardar tokens de autenticación en `localStorage` sin preguntarme primero cómo
  quiero manejarlo (hay trade-offs de seguridad que quiero decidir conscientemente).
- No hacer `git push` ni cambios de configuración de CI sin que yo lo pida explícitamente.
- No borrar ni modificar diagramas/documentación de la cátedra ya entregada, salvo
  pedido explícito.
