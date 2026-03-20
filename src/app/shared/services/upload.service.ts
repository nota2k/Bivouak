import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<{ url: string }>(`${API}/upload`, formData);
  }
}
