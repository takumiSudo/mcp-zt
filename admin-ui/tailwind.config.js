/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(214, 32%, 91%)',
        input: 'hsl(210, 16%, 93%)',
        ring: 'hsl(212, 92%, 43%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(210, 10%, 23%)',
        primary: {
          DEFAULT: 'hsl(212, 92%, 43%)',
          foreground: '#fff',
        },
      },
      borderRadius: {
        lg: '16px',
      },
    },
  },
  plugins: [],
};
