import { Component, EventEmitter, Output, PLATFORM_ID, Inject, AfterViewInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TallerCreate, TallerResponse } from '@core/models/workshops.model';

@Component({
  selector: 'app-workshop-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatFormFieldModule],
  templateUrl: './workshop-form.html',
  styleUrls: ['./workshop-form.scss']
})
export class WorkshopForm implements AfterViewInit, OnDestroy, OnChanges {
  @Input() initialData: TallerResponse | null = null;
  @Output() save = new EventEmitter<TallerCreate>();

  workshopForm: FormGroup;
  private map: any;
  private marker: any;
  private L: any;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.workshopForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      nit: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email]],
      direccion: ['', [Validators.maxLength(255)]],
      latitud: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitud: [0, [Validators.required, Validators.min(-180), Validators.max(180)]]
    });
  }

  ngOnChanges() {
    if (this.initialData) {
      this.workshopForm.patchValue({
        nombre: this.initialData.nombre,
        nit: this.initialData.nit,
        telefono: this.initialData.telefono,
        email: this.initialData.email,
        direccion: this.initialData.direccion,
        latitud: this.initialData.latitud || 0,
        longitud: this.initialData.longitud || 0
      });
      // En modo edición, el NIT no se debería poder cambiar
      this.workshopForm.get('nit')?.disable();
      this.updateMapMarker();
    }
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      this.initMap();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    const defaultLat = this.initialData?.latitud || -16.5000;
    const defaultLng = this.initialData?.longitud || -68.1193;

    this.map = this.L.map('map', {
      center: [defaultLat, defaultLng],
      zoom: 15
    });

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
    const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
    const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';
    const iconDefault = this.L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    this.L.Marker.prototype.options.icon = iconDefault;

    if (this.initialData?.latitud && this.initialData?.longitud) {
      this.marker = this.L.marker([this.initialData.latitud, this.initialData.longitud]).addTo(this.map);
    }

    this.map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = this.L.marker(e.latlng).addTo(this.map);
      }

      this.workshopForm.patchValue({
        latitud: lat,
        longitud: lng
      });
      this.workshopForm.get('latitud')?.markAsTouched();
      this.workshopForm.get('longitud')?.markAsTouched();
    });
  }

  private updateMapMarker() {
    if (this.map && this.initialData?.latitud && this.initialData?.longitud) {
      const latlng = [this.initialData.latitud, this.initialData.longitud];
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
      // Necesitamos devolver el NIT también aunque esté deshabilitado para el payload
      const rawValue = this.workshopForm.getRawValue();
      this.save.emit(rawValue);
    } else {
      this.workshopForm.markAllAsTouched();
    }
  }
}
