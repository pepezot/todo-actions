import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

describe('API HTTP', () => {
  let server;
  let baseUrl;

  // Porta 0 = o sistema operacional escolhe uma porta livre.
  // Assim o teste nunca conflita com um `npm start` rodando na 3000.
  before(async () => {
    server = createApp();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const request = (method, path, body) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  const criarTarefa = async (title) => (await request('POST', '/api/todos', { title })).json();

  it('GET /health responde ok', async () => {
    const res = await request('GET', '/health');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });

  it('GET / entrega a página HTML', async () => {
    const res = await request('GET', '/');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /<title>/);
  });

  it('POST /api/todos cria uma tarefa', async () => {
    const res = await request('POST', '/api/todos', { title: 'Comprar café' });
    assert.equal(res.status, 201);
    const todo = await res.json();
    assert.equal(todo.title, 'Comprar café');
    assert.equal(todo.done, false);
    assert.equal(typeof todo.id, 'number');
  });

  it('POST /api/todos com título vazio responde 400 com mensagem', async () => {
    const res = await request('POST', '/api/todos', { title: '   ' });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).error, 'a resposta deve explicar o erro');
  });

  it('POST /api/todos com JSON inválido responde 400', async () => {
    const res = await fetch(`${baseUrl}/api/todos`, { method: 'POST', body: '{ isto não é json' });
    assert.equal(res.status, 400);
  });

  it('GET /api/todos lista as tarefas criadas', async () => {
    await criarTarefa('Estudar YAML');
    const res = await request('GET', '/api/todos');
    assert.equal(res.status, 200);
    assert.ok((await res.json()).some((todo) => todo.title === 'Estudar YAML'));
  });

  it('PATCH /api/todos/:id alterna a conclusão', async () => {
    const { id } = await criarTarefa('Revisar slides');
    const res = await request('PATCH', `/api/todos/${id}`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).done, true);
  });

  it('DELETE /api/todos/:id remove a tarefa', async () => {
    const { id } = await criarTarefa('Tarefa descartável');
    assert.equal((await request('DELETE', `/api/todos/${id}`)).status, 204);
    assert.equal((await request('DELETE', `/api/todos/${id}`)).status, 404);
  });

  it('PATCH em tarefa inexistente responde 404', async () => {
    const res = await request('PATCH', '/api/todos/9999');
    assert.equal(res.status, 404);
  });

  it('rota desconhecida responde 404', async () => {
    const res = await request('GET', '/nao-existe');
    assert.equal(res.status, 404);
  });
});
