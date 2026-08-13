import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegistroView from "../views/RegistroView.vue";
import HomeView from "../views/HomeView.vue";
import RecuperarPasswordView from "../views/RecuperarPasswordView.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/registro",
    name: "registro",
    component: RegistroView,
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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
