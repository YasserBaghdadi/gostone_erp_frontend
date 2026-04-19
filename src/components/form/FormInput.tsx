import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Container className */
  containerClassName?: string;
}

/**
 * FormInput component with label and error handling
 * 
 * @example
 * <FormInput
 *   label="الاسم"
 *   name="name"
 *   error={errors.name?.message}
 *   required
 *   {...register('name')}
 * />
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, containerClassName, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={inputId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        <Input
          ref={ref}
          id={inputId}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        
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

FormInput.displayName = 'FormInput';
