import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, Sparkles, Bot } from 'lucide-angular';

@Component({
  selector: 'app-ai-report-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideAngularModule
  ],
  templateUrl: './ai-report-assistant.html',
  styleUrls: ['./ai-report-assistant.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiReportAssistantComponent {
  readonly isGenerating = input<boolean>(false);
  readonly generate = output<string>();

  protected readonly sparklesIcon = Sparkles;
  protected readonly botIcon = Bot;

  prompt = signal('');

  onGenerate() {
    if (this.prompt()) {
      this.generate.emit(this.prompt());
      this.prompt.set('');
    }
  }
}
