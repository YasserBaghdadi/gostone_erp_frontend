
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, CashRegister, CardMachine, Bank, BuyNowPayLater } from "@/types";

export const useCashRegisters = () => {
  return useQuery({
    queryKey: ["cash-registers"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CashRegister>>("/custom-v1/cash-registers/");
      return data;
    },
  });
};

export const useCardMachines = () => {
  return useQuery({
    queryKey: ["card-machines"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CardMachine>>("/custom-v1/card-machines/");
      return data;
    },
  });
};

export const useBanks = () => {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Bank>>("/custom-v1/banks/");
      return data;
    },
  });
};

export const useBuyNowPayLaters = () => {
  return useQuery({
    queryKey: ["buy-now-pay-laters"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BuyNowPayLater>>("/custom-v1/buy-now-pay-laters/");
      return data;
    },
  });
};
