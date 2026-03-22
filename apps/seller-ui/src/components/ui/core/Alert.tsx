import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const alertVariants = cva('mb-6 p-4 rounded-lg flex items-start gap-3 border', {
  variants: {
    variant: {
      success: 'bg-feedback-success/10 border-feedback-success/30',
      error: 'bg-feedback-error/10 border-feedback-error/30',
      warning: 'bg-feedback-warning/10 border-feedback-warning/30',
      info: 'bg-feedback-info/10 border-feedback-info/30',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  success: 'text-feedback-success',
  error: 'text-feedback-error',
  warning: 'text-feedback-warning',
  info: 'text-feedback-info',
};

const titleColorMap = {
  success: 'text-feedback-success',
  error: 'text-feedback-error',
  warning: 'text-feedback-warning',
  info: 'text-feedback-info',
};

const descriptionColorMap = {
  success: 'text-gray-900',
  error: 'text-gray-900',
  warning: 'text-gray-900',
  info: 'text-gray-900',
};

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title: string;
  description?: string;
  className?: string;
  showIcon?: boolean;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  className,
  showIcon = true,
}) => {
  const Icon = iconMap[variant as keyof typeof iconMap];

  return (
    <div className={alertVariants({ variant, className })}>
      {showIcon && Icon && (
        <Icon
          className={iconColorMap[variant as keyof typeof iconColorMap]}
          size={24}
        />
      )}
      <div className="flex-1">
        <h3
          className={`font-semibold ${
            titleColorMap[variant as keyof typeof titleColorMap]
          }`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`text-sm mt-1 ${
              descriptionColorMap[variant as keyof typeof descriptionColorMap]
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';

export { Alert, alertVariants };
