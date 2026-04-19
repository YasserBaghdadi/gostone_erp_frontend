import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type NationalAddressParts, parseNationalAddressString } from "@/modules/purchase_orders/utils/nationalAddress";
import { cn } from "@/lib/utils";

function DigitBoxes({
  value,
  length,
  label,
}: {
  value: string | null | undefined;
  length: number;
  label: string;
}) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, length);

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="flex gap-1.5 flex-wrap justify-center" dir="ltr">
        {Array.from({ length }).map((_, i) => (
          <Input
            key={i}
            readOnly
            inputMode="numeric"
            autoComplete="off"
            className="h-10 w-9 sm:w-10 text-center font-mono p-0 text-sm tabular-nums rounded-lg bg-muted/20 border border-border/50"
            maxLength={1}
            value={digits[i] ?? ""}
          />
        ))}
      </div>
    </div>
  );
}

export function NationalAddressReadOnlyFields({
  address,
  street,
  building_number,
  district,
  secondary_number,
  postal_code,
  city,
  className,
}: {
  address?: string | null;
  street?: string | null;
  building_number?: string | null;
  district?: string | null;
  secondary_number?: string | null;
  postal_code?: string | null;
  city?: string | null;
  className?: string;
}) {
  const raw = address?.trim();
  const hasParts =
    street?.trim() ||
    building_number?.trim() ||
    district?.trim() ||
    secondary_number?.trim() ||
    postal_code?.trim() ||
    city?.trim();

  let p: NationalAddressParts;

  // إذا كانت أجزاء العنوان موجودة من الـ API نعرضها مباشرة (بدون الاعتماد على field `address` كنص).
  if (hasParts) {
    p = {
      na_short: "",
      na_governorate: "",
      na_city: city ?? "",
      na_street: street ?? "",
      na_building: building_number ?? "",
      na_district: district ?? "",
      na_additional: secondary_number ?? "",
      na_postal: postal_code ?? "",
    };
  } else if (raw) {
    p = parseNationalAddressString(raw);
  } else {
    return <p className="text-sm font-medium text-muted-foreground">غير محدد</p>;
  }

  const hasAny =
    p.na_city ||
    p.na_street ||
    p.na_building ||
    p.na_district ||
    p.na_additional ||
    p.na_postal;

  if (!hasAny) {
    return (
      <p className={cn("text-sm font-medium leading-relaxed wrap-break-word whitespace-pre-wrap", className)}>
        {raw}
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border/50 pb-2">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        تفاصيل العنوان الوطني
      </div>

      {/* رقم المبنى + الشارع بجوار بعض */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DigitBoxes value={p.na_building} length={4} label="رقم المبنى" />
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">الشارع</div>
          <Input
            readOnly
            value={p.na_street}
            className="h-11 rounded-xl bg-muted/20 border border-border/50"
          />
        </div>
      </div>

      {/* الرقم الفرعي + الحي بجوار بعض */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DigitBoxes value={p.na_additional} length={4} label="الرقم الفرعي" />
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">الحي</div>
          <Input
            readOnly
            value={p.na_district}
            className="h-11 rounded-xl bg-muted/20 border border-border/50"
          />
        </div>
      </div>

      {/* الرمز البريدي */}
      <DigitBoxes value={p.na_postal} length={5} label="الرمز البريدي" />

      {/* المدينة */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-foreground">المدينة</div>
        <Input
          readOnly
          value={p.na_city}
          className="h-11 rounded-xl bg-muted/20 border border-border/50"
        />
      </div>
    </div>
  );
}

