import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { DestinationsService } from '../../shared/services/destinations.service';
import { Destination } from '../../shared/models/destination.model';

interface TripRow {
  id: string;
  destination: string;
  region: string;
  note: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-admin-list',
  imports: [RouterLink, Sidebar],
  templateUrl: './admin-list.html',
  styleUrl: './admin-list.scss',
})
export class AdminList {
  private destinationsService = inject(DestinationsService);

  trips = signal<TripRow[]>([]);
  loading = signal(true);
  stats = computed(() => {
    const t = this.trips();
    const regions = new Set(t.map((r) => r.region));
    return { spots: t.length, regions: regions.size };
  });

  constructor() {
    this.destinationsService.refresh(); // Force un rechargement pour inclure les créations récentes
    this.destinationsService.getDestinations().subscribe({
      next: (destinations) => {
        this.trips.set(
          destinations.map((d) => ({
            id: d.id,
            destination: d.ville,
            region: d.regionFull || d.region,
            note: this.getGlobalRating(d),
            date: this.formatDate((d as Destination & { created_at?: string }).created_at),
            status: 'PUBLIÉ',
          }))
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private getGlobalRating(d: Destination): string {
    const global = d.ratings?.find((r) => r.label === 'GLOBAL');
    return global?.value ?? '-';
  }

  private formatDate(iso?: string): string {
    if (!iso) return '-';
    const [datePart] = iso.split(' ');
    const [y, m, d] = datePart.split('-');
    return `${d}.${m}.${y}`;
  }

  deleteTrip(id: string) {
    if (!confirm(`Supprimer ce voyage ?`)) return;
    this.destinationsService.deleteDestination(id).subscribe({
      next: () => {},
      error: (err) => alert(err.error?.error || 'Erreur lors de la suppression'),
    });
  }
}
