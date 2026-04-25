import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncidentResponse } from '@core/models/workshops.model';

@Injectable({
  providedIn: 'root'
})
export class EmergenciesService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v1/emergencies';

  /**
   * Obtiene todos los incidentes globales (Solo SuperAdmin)
   */
  getAllIncidents(): Observable<IncidentResponse[]> {
    return this.http.get<IncidentResponse[]>(`${this.API_URL}/`);
  }

  /**
   * Obtiene el detalle de un incidente
   */
  getIncidentById(id: string): Observable<IncidentResponse> {
    return this.http.get<IncidentResponse>(`${this.API_URL}/${id}`);
  }
}
