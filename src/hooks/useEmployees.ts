import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { employeeKeys } from "@/lib/queryKeys";
import type { PaginatedResponse, Employee, Permission, PermissionGroup } from "@/types";

interface EmployeeFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export function usePermissionsList() {
  return useQuery({
    queryKey: employeeKeys.permissions(),
    queryFn: async (): Promise<Permission[]> => {
       const response = await api.get(API_ENDPOINTS.PERMISSIONS.LIST);
       return response.data.results || response.data;
    },
  });
}

export function useEmployeeList(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: [...employeeKeys.list(), filters],
    queryFn: async (): Promise<PaginatedResponse<Employee>> => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.page_size) params.append("page_size", filters.page_size.toString());
      if (filters.search) params.append("search", filters.search);
      // is_active might need specific handling depending on backend, passing if it exists
      if (filters.is_active !== undefined) params.append("is_active", String(filters.is_active));

      const response = await api.get(API_ENDPOINTS.EMPLOYEES.LIST, { params });
      return response.data;
    },
  });
}

export function useEmployeeDetails(id: string | number) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async (): Promise<Employee> => {
      const response = await api.get(API_ENDPOINTS.EMPLOYEES.DETAILS(id));
      return response.data;
    },
    enabled: !!id,
  });
}

interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  password?: string;
  permission_group_ids: number[];
  [key: string]: any; 
}

interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {
  // is_active?: boolean;
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEmployeePayload) => {
      const response = await api.post<Employee>(API_ENDPOINTS.EMPLOYEES.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: UpdateEmployeePayload }) => {
      const response = await api.patch<Employee>(API_ENDPOINTS.EMPLOYEES.UPDATE(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
    },
  });
}

// Permission Groups Hook
export function usePermissionGroups() {
  return useQuery({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      // Fetch ALL groups — the employee form maps every catalog action key to
      // its group id, so a truncated page would leave later screens
      // (delivery orders onward) unselectable. The endpoint returns an
      // unpaginated array; tolerate a paginated shape too just in case.
      const response = await api.get(API_ENDPOINTS.PERMISSION_GROUPS.LIST, {
        params: { page_size: 1000 },
      });
      const data = response.data as PermissionGroup[] | PaginatedResponse<PermissionGroup>;
      return Array.isArray(data) ? data : data.results;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}


