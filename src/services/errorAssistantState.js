import { reactive } from "vue";
import manualService from "./manualService";
import { state as authState } from "./authState";
import {
  buscarCoincidenciasError,
  prepararError,
} from "../utils/errorMatching";

export const errorAssistantState = reactive({
  catalogo: [],
  cargado: false,
  cargando: false,
  error: "",
  abierto: false,
  mensaje: "",
  coincidencias: [],
});

let disparador = null;
let promesaCarga = null;

async function cargarCatalogo() {
  if (errorAssistantState.cargado || promesaCarga) return promesaCarga;
  if (!authState.usuario) return null;

  errorAssistantState.cargando = true;
  errorAssistantState.error = "";

  promesaCarga = manualService
    .obtenerErrores()
    .then((respuesta) => {
      errorAssistantState.catalogo = (respuesta?.data || []).map(prepararError);
      errorAssistantState.cargado = true;
    })
    .catch(() => {
      errorAssistantState.error = "No se pudo cargar la ayuda de errores.";
      errorAssistantState.catalogo = [];
    })
    .finally(() => {
      errorAssistantState.cargando = false;
      promesaCarga = null;
    });

  return promesaCarga;
}

async function consultar(mensaje) {
  if (!authState.usuario) return [];
  await cargarCatalogo();
  return buscarCoincidenciasError(errorAssistantState.catalogo, mensaje);
}

function abrir(mensaje, coincidencias) {
  disparador = document.activeElement;
  errorAssistantState.mensaje = mensaje;
  errorAssistantState.coincidencias = coincidencias || [];
  errorAssistantState.abierto = true;
}

function cerrar() {
  errorAssistantState.abierto = false;
  if (disparador && typeof disparador.focus === "function") {
    disparador.focus();
  }
  disparador = null;
}

export { cargarCatalogo, consultar, abrir, cerrar };
