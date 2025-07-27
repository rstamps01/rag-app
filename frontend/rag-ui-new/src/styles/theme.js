// n8n.io-inspired theme configuration
export const theme = {
    colors: {
        primary: {
            bg: '#1a1a2e',
            secondary: '#16213e', 
            accent: '#0f3460',
            surface: '#1f2937',
            card: '#374151'
        },
        text: {
            primary: '#ffffff',
            secondary: '#d1d5db',
            muted: '#9ca3af',
            accent: '#60a5fa'
        },
        status: {
            success: '#10b981',
            warning: '#f59e0b', 
            error: '#ef4444',
            info: '#3b82f6',
            processing: '#8b5cf6'
        },
        border: {
            default: '#4b5563',
            hover: '#6b7280',
            focus: '#3b82f6'
        }
    },
    components: {
        card: 'bg-gray-800 border border-gray-700 rounded-lg',
        button: {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-medium',
            secondary: 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors font-medium',
            danger: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors font-medium',
            ghost: 'text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded transition-colors'
        },
        input: 'bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none',
        select: 'bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none'
    },
    layout: {
        header: 'bg-gray-800 border-b border-gray-700',
        sidebar: 'bg-gray-800 border-r border-gray-700',
        main: 'bg-gray-900 min-h-screen'
    }
};

export default theme;