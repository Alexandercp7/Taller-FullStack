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

export const roleGuard = (...allowedRoles: string[]): CanActivateFn => () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	const roles = auth.currentUser()?.roles ?? [];
	return allowedRoles.some(r => roles.includes(r)) ? true : router.createUrlTree(['/app/dashboard']);
};
