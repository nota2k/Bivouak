import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DestinationsService } from '../../shared/services/destinations.service';
import { Destination } from '../../shared/models/destination.model';
import { MasonryDirective } from '../../shared/directives/masonry.directive';
import { Minimap } from '../../shared/components/minimap/minimap';

@Component({
  selector: 'app-detail',
  imports: [RouterLink, MasonryDirective, Minimap],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export class Detail {
  private route = inject(ActivatedRoute);
  private destinationsService = inject(DestinationsService);
  destination = signal<Destination | null>(null);
  photoNum = signal('');
  /** Image principale affichée (cliquable via les miniatures) */
  selectedPhoto = signal<string>('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.destinationsService.getDestinations().subscribe((destinations) => {
        const index = destinations.findIndex((d) => d.id === id);
        const d = destinations.find((dest) => dest.id === id);
        this.destination.set(d ?? null);
        if (d?.photos[0]) this.selectedPhoto.set(d.photos[0]);
        this.photoNum.set(
          index >= 0
            ? `${(index + 1).toString().padStart(2, '0')} / ${destinations.length.toString().padStart(2, '0')}`
            : ''
        );
      });
    }
  }

  selectPhoto(url: string) {
    this.selectedPhoto.set(url);
  }

  /** Variables de fond pour les placeholders */
  private readonly placeholderBgs = [
    'var(--bg-caramel)',
    'var(--bg-taupe)',
    'var(--bg-sienna)',
    'var(--bg-dark)',
  ];

  getGalleryItems(d: { id: string; photos: string[] }): { type: 'photo' | 'placeholder'; url?: string; bg?: string }[] {
    const photos = d.photos.slice(1, 5);
    const items: { type: 'photo' | 'placeholder'; url?: string; bg?: string }[] = photos.map((url) => ({
      type: 'photo',
      url,
    }));
    const needed = 4 - items.length;
    const seed = d.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let i = 0; i < needed; i++) {
      items.push({
        type: 'placeholder',
        bg: this.placeholderBgs[(seed + i) % this.placeholderBgs.length],
      });
    }
    return items;
  }
}
