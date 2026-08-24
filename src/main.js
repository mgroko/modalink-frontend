import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// import de vuestic-ui
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import "./style.css";
import "./styles/vuestic-overrides.css";    
import iconsConfig from "./services/vuestic-ui/icons-config";

const app = createApp(App);

app.use(router);

app.use(createVuestic({ 
  config: { 
  icons: iconsConfig,
  colors:{
    variables:{
        primary: '#b865a4',     // color principal (botones, inputs, links)
        secondary: '#ffffe7',
        grey:'#434343',   // color secundario (fondo de la app)
        success: '#16a34a',
        danger: '#dc2626',
    }
  } 
} 
}));
  app.mount("#app");

  