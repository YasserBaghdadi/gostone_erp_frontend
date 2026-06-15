import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { useUser } from "@/hooks/useAuth";

/**
 * Capability check for the CURRENTLY logged-in user, backed by the action
 * permission catalog. The manager (superuser) can do everything.
 *
 * `can("customers.create_individual")` → boolean
 * `can(["customers.create_individual", "customers.create_company"])` → any-of
 */
export function useCan() {
  const { data: user } = useUser();
  const isSuperuser = Boolean(user?.is_superuser);
  const granted = new Set((user?.permission_groups ?? []).map((g) => g.name));

  const can = (keyOrKeys: string | string[]): boolean => {
    if (isSuperuser) return true;
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    return keys.some((k) => granted.has(k));
  };

  return { can, isSuperuser };
}

export interface CatalogAction {
  key: string;
  label: string;
}
export interface CatalogScreen {
  key: string;
  label: string;
  actions: CatalogAction[];
}
export interface CatalogSection {
  section: string;
  screens: CatalogScreen[];
}

export interface EmployeeOption {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

/** The full permission catalog (sections → screens → actions). */
export function usePermissionCatalog() {
  return useQuery<CatalogSection[]>({
    queryKey: ["permission-catalog"],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PERMISSION_CATALOG.GET);
      return res.data?.catalog ?? [];
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** Employees to assign permissions to. */
export function useEmployeeOptions() {
  return useQuery<EmployeeOption[]>({
    queryKey: ["employee-options"],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.EMPLOYEES.LIST}?page_size=1000`);
      return res.data?.results ?? res.data ?? [];
    },
    retry: false,
  });
}

/** The granted action keys for a given employee. */
export function useEmployeeGranted(employeeId: number | "") {
  return useQuery<string[]>({
    queryKey: ["employee-granted", employeeId],
    queryFn: async () => {
      const res = await api.get(
        `${API_ENDPOINTS.PERMISSION_CATALOG.GET}?employee=${employeeId}`,
      );
      return res.data?.user_granted ?? [];
    },
    enabled: !!employeeId,
    retry: false,
  });
}

export function useSaveEmployeePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, keys }: { employeeId: number; keys: string[] }) => {
      const res = await api.post(API_ENDPOINTS.PERMISSION_CATALOG.SET, {
        employee: employeeId,
        keys,
      });
      return res.data?.user_granted as string[];
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["employee-granted", vars.employeeId] });
      toast.success("تم حفظ صلاحيات الموظف");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل حفظ الصلاحيات");
    },
  });
}
