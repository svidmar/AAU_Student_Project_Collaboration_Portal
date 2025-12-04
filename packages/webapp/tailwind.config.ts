import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'aau-blue': '#211a52',
        'aau-light-blue': '#594fbf',
        'aau-dark-gray': '#54616e',
      },
      fontFamily: {
        sans: ['Barlow', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
