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
