import { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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
 * FormTextarea component with label and error handling
 * 
 * @example
 * <FormTextarea
 *   label="الملاحظات"
 *   name="notes"
 *   error={errors.notes?.message}
 *   rows={4}
 *   {...register('notes')}
 * />
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, required, containerClassName, className, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={textareaId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        <Textarea
          ref={ref}
          id={textareaId}
          className={cn(
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
