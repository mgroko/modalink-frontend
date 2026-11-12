import { createRouter, createWebHistory } from "vue-router";

import AuthLayout from "../components/AuthLayout.vue";
import AdminLayout from "../components/admin/AdminLayout.vue";
import UserDashboardLayout from "../components/usuario/UserDashboardLayout.vue";
import HomeLayout from "../components/home/HomeLayout.vue";

import LoginView from "../views/auth/LoginView.vue";
import RegistroView from "../views/auth/RegistroView.vue";
import GoogleCallbackView from "../views/auth/GoogleCallbackView.vue";
import GoogleCompletarView from "../views/auth/GoogleCompletarView.vue";
import EmailLoginView from "../views/auth/EmailLoginView.vue";
import DashboardUsuarioView from "../views/usuario/DashboardUsuarioView.vue";
import HomeView from "../views/perfil/HomeView.vue";
import CrearPerfilView from "../views/perfil/CrearPerfilView.vue";
import EditarPerfilView from "../views/perfil/EditarPerfilView.vue";
import AjustesPerfilView from "../views/perfil/AjustesPerfilView.vue";
import ConfigurarTerminosView from "../views/perfil/ConfigurarTerminosView.vue";
import InicioPerfilView from "../views/perfil/InicioPerfilView.vue";
import BuscarPerfilView from "../views/perfil/BuscarPerfilView.vue";
import MiRedView from "../views/conexion/MiRedView.vue";
import MensajesView from "../views/mensajes/MensajesView.vue";
import CrearProyectoView from "../views/proyecto/CrearProyectoView.vue";
import ProyectosInicioView from "../views/proyecto/ProyectosInicioView.vue";
import DashboardProyectoView from "../views/proyecto/DashboardProyectoView.vue";
import CrearActividadView from "../views/proyecto/CrearActividadView.vue";
import ModificarActividadView from "../views/proyecto/ModificarActividadView.vue";
import ModificarProyectoView from "../views/proyecto/ModificarProyectoView.vue";
import ActividadDetalleView from "../views/proyecto/ActividadDetalleView.vue";
import InvitarProyectoView from "../views/proyecto/InvitarProyectoView.vue";
import GenerarContratoView from "../views/proyecto/GenerarContratoView.vue";
import BuscarContratosView from "../views/contrato/BuscarContratosView.vue";
import ContratosPendientesView from "../views/contrato/ContratosPendientesView.vue";
import DetalleContratoView from "../views/contrato/DetalleContratoView.vue";
import ModificarContratoView from "../views/contrato/ModificarContratoView.vue";
import SolicitudesView from "../views/proyecto/SolicitudesView.vue";
import PublicacionDetalleView from "../views/perfil/PublicacionDetalleView.vue";
import MisPostulacionesView from "../views/proyecto/MisPostulacionesView.vue";
import CalificacionesProyectoView from "../views/proyecto/CalificacionesProyectoView.vue";
import ModificarDatosView from "../views/usuario/ModificarDatosView.vue";
import CalendarioView from "../views/usuario/CalendarioView.vue";
import NotificacionesView from "../views/usuario/NotificacionesView.vue";
import GestionUsuariosView from "../views/admin/GestionUsuariosView.vue";
import BusquedaUsuariosView from "../views/admin/BusquedaUsuariosView.vue";
import DashboardAdminView from "../views/admin/DashboardAdminView.vue";
import GestionarCaracteristicasView from "../views/admin/GestionarCaracteristicasView.vue";
import GestionHabilidadesView from "../views/admin/GestionHabilidadesView.vue";
import GestionTiposContratoView from "../views/admin/GestionTiposContratoView.vue";
import ConfiguracionSchedulerView from "../views/admin/ConfiguracionSchedulerView.vue";
import ConfiguracionSchedulerBajaView from "../views/admin/ConfiguracionSchedulerBajaView.vue";
import ConfiguracionSchedulerLimpiezaImagenesView from "../views/admin/ConfiguracionSchedulerLimpiezaImagenesView.vue";
import GestionUnidadesMedidaView from "../views/admin/GestionUnidadesMedidaView.vue";
import ConfiguracionSistemaView from "../views/admin/ConfiguracionSistemaView.vue";
import ReparacionCronogramaView from "../views/admin/ReparacionCronogramaView.vue";
import ProyectosAdminView from "../views/admin/ProyectosAdminView.vue";
import ReportesAdminView from "../views/admin/ReportesAdminView.vue";
import ReportesPerfilView from "../views/admin/ReportesPerfilView.vue";
import ReportePerfilDetalleView from "../views/admin/ReportePerfilDetalleView.vue";
import ReportesPublicacionView from "../views/admin/ReportesPublicacionView.vue";
import ReportePublicacionDetalleView from "../views/admin/ReportePublicacionDetalleView.vue";
import AuditoriaAdminView from "../views/admin/AuditoriaAdminView.vue";
import { esAdmin, tienePermiso, restaurarSesion, idPerfilActivo, state } from "../services/authState";
import perfilService from "../services/perfilService";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/registro",
    name: "registro",
    component: RegistroView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/home",
    name: "home",
    component: HomeView,
    meta: { layout: HomeLayout, titulo: "Inicio", requiresActiveProfile: true, navActiva: "inicio" },
  },
  {
    path: "/inicio-perfil",
    name: "inicioperfil",
    component: InicioPerfilView,
    meta: { layout: HomeLayout, titulo: "Mi perfil", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/inicio-perfil/ajustes",
    name: "ajustes-perfil-inicio",
    component: AjustesPerfilView,
    meta: {
      layout: HomeLayout,
      titulo: "Ajustes de perfil",
      requiresActiveProfile: true,
      sinFondoBlanco: true,
      navActiva: "ajustes",
    },
  },
  {
    path: "/inicio-perfil/ajustes/editar/:id",
    name: "editar-perfil-ajustes",
    component: EditarPerfilView,
    props: { desdeAjustes: true },
    meta: {
      layout: HomeLayout,
      titulo: "Editar perfil",
      requiresActiveProfile: true,
      sinFondoBlanco: true,
      navActiva: "ajustes",
    },
  },
  {
    path: "/inicio-perfil/ajustes/terminos-condiciones",
    name: "configurar-terminos-perfil",
    component: ConfigurarTerminosView,
    meta: {
      layout: HomeLayout,
      titulo: "Términos y condiciones",
      requiresActiveProfile: true,
      sinFondoBlanco: true,
      navActiva: "ajustes",
    },
  },
  {
    path: "/inicio-perfil/resenas/:idCalificacion",
    name: "inicioperfil-resena",
    component: InicioPerfilView,
    meta: { layout: HomeLayout, titulo: "Reseña", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/inicio-perfil/:seccion",
    name: "inicioperfil-seccion",
    component: InicioPerfilView,
    meta: { layout: HomeLayout, titulo: "Mi perfil", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/perfiles/:id",
    name: "ver-perfil",
    component: InicioPerfilView,
    meta: { layout: HomeLayout, titulo: "Perfil", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/perfiles/:id/resenas/:idCalificacion",
    name: "ver-perfil-resena",
    component: InicioPerfilView,
    meta: { layout: HomeLayout, titulo: "Reseña", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/perfiles/:id/:seccion",
    name: "ver-perfil-seccion",
    component: InicioPerfilView,
    meta: { layout: HomeLayout, titulo: "Perfil", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/mi-red",
    name: "mi-red",
    component: MiRedView,
    meta: {
      layout: HomeLayout,
      titulo: "Mi red",
      requiresActiveProfile: true,
      navActiva: "mi-red",
    },
  },
  {
    path: "/mensajes",
    name: "mensajes",
    component: MensajesView,
    meta: {
      layout: HomeLayout,
      titulo: "Mensajes",
      requiresActiveProfile: true,
      navActiva: "mensajes",
      sinFondoBlanco: true,
    },
  },
  {
    path: "/solicitudes-conexion",
    redirect: (to) => ({
      name: "mi-red",
      query: {
        ...to.query,
        tab: to.query.direccion === "ENVIADA" ? "enviadas" : "recibidas",
      },
    }),
  },
  {
    path: "/red-contactos",
    redirect: (to) => ({
      name: "mi-red",
      query: {
        ...to.query,
        tab: "conexiones",
      },
    }),
  },
  {
    path: "/buscar",
    name: "buscar",
    component: BuscarPerfilView,
    meta: { layout: HomeLayout, titulo: "Búsqueda", requiresActiveProfile: true },
  },
  {
    path: "/buscar-perfiles",
    redirect: { name: "buscar" },
  },
  {
    path: "/buscar-requerimientos",
    redirect: (to) => ({
      name: "buscar",
      query: { ...to.query, tab: "oportunidades" },
    }),
  },
  {
    path: "/crear-proyecto",
    name: "crear-proyecto",
    component: CrearProyectoView,
    meta: { layout: HomeLayout, titulo: "Crear proyecto", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/proyectos",
    name: "proyectos-inicio",
    component: ProyectosInicioView,
    meta: { layout: HomeLayout, titulo: "Proyectos / Inicio", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/proyectos/:id/modificar",
    name: "modificar-proyecto",
    component: ModificarProyectoView,
    meta: { layout: HomeLayout, titulo: "Modificar proyecto", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/proyectos/:id/invitar",
    name: "invitar-proyecto",
    component: InvitarProyectoView,
    meta: { layout: HomeLayout, titulo: "Invitar a proyecto", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/proyectos/:id/contratos/nuevo",
    name: "generar-contrato",
    component: GenerarContratoView,
    meta: { layout: HomeLayout, titulo: "Nuevo contrato", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/contratos",
    name: "buscar-contratos",
    component: BuscarContratosView,
    meta: { layout: HomeLayout, titulo: "Contratos", requiresActiveProfile: true, navActiva: "contratos" },
  },
  {
    path: "/contratos/buscar",
    redirect: (to) => ({ name: "buscar-contratos", query: to.query }),
  },
  {
    path: "/contratos/pendientes",
    name: "contratos-pendientes",
    component: ContratosPendientesView,
    meta: { layout: HomeLayout, titulo: "Pendientes de mi firma", requiresActiveProfile: true, navActiva: "contratos" },
  },
  {
    path: "/proyectos/:idProyecto/contratos/:idContrato/modificar",
    name: "modificar-contrato",
    component: ModificarContratoView,
    meta: { layout: HomeLayout, titulo: "Modificar contrato", requiresActiveProfile: true, navActiva: "contratos" },
  },
  {
    path: "/proyectos/:idProyecto/contratos/:idContrato",
    name: "detalle-contrato",
    component: DetalleContratoView,
    meta: { layout: HomeLayout, titulo: "Detalle del contrato", requiresActiveProfile: true, navActiva: "contratos" },
  },
  {
    path: "/solicitudes",
    name: "solicitudes",
    component: SolicitudesView,
    meta: { layout: HomeLayout, titulo: "Solicitudes", requiresActiveProfile: true, navActiva: "solicitudes" },
  },
  {
    path: "/invitaciones",
    redirect: (to) => ({ name: "solicitudes", query: to.query }),
  },
  {
    path: "/publicaciones/:idPublicacion",
    name: "publicacion-detalle",
    component: PublicacionDetalleView,
    meta: { layout: HomeLayout, titulo: "Publicación", requiresActiveProfile: true, sinFondoBlanco: true },
  },
  {
    path: "/proyectos/:id/actividades/crear",
    name: "crear-actividad",
    component: CrearActividadView,
    meta: { layout: HomeLayout, titulo: "Nueva actividad", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/proyectos/:id/actividades/:idActividad/modificar",
    name: "modificar-actividad",
    component: ModificarActividadView,
    meta: { layout: HomeLayout, titulo: "Editar actividad", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    // Destino de notificaciones de actividad: abre la planificación del
    // proyecto y resalta la actividad indicada.
    path: "/proyectos/:id/actividades/:idActividad",
    name: "actividad-proyecto",
    redirect: (to) => ({
      name: "dashboard-proyecto",
      params: { id: to.params.id },
      query: {
        ...to.query,
        tab: "planificacion",
        actividad: to.params.idActividad,
      },
    }),
  },
  {
    path: "/proyectos/mis-postulaciones",
    name: "mis-postulaciones",
    component: MisPostulacionesView,
    meta: {
      layout: HomeLayout,
      titulo: "Mis postulaciones",
      requiresActiveProfile: true,
      navActiva: "proyectos",
    },
  },
  {
    path: "/proyectos/:id/actividades/:idActividad/detalle",
    name: "actividad-detalle",
    component: ActividadDetalleView,
    meta: {
      layout: HomeLayout,
      titulo: "Actividad",
      requiresActiveProfile: true,
      navActiva: "proyectos",
    },
  },
  {
    path: "/proyectos/:id/postulaciones",
    name: "postulaciones-proyecto",
    redirect: (to) => ({
      name: "dashboard-proyecto",
      params: { id: to.params.id },
      query: { tab: "postulaciones" },
    }),
  },
  {
    path: "/proyectos/:id/calificaciones",
    name: "calificaciones-proyecto",
    component: CalificacionesProyectoView,
    meta: {
      layout: HomeLayout,
      titulo: "Calificaciones del equipo",
      requiresActiveProfile: true,
      navActiva: "proyectos",
    },
  },
  {
    path: "/proyectos/:id/chat",
    redirect: (to) => ({
      name: "dashboard-proyecto",
      params: { id: to.params.id },
      query: { ...to.query, tab: "chat" },
    }),
  },
  {
    path: "/proyectos/:id",
    name: "dashboard-proyecto",
    component: DashboardProyectoView,
    meta: { layout: HomeLayout, titulo: "Proyecto", requiresActiveProfile: true, navActiva: "proyectos" },
  },
  {
    path: "/inicio-perfil/editar/:id",
    name: "editar-perfil-inicio",
    component: EditarPerfilView,
    props: { desdeInicio: true },
    meta: { layout: HomeLayout, titulo: "Editar perfil", requiresActiveProfile: true, sinSidebarPerfil: true, sinFondoBlanco: true },
  },
  {
    path: "/dashboard-usuario",
    name: "dashboard-usuario",
    component: DashboardUsuarioView,
    meta: { layout: UserDashboardLayout, permiteSinPerfil: true },
  },
  {
    path: "/dashboard-usuario/notificaciones",
    name: "notificaciones-usuario",
    component: NotificacionesView,
    meta: { layout: UserDashboardLayout, titulo: "Notificaciones", permiteSinPerfil: true },
  },
  {
    path: "/notificaciones",
    name: "notificaciones-perfil",
    component: NotificacionesView,
    meta: {
      layout: HomeLayout,
      titulo: "Notificaciones",
      navActiva: "notificaciones",
      soloPerfilActivo: true,
    },
  },
  {
    path: "/dashboard-usuario/modificar-datos",
    name: "modificar-datos",
    component: ModificarDatosView,
    meta: { layout: UserDashboardLayout, permiteSinPerfil: true },
  },
  {
    path: "/dashboard-usuario/calendario",
    name: "calendario",
    component: CalendarioView,
    meta: { layout: UserDashboardLayout, titulo: "Calendario", permiteSinPerfil: true },
  },
  {
    path: "/dashboard-usuario/crear-perfil",
    name: "crear-perfil",
    component: CrearPerfilView,
    meta: { layout: UserDashboardLayout, titulo: "Crear perfil", sinPerfilActivo: true },
  },
  {
    path: "/dashboard-usuario/editar-perfil/:id",
    name: "editar-perfil",
    component: EditarPerfilView,
    meta: { layout: UserDashboardLayout, titulo: "Editar perfil", permiteSinPerfil: true },
  },
  {
    path: "/auth/email",
    name: "email-login",
    component: EmailLoginView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/auth/google/callback",
    name: "google-callback",
    component: GoogleCallbackView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/auth/google/completar",
    name: "google-completar",
    component: GoogleCompletarView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/admin/dashboard",
    name: "dashboard-admin",
    component: DashboardAdminView,
    meta: { layout: AdminLayout, requiereAdmin: true, requierePermiso: "VER_USUARIOS" }
  },
  {
    path: "/admin/notificaciones",
    name: "notificaciones-admin",
    component: NotificacionesView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      titulo: "Notificaciones",
    }
  },
  {
    path: "/admin/proyectos",
    name: "proyectos-admin",
    component: ProyectosAdminView,
    meta: { layout: AdminLayout, requiereAdmin: true, requierePermiso: "VER_USUARIOS", titulo: "Proyectos" }
  },
  {
    path: "/admin/reportes",
    name: "reportes-admin",
    component: ReportesAdminView,
    meta: { layout: AdminLayout, requiereAdmin: true, titulo: "Reportes" }
  },
  {
    path: "/admin/reportes-perfil",
    name: "admin-reportes-perfil",
    component: ReportesPerfilView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      titulo: "Reportes de perfil",
    },
  },
  {
    path: "/admin/reportes-perfil/:id",
    name: "admin-reporte-perfil",
    component: ReportePerfilDetalleView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      titulo: "Detalle del reporte",
    },
  },
  {
    path: "/admin/reportes-publicacion",
    name: "admin-reportes-publicacion",
    component: ReportesPublicacionView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      titulo: "Reportes de publicaciones",
    },
  },
  {
    path: "/admin/reportes-publicacion/:id",
    name: "admin-reporte-publicacion",
    component: ReportePublicacionDetalleView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      titulo: "Detalle del reporte de publicación",
    },
  },
  {
    path: "/admin/auditoria",
    name: "auditoria-admin",
    component: AuditoriaAdminView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      titulo: "Auditoría",
    }
  },
  {
    path: "/admin/gestion-usuarios",
    name: "gestion-usuarios",
    component: GestionUsuariosView,
    meta: { layout: AdminLayout, requiereAdmin: true }
  },
  {
    path: "/admin/busqueda-usuarios",
    name: "busqueda-usuarios",
    component: BusquedaUsuariosView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "VER_USUARIOS",
      titulo: "Búsqueda de usuarios",
    }
  },
  {
    path: "/admin/gestionar-caracteristicas",
    name: "gestionar-caracteristicas",
    component: GestionarCaracteristicasView,
    meta: { layout: AdminLayout, requiereAdmin: true }
  },
  {
    path: "/admin/habilidades",
    name: "gestion-habilidades",
    component: GestionHabilidadesView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "VER_HABILIDADES",
      titulo: "Habilidades",
    }
  },
  {
    path: "/admin/unidades-medida",
    name: "gestion-unidades-medida",
    component: GestionUnidadesMedidaView,
    meta: { layout: AdminLayout, requiereAdmin: true, titulo: "Unidades de medida" }
  },
  {
    path: "/admin/tipos-contrato",
    name: "gestion-tipos-contrato",
    component: GestionTiposContratoView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "VER_TIPOS_CONTRATO",
      titulo: "Tipos de contrato",
    }
  },
  {
    path: "/admin/configuracion",
    name: "configuracion-sistema",
    component: ConfiguracionSistemaView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "ADMINISTRAR_CONFIGURACION",
      titulo: "Configuración del sistema",
    }
  },
  {
    path: "/admin/configuracion-scheduler",
    name: "configuracion-scheduler",
    component: ConfiguracionSchedulerView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "ADMINISTRAR_CONFIGURACION",
      titulo: "Scheduler de deshabilitación",
    }
  },
  {
    path: "/admin/configuracion-scheduler/baja",
    name: "configuracion-scheduler-baja",
    component: ConfiguracionSchedulerBajaView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "ADMINISTRAR_CONFIGURACION",
      titulo: "Scheduler de bajas",
    }
  },
  {
    path: "/admin/configuracion-scheduler/limpieza-imagenes",
    name: "configuracion-scheduler-limpieza-imagenes",
    component: ConfiguracionSchedulerLimpiezaImagenesView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "ADMINISTRAR_CONFIGURACION",
      titulo: "Scheduler de limpieza de imágenes",
    }
  },
  {
    path: "/admin/configuracion/cronograma",
    name: "admin-cronograma",
    component: ReparacionCronogramaView,
    meta: {
      layout: AdminLayout,
      requiereAdmin: true,
      requierePermiso: "ADMINISTRAR_CONFIGURACION",
      titulo: "Reparación de cronogramas",
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (to.meta.requiereAdmin) {
    await restaurarSesion();
    if (!esAdmin()) return { name: "login" };

    if (to.meta.requierePermiso && !tienePermiso(to.meta.requierePermiso)) {
      return { name: "dashboard-admin" };
    }

    return true;
  }

  if (to.meta.layout === UserDashboardLayout || to.meta.layout === HomeLayout) {
    await restaurarSesion();

    if (!state.usuario) return { name: "login" };

    if (to.name === "home" && idPerfilActivo() == null) {
      return { name: "dashboard-usuario" };
    }

    // Flujo 1: sin perfil activo, resolver a qué pantalla ir.
    if (!to.meta.sinPerfilActivo && !to.meta.permiteSinPerfil && idPerfilActivo() == null) {
      let perfiles = [];
      try {
        const response = await perfilService.listarMisPerfiles();
        perfiles = response?.data || [];
      } catch {
        perfiles = [];
      }

      if (perfiles.length === 0) {
        return to.name === "crear-perfil" ? true : { name: "crear-perfil" };
      }
      return { name: "dashboard-usuario" };
    }
  }

  return true;
});

export default router;
