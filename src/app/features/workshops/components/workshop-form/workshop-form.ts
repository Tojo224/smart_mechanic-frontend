import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnDestroy, PLATFORM_ID, ViewChild, inject, input, output } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TallerCreate, TallerResponse } from '@core/models/workshops.model';
import type * as L from 'leaflet';

@Component({
  selector: 'app-workshop-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatInputModule, 
    MatButtonModule, 
    MatFormFieldModule
  ],
  templateUrl: './workshop-form.html',
  styleUrls: ['./workshop-form.scss']
})
export class WorkshopForm implements AfterViewInit, OnDestroy, OnChanges {
  readonly initialData = input<TallerResponse | null>(null);
  readonly save = output<TallerCreate>();

  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  workshopForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    nit: ['', [Validators.required, Validators.maxLength(50)]],
    telefono: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email]],
    direccion: ['', [Validators.maxLength(255)]],
    latitud: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitud: [0, [Validators.required, Validators.min(-180), Validators.max(180)]]
  });

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  private L: typeof L | undefined;

  ngOnChanges() {
    const data = this.initialData();
    if (data) {
      this.workshopForm.patchValue({
        nombre: data.nombre,
        nit: data.nit,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        latitud: data.latitud || 0,
        longitud: data.longitud || 0
      });
      this.workshopForm.get('nit')?.disable();
      this.updateMapMarker();
    }
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Leaflet = await import('leaflet');
      this.L = (Leaflet as any).default || Leaflet;
      setTimeout(() => {
        this.initMap();
      }, 500);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (!this.L || this.map || !this.mapContainer) return;
    
    const data = this.initialData();
    const defaultLat = data?.latitud || -17.7833;
    const defaultLng = data?.longitud || -63.1821;

    this.map = this.L.map(this.mapContainer.nativeElement).setView([defaultLat, defaultLng], 15);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Configuración de iconos (usando cdnjs para evitar problemas de assets locales)
    const iconDefault = this.L.icon({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    this.L.Marker.prototype.options.icon = iconDefault;

    if (data?.latitud != null && data?.longitud != null) {
      this.marker = this.L.marker([data.latitud, data.longitud]).addTo(this.map);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (!this.L || !this.map) return;
      const { lat, lng } = e.latlng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = this.L.marker(e.latlng).addTo(this.map);
      }

      this.workshopForm.patchValue({ latitud: lat, longitud: lng });
    });

    // Forzar redimensión
    setTimeout(() => this.map?.invalidateSize(), 500);
  }

  private updateMapMarker() {
    const lat = this.workshopForm.get('latitud')?.value;
    const lng = this.workshopForm.get('longitud')?.value;
    if (this.L && this.map && lat && lng) {
      const latlng: L.LatLngTuple = [lat, lng];
      this.map.setView(latlng, 15);
      if (this.marker) {
        this.marker.setLatLng(latlng);
      } else {
        this.marker = this.L.marker(latlng).addTo(this.map);
      }
    }
  }

  onSubmit() {
    if (this.workshopForm.valid) {
      this.save.emit(this.workshopForm.getRawValue());
    } else {
      this.workshopForm.markAllAsTouched();
    }
  }
}
