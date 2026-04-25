import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent, LoadingStateComponent } from '@shared/ui';
import { User } from 'lucide-angular';
import { ProfileForm } from '@features/identity/components/profile-form/profile-form';
import { UserProfileUpdate, UserResponse } from '@core/models/identity.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, PageHeaderComponent, ProfileForm, LoadingStateComponent],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Mi Perfil" 
        subtitle="Gestiona tu información personal y preferencias de seguridad."
        [icon]="userIcon">
      </app-page-header>
      
      <div class="card-container">
        @if (user()) {
          <app-profile-form 
            [user]="user()" 
            (updateProfile)="onProfileUpdate($event)">
          </app-profile-form>
        } @else {
          <app-loading-state message="Cargando perfil..."></app-loading-state>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .card-container {
      background: var(--sm-color-gunmetal-850, #1c1f24);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
  `]
})
export class Profile {
  readonly userIcon = User;

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
