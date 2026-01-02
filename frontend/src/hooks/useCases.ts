import { useState, useEffect, useCallback } from 'react';
import { caseService } from '../api/case';
import type { Case } from '../types';

export const useCases = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCases = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await caseService.getCases();
            setCases(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch cases');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createCase = useCallback(async (newCaseData: any) => {
        try {
            const created = await caseService.createCase(newCaseData);
            setCases(prev => [created, ...prev]);
            return created;
        } catch (err) {
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchCases();
    }, []);

    return { cases, isLoading, error, refresh: fetchCases, createCase };
};
