import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { UserProfileUpdate, UserResponse } from '../../../../core/models/identity.model';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule
  ],
  templateUrl: './profile-form.html',
  styleUrls: ['./profile-form.scss']
})
export class ProfileForm implements OnChanges {
  @Input() user: UserResponse | null = null;
  @Output() updateProfile = new EventEmitter<UserProfileUpdate>();

  private fb = inject(FormBuilder);
  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.maxLength(150)],
      telefono: ['', Validators.maxLength(20)]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.profileForm.patchValue({
        nombre: this.user.nombre,
        telefono: this.user.telefono || ''
      });
    }
  }

  onSubmit() {
    if (this.profileForm.valid && this.profileForm.dirty) {
      this.updateProfile.emit(this.profileForm.value);
    }
  }
}
