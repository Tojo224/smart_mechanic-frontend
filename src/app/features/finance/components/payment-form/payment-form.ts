import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { PaymentRequest } from '@core/models/finance.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatSelectModule],
  templateUrl: './payment-form.html',
  styleUrls: ['./payment-form.scss']
})
export class PaymentForm {
  @Input() incidentId: string = '';
  @Input() amountSuggested: number = 0;
  @Output() process = new EventEmitter<PaymentRequest>();

  paymentForm: FormGroup;

  methods = [
    { value: 'QR', label: 'Código QR' },
    { value: 'TARJETA', label: 'Tarjeta de Crédito/Débito' },
    { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' }
  ];

  constructor(private fb: FormBuilder) {
    this.paymentForm = this.fb.group({
      monto: [0, [Validators.required, Validators.min(1)]],
      metodo_pago: ['QR', [Validators.required]]
    });
  }

  ngOnChanges() {
    if (this.amountSuggested > 0) {
      this.paymentForm.patchValue({ monto: this.amountSuggested });
    }
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      this.process.emit({
        id_incidente: this.incidentId,
        ...this.paymentForm.value
      });
    }
  }
}
