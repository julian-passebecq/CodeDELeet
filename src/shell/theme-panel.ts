/** A preference surface, not an exercise renderer or a second output dock. */
import { escapeHTML as e } from '../core.js';
import type { ThemeId } from './layout-controller.js';
import { THEME_DATA } from './theme-data.js';

export function themePanelHTML(selected: ThemeId): string {
    return `<fieldset class="theme-options"><legend>Workspace appearance</legend>${Object.entries(THEME_DATA).map(([id, theme]) =>
        `<label class="theme-choice"><input type="radio" name="app-theme" value="${id}" ${selected === id ? 'checked' : ''}><span class="theme-swatch" aria-hidden="true" style="--swatch-panel:${theme.panel};--swatch-chrome:${theme.chrome};--swatch-accent:${theme.accent}"><i></i></span><span>${e(theme.label)}</span></label>`
    ).join('')}</fieldset><p class="theme-help">Saved on this device. Your answers and panel sizes stay unchanged. Terminal overrides are in Settings.</p>`;
}

/** Keep the native radio's focus and arrow-key behavior; never remount its DOM on selection. */
export function syncThemeChoices(selected: ThemeId): void {
    document.querySelectorAll<HTMLInputElement>('input[name="app-theme"]').forEach(input => {
        input.checked = input.value === selected;
    });
}
