import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Destination } from '../models/destination.model';

@Injectable({ providedIn: 'root' })
export class DestinationsService {
  private http = inject(HttpClient);

  private destinations$ = this.http
    .get<Destination[]>('http://localhost:3000/api/destinations')
    .pipe(shareReplay(1));

  getDestinations(): Observable<Destination[]> {
    return this.destinations$;
  }

  getDestinationById(id: string): Observable<Destination | undefined> {
    return this.destinations$.pipe(
      map((destinations) => destinations.find((d) => d.id === id))
    );
  }
}
