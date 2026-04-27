import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../../data-access/identity.service';
import { WorkshopSelectorComponent } from '../../components/workshop-selector/workshop-selector.component';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, User, UserPlus, Filter, Search, ShieldCheck, Mail, Briefcase, RefreshCw } from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent } from '@shared/ui';
import { UserFormDialogComponent } from '../../components/user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WorkshopSelectorComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Gestión de Personal e Identidad"
        [subtitle]="pageSubtitle()"
        [icon]="userIcon">
        <div actions>
          <button mat-flat-button color="primary" class="btn-add" (click)="openCreateDialog()">
            <lucide-icon [img]="userPlusIcon" [size]="18"></lucide-icon>
            Nuevo Usuario
          </button>
        </div>
      </app-page-header>

      <!-- Barra de Filtros Premium -->
      <div class="filters-container sm-glass-card">
        <div class="filter-group">
          <div class="search-field">
            <lucide-icon [img]="searchIcon" [size]="18" class="search-icon"></lucide-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onFilterChange()"
              placeholder="Buscar por nombre o correo..." 
              class="premium-input"
            />
          </div>

          <mat-form-field appearance="outline" class="sm-select">
            <mat-label>Rol de Usuario</mat-label>
            <mat-select [(ngModel)]="filterRol" (ngModelChange)="onFilterChange()">
              <mat-option value="">Todos los roles</mat-option>
              <mat-option value="superadmin">SuperAdmin</mat-option>
              <mat-option value="admin_taller">Administrador de Taller</mat-option>
              <mat-option value="tecnico">Técnico Mecánico</mat-option>
              <mat-option value="cliente">Cliente</mat-option>
            </mat-select>
          </mat-form-field>

          @if (isSuperAdmin()) {
            <div class="workshop-filter">
              <app-workshop-selector 
                [workshops]="workshopsQuery.data() || []" 
                [isLoading]="workshopsQuery.isLoading()"
                (workshopChanged)="onWorkshopFilterChange($event)">
              </app-workshop-selector>
            </div>
          }
        </div>

        <div class="filter-actions">
          <button mat-icon-button (click)="usersQuery.refetch()" matTooltip="Actualizar">
            <lucide-icon [img]="refreshIcon" [size]="18"></lucide-icon>
          </button>
          <button mat-button class="clear-btn" (click)="clearFilters()">Limpiar</button>
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="table-card sm-glass-card">
        <div class="table-header">
          <div class="table-info">
            <lucide-icon [img]="shieldIcon" [size]="16"></lucide-icon>
            <span>Usuarios Registrados</span>
            <span class="count-badge">{{ filteredUsers().length }}</span>
          </div>
        </div>

        @if (usersQuery.isLoading()) {
          <app-loading-state message="Sincronizando identidades..."></app-loading-state>
        } @else {
          <table mat-table [dataSource]="pagedUsers()" class="modern-table">
            
            <!-- Columna Nombre -->
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-profile-cell">
                  <div class="avatar-box" [class]="user.rol_nombre">
                    {{ user.nombre[0] | uppercase }}
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.nombre }}</div>
                    <div class="user-id">ID: {{ user.id_usuario.substring(0,8) }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Columna Contacto -->
            <ng-container matColumnDef="contacto">
              <th mat-header-cell *matHeaderCellDef>Contacto</th>
              <td mat-cell *matCellDef="let user">
                <div class="contact-info">
                  <div class="info-item">
                    <lucide-icon [img]="mailIcon" [size]="12"></lucide-icon>
                    <span>{{ user.correo }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Columna Rol -->
            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef>Responsabilidad</th>
              <td mat-cell *matCellDef="let user">
                <div class="role-container">
                  <lucide-icon [img]="briefcaseIcon" [size]="12" class="role-icon"></lucide-icon>
                  <span class="role-text" [class]="user.rol_nombre">
                    {{ user.rol_nombre.replace('_', ' ') | uppercase }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Columna Estado -->
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let user">
                <span class="status-dot-chip" [class.active]="user.estado">
                  <span class="dot"></span>
                  {{ user.estado ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
            </ng-container>

            <!-- Columna Acciones -->
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let user">
                <div class="action-buttons">
                  <button mat-icon-button class="edit-btn" matTooltip="Editar Perfil">
                    <mat-icon>edit_note</mat-icon>
                  </button>
                  <button 
                    mat-icon-button 
                    [class.toggle-off]="user.estado" 
                    [class.toggle-on]="!user.estado"
                    (click)="toggleStatus(user.id_usuario)"
                    [disabled]="statusMutation.isPending()"
                    [matTooltip]="user.estado ? 'Desactivar Usuario' : 'Activar Usuario'"
                  >
                    <mat-icon>{{ user.estado ? 'person_off' : 'person_check' }}</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
          </table>

          @if (filteredUsers().length === 0) {
            <app-empty-state 
              [icon]="userIcon" 
              title="Sin coincidencias" 
              message="No hay usuarios que coincidan con los filtros aplicados.">
            </app-empty-state>
          }

          <mat-paginator
            [length]="filteredUsers().length"
            [pageSize]="pageSize"
            [pageIndex]="pageIndex"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            class="premium-paginator"
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }

    /* Barra de Filtros Premium */
    .filters-container {
      padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem;
      .filter-group { display: flex; align-items: center; gap: 1rem; flex: 1; }
    }

    .search-field {
      position: relative; flex: 1; max-width: 400px;
      .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--sm-color-text-muted); pointer-events: none; }
      .premium-input {
        width: 100%; padding: 0.75rem 1rem 0.75rem 3rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; font-size: 0.9rem; transition: all 0.2s;
        &:focus { border-color: var(--sm-color-sapphire-400); background: rgba(255,255,255,0.08); outline: none; box-shadow: 0 0 0 4px rgba(var(--sm-rgb-sapphire-400), 0.1); }
      }
    }

    .sm-select { width: 220px; font-size: 0.85rem; }
    .clear-btn { color: var(--sm-color-text-muted); font-size: 0.8rem; }
    .filter-actions { display: flex; align-items: center; gap: 0.5rem; }

    /* Tabla Premium */
    .table-card { border-radius: 16px; overflow: hidden; padding: 0; }
    .table-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);
      .table-info { display: flex; align-items: center; gap: 0.75rem; color: var(--sm-color-sapphire-400); font-weight: 600; font-size: 0.85rem; }
      .count-badge { margin-left: auto; background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-300); padding: 0.15rem 0.6rem; border-radius: 20px; font-size: 0.75rem; }
    }

    .modern-table {
      width: 100%; background: transparent;
      th { color: var(--sm-color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.8rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
    }
    .table-row:hover td { background: rgba(var(--sm-rgb-sapphire-500), 0.05); transition: background 0.15s; }

    .user-profile-cell {
      display: flex; align-items: center; gap: 1rem;
      .avatar-box {
        width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; color: white; background: #475569;
        &.superadmin { background: #6366f1; }
        &.admin_taller { background: #f59e0b; }
        &.tecnico { background: #8b5cf6; }
        &.cliente { background: #10b981; }
      }
      .user-name { font-weight: 600; color: var(--sm-color-text-main); font-size: 0.9rem; }
      .user-id { font-size: 0.65rem; color: var(--sm-color-text-muted); margin-top: 0.1rem; font-family: monospace; }
    }

    .role-container {
      display: flex; align-items: center; gap: 0.5rem;
      .role-icon { color: var(--sm-color-text-muted); }
      .role-text { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.03em;
        &.superadmin { color: #818cf8; }
        &.admin_taller { color: #fbbf24; }
        &.tecnico { color: #a78bfa; }
        &.cliente { color: #34d399; }
      }
    }

    .status-dot-chip {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.05); color: var(--sm-color-text-muted);
      .dot { width: 6px; height: 6px; border-radius: 50%; background: #64748b; }
      &.active { background: rgba(46, 204, 113, 0.1); color: #2ecc71; .dot { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; } }
    }

    .contact-info {
      .info-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--sm-color-text-soft); }
    }

    .action-buttons {
      display: flex; gap: 0.5rem;
      button { color: var(--sm-color-text-muted); transition: all 0.2s; &:hover { color: white; } }
      .edit-btn:hover { background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-400); }
      .toggle-off:hover { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }
      .toggle-on:hover { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
    }

    .premium-paginator { background: transparent; color: var(--sm-color-text-soft); }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class UserManagementComponent {
  private identityService = inject(IdentityService);
  private workshopsService = inject(WorkshopsService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private queryClient = injectQueryClient();

  // Iconos
  protected readonly userPlusIcon = UserPlus;
  protected readonly filterIcon = Filter;
  protected readonly userIcon = User;
  protected readonly searchIcon = Search;
  protected readonly shieldIcon = ShieldCheck;
  protected readonly mailIcon = Mail;
  protected readonly briefcaseIcon = Briefcase;
  protected readonly refreshIcon = RefreshCw;

  // Estado de Filtros
  searchQuery = '';
  filterRol = '';
  selectedWorkshopId = signal<string | null>(null);
  
  // Paginación
  pageSize = 10;
  pageIndex = 0;

  isSuperAdmin = computed(() => this.authStore.user()?.rol_nombre === 'superadmin');
  
  pageSubtitle = computed(() => 
    this.isSuperAdmin() 
      ? 'Administra los usuarios, roles y accesos globales de la plataforma.' 
      : 'Gestiona el personal y técnicos asignados a tu taller.'
  );

  displayedColumns: string[] = ['nombre', 'contacto', 'rol', 'estado', 'acciones'];

  usersQuery = injectQuery(() => ({
    queryKey: ['users', this.selectedWorkshopId()],
    queryFn: () => lastValueFrom(this.identityService.getUsers(this.selectedWorkshopId() ?? undefined))
  }));

  workshopsQuery = injectQuery(() => ({
    queryKey: ['all-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops()),
    enabled: this.isSuperAdmin()
  }));

  // Filtrado Reactivo (Client-side para fluidez, soportando gran volumen)
  filteredUsers = computed(() => {
    let data = this.usersQuery.data() || [];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(u => 
        u.nombre.toLowerCase().includes(q) || 
        u.correo.toLowerCase().includes(q)
      );
    }

    if (this.filterRol) {
      data = data.filter(u => u.rol_nombre === this.filterRol);
    }

    return data;
  });

  // Paginación Reactiva
  pagedUsers = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  statusMutation = injectMutation(() => ({
    mutationFn: (userId: string) => lastValueFrom(this.identityService.toggleUserStatus(userId)),
    onSuccess: (updated) => {
      this.snackBar.open(`Usuario ${updated.nombre} ${updated.estado ? 'activado' : 'desactivado'}`, 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => {
      this.snackBar.open('Error al cambiar el estado del usuario', 'Cerrar', { duration: 4000 });
    }
  }));

  createMutation = injectMutation(() => ({
    mutationFn: (userData: any) => lastValueFrom(this.identityService.createUser(userData)),
    onSuccess: (newUser) => {
      this.snackBar.open(`Usuario ${newUser.nombre} creado con éxito`, 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      const msg = error.error?.detail || 'Error al crear el usuario';
      this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
    }
  }));

  openCreateDialog() {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMutation.mutate(result);
      }
    });
  }

  onWorkshopFilterChange(tallerId: string | null) {
    this.selectedWorkshopId.set(tallerId);
    this.pageIndex = 0;
  }

  onFilterChange() {
    this.pageIndex = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterRol = '';
    this.selectedWorkshopId.set(null);
    this.pageIndex = 0;
  }

  toggleStatus(userId: string) {
    this.statusMutation.mutate(userId);
  }
}
