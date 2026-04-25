import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopsService } from '../../data-access/workshops.service';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, Building2, MapPin, Phone, Mail, ExternalLink, Plus } from 'lucide-angular';
import { PageHeaderComponent } from '@shared/ui';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workshop-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    LucideAngularModule,
    PageHeaderComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Talleres Afiliados" 
        subtitle="Explora y gestiona la red de centros de asistencia mecánica."
        [icon]="buildingIcon">
        <div actions>
          <button mat-flat-button color="primary" routerLink="/workshops/register">
            <lucide-icon [img]="plusIcon" [size]="18"></lucide-icon>
            Nuevo Taller
          </button>
        </div>
      </app-page-header>

      <div class="table-container sm-glass-card">
        @if (workshopsQuery.isLoading()) {
          <div class="loading-state">Cargando empresas...</div>
        }

        <table mat-table [dataSource]="workshopsQuery.data() || []" class="workshop-table">
          <!-- Columna Taller -->
          <ng-container matColumnDef="taller">
            <th mat-header-cell *matHeaderCellDef>Taller</th>
            <td mat-cell *matCellDef="let workshop">
              <div class="workshop-info">
                <div class="workshop-icon">
                  <lucide-icon [img]="buildingIcon" [size]="18"></lucide-icon>
                </div>
                <div class="name-box">
                  <span class="workshop-name">{{ workshop.nombre }}</span>
                  <span class="workshop-nit">NIT: {{ workshop.nit }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Columna Contacto -->
          <ng-container matColumnDef="contacto">
            <th mat-header-cell *matHeaderCellDef>Contacto</th>
            <td mat-cell *matCellDef="let workshop">
              <div class="contact-info">
                <div class="contact-item">
                  <lucide-icon [img]="phoneIcon" [size]="14"></lucide-icon>
                  <span>{{ workshop.telefono || 'N/A' }}</span>
                </div>
                <div class="contact-item">
                  <lucide-icon [img]="mailIcon" [size]="14"></lucide-icon>
                  <span>{{ workshop.email || 'N/A' }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Columna Ubicación -->
          <ng-container matColumnDef="ubicacion">
            <th mat-header-cell *matHeaderCellDef>Ubicación</th>
            <td mat-cell *matCellDef="let workshop">
              <div class="location-box" [matTooltip]="workshop.direccion">
                <lucide-icon [img]="mapIcon" [size]="14"></lucide-icon>
                <span class="truncate-text">{{ workshop.direccion || 'Sin dirección' }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Columna Estado -->
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let workshop">
              <span class="status-badge" [class.active]="workshop.is_active">
                {{ workshop.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>

          <!-- Columna Acciones -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let workshop">
              <div class="actions-group">
                <button mat-icon-button color="primary" matTooltip="Ver Detalles" (click)="viewDetails(workshop.id_taller)">
                  <lucide-icon [img]="linkIcon" [size]="18"></lucide-icon>
                </button>
                <button mat-icon-button [color]="workshop.is_active ? 'warn' : 'primary'" 
                        [matTooltip]="workshop.is_active ? 'Suspender' : 'Activar'"
                        (click)="toggleStatus(workshop.id_taller)">
                  <mat-icon>{{ workshop.is_active ? 'block' : 'check_circle' }}</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (workshopsQuery.data()?.length === 0 && !workshopsQuery.isLoading()) {
          <div class="empty-state">
            <lucide-icon [img]="buildingIcon" [size]="48"></lucide-icon>
            <p>Aún no hay talleres registrados en la plataforma.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }

    .stat-card {
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      
      .stat-label { font-size: 0.75rem; text-transform: uppercase; color: var(--sm-color-text-soft); }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--sm-color-sapphire-400); }
    }

    .table-container {
      border-radius: 12px;
      overflow: hidden;
    }

    .workshop-table {
      width: 100%;
      background: transparent;
      
      th {
        padding: 1rem;
        color: var(--sm-color-text-soft);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      }

      td {
        padding: 1rem;
        border-bottom: 1px solid rgba(var(--sm-rgb-slate-400), 0.05);
      }
    }

    .workshop-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      .workshop-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(var(--sm-rgb-sapphire-500), 0.15);
        color: var(--sm-color-sapphire-400);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .name-box {
        display: flex;
        flex-direction: column;
        .workshop-name { font-weight: 600; color: var(--sm-color-text-main); }
        .workshop-nit { font-size: 0.7rem; color: var(--sm-color-text-soft); }
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .contact-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--sm-color-text-soft);
      }
    }

    .location-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--sm-color-text-soft);
      max-width: 200px;

      .truncate-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .status-badge {
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(var(--sm-rgb-slate-400), 0.1);
      color: var(--sm-color-text-muted);
      
      &.active {
        background: rgba(46, 204, 113, 0.15);
        color: #2ecc71;
      }
    }

    .actions-group {
      display: flex;
      gap: 0.5rem;
    }

    .loading-state, .empty-state {
      padding: 4rem;
      text-align: center;
      color: var(--sm-color-text-soft);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class WorkshopListComponent {
  private workshopsService = inject(WorkshopsService);
  private router = inject(Router);

  protected readonly buildingIcon = Building2;
  protected readonly phoneIcon = Phone;
  protected readonly mailIcon = Mail;
  protected readonly mapIcon = MapPin;
  protected readonly linkIcon = ExternalLink;
  protected readonly plusIcon = Plus;

  displayedColumns: string[] = ['taller', 'contacto', 'ubicacion', 'estado', 'acciones'];

  workshopsQuery = injectQuery(() => ({
    queryKey: ['all-workshops-list'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops())
  }));

  queryClient = injectQueryClient();

  toggleStatusMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.workshopsService.toggleWorkshopStatus(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['all-workshops-list'] });
    }
  }));

  toggleStatus(id: string) {
    this.toggleStatusMutation.mutate(id);
  }

  viewDetails(id: string) {
    // Por ahora, redirigimos a una vista de detalle o edición
    console.log('Ver detalles de:', id);
  }
}
