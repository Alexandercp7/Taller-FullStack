import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { AuthService } from '../../core/auth/auth.service';

@Component({
	selector: 'login-form',
	imports: [ReactiveFormsModule, HlmCardImports, HlmFieldImports, HlmInputImports, HlmButtonImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<hlm-card>
			<hlm-card-header>
				<h3 hlmCardTitle>Inicie sesión</h3>
				<p hlmCardDescription>Ingrese sus credenciales para continuar.</p>
			</hlm-card-header>
			<div hlmCardContent>
				<form [formGroup]="form" (ngSubmit)="login()">
					<hlm-field-group>
						<hlm-field>
							<label hlmFieldLabel for="email">Correo electrónico</label>
							<input hlmInput type="email" id="email" placeholder="admin@spa.com" formControlName="email" />
							<hlm-field-error validator="required">El correo es obligatorio.</hlm-field-error>
							<hlm-field-error validator="email">Ingrese un correo válido.</hlm-field-error>
						</hlm-field>
						<hlm-field>
							<label hlmFieldLabel for="password">Contraseña</label>
							<input hlmInput type="password" id="password" formControlName="password" placeholder="••••••••" />
							<hlm-field-error validator="required">La contraseña es obligatoria.</hlm-field-error>
						</hlm-field>
						<hlm-field>
							<button hlmBtn type="submit" [disabled]="form.invalid || loading()">
								{{ loading() ? 'Iniciando...' : 'Iniciar sesión' }}
							</button>
							@if (loginError()) {
								<p class="text-destructive text-sm">{{ loginError() }}</p>
							}
						</hlm-field>
					</hlm-field-group>
				</form>
			</div>
		</hlm-card>
	`,
})
export class LoginForm {
	private readonly _fb     = inject(FormBuilder);
	private readonly _router = inject(Router);
	private readonly _auth   = inject(AuthService);

	public form = this._fb.group({
		email:    ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required]],
	});

	public readonly loading    = signal(false);
	public readonly loginError = signal<string | null>(null);

	public login() {
		if (this.form.invalid) return;

		this.loading.set(true);
		this.loginError.set(null);

		const email    = this.form.controls.email.value ?? '';
		const password = this.form.controls.password.value ?? '';

		this._auth.login(email, password).subscribe({
			next: () => void this._router.navigate(['/app']),
			error: (err) => {
				this.loading.set(false);
				this.loginError.set(
					err.status === 401 ? 'Credenciales incorrectas.' : 'Error al conectar con el servidor.'
				);
			},
		});
	}
}
