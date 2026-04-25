export interface TallerCreate {
  nombre: string;
  nit: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  latitud: number;
  longitud: number;
}

export interface TallerResponse {
  id_taller: string;
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  is_active: boolean;
}

export interface StatusUpdate {
  nuevo_estado: string; // Ej: EN_CAMINO, EN_PROGRESO, COMPLETADO
}

export interface IncidentResponse {
  id_incidente: string;
  id_vehiculo: string;
  id_taller: string | null;
  descripcion: string | null;
  telefono: string | null;
  latitud: number;
  longitud: number;
  estado_incidente: string;
  prioridad_incidente: string;
  transcripcion_audio: string | null;
  resumen_ia: string | null;
  analisis_consolidado: string | null;
  fecha_reporte?: string;
  evidencias: any[]; // Simplificado por ahora
}

export interface IncidentDetailResponse {
  id_incidente: string;
  id_vehiculo: string;
  id_taller: string | null;
  descripcion: string | null;
  telefono: string | null;
  latitud?: number;
  longitud?: number;
  estado_incidente: string;
  prioridad_incidente: string;
  transcripcion_audio: string | null;
  resumen_ia: string | null;
  analisis_consolidado: string | null;
  fecha_reporte?: string;
  evidencias: any[]; // Simplificado por ahora
}

export interface TecnicoCreate {
  nombre: string;
  telefono?: string;
}

export interface TecnicoResponse {
  id_tecnico: string;
  id_taller: string;
  nombre: string;
  telefono: string;
  estado: boolean;
}

export interface IncidentAccept {
  id_tecnico: string;
}
