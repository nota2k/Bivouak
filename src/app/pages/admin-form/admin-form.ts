import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, switchMap, take } from 'rxjs';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { UploadService } from '../../shared/services/upload.service';
import { DestinationsService } from '../../shared/services/destinations.service';

@Component({
  selector: 'app-admin-form',
  imports: [RouterLink, FormsModule, Sidebar],
  templateUrl: './admin-form.html',
  styleUrl: './admin-form.scss',
})
export class AdminForm implements OnInit {
  private uploadService = inject(UploadService);
  private destinationsService = inject(DestinationsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  editId: string | null = null;
  destination = '';
  region = '';
  regionFull = '';
  latitude = '';
  longitude = '';
  notes = '';
  status: 'draft' | 'published' = 'draft';
  photos: string[] = [];
  vue = '';
  calme = '';
  acces = '';

  isDragging = false;
  uploadProgress = false;
  saveError = '';
  saving = false;
  loadingForm = false;

  get coords() {
    if (this.latitude && this.longitude) return `${this.latitude}° N, ${this.longitude}° E`;
    return '';
  }

  get slug() {
    if (this.editId) return this.editId;
    return this.destination
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'nouveau-spot';
  }

  get isEditMode() {
    return !!this.editId;
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(
        take(1),
        filter((params) => {
          const id = params.get('id');
          return !!id && id !== 'nouveau';
        }),
        switchMap((params) => {
          const id = params.get('id')!;
          this.editId = id;
          this.loadingForm = true;
          return this.destinationsService.getDestination(id);
        })
      )
      .subscribe({
        next: (d) => {
          this.populateForm(d);
          this.loadingForm = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loadingForm = false;
          this.router.navigate(['/admin']);
        },
      });
  }

  private populateForm(d: { ville: string; region: string; regionFull?: string; region_full?: string; notes: string; photos: string[]; coords?: string; ratings?: { label: string; value: string }[] }) {
    this.destination = d.ville;
    this.region = d.region;
    this.regionFull = (d.regionFull ?? d.region_full ?? d.region) || '';
    this.notes = d.notes || '';
    this.photos = [...(d.photos || [])];
    const { lat, lng } = this.parseCoords(d.coords || '');
    this.latitude = lat;
    this.longitude = lng;
    const vue = d.ratings?.find((r) => r.label === 'VUE');
    const calme = d.ratings?.find((r) => r.label === 'CALME');
    const acces = d.ratings?.find((r) => r.label === 'ACCÈS');
    this.vue = vue?.value ?? '';
    this.calme = calme?.value ?? '';
    this.acces = acces?.value ?? '';
  }

  private parseCoords(coords: string): { lat: string; lng: string } {
    const match = coords.match(/([\d.,-]+)\s*°?\s*[NS]?,\s*([\d.,-]+)\s*°?\s*[EW]?/i);
    if (match) return { lat: match[1].trim(), lng: match[2].trim() };
    return { lat: '', lng: '' };
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.uploadFiles(Array.from(input.files));
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    if (e.dataTransfer?.files?.length) this.uploadFiles(Array.from(e.dataTransfer.files));
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  uploadFiles(files: File[]) {
    const images = files.filter((f) => /^image\/(jpeg|png|gif|webp)$/i.test(f.type));
    if (!images.length) return;
    this.uploadProgress = true;
    let done = 0;
    images.forEach((file) => {
      this.uploadService.uploadPhoto(file).subscribe({
        next: (res) => {
          this.photos.push(res.url);
          if (++done === images.length) this.uploadProgress = false;
        },
        error: () => {
          if (++done === images.length) this.uploadProgress = false;
        },
      });
    });
  }

  removePhoto(i: number) {
    this.photos.splice(i, 1);
  }

  setStatus(s: 'draft' | 'published') {
    this.status = s;
  }

  save() {
    this.saveError = '';
    if (!this.destination.trim()) {
      this.saveError = 'La destination est obligatoire';
      return;
    }
    if (!this.region.trim()) {
      this.saveError = 'La région est obligatoire';
      return;
    }
    this.saving = true;
    const payload = {
      id: this.slug,
      ville: this.destination.trim(),
      name: this.destination.toUpperCase().trim().replace(/\s/g, '\n'),
      region: this.region.toUpperCase().trim(),
      regionFull: (this.regionFull || this.region).trim(),
      notes: this.notes.trim(),
      coords: this.coords,
      photos: this.photos,
      ratings: [
        { label: 'VUE', value: String(this.vue || '0'), color: '#C2956A' },
        { label: 'CALME', value: String(this.calme || '0'), color: '#A38979' },
        { label: 'ACCÈS', value: String(this.acces || '0'), color: '#8F5A3C' },
        { label: 'GLOBAL', value: '0', color: '#1A1A1A' },
      ],
    };
    this.destinationsService.createDestination(payload).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.error || err.error?.details || err.message || 'Erreur lors de l\'enregistrement';
      },
    });
  }
}
