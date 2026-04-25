import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { StatusUpdate } from '@core/models/workshops.model';

@Component({
  selector: 'app-status-update',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './status-update.html',
  styleUrls: ['./status-update.scss']
})
export class StatusUpdateComponent {
  @Input() currentStatus: string = '';
  @Output() statusChanged = new EventEmitter<StatusUpdate>();

  states = [
    { value: 'EN_CAMINO', label: 'En Camino', icon: 'directions_car' },
    { value: 'EN_PROGRESO', label: 'En Progreso', icon: 'build' },
    { value: 'COMPLETADO', label: 'Completado', icon: 'check_circle' }
  ];

  onStatusSelect(state: string) {
    this.statusChanged.emit({ nuevo_estado: state });
  }
}
