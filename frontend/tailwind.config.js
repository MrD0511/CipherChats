// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Adjust paths based on your project structure
  ],
  theme: {
    extend: {
      colors: {
        'background-dark': '#000000',
        'background-light': '#0f131e',
        'accent-color': '#8a2be2',
        'text-color': '#e1e1e1',
        'secondary-color': '#3f3f5f',
        'border-color' : '#3f3f5f',
        'gray-200': '#e1e1e1',
        'gray-400': '#9e9e9e',
        'gray-700': '#1f2937',
        'green-500': '#22c55e',
        'green-600': '#16a34a',
      },
    },
  },
  plugins: [],
}
