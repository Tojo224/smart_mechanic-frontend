import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LucideAngularModule, Building2, Mail, Phone, MapPin, ShieldAlert, Search, Filter, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-workshop-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSlideToggleModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSnackBarModule,
    LucideAngularModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>
            <lucide-icon [img]="workshopIcon" [size]="26"></lucide-icon>
            Gestión de Talleres
          </h1>
          <p>Administra la red de talleres mecánicos afiliados a la plataforma.</p>
        </div>
        <button mat-stroked-button class="refresh-btn" (click)="workshopsQuery.refetch()">
          <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
          Actualizar
        </button>
      </header>

      <!-- Filtros -->
      <div class="filters-bar sm-glass-card">
        <div class="filter-title">
          <lucide-icon [img]="filterIcon" [size]="14"></lucide-icon>
          <span>Filtros</span>
        </div>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar por nombre</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onFilterChange()" placeholder="Nombre del taller o NIT..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field filter-sm">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="filterEstado" (ngModelChange)="onFilterChange()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="activo">Activos</mat-option>
            <mat-option value="suspendido">Suspendidos</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-button class="clear-btn" (click)="clearFilters()">Limpiar</button>
      </div>

      @if (workshopsQuery.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando red de talleres...</p>
        </div>
      } @else if (workshopsQuery.isError()) {
        <div class="error-state sm-glass-card">❌ Error al cargar los talleres.</div>
      } @else {
        <mat-card class="table-card sm-glass-card">
          <div class="table-header">
            <lucide-icon [img]="workshopIcon" [size]="18"></lucide-icon>
            <span>Talleres Registrados</span>
            <span class="count-badge">{{ filteredWorkshops().length }}</span>
          </div>

          <table mat-table [dataSource]="pagedWorkshops()" class="modern-table">
            
            <!-- Taller -->
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Taller</th>
              <td mat-cell *matCellDef="let w">
                <div class="workshop-info">
                  <div class="icon-box">
                    <lucide-icon [img]="workshopIcon" [size]="18"></lucide-icon>
                  </div>
                  <div>
                    <div class="name">{{ w.nombre }}</div>
                    <div class="nit">NIT: {{ w.nit }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Contacto -->
            <ng-container matColumnDef="contacto">
              <th mat-header-cell *matHeaderCellDef>Contacto</th>
              <td mat-cell *matCellDef="let w">
                <div class="contact-item">
                  <lucide-icon [img]="mailIcon" [size]="13"></lucide-icon>
                  <span>{{ w.email || 'Sin correo' }}</span>
                </div>
                <div class="contact-item">
                  <lucide-icon [img]="phoneIcon" [size]="13"></lucide-icon>
                  <span>{{ w.telefono || 'Sin teléfono' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Ubicación -->
            <ng-container matColumnDef="ubicacion">
              <th mat-header-cell *matHeaderCellDef>Ubicación</th>
              <td mat-cell *matCellDef="let w">
                <div class="location-item">
                  <lucide-icon [img]="mapIcon" [size]="13"></lucide-icon>
                  <span class="address" [title]="w.direccion">{{ w.direccion || 'Sin dirección' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado Operativo</th>
              <td mat-cell *matCellDef="let w">
                <div class="status-action">
                  <span class="status-tag" [class.active]="w.is_active">
                    {{ w.is_active ? 'ACTIVO' : 'SUSPENDIDO' }}
                  </span>
                  <mat-slide-toggle 
                    [checked]="w.is_active"
                    (change)="toggleStatus(w.id_taller)"
                    color="primary"
                    [disabled]="statusMutation.isPending()"
                  ></mat-slide-toggle>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (filteredWorkshops().length === 0) {
            <div class="empty-state">
              <lucide-icon [img]="alertIcon" [size]="40"></lucide-icon>
              <p>No se encontraron talleres con los filtros aplicados.</p>
            </div>
          }

          <mat-paginator
            [length]="filteredWorkshops().length"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[5, 10, 25]"
            (page)="onPageChange($event)"
            aria-label="Seleccionar página">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { 
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; 
      h1 { margin: 0; font-size: 1.7rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; color: var(--sm-color-text-title); } 
      p { margin: 0.4rem 0 0; color: var(--sm-color-text-soft); font-size: 0.9rem; } 
    }

    .refresh-btn { display: flex; align-items: center; gap: 0.5rem; border-color: rgba(var(--sm-rgb-sapphire-400), 0.3); color: var(--sm-color-sapphire-400); }

    /* Filtros */
    .filters-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
    .filter-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--sm-color-sapphire-400); text-transform: uppercase; white-space: nowrap; }
    .filter-field { flex: 1; min-width: 200px; }
    .filter-sm { max-width: 160px; }
    .clear-btn { color: var(--sm-color-text-muted); font-size: 0.8rem; white-space: nowrap; }

    /* Tabla */
    .table-card { border: none; overflow: hidden; padding: 0; }
    .table-header { 
      display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--sm-color-sapphire-400); font-size: 0.85rem; font-weight: 600;
      .count-badge { margin-left: auto; background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-300); padding: 0.15rem 0.6rem; border-radius: 20px; font-size: 0.75rem; }
    }

    .modern-table {
      width: 100%; background: transparent;
      th { color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); transition: background 0.15s; }

    .workshop-info {
      display: flex; align-items: center; gap: 0.75rem;
      .icon-box { background: rgba(var(--sm-rgb-sapphire-400), 0.1); color: var(--sm-color-sapphire-400); padding: 0.5rem; border-radius: 8px; }
      .name { font-weight: 600; color: var(--sm-color-text-main); font-size: 0.9rem; }
      .nit { font-size: 0.7rem; color: var(--sm-color-text-muted); margin-top: 0.1rem; }
    }

    .contact-item, .location-item {
      display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--sm-color-text-soft); margin-bottom: 0.3rem;
      lucide-icon { opacity: 0.6; }
    }

    .address { max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

    .status-action {
      display: flex; align-items: center; gap: 1rem;
      .status-tag {
        font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px; background: rgba(231, 76, 60, 0.12); color: #e74c3c;
        &.active { background: rgba(46, 204, 113, 0.12); color: #2ecc71; }
      }
    }

    .loading-state { padding: 6rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--sm-color-text-soft); }
    .error-state { padding: 2rem; text-align: center; color: #e74c3c; }
    .empty-state { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--sm-color-text-muted); }

    mat-paginator { background: transparent; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(var(--sm-rgb-sapphire-400), 0.2); border-top: 3px solid var(--sm-color-sapphire-400); border-radius: 50%; animation: spin 0.8s linear infinite; }
  `]
})
export class WorkshopManagementPage {
  private workshopsService = inject(WorkshopsService);
  private queryClient = injectQueryClient();
  private snackBar = inject(MatSnackBar);

  readonly workshopIcon = Building2;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapIcon = MapPin;
  readonly alertIcon = ShieldAlert;
  readonly filterIcon = Filter;
  readonly refreshIcon = RefreshCw;

  displayedColumns = ['nombre', 'contacto', 'ubicacion', 'estado'];

  // Estado de filtros y paginación
  searchQuery = '';
  filterEstado = '';
  pageSize = 10;
  pageIndex = 0;

  workshopsQuery = injectQuery(() => ({
    queryKey: ['admin-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops())
  }));

  // Filtrado reactivo
  filteredWorkshops = computed(() => {
    let data = this.workshopsQuery.data() || [];
    
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(w => 
        w.nombre.toLowerCase().includes(q) || 
        w.nit.toLowerCase().includes(q)
      );
    }

    if (this.filterEstado === 'activo') {
      data = data.filter(w => w.is_active);
    } else if (this.filterEstado === 'suspendido') {
      data = data.filter(w => !w.is_active);
    }

    return data;
  });

  // Paginación reactiva
  pagedWorkshops = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.filteredWorkshops().slice(start, start + this.pageSize);
  });

  statusMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.workshopsService.toggleWorkshopStatus(id)),
    onSuccess: (updated) => {
      this.snackBar.open(
        `Taller ${updated.nombre} ${updated.is_active ? 'activado' : 'suspendido'}`, 
        'Cerrar', 
        { duration: 3000 }
      );
      this.queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
    },
    onError: () => {
      this.snackBar.open('❌ Error al cambiar el estado del taller', 'Cerrar', { duration: 4000 });
    }
  }));

  onFilterChange() {
    this.pageIndex = 0; // Resetear a la primera página al filtrar
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterEstado = '';
    this.pageIndex = 0;
  }

  toggleStatus(id: string) {
    this.statusMutation.mutate(id);
  }
}
