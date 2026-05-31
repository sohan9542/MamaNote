/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mamanote pastel palette
        pink: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
        },
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
        },
        beige: {
          50: '#FDFCF8',
          100: '#FAF6EE',
          200: '#F5EBD7',
          300: '#EBD9B4',
          400: '#D9BC8A',
          500: '#C19A5B',
        },
        ink: {
          50: '#F8F7FB',
          100: '#EEEBF4',
          200: '#D8D2E3',
          300: '#A89FBE',
          400: '#6E6485',
          500: '#4A4360',
          600: '#322C44',
          700: '#221E30',
          800: '#1A1625',
          900: '#100D18',
        },
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular'],
        display: ['PlusJakartaSans_700Bold'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
