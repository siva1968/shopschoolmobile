import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { COLORS } from "../../constants/theme";

interface LoaderProps {
  message?: string;
  full?: boolean;
}

export function Loader({ message, full = false }: LoaderProps) {
  if (full) {
    return (
      <View style={styles.full}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {message ? (
          <Text style={styles.msg}>{message}</Text>
        ) : null}
      </View>
    );
  }
  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.background,
  },
  inline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  msg: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
