import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseBackendError(error: any): string {
  // Log the full error for debugging
  console.error("Full Error Object:", error);
  
  if (!error) return "حدث خطأ غير معروف";
  
  // Handle network errors (no response)
  if (!error.response) {
    // Check for timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return "انتهت مهلة الاتصال. الملف قد يكون كبيرًا جدًا أو الإنترنت بطيء.";
    }
    // Network error
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return "فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت.";
    }
    // Request was made but no response (server might be down or CORS)
    if (error.request) {
      return "الخادم لم يستجب. قد تكون المشكلة من الخادم أو حجم الملف كبير.";
    }
    return "حدث خطأ في الاتصال بالخادم";
  }
  
  const status = error.response.status;
  const data = error.response.data;
  
  // Handle 500 Internal Server Error specifically
  if (status >= 500) {
    return "خطأ من الخادم. يرجى التواصل مع الدعم الفني.";
  }
  
  if (!data) return `خطأ من الخادم (${status})`;

  // 1. Direct string error
  if (typeof data === 'string') return data;
  
  // 2. Common error fields
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (data.error) return data.error;

  // 3. Field errors (Django DRF style: { field: ["error"] })
  if (typeof data === 'object') {
    const messages = Object.entries(data)
      .map(([key, value]) => {
        const errorMsg = Array.isArray(value) ? value.join("، ") : String(value);
        return `${key === 'non_field_errors' ? 'خطأ عام' : key}: ${errorMsg}`;
      })
      .filter(Boolean);
      
    if (messages.length > 0) return messages.join("\n");
  }

  return "حدث خطأ غير معروف";
}

export function getDirtyValues<T extends Record<string, any>>(
  dirtyFields: Record<string, any>,
  allValues: T
): Partial<T> {
  const dirtyValues: Partial<T> = {};

  Object.keys(dirtyFields).forEach((key) => {
    // If true (field is dirty) or object (nested dirty fields)
    if (dirtyFields[key] === true || (typeof dirtyFields[key] === 'object' && dirtyFields[key] !== null)) {
      dirtyValues[key as keyof T] = allValues[key as keyof T];
    }
  });

  return dirtyValues;
}

/**
 * Prevents non-numeric characters like '-', 'e', '+' from being typed in number inputs.
 */
export const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["-", "e", "+", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

/**
 * Sanitizes a numeric text-input value to a NON-NEGATIVE number while the user
 * is still typing — without breaking partial input. It keeps only digits and a
 * single decimal point (so a leading "-" / negatives are dropped), and preserves
 * in-progress values like "" (cleared), "5." and "0.5". Do NOT parseFloat here:
 * doing so on every keystroke strips the decimal point and forces "0", which
 * makes it impossible to type decimals or clear the field.
 */
export const clampToPositive = (value: string | number): string => {
  let str = String(value ?? "");
  // keep only digits and dots (drops minus sign, letters, "e", "+", spaces…)
  str = str.replace(/[^\d.]/g, "");
  // collapse to a single decimal point (keep the first, drop the rest)
  const firstDot = str.indexOf(".");
  if (firstDot !== -1) {
    str = str.slice(0, firstDot + 1) + str.slice(firstDot + 1).replace(/\./g, "");
  }
  return str;
};

/**
 * Formats a price string by removing unnecessary trailing zeros.
 * "1750.00" -> "1750", "1750.50" -> "1750.5"
 */
export const formatPrice = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "0";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  // Use Number() to remove trailing zeros
  return String(Number(num));
};

/**
 * يحدّد ما إذا كان اسم العميل يشير إلى شركة/مؤسسة. عند التطابق يُفرض نوع العميل
 * "شركة" ولا يُقبل كـ"فرد". الواجهة تعكس هذا، والباك اند هو مصدر الحقيقة.
 * نغطّي إملائي التاء (ة/ه) و"موسس" بدون همزة.
 */
const COMPANY_NAME_KEYWORDS = ["شركة", "شركه", "مؤسس", "موسس"];

export function nameImpliesCompany(name?: string | null): boolean {
  const text = (name ?? "").toString();
  return COMPANY_NAME_KEYWORDS.some((keyword) => text.includes(keyword));
}

/** لون تمييز العميل من الـ API (مثل #8D50BD) */
export function customerAccentColor(color?: string | null): string {
  const c = color?.trim();
  return c && c.length > 0 ? c : "hsl(var(--border))";
}
