import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { ThemeService } from './core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HlmToasterImports],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly _themeService = inject(ThemeService);
  protected readonly title = signal('ProyectoColosio');
  protected readonly isDark = this._themeService.isDark;
}
