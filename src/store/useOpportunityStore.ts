import { create } from 'zustand';
import type { Opportunity } from '@/types';

interface OpportunityStore {
  opportunities: Opportunity[];
  addOpportunity: (opportunity: Opportunity) => void;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  getOpportunity: (id: string) => Opportunity | undefined;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 1,
    clientName: 'أحمد محمد',
    clientPhone: '0501234567',
    notes: 'عميل مستعجل يفضل التواصل واتساب',
    interest_level: 'very_interested',
    location: 'الرياض - حي الملز',
    need_dim_order: true,
    status: 'new',
    items: [],
    totalPrice: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    clientName: 'شركة البناء الحديث',
    clientPhone: '0555555555',
    notes: 'مشروع فلل سكنية',
    interest_level: 'interested',
    location: 'جدة - حي الشاطئ',
    total_counter_offer: '120000',
    need_dim_order: true,
    status: 'measurements_requested',
    items: [
         { id: 201, name: 'نوافذ ألمنيوم', unit_name: 'meter', quantity: "50" } 
    ],
    totalPrice: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
   {
    id: 3,
    clientName: 'فيصل العتيبي',
    clientPhone: '0566666666',
    notes: 'يحتاج تفصيل خاص',
    interest_level: 'interested',
    location: 'الدمام',
    need_dim_order: false,
    status: 'priced',
    items: [
        { id: 101, name: 'باب خشب', quantity: "5", unit_name: 'pcs' }
    ],
    totalPrice: 6000,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 4,
    clientName: 'مطاعم الساحل',
    clientPhone: '0544444444',
    notes: 'تركيب واجهات فروع',
    interest_level: 'very_interested',
    location: 'الخبر',
    total_counter_offer: '48000',
    need_dim_order: true,
    status: 'work_order_pending',
    items: [
        { id: 301, name: 'واجهات زجاج', unit_name: 'job', quantity: "1" }
    ],
    totalPrice: 50000,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  }
];

export const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: MOCK_OPPORTUNITIES,
  addOpportunity: (opportunity) =>
    set((state) => ({ opportunities: [opportunity, ...state.opportunities] })),
  updateOpportunity: (id, data) =>
    set((state) => ({
      opportunities: state.opportunities.map((op) =>
        op.id === Number(id) ? { ...op, ...data } : op
      ),
    })),
  deleteOpportunity: (id) =>
    set((state) => ({
      opportunities: state.opportunities.filter((op) => op.id !== Number(id)),
    })),
  getOpportunity: (id) => get().opportunities.find((op) => op.id === Number(id)),
}));
