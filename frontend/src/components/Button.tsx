import { ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'danger' | 'secondary';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={classNames('button', {
        'button--primary': variant === 'primary',
        'button--ghost': variant === 'ghost',
        'button--quiet': variant === 'quiet',
        'button--danger': variant === 'danger',
        'button--secondary': variant === 'secondary',
        'button--xs': size === 'xs',
        'button--sm': size === 'sm',
        'button--md': size === 'md',
        'button--lg': size === 'lg',
        'button--loading': loading
      }, className)}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="button__spinner" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="button__spinner-icon">
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="24"
              strokeDashoffset="6"
            />
          </svg>
        </span>
      )}

      {leftIcon && !loading && (
        <span className="button__icon button__icon--left" aria-hidden>
          {leftIcon}
        </span>
      )}

      <span className="button__content">{children}</span>

      {rightIcon && !loading && (
        <span className="button__icon button__icon--right" aria-hidden>
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;
