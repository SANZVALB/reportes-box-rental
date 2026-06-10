import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ResumenReporte {
  totalMonto: number;
  totalFilas: number;
  grupos: string[];
  trimestres: string[];
  periodo: string;
}

export interface Reporte {
  _id: string;
  nombre: string;
  tipo: string;
  estado: string;
  resumen: ResumenReporte;
  createdAt: string;
  creadoPor: { nombre: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private api = 'http://localhost:3000/api/reportes';

  constructor(private http: HttpClient) {}

  subirReporte(archivo: File, nombre: string, tipo: string) {
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('nombre', nombre);
    form.append('tipo', tipo);
    return this.http.post<{ mensaje: string; reporteId: string; resumen: ResumenReporte }>(
      this.api, form
    );
  }

  listar() {
    return this.http.get<Reporte[]>(this.api);
  }

  obtener(id: string) {
    return this.http.get<Reporte>(`${this.api}/${id}`);
  }

  eliminar(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }
}