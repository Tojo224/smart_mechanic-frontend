import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-workshop-selector',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="selector-field">
      <mat-label>Filtrar por Taller</mat-label>
      <mat-select (selectionChange)="onSelectionChange($event.value)">
        <mat-option [value]="null">Todos los talleres (Global)</mat-option>
        @for (workshop of workshopsQuery.data(); track workshop.id_taller) {
          <mat-option [value]="workshop.id_taller">
            {{ workshop.nombre }} ({{ workshop.nit }})
          </mat-option>
        }
      </mat-select>
      @if (workshopsQuery.isLoading()) {
        <mat-hint>Cargando talleres...</mat-hint>
      }
    </mat-form-field>
  `,
  styles: [`
    .selector-field {
      width: 100%;
      max-width: 400px;
    }
  `]
})
export class WorkshopSelectorComponent {
  private workshopsService = inject(WorkshopsService);
  @Output() workshopChanged = new EventEmitter<string | null>();

  workshopsQuery = injectQuery(() => ({
    queryKey: ['all-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops())
  }));

  onSelectionChange(tallerId: string | null) {
    this.workshopChanged.emit(tallerId);
  }
}
