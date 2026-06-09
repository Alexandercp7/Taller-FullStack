import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface LoginResponse {
  data: { token: string; user: AuthUser };
}

/**
 * Stores the authenticated session and coordinates login/logout requests.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY  = 'auth_user';

  private readonly _http = inject(HttpClient);

  private readonly _user = signal<AuthUser | null>(this.loadUser());
  private readonly _isAuthenticated = signal<boolean>(!!this.loadToken());

  public readonly currentUser    = this._user.asReadonly();
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();

  /** Authenticates the user and caches the token in local storage. */
  public login(email: string, password: string) {
    return this._http.post<LoginResponse>('/api/v1/auth/login', { email, password }).pipe(
      tap(res => {
        localStorage.setItem(AuthService.TOKEN_KEY, res.data.token);
        localStorage.setItem(AuthService.USER_KEY, JSON.stringify(res.data.user));
        this._user.set(res.data.user);
        this._isAuthenticated.set(true);
      })
    );
  }

  /** Ends the current session on the API and clears local credentials. */
  public logout() {
    this._http.post('/api/v1/auth/logout', {}).subscribe({ error: () => {} });
    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
    this._user.set(null);
    this._isAuthenticated.set(false);
  }

  /** Updates the cached user profile used across the app shell. */
  public setCurrentUser(user: AuthUser | null): void {
    if (user) {
      localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AuthService.USER_KEY);
    }

    this._user.set(user);
  }

  /** Returns the persisted bearer token if one exists. */
  public getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  private loadToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(AuthService.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
