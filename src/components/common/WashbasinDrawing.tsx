import {
  BOWL_TYPE_LABELS,
  HOLE_POSITION_LABELS,
  FAUCET_HOLE_LABELS,
} from "@/types";
import type { WashbasinSpec, WashbasinBowlType } from "@/types";

/**
 * رسم إيزومتري (3D) بارامتري لمغسلة مفصّلة انطلاقاً من مواصفاتها.
 *
 * إسقاط مائل (cabinet oblique): إحداثيات السطح بالسنتيمتر (x على الطول،
 * y على العمق) تُحوّل إلى إحداثيات الشاشة عبر مصفوفة:
 *   screenX = a*x + c*y + e
 *   screenY = b*x + d*y + f
 * حيث a = s (px لكل سم على الطول)، c = recede, d = -recede, b = 0.
 */

const VIEW_W = 980;
const VIEW_H = 640;

// نقطة الأصل للسطح (الزاوية الأمامية اليسرى) على الشاشة
const ORIGIN_X = 250;
const ORIGIN_Y = 360;

// حدود معقولة كي يبقى الرسم داخل إطار 980×640 مهما كانت المقاسات
const TARGET_LENGTH_PX = 336; // العرض المرجعي للسطح على الشاشة
const MIN_SCALE = 1.4;
const MAX_SCALE = 4.6;
const MIN_RECEDE = 14; // أقل عمق ظاهري بالبكسل
const MAX_RECEDE = 150;
const MIN_THICKNESS = 18;
const MAX_THICKNESS = 96;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** عدد للعرض، أو شرطة عند غياب القيمة. تقبل القيم الرقمية أو النصية (الـAPI يرجّع الأرقام كنص). */
function dash(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? String(n) : "—";
}

/** شكل الحوض المرسوم داخل مجموعة المصفوفة بحسب نوعه */
type BowlShapeKind = "ellipse" | "rounded" | "rect";

function bowlShapeKind(type: WashbasinBowlType | null): BowlShapeKind {
  switch (type) {
    case "ceramic_square":
    case "porcelain_square":
    case "square_with_tile":
      return "rounded";
    case "waterfall_pipe":
    case "waterfall_slot":
      return "rect";
    case "ceramic_oval":
    case "ceramic_round":
    case "special":
    default:
      return "ellipse";
  }
}

interface BowlCm {
  /** مركز الحوض بإحداثيات السطح (سم) */
  cx: number;
  cy: number;
  /** نصف القطر بالسنتيمتر على الطول والعمق */
  rx: number;
  ry: number;
}

