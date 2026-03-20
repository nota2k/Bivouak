import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';

@Component({
  selector: 'app-admin-list',
  imports: [RouterLink, Sidebar],
  templateUrl: './admin-list.html',
  styleUrl: './admin-list.scss',
})
export class AdminList {
  trips = [
    { destination: 'Col du Galibier', region: 'Alpes', note: '4.8', date: '12.03.2026', status: 'PUBLIÉ' },
    { destination: 'Gorges du Verdon', region: 'Provence', note: '4.5', date: '08.03.2026', status: 'PUBLIÉ' },
    { destination: 'Lac de Serre-Ponçon', region: 'Alpes', note: '4.2', date: '01.03.2026', status: 'BROUILLON' },
    { destination: 'Dune du Pilat', region: 'Aquitaine', note: '4.9', date: '25.02.2026', status: 'PUBLIÉ' },
    { destination: 'Cirque de Gavarnie', region: 'Pyrénées', note: '4.6', date: '18.02.2026', status: 'BROUILLON' },
  ];
}
