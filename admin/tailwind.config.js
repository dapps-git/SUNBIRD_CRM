/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: 'hsl(var(--brand) / <alpha-value>)',
        'brand-dark': 'hsl(var(--brand-dark) / <alpha-value>)',
        'brand-light': 'hsl(var(--brand-light) / <alpha-value>)',
      },
      spacing: {
        '68': '17rem',
      }
    },
  },
  plugins: [],
}
