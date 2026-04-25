import { IncidentResponse } from '@core/models/workshops.model';

export interface PaymentResponse {
  id_pago: string;
  id_incidente: string;
  id_taller: string;
  monto: number;
  monto_comision: number;
  estado_pago: string;
  fecha_pago: string;
  transaccion_id?: string;
  qr_code_url?: string;
  incidente?: IncidentResponse;
}

export interface PaymentCreate {
  monto_total: number;
}

export interface FinancialSummary {
  ingresos_brutos: number;
  comisiones_pagar: number;
  servicios_completados: number;
  recientes: PaymentResponse[];
}
