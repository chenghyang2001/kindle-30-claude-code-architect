// 記憶體內的待辦儲存區；每個 app 實例各自一份，讓測試彼此隔離
export interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export class TodoStore {
  private todos = new Map<number, Todo>();
  private nextId = 1;

  list(): Todo[] {
    return [...this.todos.values()];
  }

  get(id: number): Todo | undefined {
    return this.todos.get(id);
  }

  create(title: string): Todo {
    const todo: Todo = {
      id: this.nextId++,
      title,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  update(
    id: number,
    changes: { title?: string; done?: boolean },
  ): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) return undefined;
    if (changes.title !== undefined) todo.title = changes.title;
    if (changes.done !== undefined) todo.done = changes.done;
    return todo;
  }

  remove(id: number): boolean {
    return this.todos.delete(id);
  }
}
