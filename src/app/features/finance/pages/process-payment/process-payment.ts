import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../data-access/finance.service';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { PaymentForm } from '../../components/payment-form/payment-form';
import { PaymentSummary } from '../../components/payment-summary/payment-summary';
import { PaymentResponse } from '../../models/finance.model';
import { PaymentRequest } from '@core/models/finance.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '@shared/ui';
import { CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-process-payment-page',
  standalone: true,
  imports: [CommonModule, PaymentForm, PaymentSummary, MatSnackBarModule, PageHeaderComponent],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Procesar Pago" 
        subtitle="Genera la transacción para el servicio de asistencia mecánica."
        [icon]="cardIcon">
      </app-page-header>

      <div class="payment-layout">
        @if (!processedPayment()) {
          <div class="card form-card">
            @if (paymentMutation.isPending()) {
              <div class="overlay">Procesando...</div>
            }
            <app-payment-form 
              [incidentId]="incidentId" 
              [amountSuggested]="amount" 
              (process)="onProcess($event)">
            </app-payment-form>
          </div>
        } @else {
          <div class="card summary-card">
            <app-payment-summary [payment]="processedPayment()!"></app-payment-summary>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .card {
      position: relative;
      background: var(--sm-color-gunmetal-900);
      border-radius: 16px;
      border: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
  `]
})
export class ProcessPayment {
  private route = inject(ActivatedRoute);
  private financeService = inject(FinanceService);
  private snackBar = inject(MatSnackBar);
  readonly cardIcon = CreditCard;

  incidentId = this.route.snapshot.queryParamMap.get('incidentId') || '';
  amount = Number(this.route.snapshot.queryParamMap.get('amount')) || 0;

  processedPayment = signal<PaymentResponse | null>(null);

  paymentMutation = injectMutation(() => ({
    mutationFn: (data: PaymentRequest) => 
      lastValueFrom(this.financeService.processPayment(this.incidentId, { monto_total: data.monto })),
    onSuccess: (res) => {
      this.snackBar.open('¡Transacción iniciada!', 'Cerrar', { duration: 3000 });
      this.processedPayment.set(res);
    },
    onError: () => {
      this.snackBar.open('Error al procesar el pago. Intenta de nuevo.', 'Cerrar', { duration: 5000 });
    }
  }));

  onProcess(data: PaymentRequest) {
    this.paymentMutation.mutate(data);
  }
}
