import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      danger: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Helper function to get badge variant for lifecycle stages
export const getLifecycleBadgeVariant = (stage: string): BadgeProps['variant'] => {
  switch (stage) {
    case 'lead':
      return 'default';
    case 'mql':
      return 'info';
    case 'sql':
      return 'purple';
    case 'customer':
      return 'success';
    default:
      return 'default';
  }
};

// Helper function to get badge variant for deal stages
export const getDealStageBadgeVariant = (stage: string): BadgeProps['variant'] => {
  switch (stage) {
    case 'discovery':
      return 'default';
    case 'proposal':
      return 'info';
    case 'negotiation':
      return 'warning';
    case 'closed_won':
      return 'success';
    case 'closed_lost':
      return 'danger';
    default:
      return 'default';
  }
};

// Helper function to get badge variant for task priority
export const getTaskPriorityBadgeVariant = (priority: string): BadgeProps['variant'] => {
  switch (priority) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
};

// Helper function to get badge variant for task status
export const getTaskStatusBadgeVariant = (status: string): BadgeProps['variant'] => {
  switch (status) {
    case 'todo':
      return 'default';
    case 'in_progress':
      return 'info';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

// Helper function to get badge variant for ticket status
export const getTicketStatusBadgeVariant = (status: string): BadgeProps['variant'] => {
  switch (status) {
    case 'open':
      return 'danger';
    case 'in_progress':
      return 'info';
    case 'waiting_on_client':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

export default Badge;
