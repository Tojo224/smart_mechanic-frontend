import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IdentityService } from '../../data-access/identity.service';
import { WorkshopSelectorComponent } from '../../components/workshop-selector/workshop-selector.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { LucideAngularModule, User, UserPlus, Filter } from 'lucide-angular';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    WorkshopSelectorComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LucideAngularModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Gestión de Identidad</h1>
          <p>Administra los usuarios, roles y accesos de la plataforma.</p>
        </div>
        <div class="actions-section">
          <button mat-flat-button color="primary" class="btn-add">
            <lucide-icon [img]="userPlusIcon" [size]="18"></lucide-icon>
            Nuevo Usuario
          </button>
        </div>
      </header>

      <!-- Filtros (Solo SuperAdmin) -->
      @if (isSuperAdmin()) {
        <div class="filter-section sm-glass-card">
          <div class="filter-header">
            <lucide-icon [img]="filterIcon" [size]="16"></lucide-icon>
            <span>Filtros Globales</span>
          </div>
          <app-workshop-selector (workshopChanged)="onWorkshopFilterChange($event)"></app-workshop-selector>
        </div>
      }

      <!-- Tabla de Usuarios -->
      <div class="table-container sm-glass-card">
        @if (usersQuery.isLoading()) {
          <div class="loading-overlay">Cargando usuarios...</div>
        }

        <table mat-table [dataSource]="usersQuery.data() || []" class="user-table">
          <!-- Columna Nombre -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let user">
              <div class="user-info">
                <div class="user-avatar">{{ user.nombre[0] }}</div>
                <span>{{ user.nombre }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Columna Correo -->
          <ng-container matColumnDef="correo">
            <th mat-header-cell *matHeaderCellDef>Correo Electrónico</th>
            <td mat-cell *matCellDef="let user">{{ user.correo }}</td>
          </ng-container>

          <!-- Columna Rol -->
          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let user">
              <span class="role-badge" [class]="user.rol_nombre">
                {{ user.rol_nombre }}
              </span>
            </td>
          </ng-container>

          <!-- Columna Estado -->
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip-listbox>
                <mat-chip [class.active]="user.estado" [class.inactive]="!user.estado">
                  {{ user.estado ? 'Activo' : 'Inactivo' }}
                </mat-chip>
              </mat-chip-listbox>
            </td>
          </ng-container>

          <!-- Columna Acciones -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button color="accent" title="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button [color]="user.estado ? 'warn' : 'primary'" [title]="user.estado ? 'Desactivar' : 'Activar'">
                <mat-icon>{{ user.estado ? 'block' : 'check_circle' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (usersQuery.data()?.length === 0) {
          <div class="empty-state">
            <lucide-icon [img]="userIcon" [size]="48"></lucide-icon>
            <p>No se encontraron usuarios con este filtro.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      animation: fadeIn 0.4s ease-out;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 { margin: 0; font-size: 1.8rem; color: var(--sm-color-text-title); }
      p { margin: 0.5rem 0 0; color: var(--sm-color-text-soft); }
    }

    .btn-add {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
    }

    .filter-section {
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .filter-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--sm-color-sapphire-300);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .table-container {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
    }

    .user-table {
      width: 100%;
      background: transparent;
      
      th {
        color: var(--sm-color-text-soft);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        padding: 1rem;
        border-bottom: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      }

      td {
        padding: 1rem;
        color: var(--sm-color-text-main);
        border-bottom: 1px solid rgba(var(--sm-rgb-slate-400), 0.05);
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--sm-color-sapphire-600);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .role-badge {
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
      
      &.superadmin { background: rgba(var(--sm-rgb-sapphire-500), 0.2); color: var(--sm-color-sapphire-300); }
      &.admin_taller { background: rgba(230, 126, 34, 0.2); color: #e67e22; }
      &.cliente { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
      &.tecnico { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }
    }

    .mat-mdc-chip {
      --mdc-chip-label-text-size: 0.7rem;
      min-height: 24px;
      
      &.active { background-color: rgba(46, 204, 113, 0.15) !important; color: #2ecc71 !important; }
      &.inactive { background-color: rgba(231, 76, 60, 0.15) !important; color: #e74c3c !important; }
    }

    .empty-state {
      padding: 4rem;
      text-align: center;
      color: var(--sm-color-text-soft);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class UserManagementComponent {
  private identityService = inject(IdentityService);
  private authStore = inject(AuthStore);

  protected readonly userPlusIcon = UserPlus;
  protected readonly filterIcon = Filter;
  protected readonly userIcon = User;

  selectedWorkshopId = signal<string | null>(null);
  
  isSuperAdmin = computed(() => this.authStore.user()?.rol_nombre === 'superadmin');

  displayedColumns: string[] = ['nombre', 'correo', 'rol', 'estado', 'acciones'];

  usersQuery = injectQuery(() => ({
    queryKey: ['users', this.selectedWorkshopId()],
    queryFn: () => lastValueFrom(this.identityService.getUsers(this.selectedWorkshopId() ?? undefined))
  }));

  onWorkshopFilterChange(tallerId: string | null) {
    this.selectedWorkshopId.set(tallerId);
  }
}
