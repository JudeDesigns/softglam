/**
 * Tailwind / NativeWind config — pure CJS, no TypeScript, no ESM imports.
 * The theme values are inlined from packages/tokens/src/* so that the NativeWind
 * child.js process (which uses plain Node.js require()) can load this without
 * a TypeScript build step.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');

// #region debug-point A:tailwind-config-load
const DEBUG_ENV_PATH = path.resolve(__dirname, '../../.dbg/expo-bundle-stall.env');
function reportDebugEvent(hypothesisId, message, extra) {
  try {
    const env = fs.readFileSync(DEBUG_ENV_PATH, 'utf8');
    const match = env.match(/^DEBUG_SERVER_URL=(.+)$/m);
    if (!match) return;
    const url = new URL(match[1]);
    const body = JSON.stringify({
      sessionId: 'expo-bundle-stall',
      hypothesisId,
      source: 'tailwind.config.js',
      message,
      extra,
      ts: new Date().toISOString(),
    });
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      },
      () => {}
    );
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch {}
}
// #endregion debug-point A:tailwind-config-load

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        white: '#FFFFFF',
        black: '#000000',
        bone: {
          50: '#FAFAF9', 100: '#F5F5F4', 200: '#E7E5E4', 300: '#D6D3D1',
          400: '#A8A29E', 500: '#78716C', 600: '#57534E', 700: '#3F3F46',
          800: '#27272A', 900: '#18181B',
        },
        ink: {
          50: '#FAFAFA', 100: '#F5F5F5', 200: '#E5E5E5', 300: '#D4D4D4',
          400: '#A3A3A3', 500: '#737373', 600: '#525252', 700: '#404040',
          800: '#262626', 900: '#171717',
        },
        gold: {
          50: '#FBF6E5', 100: '#F5EBC2', 200: '#EBD58A', 300: '#DFC05A',
          400: '#D4AF37', 500: '#C29D2F', 600: '#A88727', 700: '#856A1F',
          800: '#604D17', 900: '#3D310F',
        },
        success: '#4F7A5E',
        warning: '#D4AF37',
        danger: '#A8423A',
        info: '#5B6E80',
        // Semantic aliases used across app code
        bg: { primary: '#FAFAF9', secondary: '#F5F5F4', inverse: '#171717' },
        surface: { DEFAULT: '#FFFFFF', raised: '#FFFFFF', overlay: '#FFFFFF', hero: '#171717' },
        fg: { primary: '#171717', secondary: '#525252', tertiary: '#737373', inverse: '#FFFFFF', 'on-hero': '#FFFFFF' },
        accent: { primary: '#D4AF37', secondary: '#C29D2F', muted: '#F5EBC2', 'on-accent': '#171717' },
        line: { subtle: '#E7E5E4', DEFAULT: '#D6D3D1', strong: '#A8A29E' },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '14px' }],
        sm:   ['13px', { lineHeight: '18px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg:   ['17px', { lineHeight: '24px' }],
        xl:   ['20px', { lineHeight: '28px' }],
        '2xl':['24px', { lineHeight: '32px' }],
        '3xl':['30px', { lineHeight: '38px' }],
        '4xl':['34px', { lineHeight: '42px' }],
        '5xl':['40px', { lineHeight: '48px' }],
      },
      letterSpacing: {
        tighter: '-0.5px',
        tight:   '-0.25px',
        normal:  '0px',
        wide:    '0.3px',
        wider:   '0.6px',
      },
      borderRadius: {
        none: '0px', xs: '4px', sm: '6px', DEFAULT: '8px',
        md: '10px', lg: '12px', xl: '16px', '2xl': '20px',
        '3xl': '24px', full: '9999px',
      },
    },
  },
  plugins: [],
};

// #region debug-point A:tailwind-config-loaded
reportDebugEvent('A', '[DEBUG] tailwind config loaded', {
  contentPaths: config.content,
  colorKeys: Object.keys(config.theme.extend.colors),
});
// #endregion debug-point A:tailwind-config-loaded

module.exports = config;
