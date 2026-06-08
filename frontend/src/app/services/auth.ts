import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'desarrollador' | 'administrador' | 'operador' | 'visor';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:3000/api/auth';

  // Signal reactivo con el usuario actual
  usuarioActual = signal<Usuario | null>(this.cargarUsuario());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<{ token: string; usuario: Usuario }>(
      `${this.api}/login`, { email, password }
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.usuarioActual.set(res.usuario);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  estaLogueado(): boolean {
    return !!this.getToken();
  }

  tieneRol(...roles: string[]): boolean {
    const u = this.usuarioActual();
    return u ? roles.includes(u.rol) : false;
  }

  private cargarUsuario(): Usuario | null {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }
}