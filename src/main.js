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
        primary: '#b865a4', // color principal (botones, inputs, links)
        background:   '#ffffe7',  
        secondary: '#ff512f',   // color secundario 
        grey:'#434343',   // color de texto
        success: '#10B981',
        danger: '#E11D48',
        info: '#3B82F6',
        warning: '#F59E0B',
    }
  } 
} 
}));
  app.mount("#app");

  