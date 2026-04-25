import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopForm } from '../../components/workshop-form/workshop-form';
import { TallerCreate, TallerResponse } from '@core/models/workshops.model';
import { WorkshopsService } from '../../data-access/workshops.service';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-workshop-page',
  standalone: true,
  imports: [CommonModule, WorkshopForm, MatSnackBarModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Mi Taller</h1>
        <p>Gestiona la información de tu taller mecánico en la plataforma.</p>
      </header>

      @if (myWorkshopQuery.isLoading()) {
        <div class="loading-state">Cargando información...</div>
      } @else if (myWorkshopQuery.data() && !editMode()) {
        <!-- Vista del taller registrado -->
        <div class="card-container workshop-details">
          <div class="details-header">
            <h2>{{ myWorkshopQuery.data()?.nombre }}</h2>
            <span class="status-badge active">Activo</span>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">NIT:</span>
              <span class="value">{{ myWorkshopQuery.data()?.nit }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Teléfono:</span>
              <span class="value">{{ myWorkshopQuery.data()?.telefono || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Email:</span>
              <span class="value">{{ myWorkshopQuery.data()?.email || 'N/A' }}</span>
            </div>
            <div class="detail-item full-width">
              <span class="label">Dirección:</span>
              <span class="value">{{ myWorkshopQuery.data()?.direccion || 'N/A' }}</span>
            </div>
          </div>
          <div class="actions-footer">
            <button class="btn-edit" (click)="enableEditMode()">Editar Datos del Taller</button>
          </div>
        </div>
      } @else {
        <!-- Formulario de Registro o Edición -->
        <div class="card-container">
          @if (mutation.isPending() || updateMutation.isPending()) {
            <div class="loading-overlay">Guardando taller...</div>
          }
          
          @if (editMode()) {
            <div class="edit-header">
              <h3>Modo Edición</h3>
              <button class="btn-cancel" (click)="cancelEdit()">Cancelar</button>
            </div>
          }

          <app-workshop-form 
            [initialData]="myWorkshopQuery.data() || null"
            (save)="onSave($event)">
          </app-workshop-form>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 2rem; color: var(--sm-color-text-title); }
      p { margin: 0.5rem 0 0; color: var(--sm-color-text-soft); }
    }
    .card-container {
      position: relative;
      background: var(--sm-color-gunmetal-900);
      border-radius: 12px;
      border: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .loading-overlay, .loading-state {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      backdrop-filter: blur(2px);
      color: white;
    }
    .loading-state {
      position: relative;
      padding: 3rem;
      background: transparent;
      backdrop-filter: none;
    }
    
    .workshop-details {
      padding: 2rem;
      
      .details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--sm-color-border);
        
        h2 {
          margin: 0;
          color: var(--sm-color-sapphire-300);
        }
        
        .status-badge {
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(var(--sm-rgb-slate-400), 0.2);
          color: var(--sm-color-text-muted);
          
          &.active {
            background: rgba(46, 204, 113, 0.2);
            color: #2ecc71;
            border: 1px solid rgba(46, 204, 113, 0.4);
          }
        }
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          
          &.full-width {
            grid-column: 1 / -1;
          }
          
          .label {
            font-size: 0.8rem;
            color: var(--sm-color-text-soft);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .value {
            font-size: 1.05rem;
            color: var(--sm-color-text-main);
          }
        }
      }
    .actions-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--sm-color-border);
      display: flex;
      justify-content: flex-end;
      
      .btn-edit {
        background: var(--sm-color-sapphire-600);
        color: white;
        border: none;
        padding: 0.5rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: var(--sm-color-sapphire-500);
        }
      }
      }
    }

    .edit-header {
      padding: 1rem 1.5rem;
      background: rgba(var(--sm-rgb-sapphire-500), 0.1);
      border-bottom: 1px solid var(--sm-color-sapphire-900);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 { margin: 0; color: var(--sm-color-sapphire-300); }
      
      .btn-cancel {
        background: transparent;
        color: var(--sm-color-text-muted);
        border: 1px solid var(--sm-color-border);
        padding: 0.25rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        
        &:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }
      }
    }
  `]
})
export class RegisterWorkshop {
  private workshopsService = inject(WorkshopsService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private queryClient = injectQueryClient();

  editMode = signal(false);

  myWorkshopQuery = injectQuery(() => ({
    queryKey: ['my-workshop'],
    queryFn: () => lastValueFrom(this.workshopsService.getMyWorkshop()),
    retry: false, // No reintentar si da 404
  }));

  mutation = injectMutation(() => ({
    mutationFn: (data: TallerCreate) => lastValueFrom(this.workshopsService.createWorkshop(data)),
    onSuccess: () => {
      this.snackBar.open('¡Taller registrado con éxito!', 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['my-workshop'] });
    },
    onError: (error) => {
      this.snackBar.open('Error al registrar el taller. Revisa los datos.', 'Cerrar', { duration: 5000 });
      console.error('Error mutation:', error);
    }
  }));

  updateMutation = injectMutation(() => ({
    mutationFn: (data: TallerCreate) => lastValueFrom(this.workshopsService.updateMyWorkshop(data)),
    onSuccess: () => {
      this.snackBar.open('¡Datos del taller actualizados!', 'Cerrar', { duration: 3000 });
      this.queryClient.invalidateQueries({ queryKey: ['my-workshop'] });
      this.editMode.set(false);
    },
    onError: (error) => {
      this.snackBar.open('Error al actualizar el taller. Revisa los datos.', 'Cerrar', { duration: 5000 });
      console.error('Error update mutation:', error);
    }
  }));

  enableEditMode() {
    this.editMode.set(true);
  }

  cancelEdit() {
    this.editMode.set(false);
  }

  onSave(data: TallerCreate) {
    if (this.editMode()) {
      this.updateMutation.mutate(data);
    } else {
      this.mutation.mutate(data);
    }
  }
}
