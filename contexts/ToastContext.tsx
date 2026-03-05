import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { Snackbar } from "react-native-paper";

type Severity = "success" | "error" | "warning" | "info";

interface ToastMessage {
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const COLORS: Record<Severity, string> = {
  success: "#2e7d32",
  error: "#d32f2f",
  warning: "#ed6c02",
  info: "#0288d1",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback((message: string, severity: Severity) => {
    setToast({ message, severity });
  }, []);

  const value: ToastContextValue = {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error"),
    warning: (msg) => show(msg, "warning"),
    info: (msg) => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.snackbarContainer} pointerEvents="box-none">
        <Snackbar
          visible={!!toast}
          onDismiss={() => setToast(null)}
          duration={4000}
          style={{ backgroundColor: COLORS[toast?.severity ?? "info"] }}
        >
          {toast?.message ?? ""}
        </Snackbar>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  snackbarContainer: {
    position: "absolute",
    bottom: 88,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
