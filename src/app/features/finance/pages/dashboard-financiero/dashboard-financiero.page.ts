import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../data-access/finance.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, DollarSign, PieChart, CheckCircle, ArrowUpRight, FileText } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-financiero',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    LucideAngularModule,
    RouterLink
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Resumen Financiero</h1>
          <p>Control de ingresos, comisiones y liquidación de servicios.</p>
        </div>
        <div class="actions">
          <button mat-flat-button color="primary" routerLink="../reports">
            <lucide-icon [img]="reportIcon" [size]="18"></lucide-icon>
            Generar Reportes
          </button>
        </div>
      </header>

      @if (summaryQuery.isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Calculando métricas...</p>
        </div>
      } @else if (summaryQuery.data(); as summary) {
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <mat-card class="kpi-card sm-glass-card">
            <div class="kpi-header">
              <div class="icon-wrap sapphire">
                <lucide-icon [img]="incomeIcon" [size]="24"></lucide-icon>
              </div>
              <span class="trend up">
                <lucide-icon [img]="trendIcon" [size]="14"></lucide-icon>
                +12%
              </span>
            </div>
            <div class="kpi-body">
              <span class="label">Ingresos Brutos</span>
              <h2 class="value">{{ summary.ingresos_brutos | currency }}</h2>
            </div>
          </mat-card>

          <mat-card class="kpi-card sm-glass-card">
            <div class="kpi-header">
              <div class="icon-wrap orange">
                <lucide-icon [img]="commissionIcon" [size]="24"></lucide-icon>
              </div>
            </div>
            <div class="kpi-body">
              <span class="label">Comisión a Pagar (10%)</span>
              <h2 class="value">{{ summary.comisiones_pagar | currency }}</h2>
            </div>
          </mat-card>

          <mat-card class="kpi-card sm-glass-card">
            <div class="kpi-header">
              <div class="icon-wrap emerald">
                <lucide-icon [img]="doneIcon" [size]="24"></lucide-icon>
              </div>
            </div>
            <div class="kpi-body">
              <span class="label">Servicios Completados</span>
              <h2 class="value">{{ summary.servicios_completados }}</h2>
            </div>
          </mat-card>
        </div>

        <!-- Recent Transactions -->
        <div class="section-container">
          <div class="section-header">
            <h3>Transacciones Recientes</h3>
          </div>
          <mat-card class="table-card sm-glass-card">
            <table mat-table [dataSource]="summary.recientes" class="modern-table">
              <ng-container matColumnDef="fecha">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let p">{{ p.fecha_pago | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="monto">
                <th mat-header-cell *matHeaderCellDef>Monto Total</th>
                <td mat-cell *matCellDef="let p" class="bold">{{ p.monto | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="comision">
                <th mat-header-cell *matHeaderCellDef>Comisión</th>
                <td mat-cell *matCellDef="let p" class="text-soft">{{ p.monto_comision | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="metodo">
                <th mat-header-cell *matHeaderCellDef>Método</th>
                <td mat-cell *matCellDef="let p">
                  <span class="method-tag">{{ p.metodo_pago }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            @if (summary.recientes.length === 0) {
              <div class="empty-state">
                <p>No hay transacciones registradas este mes.</p>
              </div>
            }
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      
      h1 { margin: 0; font-size: 2rem; font-weight: 800; color: white; }
      p { margin: 0.5rem 0 0; color: var(--sm-color-text-soft); }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .kpi-card {
      padding: 1.5rem;
      border: none;
      
      .kpi-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.sapphire { background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-400); }
        &.orange { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
        &.emerald { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
      }

      .trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.5rem;
        border-radius: 20px;
        &.up { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
      }

      .label { font-size: 0.85rem; color: var(--sm-color-text-soft); text-transform: uppercase; letter-spacing: 0.5px; }
      .value { margin: 0.5rem 0 0; font-size: 2.2rem; font-weight: 800; color: white; }
    }

    .section-container {
      .section-header {
        margin-bottom: 1.25rem;
        h3 { font-size: 1.2rem; color: white; margin: 0; }
      }
    }

    .table-card {
      padding: 0.5rem;
      overflow: hidden;
    }

    .modern-table {
      width: 100%;
      background: transparent;
      
      th { color: var(--sm-color-text-soft); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.05); }
      td { padding: 1.25rem 0.5rem; color: var(--sm-color-text-main); border-bottom: 1px solid rgba(255,255,255,0.02); }
      
      .bold { font-weight: 700; color: white; }
    }

    .method-tag {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
      color: var(--sm-color-text-soft);
    }

    .loading-state {
      padding: 6rem;
      text-align: center;
      color: var(--sm-color-text-soft);
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
      color: var(--sm-color-text-muted);
    }
  `]
})
export class DashboardFinancieroPage {
  private financeService = inject(FinanceService);

  readonly incomeIcon = DollarSign;
  readonly commissionIcon = PieChart;
  readonly doneIcon = CheckCircle;
  readonly trendIcon = ArrowUpRight;
  readonly reportIcon = FileText;

  displayedColumns = ['fecha', 'monto', 'comision', 'metodo'];

  summaryQuery = injectQuery(() => ({
    queryKey: ['financial-summary'],
    queryFn: () => lastValueFrom(this.financeService.getDashboardSummary()),
    refetchInterval: 30000
  }));
}
