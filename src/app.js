// Camada HTTP: traduz requisições em chamadas às regras de src/todos.js.
// Usa só o módulo http nativo do Node — zero dependências.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createTodoStore, ValidationError } from './todos.js';

const INDEX_HTML = new URL('../public/index.html', import.meta.url);
const MAX_BODY_CHARS = 10_000;

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  req.setEncoding('utf8');
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY_CHARS) throw new ValidationError('Requisição grande demais');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError('JSON inválido');
  }
}

/**
 * Cria o servidor HTTP sem colocá-lo para escutar.
 * Quem chama decide a porta: server.js usa a 3000; os testes usam uma porta livre.
 */
export function createApp({ store = createTodoStore() } = {}) {
  return createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      const rotaComId = pathname.match(/^\/api\/todos\/(\d+)$/);

      if (req.method === 'GET' && pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(await readFile(INDEX_HTML));
      }

      if (req.method === 'GET' && pathname === '/health') {
        return sendJson(res, 200, { status: 'ok' });
      }

      if (req.method === 'GET' && pathname === '/api/todos') {
        return sendJson(res, 200, store.list());
      }

      if (req.method === 'POST' && pathname === '/api/todos') {
        const body = await readJson(req);
        return sendJson(res, 201, store.add(body?.title));
      }

      if (req.method === 'PATCH' && rotaComId) {
        const todo = store.toggle(Number(rotaComId[1]));
        return todo ? sendJson(res, 200, todo) : sendJson(res, 404, { error: 'Tarefa não encontrada' });
      }

      if (req.method === 'DELETE' && rotaComId) {
        if (!store.remove(Number(rotaComId[1]))) {
          return sendJson(res, 404, { error: 'Tarefa não encontrada' });
        }
        res.writeHead(204);
        return res.end();
      }

      sendJson(res, 404, { error: 'Rota não encontrada' });
    } catch (err) {
      if (err instanceof ValidationError) {
        return sendJson(res, 400, { error: err.message });
      }
      console.error(err);
      sendJson(res, 500, { error: 'Erro interno' });
    }
  });
}
