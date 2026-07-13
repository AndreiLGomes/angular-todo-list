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
