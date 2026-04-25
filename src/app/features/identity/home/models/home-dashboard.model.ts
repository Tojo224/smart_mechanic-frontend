import { LucideIconData } from 'lucide-angular';

export interface HomeKpi {
  label: string;
  value: string;
  icon: LucideIconData;
  detail: string;
  trend: number;
}

export interface HomeQuickAction {
  key: string;
  label: string;
  icon: LucideIconData;
  description: string;
  route?: string;        // ← ruta de navegación Angular
}

export interface HomeAlert {
  title: string;
  description: string;
  level: 'high' | 'medium' | 'low';
}
