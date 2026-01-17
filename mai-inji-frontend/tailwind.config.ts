import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4',
          600: '#16a34a',
          700: '#15803d',
        },
        brand: {
          primary: '#16a34a',
        },
        cream: '#e3d2c1',
        burgundy: '#9e2718',
        orange: '#f97300',
        darkred: '#800000',
      },
      transitionTimingFunction: {
        organic: 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};

export default config;
