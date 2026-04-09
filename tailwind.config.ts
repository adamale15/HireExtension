import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,tsx,ts,jsx,js}'],
  theme: {
    extend: {
      colors: {
        'safe-apply': '#10b981',
        'moderate-apply': '#f59e0b',
        'dont-apply': '#ef4444',
      }
    }
  },
  plugins: []
} satisfies Config;
