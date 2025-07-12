// File: frontend/rag-ui-new/src/components/ui/badge.jsx
// Badge - Reusable badge component for labels, status indicators, and tags

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        purple:
          "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
        pink:
          "border-transparent bg-pink-100 text-pink-800 hover:bg-pink-200",
        indigo:
          "border-transparent bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        gray:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

// Specialized badge components for common use cases
const StatusBadge = ({ status, ...props }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'healthy':
      case 'completed':
      case 'success':
        return 'success';
      case 'warning':
      case 'pending':
      case 'processing':
        return 'warning';
      case 'error':
      case 'failed':
      case 'critical':
      case 'offline':
        return 'destructive';
      case 'info':
      case 'draft':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} {...props}>
      {status}
    </Badge>
  );
};

const PriorityBadge = ({ priority, ...props }) => {
  const getPriorityVariant = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getPriorityVariant(priority)} {...props}>
      {priority}
    </Badge>
  );
};

const CategoryBadge = ({ category, colorMap = {}, ...props }) => {
  const getCategoryVariant = (category) => {
    // Use custom color mapping if provided
    if (colorMap[category]) {
      return colorMap[category];
    }

    // Default category color mapping
    const defaultColors = {
      performance: 'warning',
      security: 'destructive',
      optimization: 'info',
      cost: 'success',
      prediction: 'purple',
      maintenance: 'gray',
      system: 'secondary',
      database: 'indigo',
      api: 'pink',
      storage: 'info',
      network: 'purple',
      user: 'success',
      deployment: 'warning'
    };

    return defaultColors[category?.toLowerCase()] || 'secondary';
  };

  return (
    <Badge variant={getCategoryVariant(category)} {...props}>
      {category}
    </Badge>
  );
};

const CountBadge = ({ count, max = 99, showZero = false, ...props }) => {
  if (!showZero && (!count || count === 0)) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant="destructive" size="sm" {...props}>
      {displayCount}
    </Badge>
  );
};

const PercentageBadge = ({ percentage, thresholds = { good: 80, warning: 60 }, ...props }) => {
  const getPercentageVariant = (percentage) => {
    if (percentage >= thresholds.good) return 'success';
    if (percentage >= thresholds.warning) return 'warning';
    return 'destructive';
  };

  return (
    <Badge variant={getPercentageVariant(percentage)} {...props}>
      {percentage}%
    </Badge>
  );
};

const TrendBadge = ({ trend, value, ...props }) => {
  const getTrendVariant = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'up':
      case 'increasing':
      case 'positive':
        return 'success';
      case 'down':
      case 'decreasing':
      case 'negative':
        return 'destructive';
      case 'stable':
      case 'neutral':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTrendSymbol = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'up':
      case 'increasing':
      case 'positive':
        return '↗';
      case 'down':
      case 'decreasing':
      case 'negative':
        return '↘';
      case 'stable':
      case 'neutral':
        return '→';
      default:
        return '';
    }
  };

  return (
    <Badge variant={getTrendVariant(trend)} {...props}>
      {getTrendSymbol(trend)} {value || trend}
    </Badge>
  );
};

const ConfidenceBadge = ({ confidence, showPercentage = true, ...props }) => {
  const getConfidenceVariant = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    if (confidence >= 0.5) return 'info';
    return 'destructive';
  };

  const displayValue = showPercentage 
    ? `${Math.round(confidence * 100)}%`
    : confidence.toFixed(2);

  return (
    <Badge variant={getConfidenceVariant(confidence)} {...props}>
      {displayValue} confidence
    </Badge>
  );
};

// Export all badge components
export { 
  Badge, 
  StatusBadge, 
  PriorityBadge, 
  CategoryBadge, 
  CountBadge, 
  PercentageBadge, 
  TrendBadge, 
  ConfidenceBadge,
  badgeVariants 
};

// Default export
export default Badge;
