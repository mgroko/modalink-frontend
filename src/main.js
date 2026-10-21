import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// import de vuestic-ui
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import "./style.css";
import "./styles/vuestic-overrides.css";    
import iconsConfig from "./services/vuestic-ui/icons-config";
import { initTheme } from "./services/themeState";

initTheme();

const app = createApp(App);

app.use(router);

app.use(createVuestic({ 
  config: { 
    icons: iconsConfig,
    colors: {
      currentPresetName: "light",
      presets: {
        light: {
          primary: "#494776",
          secondary: "#6866A9",
          success: "#16A34A",
          danger: "#DC2626",
          info: "#3B82F6",
          warning: "#F59E0B",
          backgroundPrimary: "#F5F5F8",
          backgroundSecondary: "#FFFFFF",
          backgroundElement: "#F3F4F6",
          backgroundBorder: "#E5E7EB",
          textPrimary: "#232134",
          textInverted: "#FFFFFF",
          shadow: "rgba(35, 33, 52, 0.12)",
          focus: "#494776",
          transparent: "rgba(0, 0, 0, 0)",
        },
        dark: {
          primary: "#8D86E0",
          secondary: "#A9A6BD",
          success: "#4ADE80",
          danger: "#F87171",
          info: "#60A5FA",
          warning: "#FBBF24",
          backgroundPrimary: "#17161F",
          backgroundSecondary: "#201F2B",
          backgroundElement: "#2A2938",
          backgroundBorder: "#34324A",
          textPrimary: "#ECEBF5",
          textInverted: "#17161F",
          shadow: "rgba(0, 0, 0, 0.5)",
          focus: "#8D86E0",
          transparent: "rgba(0, 0, 0, 0)",
        },
      },
    },
  } 
}));
  app.mount("#app");

  