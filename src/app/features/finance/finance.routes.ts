import { Routes } from '@angular/router';

const loadDashboardLayoutComponent = () =>
  import('@core/layout/dashboard-layout/dashboard-layout.component').then(
    c => c.DashboardLayoutComponent
  );

const loadPlaceholderRoutePageComponent = () =>
  import('@shared/ui/placeholder-route-page/placeholder-route-page.component').then(
    c => c.PlaceholderRoutePageComponent
  );

export const financeRoutes: Routes = [
  {
    path: '',
    loadComponent: loadDashboardLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-financiero/dashboard-financiero.page').then(m => m.DashboardFinancieroPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/report-generator/report-generator.page').then(m => m.ReportGeneratorPage),
      },
      {
        path: 'process',
        loadComponent: () => import('./pages/process-payment/process-payment').then(m => m.ProcessPayment),
      }
    ],
  },
];

