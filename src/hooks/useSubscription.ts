import { useState, useCallback } from 'react';
import { useStudyData } from '../context/StudyPlannerContext';
import { isAdminEmail } from '../utils/admin';

export interface UserSubscription {
  tier: 'free' | 'pro' | 'premium';
  ai_credits: number;
  last_reset_date: string;
  trial_start_date?: string;
  valid_until?: string | null;
}

const OPEN_STUDENT_SUBSCRIPTION: UserSubscription = {
  tier: 'premium',
  ai_credits: 99999,
  last_reset_date: new Date().toISOString(),
  trial_start_date: new Date().toISOString(),
  valid_until: null,
};

export const useSubscription = () => {
  const { user } = useStudyData();
  const [subscription] = useState<UserSubscription>(OPEN_STUDENT_SUBSCRIPTION);

  const displayEmail = user?.email || '';
  const isUserAdmin = Boolean(displayEmail && isAdminEmail(displayEmail, (user as any)?.role));

  const decrementCredit = useCallback(async () => {
    // No-op for 100% open access platform
  }, []);

  const fetchSubscription = useCallback(async () => {
    // Open access - no network polling needed
  }, []);

  return {
    subscription,
    tier: 'free' as const,
    adminApiKey: null,
    loading: false,
    decrementCredit,
    refreshSubscription: fetchSubscription,
    isPro: true,
    isPremium: true,
    isPaid: true,
    isPaidUser: true,
    hasCredits: true,
    isAdmin: isUserAdmin,
  };
};
