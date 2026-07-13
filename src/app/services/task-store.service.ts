import { Injectable, computed, effect, signal } from '@angular/core';
import { Task, TaskFilter, TaskStats } from '../models/task.model';

const STORAGE_KEY = 'angular-todo-list.tasks';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  // `signal()` cria uma fonte de estado reativa e mutável. Qualquer lugar
  // que leia `tasks()` (direto ou via `computed`) passa a depender dele:
  // quando o valor muda, quem depende é notificado e atualizado sozinho,
  // sem precisar de Observables/subscribes manuais.
  private readonly tasks = signal<Task[]>(this.loadFromStorage());

  // Outro signal, independente, guarda só o filtro ativo.
  private readonly filter = signal<TaskFilter>('all');

  // Exposto só para leitura: os componentes não devem alterar o filtro
  // diretamente, só através do método `setFilter`.
  readonly activeFilter = this.filter.asReadonly();

  // `computed()` deriva um valor novo a partir de outros signals. Só
  // recalcula quando `tasks` ou `filter` realmente mudam, e qualquer
  // template que leia `filteredTasks()` é atualizado automaticamente.
  readonly filteredTasks = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();
    if (filter === 'pending') {
      return tasks.filter((task) => !task.completed);
    }
    if (filter === 'completed') {
      return tasks.filter((task) => task.completed);
    }
    return tasks;
  });

  readonly stats = computed<TaskStats>(() => {
    const tasks = this.tasks();
    const completed = tasks.filter((task) => task.completed).length;
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
    };
  });

  constructor() {
    // `effect()` roda automaticamente sempre que um signal lido dentro dele
    // muda. Aqui isso mantém o localStorage sempre sincronizado com a lista
    // de tarefas, sem precisar chamar "salvar" manualmente em cada método
    // que altera o estado.
    effect(() => {
      this.saveToStorage(this.tasks());
    });
  }

  addTask(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      completed: false,
      createdAt: new Date(),
    };
    this.tasks.update((tasks) => [...tasks, newTask]);
  }

  toggleComplete(id: string): void {
    this.tasks.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  }

  deleteTask(id: string): void {
    this.tasks.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  setFilter(filter: TaskFilter): void {
    this.filter.set(filter);
  }

  private loadFromStorage(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as Task[];
      return parsed.map((task) => ({
        ...task,
        createdAt: new Date(task.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private saveToStorage(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}
