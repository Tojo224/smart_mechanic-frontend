import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface LoginCredentials {
  correo: string;
  contrasena: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  @Output() onSubmitCredentials = new EventEmitter<LoginCredentials>();

  private fb = inject(FormBuilder);
  public loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  submitForm() {
    if (this.loginForm.valid) {
      this.onSubmitCredentials.emit(this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}