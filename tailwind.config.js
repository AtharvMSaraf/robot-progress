/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0a0a',
        panel:    '#121212',
        panel2:   '#171717',
        border:   '#262626',
        text:     '#f5f5f5',
        muted:    '#a3a3a3',
        accent:   '#facc15',   // yellow-400
        accent2:  '#f59e0b',   // amber-500
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
