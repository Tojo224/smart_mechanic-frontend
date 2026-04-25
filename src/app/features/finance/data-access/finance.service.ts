import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable, map } from 'rxjs';
import { FinancialSummary, PaymentCreate, PaymentResponse } from '../models/finance.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/finance`;

  /**
   * Obtiene el listado de pagos filtrado (CU19/CU25)
   */
  getFinancialReports(workshopId?: string): Observable<PaymentResponse[]> {
    const params: any = {};
    if (workshopId) params.workshop_id = workshopId;
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/reports`, { params });
  }

  /**
   * Calcula el resumen financiero para el AdminTaller
   */
  getDashboardSummary(): Observable<FinancialSummary> {
    return this.getFinancialReports().pipe(
      map(payments => {
        const totalBruto = payments.reduce((acc, p) => acc + p.monto, 0);
        const totalComision = payments.reduce((acc, p) => acc + p.monto_comision, 0);
        
        return {
          ingresos_brutos: totalBruto,
          comisiones_pagar: totalComision,
          servicios_completados: payments.length,
          recientes: payments.slice(0, 5)
        };
      })
    );
  }

  /**
   * Procesa el pago y cierra el incidente (Fase 5)
   */
  processPayment(incidentId: string, payment: PaymentCreate): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/emergencies/${incidentId}/pay`, payment);
  }
}
