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
