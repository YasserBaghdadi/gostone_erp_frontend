import { type Control, type FieldValues, type Path } from "react-hook-form";
import { MapPin } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
          <FormItem className="text-center">
            <FormLabel className="text-center">{label}</FormLabel>
            <FormControl>
              <div className="flex gap-1.5 flex-wrap justify-center" dir="ltr">
                {Array.from({ length }).map((_, i) => (
                  <Input
                    key={i}
                    readOnly={false}
                    inputMode="numeric"
                    autoComplete="off"
                    className="h-10 w-9 sm:w-10 text-center font-mono p-0 text-sm tabular-nums rounded-lg"
                    maxLength={1}
                    value={digits[i] ?? ""}
                    onChange={(e) => setAt(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i] && i > 0) {
                        const prev =
                          e.currentTarget.parentElement?.children[
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

export function CustomerNationalAddressFields<T extends FieldValues>({
  control,
  className,
}: {
  control: Control<T>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/50 pb-2">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        تفاصيل العنوان الوطني
      </div>

      {/* رقم المبنى + الشارع بجوار بعض */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DigitBoxes
          control={control}
          name={"na_building" as Path<T>}
          length={4}
          label="رقم المبنى"
        />
        <FormField
          control={control}
          name={"na_street" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-center">الشارع</FormLabel>
              <FormControl>
                <Input
                  placeholder="اسم الشارع"
                  {...field}
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* الرقم الفرعي + الحي بجوار بعض */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DigitBoxes
          control={control}
          name={"na_additional" as Path<T>}
          length={4}
          label="الرقم الفرعي"
        />
        <FormField
          control={control}
          name={"na_district" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-center">الحي</FormLabel>
              <FormControl>
                <Input
                  placeholder="اسم الحي"
                  {...field}
                  className="h-11 rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* الرمز البريدي */}
      <div className="max-w-xl">
        <DigitBoxes
          control={control}
          name={"na_postal" as Path<T>}
          length={5}
          label="الرمز البريدي"
        />
      </div>

      {/* المدينة */}
      <FormField
        control={control}
        name={"na_city" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-center">المدينة</FormLabel>
            <FormControl>
              <Input
                placeholder="اسم المدينة"
                {...field}
                className="h-11 rounded-xl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

