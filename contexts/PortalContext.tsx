'use client';

import React, { createContext, ReactNode, Suspense, useContext, useMemo } from 'react';
// import { useSearchParams } from 'next/navigation';
import { useGetData } from '@/lib/use-api';
import { Endpoint } from '@/shared';
import { useAuth } from './AuthContext';

interface Portal {
  id?: string;
  portal_id: string;
  portal_name?: string;
  school_name?: string;
  name?: string;
  domain?: string;
  logo?: string;
  address?: string;
  status?: boolean;
  is_active?: boolean;
  theme?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface PortalContextType {
  portal: Portal | null;
  isLoading: boolean;
  error: string | null;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

interface PortalProviderProps {
  children: ReactNode;
}

// Internal component that uses useSearchParams
const PortalProviderInner: React.FC<PortalProviderProps> = ({ children }) => {
  // const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // const portalParam = searchParams.get('portal');
  const portalParam = "epistemo"; // Temporary hardcoded value for testing

  // Always fetch portals list - we'll use it for both authenticated and non-authenticated users
  const shouldFetchPortalsList = true;

  // Fetch portals list 
  const {
    data: portalsList,
    isLoading: portalsListLoading,
    error: portalsListError
  } = useGetData<{ list: Portal[], count: number }>({
    queryKey: ['portals-list'],
    endpoint: Endpoint.portals,
    enabled: shouldFetchPortalsList,
    showErrorToast: false,
  });

  // Find matching portal from list
  const matchedPortal = useMemo(() => {
    if (!portalsList?.list) {
      return null;
    }

    // If authenticated, find by user's portal_id
    if (isAuthenticated && user?.portal_id) {
      return portalsList.list.find((portal: Portal) => portal.portal_id === user.portal_id) || null;
    }

    // If not authenticated but has portal parameter, find by portal_name
    if (!isAuthenticated && portalParam) {
      return portalsList.list.find((portal: Portal) =>
        portal.portal_name?.toLowerCase() === portalParam.toLowerCase()
      ) || null;
    }

    return null;
  }, [portalsList?.list, user?.portal_id, portalParam, isAuthenticated]);

  // Determine final values based on current state
  const portal = matchedPortal;
  const isLoading = authLoading || portalsListLoading;
  const error = portalsListError
    ? `Failed to load portal data`
    : isAuthenticated && user?.portal_id && !matchedPortal && !portalsListLoading
      ? `Portal not found for user`
      : !isAuthenticated && portalParam && !matchedPortal && !portalsListLoading
        ? `Portal "${portalParam}" not found`
        : null;

  const value: PortalContextType = {
    portal: portal || null,
    isLoading,
    error,
  };

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
};

// Fallback component for Suspense
const PortalFallback = () => <div>Loading portal...</div>;

// Main exported component with Suspense wrapper
export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  return (
    <Suspense fallback={<PortalFallback />}>
      <PortalProviderInner>
        {children}
      </PortalProviderInner>
    </Suspense>
  );
};

export const usePortal = (): PortalContextType => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};
