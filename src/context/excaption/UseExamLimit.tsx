// frontend/src/hooks/useExamLimit.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../authStore';
import api from '../../lib/axios';

interface ExamLimitState {
  remaining: number;
  limit: number;
  usedToday: number;
  resetAt: string;
  loading: boolean;
  error: string | null;
}

export function useExamLimit() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<ExamLimitState>({
    remaining: 0,
    limit: 0,
    usedToday: 0,
    resetAt: '',
    loading: true,
    error: null,
  });

  // Check current limits on mount
  useEffect(() => {
    const fetchLimits = async () => {
      if (!user?._id) return;

      try {
        const res = await api.get('/exams/limits/check');
        setState({
          remaining: res.data.remaining,
          limit: res.data.limit,
          usedToday: res.data.usedToday,
          resetAt: res.data.resetAt,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.log(err)
        setState((s) => ({ ...s, error: 'Could not load exam limits', loading: false }));
      }
    };

    fetchLimits();
  }, [user?._id]);

  /**
   * Call this when user tries to start an exam
   * Returns { success, remaining, exceeded }
   */
  const canStartExam = useCallback(async () => {
    try {
      const res = await api.post('/exams/limits/start');
      
      // Update local state
      setState((prev) => ({
        ...prev,
        remaining: res.data.remaining,
        usedToday: res.data.usedToday,
      }));

      return { success: true, remaining: res.data.remaining };
    } catch (err: any) {
      const exceeded = err.response?.status === 429;
      const limit = err.response?.data?.limit || state.limit;

      setState((prev) => ({ ...prev, remaining: 0 }));

      return {
        success: false,
        exceeded,
        limit,
        message: err.response?.data?.message || 'Could not start exam',
      };
    }
  }, [state.limit]);

  return {
    ...state,
    canStartExam,
    hasExamsRemaining: state.remaining > 0,
  };
}