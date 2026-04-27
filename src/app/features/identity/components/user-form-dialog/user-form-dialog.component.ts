import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, User, Mail, Phone, Lock, Briefcase, Warehouse } from 'lucide-angular';
import { AuthStore } from '@features/identity/auth/state/auth.store';
import { WorkshopSelectorComponent } from '../workshop-selector/workshop-selector.component';
import { WorkshopsService } from '@features/workshops/data-access/workshops.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    LucideAngularModule,
    WorkshopSelectorComponent
  ],
  template: `
    <div class="dialog-container">
      <header class="dialog-header">
        <div class="header-icon">
          <lucide-icon [img]="userIcon" [size]="24"></lucide-icon>
        </div>
        <div class="header-text">
          <h2>Nuevo Usuario</h2>
          <p>Registra personal o clientes en la plataforma</p>
        </div>
      </header>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="premium-form">
        <mat-dialog-content>
          <div class="form-grid">
            <!-- Nombre -->
            <mat-form-field appearance="outline">
              <mat-label>Nombre Completo</mat-label>
              <input matInput formControlName="nombre" placeholder="Ej. Juan Pérez">
              <lucide-icon matPrefix [img]="userIcon" [size]="16" class="prefix-icon"></lucide-icon>
            </mat-form-field>

            <!-- Correo -->
            <mat-form-field appearance="outline">
              <mat-label>Correo Electrónico</mat-label>
              <input matInput formControlName="correo" type="email" placeholder="correo@ejemplo.com">
              <lucide-icon matPrefix [img]="mailIcon" [size]="16" class="prefix-icon"></lucide-icon>
            </mat-form-field>

            <!-- Teléfono -->
            <mat-form-field appearance="outline">
              <mat-label>Teléfono (Opcional)</mat-label>
              <input matInput formControlName="telefono" placeholder="+591 ...">
              <lucide-icon matPrefix [img]="phoneIcon" [size]="16" class="prefix-icon"></lucide-icon>
            </mat-form-field>

            <!-- Contraseña -->
            <mat-form-field appearance="outline">
              <mat-label>Contraseña Inicial</mat-label>
              <input matInput formControlName="contrasena" type="password" placeholder="Mínimo 6 caracteres">
              <lucide-icon matPrefix [img]="lockIcon" [size]="16" class="prefix-icon"></lucide-icon>
            </mat-form-field>

            <!-- Rol -->
            <mat-form-field appearance="outline">
              <mat-label>Rol del Usuario</mat-label>
              <mat-select formControlName="rol_nombre">
                @if (isSuperAdmin()) {
                  <mat-option value="superadmin">SuperAdmin</mat-option>
                  <mat-option value="admin_taller">Administrador de Taller</mat-option>
                }
                <mat-option value="tecnico">Técnico Mecánico</mat-option>
                <mat-option value="cliente">Cliente</mat-option>
              </mat-select>
              <lucide-icon matPrefix [img]="briefcaseIcon" [size]="16" class="prefix-icon"></lucide-icon>
            </mat-form-field>

            <!-- Selector de Taller (Solo si es SuperAdmin y elige tecnico/admin_taller) -->
            @if (showWorkshopSelector()) {
              <div class="workshop-field">
                <label class="field-label">Vincular a Taller</label>
                <app-workshop-selector 
                  [workshops]="workshopsQuery.data() || []"
                  [isLoading]="workshopsQuery.isLoading()"
                  (workshopChanged)="onWorkshopChange($event)">
                </app-workshop-selector>
                <input type="hidden" formControlName="id_taller">
              </div>
            }
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="userForm.invalid">
            Crear Usuario
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 0.5rem; background: var(--sm-color-bg-dark); }
    .dialog-header { 
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
      .header-icon { 
        width: 48px; height: 48px; border-radius: 12px; background: rgba(var(--sm-rgb-sapphire-500), 0.1); 
        color: var(--sm-color-sapphire-400); display: flex; align-items: center; justify-content: center;
      }
      h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: white; }
      p { margin: 0; font-size: 0.85rem; color: var(--sm-color-text-muted); }
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0.5rem 0; }
    .workshop-field { grid-column: span 2; margin-top: 0.5rem; }
    .field-label { display: block; font-size: 0.75rem; color: var(--sm-color-text-muted); margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; }
    .prefix-icon { color: var(--sm-color-text-muted); margin-right: 0.5rem; }
    mat-dialog-actions { padding: 1.5rem; }
    @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class UserFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private authStore = inject(AuthStore);
  private workshopsService = inject(WorkshopsService);

  protected readonly userIcon = User;
  protected readonly mailIcon = Mail;
  protected readonly phoneIcon = Phone;
  protected readonly lockIcon = Lock;
  protected readonly briefcaseIcon = Briefcase;
  protected readonly warehouseIcon = Warehouse;

  isSuperAdmin = signal(this.authStore.user()?.rol_nombre === 'superadmin');

  userForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.maxLength(20)]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    rol_nombre: ['', [Validators.required]],
    id_taller: [null]
  });

  workshopsQuery = injectQuery(() => ({
    queryKey: ['all-workshops'],
    queryFn: () => lastValueFrom(this.workshopsService.getAllWorkshops()),
    enabled: this.isSuperAdmin()
  }));

  showWorkshopSelector(): boolean {
    const rol = this.userForm.get('rol_nombre')?.value;
    return this.isSuperAdmin() && (rol === 'tecnico' || rol === 'admin_taller');
  }

  onWorkshopChange(id: string | null) {
    this.userForm.patchValue({ id_taller: id });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }
}
