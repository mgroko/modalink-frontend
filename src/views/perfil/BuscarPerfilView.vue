<template>
  <div class="buscar-perfil">
    <h1 class="buscar-perfil__titulo">Buscar perfiles</h1>
    <p class="buscar-perfil__subtitulo">
      Encontrá profesionales por nombre, profesión o ubicación.
    </p>

    <section class="buscar-perfil__filtros">
      <VaInput
        v-model="filtros.q"
        class="buscar-perfil__campo buscar-perfil__campo--texto"
        placeholder="Nombre, profesión o ubicación"
        @keyup.enter="buscarAhora"
        @input="programarBusqueda"
      >
        <template #prependInner>
          <span class="material-symbols-outlined buscar-perfil__icono-campo">search</span>
        </template>
      </VaInput>

      <VaSelect
        v-model="filtros.idProfesion"
        class="buscar-perfil__campo"
        :options="profesiones"
        value-by="idProfesion"
        :text-by="(option) => option.nombre"
        placeholder="Profesión"
        clearable
        :loading="cargandoProfesiones"
        @update:modelValue="cambiarProfesion"
      />

      <VaSelect
        v-model="filtros.tamano"
        class="buscar-perfil__campo buscar-perfil__campo--tamano"
        :options="opcionesTamano"
        value-by="value"
        text-by="text"
        placeholder="Resultados"
        @update:modelValue="buscarAhora"
      />

      <VaButton
        preset="secondary"
        size="small"
        :icon="mostrarAvanzado ? 'mso-expand_less' : 'mso-expand_more'"
        @click="mostrarAvanzado = !mostrarAvanzado"
      >
        Más filtros
      </VaButton>

      <VaButton preset="secondary" @click="limpiarFiltros">
        Limpiar filtros
      </VaButton>
    </section>

    <section v-if="mostrarAvanzado" class="buscar-perfil__filtros">
      <VaInput
        v-model="filtros.nombre"
        class="buscar-perfil__campo"
        placeholder="Nombre"
        @keyup.enter="buscarAhora"
        @input="programarBusqueda"
      />

      <VaInput
        v-model="filtros.apellido"
        class="buscar-perfil__campo"
        placeholder="Apellido"
        @keyup.enter="buscarAhora"
        @input="programarBusqueda"
      />

      <VaSelect
        v-model="filtros.idCaracteristica"
        class="buscar-perfil__campo"
        :options="caracteristicas"
        value-by="idCaracteristica"
        :text-by="(opcion) => opcion.nombre || opcion.codigo"
        placeholder="Característica"
        clearable
        :disabled="filtros.idProfesion == null"
        :loading="cargandoCaracteristicas"
        @update:modelValue="cambiarCaracteristica"
      />

      <template v-if="filtros.idCaracteristica != null">
        <VaSelect
          v-if="esCaracteristicaEnumerada"
          v-model="filtros.idValorCaracteristica"
          class="buscar-perfil__campo"
          :options="valoresDeCaracteristica"
          value-by="idValor"
          text-by="codigo"
          placeholder="Valor"
          clearable
          @update:modelValue="buscarAhora"
        />
        <VaInput
          v-else
          v-model="filtros.valorCaracteristica"
          class="buscar-perfil__campo"
          :type="tipoEntradaValor"
          placeholder="Valor"
          @keyup.enter="buscarAhora"
          @input="programarBusqueda"
        />
      </template>
      <span v-else-if="filtros.idProfesion == null" class="buscar-perfil__ayuda">
        Seleccioná una profesión para filtrar por característica.
      </span>
    </section>

    <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />

    <div v-if="puedeReintentar && !cargando" class="buscar-perfil__reintento">
      <VaButton preset="primary" icon="mso-refresh" @click="reintentar">
        Reintentar
      </VaButton>
    </div>

    <div v-if="cargando" class="buscar-perfil__estado">
      <span class="material-symbols-outlined buscar-perfil__estado-icono">hourglass_empty</span>
      Buscando perfiles...
    </div>

    <template v-else>
      <p v-if="paginacion.totalElementos > 0" class="buscar-perfil__resumen">
        {{ paginacion.totalElementos }} perfil(es) encontrado(s)
        <template v-if="!esTodos">
          · Página {{ paginacion.paginaActual + 1 }} de {{ paginacion.totalPaginas }}
        </template>
      </p>

      <div v-if="perfiles.length === 0" class="buscar-perfil__estado">
        <span class="material-symbols-outlined buscar-perfil__estado-icono">search_off</span>
        <span>No encontramos ningún perfil que coincida con tus criterios de búsqueda.</span>
        <VaButton preset="secondary" size="small" @click="limpiarFiltros">
          Restablecer filtros
        </VaButton>
      </div>

      <div v-else class="buscar-perfil__grid">
        <article
          v-for="perfil in perfiles"
          :key="perfil.idPerfil"
          class="perfil-busqueda"
          role="button"
          tabindex="0"
          @click="irAPerfil(perfil)"
          @keydown.enter="irAPerfil(perfil)"
          @keydown.space.prevent="irAPerfil(perfil)"
        >
          <div class="perfil-busqueda__foto">
            <img
              v-if="perfil.fotoUrl"
              :src="perfil.fotoUrl"
              :alt="perfil.nombreArtistico"
            />
            <span v-else class="perfil-busqueda__inicial">
              {{ inicialDe(perfil.nombreArtistico) }}
            </span>
          </div>

          <div class="perfil-busqueda__cuerpo">
            <h3 class="perfil-busqueda__nombre">{{ perfil.nombreArtistico }}</h3>

            <VaBadge
              v-if="perfil.profesion"
              :text="perfil.profesion"
              color="secondary"
              outline
              class="perfil-busqueda__profesion"
            />

            <p v-if="perfil.nombreUsuario" class="perfil-busqueda__nombre-real">
              {{ perfil.nombreUsuario }} {{ perfil.apellidoUsuario }}
            </p>

            <p v-if="ubicacionTexto(perfil)" class="perfil-busqueda__ubicacion">
              <span class="material-symbols-outlined">location_on</span>
              {{ ubicacionTexto(perfil) }}
            </p>

            <div v-if="habilidadesVisibles(perfil).length" class="perfil-busqueda__habilidades">
              <span
                v-for="habilidad in habilidadesVisibles(perfil)"
                :key="habilidad"
                class="perfil-busqueda__habilidad"
              >
                {{ habilidad }}
              </span>
              <span
                v-if="habilidadesExtras(perfil) > 0"
                class="perfil-busqueda__habilidad perfil-busqueda__habilidad--mas"
              >
                +{{ habilidadesExtras(perfil) }}
              </span>
            </div>

            <div
              v-if="caracteristicasVisibles(perfil).length"
              class="perfil-busqueda__caracteristicas"
            >
              <span
                v-for="caracteristica in caracteristicasVisibles(perfil)"
                :key="caracteristica.idCaracteristica"
                class="perfil-busqueda__caracteristica"
                :class="{
                  'perfil-busqueda__caracteristica--colorida': colorValido(caracteristica),
                }"
                :style="estiloColorCaracteristica(caracteristica)"
              >
                {{ textoCaracteristica(caracteristica) }}
              </span>
              <span
                v-if="caracteristicasExtras(perfil) > 0"
                class="perfil-busqueda__caracteristica perfil-busqueda__caracteristica--mas"
              >
                +{{ caracteristicasExtras(perfil) }}
              </span>
            </div>
          </div>

          <div class="perfil-busqueda__footer">
            <VaButton
              color="primary"
              size="small"
              @click.stop="irAPerfil(perfil)"
            >
              Ver perfil
            </VaButton>
          </div>
        </article>
      </div>

      <div
        v-if="!esTodos && paginacion.totalPaginas > 1"
        class="buscar-perfil__paginacion"
      >
        <VaButton
          preset="secondary"
          size="small"
          icon="mso-chevron_left"
          :disabled="paginacion.primera"
          @click="cambiarPagina(-1)"
        >
          Anterior
        </VaButton>
        <VaButton
          preset="secondary"
          size="small"
          icon-right="mso-chevron_right"
          :disabled="paginacion.ultima"
          @click="cambiarPagina(1)"
        >
          Siguiente
        </VaButton>
      </div>
    </template>
  </div>
