import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/lista/lista').then(m => m.ListaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reportes/nuevo',
    loadComponent: () => import('./pages/reportes/nuevo/nuevo').then(m => m.NuevoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reportes/:id',
    loadComponent: () => import('./pages/reportes/detalle/detalle').then(m => m.Detalle),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];