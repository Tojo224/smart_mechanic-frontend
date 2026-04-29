import { Component, inject, AfterViewInit, ElementRef, ViewChild, OnDestroy, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MonitoringService } from '../../data-access/monitoring.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule, Activity, Users, DollarSign, AlertTriangle, Map as MapIcon, TrendingUp, Info } from 'lucide-angular';
import { Chart, registerables } from 'chart.js';
import type * as L from 'leaflet';
import { toObservable } from '@angular/core/rxjs-interop';
import { GlobalStats } from '../../models/monitoring.model';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';

type HeatPoint = [number, number, number?];
type HeatLayerOptions = {
  minOpacity?: number;
  maxZoom?: number;
  max?: number;
  radius?: number;
  blur?: number;
  gradient?: Record<number, string>;
};
type LeafletWithHeat = typeof L & {
  heatLayer: (latlngs: HeatPoint[], options?: HeatLayerOptions) => L.Layer;
};

Chart.register(...registerables);

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    LucideAngularModule,
    PageHeaderComponent,
    LoadingStateComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Centro de Mando"
        subtitle="Monitoreo estratégico de la red de asistencia y rendimiento del negocio en tiempo real.">
        <div actions>
          <div class="header-status">
            <div class="live-indicator">
              <span class="pulse-dot"></span>
              INTELIGENCIA ACTIVA
            </div>
          </div>
        </div>
      </app-page-header>

      @if (statsQuery.isLoading()) {
        <app-loading-state message="Cargando inteligencia de negocio..."></app-loading-state>
      } @else if (statsQuery.data(); as stats) {
        <!-- Mini Stats -->
        <div class="mini-stats-grid">
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap sapphire"><lucide-icon [img]="talleresIcon" [size]="20"></lucide-icon></div>
            <div class="info">
              <span class="label">Talleres</span>
              <span class="value">{{ stats.total_talleres }}</span>
            </div>
            <div class="trend positive">+12%</div>
          </div>
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap emerald"><lucide-icon [img]="incidentsIcon" [size]="20"></lucide-icon></div>
            <div class="info">
              <span class="label">Total Auxilios</span>
              <span class="value">{{ stats.total_incidentes }}</span>
            </div>
            <div class="trend positive">+5%</div>
          </div>
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap orange"><lucide-icon [img]="revenueIcon" [size]="20"></lucide-icon></div>
            <div class="info">
              <span class="label">Comisiones</span>
              <span class="value">{{ stats.total_comisiones | currency:'Bs ' }}</span>
            </div>
            <div class="trend positive">+18%</div>
          </div>
          <div class="stat-box sm-glass-card">
            <div class="icon-wrap red"><lucide-icon [img]="activeIcon" [size]="20"></lucide-icon></div>
            <div class="info">
              <span class="label">Activos Hoy</span>
              <span class="value">{{ stats.emergencias_activas }}</span>
            </div>
            <div class="trend warning">Crit.</div>
          </div>
        </div>

        <div class="main-grid">
          <!-- Gráfico de Rendimiento -->
          <mat-card class="chart-card sm-glass-card">
            <div class="card-header">
              <div class="title-with-icon">
                <lucide-icon [img]="trendIcon" [size]="18"></lucide-icon>
                <h3>Rendimiento Operativo</h3>
              </div>
              <lucide-icon [img]="infoIcon" [size]="14" class="info-icon" matTooltip="Evolución de comisiones e incidentes"></lucide-icon>
            </div>
            <div class="chart-container">
              <canvas #performanceChart></canvas>
            </div>
          </mat-card>

          <!-- Mapa de Calor -->
          <mat-card class="map-card sm-glass-card">
            <div class="card-header">
              <div class="title-with-icon">
                <lucide-icon [img]="mapIcon" [size]="18"></lucide-icon>
                <h3>Densidad de Emergencias</h3>
              </div>
              <div class="map-legend">
                <span class="legend-item"><span class="dot low"></span>Baja</span>
                <span class="legend-item"><span class="dot high"></span>Alta</span>
              </div>
            </div>
            <div #heatmapContainer class="heatmap-container" ngSkipHydration></div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }

    .live-indicator { display: flex; align-items: center; gap: 0.6rem; background: rgba(var(--sm-rgb-sapphire-400), 0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: var(--sm-color-sapphire-400); letter-spacing: 0.05em; }
    .pulse-dot { width: 8px; height: 8px; background: var(--sm-color-sapphire-400); border-radius: 50%; box-shadow: 0 0 0 0 rgba(var(--sm-rgb-sapphire-400), 0.7); animation: pulse 1.5s infinite; }

    .mini-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-box { padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; position: relative; overflow: hidden;
      .icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
        &.sapphire { background: rgba(var(--sm-rgb-sapphire-400), 0.15); color: var(--sm-color-sapphire-400); }
        &.emerald { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
        &.orange { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
        &.red { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }
      }
      .info { display: flex; flex-direction: column; gap: 0.2rem;
        .label { font-size: 0.7rem; color: var(--sm-color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .value { font-size: 1.6rem; font-weight: 800; color: white; }
      }
      .trend { position: absolute; top: 1.5rem; right: 1.5rem; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px;
        &.positive { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
        &.warning { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }
      }
    }

    .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .chart-card, .map-card { padding: 1.5rem; border: none;
      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; 
        h3 { margin: 0; font-size: 1rem; font-weight: 600; color: white; } 
        .info-icon { color: var(--sm-color-text-muted); cursor: pointer; }
      }
    }

    .title-with-icon { display: flex; align-items: center; gap: 0.75rem; color: var(--sm-color-sapphire-400); }

    .chart-container { height: 350px; position: relative; }
    .heatmap-container { height: 400px; border-radius: 12px; background: #0f172a; z-index: 1; border: 1px solid rgba(255,255,255,0.05); }

    .map-legend { display: flex; gap: 1rem; font-size: 0.7rem; color: var(--sm-color-text-muted); 
      .legend-item { display: flex; align-items: center; gap: 0.3rem; 
        .dot { width: 8px; height: 8px; border-radius: 50%; 
          &.low { background: blue; } &.high { background: red; }
        }
      }
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(var(--sm-rgb-sapphire-400), 0.7); } 70% { box-shadow: 0 0 0 10px rgba(var(--sm-rgb-sapphire-400), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--sm-rgb-sapphire-400), 0); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1200px) { .main-grid { grid-template-columns: 1fr; } }
  `]
})
export class CommandCenterPage implements AfterViewInit, OnDestroy {
  private monitoringService = inject(MonitoringService);
  
  @ViewChild('performanceChart') performanceChartRef!: ElementRef;
  @ViewChild('heatmapContainer') heatmapContainer!: ElementRef;
  private chart: Chart | null = null;
  private map: L.Map | null = null;

  private L: typeof L | undefined;
  private platformId = inject(PLATFORM_ID);

  readonly talleresIcon = Users;
  readonly incidentsIcon = Activity;
  readonly revenueIcon = DollarSign;
  readonly activeIcon = AlertTriangle;
  readonly mapIcon = MapIcon;
  readonly trendIcon = TrendingUp;
  readonly infoIcon = Info;

  statsQuery = injectQuery(() => ({
    queryKey: ['global-stats'],
    queryFn: () => lastValueFrom(this.monitoringService.getGlobalStats()),
    refetchInterval: 60000
  }));

  constructor() {
    // Usamos un efecto reactivo para inicializar componentes cuando los datos y la librería estén listos
    effect(() => {
      const stats = this.statsQuery.data();
      const isBrowser = isPlatformBrowser(this.platformId);
      
      if (isBrowser && stats && this.L) {
        // Pequeño delay para asegurar que el DOM esté estable
        setTimeout(() => {
          this.initChart(stats);
          this.initMap(stats);
        }, 100);
      }
    });
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      await import('leaflet.heat');
    }
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    if (this.map) this.map.remove();
  }

  private initChart(stats: GlobalStats) {
    if (!this.performanceChartRef) return;
    if (this.chart) this.chart.destroy();

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    
    // Gradientes para un look más premium
    const blueGradient = ctx.createLinearGradient(0, 0, 0, 400);
    blueGradient.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
    blueGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');

    const greenGradient = ctx.createLinearGradient(0, 0, 0, 400);
    greenGradient.addColorStop(0, 'rgba(46, 204, 113, 0.4)');
    greenGradient.addColorStop(1, 'rgba(46, 204, 113, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: stats.rendimiento_operativo.labels,
        datasets: stats.rendimiento_operativo.datasets.map((ds, i) => ({
          ...ds,
          borderColor: i === 0 ? '#3498db' : '#2ecc71',
          backgroundColor: i === 0 ? blueGradient : greenGradient,
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 2,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true, 
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 11 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            padding: 12,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            displayColors: true
          }
        },
        scales: {
          y: { 
            grid: { color: 'rgba(255,255,255,0.05)' }, 
            ticks: { color: '#94a3b8', font: { size: 10 } },
            beginAtZero: true
          },
          x: { 
            grid: { display: false }, 
            ticks: { color: '#94a3b8', font: { size: 10 } } 
          }
        }
      }
    });
  }

  private initMap(stats: GlobalStats) {
    if (!this.L || !this.heatmapContainer) return;
    const leafletWithHeat = this.L as LeafletWithHeat;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = this.L.map(this.heatmapContainer.nativeElement, {
      zoomControl: false,
      scrollWheelZoom: false
    }).setView([-17.7833, -63.1821], 13); // Santa Cruz

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO'
    }).addTo(this.map);

    this.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    leafletWithHeat.heatLayer(stats.puntos_calor, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      gradient: { 0.2: '#3498db', 0.5: '#2ecc71', 0.8: '#f1c40f', 1: '#e74c3c' }
    }).addTo(this.map);

    // Forzar recalcular tamaño para evitar pantalla negra en contenedores dinámicos
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }
}
