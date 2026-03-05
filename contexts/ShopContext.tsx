import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

type ShopTab = "all" | "kits" | "uniforms";

interface ShopContextValue {
  activeTab: ShopTab;
  setActiveTab: (tab: ShopTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<ShopTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ShopContext.Provider
      value={{ activeTab, setActiveTab, searchQuery, setSearchQuery }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
