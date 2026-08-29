<template>
  <div class="crear-perfil">
    <h1 class="crear-perfil__titulo">Crear nuevo perfil</h1>
    <p class="crear-perfil__subtitulo">Completá los datos generales y las características de tu perfil profesional.</p>

    <div class="crear-perfil__stepper">
      <div class="crear-perfil__paso" :class="{ 'crear-perfil__paso--activo': paso === 1, 'crear-perfil__paso--completo': paso > 1 }">
        <span class="crear-perfil__paso-numero">1</span>
        <span>Datos generales</span>
      </div>
      <div class="crear-perfil__paso-linea" :class="{ 'crear-perfil__paso-linea--activa': paso > 1 }"></div>
      <div class="crear-perfil__paso" :class="{ 'crear-perfil__paso--activo': paso === 2, 'crear-perfil__paso--completo': paso > 2 }">
        <span class="crear-perfil__paso-numero">2</span>
        <span>Características y biografía</span>
      </div>
    </div>

    <VaForm ref="form" :immediate="false" @submit.prevent="paso === 1 ? irPaso2() : guardar()" class="crear-perfil__form">
      <template v-if="paso === 1">
        <div class="crear-perfil__campos">
          <VaInput
            v-model="form.nombreArtistico"
            :rules="[reglas.requerido, reglas.min2]"
            label="Nombre artístico"
            type="text"
            placeholder="Ej: Lía Stylist"
          />

          <VaSelect
            v-model="form.idProfesion"
            :options="profesiones"
            value-by="idProfesion"
            :text-by="(option) => capitalizarEtiqueta(option.nombre)"
            :rules="[reglas.requerido]"
            label="Profesión"
            placeholder="Seleccioná una profesión"
            :loading="cargandoProfesiones"
          />
        </div>
      </template>

      <template v-else>
        <div v-if="cargandoCaracteristicas" class="crear-perfil__estado">
          <span class="material-symbols-outlined crear-perfil__estado-icono">hourglass_empty</span>
          Cargando características...
        </div>

        <div v-else-if="caracteristicas.length === 0" class="crear-perfil__estado">
          <span class="material-symbols-outlined crear-perfil__estado-icono">info</span>
          No se encontraron características para esta profesión. Podés continuar con la biografía.
        </div>

        <template v-else>
          <div class="crear-perfil__campos">
            <!-- Altura primero, ocupa ancho completo -->
            <div v-if="caracteristicaAltura" class="crear-perfil__campo-caracteristica">
              <VaInput
                v-if="!esEnumerado(caracteristicaAltura)"
                v-model="form.caracteristicas[caracteristicaAltura.idCaracteristica].valor"
                :rules="[reglas.requerido]"
                :label="etiquetaCaracteristica(caracteristicaAltura)"
                :type="esNumerico(caracteristicaAltura) ? 'number' : 'text'"
                :placeholder="`Valor de ${labelCaracteristica(caracteristicaAltura.codigo)}`"
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
                  <span v-if="getValorById(caracteristicaAltura, value)" class="crear-perfil__opcion">
                    <span v-if="getValorById(caracteristicaAltura, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(caracteristicaAltura, value).colorHex }"></span>
                    {{ labelValor(getValorById(caracteristicaAltura, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="crear-perfil__opcion">
                    <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
                    {{ labelValor(option.codigo) }}
                  </span>
                </template>
              </VaSelect>
            </div>

            <!-- Medidas: pecho, cintura, cadera en un mismo renglón + acción alineada a Cadera -->
            <div v-if="caracteristicasMedidas.length" class="crear-perfil__medidas-linea">
              <div class="crear-perfil__fila-medidas">
                <div
                  v-for="carac in caracteristicasMedidas"
                  :key="carac.idCaracteristica"
                  class="crear-perfil__campo-caracteristica"
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
                      <span v-if="getValorById(carac, value)" class="crear-perfil__opcion">
                        <span v-if="getValorById(carac, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                        {{ labelValor(getValorById(carac, value).codigo) }}
                      </span>
                    </template>
                    <template #option-content="{ option }">
                      <span class="crear-perfil__opcion">
                        <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
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
                    :placeholder="`Valor de ${labelCaracteristica(carac.codigo)}`"
                  />
                </div>
              </div>
            </div>

            <!-- Colores: piel, cabello, ojos -->
            <div
              v-for="carac in caracteristicasColores"
              :key="carac.idCaracteristica"
              class="crear-perfil__campo-caracteristica"
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
                  <span v-if="getValorById(carac, value)" class="crear-perfil__opcion">
                    <span v-if="getValorById(carac, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                    {{ labelValor(getValorById(carac, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="crear-perfil__opcion">
                    <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
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
                :placeholder="`Valor de ${labelCaracteristica(carac.codigo)}`"
              />
            </div>

            <!-- Resto de características no contempladas en el orden pedido -->
            <div
              v-for="carac in caracteristicasRestantes"
              :key="carac.idCaracteristica"
              class="crear-perfil__campo-caracteristica"
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
                  <span v-if="getValorById(carac, value)" class="crear-perfil__opcion">
                    <span v-if="getValorById(carac, value).colorHex" class="crear-perfil__swatch" :style="{ background: getValorById(carac, value).colorHex }"></span>
                    {{ labelValor(getValorById(carac, value).codigo) }}
                  </span>
                </template>
                <template #option-content="{ option }">
                  <span class="crear-perfil__opcion">
                    <span v-if="option.colorHex" class="crear-perfil__swatch" :style="{ background: option.colorHex }"></span>
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
                :placeholder="`Valor de ${labelCaracteristica(carac.codigo)}`"
              />
            </div>
          </div>
        </template>

        <div class="crear-perfil__campos">
          <VaInput
            v-model="form.biografia"
            :rules="[reglas.requerido, reglas.max500]"
            type="textarea"
            label="Biografía"
            placeholder="Contá sobre tu trayectoria profesional..."
          />
        </div>
      </template>

      <div class="crear-perfil__acciones">
        <template v-if="paso === 1">
          <VaButton preset="secondary" @click="volver">Cancelar</VaButton>
          <VaButton type="submit">Siguiente</VaButton>
        </template>
        <template v-else>
          <VaButton preset="secondary" @click="paso = 1">Atrás</VaButton>
          <VaButton type="submit" :loading="cargando">Crear perfil</VaButton>
        </template>
      </div>
    </VaForm>

    <BaseAlert :message="mensajeExito" type="success" />
    <BaseAlert :message="mensajeError" type="error" />
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

export default {
  name: "CrearPerfilView",
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
      paso: 1,
      profesiones: [],
      cargandoProfesiones: false,
      cargandoCaracteristicas: false,
      caracteristicas: [],
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
    await this.cargarProfesiones();
  },
  methods: {
    async cargarProfesiones() {
      this.cargandoProfesiones = true;
      try {
        const response = await perfilService.listarProfesiones();
        const datos = response?.data;
        this.profesiones = Array.isArray(datos) ? datos : datos?.profesiones || [];
      } catch {
        this.mensajeError = "No se pudieron cargar las profesiones. Intentá nuevamente.";
      } finally {
        this.cargandoProfesiones = false;
      }
    },

    async irPaso2() {
      const isValid = this.$refs.form.validate();
      if (!isValid || !this.form.idProfesion) return;

      this.mensajeExito = "";
      this.mensajeError = "";
      this.cargandoCaracteristicas = true;

      try {
        const response = await perfilService.caracteristicasPorProfesion(this.form.idProfesion);
        const datos = response?.data;
        this.caracteristicas = Array.isArray(datos) ? datos : datos?.caracteristicas || [];

        this.form.caracteristicas = {};
        this.caracteristicas.forEach((carac) => {
          this.form.caracteristicas[carac.idCaracteristica] = {
            valor: "",
            idValor: null,
          };
        });

        this.paso = 2;
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
        idProfesion: this.form.idProfesion,
        biografia: this.form.biografia.trim(),
        caracteristicas,
      };

      try {
        await perfilService.crear(request);
        this.mensajeExito = "Perfil creado correctamente.";
        setTimeout(() => {
          this.$router.push({ name: "dashboard-usuario" });
        }, 1200);
      } catch (error) {
        this.mensajeError =
          error?.response?.data?.message || "No se pudo crear el perfil. Intentá nuevamente.";
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
.crear-perfil {
  max-width: 860px;
}

.crear-perfil__titulo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.crear-perfil__subtitulo {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

/* Stepper */
.crear-perfil__stepper {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.crear-perfil__paso {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: #9ca3af;
}

.crear-perfil__paso-numero {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.78rem;
  flex-shrink: 0;
}

.crear-perfil__paso--activo {
  color: #b865a4;
  font-weight: 600;
}

.crear-perfil__paso--activo .crear-perfil__paso-numero {
  background: #b865a4;
  color: #fff;
}

.crear-perfil__paso--completo {
  color: #374151;
}

.crear-perfil__paso--completo .crear-perfil__paso-numero {
  background: #f59e0b;
  color: #fff;
}

.crear-perfil__paso-linea {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 1rem;
}

.crear-perfil__paso-linea--activa {
  background: #b865a4;
}

/* Form */
.crear-perfil__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.crear-perfil__campos {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.crear-perfil__campo-caracteristica :deep(.va-input-wrapper__field) {
  min-height: 40px;
}

.crear-perfil__medidas-linea {
  display: block;
}

.crear-perfil__fila-medidas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

.crear-perfil__opcion {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.crear-perfil__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  vertical-align: middle;
}

@media (max-width: 900px) {
  .crear-perfil__fila-medidas {
    grid-template-columns: 1fr;
  }
}

.crear-perfil__estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.crear-perfil__estado-icono {
  font-size: 2rem;
}

.crear-perfil__acciones {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}
</style>