// Theme configuration for RAG Application
// Consistent dark theme matching Pipeline Monitor design

export const theme = {
  colors: {
    // Background colors
    background: {
      primary: 'bg-gray-900',
      secondary: 'bg-gray-800',
      tertiary: 'bg-gray-700',
    },
    
    // Text colors
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      muted: 'text-gray-400',
    },
    
    // Accent colors
    accent: {
      primary: 'text-blue-400',
      secondary: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
    },
    
    // Border colors
    border: {
      primary: 'border-gray-700',
      secondary: 'border-gray-600',
      accent: 'border-blue-500',
    }
  },
  
  components: {
    // Card component styles
    card: 'bg-gray-800 border border-gray-700 rounded-lg shadow-lg',
    
    // Button styles
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200',
      secondary: 'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200',
      outline: 'border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-colors duration-200',
    },
    
    // Input styles
    input: 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    
    // Navigation styles
    nav: {
      background: 'bg-gray-800 border-b border-gray-700',
      link: 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
      activeLink: 'bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium',
    }
  },
  
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-8',
    grid: 'grid gap-6',
  }
};

export default theme;
