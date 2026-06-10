import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

interface MenuItem {
  label: string;
  icon: string;
  ruta: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  auth = inject(AuthService);

  menu: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      ruta: '/dashboard',
      roles: ['desarrollador', 'administrador', 'operador', 'visor']
    },
    {
      label: 'Subir Reporte',
      icon: '📂',
      ruta: '/reportes/nuevo',
      roles: ['desarrollador', 'administrador', 'operador']
    },
    {
      label: 'Mis Reportes',
      icon: '📋',
      ruta: '/reportes',
      roles: ['desarrollador', 'administrador', 'operador', 'visor']
    },
    {
      label: 'Usuarios',
      icon: '👥',
      ruta: '/usuarios',
      roles: ['desarrollador', 'administrador']
    },
    {
      label: 'Configuración',
      icon: '⚙️',
      ruta: '/configuracion',
      roles: ['desarrollador']
    }
  ];

  menuVisible(): MenuItem[] {
    const rol = this.auth.usuarioActual()?.rol || '';
    return this.menu.filter(m => m.roles.includes(rol));
  }
}