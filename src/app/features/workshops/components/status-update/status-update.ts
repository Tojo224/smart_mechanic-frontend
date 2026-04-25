import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { StatusUpdate } from '@core/models/workshops.model';

@Component({
  selector: 'app-status-update',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './status-update.html',
  styleUrls: ['./status-update.scss']
})
export class StatusUpdateComponent {
  readonly currentStatus = input<string>('');
  readonly statusChanged = output<StatusUpdate>();

  states = [
    { value: 'EN_CAMINO', label: 'En Camino', icon: 'directions_car' },
    { value: 'EN_PROGRESO', label: 'En Progreso', icon: 'build' },
    { value: 'COMPLETADO', label: 'Completado', icon: 'check_circle' }
  ];

  onStatusSelect(state: string) {
    this.statusChanged.emit({ nuevo_estado: state });
  }
}