</template>

<script>
import perfilService from "../../services/perfilService";
import usuarioService from "../../services/usuarioService";
import BaseAlert from "../../components/AlertaBase.vue";
import { useToast } from "vuestic-ui";
import { formatUbicacion, resolverUbicacionTexto } from "../../utils/ubicacion.js";
import {
  ETIQUETAS_CARAC,
  ETIQUETAS_VALORES,
  UNIDADES_POR_CODIGO,
  normCodigo,
} from "../../utils/perfilConstants.js";

const DEBOUNCE_MS = 350;
const LONGITUD_MIN_UBICACION = 3;
const LIMITE_CACHE_UBICACION = 100;
const LIMITE_CARACTERISTICAS_CARD = 3;

// Cancela la tanda de requests en vuelo cuando arranca una búsqueda nueva
// (no reactivo a propósito: AbortController no debe pasar por reactive()).
let controladorBusqueda = null;

export default {
  name: "BuscarPerfilView",
  components: {
    BaseAlert,
  },
  setup() {
    return { toast: useToast() };
  },
  data() {
    return {
      filtros: {
        q: "",
        nombre: "",
        apellido: "",
        idProfesion: null,
        idCaracteristica: null,
        valorCaracteristica: "",
        idValorCaracteristica: null,
        tamano: { text: "20 por página", value: 20 },
      },
      opcionesTamano: [
        { text: "20 por página", value: 20 },
        { text: "50 por página", value: 50 },
        { text: "Ver todos", value: 0 },
      ],
      profesiones: [],
      cargandoProfesiones: false,
      caracteristicas: [],
      cargandoCaracteristicas: false,
      mostrarAvanzado: false,
      perfiles: [],
      paginacion: {
        paginaActual: 0,
        tamanoPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        primera: true,
        ultima: true,
      },
      cargando: true,
      mensajeError: "",
      puedeReintentar: false,
      debounceHandle: null,
      idBusqueda: 0,
      resolucionUbicacionCache: new Map(),
      claveResultados: null,
      resultadosCombinados: [],
    };
  },
  computed: {
    esTodos() {
      return this.filtros.tamano?.value === 0;
    },
    caracteristicaSeleccionada() {
      return (
        this.caracteristicas.find(
          (c) => c.idCaracteristica === this.filtros.idCaracteristica
        ) || null
      );
    },
    esCaracteristicaEnumerada() {
      const caracteristica = this.caracteristicaSeleccionada;
      if (!caracteristica) return false;
      return (
        String(caracteristica.tipoDato || "").toUpperCase() === "ENUMERADO" &&
        Array.isArray(caracteristica.valores) &&
        caracteristica.valores.length > 0
      );
    },
    tipoEntradaValor() {
      const tipo = String(
        this.caracteristicaSeleccionada?.tipoDato || ""
      ).toUpperCase();
      return tipo === "NUMERICO" ? "number" : "text";
    },
    valoresDeCaracteristica() {
      const caracteristica = this.caracteristicaSeleccionada;
      return Array.isArray(caracteristica?.valores) ? caracteristica.valores : [];
    },
  },
  async mounted() {
    const q = this.$route.query.q;
    if (typeof q === "string" && q.trim()) {
      this.filtros.q = q.trim();
    }
    await Promise.all([this.cargarProfesiones(), this.buscar()]);
  },
  watch: {
    "$route.query.q"(nuevo) {
      const valor = typeof nuevo === "string" ? nuevo.trim() : "";
      if (valor === this.filtros.q.trim()) return;
      this.filtros.q = valor;
      this.buscarAhora();
    },
  },
  methods: {
    limpiarTexto(valor) {
      return String(valor ?? "").trim();
    },
    inicialDe(valor) {
      return String(valor || "?").charAt(0).toUpperCase();
    },
    ubicacionTexto(perfil) {
      return formatUbicacion(perfil);
    },
    habilidadesVisibles(perfil) {
      const lista = Array.isArray(perfil?.habilidades) ? perfil.habilidades : [];
      return lista.slice(0, 4);
    },
    habilidadesExtras(perfil) {
      const lista = Array.isArray(perfil?.habilidades) ? perfil.habilidades : [];
      return Math.max(0, lista.length - 4);
    },
    caracteristicasVisibles(perfil) {
      const lista = Array.isArray(perfil?.caracteristicas)
        ? perfil.caracteristicas
        : [];
      return lista.slice(0, LIMITE_CARACTERISTICAS_CARD);
    },
    caracteristicasExtras(perfil) {
      const lista = Array.isArray(perfil?.caracteristicas)
        ? perfil.caracteristicas
        : [];
      return Math.max(0, lista.length - LIMITE_CARACTERISTICAS_CARD);
    },
    etiquetaCarac(codigo) {
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARAC[n]) return ETIQUETAS_CARAC[n];
      return this.capitalizar(codigo) || "—";
    },
    valorCarac(caracteristica) {
      const raw = caracteristica?.codigoValor || caracteristica?.valor;
      if (raw == null || raw === "") return "—";
      const n = normCodigo(raw);
      if (ETIQUETAS_VALORES[n]) return ETIQUETAS_VALORES[n];
      return this.capitalizar(raw) || raw;
    },
    unidadCarac(caracteristica) {
      const unidad = UNIDADES_POR_CODIGO[normCodigo(caracteristica?.codigo)];
      return unidad ? ` ${unidad}` : "";
    },
    capitalizar(texto) {
      const palabras = String(texto || "")
        .toLowerCase()
        .split(/[_\-]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return palabras.join(" ");
    },
    textoCaracteristica(caracteristica) {
      if (!caracteristica) return "";
      if (caracteristica.codigoValor) return this.valorCarac(caracteristica);
      const etiqueta = this.etiquetaCarac(caracteristica.codigo);
      const valor = caracteristica.valor;
      if (valor == null || valor === "") return etiqueta;
      return `${etiqueta} ${this.valorCarac(caracteristica)}${this.unidadCarac(
        caracteristica
      )}`;
    },
    colorValido(caracteristica) {
      const color = caracteristica?.codigoValor ? caracteristica?.colorHex : null;
      return typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color);
    },
    estiloColorCaracteristica(caracteristica) {
      if (!this.colorValido(caracteristica)) return {};
      const color = caracteristica.colorHex;
      return { backgroundColor: color, color: this.textoContraste(color) };
    },
    textoContraste(colorHex) {
      const hex = colorHex.replace("#", "");
      const canal = (valor) => {
        const v = parseInt(valor, 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const luminancia =
        0.2126 * canal(hex.slice(0, 2)) +
        0.7152 * canal(hex.slice(2, 4)) +
        0.0722 * canal(hex.slice(4, 6));
      return luminancia > 0.45 ? "#1f2937" : "#ffffff";
    },
    irAPerfil(perfil) {
      if (perfil?.idPerfil) {
        this.$router.push({ name: "ver-perfil", params: { id: perfil.idPerfil } });
      }
    },
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      } finally {
        this.cargandoProfesiones = false;
      }
    },
    limpiarRamaCaracteristica() {
      this.filtros.idCaracteristica = null;
      this.filtros.valorCaracteristica = "";
      this.filtros.idValorCaracteristica = null;
    },
    async cargarCaracteristicas() {
      const idProfesion = this.filtros.idProfesion;
      this.caracteristicas = [];
      if (idProfesion == null) {
        this.cargandoCaracteristicas = false;
        return;
      }
      this.cargandoCaracteristicas = true;
      try {
        const response = await perfilService.caracteristicasPorProfesion(idProfesion);
        if (idProfesion !== this.filtros.idProfesion) return;
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : [];
      } catch {
        if (idProfesion === this.filtros.idProfesion) this.caracteristicas = [];
      } finally {
        if (idProfesion === this.filtros.idProfesion) {
          this.cargandoCaracteristicas = false;
        }
      }
    },
    cambiarProfesion() {
      this.limpiarRamaCaracteristica();
      this.buscarAhora();
      this.cargarCaracteristicas();
    },
    cambiarCaracteristica() {
      this.filtros.valorCaracteristica = "";
      this.filtros.idValorCaracteristica = null;
      this.buscarAhora();
    },
    programarBusqueda() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => this.buscar(0), DEBOUNCE_MS);
    },
    buscarAhora() {
      clearTimeout(this.debounceHandle);
      this.buscar(0);
    },
    cambiarPagina(delta) {
      const destino = this.paginacion.paginaActual + delta;
      if (destino < 0 || destino >= this.paginacion.totalPaginas) return;
      this.buscar(destino);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    limpiarFiltros() {
      this.filtros = {
        q: "",
        nombre: "",
        apellido: "",
        idProfesion: null,
        idCaracteristica: null,
        valorCaracteristica: "",
        idValorCaracteristica: null,
        tamano: { text: "20 por página", value: 20 },
      };
      this.caracteristicas = [];
      this.cargandoCaracteristicas = false;
      this.claveResultados = null;
      this.resultadosCombinados = [];
      if (this.$route.query.q) {
        this.$router.replace({ query: {} });
      }
      this.buscarAhora();
    },
    /**
     * Filtros explícitos del panel (sin texto libre ni paginación).
     * Se aplican a la ruta simple y a cada variante del fan-out,
     * de modo que el AND del backend sigue respetándose por request.
     */
    buildParamsBase() {
      const params = {};
      const nombre = this.limpiarTexto(this.filtros.nombre);
      if (nombre) {
        params.nombre = nombre;
      }
      const apellido = this.limpiarTexto(this.filtros.apellido);
      if (apellido) {
        params.apellido = apellido;
      }
      if (this.filtros.idProfesion != null) {
        params.idProfesion = this.filtros.idProfesion;
      }

      // idCaracteristica es contenedor de valorCaracteristica/idValorCaracteristica;
      // idValorCaracteristica tiene prioridad sobre el texto (ficha UC-16 §2.2).
      if (this.filtros.idCaracteristica != null) {
        params.idCaracteristica = this.filtros.idCaracteristica;
        const idValor = this.filtros.idValorCaracteristica;
        const valor = this.limpiarTexto(this.filtros.valorCaracteristica);
        if (idValor != null) {
          params.idValorCaracteristica = idValor;
        } else if (valor) {
          params.valorCaracteristica = valor;
        }
      }
      return params;
    },
    // Sin texto libre: una sola request con paginación del servidor.
    buildParams(page) {
      const params = this.buildParamsBase();
      const size = this.filtros.tamano?.value ?? 20;
      if (size === 0) {
        params.todos = true;
      } else {
        params.page = page;
        params.size = size;
      }
      return params;
    },
    normalizarPagina(data) {
      return {
        paginaActual: data.paginaActual ?? 0,
        tamanoPagina: data.tamanoPagina ?? 20,
        totalElementos: data.totalElementos ?? 0,
        totalPaginas: data.totalPaginas ?? 1,
        primera: data.primera ?? true,
        ultima: data.ultima ?? true,
      };
    },
    /**
     * Decide si el texto libre corresponde al catálogo Georef.
     * Prioridad: provincia > localidad; si no coincide o el catálogo
     * falla, devuelve null (la tanda no incluye variante de ubicación).
     * Se memoiza por texto (los catálogos son estáticos) para no repetir
     * requests Georef en cada página o cada debounce.
     */
    async resolverFiltroUbicacion(texto) {
      const consulta = this.limpiarTexto(texto).toLowerCase();
      if (consulta.length < LONGITUD_MIN_UBICACION) return null;
      if (this.resolucionUbicacionCache.has(consulta)) {
        return this.resolucionUbicacionCache.get(consulta);
      }

      let resolucion = null;
      let catalogoOk = true;
      try {
        const provResponse = await usuarioService.listarProvincias();
        const provincias = Array.isArray(provResponse?.data) ? provResponse.data : [];

        resolucion = resolverUbicacionTexto(texto, provincias);
        if (!resolucion) {
          const locResponse = await usuarioService.listarLocalidades({ nombre: texto });
          const localidades = Array.isArray(locResponse?.data) ? locResponse.data : [];
          resolucion = resolverUbicacionTexto(texto, provincias, localidades);
        }
      } catch {
        // Fallo transitorio del catálogo: no se cachea, se reintenta después.
        resolucion = null;
        catalogoOk = false;
      }

      if (catalogoOk) {
        if (this.resolucionUbicacionCache.size >= LIMITE_CACHE_UBICACION) {
          this.resolucionUbicacionCache.clear();
        }
        this.resolucionUbicacionCache.set(consulta, resolucion);
      }
      return resolucion;
    },
    /**
     * El backend combina los filtros con AND, así que la unión OR del texto
     * libre se resuelve disparando una variante por campo (todas con
     * todos=true: la paginación se resuelve después sobre el merge).
     * Si el panel ya ocupó la clave (nombre/apellido), esa variante se
     * descarta para no mandar el mismo parámetro duplicado.
     */
    async variantesDeTexto(texto) {
      const base = this.buildParamsBase();
      const claves = ["nombreArtistico", "nombre", "apellido", "profesion"];
      const variantes = claves
        .filter((clave) => base[clave] === undefined)
        .map((clave) => ({ ...base, todos: true, [clave]: texto }));

      const ubicacion = await this.resolverFiltroUbicacion(texto);
      if (ubicacion) {
        variantes.push({ ...base, todos: true, [ubicacion.tipo]: ubicacion.valor });
      }
      return variantes;
    },
    /**
     * Une las respuestas de la tanda: dedupe por idPerfil y orden por
     * nombreArtistico asc (replica el orden fijo que trae el backend).
     */
    combinarResultados(respuestas) {
      const vistos = new Map();
      for (const respuesta of respuestas) {
        const contenido = Array.isArray(respuesta?.data?.contenido)
          ? respuesta.data.contenido
          : [];
        for (const perfil of contenido) {
          if (perfil?.idPerfil != null && !vistos.has(perfil.idPerfil)) {
            vistos.set(perfil.idPerfil, perfil);
          }
        }
      }
      return Array.from(vistos.values()).sort((a, b) =>
        String(a?.nombreArtistico || "").localeCompare(
          String(b?.nombreArtistico || ""),
          "es",
          { sensitivity: "base" }
        )
      );
    },
    /**
     * Paginación en cliente sobre el listado combinado, con la misma
     * forma de PaginaResponse que consume la vista.
     */
    paginar(listado, page) {
      const size = this.filtros.tamano?.value ?? 20;
      const totalElementos = listado.length;

      if (size === 0) {
        return {
          paginaActual: 0,
          tamanoPagina: totalElementos,
          totalElementos,
          totalPaginas: 1,
          primera: true,
          ultima: true,
          contenido: listado,
        };
      }

      const totalPaginas = Math.max(1, Math.ceil(totalElementos / size));
      const pagina = Math.min(Math.max(page, 0), totalPaginas - 1);
      return {
        paginaActual: pagina,
        tamanoPagina: size,
        totalElementos,
        totalPaginas,
        primera: pagina === 0,
        ultima: pagina >= totalPaginas - 1,
        contenido: listado.slice(pagina * size, (pagina + 1) * size),
      };
    },
    async buscar(page = 0) {
      // Token de corrida: si llega una búsqueda nueva mientras esta sigue
      // resolviendo la tanda, se descarta; la anterior se corta además
      // con AbortController.
      const corrida = ++this.idBusqueda;
      if (controladorBusqueda) controladorBusqueda.abort();
      controladorBusqueda = new AbortController();
      const signal = controladorBusqueda.signal;

      this.cargando = true;
      this.mensajeError = "";
      this.puedeReintentar = false;

      try {
        const texto = this.limpiarTexto(this.filtros.q);

        // Sin texto libre: una sola request con paginación del servidor.
        if (!texto) {
          const response = await perfilService.buscar(this.buildParams(page), signal);
          if (corrida !== this.idBusqueda) return;
          const data = response?.data || {};
          this.perfiles = Array.isArray(data.contenido) ? data.contenido : [];
          this.paginacion = this.normalizarPagina(data);
          return;
        }

        // Con texto libre: unión OR en paralelo (nombre artístico, nombre,
        // apellido, profesión y ubicación Georef) + merge + paginación cliente.
        const variantes = await this.variantesDeTexto(texto);
        if (corrida !== this.idBusqueda) return;

        const clave = JSON.stringify({ texto, variantes });
        let listado;
        if (this.claveResultados === clave) {
          // Mismo texto y mismos filtros: se reutiliza el merge (cambio de página
          // o de tamaño no vuelve a llamar al backend).
          listado = this.resultadosCombinados;
        } else {
          const respuestas = await Promise.all(
            variantes.map((params) => perfilService.buscar(params, signal))
          );
          if (corrida !== this.idBusqueda) return;
          listado = this.combinarResultados(respuestas);
          this.claveResultados = clave;
          this.resultadosCombinados = listado;
        }

        const pagina = this.paginar(listado, page);
        this.perfiles = pagina.contenido;
        this.paginacion = {
          paginaActual: pagina.paginaActual,
          tamanoPagina: pagina.tamanoPagina,
          totalElementos: pagina.totalElementos,
          totalPaginas: pagina.totalPaginas,
          primera: pagina.primera,
          ultima: pagina.ultima,
        };
      } catch (error) {
        if (
          corrida !== this.idBusqueda ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        const status = error?.response?.status;
        this.perfiles = [];
        if (status === 401) {
          this.$router.push({
            name: "login",
            query: { redirect: this.$route.fullPath },
          });
        } else if (status === 403) {
          this.mensajeError = "Tu cuenta no se encuentra habilitada para realizar búsquedas.";
        } else if (!status || status >= 500) {
          this.puedeReintentar = true;
          this.mensajeError = "Ocurrió un error al buscar perfiles. Inténtalo nuevamente.";
          this.toast.init({
            title: "Error del servidor",
            message: "No se pudieron cargar los perfiles. Usá el botón de reintento.",
            color: "danger",
            position: "top-right",
            duration: 6000,
          });
        } else {
          this.mensajeError = "Ocurrió un error al buscar perfiles. Inténtalo nuevamente.";
        }
      } finally {
        if (corrida === this.idBusqueda) this.cargando = false;
      }
    },
    reintentar() {
      this.buscar(this.paginacion.paginaActual);
    },
  },
  beforeUnmount() {
    clearTimeout(this.debounceHandle);
    if (controladorBusqueda) controladorBusqueda.abort();
  },
};
</script>

