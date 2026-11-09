<template>
  <div class="emoji-picker">
    <div class="emoji-picker__backdrop" @click="$emit('cerrar')"></div>

    <div
      class="emoji-picker__panel"
      role="dialog"
      aria-label="Selector de emojis"
      @click.stop
    >
      <header class="emoji-picker__header">
        <strong>Emoji y más</strong>
        <button
          type="button"
          class="emoji-picker__cerrar"
          aria-label="Cerrar selector de emojis"
          @click="$emit('cerrar')"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <div class="emoji-picker__tabs" role="tablist" aria-label="Categorías de emojis">
        <button
          v-for="categoria in tabs"
          :key="categoria.id"
          type="button"
          class="emoji-picker__tab"
          :class="{ 'emoji-picker__tab--activa': categoriaActiva === categoria.id && !busqueda }"
          role="tab"
          :aria-selected="categoriaActiva === categoria.id && !busqueda"
          :title="categoria.label"
          :aria-label="categoria.label"
          @click="seleccionarCategoria(categoria.id)"
        >
          <span class="material-symbols-outlined">{{ categoria.icono }}</span>
        </button>
      </div>

      <div class="emoji-picker__buscador">
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
        <input
          ref="busqueda"
          v-model="busqueda"
          type="search"
          placeholder="Buscar emojis"
          aria-label="Buscar emojis"
        />
      </div>

      <div class="emoji-picker__scroll">
        <div class="emoji-picker__titulo">{{ tituloLista }}</div>

        <div v-if="emojisVisibles.length" class="emoji-picker__grid">
          <button
            v-for="item in emojisVisibles"
            :key="`${item.categoria}-${item.emoji}`"
            type="button"
            class="emoji-picker__emoji"
            :title="item.keywords"
            :aria-label="item.keywords || item.emoji"
            @click="seleccionar(item)"
          >
            {{ item.emoji }}
          </button>
        </div>

        <p v-else class="emoji-picker__vacio">
          {{
            busqueda
              ? "No se encontraron emojis."
              : "Todavía no usaste emojis en este dispositivo."
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
const CLAVE_RECIENTES = "modalink.emojisRecientes";
const MAX_RECIENTES = 24;

function crearCategoria(id, label, icono, datos) {
  return {
    id,
    label,
    icono,
    emojis: datos
      .split("|")
      .map((entrada) => {
        const [emoji, ...resto] = entrada.trim().split(" ");
        return { emoji, keywords: resto.join(" ") };
      })
      .filter((item) => item.emoji),
  };
}

const CATEGORIAS = [
  crearCategoria(
    "caritas",
    "Caritas",
    "sentiment_satisfied",
    "😀 sonrisa feliz|😃 sonrisa grande|😄 risa alegre|😁 risa radiante|😆 risa pícara|😅 risa nerviosa sudor|🤣 risa piso|😂 risa llanto|🙂 sonrisa leve|🙃 sonrisa invertida|😉 guiño|😊 sonrisa tierna|😇 ángel halo|🥰 amor corazones|😍 ojos corazones|🤩 estrellas asombro|😘 beso|😗 beso|😚 beso|😙 beso|🥲 lágrima sonrisa|😋 rico lengua|😛 lengua|😜 guiño lengua|🤪 loco|😝 lengua|🤑 dinero|🤗 abrazo|🤭 mano boca|🫢 sorpresa|🫣 tapar ojos|🤫 silencio|🤔 pensativo|🫡 saludo|🤐 cremallera|🤨 ceja|😐 neutral|😑 inexpresivo|😶 sin boca|🫥 invisible|😏 sonrisa pícara|😒 molesto|🙄 ojos arriba|😬 dientes|😮‍💨 suspiro|🤥 mentira|😌 alivio|😔 triste|😪 sueño|🤤 baba|😴 dormido|😷 mascarilla|🤒 fiebre|🤕 dolor|🤢 náuseas|🤮 vómito|🤧 estornudo|🥵 calor|🥶 frío|🥴 mareado|😵 aturdido|🤯 cabeza explotando|🤠 vaquero|🥳 fiesta|🥸 disfraz|😎 gafas|🤓 nerd|🧐 monóculo|😕 confundido|😟 preocupado|🙁 triste|☹️ triste|😮 sorpresa|😯 sorpresa|😲 asombro|😳 sonrojado|🥺 ruego|😦 preocupado|😧 angustia|😨 miedo|😰 ansiedad|😥 tristeza|😢 llanto|😭 llanto fuerte|😱 grito|😖 confundido|😣 frustrado|😞 decepción|😓 sudor|😩 cansado|😫 exhausto|🥱 bostezo|😤 enojo|😡 furioso|😠 enojado|🤬 insultos|😈 diablo|👿 diablo|💀 calavera|☠️ peligro|💩 caca|🤡 payaso|👻 fantasma|👽 alien|🤖 robot|😺 gato|😸 gato|😹 gato risa|😻 gato amor|😼 gato pícaro|😽 gato beso|🙀 gato sorpresa|😿 gato triste|😾 gato enojado"
  ),
  crearCategoria(
    "gestos",
    "Gestos",
    "back_hand",
    "👋 saludo|🤚 mano|🖐️ mano|✋ alto|🖖 vulcano|👌 ok|🤌 mano italiana|🤏 pellizco|✌️ victoria|🤞 dedos cruzados|🫰 corazón dedos|🤟 te amo|🤘 rock|🤙 llamada|👈 izquierda|👉 derecha|👆 arriba|👇 abajo|☝️ arriba|🫵 tú|👍 like|👎 dislike|✊ puño|👊 puñetazo|🤛 izquierda|🤜 derecha|👏 aplauso|🙌 manos arriba|🫶 corazón manos|👐 manos abiertas|🤲 manos|🤝 acuerdo|🙏 gracias|✍️ escribir|💅 uñas|🤳 selfie|💪 músculo|🦾 brazo robot|🦿 pierna robot|🦵 pierna|🦶 pie|👂 oreja|👃 nariz|👀 ojos|👁️ ojo|👅 lengua|👄 boca|🫦 mordida|🧠 cerebro|🫀 corazón|🫁 pulmones|🦷 diente|🦴 hueso|👤 silueta|👥 personas|🫂 abrazo|👶 bebé|🧒 niño|👦 niño|👧 niña|🧑 adulto|👨 hombre|👩 mujer|🧓 mayor|👴 anciano|👵 anciana|🙍 persona|🙎 persona|🙅 no|🙆 ok|💁 información|🙋 mano|🧏 sordo|🙇 reverencia|🤦 facepalm|🤷 no sé|👮 policía|🕵️ detective|💂 guardia|👷 obrero|🤴 príncipe|👸 princesa|🧙 mago|🧚 hada|🧛 vampiro|🧜 sirena|🧝 elfo|🧞 genio|🧟 zombi|💃 bailar|🕺 bailar|👯 bailarinas|💏 beso|💑 pareja|👪 familia"
  ),
  crearCategoria(
    "animales",
    "Animales",
    "pets",
    "🐶 perro|🐱 gato|🐭 ratón|🐹 hámster|🐰 conejo|🦊 zorro|🐻 oso|🐼 panda|🐨 koala|🐯 tigre|🦁 león|🐮 vaca|🐷 cerdo|🐸 rana|🐵 mono|🐔 gallina|🐧 pingüino|🐦 pájaro|🦄 unicornio|🐝 abeja|🦋 mariposa|🐢 tortuga|🐍 serpiente|🐙 pulpo|🦀 cangrejo|🐬 delfín|🐳 ballena|🦈 tiburón|🐊 cocodrilo|🦓 cebra|🦒 jirafa|🐘 elefante|🦔 erizo|🌵 cactus|🌲 árbol|🌳 árbol|🌴 palmera|🌱 planta|🌿 hierba|🍀 trébol|🍁 hoja|🍂 hojas|🌸 flor|🌺 flor|🌻 girasol|🌹 rosa|🌷 tulipán|🌼 flor|🌞 sol|🌝 luna|🌙 luna|⭐ estrella|🌟 estrella|✨ brillos|⚡ rayo|🔥 fuego|🌈 arcoíris|☀️ sol|🌤️ sol nubes|🌧️ lluvia|⛈️ tormenta|❄️ nieve|☃️ muñeco nieve|🌊 ola"
  ),
  crearCategoria(
    "comida",
    "Comida",
    "restaurant",
    "🍏 manzana|🍎 manzana|🍐 pera|🍊 naranja|🍋 limón|🍌 banana|🍉 sandía|🍇 uvas|🍓 frutilla|🫐 arándanos|🍒 cereza|🍑 durazno|🥭 mango|🍍 piña|🥥 coco|🥝 kiwi|🍅 tomate|🥑 palta|🥦 brócoli|🥕 zanahoria|🌽 maíz|🥔 papa|🍞 pan|🥐 croissant|🥖 baguette|🧀 queso|🥚 huevo|🍳 huevo frito|🥓 panceta|🍔 hamburguesa|🍟 papas|🍕 pizza|🌭 pancho|🌮 taco|🌯 burrito|🍜 ramen|🍝 pasta|🍣 sushi|🍤 camarón|🍦 helado|🍩 dona|🍪 galleta|🎂 torta|🍰 porción|🍫 chocolate|🍬 caramelo|🍿 pochoclo|☕ café|🍵 té|🧃 jugo|🥤 refresco|🍺 cerveza|🍷 vino|🥂 brindis|🍾 champagne"
  ),
  crearCategoria(
    "actividades",
    "Actividades",
    "sports_soccer",
    "⚽ fútbol|🏀 básquet|🏈 fútbol americano|⚾ béisbol|🎾 tenis|🏐 vóley|🏓 ping pong|🏸 bádminton|🥊 boxeo|🥋 artes marciales|⛳ golf|🏹 arco|🎣 pesca|🎮 videojuegos|🎲 dados|🧩 puzzle|🎨 arte|🎭 teatro|🎬 cine|🎤 micrófono|🎧 auriculares|🎸 guitarra|🎹 piano|🥁 batería|🎺 trompeta|🎻 violín|🎼 música|🏆 trofeo|🏅 medalla|🎯 diana|🎳 bolos|🎿 esquí|🏂 snowboard|🏄 surf|🚴 bici|🏊 nadar|🧘 yoga|🏃 correr|🚶 caminar"
  ),
  crearCategoria(
    "viajes",
    "Viajes",
    "flight",
    "🚗 auto|🚕 taxi|🚌 colectivo|🚎 trolebús|🏎️ carrera|🚓 policía|🚑 ambulancia|🚒 bomberos|🚚 camión|🚜 tractor|🛴 monopatín|🚲 bici|🛵 moto|✈️ avión|🚀 cohete|🚁 helicóptero|⛵ velero|🚢 barco|🗺️ mapa|🧭 brújula|🏠 casa|🏡 casa|🏢 edificio|🏥 hospital|🏦 banco|🏨 hotel|🏫 escuela|🏰 castillo|🗽 estatua|🗼 torre|🌍 mundo|🌎 mundo|🌏 mundo"
  ),
  crearCategoria(
    "objetos",
    "Objetos",
    "lightbulb",
    "⌚ reloj|📱 celular|💻 laptop|🖥️ monitor|⌨️ teclado|🖱️ mouse|🖨️ impresora|📷 cámara|📹 video|🎥 filmadora|📺 televisión|📻 radio|🔋 batería|🔌 enchufe|💡 lámpara|🔦 linterna|📚 libros|📖 libro|📝 nota|✏️ lápiz|🖊️ lapicera|🖌️ pincel|📌 pin|📎 clip|✂️ tijeras|🔑 llave|🔒 candado|🔨 martillo|🪛 destornillador|🧰 herramientas|🧲 imán|🛒 carrito|🎁 regalo|🎈 globo|🎉 fiesta|🎊 confeti|🕯️ vela|🧸 osito|👓 anteojos|🕶️ lentes sol|👑 corona|💎 diamante|💰 dinero|💳 tarjeta|❤️ corazón|🧡 corazón|💛 corazón|💚 corazón|💙 corazón|💜 corazón|🖤 corazón|🤍 corazón|🤎 corazón|💔 corazón roto|❣️ corazón|💕 corazones|💞 corazones|💓 corazón|💗 corazón|💖 corazón|💘 corazón|💝 corazón"
  ),
  crearCategoria(
    "simbolos",
    "Símbolos",
    "tag",
    "✅ check|❌ cruz|⭕ círculo|❗ exclamación|❓ pregunta|⚠️ advertencia|♻️ reciclar|🔴 rojo|🟠 naranja|🟡 amarillo|🟢 verde|🔵 azul|🟣 violeta|⚫ negro|⚪ blanco|🟤 marrón|🔺 triángulo|🔻 triángulo|🔶 rombo|🔷 rombo|💯 cien|✨ brillos|⭐ estrella|🌟 estrella|💫 destellos|🆗 ok|🆒 cool|🆕 nuevo|🆓 gratis|🔝 top|🔜 pronto|🔙 atrás|🔚 fin|🔛 on|🔄 recargar|🔃 actualizar|➡️ derecha|⬅️ izquierda|⬆️ arriba|⬇️ abajo|↗️ diagonal|↘️ diagonal|↪️ giro|↩️ giro|🔀 aleatorio|🔁 repetir|🔂 repetir|▶️ play|⏸️ pausa|⏹️ stop|⏺️ grabar|⏭️ siguiente|⏮️ anterior|⏩ adelante|⏪ atrás"
  ),
  crearCategoria(
    "banderas",
    "Banderas",
    "flag",
    "🇦🇷 Argentina|🇧🇷 Brasil|🇨🇱 Chile|🇺🇾 Uruguay|🇵🇾 Paraguay|🇧🇴 Bolivia|🇵🇪 Perú|🇨🇴 Colombia|🇲🇽 México|🇪🇸 España|🇺🇸 Estados Unidos|🇫🇷 Francia|🇮🇹 Italia|🇩🇪 Alemania|🇬🇧 Reino Unido|🇯🇵 Japón|🇨🇳 China|🇰🇷 Corea|🇦🇺 Australia|🇨🇦 Canadá"
  ),
];

const TABS = [
  { id: "recientes", label: "Recientes", icono: "schedule" },
  ...CATEGORIAS.map(({ id, label, icono }) => ({ id, label, icono })),
];

export default {
  name: "EmojiPicker",
  emits: ["seleccionar", "cerrar"],
  data() {
    return {
      busqueda: "",
      categoriaActiva: "caritas",
      recientes: [],
      tabs: TABS,
    };
  },
  computed: {
    todosLosEmojis() {
      return CATEGORIAS.flatMap((categoria) =>
        categoria.emojis.map((item) => ({
          ...item,
          categoria: categoria.id,
        }))
      );
    },
    resultadosBusqueda() {
      const texto = this.busqueda.trim().toLowerCase();
      if (!texto) return [];
      return this.todosLosEmojis.filter(
        (item) =>
          item.keywords.toLowerCase().includes(texto) ||
          item.emoji === texto
      );
    },
    emojisVisibles() {
      if (this.busqueda.trim()) return this.resultadosBusqueda;

      if (this.categoriaActiva === "recientes") {
        return this.recientes.map((emoji) => ({
          emoji,
          keywords: "",
          categoria: "recientes",
        }));
      }

      const categoria =
        CATEGORIAS.find((item) => item.id === this.categoriaActiva) ||
        CATEGORIAS[0];
      return categoria.emojis.map((item) => ({
        ...item,
        categoria: categoria.id,
      }));
    },
    tituloLista() {
      if (this.busqueda.trim()) return "Resultados";
      if (this.categoriaActiva === "recientes") return "Recientes";
      const categoria = CATEGORIAS.find(
        (item) => item.id === this.categoriaActiva
      );
      return categoria?.label || "Emojis";
    },
  },
  mounted() {
    this.cargarRecientes();
    window.addEventListener("keydown", this.alPresionarTecla);
    this.$nextTick(() => this.enfocarBusqueda());
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.alPresionarTecla);
  },
  methods: {
    cargarRecientes() {
      try {
        const crudo = localStorage.getItem(CLAVE_RECIENTES);
        const valor = crudo ? JSON.parse(crudo) : [];
        if (Array.isArray(valor)) {
          this.recientes = valor
            .filter((emoji) => typeof emoji === "string" && emoji)
            .slice(0, MAX_RECIENTES);
        }
      } catch {
        this.recientes = [];
      }
    },
    guardarRecientes() {
      try {
        localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(this.recientes));
      } catch {
        // Sin persistencia: la selección sigue funcionando.
      }
    },
    seleccionarCategoria(id) {
      this.categoriaActiva = id;
      this.busqueda = "";
      this.$nextTick(() => this.enfocarBusqueda());
    },
    seleccionar(item) {
      const emoji = typeof item === "string" ? item : item.emoji;
      if (!emoji) return;

      this.recientes = [
        emoji,
        ...this.recientes.filter((valor) => valor !== emoji),
      ].slice(0, MAX_RECIENTES);
      this.guardarRecientes();
      this.$emit("seleccionar", emoji);
    },
    enfocarBusqueda() {
      this.$refs.busqueda?.focus();
    },
    alPresionarTecla(event) {
      if (event.key === "Escape") this.$emit("cerrar");
    },
  },
};
</script>

