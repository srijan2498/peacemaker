import { api } from './api';
import {
  HealthRecordSummary,
  MedicationSummary,
  BillDocumentSummary
} from 'cozynest-shared';

export interface HealthSummaryData {
  latestSleep?: HealthRecordSummary;
  latestPeriod?: HealthRecordSummary;
  latestFever?: HealthRecordSummary;
  todaySteps?: HealthRecordSummary;
  todayWater?: HealthRecordSummary;
  latestBp?: HealthRecordSummary;
  latestWeight?: HealthRecordSummary;
}

export const healthService = {
  // Health Records / Vitals
  getHealthRecords: async (params: {
    familyId: string;
    type?: string;
    memberId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<HealthRecordSummary[]> => {
    const res = await api.get('/health', { params });
    return res.data.data;
  },

  saveHealthRecord: async (payload: {
    familyId: string;
    userId?: string;
    type: string;
    date: string;
    data: any;
    notes?: string;
  }): Promise<HealthRecordSummary> => {
    const res = await api.post('/health', payload);
    return res.data.data;
  },

  getHealthSummary: async (params: {
    familyId: string;
    memberId?: string;
  }): Promise<HealthSummaryData> => {
    const res = await api.get('/health/summary', { params });
    return res.data.data;
  },

  deleteHealthRecord: async (id: string): Promise<void> => {
    await api.delete(`/health/${id}`);
  },

  // Medications
  getMedications: async (params: {
    familyId: string;
    memberId?: string;
    isActive?: boolean;
  }): Promise<MedicationSummary[]> => {
    const res = await api.get('/medications', { params });
    return res.data.data;
  },

  createMedication: async (payload: Partial<MedicationSummary> & { familyId: string }): Promise<MedicationSummary> => {
    const res = await api.post('/medications', payload);
    return res.data.data;
  },

  updateMedication: async (id: string, payload: Partial<MedicationSummary>): Promise<MedicationSummary> => {
    const res = await api.put(`/medications/${id}`, payload);
    return res.data.data;
  },

  toggleMedicationTaken: async (id: string, payload: { date: string; timeSlot: string }): Promise<MedicationSummary> => {
    const res = await api.post(`/medications/${id}/toggle-taken`, payload);
    return res.data.data;
  },

  refillMedication: async (id: string, addedPills: number = 30): Promise<MedicationSummary> => {
    const res = await api.post(`/medications/${id}/refill`, { addedPills });
    return res.data.data;
  },

  deleteMedication: async (id: string): Promise<void> => {
    await api.delete(`/medications/${id}`);
  },

  // Household & Pantry Stock Items
  getHouseholdStock: async (familyId: string): Promise<any[]> => {
    const res = await api.get('/household-stock', { params: { familyId } });
    return res.data.data;
  },

  createHouseholdItem: async (payload: any): Promise<any> => {
    const res = await api.post('/household-stock', payload);
    return res.data.data;
  },

  adjustHouseholdItemStock: async (id: string, delta: number): Promise<any> => {
    const res = await api.post(`/household-stock/${id}/adjust`, { delta });
    return res.data.data;
  },

  updateHouseholdItem: async (id: string, payload: any): Promise<any> => {
    const res = await api.put(`/household-stock/${id}`, payload);
    return res.data.data;
  },

  deleteHouseholdItem: async (id: string): Promise<void> => {
    await api.delete(`/household-stock/${id}`);
  },

  // Bill Documents Vault
  getBills: async (params: {
    familyId: string;
    billCategory?: string;
    search?: string;
  }): Promise<BillDocumentSummary[]> => {
    const res = await api.get('/bills', { params });
    return res.data.data;
  },

  uploadBill: async (payload: Partial<BillDocumentSummary> & { familyId: string; autoCreateExpense?: boolean }): Promise<BillDocumentSummary> => {
    const res = await api.post('/bills', payload);
    return res.data.data;
  },

  linkBillToExpense: async (id: string): Promise<{ bill: BillDocumentSummary; expense: any }> => {
    const res = await api.post(`/bills/${id}/link-expense`);
    return res.data;
  },

  deleteBill: async (id: string): Promise<void> => {
    await api.delete(`/bills/${id}`);
  }
};
