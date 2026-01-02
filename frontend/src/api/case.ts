import { apiClient } from './client';
import type { Case } from '../types';

export const caseService = {
    getCases: async (): Promise<Case[]> => {
        const response = await apiClient.get<Case[]>('/cases/');
        return response.data;
    },

    getCase: async (id: string): Promise<Case> => {
        const response = await apiClient.get<Case>(`/cases/${id}`);
        return response.data;
    },

    createCase: async (payload: Partial<Case>): Promise<Case> => {
        const response = await apiClient.post<Case>('/cases/', payload);
        return response.data;
    }
};
