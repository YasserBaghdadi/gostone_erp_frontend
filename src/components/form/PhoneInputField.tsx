/**
 * PhoneInputField - Reusable phone input for react-hook-form
 * 
 * Normalizes Saudi phone numbers to +966 format
 * Can be used in any form with react-hook-form controller pattern
 */

import { Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
// Import directly to avoid circular dependency
import { normalizeSaudiPhone, formatPhoneForDisplay } from '@/components/form/FormPhoneInput';

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputField({ 
  value, 
  onChange, 
  placeholder = "05xxxxxxxx",
  className,
  disabled,
}: PhoneInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only digits for entry
    const sanitized = input.replace(/[^\d]/g, '');
    // Normalize to +966 format for storage
    const normalized = normalizeSaudiPhone(sanitized);
    onChange(normalized);
  };

  // Display in local format (05xxxxxxxx)
  const displayValue = formatPhoneForDisplay(value);

  return (
    <div className="relative">
      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input 
        type="tel"
        inputMode="numeric"
        dir="ltr"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        className={`pr-10 text-left ${className || ''}`}
      />
    </div>
  );
}
