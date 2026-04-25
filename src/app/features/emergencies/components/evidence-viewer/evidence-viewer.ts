import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvidenceResponse } from '@core/models/emergencies.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-evidence-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './evidence-viewer.html',
  styleUrls: ['./evidence-viewer.scss']
})
export class EvidenceViewer {
  @Input() evidences: EvidenceResponse[] = [];
}
