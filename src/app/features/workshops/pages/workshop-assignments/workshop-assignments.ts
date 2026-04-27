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
      <div class="page-container">
        <app-page-header 
          title="Panel de Auxilios" 
          subtitle="Monitoreo de incidentes en tiempo real y despacho inteligente de técnicos."
          [icon]="assignmentsIcon">
          <div actions>
            <button mat-flat-button class="refresh-btn-premium" (click)="assignmentsQuery.refetch()">
              <lucide-icon [img]="refreshIcon" [size]="16"></lucide-icon>
              Sincronizar
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
                        <span class="time-tag">NUEVA</span>
                      </div>
                      
                      <div class="ia-summary">
                        <div class="ia-header">
                          <lucide-icon [img]="messageIcon" [size]="12"></lucide-icon>
                          ANÁLISIS INTELIGENTE
                        </div>
                        <p>{{ inc.resumen_ia || 'Analizando evidencias...' }}</p>
                      </div>

                      <div class="client-info">
                        <div class="info-item">
                          <lucide-icon [img]="phoneIcon" [size]="12"></lucide-icon>
                          {{ inc.telefono || 'Sin contacto' }}
                        </div>
                      </div>
                    </div>

                    <div class="card-footer">
                      <mat-form-field appearance="outline" class="full-width-select sm-dark-field">
                        <mat-select #techSelect placeholder="Seleccionar Técnico">
                          @for (tech of techsQuery.data(); track tech.id_tecnico) {
                            <mat-option [value]="tech.id_tecnico" [disabled]="!tech.estado">
                              <div class="tech-option">
                                <span>{{ tech.nombre }}</span>
                                @if (!tech.estado) { <span class="busy-tag">Ocupado</span> }
                              </div>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      
                      <div class="action-buttons">
                        <button mat-flat-button color="primary" 
                                [disabled]="!techSelect.value || acceptMutation.isPending()"
                                (click)="onAccept(inc.id_incidente, techSelect.value)">
                          <div class="btn-content">
                            @if (acceptMutation.isPending()) {
                              <lucide-icon [img]="refreshIcon" class="spin" [size]="14"></lucide-icon>
                            } @else {
                              <span>ACEPTAR</span>
                            }
                          </div>
                        </button>
                        <button mat-button class="reject-btn" (click)="onReject(inc.id_incidente)">
                          RECHAZAR
                        </button>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <app-empty-state 
                    [icon]="assignmentsIcon" 
                    title="Todo despejado" 
                    message="No hay incidentes pendientes. Buen trabajo.">
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
      height: calc(100vh - 64px); display: flex; flex-direction: column; background: radial-gradient(circle at top right, #0f172a, #020617); 
    }
    .page-container { padding: 2rem; max-width: 1800px; margin: 0 auto; animation: fadeIn 0.4s ease-out; display: flex; flex-direction: column; height: 100%; }

    .kanban-filters {
      margin: 1rem 0 2rem; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1.5rem;
      border-radius: 20px;
      .search-box { display: flex; align-items: center; gap: 0.75rem; flex: 1; max-width: 400px; background: rgba(255,255,255,0.03); padding: 0.6rem 1.2rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);
        input { background: none; border: none; color: white; outline: none; font-size: 0.9rem; width: 100%; &::placeholder { color: rgba(255,255,255,0.3); } }
        lucide-icon { color: var(--sm-color-sapphire-400); }
      }
      .filter-select { height: 48px; width: 150px; font-size: 0.85rem; }
      .board-stats { margin-left: auto; display: flex; gap: 1.5rem; .stat { font-size: 0.8rem; color: var(--sm-color-text-soft); b { color: var(--sm-color-sapphire-400); margin-right: 0.2rem; } } }
    }

    .kanban-board {
      flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; overflow: hidden; padding-bottom: 1rem;
    }

    .kanban-column {
      display: flex; flex-direction: column; background: rgba(255,255,255,0.015); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
      
      .column-header {
        padding: 1.25rem; display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);
        h2 { margin: 0; font-size: 0.8rem; font-weight: 800; color: white; flex: 1; text-transform: uppercase; letter-spacing: 0.1em; }
        .count { padding: 0.2rem 0.75rem; border-radius: 10px; font-size: 0.75rem; font-weight: 900; background: rgba(255,255,255,0.05); color: var(--sm-color-text-soft); }
      }

      &.incoming { border-top: 4px solid #f87171; .column-header lucide-icon { color: #f87171; } .count { background: rgba(248,113,113,0.1); color: #f87171; } }
      &.on-way { border-top: 4px solid #60a5fa; .column-header lucide-icon { color: #60a5fa; } .count { background: rgba(96,165,250,0.1); color: #60a5fa; } }
      &.in-progress { border-top: 4px solid #fbbf24; .column-header lucide-icon { color: #fbbf24; } .count { background: rgba(251,191,36,0.1); color: #fbbf24; } }
      &.done { border-top: 4px solid #34d399; .column-header lucide-icon { color: #34d399; } .count { background: rgba(52,211,153,0.1); color: #34d399; } }
    }

    .column-content {
      flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    }

    .kanban-card {
      background: rgba(30, 41, 59, 0.4); border-radius: 18px; border: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(8px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { border-color: rgba(var(--sm-rgb-sapphire-400), 0.4); transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.5); }
      &.new-alert { animation: slideIn 0.4s ease-out; box-shadow: 0 0 20px -5px rgba(248,113,113,0.2); }
      &.card-done { opacity: 0.6; }
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
    this.applyBaseFilters(this.assignmentsQuery.data() || []).filter(i => 
      ['TALLER_ASIGNADO', 'ASIGNADO', 'ANALIZADO'].includes(i.estado_incidente)
    )
  );

  filteredEnCamino = computed(() => 
    this.applyBaseFilters(this.assignmentsQuery.data() || []).filter(i => 
      ['ACEPTADO', 'EN_CAMINO', 'TECNICO_ASIGNADO'].includes(i.estado_incidente)
    )
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

  constructor() {}

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
