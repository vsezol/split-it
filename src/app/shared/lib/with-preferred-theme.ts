import { Signal, computed, inject } from '@angular/core';
import { WA_WINDOW } from '@ng-web-apis/common';
import { TUI_DARK_MODE } from '@taiga-ui/core';

export const withPreferredTheme = (): Signal<string | null> => {
  const media = inject(WA_WINDOW).matchMedia('(prefers-color-scheme: dark)');
  const darkMode = inject(TUI_DARK_MODE);

  const isDarkMode = media.matches;
  darkMode.set(isDarkMode);

  return computed(() => (darkMode() ? 'dark' : null));
};
