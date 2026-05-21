import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: '#0D1117',
        surface: '#11161D',
        surface2: '#161C24',
        rule: '#232B36',
        'rule-soft': '#1B232C',
        cream: '#E8E1CC',
        cream2: '#C9C2AE',
        muted: '#8C8775',
        dim: '#5C5A50',
        gold: '#C8B97A',
        'gold-soft': '#8A7F4F',
        'teal-conf': '#1D9E75',
        'amber-conf': '#EF9F27',
        'coral-conf': '#E24B4A',
      },
    },
  },
  plugins: [],
};

export default config;
