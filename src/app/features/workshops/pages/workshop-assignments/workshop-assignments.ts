import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkshopsService } from '../../data-access/workshops.service';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FinanceService } from '@features/finance/data-access/finance.service';
import { LucideAngularModule, ClipboardList, MapPin, Clock, CheckCircle, Search, Filter, RefreshCw, AlertTriangle, Eye, ChevronRight, User, CheckCircle2, UserCheck, Navigation, MessageSquare, Inbox, Wrench, Phone } from 'lucide-angular';
import { PageHeaderComponent, LoadingStateComponent, EmptyStateComponent } from '@shared/ui';
import { IncidentResponse, TecnicoResponse } from '@core/models/workshops.model';

@Component({
  selector: 'app-workshop-assignments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    FormsModule,
    MatSnackBarModule, 
    MatButtonModule, 
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="kanban-page">
      <!-- Audio para alertas (Nuevas Solicitudes) -->
      <audio #alertSound src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>

      <div class="page-container">
        <app-page-header 
          title="Asignaciones de Auxilio" 
          subtitle="Gestiona los incidentes asignados a tu taller y el despacho de técnicos."
          [icon]="assignmentsIcon">
          <div actions>
            <button mat-stroked-button class="refresh-btn" (click)="assignmentsQuery.refetch()">
              <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
              Actualizar
            </button>
          </div>
        </app-page-header>

        <!-- Barra de Filtros del Tablero -->
        <div class="kanban-filters sm-glass-card">
          <div class="search-box">
            <lucide-icon [img]="searchIcon" [size]="16"></lucide-icon>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Buscar por ID o descripción..." />
          </div>
          
          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Prioridad</mat-label>
            <mat-select [ngModel]="filterPrioridad()" (ngModelChange)="filterPrioridad.set($event)">
              <mat-option value="">Todas</mat-option>
              <mat-option value="ALTA">Alta</mat-option>
              <mat-option value="MEDIA">Media</mat-option>
              <mat-option value="BAJA">Baja</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="board-stats">
            <span class="stat"><b>{{ totalActivos() }}</b> Activos</span>
            <span class="stat"><b>{{ filteredPending().length }}</b> Pendientes</span>
          </div>
        </div>

        @if (assignmentsQuery.isLoading()) {
          <app-loading-state message="Sincronizando órdenes de auxilio..."></app-loading-state>
        } @else {
          <div class="kanban-board">
            
            <!-- COLUMNA: SOLICITUDES ENTRANTE -->
            <div class="kanban-column incoming">
              <div class="column-header">
                <lucide-icon [img]="inboxIcon" [size]="18"></lucide-icon>
                <h2>Solicitudes Nuevas</h2>
                <span class="count">{{ filteredPending().length }}</span>
              </div>
              
              <div class="column-content">
                @for (inc of filteredPending(); track inc.id_incidente) {
                  <div class="kanban-card new-alert">
                    <div class="card-priority" [attr.data-p]="inc.prioridad_incidente">
                      {{ inc.prioridad_incidente }}
                    </div>
                    
                    <div class="card-body">
                      <div class="id-row">
                        <span class="id-label">#{{ inc.id_incidente.substring(0,8) }}</span>
                        <span class="time-ago">Recién llegado</span>
                      </div>
                      
                      <div class="ia-summary">
                        <div class="ia-header">
                          <lucide-icon [img]="messageIcon" [size]="12"></lucide-icon>
                          Resumen IA
                        </div>
                        <p>{{ inc.resumen_ia }}</p>
                      </div>

                      <div class="client-info">
                        <div class="info-item">
                          <lucide-icon [img]="phoneIcon" [size]="12"></lucide-icon>
                          {{ inc.telefono || 'Sin teléfono' }}
                        </div>
                      </div>
                    </div>

                    <div class="card-footer">
                      <mat-form-field appearance="outline" class="full-width-select">
                        <mat-select #techSelect placeholder="Asignar técnico...">
                          @for (tech of techsQuery.data(); track tech.id_tecnico) {
                            <mat-option [value]="tech.id_tecnico" [disabled]="!tech.estado">
                              {{ tech.nombre }} {{ !tech.estado ? '(Ocupado)' : '' }}
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      
                      <div class="action-buttons">
                        <button mat-flat-button color="primary" 
                                [disabled]="!techSelect.value || acceptMutation.isPending()"
                                (click)="onAccept(inc.id_incidente, techSelect.value)">
                          ACEPTAR
                        </button>
                        <button mat-button color="warn" (click)="onReject(inc.id_incidente)">
                          RECHAZAR
                        </button>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <app-empty-state 
                    [icon]="assignmentsIcon" 
                    title="Sin solicitudes" 
                    message="No hay incidentes pendientes en este momento.">
                  </app-empty-state>
                }
              </div>
            </div>

            <!-- COLUMNA: EN CAMINO -->
            <div class="kanban-column on-way">
              <div class="column-header">
                <lucide-icon [img]="navigationIcon" [size]="18"></lucide-icon>
                <h2>Técnico en Ruta</h2>
                <span class="count">{{ filteredEnCamino().length }}</span>
              </div>

              <div class="column-content">
                @for (inc of filteredEnCamino(); track inc.id_incidente) {
                  <div class="kanban-card border-blue">
                    <div class="card-body">
                      <div class="status-indicator">EN CAMINO</div>
                      <p class="summary">{{ inc.resumen_ia }}</p>
                      
                      <div class="assigned-tech">
                        <lucide-icon [img]="userIcon" [size]="12"></lucide-icon>
                        <span>Técnico asignado</span>
                      </div>
                    </div>

                    <div class="card-footer single-action">
                      <button mat-stroked-button color="primary" (click)="onUpdateStatus(inc.id_incidente, 'EN_PROGRESO')">
                        CONFIRMAR LLEGADA
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-placeholder"><p>No hay técnicos en ruta</p></div>
                }
              </div>
            </div>

            <!-- COLUMNA: EN REPARACIÓN -->
            <div class="kanban-column in-progress">
              <div class="column-header">
                <lucide-icon [img]="wrenchIcon" [size]="18"></lucide-icon>
                <h2>En Reparación</h2>
                <span class="count">{{ filteredInProgress().length }}</span>
              </div>

              <div class="column-content">
                @for (inc of filteredInProgress(); track inc.id_incidente) {
                  <div class="kanban-card border-purple">
                    <div class="card-body">
                      <div class="status-indicator purple">TRABAJANDO...</div>
                      <p class="summary">{{ inc.resumen_ia }}</p>
                    </div>

                    <div class="card-footer single-action">
                      <button mat-flat-button color="accent" (click)="onFinalizeService(inc.id_incidente)">
                        FINALIZAR Y LIBERAR
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-placeholder"><p>Sin trabajos activos en taller</p></div>
                }
              </div>
            </div>

            <!-- COLUMNA: FINALIZADOS HOY -->
            <div class="kanban-column done">
              <div class="column-header">
                <lucide-icon [img]="doneIcon" [size]="18"></lucide-icon>
                <h2>Completados</h2>
                <span class="count">{{ filteredCompleted().length }}</span>
              </div>

              <div class="column-content">
                @for (inc of filteredCompleted(); track inc.id_incidente) {
                  <div class="kanban-card card-done">
                    <div class="card-body">
                      <div class="done-check">
                        <lucide-icon [img]="doneIcon" [size]="16"></lucide-icon>
                        Servicio Finalizado
                      </div>
                      <p class="summary-muted">{{ inc.resumen_ia }}</p>
                      <div class="date-tag">{{ inc.fecha_reporte | date:'shortTime' }}</div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-placeholder"><p>No hay cierres recientes</p></div>
                }
              </div>
            </div>

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .kanban-page { 
      height: calc(100vh - 64px); display: flex; flex-direction: column; background: #0b0f1a; 
    }
    .page-container { padding: 2rem; max-width: 1800px; margin: 0 auto; animation: fadeIn 0.4s ease-out; display: flex; flex-direction: column; height: 100%; }

    /* Filtros */
    .kanban-filters {
      margin: 1rem 0; padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 1.5rem;
      .search-box { display: flex; align-items: center; gap: 0.75rem; flex: 1; max-width: 400px; background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
        input { background: none; border: none; color: white; outline: none; font-size: 0.85rem; width: 100%; }
      }
      .filter-select { height: 48px; width: 150px; font-size: 0.85rem; }
      .board-stats { margin-left: auto; display: flex; gap: 1.5rem; .stat { font-size: 0.8rem; color: var(--sm-color-text-soft); b { color: var(--sm-color-sapphire-400); margin-right: 0.2rem; } } }
    }

    /* Board */
    .kanban-board {
      flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; overflow: hidden;
    }

    .kanban-column {
      display: flex; flex-direction: column; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
      
      .column-header {
        padding: 1rem; display: flex; align-items: center; gap: 0.6rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
        h2 { margin: 0; font-size: 0.85rem; font-weight: 700; color: white; flex: 1; text-transform: uppercase; letter-spacing: 0.05em; }
        .count { background: var(--sm-color-sapphire-600); color: white; padding: 0.1rem 0.6rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; }
      }

      &.incoming .column-header { color: #e74c3c; .count { background: #e74c3c; } }
      &.on-way .column-header { color: #3498db; .count { background: #3498db; } }
      &.in-progress .column-header { color: #f1c40f; .count { background: #f1c40f; } }
    }

    .column-content {
      flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    }

    /* Cards */
    .kanban-card {
      background: #161e2e; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); position: relative; transition: all 0.2s;
      &:hover { border-color: var(--sm-color-sapphire-500); transform: translateY(-2px); }
      &.new-alert { animation: slideIn 0.3s ease-out; border-top: 3px solid #e74c3c; }
      &.border-blue { border-top: 3px solid #3498db; }
      &.border-purple { border-top: 3px solid #9b59b6; }
      &.card-done { opacity: 0.6; border-top: 3px solid #2ecc71; }
    }

    .card-priority {
      position: absolute; top: 0.75rem; right: 0.75rem; font-size: 0.6rem; font-weight: 900; padding: 0.15rem 0.4rem; border-radius: 4px;
      &[data-p="ALTA"] { background: rgba(231,76,60,0.15); color: #e74c3c; }
      &[data-p="MEDIA"] { background: rgba(241,196,15,0.15); color: #f1c40f; }
      &[data-p="BAJA"] { background: rgba(46,204,113,0.15); color: #2ecc71; }
    }

    .card-body {
      padding: 1rem;
      .id-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; 
        .id-label { font-family: monospace; color: var(--sm-color-sapphire-400); font-size: 0.75rem; font-weight: 700; }
        .time-ago { font-size: 0.65rem; color: var(--sm-color-text-muted); }
      }
      .status-indicator { font-size: 0.6rem; font-weight: 800; color: #3498db; margin-bottom: 0.5rem; letter-spacing: 0.05em;
        &.purple { color: #9b59b6; }
      }
    }

    .ia-summary {
      background: rgba(255,255,255,0.03); padding: 0.6rem; border-radius: 6px; margin-bottom: 0.75rem;
      .ia-header { font-size: 0.6rem; font-weight: 800; color: var(--sm-color-sapphire-400); margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.3rem; }
      p { margin: 0; font-size: 0.8rem; line-height: 1.4; color: #d1d5db; }
    }

    .summary { font-size: 0.82rem; color: white; line-height: 1.4; margin: 0; }
    .summary-muted { font-size: 0.75rem; color: var(--sm-color-text-soft); margin: 0; }

    .client-info { display: flex; gap: 1rem; .info-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: var(--sm-color-text-soft); } }

    .assigned-tech { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; color: #3498db; margin-top: 0.75rem; font-weight: 600; }

    .card-footer {
      padding: 0.75rem 1rem 1rem; border-top: 1px solid rgba(255,255,255,0.05);
      .full-width-select { width: 100%; font-size: 0.8rem; }
      .action-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; 
        button { font-size: 0.7rem; font-weight: 700; height: 34px; }
      }
      &.single-action button { width: 100%; font-weight: 700; height: 36px; font-size: 0.75rem; }
    }

    .done-check { display: flex; align-items: center; gap: 0.4rem; color: #2ecc71; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.4rem; }
    .date-tag { font-size: 0.65rem; color: var(--sm-color-text-muted); margin-top: 0.5rem; text-align: right; }

    .empty-placeholder { padding: 3rem 1rem; text-align: center; color: var(--sm-color-text-muted); p { font-size: 0.75rem; margin-top: 0.5rem; } }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); } 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  `]
})
export class WorkshopAssignments {
  private workshopsService = inject(WorkshopsService);
  private financeService = inject(FinanceService);
  private snackBar = inject(MatSnackBar);
  private queryClient = injectQueryClient();
  private dialog = inject(MatDialog);
  
  @ViewChild('alertSound') alertSound!: ElementRef<HTMLAudioElement>;

  // Iconos
  protected readonly assignmentsIcon = ClipboardList;
  protected readonly alertIcon = AlertTriangle;
  protected readonly checkIcon = CheckCircle2;
  protected readonly userCheckIcon = UserCheck;
  protected readonly navigationIcon = Navigation;
  protected readonly messageIcon = MessageSquare;
  protected readonly inboxIcon = Inbox;
  protected readonly wrenchIcon = Wrench;
  protected readonly doneIcon = CheckCircle;
  protected readonly refreshIcon = RefreshCw;
  protected readonly searchIcon = Search;
  protected readonly phoneIcon = Phone;
  protected readonly userIcon = User;

  // Filtros (Signals para reactividad)
  searchQuery = signal('');
  filterPrioridad = signal('');

  // Consultas
  assignmentsQuery = injectQuery(() => ({
    queryKey: ['assignments'],
    queryFn: () => lastValueFrom(this.workshopsService.getAssignments()),
    refetchInterval: 10000,
  }));

  techsQuery = injectQuery(() => ({
    queryKey: ['technicians'],
    queryFn: () => lastValueFrom(this.workshopsService.getTechnicians()),
  }));

  // Lógica de Filtrado Local para el Board
  private applyBaseFilters(data: IncidentResponse[]) {
    return data.filter(inc => {
      const q = this.searchQuery().toLowerCase();
      const matchSearch = q ? 
        (inc.id_incidente.toLowerCase().includes(q) || 
         inc.resumen_ia?.toLowerCase().includes(q)) : true;
      const matchPriority = this.filterPrioridad() ? inc.prioridad_incidente === this.filterPrioridad() : true;
      return matchSearch && matchPriority;
    });
  }

  filteredPending = computed(() => 
    this.applyBaseFilters(this.assignmentsQuery.data() || []).filter(i => i.estado_incidente === 'ASIGNADO')
  );

  filteredEnCamino = computed(() => 
    this.applyBaseFilters(this.assignmentsQuery.data() || []).filter(i => ['ACEPTADO', 'EN_CAMINO'].includes(i.estado_incidente))
  );

  filteredInProgress = computed(() => 
    this.applyBaseFilters(this.assignmentsQuery.data() || []).filter(i => i.estado_incidente === 'EN_PROGRESO')
  );

  filteredCompleted = computed(() => 
    this.applyBaseFilters(this.assignmentsQuery.data() || []).filter(i => i.estado_incidente === 'COMPLETADO')
  );

  totalActivos = computed(() => 
    this.filteredEnCamino().length + this.filteredInProgress().length
  );

  // Alerta sonora para nuevas solicitudes
  private lastCount = 0;
  constructor() {
    effect(() => {
      const pending = this.filteredPending().length;
      if (pending > this.lastCount) {
        this.playAlert();
        this.snackBar.open('🚨 NUEVA SOLICITUD DE AUXILIO', 'Ver', { duration: 5000, panelClass: ['snack-important'] });
      }
      this.lastCount = pending;
    });
  }

  playAlert() {
    if (this.alertSound?.nativeElement) {
      this.alertSound.nativeElement.play().catch(e => console.log('Audio blocked:', e));
    }
  }

  // Mutaciones
  acceptMutation = injectMutation(() => ({
    mutationFn: (data: { id: string, techId: string }) => 
      lastValueFrom(this.workshopsService.acceptIncident(data.id, { id_tecnico: data.techId })),
    onSuccess: () => {
      this.snackBar.open('✅ Solicitud aceptada y técnico asignado', 'OK', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['assignments'] });
      this.queryClient.invalidateQueries({ queryKey: ['technicians'] });
    }
  }));

  rejectMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.workshopsService.rejectIncident(id)),
    onSuccess: () => {
      this.snackBar.open('Solicitud rechazada correctamente', 'OK', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['assignments'] });
    }
  }));

  statusMutation = injectMutation(() => ({
    mutationFn: (data: { id: string, status: string }) => 
      lastValueFrom(this.workshopsService.updateIncidentStatus(data.id, { nuevo_estado: data.status })),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['assignments'] });
      this.snackBar.open('Estado actualizado', 'Cerrar', { duration: 2000 });
    }
  }));

  paymentMutation = injectMutation(() => ({
    mutationFn: (data: { id: string, amount: number }) => 
      lastValueFrom(this.financeService.processPayment(data.id, { monto_total: data.amount })),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['assignments'] });
      this.queryClient.invalidateQueries({ queryKey: ['technicians'] });
      this.queryClient.invalidateQueries({ queryKey: ['financial-payments'] });
      this.snackBar.open('✅ Servicio Finalizado y Pago Procesado', 'OK', { duration: 4000 });
    }
  }));

  onAccept(id: string, techId: string) {
    this.acceptMutation.mutate({ id, techId });
  }

  onReject(id: string) {
    if (confirm('¿Está seguro de rechazar esta solicitud? Se asignará a otro taller.')) {
      this.rejectMutation.mutate(id);
    }
  }

  onUpdateStatus(id: string, status: string) {
    this.statusMutation.mutate({ id, status });
  }

  async onFinalizeService(id: string) {
    const { ProcessPaymentDialog } = await import('@features/finance/dialogs/process-payment-dialog.component');
    const dialogRef = this.dialog.open(ProcessPaymentDialog, {
      data: { incidentId: id },
      width: '400px',
      disableClose: true
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
    if (result) {
      this.paymentMutation.mutate({ id, amount: result });
    }
  }
}
