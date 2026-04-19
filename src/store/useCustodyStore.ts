import { create } from 'zustand';
import type { CustodyRequest } from '@/types';

interface CustodyStore {
  requests: CustodyRequest[];
  addRequest: (request: Omit<CustodyRequest, 'id' | 'date' | 'status'>) => void;
  updateRequest: (id: string, updates: Partial<CustodyRequest>) => void;
  getRequest: (id: string) => CustodyRequest | undefined;
}

// Mock Data
const MOCK_REQUESTS: CustodyRequest[] = [
  {
    id: 'CR-001',
    employeeName: 'أحمد محمد',
    amount: 5000,
    type: 'cash',
    reason: 'شراء مواد أولية عاجلة للموقع',
    status: 'pending',
    date: new Date().toISOString(),
  },
  {
    id: 'CR-002',
    employeeName: 'خالد علي',
    amount: 1200,
    type: 'transfer',
    reason: 'مصاريف سفر لمأمورية عمل',
    status: 'approved',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const useCustodyStore = create<CustodyStore>((set, get) => ({
  requests: MOCK_REQUESTS,
  addRequest: (request) => {
    const newRequest: CustodyRequest = {
      ...request,
      id: `CR-${Date.now().toString().slice(-4)}`,
      status: 'pending',
      date: new Date().toISOString(),
    };
    set((state) => ({ requests: [newRequest, ...state.requests] }));
  },
  updateRequest: (id, updates) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    }));
  },
  getRequest: (id) => get().requests.find((req) => req.id === id),
}));
