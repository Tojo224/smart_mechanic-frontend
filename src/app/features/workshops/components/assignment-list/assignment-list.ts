import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { IncidentResponse } from '@core/models/workshops.model';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatChipsModule],
  templateUrl: './assignment-list.html',
  styleUrls: ['./assignment-list.scss']
})
export class AssignmentList {
  @Input() assignments: IncidentResponse[] = [];
  @Output() viewDetail = new EventEmitter<string>();
  @Output() updateStatus = new EventEmitter<IncidentResponse>();

  displayedColumns: string[] = ['id', 'descripcion', 'prioridad', 'estado', 'acciones'];

  getPriorityColor(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'CRITICA': return 'warn';
      case 'ALTA': return 'accent';
      case 'MEDIA': return 'primary';
      default: return '';
    }
  }
}
