import { app } from "./app";
import { config } from "./config/env";

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
