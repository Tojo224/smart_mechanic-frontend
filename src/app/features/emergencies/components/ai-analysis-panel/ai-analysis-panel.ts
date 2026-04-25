import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisResponse } from '@core/models/emergencies.model';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ai-analysis-panel',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  templateUrl: './ai-analysis-panel.html',
  styleUrls: ['./ai-analysis-panel.scss']
})
export class AiAnalysisPanel {
  @Input() analysis: string | null = null;

  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }
}
