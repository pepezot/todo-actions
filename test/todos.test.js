import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTodoStore, MAX_TITLE_LENGTH, validateTitle, ValidationError } from '../src/todos.js';

describe('validateTitle', () => {
  it('remove espaços nas pontas', () => {
    assert.equal(validateTitle('  Estudar GitHub Actions  '), 'Estudar GitHub Actions');
  });

  it('reduz espaços repetidos no meio a um só', () => {
    assert.equal(validateTitle('Comprar    pão \t e  leite'), 'Comprar pão e leite');
  });

  it('rejeita título vazio ou só com espaços', () => {
    assert.throws(() => validateTitle(''), ValidationError);
    assert.throws(() => validateTitle('   '), ValidationError);
  });

  it('rejeita valores que não são texto', () => {
    for (const invalido of [undefined, null, 42, {}, ['tarefa']]) {
      assert.throws(() => validateTitle(invalido), ValidationError, `deveria rejeitar ${JSON.stringify(invalido)}`);
    }
  });

  it(`aceita até ${MAX_TITLE_LENGTH} caracteres e rejeita acima disso`, () => {
    assert.equal(validateTitle('a'.repeat(MAX_TITLE_LENGTH)).length, MAX_TITLE_LENGTH);
    assert.throws(() => validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1)), ValidationError);
  });
});

describe('createTodoStore', () => {
  it('começa vazio', () => {
    assert.deepEqual(createTodoStore().list(), []);
  });

  it('adiciona tarefas com id sequencial e done=false', () => {
    const store = createTodoStore();
    assert.deepEqual(store.add('Primeira'), { id: 1, title: 'Primeira', done: false });
    assert.equal(store.add('Segunda').id, 2);
    assert.equal(store.list().length, 2);
  });

  it('toggle alterna o status da tarefa', () => {
    const store = createTodoStore();
    const { id } = store.add('Alternar');
    assert.equal(store.toggle(id).done, true);
    assert.equal(store.toggle(id).done, false);
  });

  it('toggle de id inexistente retorna null', () => {
    assert.equal(createTodoStore().toggle(42), null);
  });

  it('remove apaga a tarefa e informa se ela existia', () => {
    const store = createTodoStore();
    const { id } = store.add('Remover');
    assert.equal(store.remove(id), true);
    assert.equal(store.remove(id), false);
    assert.deepEqual(store.list(), []);
  });
});
