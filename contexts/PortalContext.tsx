import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { apiGet } from "../lib/sdk";
import { asyncStore } from "../lib/storage";
import { endpoints } from "../shared/endpoints";
import { Portal } from "../shared/types";

interface PortalContextValue {
  portal: Portal | null;
  portals: Portal[];
  isLoading: boolean;
  error: string | null;
  setPortalByName: (name: string) => Promise<boolean>;
  selectPortal: (p: Portal) => Promise<void>;
  loadPortals: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [portal, setPortal] = useState<Portal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ portals: Portal[] }>(endpoints.portals);
      setPortals(res.portals || []);
      // Restore saved portal
      const savedPortalId = await asyncStore.getPortalId();
      if (savedPortalId) {
        const found = (res.portals || []).find(
          (p) => p.portal_id === savedPortalId
        );
        if (found) setPortal(found);
      }
    } catch (err) {
      setError("Failed to load portals. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortals();
  }, [loadPortals]);

  const selectPortal = useCallback(async (p: Portal) => {
    setPortal(p);
    await asyncStore.setPortalId(p.portal_id);
    await asyncStore.setPortalName(p.portal_name);
  }, []);

  const setPortalByName = useCallback(
    async (name: string): Promise<boolean> => {
      const found = portals.find(
        (p) =>
          p.portal_name?.toLowerCase() === name.toLowerCase().trim() ||
          p.school_name?.toLowerCase().includes(name.toLowerCase().trim())
      );
      if (found) {
        setPortal(found);
        await asyncStore.setPortalName(found.portal_name);
        await asyncStore.setPortalId(found.portal_id);
        return true;
      }
      return false;
    },
    [portals]
  );

  return (
    <PortalContext.Provider
      value={{ portal, portals, isLoading, error, setPortalByName, selectPortal, loadPortals }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
