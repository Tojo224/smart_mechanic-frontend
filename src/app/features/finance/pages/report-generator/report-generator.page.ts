import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../data-access/finance.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { LucideAngularModule, Download, FileBarChart, Calendar } from 'lucide-angular';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="title-section">
          <h1>Generador de Reportes</h1>
          <p>Exporta tu historial financiero y contable en formato PDF.</p>
        </div>
      </header>

      <div class="generator-grid">
        <mat-card class="form-card sm-glass-card">
          <div class="card-header">
            <lucide-icon [img]="calendarIcon" [size]="20"></lucide-icon>
            <h3>Rango de Fecha</h3>
          </div>
          
          <form [formGroup]="range" class="date-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Selecciona un periodo</mat-label>
              <mat-date-range-input [rangePicker]="picker">
                <input matStartDate formControlName="start" placeholder="Inicio">
                <input matEndDate formControlName="end" placeholder="Fin">
              </mat-date-range-input>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-date-range-picker #picker></mat-date-range-picker>
            </mat-form-field>

            <button 
              mat-flat-button 
              color="primary" 
              class="generate-btn"
              [disabled]="range.invalid || isGenerating()"
              (click)="generatePDF()"
            >
              @if (isGenerating()) {
                Cargando...
              } @else {
                <lucide-icon [img]="downloadIcon" [size]="18"></lucide-icon>
                Generar Reporte PDF
              }
            </button>
          </form>
        </mat-card>

        <mat-card class="preview-card sm-glass-card">
          <div class="preview-content">
            <lucide-icon [img]="previewIcon" [size]="48" class="preview-icon"></lucide-icon>
            <h3>Resumen Contable</h3>
            <p>El reporte incluirá todos los servicios completados, desglosando el ingreso bruto y la comisión de la plataforma (10%) del periodo seleccionado.</p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 2.5rem; h1 { margin: 0; font-size: 2rem; font-weight: 800; } p { color: var(--sm-color-text-soft); } }

    .generator-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 2rem;
    }

    .form-card {
      padding: 1.5rem;
      .card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; h3 { margin: 0; font-size: 1.1rem; } }
    }

    .date-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .full-width { width: 100%; }

    .generate-btn {
      padding: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .preview-card {
      padding: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      
      .preview-content {
        max-width: 400px;
        .preview-icon { color: var(--sm-color-sapphire-400); margin-bottom: 1.5rem; opacity: 0.5; }
        h3 { color: white; font-size: 1.4rem; margin-bottom: 1rem; }
        p { color: var(--sm-color-text-soft); font-size: 0.9rem; line-height: 1.6; }
      }
    }

    @media (max-width: 768px) {
      .generator-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportGeneratorPage {
  private financeService = inject(FinanceService);
  
  isGenerating = signal(false);
  
  readonly downloadIcon = Download;
  readonly previewIcon = FileBarChart;
  readonly calendarIcon = Calendar;

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  async generatePDF() {
    const { start, end } = this.range.value;
    if (!start || !end) return;

    this.isGenerating.set(true);
    
    try {
      const payments = await new Promise<any[]>((resolve) => {
        this.financeService.getFinancialReports().subscribe(resolve);
      });

      // Filtrar por fecha
      const filtered = payments.filter(p => {
        const date = new Date(p.fecha_pago);
        return date >= start && date <= end;
      });

      const doc = new jsPDF();
      
      // Header - Branding
      doc.setFillColor(26, 32, 44); // Gunmetal color
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('SMART MECHANIC', 14, 25);
      
      doc.setFontSize(10);
      doc.text('REPORTE FINANCIERO DE TALLER', 14, 33);
      
      doc.setTextColor(100, 100, 100);
      doc.text(`Periodo: ${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`, 140, 25);
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 140, 31);

      // Totales
      const totalBruto = filtered.reduce((acc, p) => acc + p.monto, 0);
      const totalComision = filtered.reduce((acc, p) => acc + p.monto_comision, 0);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Resumen del Periodo', 14, 55);
      
      doc.setFontSize(11);
      doc.text(`Total Ingresos Brutos: $${totalBruto.toFixed(2)}`, 14, 65);
      doc.text(`Total Comisiones (10%): $${totalComision.toFixed(2)}`, 14, 72);
      doc.text(`Total a Liquidar: $${(totalBruto - totalComision).toFixed(2)}`, 14, 79);

      // Tabla de Servicios
      const tableData = filtered.map(p => [
        format(new Date(p.fecha_pago), 'dd/MM/yy HH:mm'),
        `ID-${p.id_incidente.substring(0,8)}`,
        p.estado_pago,
        `$${p.monto.toFixed(2)}`,
        `$${p.monto_comision.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 90,
        head: [['Fecha', 'Incidente', 'Método', 'Monto Total', 'Comisión']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
      });

      doc.save(`Reporte_Smart_Mechanic_${format(start, 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      this.isGenerating.set(false);
    }
  }
}
