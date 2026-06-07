import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { branchKeys } from "@/lib/queryKeys";
import type { Branch, PaginatedResponse } from "@/types";

/** قائمة الفروع (مرتّبة حسب sort_order من الـ API). نفرّغ `.results`. */
export function useBranches(): UseQueryResult<Branch[], Error> {
  return useQuery({
    queryKey: branchKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Branch>>(
        `${API_ENDPOINTS.BRANCHES.LIST}?page_size=100`,
      );
      return data.results;
    },
  });
}

interface CreateBranchPayload {
  name: string;
}

export function useCreateBranch(): UseMutationResult<
  Branch,
  Error,
  CreateBranchPayload
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await api.post(API_ENDPOINTS.BRANCHES.CREATE, payload)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() }),
  });
}
