/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          500: '#BA7517',
          400: '#EF9F27',
          100: '#FAEEDA'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
}
