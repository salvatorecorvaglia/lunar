import type { ITheme } from '@xterm/xterm'
import { draculaTheme } from './dracula'
import { nordTheme } from './nord'
import { tokyoNightTheme } from './tokyo-night'
import type { TerminalThemeName } from '@shared/types/terminal'

export const terminalThemes: Record<TerminalThemeName, ITheme> = {
  dracula: draculaTheme,
  nord: nordTheme,
  'tokyo-night': tokyoNightTheme
}

export { draculaTheme, nordTheme, tokyoNightTheme }
