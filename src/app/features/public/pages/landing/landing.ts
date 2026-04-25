import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSection } from '../../components/hero-section/hero-section';
import { FeaturesSection } from '../../components/features-section/features-section';
import { DownloadCta } from '../../components/download-cta/download-cta';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, HeroSection, FeaturesSection, DownloadCta, RouterLink],
  template: `
    <div class="landing-page">
      <header class="public-header">
        <div class="logo">
          <div class="logo-icon">SM</div>
          <span>Smart Mechanic</span>
        </div>
        <nav class="nav-links">
          <!-- Backoffice / Panel de Control Login -->
          <a routerLink="/identity/auth" class="login-link">Acceso a Talleres</a>
        </nav>
      </header>

      <main>
        <app-hero-section></app-hero-section>
        <app-features-section></app-features-section>
        <app-download-cta></app-download-cta>
      </main>

      <footer class="public-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="logo-icon">SM</div>
            <span>Smart Mechanic</span>
          </div>
          <p class="copyright">&copy; 2026 Smart Mechanic. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--sm-color-gunmetal-950);
      color: var(--sm-color-text-main);
    }

    .public-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--sm-color-text-title);
    }

    .logo-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.7rem;
      background: linear-gradient(135deg, var(--sm-color-sapphire-500), var(--sm-color-sapphire-700));
      color: var(--sm-color-white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .login-link {
      color: var(--sm-color-sapphire-300);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border: 1px solid rgba(var(--sm-rgb-sapphire-500), 0.3);
      border-radius: 8px;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(var(--sm-rgb-sapphire-500), 0.1);
        border-color: var(--sm-color-sapphire-500);
      }
    }

    main {
      flex: 1;
    }

    .public-footer {
      border-top: 1px solid rgba(var(--sm-rgb-slate-400), 0.1);
      padding: 2rem;
      background: var(--sm-color-gunmetal-900);
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      
      @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
      }
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--sm-color-text-soft);
      
      .logo-icon {
        width: 1.5rem;
        height: 1.5rem;
        font-size: 0.7rem;
        border-radius: 0.4rem;
        background: var(--sm-color-gunmetal-800);
      }
    }

    .copyright {
      color: var(--sm-color-text-muted);
      font-size: 0.875rem;
      margin: 0;
    }
  `]
})
export class Landing {}
