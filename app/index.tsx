import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Button,
    Divider,
    HelperText,
    Icon,
    Portal as PaperPortal,
    Surface,
    Text,
    TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../components/common/Loader";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { usePortal } from "../contexts/PortalContext";
import type { Portal } from "../shared/types";

interface LoginForm {
  enrollmentCode: string;
  password: string;
}

export default function LoginScreen() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { portal, portals, isLoading: portalsLoading, selectPortal } = usePortal();

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [schoolError, setSchoolError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { enrollmentCode: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace("/(tabs)/shop");
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) return <Loader full message="Loading..." />;

  const filteredPortals = portals.filter((p) => {
    const name = (p.school_name || p.portal_name || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleSelectSchool = (p: Portal) => {
    selectPortal(p);
    setSchoolError("");
    setDropdownVisible(false);
    setSearch("");
  };

  const selectedName = portal
    ? portal.school_name || portal.portal_name
    : null;

  const onSubmit = async (data: LoginForm) => {
    if (!portal) {
      setSchoolError("Please select your school");
      return;
    }
    setIsSubmitting(true);
    try {
      await login({
        student_enrollment_code: data.enrollmentCode.trim(),
        password: data.password,
        portal_id: portal.portal_id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoPlaceholder}>
              <Image
                source={require("../assets/images/shopSchoolLogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tagline}>Your school store</Text>
          </View>

          {/* Login Card */}
          <Surface style={styles.card} elevation={2}>
            <Text style={styles.cardTitle}>Student Login</Text>

            {/* School Dropdown */}
            <Text style={styles.fieldLabel}>School</Text>
            <Pressable
              onPress={() => setDropdownVisible(true)}
              style={[
                styles.dropdownTrigger,
                schoolError ? styles.dropdownError : null,
              ]}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedName && styles.dropdownPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedName || "Select your school…"}
              </Text>
              <Icon source="chevron-down" size={20} color={COLORS.textSecondary} />
            </Pressable>
            {schoolError ? (
              <HelperText type="error">{schoolError}</HelperText>
            ) : null}

            <View style={styles.gap} />

            {/* Enrollment Code */}
            <Controller
              control={control}
              name="enrollmentCode"
              rules={{
                required: "Enrollment code is required",
                minLength: { value: 3, message: "Too short" },
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  label="Enrollment Code"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.input}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  left={<TextInput.Icon icon="account-school" />}
                  error={!!errors.enrollmentCode}
                />
              )}
            />
            {errors.enrollmentCode && (
              <HelperText type="error">
                {errors.enrollmentCode.message}
              </HelperText>
            )}

            {/* Password */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: { value: 4, message: "Password too short" },
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword((v) => !v)}
                    />
                  }
                  error={!!errors.password}
                />
              )}
            />
            {errors.password && (
              <HelperText type="error">{errors.password.message}</HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.loginBtn}
              contentStyle={styles.loginBtnContent}
              labelStyle={styles.loginBtnLabel}
              loading={isSubmitting}
              disabled={isSubmitting}
              buttonColor={COLORS.primary}
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </Button>
          </Surface>

          <Text style={styles.footer}>
            © {new Date().getFullYear()} Samaikya Edu Society
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* School picker bottom sheet modal */}
      <PaperPortal>
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <Text style={styles.modalTitle}>Select School</Text>
              <Divider />
              <TextInput
                placeholder="Search school…"
                value={search}
                onChangeText={setSearch}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                style={styles.searchInput}
                left={<TextInput.Icon icon="magnify" />}
                dense
                autoFocus
              />
              {portalsLoading ? (
                <Loader message="Loading schools…" />
              ) : (
                <FlatList
                  data={filteredPortals}
                  keyExtractor={(item) => item.portal_id}
                  keyboardShouldPersistTaps="handled"
                  style={styles.list}
                  ItemSeparatorComponent={() => <Divider />}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No schools found</Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.listItem,
                        pressed && styles.listItemPressed,
                        portal?.portal_id === item.portal_id &&
                          styles.listItemSelected,
                      ]}
                      onPress={() => handleSelectSchool(item)}
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          portal?.portal_id === item.portal_id &&
                            styles.listItemTextSelected,
                        ]}
                      >
                        {item.school_name || item.portal_name}
                      </Text>
                      {portal?.portal_id === item.portal_id && (
                        <Icon source="check" size={18} color={COLORS.primary} />
                      )}
                    </Pressable>
                  )}
                />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </PaperPortal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: RADIUS.md,
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  dropdownError: {
    borderColor: COLORS.error,
  },
  dropdownText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    color: COLORS.textSecondary,
  },
  gap: {
    height: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  loginBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
  },
  loginBtnContent: {
    paddingVertical: 6,
  },
  loginBtnLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  // Modal bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: "70%",
    paddingTop: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchInput: {
    margin: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  list: {
    flexGrow: 0,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  listItemPressed: {
    backgroundColor: COLORS.background,
  },
  listItemSelected: {
    backgroundColor: "#e8f4fd",
  },
  listItemText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  listItemTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    padding: SPACING.lg,
  },
});
