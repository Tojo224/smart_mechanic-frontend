import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../../data-access/monitoring.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, ShieldCheck, User, Globe, Clock, Terminal, Filter, Search, RefreshCw } from 'lucide-angular';

/** Mapa de rutas API → etiqueta legible */
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'POST /api/v1/identity/auth/login':    { label: 'Login',           color: 'green'  },
  'POST /api/v1/identity/auth/register': { label: 'Registro',        color: 'blue'   },
  'POST /api/v1/workshops':              { label: 'Crear Taller',     color: 'purple' },
  'PATCH /api/v1/workshops':             { label: 'Editar Taller',    color: 'orange' },
  'DELETE /api/v1/workshops':            { label: 'Eliminar Taller',  color: 'red'    },
  'POST /api/v1/emergencies':            { label: 'Nueva Emergencia', color: 'red'    },
  'PATCH /api/v1/emergencies':           { label: 'Actualizar Incidente', color: 'orange' },
  'POST /api/v1/identity/users':         { label: 'Crear Usuario',    color: 'blue'   },
};

function resolveActionBadge(accion: string): { label: string; color: string } {
  // Buscar coincidencia exacta o parcial
  for (const key of Object.keys(ACTION_LABELS)) {
    if (accion.includes(key) || key.includes(accion)) {
      return ACTION_LABELS[key];
    }
  }
  // Fallback: extraer método HTTP si lo tiene
  const match = accion.match(/^(GET|POST|PUT|PATCH|DELETE)\s/);
  if (match) {
    const colors: Record<string, string> = { GET: 'gray', POST: 'blue', PUT: 'orange', PATCH: 'orange', DELETE: 'red' };
    return { label: accion.replace(/^(GET|POST|PUT|PATCH|DELETE)\s\/api\/v1\//, '').split('/')[0], color: colors[match[1]] ?? 'gray' };
  }
  return { label: accion, color: 'gray' };
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  providers: [DatePipe],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    LucideAngularModule,
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>
            <lucide-icon [img]="shieldIcon" [size]="28"></lucide-icon>
            Bitácora de Auditoría
          </h1>
          <p>Registro histórico de seguridad y operaciones críticas del sistema.</p>
        </div>
        <button mat-stroked-button class="refresh-btn" (click)="refresh()">
          <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
          Actualizar
        </button>
      </header>

      <!-- Filtros -->
      <div class="filters-bar sm-glass-card">
        <div class="filter-title">
          <lucide-icon [img]="filterIcon" [size]="16"></lucide-icon>
          <span>Filtros</span>
        </div>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar usuario</mat-label>
          <input matInput [(ngModel)]="filterUsuario" (ngModelChange)="onFilterChange()" placeholder="Nombre del usuario..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Tipo de acción</mat-label>
          <mat-select [(ngModel)]="filterAccion" (ngModelChange)="onFilterChange()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="login">Login</mat-option>
            <mat-option value="register">Registro</mat-option>
            <mat-option value="emergencies">Emergencias</mat-option>
            <mat-option value="workshops">Talleres</mat-option>
            <mat-option value="users">Usuarios</mat-option>
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

      @if (logsQuery.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Consultando registros de seguridad...</p>
        </div>
      } @else if (logsQuery.isError()) {
        <div class="error-state sm-glass-card">
          <p>❌ No se pudo cargar la bitácora. Verifica tu conexión con el servidor.</p>
        </div>
      } @else {
        <mat-card class="table-card sm-glass-card">
          <div class="audit-header">
            <lucide-icon [img]="shieldIcon" [size]="20"></lucide-icon>
            <h3>Historial de Operaciones</h3>
            <span class="total-badge">{{ logsQuery.data()?.length || 0 }} registros</span>
          </div>

          <table mat-table [dataSource]="logsQuery.data() || []" class="modern-table">

            <!-- Usuario -->
            <ng-container matColumnDef="usuario">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let log">
                <div class="user-cell">
                  <div class="avatar">{{ (log.nombre_usuario || 'S')[0].toUpperCase() }}</div>
                  <span>{{ log.nombre_usuario || 'Sistema' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Acción -->
            <ng-container matColumnDef="accion">
              <th mat-header-cell *matHeaderCellDef>Acción</th>
              <td mat-cell *matCellDef="let log">
                <span class="action-badge" [class]="'badge-' + getActionBadge(log.accion).color">
                  {{ getActionBadge(log.accion).label }}
                </span>
              </td>
            </ng-container>

            <!-- Descripción -->
            <ng-container matColumnDef="descripcion">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let log">
                <span class="desc-text">{{ log.descripcion || '—' }}</span>
              </td>
            </ng-container>

            <!-- IP -->
            <ng-container matColumnDef="ip">
              <th mat-header-cell *matHeaderCellDef>IP</th>
              <td mat-cell *matCellDef="let log">
                <div class="ip-cell">
                  <lucide-icon [img]="globeIcon" [size]="12"></lucide-icon>
                  <code>{{ log.ip }}</code>
                </div>
              </td>
            </ng-container>

            <!-- Fecha -->
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha (BOL)</th>
              <td mat-cell *matCellDef="let log">
                <div class="date-cell">
                  <lucide-icon [img]="clockIcon" [size]="12"></lucide-icon>
                  <span>{{ log.fecha_hora | date:'dd/MM/yyyy HH:mm:ss' : '-0400' }}</span>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if ((logsQuery.data()?.length ?? 0) === 0) {
            <div class="empty-state">
              <p>No hay registros que coincidan con los filtros aplicados.</p>
            </div>
          }

          <!-- Paginación -->
          <mat-paginator
            [length]="logsQuery.data()?.length || 0"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            aria-label="Página de bitácora">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1300px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; color: var(--sm-color-text-title); }
      p { margin: 0.5rem 0 0; color: var(--sm-color-text-soft); }
    }

    .refresh-btn {
      display: flex; align-items: center; gap: 0.5rem;
      border-color: rgba(var(--sm-rgb-sapphire-400), 0.3);
      color: var(--sm-color-sapphire-400);
    }

    /* Filtros */
    .filters-bar {
      display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;
      padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
      .filter-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--sm-color-sapphire-400); text-transform: uppercase; white-space: nowrap; }
    }

    .filter-field { min-width: 180px; flex: 1; }

    .clear-btn { color: var(--sm-color-text-muted); font-size: 0.8rem; }

    /* Tabla */
    .table-card { border: none; padding: 0; }

    .audit-header {
      display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      color: var(--sm-color-sapphire-400);
      h3 { margin: 0; font-size: 1rem; color: var(--sm-color-text-title); }
      .total-badge { margin-left: auto; font-size: 0.75rem; padding: 0.2rem 0.6rem; background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-300); border-radius: 20px; }
    }

    .modern-table {
      width: 100%; background: transparent;
      th { color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    }

    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); }

    .user-cell { display: flex; align-items: center; gap: 0.6rem; font-size: 0.875rem; }
    .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--sm-color-sapphire-700); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }

    /* Badges de acción */
    .action-badge { padding: 0.2rem 0.65rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge-green  { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
    .badge-blue   { background: rgba(52, 152, 219, 0.15); color: #3498db; }
    .badge-purple { background: rgba(155, 89, 182, 0.15); color: #9b59b6; }
    .badge-orange { background: rgba(230, 126, 34, 0.15); color: #e67e22; }
    .badge-red    { background: rgba(231, 76, 60, 0.15);  color: #e74c3c; }
    .badge-gray   { background: rgba(var(--sm-rgb-slate-400), 0.1); color: var(--sm-color-text-soft); }

    .desc-text { font-size: 0.82rem; color: var(--sm-color-text-soft); }

    .ip-cell, .date-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--sm-color-text-soft); }
    code { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }

    .loading-state { padding: 8rem; text-align: center; color: var(--sm-color-text-soft); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .error-state { padding: 3rem; text-align: center; color: #e74c3c; }
    .empty-state { padding: 4rem; text-align: center; color: var(--sm-color-text-muted); }

    mat-paginator { background: transparent; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(var(--sm-rgb-sapphire-400), 0.2); border-top: 3px solid var(--sm-color-sapphire-400); border-radius: 50%; animation: spin 0.8s linear infinite; }
  `]
})
export class AuditLogsPage {
  private monitoringService = inject(MonitoringService);

  readonly shieldIcon  = ShieldCheck;
  readonly userIcon    = User;
  readonly globeIcon   = Globe;
  readonly clockIcon   = Clock;
  readonly actionIcon  = Terminal;
  readonly filterIcon  = Filter;
  readonly refreshIcon = RefreshCw;

  displayedColumns = ['usuario', 'accion', 'descripcion', 'ip', 'fecha'];

  // Estado de filtros
  filterUsuario    = '';
  filterAccion     = '';
  filterFechaInicio = '';
  filterFechaFin   = '';
  pageSize         = 20;
  pageIndex        = 0;

  // Params reactivos para la query
  private queryParams = signal<Record<string, string | number>>({});

  logsQuery = injectQuery(() => ({
    queryKey: ['audit-logs', this.queryParams()],
    queryFn: () => lastValueFrom(
      this.monitoringService.getAuditLogs(this.queryParams())
    )
  }));

  getActionBadge(accion: string) {
    return resolveActionBadge(accion);
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.applyFilters();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.applyFilters();
  }

  clearFilters() {
    this.filterUsuario     = '';
    this.filterAccion      = '';
    this.filterFechaInicio = '';
    this.filterFechaFin    = '';
    this.pageIndex         = 0;
    this.applyFilters();
  }

  refresh() {
    this.applyFilters();
  }

  private applyFilters() {
    const params: Record<string, string | number> = {
      page: this.pageIndex,
      size: this.pageSize,
    };
    if (this.filterUsuario)     params['usuario_nombre'] = this.filterUsuario;
    if (this.filterAccion)      params['accion']         = this.filterAccion;
    if (this.filterFechaInicio) params['fecha_inicio']   = this.filterFechaInicio;
    if (this.filterFechaFin)    params['fecha_fin']      = this.filterFechaFin;
    this.queryParams.set(params);
  }
}
