# Angular To-Do List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portfolio-quality To-Do List Angular app (add/complete/delete/filter/persist tasks) using Angular 19 Standalone Components and Signals for all state.

**Architecture:** A single `TaskStoreService` holds all state as signals (`tasks`, `filter`) and derives `filteredTasks`/`stats` via `computed()`; an `effect()` syncs `tasks` to `localStorage`. Four small standalone components (`TaskForm`, `TaskFilter`, `TaskList`, `TaskItem`) inject the store directly and render via native `@if`/`@for` control flow. Tailwind CSS handles all styling — no component-level CSS files needed.

**Tech Stack:** Angular 19 (Standalone Components, Signals, native control flow), TypeScript, Tailwind CSS v4, no RxJS/Observables for state, no backend.

## Global Constraints

- Node installed on this machine is v20.18.0 — this caps the Angular CLI version at **19.x** (`^19.2.0`). Do not attempt to install Angular 20/22 without first confirming Node has been upgraded.
- Project root is `C:\Users\ELETROINFO\Desktop\projeto 1` (already a git repo with `docs/superpowers/specs/2026-07-13-angular-todo-list-design.md` committed). Scaffold the Angular app directly into this root (`--directory=.`), do not create a nested subfolder.
- No RxJS/Observables anywhere in state management — global store and local component state both use `signal`/`computed`/`effect` only. No `FormsModule`/`ngModel`.
- Every standalone component uses `changeDetection: ChangeDetectionStrategy.OnPush`. Do not write `standalone: true` explicitly — Angular 19 defaults components to standalone, so omit the flag.
- Use native control flow (`@if`, `@for`) in templates, never `*ngIf`/`*ngFor`.
- Tailwind CSS v4 via the CSS-first setup (`.postcssrc.json` + `@import "tailwindcss";` in `src/styles.css`) — no `tailwind.config.js` needed.
- No automated unit tests are in scope for this project (explicit decision in the spec's "Fora de escopo" section). Verification per task is: `ng build` succeeds with no TypeScript/template errors, plus the described manual check. The one exception: the CLI-generated `app.component.spec.ts` must be trimmed so it doesn't assert on removed default content (see Task 8) — this is scope hygiene, not new test-writing.
- Add a short comment the first time `signal`, `computed`, and `effect` each appear in the code, explaining what that API does (the developer is new to Signals).
- Every code file uses `.html` template files (no inline templates).

---

### Task 1: Scaffold the Angular 19 project with Tailwind CSS v4

**Files:**
- Create: entire Angular CLI scaffold (`angular.json`, `package.json`, `tsconfig*.json`, `src/main.ts`, `src/index.html`, `src/styles.css`, `src/app/app.config.ts`, `src/app/app.component.*`, etc.) at project root
- Create: `.postcssrc.json`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a working `ng build`/`ng serve` Angular 19 standalone app with Tailwind utility classes available in every template written by later tasks

- [ ] **Step 1: Scaffold the Angular workspace**

Run from `C:\Users\ELETROINFO\Desktop\projeto 1`:

```bash
npx @angular/cli@19 new angular-todo-list --directory=. --skip-git --style=css --routing=false --ssr=false
```

Expected: creates `angular.json`, `package.json`, `src/`, etc. in the current directory (it will not touch the existing `docs/` folder or `.git/`). When prompted for AI tooling / analytics, decline (answer `n` / press Enter for defaults).

- [ ] **Step 2: Verify the baseline app builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 3: Install Tailwind CSS v4**

Run:

```bash
npm install tailwindcss @tailwindcss/postcss postcss --save-dev
```

Expected: packages added to `devDependencies` in `package.json`.

- [ ] **Step 4: Configure PostCSS for Tailwind**

Create `.postcssrc.json`:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

- [ ] **Step 5: Import Tailwind in the global stylesheet**

Replace the full contents of `src/styles.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 6: Verify Tailwind is wired into the build**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors, and a `styles-*.css` output file listed (confirms PostCSS/Tailwind processed the stylesheet).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Angular 19 project with Tailwind CSS v4"
```

---

### Task 2: Data models

**Files:**
- Create: `src/app/models/task.model.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Task`, `TaskFilter`, `TaskStats` types, imported by every later task

- [ ] **Step 1: Create the models file**

Create `src/app/models/task.model.ts`:

```typescript
// Uma tarefa individual da lista.
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// Union type para o filtro ativo — mais seguro que uma string solta, o
// compilador acusa erro se algum lugar tentar usar um valor inválido.
export type TaskFilter = 'all' | 'pending' | 'completed';

// Resumo usado pelo contador de tarefas.
export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
}
```

- [ ] **Step 2: Verify the project still builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/task.model.ts
git commit -m "feat: add Task, TaskFilter and TaskStats interfaces"
```

---

### Task 3: TaskStoreService (Signals-based state)

**Files:**
- Create: `src/app/services/task-store.service.ts`

**Interfaces:**
- Consumes: `Task`, `TaskFilter`, `TaskStats` from `src/app/models/task.model.ts` (Task 2)
- Produces: `TaskStoreService` (injectable, `providedIn: 'root'`) with:
  - `activeFilter: Signal<TaskFilter>` (readonly)
  - `filteredTasks: Signal<Task[]>` (computed)
  - `stats: Signal<TaskStats>` (computed)
  - `addTask(title: string): void`
  - `toggleComplete(id: string): void`
  - `deleteTask(id: string): void`
  - `setFilter(filter: TaskFilter): void`

  These exact names/signatures are used by every component task below.

- [ ] **Step 1: Create the store service**

Create `src/app/services/task-store.service.ts`:

```typescript
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
```

- [ ] **Step 2: Verify the project builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/services/task-store.service.ts
git commit -m "feat: add TaskStoreService with signal-based state and localStorage persistence"
```

---

### Task 4: TaskFormComponent

**Files:**
- Create: `src/app/components/task-form/task-form.component.ts`
- Create: `src/app/components/task-form/task-form.component.html`

**Interfaces:**
- Consumes: `TaskStoreService.addTask(title: string): void` (Task 3)
- Produces: `TaskFormComponent`, selector `app-task-form`, used standalone with no inputs/outputs — used by `AppComponent` (Task 8)

- [ ] **Step 1: Create the component class**

Create `src/app/components/task-form/task-form.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TaskStoreService } from '../../services/task-store.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  private readonly store = inject(TaskStoreService);

  // Estado local do campo de texto. Sem FormsModule/ngModel: um signal
  // simples já resolve o binding de forma reativa.
  readonly title = signal('');

  updateTitle(value: string): void {
    this.title.set(value);
  }

  submit(): void {
    this.store.addTask(this.title());
    this.title.set('');
  }
}
```

- [ ] **Step 2: Create the template**

Create `src/app/components/task-form/task-form.component.html`:

```html
<form class="flex gap-2" (submit)="submit(); $event.preventDefault()">
  <input
    type="text"
    [value]="title()"
    (input)="updateTitle($any($event.target).value)"
    placeholder="Adicionar nova tarefa..."
    aria-label="Nova tarefa"
    class="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
  />
  <button
    type="submit"
    class="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-700"
  >
    Adicionar
  </button>
</form>
```

- [ ] **Step 3: Verify the project builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors (the component is not used anywhere yet, so this only checks it type-checks and compiles in isolation — that's expected until Task 8 wires it in).

- [ ] **Step 4: Commit**

```bash
git add src/app/components/task-form
git commit -m "feat: add TaskFormComponent"
```

---

### Task 5: TaskFilterComponent

**Files:**
- Create: `src/app/components/task-filter/task-filter.component.ts`
- Create: `src/app/components/task-filter/task-filter.component.html`

**Interfaces:**
- Consumes: `TaskStoreService.activeFilter: Signal<TaskFilter>`, `TaskStoreService.setFilter(filter: TaskFilter): void` (Task 3); `TaskFilter` type (Task 2)
- Produces: `TaskFilterComponent`, selector `app-task-filter`, no inputs/outputs — used by `AppComponent` (Task 8)

- [ ] **Step 1: Create the component class**

Create `src/app/components/task-filter/task-filter.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskFilter } from '../../models/task.model';
import { TaskStoreService } from '../../services/task-store.service';

@Component({
  selector: 'app-task-filter',
  templateUrl: './task-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterComponent {
  readonly store = inject(TaskStoreService);

  readonly filters: { value: TaskFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'completed', label: 'Concluídas' },
  ];

  select(filter: TaskFilter): void {
    this.store.setFilter(filter);
  }
}
```

- [ ] **Step 2: Create the template**

Create `src/app/components/task-filter/task-filter.component.html`:

```html
<div class="flex flex-wrap gap-2">
  @for (filter of filters; track filter.value) {
    <button
      type="button"
      (click)="select(filter.value)"
      [class.bg-indigo-600]="store.activeFilter() === filter.value"
      [class.text-white]="store.activeFilter() === filter.value"
      [class.bg-slate-100]="store.activeFilter() !== filter.value"
      [class.text-slate-600]="store.activeFilter() !== filter.value"
      class="rounded-full px-4 py-1.5 text-sm font-medium transition hover:opacity-90"
    >
      {{ filter.label }}
    </button>
  }
</div>
```

- [ ] **Step 3: Verify the project builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/task-filter
git commit -m "feat: add TaskFilterComponent"
```

---

### Task 6: TaskItemComponent

**Files:**
- Create: `src/app/components/task-item/task-item.component.ts`
- Create: `src/app/components/task-item/task-item.component.html`

**Interfaces:**
- Consumes: `Task` (Task 2); `TaskStoreService.toggleComplete(id: string): void`, `TaskStoreService.deleteTask(id: string): void` (Task 3)
- Produces: `TaskItemComponent`, selector `app-task-item`, required input `task: Task` (signal input) — used by `TaskListComponent` (Task 7)

- [ ] **Step 1: Create the component class**

Create `src/app/components/task-item/task-item.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Task } from '../../models/task.model';
import { TaskStoreService } from '../../services/task-store.service';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItemComponent {
  private readonly store = inject(TaskStoreService);

  // `input.required<Task>()` é a API de *signal inputs*: substitui o
  // `@Input() task!: Task` clássico. O valor chega como um signal
  // (`task()`), então o Angular sabe exatamente quando ele muda.
  readonly task = input.required<Task>();

  toggleComplete(): void {
    this.store.toggleComplete(this.task().id);
  }

  remove(): void {
    this.store.deleteTask(this.task().id);
  }
}
```

- [ ] **Step 2: Create the template**

Create `src/app/components/task-item/task-item.component.html`:

```html
<li class="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
  <input
    type="checkbox"
    [checked]="task().completed"
    (change)="toggleComplete()"
    [attr.aria-label]="'Marcar ' + task().title + ' como concluída'"
    class="h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
  />
  <span
    class="flex-1 text-slate-800"
    [class.line-through]="task().completed"
    [class.text-slate-400]="task().completed"
  >
    {{ task().title }}
  </span>
  <button
    type="button"
    (click)="remove()"
    [attr.aria-label]="'Excluir ' + task().title"
    class="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
  </button>
</li>
```

- [ ] **Step 3: Verify the project builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/task-item
git commit -m "feat: add TaskItemComponent"
```

---

### Task 7: TaskListComponent

**Files:**
- Create: `src/app/components/task-list/task-list.component.ts`
- Create: `src/app/components/task-list/task-list.component.html`

**Interfaces:**
- Consumes: `TaskStoreService.filteredTasks: Signal<Task[]>` (Task 3); `TaskItemComponent` selector `app-task-item` with input `task` (Task 6)
- Produces: `TaskListComponent`, selector `app-task-list`, no inputs/outputs — used by `AppComponent` (Task 8)

- [ ] **Step 1: Create the component class**

Create `src/app/components/task-list/task-list.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskStoreService } from '../../services/task-store.service';
import { TaskItemComponent } from '../task-item/task-item.component';

@Component({
  selector: 'app-task-list',
  imports: [TaskItemComponent],
  templateUrl: './task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  readonly store = inject(TaskStoreService);
}
```

- [ ] **Step 2: Create the template**

Create `src/app/components/task-list/task-list.component.html`:

```html
@if (store.filteredTasks().length > 0) {
  <ul class="divide-y divide-slate-100">
    @for (task of store.filteredTasks(); track task.id) {
      <app-task-item [task]="task" />
    }
  </ul>
} @else {
  <div class="flex flex-col items-center gap-2 py-10 text-slate-400">
    <span class="text-4xl">📭</span>
    <p>Nenhuma tarefa por aqui!</p>
  </div>
}
```

- [ ] **Step 3: Verify the project builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/task-list
git commit -m "feat: add TaskListComponent with empty state"
```

---

### Task 8: Wire everything into AppComponent (layout, counter, empty-state polish)

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.spec.ts`

**Interfaces:**
- Consumes: `TaskFormComponent` (Task 4), `TaskFilterComponent` (Task 5), `TaskListComponent` (Task 7), `TaskStoreService.stats: Signal<TaskStats>` (Task 3)
- Produces: the complete running app

- [ ] **Step 1: Update the root component class**

Replace the contents of `src/app/app.component.ts` with:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskStoreService } from './services/task-store.service';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskFilterComponent } from './components/task-filter/task-filter.component';
import { TaskListComponent } from './components/task-list/task-list.component';

