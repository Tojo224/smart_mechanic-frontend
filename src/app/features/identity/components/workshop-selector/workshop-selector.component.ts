import { Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TallerResponse } from '@core/models/workshops.model';

@Component({
  selector: 'app-workshop-selector',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './workshop-selector.component.html',
  styleUrls: ['./workshop-selector.component.scss']
})
export class WorkshopSelectorComponent {
  /**
   * Lista de talleres a mostrar en el selector.
   * Recibido desde un Smart Component.
   */
  workshops = input<TallerResponse[]>([]);
  
  /**
   * Estado de carga de los talleres.
   */
  isLoading = input<boolean>(false);

  @Output() workshopChanged = new EventEmitter<string | null>();

  onSelectionChange(tallerId: string | null) {
    this.workshopChanged.emit(tallerId);
  }
}
