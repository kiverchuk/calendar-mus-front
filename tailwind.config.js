/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', '-apple-system', 'Roboto', 'Helvetica', 'sans-serif'],
        cairo: ['Cairo', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
