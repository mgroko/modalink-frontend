
Editarperfilview · VUE
<template>
  <div class="editar-perfil">
    <h1 class="editar-perfil__titulo">Editar perfil</h1>
    <p class="editar-perfil__subtitulo">Actualizá la información de tu perfil profesional.</p>
 
    <div v-if="cargandoInicial" class="editar-perfil__estado">
      <span class="material-symbols-outlined editar-perfil__estado-icono">hourglass_empty</span>
      Cargando perfil...
    </div>
 
    <div v-else-if="noEncontrado" class="editar-perfil__estado">
      <span class="material-symbols-outlined editar-perfil__estado-icono">error</span>
      No se encontró el perfil solicitado.
      <VaButton preset="secondary" @click="volver">Volver al dashboard</VaButton>
    </div>
 
    <template v-else>
      <div class="editar-perfil__foto">
        <img
          v-if="perfil.fotoUrl"
          :src="perfil.fotoUrl"
          :alt="perfil.nombreArtistico || 'Foto de perfil'"
          class="editar-perfil__foto-img"
        />
        <div v-else class="editar-perfil__foto-img editar-perfil__foto-img--placeholder">
          <span class="material-symbols-outlined">person</span>
        </div>
        <div class="editar-perfil__foto-info">
          <span class="editar-perfil__profesion">{{ perfil.profesion || "Profesión" }}</span>
          <span class="editar-perfil__foto-aviso">La foto de perfil no se edita desde este formulario.</span>
        </div>
      </div>
 
      <VaForm ref="form" :immediate="false" @submit.prevent="guardar" class="editar-perfil__form">
        <div class="editar-perfil__campos">
          <VaInput
            v-model="form.nombreArtistico"
            :rules="[reglas.requerido, reglas.min2]"
            label="Nombre artístico"
            type="text"
            placeholder="Ej: Lía Stylist"
          />
 
          <VaSelect
            :model-value="form.idProfesion"
            :options="profesiones"
            value-by="idProfesion"
            :text-by="(option) => capitalizarEtiqueta(option.nombre)"
            label="Profesión"
            disabled
          />
        </div>
 
        <div v-if="cargandoCaracteristicas" class="editar-perfil__estado">
          <span class="material-symbols-outlined editar-perfil__estado-icono">hourglass_empty</span>
          Cargando características...
        </div>
 
        <div v-else-if="caracteristicas.length === 0" class="editar-perfil__estado">
          <span class="material-symbols-outlined editar-perfil__estado-icono">info</span>
          No se encontraron características para esta profesión.
        </div>
 
        <template v-else>
          <div class="editar-perfil__campos">
            <div v-if="caracteristicaAltura" class="editar-perfil__campo-caracteristica">
              <VaInput
                v-if="!esEnumerado(caracteristicaAltura)"
                v-model="form.caracteristicas[caracteristicaAltura.idCaracteristica].valor"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(caracteristicaAltura)"
                :type="esNumerico(caracteristicaAltura) ? 'number' : 'text'"
                :placeholder="`${labelCaracteristica(caracteristicaAltura.codigo)} ...`"
              />
              <VaSelect
                v-else
                v-model="form.caracteristicas[caracteristicaAltura.idCaracteristica].idValor"
                :options="caracteristicaAltura.valores || []"
                value-by="idValor"
                :text-by="(option) => labelValor(option.codigo)"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(caracteristicaAltura)"
                placeholder="Seleccioná un valor"
              >
                <template #content="{ value }">
                  <span v-if="getValorById(caracteristicaAltura, value)" class="editar-perfil__opcion">
                    <span v-if="getValorById(caracteristicaAltura, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(caracteristicaAltura, value).colorHex }"></span>
                    {{ labelValor(getValorById(caracteristicaAltura, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="editar-perfil__opcion">
                    <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
            </div>
 
            <div v-if="caracteristicasMedidas.length" class="editar-perfil__medidas-linea">
              <div class="editar-perfil__fila-medidas">
                <div
                  v-for="carac in caracteristicasMedidas"
                  :key="carac.idCaracteristica"
                  class="editar-perfil__campo-caracteristica"
                >
                  <VaSelect
                    v-if="esEnumerado(carac)"
                    v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                    :options="carac.valores || []"
                    value-by="idValor"
                    :text-by="(option) => labelValor(option.codigo)"
                    :rules="[reglas.requerido]"
                    :label="etiquetaCaracteristica(carac)"
                    placeholder="Seleccioná un valor"
                  >
                    <template #content="{ value }">
                      <span v-if="getValorById(carac, value)" class="editar-perfil__opcion">
                        <span v-if="getValorById(carac, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                        {{ labelValor(getValorById(carac, value).codigo) }}
                      </span>
                    </template>
                    <template #option-content="{ option }">
                      <span class="editar-perfil__opcion">
                        <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                        {{ labelValor(option.codigo) }}
                      </span>
                    </template>
                  </VaSelect>
                  <VaInput
                    v-else
                    v-model="form.caracteristicas[carac.idCaracteristica].valor"
                    :rules="[reglas.requerido]"
                    :label="etiquetaCaracteristica(carac)"
                    :type="esNumerico(carac) ? 'number' : 'text'"
                    :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
                  />
                </div>
              </div>
            </div>
 
            <div
              v-for="carac in caracteristicasColores"
              :key="carac.idCaracteristica"
              class="editar-perfil__campo-caracteristica"
            >
              <VaSelect
                v-if="esEnumerado(carac)"
                v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                :options="carac.valores || []"
                value-by="idValor"
                :text-by="(option) => labelValor(option.codigo)"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(carac)"
                placeholder="Seleccioná un valor"
              >
                <template #content="{ value }">
                  <span v-if="getValorById(carac, value)" class="editar-perfil__opcion">
                    <span v-if="getValorById(carac, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                    {{ labelValor(getValorById(carac, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="editar-perfil__opcion">
                    <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
              <VaInput
                v-else
                v-model="form.caracteristicas[carac.idCaracteristica].valor"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(carac)"
                :type="esNumerico(carac) ? 'number' : 'text'"
                :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
              />
            </div>
 
            <div
              v-for="carac in caracteristicasRestantes"
              :key="carac.idCaracteristica"
              class="editar-perfil__campo-caracteristica"
            >
              <VaSelect
                v-if="esEnumerado(carac)"
                v-model="form.caracteristicas[carac.idCaracteristica].idValor"
                :options="carac.valores || []"
                value-by="idValor"
                :text-by="(option) => labelValor(option.codigo)"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(carac)"
                placeholder="Seleccioná un valor"
              >
                <template #content="{ value }">
                  <span v-if="getValorById(carac, value)" class="editar-perfil__opcion">
                    <span v-if="getValorById(carac, value).colorHex" class="editar-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                    {{ labelValor(getValorById(carac, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="editar-perfil__opcion">
                    <span v-if="option.colorHex" class="editar-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
              <VaInput
                v-else
                v-model="form.caracteristicas[carac.idCaracteristica].valor"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(carac)"
                :type="esNumerico(carac) ? 'number' : 'text'"
                :placeholder="`${labelCaracteristica(carac.codigo)} ...`"
              />
            </div>
          </div>
        </template>
 
        <div class="editar-perfil__campos">
          <VaInput
            v-model="form.biografia"
            :rules="[reglas.requerido, reglas.max500]"
            type="textarea"
            label="Biografía"
            placeholder="Contá sobre tu trayectoria profesional..."
          />
        </div>
 
        <div
          class="editar-perfil__alertas-wrapper"
          :class="{ 'editar-perfil__alertas-wrapper--visible': mensajeExito || mensajeError }"
        >
          <div class="editar-perfil__alertas">
            <BaseAlert v-if="mensajeExito" :message="mensajeExito" type="success" />
            <BaseAlert v-if="mensajeError" :message="mensajeError" type="error" />
          </div>
        </div>
 
        <div class="editar-perfil__acciones">
          <VaButton preset="secondary" @click="volver" :disabled="cargando || !!mensajeExito">Cancelar</VaButton>
          <VaButton type="submit" :loading="cargando" :disabled="!!mensajeExito">Guardar cambios</VaButton>
        </div>
      </VaForm>
    </template>
 
    
  </div>
</template>
 
<script>
import perfilService from "../../services/perfilService";
import BaseAlert from "../../components/AlertaBase.vue";
 
const ETIQUETAS_CARACTERISTICAS = {
  altura: "Altura",
  peso: "Peso",
  medida_pecho: "Medida de pecho",
  pecho: "Medida de pecho",
  busto: "Medida de pecho",
  medida_cintura: "Medida de cintura",
  cintura: "Medida de cintura",
  medida_cadera: "Medida de cadera",
  cadera: "Medida de cadera",
  color_piel: "Color de piel",
  piel: "Color de piel",
  color_cabello: "Color de cabello",
  cabello: "Color de cabello",
  pelo: "Color de cabello",
  color_ojos: "Color de ojos",
  ojos: "Color de ojos",
  talle: "Talle",
  talle_calzado: "Talle de calzado",
};
 
const ETIQUETAS_VALORES = {
  marron: "Marrón",
  marrón: "Marrón",
  negro: "Negro",
  caoba: "Caoba",
  castanio: "Castaño",
  castano: "Castaño",
  castaño: "Castaño",
  rubio: "Rubio",
  rubia: "Rubia",
  pelirrojo: "Pelirrojo",
  pelirroja: "Pelirroja",
  otto: "Otro",
  otro: "Otro",
  celeste: "Celeste",
  verde: "Verde",
  azul: "Azul",
  gris: "Gris",
  blanco: "Blanco",
  avellana: "Avellana",
  miel: "Miel",
  clara: "Clara",
  media: "Media",
  oscura: "Oscura",
  muy_clara: "Muy clara",
  muy_oscura: "Muy oscura",
};
 
const ORDEN_PRIORIDAD = {
  altura: 10,
  medida_pecho: 20,
  pecho: 20,
  busto: 20,
  medida_cintura: 21,
  cintura: 21,
  medida_cadera: 22,
  cadera: 22,
  color_piel: 30,
  piel: 30,
  color_cabello: 31,
  cabello: 31,
  pelo: 31,
  color_ojos: 32,
  ojos: 32,
};
 
function normCodigo(codigo) {
  return (codigo || "").toLowerCase().trim();
}
 
function normTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
 
export default {
  name: "EditarPerfilView",
  components: {
    BaseAlert,
  },
  computed: {
    caracteristicaAltura() {
      return this.caracteristicas.find((c) => normCodigo(c.codigo) === "altura") || null;
    },
    caracteristicasMedidas() {
      const medidas = this.caracteristicas.filter((c) => {
        const n = normCodigo(c.codigo);
        return ["medida_pecho", "pecho", "busto", "medida_cintura", "cintura", "medida_cadera", "cadera"].includes(n);
      });
      return medidas.sort((a, b) => (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) - (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99));
    },
    caracteristicasColores() {
      const colores = this.caracteristicas.filter((c) => {
        const n = normCodigo(c.codigo);
        return ["color_piel", "piel", "color_cabello", "cabello", "pelo", "color_ojos", "ojos"].includes(n);
      });
      return colores.sort((a, b) => (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) - (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99));
    },
    caracteristicasRestantes() {
      const excluidos = new Set();
      if (this.caracteristicaAltura) excluidos.add(this.caracteristicaAltura.idCaracteristica);
      this.caracteristicasMedidas.forEach((c) => excluidos.add(c.idCaracteristica));
      this.caracteristicasColores.forEach((c) => excluidos.add(c.idCaracteristica));
      const resto = this.caracteristicas.filter((c) => !excluidos.has(c.idCaracteristica));
      return resto.sort((a, b) => (ORDEN_PRIORIDAD[normCodigo(a.codigo)] || 99) - (ORDEN_PRIORIDAD[normCodigo(b.codigo)] || 99));
    },
  },
  data() {
    return {
      idPerfil: null,
      perfil: null,
      profesiones: [],
      caracteristicas: [],
      cargandoInicial: true,
      cargandoCaracteristicas: false,
      noEncontrado: false,
      form: {
        nombreArtistico: "",
        idProfesion: null,
        biografia: "",
        caracteristicas: {},
      },
      cargando: false,
      mensajeExito: "",
      mensajeError: "",
      reglas: {
        requerido: (v) => !!v || "Este campo es requerido",
        min2: (v) => !v || v.length >= 2 || "Debe tener al menos 2 caracteres",
        max500: (v) => !v || v.length <= 500 || "La biografía no puede superar los 500 caracteres",
      },
    };
  },
  async mounted() {
    this.idPerfil = this.$route.params.id;
    await this.cargarPerfil();
  },
  methods: {
    async cargarPerfil() {
      this.cargandoInicial = true;
      this.noEncontrado = false;
      try {
        const response = await perfilService.obtener(this.idPerfil);
        this.perfil = response?.data;
        if (!this.perfil) {
          this.noEncontrado = true;
          return;
        }
        this.form.nombreArtistico = this.perfil.nombreArtistico || "";
        this.form.biografia = this.perfil.biografia || "";
 
        const profesiones = await this.cargarProfesiones();
        this.form.idProfesion = this.resolverIdProfesion(this.perfil.profesion, profesiones);
        if (this.form.idProfesion != null) {
          await this.cargarCaracteristicas(this.form.idProfesion);
        }
      } catch (error) {
        if (error?.response?.status === 404) {
          this.noEncontrado = true;
        } else {
          this.mensajeError =
            error?.response?.data?.message || "No se pudo cargar el perfil. Intentá nuevamente.";
        }
      } finally {
        this.cargandoInicial = false;
      }
    },
    resolverIdProfesion(nombreProfesion, profesiones) {
      const nombreNorm = normTexto(nombreProfesion);
      const encontrada = profesiones.find((p) => normTexto(p.nombre) === nombreNorm);
      return encontrada ? encontrada.idProfesion : null;
    },
    async cargarProfesiones() {
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.profesiones = [];
      }
      return this.profesiones;
    },
    async cargarCaracteristicas(idProfesion) {
      this.cargandoCaracteristicas = true;
      try {
        const response = await perfilService.caracteristicasPorProfesion(idProfesion);
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : datos?.caracteristicas || [];
 
        const valoresActuales = {};
        (this.perfil?.caracteristicas || []).forEach((c) => {
          valoresActuales[c.idCaracteristica] = {
            valor: c.valor != null ? String(c.valor) : "",
            idValor: c.idValor != null ? c.idValor : null,
          };
        });
 
        this.form.caracteristicas = {};
        this.caracteristicas.forEach((carac) => {
          this.form.caracteristicas[carac.idCaracteristica] = {
            valor: valoresActuales[carac.idCaracteristica]?.valor || "",
            idValor: valoresActuales[carac.idCaracteristica]?.idValor ?? null,
          };
        });
 
        this.$nextTick(() => {
          this.$refs.form?.resetValidation?.();
        });
      } catch {
        this.mensajeError = "No se pudieron cargar las características de la profesión.";
      } finally {
        this.cargandoCaracteristicas = false;
      }
    },
    esEnumerado(carac) {
      return carac.tipoDato === "ENUMERADO";
    },
    esNumerico(carac) {
      return carac.tipoDato === "NUMERICO";
    },
    labelCaracteristica(codigo) {
      if (!codigo) return codigo;
      const n = normCodigo(codigo);
      if (ETIQUETAS_CARACTERISTICAS[n]) return ETIQUETAS_CARACTERISTICAS[n];
      return this.capitalizarEtiqueta(codigo);
    },
    labelValor(codigo) {
      if (!codigo) return codigo;
      const n = normCodigo(codigo);
      if (ETIQUETAS_VALORES[n]) return ETIQUETAS_VALORES[n];
      return this.capitalizarEtiqueta(codigo);
    },
    capitalizarEtiqueta(texto) {
      const palabras = String(texto).toLowerCase().split(/[_\-]+/).filter(Boolean);
      const capitalizadas = palabras.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
      return capitalizadas.join(" ");
    },
    etiquetaCaracteristica(carac) {
      const base = this.labelCaracteristica(carac.codigo);
      if (!carac.unidad) return base;
      const unidadNorm = normCodigo(carac.unidad);
      if (unidadNorm === "color" || unidadNorm === "colour") return base;
      return `${base} (${carac.unidad.toLowerCase()})`;
    },
    getValorById(carac, idValor) {
      if (idValor == null || !carac || !Array.isArray(carac.valores)) return null;
      return carac.valores.find((v) => v.idValor === idValor) || null;
    },
    async guardar() {
      const isValid = this.$refs.form.validate();
      if (!isValid) return;
 
      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargando = true;
 
      const caracteristicas = this.caracteristicas
        .map((carac) => {
          const entrada = this.form.caracteristicas[carac.idCaracteristica] || {};
          if (this.esEnumerado(carac)) {
            return {
              idCaracteristica: carac.idCaracteristica,
              idValor: entrada.idValor,
            };
          }
          return {
            idCaracteristica: carac.idCaracteristica,
            valor: entrada.valor,
          };
        })
        .filter((item) => item.idValor != null || (item.valor != null && item.valor !== ""));
 
      const request = {
        nombreArtistico: this.form.nombreArtistico.trim(),
        biografia: this.form.biografia.trim(),
        caracteristicas,
      };
 
      try {
        await perfilService.editar(this.idPerfil, request);
        this.mensajeExito = "Perfil actualizado correctamente.";
        setTimeout(() => {
          this.$router.push({ name: "dashboard-usuario" });
        }, 1200);
      } catch (error) {
        const errores = error?.response?.data?.errores;
        this.mensajeError =
          error?.response?.data?.message || "No se pudo actualizar el perfil. Intentá nuevamente.";
        if (errores) {
          this.mensajeError = `${this.mensajeError} ${JSON.stringify(errores)}`;
        }
      } finally {
        this.cargando = false;
      }
    },
    volver() {
      this.$router.push({ name: "dashboard-usuario" });
    },
  },
};
</script>
 
<style scoped>
.editar-perfil {
  max-width: 860px;
}
 
.editar-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.25rem 0;
}
 
.editar-perfil__subtitulo {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.5rem 0;
}
 
.editar-perfil__foto {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
 
.editar-perfil__foto-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
 
.editar-perfil__foto-img--placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
 
.editar-perfil__foto-img--placeholder .material-symbols-outlined {
  font-size: 2.2rem;
}
 
.editar-perfil__foto-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
 
.editar-perfil__profesion {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}
 
.editar-perfil__foto-aviso {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
 
.editar-perfil__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
 
.editar-perfil__campos {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
 
.editar-perfil__campo-caracteristica :deep(.va-input-wrapper__field) {
  min-height: 40px;
}
 
.editar-perfil__medidas-linea {
  display: block;
}
 
.editar-perfil__fila-medidas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}
 
.editar-perfil__opcion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
 
.editar-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  vertical-align: middle;
}
 
@media (max-width: 900px) {
  .editar-perfil__fila-medidas {
    grid-template-columns: 1fr;
  }
}
 
.editar-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
 
.editar-perfil__estado-icono {
  font-size: 2rem;
}
 
.editar-perfil__acciones {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}
 
.editar-perfil__alertas-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  transition: grid-template-rows 0.25s ease;
}
 
.editar-perfil__alertas-wrapper--visible {
  grid-template-rows: 1fr;
}
 
.editar-perfil__alertas {
  overflow: hidden;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
 
.editar-perfil__alertas-wrapper--visible .editar-perfil__alertas {
  padding-top: 0.15rem;
}
 
.editar-perfil__alertas > * {
  width: 100% !important;
  box-sizing: border-box;
  text-align: left;
}
 
</style>
 
