import React from 'react';
import theme from '../styles/theme';

// Card Component
export const Card = ({ children, className = '', ...props }) => (
    <div className={`${theme.components.card} p-4 ${className}`} {...props}>
        {children}
    </div>
);

// Button Component
export const Button = ({ 
    variant = 'primary', 
    size = 'md',
    children, 
    className = '', 
    disabled = false,
    ...props 
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900';
    
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-700',
        danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600',
        ghost: 'text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500'
    };
    
    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded',
        md: 'px-4 py-2 text-sm rounded',
        lg: 'px-6 py-3 text-base rounded-lg'
    };
    
    return (
        <button 
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'cursor-not-allowed' : ''}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

// Input Component
export const Input = ({ 
    type = 'text',
    className = '', 
    error = false,
    ...props 
}) => (
    <input 
        type={type}
        className={`${theme.components.input} ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
    />
);

// Select Component
export const Select = ({ children, className = '', error = false, ...props }) => (
    <select 
        className={`${theme.components.select} ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
    >
        {children}
    </select>
);

// Textarea Component
export const Textarea = ({ className = '', error = false, ...props }) => (
    <textarea 
        className={`${theme.components.input} resize-none ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
    />
);

// Badge Component
export const Badge = ({ 
    variant = 'default', 
    children, 
    className = '',
    ...props 
}) => {
    const variants = {
        default: 'bg-gray-600 text-gray-100',
        success: 'bg-green-600 text-green-100',
        warning: 'bg-yellow-600 text-yellow-100',
        error: 'bg-red-600 text-red-100',
        info: 'bg-blue-600 text-blue-100'
    };
    
    return (
        <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6', 
        lg: 'w-8 h-8'
    };
    
    return (
        <div className={`${sizes[size]} border-2 border-blue-400 border-t-transparent rounded-full animate-spin ${className}`}></div>
    );
};

// Alert Component
export const Alert = ({ 
    variant = 'info', 
    title,
    children, 
    className = '',
    ...props 
}) => {
    const variants = {
        info: 'bg-blue-900/20 border-blue-500 text-blue-100',
        success: 'bg-green-900/20 border-green-500 text-green-100',
        warning: 'bg-yellow-900/20 border-yellow-500 text-yellow-100',
        error: 'bg-red-900/20 border-red-500 text-red-100'
    };
    
    return (
        <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`} {...props}>
            {title && <h4 className="font-medium mb-2">{title}</h4>}
            {children}
        </div>
    );
};

// Page Header Component
export const PageHeader = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    actions,
    className = '' 
}) => (
    <div className={`${theme.layout.header} p-4 ${className}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                {Icon && <Icon className="w-6 h-6 text-blue-400" />}
                <div>
                    <h1 className="text-xl font-bold text-white">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
    </div>
);

// Status Indicator Component
export const StatusIndicator = ({ 
    status, 
    label,
    showDot = true,
    className = '' 
}) => {
    const statusConfig = {
        connected: { color: 'text-green-400', dotColor: 'bg-green-400' },
        disconnected: { color: 'text-red-400', dotColor: 'bg-red-400' },
        connecting: { color: 'text-yellow-400', dotColor: 'bg-yellow-400 animate-pulse' },
        processing: { color: 'text-blue-400', dotColor: 'bg-blue-400 animate-pulse' },
        error: { color: 'text-red-400', dotColor: 'bg-red-400' },
        success: { color: 'text-green-400', dotColor: 'bg-green-400' },
        warning: { color: 'text-yellow-400', dotColor: 'bg-yellow-400' }
    };
    
    const config = statusConfig[status] || statusConfig.disconnected;
    
    return (
        <div className={`flex items-center space-x-2 ${config.color} ${className}`}>
            {showDot && <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>}
            <span className="text-sm">{label || status}</span>
        </div>
    );
};

export default {
    Card,
    Button,
    Input,
    Select,
    Textarea,
    Badge,
    LoadingSpinner,
    Alert,
    PageHeader,
    StatusIndicator
};