import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileForm } from '@features/identity/components/profile-form/profile-form';
import { UserProfileUpdate, UserResponse } from '@core/models/identity.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ProfileForm],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Mi Perfil</h2>
        <p>Administra tu información personal y datos de contacto.</p>
      </div>
      
      <div class="card-container">
        @if (user()) {
          <app-profile-form 
            [user]="user()" 
            (updateProfile)="onProfileUpdate($event)">
          </app-profile-form>
        } @else {
          <div class="loading-state">Cargando perfil...</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
    }
    .page-header {
      margin-bottom: 24px;
      h2 {
        margin: 0 0 8px;
        color: var(--sm-color-text-title, #fff);
        font-size: 24px;
      }
      p {
        margin: 0;
        color: var(--sm-color-text-soft, #ccc);
      }
    }
    .card-container {
      background: var(--sm-color-gunmetal-850, #1c1f24);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .loading-state {
      padding: 40px;
      text-align: center;
      color: var(--sm-color-text-muted, #999);
    }
  `]
})
export class Profile {
  // TODO: Inject query for user profile data

  // Mock initial data for UI building
  user = signal<UserResponse | null>({
    id_usuario: '123-abc',
    nombre: 'Juan Perez',
    correo: 'juan@taller.com',
    telefono: '12345678',
    rol_nombre: 'admin_taller',
    estado: true
  });

  onProfileUpdate(update: UserProfileUpdate) {
    console.log('Update Profile in Smart Component:', update);
    // TODO: Connect mutation PUT /api/v1/identity/users/me
  }
}
