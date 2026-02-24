import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--foil-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--foil-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--foil-elements-terminal-textColor'),
    background: cssVar('--foil-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--foil-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--foil-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--foil-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--foil-elements-terminal-color-black'),
    red: cssVar('--foil-elements-terminal-color-red'),
    green: cssVar('--foil-elements-terminal-color-green'),
    yellow: cssVar('--foil-elements-terminal-color-yellow'),
    blue: cssVar('--foil-elements-terminal-color-blue'),
    magenta: cssVar('--foil-elements-terminal-color-magenta'),
    cyan: cssVar('--foil-elements-terminal-color-cyan'),
    white: cssVar('--foil-elements-terminal-color-white'),
    brightBlack: cssVar('--foil-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--foil-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--foil-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--foil-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--foil-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--foil-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--foil-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--foil-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
