/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx}",
    ],
    theme: {
      extend: {
        colors: {
          // VAST Data Brand Colors
          vast: {
            primary: '#00D4AA',      // Teal/Green - Primary brand color
            secondary: '#0066CC',    // Blue - Secondary brand color
            accent: '#FF6B35',       // Orange - Accent color
            neutral: '#2C3E50',      // Dark Blue-Grey - Text and borders
            light: '#F8F9FA',        // Light Grey - Backgrounds
            dark: '#1A1A1A',         // Dark Background
            medium: '#6C757D',       // Medium Grey
          },
          // Pipeline Node Colors
          node: {
            query: '#00D4AA',        // Teal for input nodes
            process: '#0066CC',      // Blue for processing nodes
            output: '#FF6B35',       // Orange for output nodes
            resource: '#6C5CE7',     // Purple for monitoring nodes
            vector: '#00B894',       // Green for vector operations
          },
          // Status Colors
          status: {
            success: '#00D4AA',      // Success state
            warning: '#FF6B35',      // Warning state
            error: '#E74C3C',        // Error state
            info: '#0066CC',         // Info state
          }
        },
        fontFamily: {
          'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        },
        animation: {
          'pulse-slow': 'pulse 3s infinite',
          'bounce-slow': 'bounce 2s infinite',
          'spin-slow': 'spin 3s linear infinite',
        },
        backdropBlur: {
          xs: '2px',
        },
        boxShadow: {
          'vast': '0 4px 12px rgba(0, 212, 170, 0.15)',
          'vast-lg': '0 8px 24px rgba(0, 212, 170, 0.2)',
        }
      },
    },
    plugins: [require("tailwindcss-animate")],
  }