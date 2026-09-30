// Regras de negócio do ToDo — funções puras, sem HTTP, fáceis de testar.

export const MAX_TITLE_LENGTH = 120;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valida e normaliza o título de uma tarefa.
 *
 * Contrato mínimo (verificado em test/todos.test.js):
 *   - não é string                         → lança ValidationError
 *   - vazio ou só espaços                  → lança ValidationError
 *   - mais que MAX_TITLE_LENGTH caracteres
 *     depois de normalizado                → lança ValidationError
 *   - válido                               → retorna o título normalizado: sem espaços
 *                                            nas pontas e com espaços repetidos reduzidos a um
 *
 * A mensagem do ValidationError aparece na tela do usuário (a API devolve 400 com ela).
 *
 * @param {unknown} title
 * @returns {string} título normalizado
 */
export function validateTitle(title) {
  if (typeof title !== 'string') throw new ValidationError('O título precisa ser um texto.');

  // Normaliza ANTES de medir: "  a   b  " vira "a b". Assim espaço acidental não conta no limite.
  const normalized = title.trim().replace(/\s+/g, ' ');

  //if (normalized === '') throw new ValidationError('Digite um título para a tarefa.');
  if (normalized.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`O título pode ter no máximo ${MAX_TITLE_LENGTH} caracteres.`);
  }
  return normalized;
}

export function createTodoStore() {
  const todos = new Map();
  let nextId = 1;

  return {
    list() {
      return [...todos.values()];
    },

    add(title) {
      // Valida ANTES de gerar o id: se a validação falhar, nenhum id é desperdiçado.
      const normalizedTitle = validateTitle(title);
      const todo = { id: nextId++, title: normalizedTitle, done: false };
      todos.set(todo.id, todo);
      return todo;
    },

    toggle(id) {
      const todo = todos.get(id);
      if (!todo) return null;
      todo.done = !todo.done;
      return todo;
    },

    remove(id) {
      return todos.delete(id);
    },
  };
}
