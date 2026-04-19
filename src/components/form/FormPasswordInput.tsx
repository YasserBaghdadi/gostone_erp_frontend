import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface FormPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Container className */
  containerClassName?: string;
  /** Show password strength indicator */
  showStrength?: boolean;
}

/**
 * FormPasswordInput - Password input with visibility toggle
 * 
 * @example
 * <FormPasswordInput
 *   label="كلمة المرور"
 *   name="password"
 *   error={errors.password?.message}
 *   required
 *   {...register('password')}
 * />
 */
export const FormPasswordInput = forwardRef<HTMLInputElement, FormPasswordInputProps>(
  ({ 
    label = 'كلمة المرور', 
    error, 
    helperText, 
    required, 
    containerClassName, 
    className, 
    id,
    showStrength: _showStrength = false,
    ...props 
  }, ref) => {
    const inputId = id || props.name || 'password';
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => setShowPassword((prev) => !prev);

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            dir="ltr"
            className={cn(
              'pr-10 pl-10 text-left',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
            onClick={toggleVisibility}
            tabIndex={-1}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormPasswordInput.displayName = 'FormPasswordInput';