@Component({
  selector: 'app-root',
  imports: [TaskFormComponent, TaskFilterComponent, TaskListComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly store = inject(TaskStoreService);
}
```

- [ ] **Step 2: Update the root template**

Replace the full contents of `src/app/app.component.html` with:

```html
<main class="flex min-h-screen items-start justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 py-10 sm:py-16">
  <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg sm:p-8">
    <h1 class="mb-6 text-2xl font-bold text-slate-800">Minhas Tarefas</h1>

    <app-task-form class="mb-6 block" />
    <app-task-filter class="mb-6 block" />
    <app-task-list />

    <p class="mt-6 text-sm text-slate-500">
      @if (store.stats().pending === 1) {
        1 tarefa pendente
      } @else {
        {{ store.stats().pending }} tarefas pendentes
      }
    </p>
  </div>
</main>
```

- [ ] **Step 3: Trim the default spec file**

The Angular CLI generated `src/app/app.component.spec.ts` with assertions tied to the default scaffold template (a `title` property and "Hello, angular-todo-list" text) that no longer exist. Replace its contents with just the creation smoke test so it doesn't false-fail:

```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

- [ ] **Step 4: Verify the project builds**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 5: Manual smoke test in the browser**

Run: `npx ng serve`
Open `http://localhost:4200` and verify:
- Empty state shows "Nenhuma tarefa por aqui!" on first load (fresh browser profile / cleared localStorage)
- Typing a task and pressing Enter (or clicking "Adicionar") adds it to the list, input clears
- Typing only spaces and submitting does NOT add a task
- Clicking the checkbox strikes through the task text and turns it gray
- Clicking the trash icon removes the task immediately
- Clicking "Pendentes" / "Concluídas" / "Todas" filters the visible list instantly, no page reload
- The footer text shows the correct singular/plural ("1 tarefa pendente" vs "N tarefas pendentes")
- Reloading the page keeps the same tasks (localStorage persistence)

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 6: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.html src/app/app.component.spec.ts
git commit -m "feat: wire TaskForm, TaskFilter and TaskList into AppComponent"
```

---

### Task 9: README.md

**Files:**
- Modify: `README.md` (overwrite the Angular CLI default)

**Interfaces:**
- Consumes: nothing (documentation only)
- Produces: the portfolio-facing README

- [ ] **Step 1: Write the README**

Replace the full contents of `README.md` with:

```markdown
# Angular To-Do List

Uma lista de tarefas (To-Do List) construída em Angular, usada como projeto
de portfólio para demonstrar as abordagens mais modernas do framework:
Standalone Components e Signals.

## Funcionalidades

- Adicionar tarefas (texto vazio é bloqueado)
- Marcar tarefas como concluídas (estilo riscado/apagado)
- Remover tarefas
- Filtrar por Todas / Pendentes / Concluídas, em tempo real
- Persistência automática no `localStorage` do navegador
- Contador de tarefas pendentes
- Estado vazio tratado ("Nenhuma tarefa por aqui!")

## Tecnologias

- [Angular 19](https://angular.dev/) — Standalone Components (sem NgModules)
- [Signals](https://angular.dev/guide/signals) — `signal`, `computed` e
  `effect` usados para todo o gerenciamento de estado, sem RxJS/Observables
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)

## Como rodar localmente

Pré-requisitos: Node.js 20.11+ (ou 18.19+/22+) e npm.

```bash
npm install
npm start
```

Acesse `http://localhost:4200` no navegador.

## Build de produção

```bash
npm run build
```

Gera os arquivos estáticos em `dist/angular-todo-list/browser`, prontos
para deploy em qualquer serviço de hospedagem estática (Vercel, Netlify,
GitHub Pages) — o projeto não depende de nenhum backend próprio.

## Screenshot

<!-- Adicione aqui um screenshot ou GIF do app rodando, por exemplo: -->
<!-- ![Screenshot da aplicação](docs/screenshot.png) -->
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: write project README"
```

---

### Task 10: Final end-to-end verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: the complete app from Tasks 1–9
- Produces: confirmation the delivered app matches every functional requirement in the spec

- [ ] **Step 1: Production build check**

Run: `npx ng build`
Expected: `Application bundle generation complete.` with no errors or warnings about unused imports/components.

- [ ] **Step 2: Full manual regression pass**

Run: `npx ng serve`, open `http://localhost:4200`, and re-run the full checklist from Task 8 Step 5, plus:
- Resize the browser window to a mobile width (~375px) and confirm the layout stays usable (card doesn't overflow, buttons remain tappable, filter buttons wrap instead of overflowing)
- Add several tasks, mark some complete, delete one, switch between all three filters, reload the page, and confirm the remaining tasks and their completed state survive the reload correctly

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 3: Commit (if any fixes were needed)**

If Step 2 revealed any issue, fix it, re-run Steps 1–2, then:

```bash
git add -A
git commit -m "fix: address issues found in end-to-end verification"
```

If no issues were found, skip this step — nothing to commit.
