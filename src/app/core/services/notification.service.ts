import { Injectable, inject, effect } from '@angular/core';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { injectQueryClient } from '@tanstack/angular-query-experimental';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authStore = inject(AuthStore);
  private queryClient = injectQueryClient();
  private socket: WebSocket | null = null;

  constructor() {
    // Re-conectar automáticamente si el usuario cambia (login/logout)
    effect(() => {
      const token = this.authStore.accessToken();
      if (token) {
        this.connect(token);
      } else {
        this.disconnect();
      }
    });
  }

  private connect(token: string) {
    if (this.socket) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Extraemos solo el host (ej. localhost:8000) de la apiUrl para el WS
    // Esto evita que el WS intente conectar a /api/v1/ws si la apiUrl tiene prefijo
    const url = new URL(environment.apiUrl);
    const host = url.host;
    
    this.socket = new WebSocket(`${protocol}//${host}/ws?token=${token}`);

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('🔔 Notificación recibida:', message);
        this.handleMessage(message);
      } catch (e) {
        console.error('Error al parsear mensaje WS:', e);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      // Reintento de conexión después de 5 segundos
      setTimeout(() => {
        const currentToken = this.authStore.accessToken();
        if (currentToken) this.connect(currentToken);
      }, 5000);
    };
  }

  private disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private handleMessage(message: any) {
    // Aquí es donde ocurre la magia: invalidamos las queries afectadas
    // para que TanStack Query refresque la data al INSTANTE
    
    // 1. Refrescar asignaciones del taller
    this.queryClient.invalidateQueries({ queryKey: ['assignments'] });
    
    // 2. Refrescar monitor global del admin
    this.queryClient.invalidateQueries({ queryKey: ['global-incidents'] });
    
    // 3. Refrescar incidentes del home
    this.queryClient.invalidateQueries({ queryKey: ['home-recent-incidents'] });

    // Opcional: Podríamos disparar un sonido aquí si quisiéramos ser más específicos
  }
}
