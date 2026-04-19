import { create } from 'zustand';
import type { EmployeeExpenseRequest } from '@/types';

interface EmployeeExpenseStore {
  expenses: EmployeeExpenseRequest[];
  addExpense: (expense: Omit<EmployeeExpenseRequest, 'id' | 'date' | 'status'>) => void;
  updateExpense: (id: string, updates: Partial<EmployeeExpenseRequest>) => void;
  getExpense: (id: string) => EmployeeExpenseRequest | undefined;
}

// Mock Data
const MOCK_EXPENSES: EmployeeExpenseRequest[] = [
  {
    id: 'EXP-1001',
    employeeName: 'أحمد محمد',
    amount: 150,
    source: 'custody',
    categories: ['consumables'],
    reason: 'شراء أحبار للطابعة',
    status: 'pending',
    date: new Date().toISOString(),
    attachmentUrl: 'mock_invoice.jpg',
    attachmentType: 'regular_invoice',
  },
  {
    id: 'EXP-1002',
    employeeName: 'خالد علي',
    amount: 500,
    source: 'transfer',
    categories: ['car', 'project'],
    reason: 'تعبئة وقود وصيانة سريعة للسيارة أثناء المشروع',
    status: 'approved',
    date: new Date(Date.now() - 172800000).toISOString(),
    attachmentUrl: 'tax_invoice_123.pdf',
    attachmentType: 'tax_invoice',
  },
];

export const useEmployeeExpenseStore = create<EmployeeExpenseStore>((set, get) => ({
  expenses: MOCK_EXPENSES,
  addExpense: (expense) => {
    const newExpense: EmployeeExpenseRequest = {
      ...expense,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      status: 'pending',
      date: new Date().toISOString(),
      // Ensure attachment logic is handled if provided
    };
    set((state) => ({ expenses: [newExpense, ...state.expenses] }));
  },
  updateExpense: (id, updates) => {
    set((state) => ({
      expenses: state.expenses.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    }));
  },
  getExpense: (id) => get().expenses.find((exp) => exp.id === id),
}));
