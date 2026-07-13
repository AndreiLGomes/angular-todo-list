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
