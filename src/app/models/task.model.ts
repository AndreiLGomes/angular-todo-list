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
