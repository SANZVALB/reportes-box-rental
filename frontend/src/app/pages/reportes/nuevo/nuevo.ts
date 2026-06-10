import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../layout/navbar/navbar';
import { SidebarComponent } from '../../../layout/sidebar/sidebar';
import { ReporteService } from '../../../services/reporte';

@Component({
  selector: 'app-nuevo',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidebarComponent],
  templateUrl: './nuevo.html',
  styleUrl: './nuevo.scss'
})
export class NuevoComponent {
  private reporteService = inject(ReporteService);
  private router = inject(Router);

  archivo = signal<File | null>(null);
  nombre  = '';
  tipo    = 'presupuesto';
  cargando = signal(false);
  error    = signal('');
  exito    = signal('');
  dragOver = signal(false);

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.validarArchivo(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.validarArchivo(file);
  }

  validarArchivo(file: File) {
    const validos = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validos.includes(file.type)) {
      this.error.set('Solo se permiten archivos .xlsx o .xls');
      return;
    }
    this.error.set('');
    this.archivo.set(file);
    if (!this.nombre) this.nombre = file.name.replace(/\.[^/.]+$/, '');
  }

  subir() {
    if (!this.archivo()) { this.error.set('Seleccioná un archivo'); return; }
    if (!this.nombre.trim()) { this.error.set('Ingresá un nombre para el reporte'); return; }

    this.cargando.set(true);
    this.error.set('');

    this.reporteService.subirReporte(this.archivo()!, this.nombre, this.tipo).subscribe({
      next: (res) => {
        this.exito.set(`Reporte procesado: ${res.resumen.totalFilas} filas, $${res.resumen.totalMonto.toLocaleString('es-AR')}`);
        this.cargando.set(false);
        setTimeout(() => this.router.navigate(['/reportes']), 2000);
      },
      error: () => {
        this.error.set('Error al procesar el archivo. Verificá el formato.');
        this.cargando.set(false);
      }
    });
  }
}