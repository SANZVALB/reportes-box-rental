import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../layout/navbar/navbar';
import { SidebarComponent } from '../../../layout/sidebar/sidebar';
import { ReporteService, Reporte } from '../../../services/reporte';

interface FilaDato {
  trimestre: string;
  mes: string;
  grupo: string;
  concepto: string;
  monto: number;
}

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss'
})
export class Detalle implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private svc    = inject(ReporteService);

  reporte  = signal<any>(null);
  cargando = signal(true);
  error    = signal('');

  // Filtros
  trimestreSel = signal('TODOS');
  grupoSel     = signal('TODOS');
  conceptoSel  = signal('TODOS');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.obtener(id).subscribe({
      next: r => { this.reporte.set(r); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar reporte'); this.cargando.set(false); }
    });
  }

  get datos(): FilaDato[] { return this.reporte()?.datos || []; }
  get grupos(): string[]  { return this.reporte()?.resumen?.grupos || []; }
  get trimestres(): string[] { return this.reporte()?.resumen?.trimestres || []; }

  datosFiltrados() {
    return this.datos.filter(d =>
      (this.trimestreSel() === 'TODOS' || d.trimestre === this.trimestreSel()) &&
      (this.grupoSel()     === 'TODOS' || d.grupo     === this.grupoSel()) &&
      (this.conceptoSel()  === 'TODOS' || d.concepto  === this.conceptoSel())
    );
  }

  montoTotal() {
    return this.datosFiltrados().reduce((s, d) => s + d.monto, 0);
  }

  porGrupo() {
    const mapa: Record<string, number> = {};
    this.datosFiltrados().forEach(d => mapa[d.grupo] = (mapa[d.grupo] || 0) + d.monto);
    const total = Object.values(mapa).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .map(([grupo, monto]) => ({ grupo, monto, pct: (monto / total * 100).toFixed(1) }));
  }

  porConcepto() {
    const mapa: Record<string, number> = {};
    this.datosFiltrados().forEach(d => mapa[d.concepto] = (mapa[d.concepto] || 0) + d.monto);
    const total = Object.values(mapa).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([concepto, monto]) => ({ concepto, monto, pct: (monto / total * 100) }));
  }

  maxBarra() {
    return Math.max(...this.porConcepto().map(c => c.monto), 1);
  }

  conceptosDisponibles() {
    const filtrado = this.datos.filter(d =>
      (this.trimestreSel() === 'TODOS' || d.trimestre === this.trimestreSel()) &&
      (this.grupoSel()     === 'TODOS' || d.grupo     === this.grupoSel())
    );
    return [...new Set(filtrado.map(d => d.concepto))];
  }

  formatMonto(n: number) {
    return n?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0,00';
  }

  volver() { this.router.navigate(['/reportes']); }
}