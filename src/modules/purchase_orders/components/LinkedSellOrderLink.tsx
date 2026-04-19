import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSellOrderDetails } from "@/hooks/useSellOrders";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import type { SellOrder } from "@/types";

export function formatLinkedSellOrderLabel(
  sellOrder: SellOrder | undefined,
  id: number,
): string {
  if (sellOrder?.customer) {
    const n = formatCustomerWithBalance(sellOrder.customer);
    if (n !== "—") return n;
  }
  return `أمر بيع #${id}`;
}

type LinkedSellOrderLinkProps = {
  sellOrderId?: number | null;
  /** شارة (الشريط الجانبي / القائمة) أو نص داخل زر */
  mode?: "badge" | "inline";
  className?: string;
  badgeClassName?: string;
  stopPropagation?: boolean;
};

export function LinkedSellOrderLink({
  sellOrderId,
  mode = "badge",
  className,
  badgeClassName,
  stopPropagation,
}: LinkedSellOrderLinkProps) {
  const id =
    sellOrderId != null && sellOrderId > 0 ? sellOrderId : "";
  const { data } = useSellOrderDetails(id);
  if (!id) return null;

  const label = formatLinkedSellOrderLabel(data, Number(id));

  return (
    <Link
      to={`/sell-orders/${id}`}
      className={mode === "inline" ? className : undefined}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {mode === "badge" ? (
        <Badge
          variant='secondary'
          className={
            badgeClassName ??
            "cursor-pointer hover:bg-secondary/80 font-normal max-w-40 truncate sm:max-w-56"
          }
          title={label}
        >
          {label}
        </Badge>
      ) : (
        <span className={className}>{label}</span>
      )}
    </Link>
  );
}

/** زر الرأس: رابط ثابت النص إلى أمر البيع المرتبط. */
export function LinkedSellOrderHeaderButton({
  sellOrderId,
}: {
  sellOrderId: number;
}) {
  return (
    <Link to={`/sell-orders/${sellOrderId}`}>
      <Button
        variant='outline'
        className='rounded-xl gap-2 text-primary hover:text-primary hover:bg-primary/10 border-primary/20'
        title={`أمر بيع #${sellOrderId}`}
      >
        <FileText className='h-4 w-4 shrink-0' />
        <span className='text-sm sm:text-base'>
          الذهاب لأمر البيع المرتبط
        </span>
      </Button>
    </Link>
  );
}