export function WashbasinDrawing({ spec }: { spec: WashbasinSpec }) {
  const surfaceLength = spec.surface_length && spec.surface_length > 0 ? spec.surface_length : 120;
  const surfaceWidth = spec.surface_width && spec.surface_width > 0 ? spec.surface_width : 55;
  const frontHeight = spec.front_height && spec.front_height > 0 ? spec.front_height : 20;

  // مقياس px/cm محسوب من الطول الحقيقي مع تثبيته ضمن حدود معقولة
  const scale = clamp(TARGET_LENGTH_PX / surfaceLength, MIN_SCALE, MAX_SCALE);
  const recede = clamp(surfaceWidth * scale * 0.5, MIN_RECEDE, MAX_RECEDE);
  const thicknessPx = clamp(frontHeight * scale, MIN_THICKNESS, MAX_THICKNESS);

  const lengthPx = surfaceLength * scale;

  // مصفوفة تحويل: cm على السطح -> شاشة
  const matrix = `matrix(${scale},0,${recede / surfaceWidth},${-recede / surfaceWidth},${ORIGIN_X},${ORIGIN_Y})`;

  // زوايا السطح (المسقط العلوي) على الشاشة
  const flX = ORIGIN_X; // front-left
  const flY = ORIGIN_Y;
  const frX = ORIGIN_X + lengthPx; // front-right
  const frY = ORIGIN_Y;
  const blX = ORIGIN_X + recede; // back-left
  const blY = ORIGIN_Y - recede;
  const brX = ORIGIN_X + lengthPx + recede; // back-right
  const brY = ORIGIN_Y - recede;

  // الوجه الأمامي (السُمك) ينزل من الحافة الأمامية للسطح
  const fblX = flX; // front-bottom-left
  const fblY = flY + thicknessPx;
  const fbrX = frX; // front-bottom-right
  const fbrY = frY + thicknessPx;

  // الوجه الأيمن
  const rbrX = brX; // right-back-bottom
  const rbrY = brY + thicknessPx;

  const topPoly = `${flX},${flY} ${frX},${frY} ${brX},${brY} ${blX},${blY}`;
  const frontPoly = `${flX},${flY} ${frX},${frY} ${fbrX},${fbrY} ${fblX},${fblY}`;
  const rightPoly = `${frX},${frY} ${brX},${brY} ${rbrX},${rbrY} ${fbrX},${fbrY}`;

  // مواضع الأحواض ونصف أقطارها (سم)
  const defaultRy = surfaceWidth * 0.34;
  const defaultRx = Math.min(surfaceLength * (spec.bowls_count === 2 ? 0.22 : 0.34), defaultRy * 1.3);
  const customRx = spec.bowl_length && spec.bowl_length > 0 ? spec.bowl_length / 2 : defaultRx;
  const customRy = spec.bowl_width && spec.bowl_width > 0 ? spec.bowl_width / 2 : defaultRy;
  const rx = spec.has_custom_bowl_size ? customRx : defaultRx;
  const ry = spec.has_custom_bowl_size ? customRy : defaultRy;

  const bowls: BowlCm[] = [];
  if (spec.bowls_count === 2) {
    bowls.push({ cx: surfaceLength * 0.3, cy: surfaceWidth / 2, rx, ry });
    bowls.push({ cx: surfaceLength * 0.7, cy: surfaceWidth / 2, rx, ry });
  } else {
    bowls.push({ cx: surfaceLength / 2, cy: surfaceWidth / 2, rx, ry });
  }

  // إزاحة فتحة التصريف حسب موضعها (± ~30% من نصف قطر الحوض على الطول)
  const holeOffset =
    spec.hole_position === "left"
      ? -rx * 0.3
      : spec.hole_position === "right"
        ? rx * 0.3
        : 0;

  const kind = bowlShapeKind(spec.bowl_type);

  // نصف قطر تدوير زوايا الـ rect (للأحواض المربعة)
  const rectRound = Math.min(rx, ry) * 0.35;

  const labelFont = "'IBM Plex Sans Arabic','Tajawal',sans-serif";

  // خط أبعاد الطول (أسفل الوجه الأمامي)
  const dimLenY = fblY + 34;
  // خط أبعاد العرض (على طول الحافة اليمنى الخلفية للسطح)
  // خط أبعاد السُمك (على الزاوية الأمامية اليسرى)
  const thickLineX = flX - 26;

  const chips: { label: string; value: string }[] = [
    { label: "عدد الأحواض", value: spec.bowls_count === 2 ? "حوضين" : "حوض" },
    {
      label: "نوع الحوض",
      value: spec.bowl_type ? BOWL_TYPE_LABELS[spec.bowl_type] : "—",
    },
    {
      label: "فتحة الحوض",
      value: spec.hole_position ? HOLE_POSITION_LABELS[spec.hole_position] : "—",
    },
    {
      label: "الخلاط",
      value: spec.faucet_hole ? FAUCET_HOLE_LABELS[spec.faucet_hole] : "—",
    },
    {
      label: "منظور أمامي",
      value: `${dash(spec.front_length)} × ${dash(spec.front_height)}`,
    },
  ];

  const chipX = 700;
  const chipStartY = 130;
  const chipGap = 50;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="رسم ثلاثي الأبعاد للمغسلة"
      style={{ width: "100%", height: "auto", maxHeight: 520, display: "block" }}
      fontFamily={labelFont}
    >
      <defs>
        <marker
          id="wb-ar"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#475569" stroke="#475569" />
        </marker>
        <linearGradient id="wb-mt" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fafaf8" />
          <stop offset="1" stopColor="#eceae5" />
        </linearGradient>
        <linearGradient id="wb-mf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0eee9" />
          <stop offset="1" stopColor="#e0ddd6" />
        </linearGradient>
        <radialGradient id="wb-basin" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c4c8cd" />
        </radialGradient>
        <clipPath id="wb-tc">
          <polygon points={topPoly} />
        </clipPath>
      </defs>

      {/* أوجه الرخام */}
      <polygon points={rightPoly} fill="#d6d3cc" stroke="#8a8980" strokeWidth="1.2" />
      <polygon points={frontPoly} fill="url(#wb-mf)" stroke="#8a8980" strokeWidth="1.2" />
      <polygon points={topPoly} fill="url(#wb-mt)" stroke="#8a8980" strokeWidth="1.2" />

      {/* الأحواض ضمن مجموعة المصفوفة (إحداثيات سم) */}
      <g clipPath="url(#wb-tc)">
        <g transform={matrix}>
          {bowls.map((b, i) => {
            const drainCx = b.cx + holeOffset;
            const drainCy = b.cy;
            return (
              <g key={i}>
                {kind === "ellipse" && (
                  <>
                    <ellipse
                      cx={b.cx}
                      cy={b.cy}
                      rx={b.rx}
                      ry={b.ry}
                      fill="#b9b2a2"
                    />
                    <ellipse
                      cx={b.cx}
                      cy={b.cy}
                      rx={b.rx * 0.92}
                      ry={b.ry * 0.92}
                      fill="url(#wb-basin)"
                      stroke="#8d9095"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <ellipse
                      cx={b.cx}
                      cy={b.cy}
                      rx={b.rx * 0.68}
                      ry={b.ry * 0.63}
                      fill="#fcfcfd"
                    />
                  </>
                )}

                {kind === "rounded" && (
                  <>
                    <rect
                      x={b.cx - b.rx}
                      y={b.cy - b.ry}
                      width={b.rx * 2}
                      height={b.ry * 2}
                      rx={rectRound}
                      ry={rectRound}
                      fill="#b9b2a2"
                    />
                    <rect
                      x={b.cx - b.rx * 0.92}
                      y={b.cy - b.ry * 0.92}
                      width={b.rx * 1.84}
                      height={b.ry * 1.84}
                      rx={rectRound * 0.85}
                      ry={rectRound * 0.85}
                      fill="url(#wb-basin)"
                      stroke="#8d9095"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={b.cx - b.rx * 0.66}
                      y={b.cy - b.ry * 0.62}
                      width={b.rx * 1.32}
                      height={b.ry * 1.24}
                      rx={rectRound * 0.6}
                      ry={rectRound * 0.6}
                      fill="#fcfcfd"
                    />
                  </>
                )}

                {kind === "rect" && (
                  <>
                    <rect
                      x={b.cx - b.rx}
                      y={b.cy - b.ry}
                      width={b.rx * 2}
                      height={b.ry * 2}
                      fill="#b9b2a2"
                    />
                    <rect
                      x={b.cx - b.rx * 0.92}
                      y={b.cy - b.ry * 0.92}
                      width={b.rx * 1.84}
                      height={b.ry * 1.84}
                      fill="url(#wb-basin)"
                      stroke="#8d9095"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={b.cx - b.rx * 0.66}
                      y={b.cy - b.ry * 0.62}
                      width={b.rx * 1.32}
                      height={b.ry * 1.24}
                      fill="#fcfcfd"
                    />
                  </>
                )}

                {/* فتحة التصريف */}
                <ellipse
                  cx={drainCx}
                  cy={drainCy}
                  rx={Math.max(b.rx * 0.12, 1.2)}
                  ry={Math.max(b.ry * 0.12, 1.2)}
                  fill="#9aa0a6"
                  stroke="#6b7177"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>
      </g>

      {/* خط أبعاد الطول */}
      <line
        x1={fblX}
        y1={dimLenY}
        x2={fbrX}
        y2={dimLenY}
        stroke="#475569"
        strokeWidth="1.2"
        markerStart="url(#wb-ar)"
        markerEnd="url(#wb-ar)"
      />
      <line x1={fblX} y1={fblY} x2={fblX} y2={dimLenY + 6} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3 3" />
      <line x1={fbrX} y1={fbrY} x2={fbrX} y2={dimLenY + 6} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3 3" />
      <text
        x={(fblX + fbrX) / 2}
        y={dimLenY + 22}
        textAnchor="middle"
        fontSize="20"
        fill="#334155"
        fontWeight="600"
      >
        الطول {dash(spec.surface_length)}
      </text>

      {/* خط أبعاد العرض (على الحافة الخلفية اليمنى للسطح) */}
      <line
        x1={frX}
        y1={frY}
        x2={brX}
        y2={brY}
        stroke="#475569"
        strokeWidth="1.2"
        markerStart="url(#wb-ar)"
        markerEnd="url(#wb-ar)"
      />
      <text
        x={(frX + brX) / 2 + 14}
        y={(frY + brY) / 2 - 8}
        textAnchor="middle"
        fontSize="20"
        fill="#334155"
        fontWeight="600"
        transform={`rotate(-45 ${(frX + brX) / 2 + 14} ${(frY + brY) / 2 - 8})`}
      >
        العرض {dash(spec.surface_width)}
      </text>

      {/* خط أبعاد السُمك */}
      <line
        x1={thickLineX}
        y1={fblY}
        x2={thickLineX}
        y2={flY}
        stroke="#475569"
        strokeWidth="1.2"
        markerStart="url(#wb-ar)"
        markerEnd="url(#wb-ar)"
      />
      <line x1={thickLineX - 6} y1={flY} x2={flX} y2={flY} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3 3" />
      <line x1={thickLineX - 6} y1={fblY} x2={fblX} y2={fblY} stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3 3" />
      <text
        x={thickLineX - 10}
        y={(flY + fblY) / 2}
        textAnchor="middle"
        fontSize="18"
        fill="#334155"
        fontWeight="600"
        transform={`rotate(-90 ${thickLineX - 10} ${(flY + fblY) / 2})`}
      >
        السُمك {dash(spec.front_height)}
      </text>

      {/* بطاقات الوصف الجانبية */}
      {chips.map((c, i) => (
        <g key={c.label} transform={`translate(${chipX}, ${chipStartY + i * chipGap})`}>
          <rect
            x="0"
            y="-26"
            width="250"
            height="38"
            rx="10"
            ry="10"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <text x="238" y="0" textAnchor="end" fontSize="17" fill="#0f172a" fontWeight="600">
            <tspan fill="#64748b">{c.label}: </tspan>
            {c.value}
          </text>
        </g>
      ))}

      {/* تعليق مقاس الحوض عند تفعيل المقاس الخاص */}
      {spec.has_custom_bowl_size && (
        <text
          x={chipX + 250}
          y={chipStartY + chips.length * chipGap + 6}
          textAnchor="end"
          fontSize="16"
          fill="#475569"
          fontWeight="600"
        >
          مقاس الحوض {dash(spec.bowl_length)} × {dash(spec.bowl_width)} (مقاس خاص)
        </text>
      )}
    </svg>
  );
}

export default WashbasinDrawing;
