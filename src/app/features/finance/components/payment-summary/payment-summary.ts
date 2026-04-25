import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentResponse } from '../../models/finance.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './payment-summary.html',
  styleUrls: ['./payment-summary.scss']
})
export class PaymentSummary {
  @Input() payment!: PaymentResponse;
}