<style scoped>
.buscar-perfil {
  width: 100%;
}

.buscar-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.buscar-perfil__subtitulo {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}

.buscar-perfil__filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.buscar-perfil__campo {
  min-width: 180px;
}

.buscar-perfil__campo--texto {
  flex: 1;
  min-width: 220px;
}

.buscar-perfil__campo--tamano {
  min-width: 150px;
}

.buscar-perfil__icono-campo {
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.buscar-perfil__ayuda {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.buscar-perfil__reintento {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.buscar-perfil__resumen {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.buscar-perfil__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.perfil-busqueda {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.25rem 1rem;
  background: var(--color-surface);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.perfil-busqueda:hover {
  box-shadow: 0 8px 20px rgba(35, 33, 52, 0.08);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.perfil-busqueda:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.perfil-busqueda__foto {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  background: #edeef4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perfil-busqueda__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.perfil-busqueda__inicial {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.perfil-busqueda__cuerpo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.perfil-busqueda__nombre {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.perfil-busqueda__profesion {
  font-size: 0.75rem;
}

.perfil-busqueda__nombre-real {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-busqueda__ubicacion {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.perfil-busqueda__ubicacion .material-symbols-outlined {
  font-size: 1rem;
}

.perfil-busqueda__habilidades,
.perfil-busqueda__caracteristicas {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}

.perfil-busqueda__habilidad,
.perfil-busqueda__caracteristica {
  background: #f0f0f6;
  border: 1px solid #e5e7eb;
  color: var(--color-text);
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.perfil-busqueda__habilidad--mas,
.perfil-busqueda__caracteristica--mas {
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.perfil-busqueda__caracteristica--colorida {
  border-color: transparent;
  font-weight: 600;
}

.perfil-busqueda__footer {
  margin-top: auto;
  padding-top: 0.5rem;
}

.buscar-perfil__paginacion {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.buscar-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.buscar-perfil__estado-icono {
  font-size: 2.5rem;
}
</style>
