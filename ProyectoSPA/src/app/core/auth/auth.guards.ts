import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const loggedOutGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	return auth.isAuthenticated() ? router.createUrlTree(['/app']) : true;
};

export const permissionGuard = (permission: string): CanActivateFn => () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	const user = auth.currentUser();
	const isAdmin = user?.roles?.includes('ADMIN') ?? false;
	const permissions = user?.permissions ?? [];
	return isAdmin || permissions.includes(permission) ? true : router.createUrlTree(['/app/dashboard']);
};
