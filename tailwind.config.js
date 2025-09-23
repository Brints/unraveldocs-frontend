/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // This path is for Angular projects
  ],
  theme: {
    extend: {
      // It's good practice to add your custom colors here
    },
    // Define the core colors your project will use
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'white': '#ffffff',
      'black': '#000000',
      // You can add a color palette here
      'gray': {
        100: '#f7fafc',
        // ...
        900: '#1a202c',
      },
      'blue': {
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      }
      // Add other colors needed for unraveldocs project
    },
  },
  plugins: [],
}
