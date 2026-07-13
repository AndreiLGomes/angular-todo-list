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
