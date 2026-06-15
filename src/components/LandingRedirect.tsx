import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useAuth";
import { useCan } from "@/hooks/usePermissions";

/**
 * Sends the user to the first screen they are allowed to see. The manager
 * (superuser) lands on /suppliers as before. A restricted user lands on their
 * first granted screen — never on a page they can't access (which would bounce
 * back here and loop). Falls back to /profile, which needs no permission.
 */
const LANDING_ORDER: Array<{ href: string; keys: string[] }> = [
  { href: "/suppliers", keys: ["suppliers.view"] },
  { href: "/items", keys: ["items.view"] },
  { href: "/production-orders", keys: ["production_orders.view"] },
  { href: "/delivery-orders", keys: ["delivery_orders.view"] },
  { href: "/purchase-orders", keys: ["purchase_orders.view"] },
  { href: "/customers", keys: ["customers.view"] },
  { href: "/opportunities", keys: ["opportunities.view"] },
  { href: "/sell-orders", keys: ["sell_orders.view"] },
  { href: "/customer-returns", keys: ["customer_returns.view"] },
  { href: "/measurements", keys: ["measurements.view"] },
  { href: "/employees", keys: ["employees.view"] },
  { href: "/sessions", keys: ["sessions.view"] },
  { href: "/custody", keys: ["custody.view"] },
  { href: "/employee-expenses", keys: ["expenses_requests.view"] },
  { href: "/accounts", keys: ["accounts.view"] },
  { href: "/journal-entries", keys: ["journal_entries.view"] },
  { href: "/collections", keys: ["collections.view"] },
  { href: "/approvals", keys: ["approvals.view"] },
  { href: "/storage-areas", keys: ["storage_areas.view"] },
];

export function LandingRedirect() {
  const { isLoading } = useUser();
  const { can } = useCan();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const target = LANDING_ORDER.find((item) => can(item.keys));
  return <Navigate to={target?.href ?? "/profile"} replace />;
}
