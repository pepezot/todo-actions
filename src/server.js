// Ponto de entrada: `npm start` executa este arquivo.
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, () => {
  console.log(`ToDo rodando em http://localhost:${port}`);
});
