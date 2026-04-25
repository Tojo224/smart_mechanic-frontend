export interface PaymentRequest {
  id_incidente: string;
  monto: number;
  metodo_pago: 'QR' | 'TARJETA' | 'TRANSFERENCIA';
}

export interface PaymentResponse {
  id_pago: string;
  id_incidente: string;
  monto: number;
  estado_pago: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO';
  fecha_pago: string;
  transaccion_id?: string;
  qr_code_url?: string; // En caso de que el backend genere un QR
}
