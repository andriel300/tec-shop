import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const alertVariants = cva(
  'mb-6 p-4 rounded-lg flex items-start gap-3 border',
  {
    variants: {
      variant: {
        success: 'bg-green-900/50 border-green-500',
        error: 'bg-red-900/50 border-red-500',
        warning: 'bg-yellow-900/50 border-yellow-500',
        info: 'bg-blue-900/50 border-blue-500',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

const titleColorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

const descriptionColorMap = {
  success: 'text-green-300',
  error: 'text-red-300',
  warning: 'text-yellow-300',
  info: 'text-blue-300',
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
        <h3 className={`font-semibold ${titleColorMap[variant as keyof typeof titleColorMap]}`}>
          {title}
        </h3>
        {description && (
          <p className={`text-sm mt-1 ${descriptionColorMap[variant as keyof typeof descriptionColorMap]}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

Alert.displayName = 'Alert';

export { Alert, alertVariants };
