/**
 * Dev-only logger — all calls are no-ops in production builds.
 * Vite tree-shakes the console calls when import.meta.env.DEV is false,
 * so no console output leaks to production browser DevTools.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => { if (isDev) console.error(...args); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn:  (...args: any[]) => { if (isDev) console.warn(...args); },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log:   (...args: any[]) => { if (isDev) console.log(...args); },
};
