import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../../data-access/monitoring.service';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, History, Search, Filter, RefreshCw } from 'lucide-angular';
import { IncidentDetailResponse } from '@core/models/emergencies.model';
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent } from '@shared/ui';

@Component({
  selector: 'app-global-history',
  standalone: true,
  providers: [DatePipe],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        [title]="pageTitle()"
        [subtitle]="pageSubtitle()"
        [icon]="historyIcon">
        <div actions>
          <button mat-stroked-button class="refresh-btn" (click)="historyQuery.refetch()">
            <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
            Actualizar
          </button>
        </div>
      </app-page-header>

      <!-- Filtros -->
      <div class="filters-bar sm-glass-card">
        <div class="filter-title">
          <lucide-icon [img]="filterIcon" [size]="15"></lucide-icon>
          <span>Filtros</span>
        </div>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar por ID</mat-label>
          <input matInput [(ngModel)]="searchId" (ngModelChange)="onFilterChange()" placeholder="ID del incidente..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field filter-sm">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="filterEstado" (ngModelChange)="onFilterChange()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="PENDIENTE">Pendiente</mat-option>
            <mat-option value="ASIGNADO">Asignado</mat-option>
            <mat-option value="EN_CAMINO">En Camino</mat-option>
            <mat-option value="EN_PROGRESO">En Progreso</mat-option>
            <mat-option value="COMPLETADO">Completado</mat-option>
            <mat-option value="CANCELADO">Cancelado</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field filter-sm">
          <mat-label>Prioridad</mat-label>
          <mat-select [(ngModel)]="filterPrioridad" (ngModelChange)="onFilterChange()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="ALTA">Alta</mat-option>
            <mat-option value="MEDIA">Media</mat-option>
            <mat-option value="BAJA">Baja</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Fecha desde</mat-label>
          <input matInput type="date" [(ngModel)]="filterFechaInicio" (ngModelChange)="onFilterChange()" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Fecha hasta</mat-label>
          <input matInput type="date" [(ngModel)]="filterFechaFin" (ngModelChange)="onFilterChange()" />
        </mat-form-field>

        <button mat-button class="clear-btn" (click)="clearFilters()">Limpiar</button>
      </div>

      <!-- Tabla -->
      @if (historyQuery.isLoading()) {
        <app-loading-state message="Cargando historial..."></app-loading-state>
      } @else if (historyQuery.isError()) {
        <div class="error-state sm-glass-card">❌ No se pudo cargar el historial.</div>
      } @else {
        <mat-card class="table-card sm-glass-card">
          <div class="table-header">
            <lucide-icon [img]="historyIcon" [size]="18"></lucide-icon>
            <span>Registros encontrados</span>
            <span class="count-badge">{{ filteredData().length }}</span>
          </div>

          <table mat-table [dataSource]="pagedData()" class="modern-table">

            <!-- ID -->
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID Incidente</th>
              <td mat-cell *matCellDef="let h">
                <span class="mono-id">#{{ h.id_incidente.substring(0, 8) }}</span>
              </td>
            </ng-container>

            <!-- Fecha -->
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha (BOL)</th>
              <td mat-cell *matCellDef="let h">
                <span class="date-text">{{ h.fecha_reporte | date:'dd/MM/yyyy HH:mm' : '-0400' }}</span>
              </td>
            </ng-container>

            <!-- Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let h">
                <span class="status-tag" [attr.data-status]="h.estado_incidente">
                  {{ h.estado_incidente?.replace('_', ' ') }}
                </span>
              </td>
            </ng-container>

            <!-- Prioridad -->
            <ng-container matColumnDef="prioridad">
              <th mat-header-cell *matHeaderCellDef>Prioridad</th>
              <td mat-cell *matCellDef="let h">
                <span class="priority-tag" [attr.data-priority]="h.prioridad_incidente">
                  {{ h.prioridad_incidente }}
                </span>
              </td>
            </ng-container>

            <!-- Resumen IA -->
            <ng-container matColumnDef="resumen">
              <th mat-header-cell *matHeaderCellDef>Resumen IA</th>
              <td mat-cell *matCellDef="let h">
                <p class="truncate-text">{{ h.resumen_ia || 'Sin análisis' }}</p>
              </td>
            </ng-container>

            <!-- Taller -->
            <ng-container matColumnDef="taller">
              <th mat-header-cell *matHeaderCellDef>Taller</th>
              <td mat-cell *matCellDef="let h">
                @if (h.id_taller) {
                  <span class="assigned-badge">Asignado</span>
                } @else {
                  <span class="unassigned-badge">Sin taller</span>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (filteredData().length === 0) {
            <app-empty-state 
              [icon]="historyIcon" 
              title="Sin registros" 
              message="No hay registros que coincidan con los filtros aplicados.">
            </app-empty-state>
          }

          <!-- Paginador DINÁMICO -->
          <mat-paginator
            [length]="filteredData().length"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            aria-label="Páginas del historial">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1300px; margin: 0 auto; }

    .refresh-btn { display: flex; align-items: center; gap: 0.5rem; border-color: rgba(var(--sm-rgb-sapphire-400), 0.3); color: var(--sm-color-sapphire-400); }

    /* Filtros */
    .filters-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }
    .filter-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: var(--sm-color-sapphire-400); text-transform: uppercase; white-space: nowrap; }
    .filter-field { flex: 1; min-width: 160px; }
    .filter-sm { max-width: 150px; flex: 0 0 150px; }
    .clear-btn { color: var(--sm-color-text-muted); font-size: 0.8rem; white-space: nowrap; }

    /* Tabla */
    .table-card { border: none; padding: 0; }
    .table-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--sm-color-sapphire-400); font-size: 0.85rem; font-weight: 600;
      .count-badge { margin-left: auto; background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-300); padding: 0.15rem 0.6rem; border-radius: 20px; font-size: 0.75rem; }
    }
    .modern-table { width: 100%; background: transparent;
      th { color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); }

    .mono-id { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--sm-color-sapphire-400); font-weight: 600; }
    .date-text { font-size: 0.82rem; color: var(--sm-color-text-soft); }
    .truncate-text { margin: 0; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.82rem; color: var(--sm-color-text-soft); }

    .status-tag { font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 4px; letter-spacing: 0.03em;
      &[data-status="COMPLETADO"] { background: rgba(46,204,113,0.12); color: #2ecc71; }
      &[data-status="ASIGNADO"]   { background: rgba(52,152,219,0.12); color: #3498db; }
      &[data-status="EN_CAMINO"]  { background: rgba(230,126,34,0.12); color: #e67e22; }
      &[data-status="EN_PROGRESO"]{ background: rgba(241,196,15,0.12); color: #f1c40f; }
      &[data-status="CANCELADO"]  { background: rgba(231,76,60,0.12);  color: #e74c3c; }
      &[data-status="PENDIENTE"]  { background: rgba(var(--sm-rgb-slate-400),0.1); color: var(--sm-color-text-muted); }
    }

    .priority-tag { font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 4px;
      &[data-priority="ALTA"]  { background: rgba(231,76,60,0.12);  color: #e74c3c; }
      &[data-priority="MEDIA"] { background: rgba(241,196,15,0.12); color: #f1c40f; }
      &[data-priority="BAJA"]  { background: rgba(46,204,113,0.12); color: #2ecc71; }
    }

    .assigned-badge   { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(46,204,113,0.1); color: #2ecc71; font-weight: 600; }
    .unassigned-badge { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(var(--sm-rgb-slate-400),0.1); color: var(--sm-color-text-muted); }

    .error-state { padding: 2rem; text-align: center; color: #e74c3c; }

    mat-paginator { background: transparent; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class GlobalHistoryPage {
  private monitoringService = inject(MonitoringService);
  private authStore         = inject(AuthStore);

  readonly historyIcon = History;
  readonly filterIcon  = Filter;
  readonly refreshIcon = RefreshCw;

  // Título dinámico según rol
  isSuperAdmin = computed(() => this.authStore.user()?.rol_nombre === 'superadmin');

  pageTitle = computed(() =>
    this.isSuperAdmin()
      ? 'Historial Global de Servicios'
      : 'Historial de Servicios – Mi Taller'
  );

  pageSubtitle = computed(() =>
    this.isSuperAdmin()
      ? 'Auditoría completa de todos los auxilios mecánicos brindados por la plataforma.'
      : 'Registro de todos los servicios prestados por tu taller.'
  );

  displayedColumns = ['id', 'fecha', 'estado', 'prioridad', 'resumen', 'taller'];

  // Estado de filtros
  searchId          = '';
  filterEstado      = '';
  filterPrioridad   = '';
  filterFechaInicio = '';
  filterFechaFin    = '';
  pageSize          = 10;
  pageIndex         = 0;

  // Carga TODOS los datos; el filtrado y paginación se hacen en el cliente
  historyQuery = injectQuery(() => ({
    queryKey: ['global-history'],
    queryFn: () => lastValueFrom(this.monitoringService.getGlobalHistory())
  }));

  // ── Filtrado reactivo ──────────────────────────────────────────────────────
  filteredData = computed(() => {
    let data = (this.historyQuery.data() as IncidentDetailResponse[]) ?? [];

    if (this.searchId) {
      const q = this.searchId.toLowerCase();
      data = data.filter((h: IncidentDetailResponse) => h.id_incidente?.toLowerCase().includes(q));
    }
    if (this.filterEstado) {
      data = data.filter((h: IncidentDetailResponse) => h.estado_incidente === this.filterEstado);
    }
    if (this.filterPrioridad) {
      data = data.filter((h: IncidentDetailResponse) => h.prioridad_incidente === this.filterPrioridad);
    }
    if (this.filterFechaInicio) {
      const desde = new Date(this.filterFechaInicio).getTime();
      data = data.filter((h: IncidentDetailResponse) => h.fecha_reporte ? new Date(h.fecha_reporte).getTime() >= desde : true);
    }
    if (this.filterFechaFin) {
      const hasta = new Date(this.filterFechaFin + 'T23:59:59').getTime();
      data = data.filter((h: IncidentDetailResponse) => h.fecha_reporte ? new Date(h.fecha_reporte).getTime() <= hasta : true);
    }

    return data;
  });

  // ── Paginación dinámica ────────────────────────────────────────────────────
  pagedData = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.filteredData().slice(start, start + this.pageSize);
  });

  onFilterChange() {
    this.pageIndex = 0; // Resetear a primera página al filtrar
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
  }

  clearFilters() {
    this.searchId          = '';
    this.filterEstado      = '';
    this.filterPrioridad   = '';
    this.filterFechaInicio = '';
    this.filterFechaFin    = '';
    this.pageIndex         = 0;
  }
}
