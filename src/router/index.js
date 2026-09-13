import { createRouter, createWebHistory } from "vue-router";

import AuthLayout from "../components/AuthLayout.vue";
import AdminLayout from "../components/admin/AdminLayout.vue";
import UserDashboardLayout from "../components/usuario/UserDashboardLayout.vue";
import HomeLayout from "../components/home/HomeLayout.vue";

import LoginView from "../views/auth/LoginView.vue";
import RegistroView from "../views/auth/RegistroView.vue";
import DashboardUsuarioView from "../views/usuario/DashboardUsuarioView.vue";
import HomeView from "../views/perfil/HomeView.vue";
import CrearPerfilView from "../views/perfil/CrearPerfilView.vue";
import EditarPerfilView from "../views/perfil/EditarPerfilView.vue";
import ModificarDatosView from "../views/usuario/ModificarDatosView.vue";
import CalendarioView from "../views/usuario/CalendarioView.vue";
import RecuperarPasswordView from "../views/auth/RecuperarPasswordView.vue";
import GestionUsuariosView from "../views/admin/GestionUsuariosView.vue";
import DashboardAdminView from "../views/admin/DashboardAdminView.vue";
import GestionarCaracteristicasView from "../views/admin/GestionarCaracteristicasView.vue";
import ConfiguracionSchedulerView from "../views/admin/ConfiguracionSchedulerView.vue";
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
    meta: { layout: HomeLayout, titulo: "Inicio", requiresActiveProfile: true },
  },
  {
    path: "/dashboard-usuario",
    name: "dashboard-usuario",
    component: DashboardUsuarioView,
    meta: { layout: UserDashboardLayout, permiteSinPerfil: true },
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
    path: "/recuperar-password",
    name: "recuperar-password",
    component: RecuperarPasswordView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/admin/dashboard",
    name: "dashboard-admin",
    component: DashboardAdminView,
    meta: { layout: AdminLayout, requiereAdmin: true }
  },
  {
    path: "/admin/gestion-usuarios",
    name: "gestion-usuarios",
    component: GestionUsuariosView,
    meta: { layout: AdminLayout, requiereAdmin: true }
  },
  {
    path: "/admin/gestionar-caracteristicas",
    name: "gestionar-caracteristicas",
    component: GestionarCaracteristicasView,
    meta: { layout: AdminLayout, requiereAdmin: true }
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
