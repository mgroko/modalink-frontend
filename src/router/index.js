import { createRouter, createWebHistory } from "vue-router";

import AuthLayout from "../components/AuthLayout.vue";
import AdminLayout from "../components/AdminLayout.vue";

import LoginView from "../views/auth/LoginView.vue";
import RegistroView from "../views/auth/RegistroView.vue";
import HomeView from "../views/HomeView.vue";
import RecuperarPasswordView from "../views/auth/RecuperarPasswordView.vue";
import GestionUsuariosView from "../views/admin/GestionUsuariosView.vue";
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
    path: "/home",
    name: "home",
    component: HomeView,
  },
  {
    path: "/recuperar-password",
    name: "recuperar-password",
    component: RecuperarPasswordView,
    meta: { layout: AuthLayout }
  },
  {
    path: "/admin/gestion-usuarios",
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
