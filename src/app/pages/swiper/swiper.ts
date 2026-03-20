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
    this.isAnimating = true;
    this.direction.set('next');
    this.current.update((c) => (c + 1) % total);
    setTimeout(() => (this.isAnimating = false), 600);
  }

  prev() {
    if (this.isAnimating) return;
    const total = this.slides().length;
    if (!total) return;
    this.isAnimating = true;
    this.direction.set('prev');
    this.current.update((c) => (c - 1 + total) % total);
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
    const dir = this.direction();
    if (dir === 'next') {
      // Scroll down : précédentes en haut (-100), actuelle à 0, suivantes en bas (100)
      return i < c ? -100 : i === c ? 0 : 100;
    }
    // Scroll up (inversé) : précédentes en bas (100), actuelle à 0, suivantes en haut (-100)
    // La slide s'aimante en bas : elle vient du bas (100) et snap à 0
    return i < c ? 100 : i === c ? 0 : -100;
  }

  getZIndex(i: number): number {
    const c = this.current();
    const dir = this.direction();
    if (i === c) return 10;
    if (dir === 'next') {
      return i < c ? 5 : 1; // précédentes au-dessus, suivantes en dessous
    }
    return i < c ? 1 : 5; // inversé : précédentes en dessous, suivantes au-dessus
  }

  onWheel(e: WheelEvent) {
    if (Math.abs(e.deltaY) < 15) return;
    e.preventDefault();
    e.deltaY > 0 ? this.next() : this.prev();
  }
}
