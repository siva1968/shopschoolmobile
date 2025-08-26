import React, { createContext, ReactNode, useContext, useState } from "react";
import { Snackbar } from "react-native-paper";

type SnackbarSeverity = "success" | "error" | "warning" | "info";

interface SnackbarContextType {
  showMessage: (message: string, severity?: SnackbarSeverity) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: ReactNode;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showMessage = (message: string, severity: SnackbarSeverity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const success = (message: string) => showMessage(message, "success");
  const error = (message: string) => showMessage(message, "error");
  const warning = (message: string) => showMessage(message, "warning");
  const info = (message: string) => showMessage(message, "info");

  const handleClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const contextValue: SnackbarContextType = {
    showMessage,
    success,
    error,
    warning,
    info,
  };

  // Get action color based on severity
  const getActionColor = (severity: SnackbarSeverity) => {
    switch (severity) {
      case "success":
        return "#4caf50";
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      case "info":
      default:
        return "#2196f3";
    }
  };

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        visible={snackbar.open}
        onDismiss={handleClose}
        duration={4000}
        action={{
          label: "Dismiss",
          onPress: handleClose,
          textColor: getActionColor(snackbar.severity),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
