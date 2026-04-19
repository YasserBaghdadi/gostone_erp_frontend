import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface PermissionRouteProps {
  permission: string;
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

  // Check if user has the required permission
  const hasPermission = user?.permission_groups?.some((g) => g.name === permission) ?? false;

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
