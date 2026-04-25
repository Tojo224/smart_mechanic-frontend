export interface GlobalStats {
  total_talleres: number;
  total_incidentes: number;
  total_comisiones: number;
  emergencias_activas: number;
  rendimiento_operativo: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
  puntos_calor: [number, number, number][]; // [lat, lng, intensidad]
}

export interface AuditLog {
  id_bitacora: string;
  id_usuario: string;
  nombre_usuario?: string;
  accion: string;
  descripcion?: string;
  ip: string;
  fecha_hora: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
