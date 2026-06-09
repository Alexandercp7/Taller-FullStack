import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';

@Component({
	selector: 'spartan-change-password-settings',
	imports: [HlmCardImports, HlmLabelImports, HlmInputImports, HlmButtonImports],
	templateUrl: './change-password-settings.component.html',
	styleUrl: './change-password-settings.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordSettingsComponent {}
