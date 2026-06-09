import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { provideIcons } from '@ng-icons/core';
import { lucideLayout, lucideInfo, lucideTarget, lucideCheckCircle, lucideBarChart3, lucideSmile, lucideUsers, lucideUserPlus, lucideRepeat2, lucideTrendingUp, lucideClock, lucideActivity, lucideAlertCircle, lucideArrowUp, lucideArrowDown, lucideMinus, lucideX, lucideSend } from '@ng-icons/lucide';

import { provideSpanishCalendarI18n, ThemeService } from './core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideNativeDateAdapter(),
    provideSpanishCalendarI18n(),
    provideIcons({
      lucideLayout, lucideInfo, lucideTarget, lucideCheckCircle, lucideBarChart3, lucideSmile,
      lucideUsers, lucideUserPlus, lucideRepeat2, lucideTrendingUp, lucideClock, lucideActivity, lucideAlertCircle,
      lucideArrowUp, lucideArrowDown, lucideMinus, lucideX, lucideSend
    }),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ThemeService],
      useFactory: (themeService: ThemeService) => () => themeService.initializeTheme()
    }
  ]
};
