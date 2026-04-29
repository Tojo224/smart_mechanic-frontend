import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './features/identity/auth/state/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authStore = inject(AuthStore);
  protected readonly title = signal('taller-frontend');

  ngOnInit() {
    this.authStore.init();
  }
}
