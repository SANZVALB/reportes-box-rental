import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../layout/navbar/navbar';
import { SidebarComponent } from '../../../layout/sidebar/sidebar';
import { ReporteService, Reporte } from '../../../services/reporte';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-lista',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './lista.html',
  styleUrl: './lista.scss'
})
export class ListaComponent implements OnInit {
  private reporteService = inject(ReporteService);
  private router = inject(Router);
  auth = inject(AuthService);

  reportes = signal<Reporte[]>([]);
  cargando = signal(true);
  error    = signal('');

  ngOnInit() {
    this.reporteService.listar().subscribe({
      next: r => { this.reportes.set(r); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar reportes'); this.cargando.set(false); }
    });
  }

  verDetalle(id: string) {
    this.router.navigate(['/reportes', id]);
  }

  eliminar(id: string, e: Event) {
    e.stopPropagation();
    if (!confirm('¿Eliminár este reporte?')) return;
    this.reporteService.eliminar(id).subscribe({
      next: () => this.reportes.update(r => r.filter(x => x._id !== id)),
      error: () => alert('Error al eliminar')
    });
  }

  formatMonto(n: number) {
    return n?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0,00';
  }

  formatFecha(f: string) {
    return new Date(f).toLocaleDateString('es-AR');
  }
}