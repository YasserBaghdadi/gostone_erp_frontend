/** بناء نص العنوان الوطني للباك إند بالشكل الموحد */
export type NationalAddressParts = {
  na_short: string;
  na_governorate: string;
  na_city: string;
  na_street: string;
  na_building: string;
  na_district: string;
  na_additional: string;
  na_postal: string;
};

export const emptyNationalAddressParts = (): NationalAddressParts => ({
  na_short: "",
  na_governorate: "",
  na_city: "",
  na_street: "",
  na_building: "",
  na_district: "",
  na_additional: "",
  na_postal: "",
});

export function buildNationalAddressString(p: NationalAddressParts): string {
  const parts: string[] = [];

  const short = p.na_short.replace(/\s/g, "").slice(0, 8);
  if (short.length === 8) {
    parts.push(short);
  }

  const gov = p.na_governorate.trim();
  if (gov) {
    parts.push(gov.startsWith("محافظة") ? gov : `محافظة ${gov}`);
  }

  const city = p.na_city.trim();
  if (city) {
    parts.push(city.startsWith("مدينة") ? city : `مدينة ${city}`);
  }

  const street = p.na_street.trim();
  if (street) {
    parts.push(street.startsWith("شارع") ? street : `شارع ${street}`);
  }

  const building = p.na_building.replace(/\D/g, "").slice(0, 4);
  if (building.length === 4) {
    parts.push(`رقم المبنى ${building}`);
  }

  const district = p.na_district.trim();
  if (district) {
    parts.push(district.startsWith("حي") ? district : `حي ${district}`);
  }

  const additional = p.na_additional.replace(/\D/g, "").slice(0, 4);
  if (additional.length === 4) {
    parts.push(`الرقم الفرعي ${additional}`);
  }

  const postal = p.na_postal.replace(/\D/g, "").slice(0, 5);
  if (postal.length === 5) {
    parts.push(`الرمز البريدي ${postal}`);
  }

  return parts.join("، ");
}

/** محاولة استرجاع الحقول من النص المحفوظ (للتعديل / العرض) */
export function parseNationalAddressString(
  address: string | null | undefined,
): NationalAddressParts {
  const out = emptyNationalAddressParts();
  if (!address?.trim()) return out;

  const rawParts = address.split(/،|,/).map((x) => x.trim()).filter(Boolean);

  for (const part of rawParts) {
    if (/^[A-Za-z0-9]{8}$/.test(part)) {
      if (!out.na_short) out.na_short = part;
      continue;
    }
    if (part.startsWith("محافظة")) {
      out.na_governorate = part.replace(/^محافظة\s+/, "").trim();
      continue;
    }
    if (part.startsWith("مدينة")) {
      out.na_city = part.replace(/^مدينة\s+/, "").trim();
      continue;
    }
    if (part.startsWith("شارع")) {
      out.na_street = part.replace(/^شارع\s+/, "").trim();
      continue;
    }
    if (part.startsWith("رقم المبنى")) {
      out.na_building = part.replace(/^رقم المبنى\s+/, "").replace(/\D/g, "").slice(0, 4);
      continue;
    }
    if (part.startsWith("حي")) {
      out.na_district = part.replace(/^حي\s+/, "").trim();
      continue;
    }
    if (part.startsWith("الرقم الفرعي")) {
      out.na_additional = part.replace(/^الرقم الفرعي\s+/, "").replace(/\D/g, "").slice(0, 4);
      continue;
    }
    if (part.startsWith("الرمز البريدي")) {
      out.na_postal = part.replace(/^الرمز البريدي\s+/, "").replace(/\D/g, "").slice(0, 5);
      continue;
    }
  }

  return out;
}
