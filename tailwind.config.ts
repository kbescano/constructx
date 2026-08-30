import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#1877F2',
          hover: '#0A4FB0',
        },
        sage: {
          DEFAULT: '#a8bdd8',
          tint: 'rgba(168, 189, 216, 0.15)',
        },
        ink: '#050505',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      spacing: {
        section: '112px',
      },
    },
  },
  plugins: [],
}

export default config
