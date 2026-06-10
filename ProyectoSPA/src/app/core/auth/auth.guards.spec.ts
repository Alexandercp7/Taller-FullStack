import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, loggedOutGuard, roleGuard } from './auth.guards';
import { AuthService } from './auth.service';

describe('auth.guards', () => {
  let authServiceMock: { isAuthenticated: ReturnType<typeof vi.fn>; currentUser: ReturnType<typeof vi.fn> };
  let router: Router;
  let urlTree: UrlTree;

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      currentUser: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
    urlTree = {} as UrlTree;
    vi.spyOn(router, 'createUrlTree').mockReturnValue(urlTree);
  });

  describe('authGuard', () => {
    it('permite el acceso si el usuario está autenticado', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(true);
    });

    it('redirige a /login si el usuario no está autenticado', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('loggedOutGuard', () => {
    it('permite el acceso si el usuario no está autenticado', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => loggedOutGuard({} as any, {} as any));

      expect(result).toBe(true);
    });

    it('redirige a /app si el usuario ya está autenticado', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => loggedOutGuard({} as any, {} as any));

      expect(result).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/app']);
    });
  });

  describe('roleGuard', () => {
    it('permite el acceso si el usuario tiene alguno de los roles permitidos', () => {
      authServiceMock.currentUser.mockReturnValue({ roles: ['admin', 'tecnico'] });

      const guard = roleGuard('admin', 'supervisor');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

      expect(result).toBe(true);
    });

    it('redirige a /app/dashboard si el usuario no tiene ninguno de los roles permitidos', () => {
      authServiceMock.currentUser.mockReturnValue({ roles: ['tecnico'] });

      const guard = roleGuard('admin', 'supervisor');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

      expect(result).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/app/dashboard']);
    });

    it('redirige a /app/dashboard si el usuario no tiene roles asignados', () => {
      authServiceMock.currentUser.mockReturnValue(null);

      const guard = roleGuard('admin');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

      expect(result).toBe(urlTree);
    });
  });
});
