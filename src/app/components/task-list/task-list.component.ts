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
