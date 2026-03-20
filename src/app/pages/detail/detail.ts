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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.destinationsService.getDestinations().subscribe((destinations) => {
        const index = destinations.findIndex((d) => d.id === id);
        const d = destinations.find((dest) => dest.id === id);
        this.destination.set(d ?? null);
        this.photoNum.set(
          index >= 0
            ? `${(index + 1).toString().padStart(2, '0')} / ${destinations.length.toString().padStart(2, '0')}`
            : ''
        );
      });
    }
  }
}
