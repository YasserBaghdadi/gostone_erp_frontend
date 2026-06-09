import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface SystemNote {
  id: number;
  kind: string;
  kind_display: string;
  title: string;
  body: string;
  source_label: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export const useSystemNotes = (params?: { is_resolved?: string }) =>
  useQuery({
    queryKey: ["system-notes", params],
    queryFn: async () => {
      const { data } = await api.get("/custom-v1/system-notes/", { params });
      return (Array.isArray(data) ? data : data.results) as SystemNote[];
    },
  });

export const useResolveNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/custom-v1/system-notes/${id}/resolve/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-notes"] });
      toast.success("تم وضع الملاحظة كمُعالَجة", {
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: () => toast.error("تعذّر تحديث الملاحظة"),
  });
};
