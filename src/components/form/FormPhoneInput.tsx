import { forwardRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';

export interface FormPhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
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
  /** Current value (normalized format: +966XXXXXXXXX) */
  value?: string;
  /** Callback with normalized phone number (+966XXXXXXXXX) */
  onChange?: (normalizedValue: string) => void;
  /** Country code (default: +966 for Saudi Arabia) */
  countryCode?: string;
}

/**
 * Normalizes Saudi phone number to +966XXXXXXXXX format
 * 
 * Accepts:
 * - 0500000002 → +966500000002
 * - 500000002 → +966500000002
 * - +966500000002 → +966500000002
 * - 966500000002 → +966500000002
 */
export function normalizeSaudiPhone(phone: string, countryCode: string = '+966'): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If empty, return empty
  if (!cleaned) return '';
  
  // Remove any + signs for processing
  const withoutPlus = cleaned.replace(/\+/g, '');
  
  // If starts with 966, add + prefix
  if (withoutPlus.startsWith('966')) {
    return '+' + withoutPlus;
  }
  
  // If starts with 0, remove it and add country code
  if (withoutPlus.startsWith('0')) {
    return countryCode + withoutPlus.substring(1);
  }
  
  // If starts with 5 (Saudi mobile), add country code
  if (withoutPlus.startsWith('5') && withoutPlus.length === 9) {
    return countryCode + withoutPlus;
  }

  // If the input is too short to be a valid phone number (even without leading 0), return original
  // Typical Saudi numbers are 9 digits (without 0), e.g., 5XXXXXXXX or 11XXXXXXX
  if (withoutPlus.length < 7) {
    return cleaned;
  }
  
  // Otherwise, assume it needs country code (e.g. user typed 11XXXXXXX instead of 011XXXXXXX)
  return countryCode + withoutPlus;
}

/**
 * Formats phone for display (shows without + prefix for cleaner look)
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  // Remove +966 prefix for display, show as 05XXXXXXXX
  if (phone.startsWith('+966')) {
    return '0' + phone.substring(4);
  }
  return phone;
}

/**
 * FormPhoneInput - Specialized input for Saudi phone numbers
 * 
 * Automatically normalizes input to +966XXXXXXXXX format for API
 * Displays in local format (05XXXXXXXX) for user
 * 
 * @example
 * const [phone, setPhone] = useState('');
 * <FormPhoneInput
 *   label="رقم الهاتف"
 *   value={phone}
 *   onChange={setPhone}
 *   required
 * />
 * // User types: 0500000002
 * // Value in state: +966500000002
 */
export const FormPhoneInput = forwardRef<HTMLInputElement, FormPhoneInputProps>(
  ({ 
    label = 'رقم الهاتف', 
    error, 
    helperText, 
    required, 
    containerClassName, 
    className, 
    id,
    value = '',
    onChange,
    countryCode = '+966',
    ...props 
  }, ref) => {
    const inputId = id || props.name || 'phone';
    
    // Display value (local format)
    const [displayValue, setDisplayValue] = useState(() => formatPhoneForDisplay(value));
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Only allow digits and some special chars for typing comfort
      const sanitized = input.replace(/[^\d]/g, '');
      
      // Update display value
      setDisplayValue(sanitized.startsWith('0') ? sanitized : '0' + sanitized);
      
      // Normalize and send to parent
      if (onChange) {
        const normalized = normalizeSaudiPhone(sanitized, countryCode);
        onChange(normalized);
      }
    }, [onChange, countryCode]);

    // Sync display value when external value changes
    const displayVal = formatPhoneForDisplay(value) || displayValue;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            dir="ltr"
            placeholder="05XXXXXXXX"
            value={displayVal}
            onChange={handleChange}
            className={cn(
              'pr-10 text-left',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
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

FormPhoneInput.displayName = 'FormPhoneInput';
