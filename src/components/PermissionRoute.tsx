import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface PermissionRouteProps {
  /** A single catalog key, or several (any-of) that grant access. */
  permission: string | readonly string[];
  redirectTo?: string;
}

/**
 * Route wrapper that checks if user has the required permission.
 * Redirects to home if permission is not granted.
 */
export function PermissionRoute({ permission, redirectTo = "/" }: PermissionRouteProps) {
  const { data: user, isLoading } = useUser();

  // Show loading while fetching user data
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const required = Array.isArray(permission) ? permission : [permission];
  // A superuser (full manager) can reach every interface. Others must have at
  // least one of the matching permission groups.
  const hasPermission =
    Boolean(user?.is_superuser) ||
    (Array.isArray(user?.permission_groups) &&
      user.permission_groups.some((g) => required.includes(g.name)));

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
