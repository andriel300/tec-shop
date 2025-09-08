// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    //     ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8', // Deep Blue
          light: '#3B82F6', // Lighter shade for hover
          dark: '#1E40AF', // Darker shade for active
        },
        secondary: {
          DEFAULT: '#F97316', // Vibrant Orange
          light: '#FB923C',
          dark: '#C2410C',
        },
        accent: '#14B8A6', // Soft Teal
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: {
          light: '#FFFFFF',
          dark: '#111827',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
