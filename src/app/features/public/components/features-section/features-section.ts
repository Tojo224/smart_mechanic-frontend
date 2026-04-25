import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Brain, Clock, ShieldCheck, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './features-section.html',
  styleUrls: ['./features-section.scss']
})
export class FeaturesSection {
  features = [
    {
      title: 'Análisis IA Instantáneo',
      description: 'Sube una foto o graba un audio de tu emergencia y nuestra IA evaluará el daño y estimará los requerimientos.',
      icon: Brain,
      color: 'sapphire'
    },
    {
      title: 'Rastreo en Tiempo Real',
      description: 'Ve en el mapa la ubicación exacta del mecánico asignado y el tiempo estimado de llegada a tu ubicación.',
      icon: MapPin,
      color: 'warning'
    },
    {
      title: 'Respuesta Rápida',
      description: 'Conectamos tu emergencia con el taller disponible más cercano y mejor calificado en nuestra red.',
      icon: Clock,
      color: 'success'
    },
    {
      title: 'Precios Transparentes',
      description: 'Pagos seguros a través de la plataforma y cotizaciones claras antes de aceptar el servicio.',
      icon: ShieldCheck,
      color: 'danger'
    }
  ];
}
