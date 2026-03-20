import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';

@Component({
  selector: 'app-admin-form',
  imports: [RouterLink, Sidebar],
  templateUrl: './admin-form.html',
  styleUrl: './admin-form.scss',
})
export class AdminForm {}
