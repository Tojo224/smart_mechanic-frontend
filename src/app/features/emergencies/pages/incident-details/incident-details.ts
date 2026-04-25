import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmergenciesService } from '../../data-access/emergencies.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { IncidentDetailsCard } from '../../components/incident-details-card/incident-details-card';
import { EvidenceViewer } from '../../components/evidence-viewer/evidence-viewer';
import { AiAnalysisPanel } from '../../components/ai-analysis-panel/ai-analysis-panel';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';
import { LucideAngularModule, Siren } from 'lucide-angular';

@Component({
  selector: 'app-incident-details-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    IncidentDetailsCard, 
    EvidenceViewer, 
    AiAnalysisPanel,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    LoadingStateComponent,
    LucideAngularModule
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Detalles del Incidente" 
        subtitle="Información detallada y análisis de la emergencia mecánica."
        [icon]="sirenIcon">
        <button prefix mat-icon-button routerLink="/workshops/assignments" aria-label="Volver">
          <mat-icon>arrow_back</mat-icon>
        </button>
      </app-page-header>

      @if (incidentQuery.isPending()) {
        <app-loading-state message="Consultando detalles del incidente..."></app-loading-state>
      } @else if (incidentQuery.isError()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se pudo cargar la información. El incidente no existe o no tienes permisos.</p>
          <button mat-flat-button color="primary" (click)="incidentQuery.refetch()">Reintentar</button>
        </div>
      } @else {
        <div class="details-layout">
          <div class="main-column">
            <div class="card">
              <app-incident-details-card [incident]="incidentQuery.data()!"></app-incident-details-card>
            </div>
            
            <div class="card">
              <app-evidence-viewer [evidences]="incidentQuery.data()!.evidencias"></app-evidence-viewer>
            </div>
          </div>

          <div class="side-column">
            <div class="card">
              <app-ai-analysis-panel [analysis]="incidentQuery.data()!.analisis_consolidado"></app-ai-analysis-panel>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }

    .details-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;

      @media (min-width: 1200px) {
        grid-template-columns: 1fr 400px;
      }
    }

    .main-column {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card {
      background: var(--sm-color-gunmetal-900);
      border-radius: 12px;
      border: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .error-state {
      padding: 3rem;
      text-align: center;
      background: rgba(var(--sm-rgb-slate-400), 0.05);
      border-radius: 12px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--sm-color-crimson-500); margin-bottom: 1rem; }
      p { color: var(--sm-color-text-soft); margin-bottom: 1.5rem; }
    }

    .spin {
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class IncidentDetails {
  private route = inject(ActivatedRoute);
  private emergenciesService = inject(EmergenciesService);

  incidentId = this.route.snapshot.paramMap.get('id') || '';

  incidentQuery = injectQuery(() => ({
    queryKey: ['incident', this.incidentId],
    queryFn: () => lastValueFrom(this.emergenciesService.getIncidentById(this.incidentId)),
    enabled: !!this.incidentId
  }));

  readonly sirenIcon = Siren;
}
