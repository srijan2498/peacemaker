/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cozy: {
          bg: '#FFFDF8',
          card: '#FFFFFF',
          text: '#292D35',
          muted: '#858996',
          lavender: '#A78BFA',
          'lavender-soft': '#F0EAFF',
          mint: '#B7E4C7',
          'mint-soft': '#E8F7EE',
          peach: '#FFD6BA',
          'peach-soft': '#FFF2EB',
          pink: '#FADADD',
          'pink-soft': '#FDF2F4',
          sky: '#D9EEFF',
          'sky-soft': '#F0F8FF',
          yellow: '#FFF1BA',
          'yellow-soft': '#FFFDF0',
          darkBg: '#13151A',
          darkCard: '#1C2029',
          darkText: '#F3F4F6',
          darkMuted: '#9CA3AF'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Nunito', 'sans-serif']
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(167, 139, 250, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 8px 24px -4px rgba(167, 139, 250, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 16px 36px -6px rgba(167, 139, 250, 0.16), 0 6px 16px -3px rgba(0, 0, 0, 0.06)'
      }
    }
  },
  plugins: []
};
