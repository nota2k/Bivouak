import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  private router = inject(Router);
  current = signal(0);
  slides = signal<Destination[]>([]);
  /** 'next' = scroll down (slide monte du bas), 'prev' = scroll up (slide aimante en bas) */
  direction = signal<'next' | 'prev'>('next');
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
    const c = this.current();
    if (c >= total - 1) return; // Dernière slide : l'animation s'arrête
    this.isAnimating = true;
    this.direction.set('next');
    this.current.update((cur) => cur + 1);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  prev() {
    if (this.isAnimating) return;
    const total = this.slides().length;
    if (!total) return;
    const c = this.current();
    if (c <= 0) return; // Première slide : l'animation s'arrête
    this.isAnimating = true;
    this.direction.set('prev');
    this.current.update((cur) => cur - 1);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  goTo(i: number) {
    if (this.isAnimating) return;
    if (i === this.current()) return;
    this.isAnimating = true;
    this.direction.set(i > this.current() ? 'next' : 'prev');
    this.current.set(i);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  goToDestination(id: string) {
    this.router.navigate(['/destination', id]);
  }

  getTranslateY(i: number): number {
    const c = this.current();
    // Même logique pour next et prev : actuelle et précédentes à 0, suivantes à 100
    // Next : la suivante monte (100 → 0) et superpose. Prev : l'actuelle redescend (0 → 100) une par une
    return i <= c ? 0 : 100;
  }

  getZIndex(i: number): number {
    const c = this.current();
    const dir = this.direction();
    const total = this.slides().length;
    if (dir === 'next') {
      // La suivante monte et superpose : actuelle au-dessus
      return i === c ? 10 : i < c ? 5 : 1;
    }
    // Prev : la slide quittée (c+1) redescend au-dessus, révélant la précédente en dessous
    if (i === c + 1 && c + 1 < total) return 10; // sortante, au-dessus
    return i <= c ? 5 : 1;
  }

  onWheel(e: WheelEvent) {
    if (Math.abs(e.deltaY) < 15) return;
    e.preventDefault();
    e.deltaY > 0 ? this.next() : this.prev();
  }
}
