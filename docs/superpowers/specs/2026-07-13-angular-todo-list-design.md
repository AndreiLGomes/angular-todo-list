# Angular To-Do List — Design

## Objetivo

Projeto de portfólio: uma To-Do List em Angular 19 usando Standalone Components e
Signals, para demonstrar domínio das abordagens modernas do framework a
recrutadores. Sem backend — deploy estático (Vercel/Netlify/GitHub Pages).

## Contexto do usuário

Desenvolvedor front-end com experiência em Angular baseado em NgModules,
sem experiência prévia com Signals. O código deve ter comentários explicando
o papel de `signal`, `computed` e `effect` na primeira vez que aparecem.

## Restrição de ambiente

Node instalado: v20.18.0. Angular CLI 20/22 exigem Node ^20.19/^22.12+, que
esta máquina não atende. **Decisão: usar Angular 19** (Angular CLI ^19.2,
compatível com Node ^20.11.1), que já tem Standalone Components, Signals e
control flow moderno (`@if`/`@for`) maduros.

## Stack

- Angular 19, Standalone Components (sem NgModules), `bootstrapApplication`.
- Tailwind CSS para estilos.
- TypeScript com tipagem adequada (interfaces dedicadas, sem `any`).
- Sem RxJS/Observables para estado — nem no store, nem no formulário (input
  do formulário usa um signal local em vez de `FormsModule`/`ngModel`).

## Gerenciamento de estado (Signals)

Um único `TaskStoreService` (`providedIn: 'root'`) concentra o estado:

- `signal<Task[]>` — lista de tarefas.
- `signal<TaskFilter>` — filtro ativo (`'all' | 'pending' | 'completed'`).
- `computed()` — `filteredTasks` (lista já filtrada, para os componentes de
  exibição) e `stats` (`TaskStats` para o contador).
- `effect()` — observa o signal de tarefas e persiste no `localStorage` a
  cada mudança. Na construção do serviço, o estado inicial é lido do
  `localStorage` (fallback: lista vazia).

Cada uma dessas três APIs (`signal`, `computed`, `effect`) recebe um
comentário curto explicando seu papel na primeira ocorrência no código.

## Modelo de dados

```typescript
// src/app/models/task.model.ts

interface Task {
  id: string;          // gerado com crypto.randomUUID()
  title: string;
  completed: boolean;
  createdAt: Date;
}

type TaskFilter = 'all' | 'pending' | 'completed';

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
}
```

## Componentes e comunicação

```
AppComponent (raiz)
├── TaskFormComponent      → formulário para adicionar tarefa
├── TaskFilterComponent    → botões "Todas / Pendentes / Concluídas"
├── TaskListComponent      → renderiza a lista (ou estado vazio)
│   └── TaskItemComponent  → um item (checkbox + texto + excluir)
```

Padrão: componentes que precisam do estado global injetam
`TaskStoreService` diretamente (`inject()`) e chamam seus métodos
(`addTask()`, `toggleComplete(id)`, `deleteTask(id)`, `setFilter(f)`) ou leem
seus `computed signals`. Não há prop-drilling via `@Input`/`@Output` para o
estado global.

`TaskItemComponent` recebe a `task` individual via *signal input*
(`input<Task>()`) para permanecer simples e reutilizável.

Contador de tarefas pendentes é exibido no próprio `AppComponent`, lendo
`store.stats().pending`.

## Comportamento funcional

- **Adicionar**: input de texto + botão/Enter. Bloqueado se o texto (trim)
  estiver vazio.
- **Concluir**: checkbox por item. Item concluído recebe texto riscado e
  cor apagada.
- **Remover**: ícone de lixeira remove direto ao clicar (sem modal).
- **Filtros**: "Todas" / "Pendentes" / "Concluídas", atualizando a lista
  exibida em tempo real via `computed signal` (sem reload).
- **Persistência**: tarefas salvas no `localStorage`; filtro ativo NÃO é
  persistido (sempre inicia em "Todas" ao recarregar — simplicidade
  deliberada).
- **Contador**: "N tarefas pendentes" (com singular/plural correto).
- **Estado vazio**: mensagem "Nenhuma tarefa por aqui!" quando a lista
  filtrada estiver vazia.

## Visual

- Container central (max-width ~600px), cartão branco com sombra suave
  sobre fundo com gradiente sutil azul/violeta.
- Hierarquia: título → formulário → filtros → lista → contador.
- Responsivo (mobile-first) via Tailwind.
- Tema único (sem dark mode).

## Estrutura de pastas

```
src/app/
├── models/
│   └── task.model.ts
├── services/
│   └── task-store.service.ts
├── components/
│   ├── task-form/
│   ├── task-filter/
│   ├── task-list/
│   └── task-item/
├── app.component.ts (+ .html, .css)
└── app.config.ts
```

Cada componente com arquivos `.ts` + `.html` separados (sem inline
templates).

## Entregáveis

- Código-fonte completo e funcional.
- `README.md`: descrição, stack, como rodar localmente (`npm install`,
  `ng serve`), como gerar build (`ng build`), nota indicando onde adicionar
  screenshot/GIF (o usuário adiciona depois de rodar localmente).
- Projeto 100% estático, pronto para deploy em Vercel/Netlify/GitHub Pages.

## Fora de escopo

- Edição de tarefa existente.
- Dark mode.
- Testes unitários automatizados (specs padrão do Angular CLI ficam como
  gerados, sem esforço extra).
- Drag-and-drop para reordenar tarefas.
