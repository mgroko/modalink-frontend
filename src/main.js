import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// import de vuestic-ui
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import iconsConfig from "./services/vuestic-ui/icons-config";

createApp(App)
  .use(router)
  .use(createVuestic({ config: { icons: iconsConfig } }))
  .mount("#app");