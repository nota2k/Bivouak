import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, Subject, switchMap, tap, startWith } from 'rxjs';
import { Destination } from '../models/destination.model';

@Injectable({ providedIn: 'root' })
export class DestinationsService {
  private http = inject(HttpClient);
  private refresh$ = new Subject<void>();

  private api = '/api';
  private destinations$ = this.refresh$.pipe(
    startWith(undefined),
    switchMap(() => this.http.get<Destination[]>(`${this.api}/destinations`)),
    shareReplay(1)
  );

  getDestinations(): Observable<Destination[]> {
    return this.destinations$;
  }

  refresh() {
    this.refresh$.next();
  }

  getDestinationById(id: string): Observable<Destination | undefined> {
    return this.destinations$.pipe(
      map((destinations) => destinations.find((d) => d.id === id))
    );
  }

  getDestination(id: string): Observable<Destination> {
    return this.http.get<Destination>(`${this.api}/destinations/${id}`);
  }

  createDestination(dest: Partial<Destination> & { id: string }) {
    return this.http.post<{ id: string }>(`${this.api}/destinations`, dest).pipe(
      tap(() => this.refresh())
    );
  }

  deleteDestination(id: string) {
    return this.http.delete(`${this.api}/destinations/${id}`).pipe(
      tap(() => this.refresh())
    );
  }
}
