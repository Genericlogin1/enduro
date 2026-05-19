import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--bg-base) / <alpha-value>)',
        elev1: 'rgb(var(--bg-elev-1) / <alpha-value>)',
        elev2: 'rgb(var(--bg-elev-2) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        ink: 'rgb(var(--text-primary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        moss: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
        },
        rust: {
          DEFAULT: 'rgb(var(--rust) / <alpha-value>)',
          strong: 'rgb(var(--rust-strong) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
