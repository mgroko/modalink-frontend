import { createRouter, createWebHistory } from "vue-router";

import AuthLayout from "../components/AuthLayout.vue";
import AdminLayout from "../components/AdminLayout.vue";
import UserDashboardLayout from "../components/UserDashboardLayout.vue";

import LoginView from "../views/auth/LoginView.vue";
import RegistroView from "../views/auth/RegistroView.vue";
import DashboardUsuarioView from "../views/usuario/DashboardUsuarioView.vue";
import ModificarDatosView from "../views/usuario/ModificarDatosView.vue";
import RecuperarPasswordView from "../views/auth/RecuperarPasswordView.vue";
import GestionUsuariosView from "../views/admin/GestionUsuariosView.vue";
import DashboardAdminView from "../views/admin/DashboardAdminView.vue";
import { esAdmin, restaurarSesion } from "../services/authState";

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
    path: "/dashboard-usuario",
    name: "dashboard-usuario",
    component: DashboardUsuarioView,
    meta: { layout: UserDashboardLayout },
  },
  {
    path: "/dashboard-usuario/modificar-datos",
    name: "modificar-datos",
    component: ModificarDatosView,
    meta: { layout: UserDashboardLayout },
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
    name: "gestion-usuarios",
    component: GestionUsuariosView,
    meta: { layout: AdminLayout, requiereAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (!to.meta.requiereAdmin) return true;

  await restaurarSesion();

  if (esAdmin()) return true;

  return { name: "login" };
});

export default router;
