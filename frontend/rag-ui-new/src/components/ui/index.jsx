import React from 'react';
import theme from '../../styles/theme';

// Card Component
export const Card = ({ children, className = '', ...props }) => (
    <div className={`${theme.components.card} p-4 ${className}`} {...props}>
        {children}
    </div>
);

// Button Component
export const Button = ({ children, variant = 'primary', className = '', ...props }) => (
    <button className={`${theme.components.button[variant]} ${className}`} {...props}>
        {children}
    </button>
);

// Input Component
export const Input = ({ className = '', ...props }) => (
    <input className={`${theme.components.input} ${className}`} {...props} />
);

// Alert Component
export const Alert = ({ children, type = 'info', className = '', ...props }) => {
    const alertStyles = {
        info: 'bg-blue-900 border-blue-700 text-blue-200',
        success: 'bg-green-900 border-green-700 text-green-200',
        warning: 'bg-yellow-900 border-yellow-700 text-yellow-200',
        error: 'bg-red-900 border-red-700 text-red-200'
    };
    
    return (
        <div className={`border rounded-lg p-4 ${alertStyles[type]} ${className}`} {...props}>
            {children}
        </div>
    );
};

// Badge Component
export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
    const badgeStyles = {
        default: 'bg-gray-700 text-gray-200',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white'
    };
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`} {...props}>
            {children}
        </span>
    );
};

// Progress Component
export const Progress = ({ value = 0, max = 100, className = '', ...props }) => (
    <div className={`w-full bg-gray-700 rounded-full h-2.5 ${className}`} {...props}>
        <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(value / max) * 100}%` }}
        ></div>
    </div>
);

// Spinner Component
export const Spinner = ({ size = 'md', className = '', ...props }) => {
    const sizeStyles = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    
    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeStyles[size]} ${className}`} {...props}></div>
    );
};

// Modal Component
export const Modal = ({ isOpen, onClose, children, className = '', ...props }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-900 opacity-75" onClick={onClose}></div>
                </div>
                
                <div className={`inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`} {...props}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Dropdown Component
export const Dropdown = ({ options = [], value, onChange, placeholder = 'Select...', className = '', ...props }) => (
    <select 
        className={`${theme.components.input} ${className}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...props}
    >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
            <option key={index} value={option.value || option}>
                {option.label || option}
            </option>
        ))}
    </select>
);

// Textarea Component
export const Textarea = ({ className = '', ...props }) => (
    <textarea className={`${theme.components.input} resize-vertical ${className}`} {...props} />
);

// Container Component
export const Container = ({ children, className = '', ...props }) => (
    <div className={`${theme.layout.container} ${className}`} {...props}>
        {children}
    </div>
);

// Section Component
export const Section = ({ children, className = '', ...props }) => (
    <div className={`${theme.layout.section} ${className}`} {...props}>
        {children}
    </div>
);

// Grid Component
export const Grid = ({ children, cols = 1, gap = 6, className = '', ...props }) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };
    
    return (
        <div className={`grid ${gridCols[cols]} gap-${gap} ${className}`} {...props}>
            {children}
        </div>
    );
};

// Loading Component
export const Loading = ({ text = 'Loading...', className = '', ...props }) => (
    <div className={`flex items-center justify-center space-x-2 ${className}`} {...props}>
        <Spinner />
        <span className="text-gray-300">{text}</span>
    </div>
);

// Export theme for direct use
export { theme };

// Default export
export default {
    Card,
    Button,
    Input,
    Alert,
    Badge,
    Progress,
    Spinner,
    Modal,
    Dropdown,
    Textarea,
    Container,
    Section,
    Grid,
    Loading,
    theme
};