<style scoped>
.emoji-picker__backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}

.emoji-picker__panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 50;
  display: flex;
  width: min(340px, calc(100vw - 2rem));
  max-height: min(430px, 62vh);
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 12px 30px var(--color-shadow);
}

.emoji-picker__header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem 0.55rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.emoji-picker__header strong {
  font-size: 0.88rem;
}

.emoji-picker__cerrar {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.emoji-picker__cerrar:hover {
  background: var(--color-surface-muted);
}

.emoji-picker__cerrar .material-symbols-outlined {
  font-size: 1.1rem;
}

.emoji-picker__tabs {
  display: flex;
  flex: none;
  gap: 0.1rem;
  overflow-x: auto;
  padding: 0.35rem 0.55rem;
  border-bottom: 1px solid var(--color-border-soft);
}

.emoji-picker__tab {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.emoji-picker__tab:hover {
  background: var(--color-surface-muted);
}

.emoji-picker__tab--activa {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-chip);
}

.emoji-picker__tab .material-symbols-outlined {
  font-size: 1.1rem;
}

.emoji-picker__buscador {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.4rem;
  margin: 0.55rem 0.75rem 0.35rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.emoji-picker__buscador .material-symbols-outlined {
  font-size: 1rem;
}

.emoji-picker__buscador input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.78rem;
}

.emoji-picker__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 0.75rem 0.75rem;
}

.emoji-picker__titulo {
  padding: 0.35rem 0 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.emoji-picker__grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 2px;
}

.emoji-picker__emoji {
  display: inline-flex;
  width: 100%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.emoji-picker__emoji:hover {
  background: var(--color-surface-muted);
}

.emoji-picker__vacio {
  margin: 0.5rem 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-align: center;
}

@media (max-width: 900px) {
  .emoji-picker__panel {
    width: min(340px, calc(100vw - 1.5rem));
    max-height: 55vh;
  }

  .emoji-picker__grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}
</style>
