import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DestinationsService } from '../../shared/services/destinations.service';
import { Destination } from '../../shared/models/destination.model';

@Component({
  selector: 'app-swiper',
  imports: [RouterLink],
  templateUrl: './swiper.html',
  styleUrl: './swiper.scss',
})
export class Swiper {
  private destinationsService = inject(DestinationsService);
  current = signal(0);
  slides = signal<Destination[]>([]);
  private isAnimating = false;

  constructor() {
    this.destinationsService.getDestinations().subscribe((destinations) => {
      this.slides.set(destinations);
    });
  }

  next() {
    if (this.isAnimating) return;
    const total = this.slides().length;
    if (!total) return;
    this.isAnimating = true;
    this.current.update((c) => (c + 1) % total);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  prev() {
    if (this.isAnimating) return;
    const total = this.slides().length;
    if (!total) return;
    this.isAnimating = true;
    this.current.update((c) => (c - 1 + total) % total);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  goTo(i: number) {
    if (this.isAnimating) return;
    if (i === this.current()) return;
    this.isAnimating = true;
    this.current.set(i);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  getTranslateY(i: number): number {
    const c = this.current();
    // Ordre des slides inchangé : vues (i <= c) à 0, futures (i > c) en bas
    // Next: la suivante monte (100% → 0). Prev: l'actuelle descend (0 → 100%)
    return i <= c ? 0 : 100;
  }

  onWheel(e: WheelEvent) {
    if (Math.abs(e.deltaY) < 15) return;
    e.preventDefault();
    e.deltaY > 0 ? this.next() : this.prev();
  }
}
