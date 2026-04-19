import { type Control, type FieldValues, type Path } from "react-hook-form";
import { MapPin } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function DigitBoxes<T extends FieldValues>({
  control,
  name,
  length,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  length: number;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const digits = String(field.value ?? "")
          .replace(/\D/g, "")
          .slice(0, length);

        const setAt = (index: number, ch: string) => {
          const d = ch.replace(/\D/g, "").slice(-1);
          const arr = Array.from({ length }, (_, j) => digits[j] || "");
          if (d) arr[index] = d;
          else arr[index] = "";
          field.onChange(arr.join(""));
        };

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div
                className='flex gap-1.5 flex-wrap justify-end'
                dir='ltr'
              >
                {Array.from({ length }).map((_, i) => (
                  <Input
                    key={i}
                    inputMode='numeric'
                    autoComplete='off'
                    className='h-10 w-9 sm:w-10 text-center font-mono p-0 text-sm tabular-nums rounded-lg'
                    maxLength={1}
                    value={digits[i] ?? ""}
                    onChange={(e) => setAt(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i] && i > 0) {
                        const prev = e.currentTarget.parentElement?.children[
                          i - 1
                        ] as HTMLInputElement | undefined;
                        prev?.focus();
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function ShortAddressBoxes<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const raw = String(field.value ?? "")
          .replace(/\s/g, "")
          .slice(0, 8)
          .toUpperCase();

        const setAt = (index: number, ch: string) => {
          const c = ch.replace(/[^A-Za-z0-9]/g, "").slice(-1).toUpperCase();
          const arr = raw.padEnd(8, " ").split("");
          if (c) arr[index] = c;
          else arr[index] = "";
          field.onChange(arr.join("").replace(/\s/g, "").slice(0, 8));
        };

        return (
          <FormItem>
            <FormLabel>العنوان المختصر</FormLabel>
            <FormControl>
              <div className='flex gap-1.5 flex-wrap justify-end' dir='ltr'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Input
                    key={i}
                    autoComplete='off'
                    className='h-10 w-9 sm:w-10 text-center font-mono p-0 text-sm uppercase rounded-lg'
                    maxLength={1}
                    value={raw[i] ?? ""}
                    onChange={(e) => setAt(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !raw[i] && i > 0) {
                        const prev = e.currentTarget.parentElement?.children[
                          i - 1
                        ] as HTMLInputElement | undefined;
                        prev?.focus();
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

type NationalAddressFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  className?: string;
};

export function NationalAddressFields<T extends FieldValues>({
  control,
  className,
}: NationalAddressFieldsProps<T>) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className='flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/50 pb-2'>
        <MapPin className='h-4 w-4 text-primary shrink-0' />
        تفاصيل العنوان الوطني
      </div>

      <ShortAddressBoxes control={control} name={"na_short" as Path<T>} />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <FormField
          control={control}
          name={"na_street" as Path<T>}
          render={({ field }) => (
            <FormItem className='md:col-span-2'>
              <FormLabel>الشارع</FormLabel>
              <FormControl>
                <Input
                  placeholder='اسم الشارع'
                  {...field}
                  className='h-11 rounded-xl'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DigitBoxes
          control={control}
          name={"na_building" as Path<T>}
          length={4}
          label='رقم المبنى'
        />

        <FormField
          control={control}
          name={"na_district" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>الحي</FormLabel>
              <FormControl>
                <Input placeholder='اسم الحي' {...field} className='h-11 rounded-xl' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DigitBoxes
          control={control}
          name={"na_additional" as Path<T>}
          length={4}
          label='الرقم الفرعي'
        />

        <DigitBoxes
          control={control}
          name={"na_postal" as Path<T>}
          length={5}
          label='الرمز البريدي'
        />

        <FormField
          control={control}
          name={"na_governorate" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>المحافظة</FormLabel>
              <FormControl>
                <Input
                  placeholder='مثال: المدينة المنورة'
                  {...field}
                  className='h-11 rounded-xl'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={"na_city" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>المدينة</FormLabel>
              <FormControl>
                <Input
                  placeholder='مثال: المدينة المنورة'
                  {...field}
                  className='h-11 rounded-xl'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
