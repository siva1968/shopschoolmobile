import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Appbar,
    Button,
    Chip,
    Dialog,
    Divider,
    HelperText,
    IconButton,
    Portal,
    Surface,
    Text,
    TextInput
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { reconstructEmail } from "../../lib/auth-utils";
import { apiDelete, apiPatch, apiPost } from "../../lib/sdk";
import { endpoints } from "../../shared/endpoints";
import { Address } from "../../shared/types";

// ─── Address form ─────────────────────────────────────────────────────────────
interface AddressForm {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  province: string;
  postal_code: string;
  phone?: string;
  email?: string;
}

function AddressDialog({
  visible,
  onDismiss,
  existing,
  onSave,
}: {
  visible: boolean;
  onDismiss: () => void;
  existing?: Address;
  onSave: (data: AddressForm, id?: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressForm>({
    defaultValues: {
      first_name: existing?.first_name || "",
      last_name: existing?.last_name || "",
      address_1: existing?.address_1 || "",
      address_2: existing?.address_2 || "",
      city: existing?.city || "",
      province: existing?.province || "",
      postal_code: existing?.postal_code || "",
      phone: existing?.phone || "",
      email: existing?.email || "",
    },
  });

  React.useEffect(() => {
    if (visible) {
      reset({
        first_name: existing?.first_name || "",
        last_name: existing?.last_name || "",
        address_1: existing?.address_1 || "",
        address_2: existing?.address_2 || "",
        city: existing?.city || "",
        province: existing?.province || "",
        postal_code: existing?.postal_code || "",
        phone: existing?.phone || "",
        email: existing?.email || "",
      });
    }
  }, [visible, existing]);

  const onSubmit = async (data: AddressForm) => {
    setSaving(true);
    try {
      await onSave(data, existing?.id);
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  const inputProps = (name: keyof AddressForm, label: string, required = true) => (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: `${label} is required` } : {}}
      render={({ field: { onChange, value, onBlur } }) => (
        <>
          <TextInput
            label={label}
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            mode="outlined"
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={styles.dialogInput}
            error={!!errors[name]}
            dense
          />
          {errors[name] && (
            <HelperText type="error" style={{ marginTop: -8 }}>
              {errors[name]?.message as string}
            </HelperText>
          )}
        </>
      )}
    />
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{existing ? "Edit Address" : "Add Address"}</Dialog.Title>
        <Dialog.ScrollArea>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView contentContainerStyle={{ padding: SPACING.sm }}>
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  {inputProps("first_name", "First Name")}
                </View>
                <View style={{ flex: 1 }}>
                  {inputProps("last_name", "Last Name")}
                </View>
              </View>
              {inputProps("address_1", "Address Line 1")}
              {inputProps("address_2", "Address Line 2 (optional)", false)}
              {inputProps("city", "City")}
              {inputProps("province", "State")}
              {inputProps("postal_code", "PIN Code")}
              {inputProps("phone", "Phone (optional)", false)}
              {inputProps("email", "Email (optional)", false)}
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={COLORS.textSecondary}>
            Cancel
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            textColor={COLORS.primary}
            loading={saving}
            disabled={saving}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

// ─── Password reset form ──────────────────────────────────────────────────────
interface PasswordForm {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

// ─── Main Account Screen ──────────────────────────────────────────────────────
export default function AccountScreen() {
  const { user, logout, fetchCustomerData } = useAuth();
  const toast = useToast();

  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const addresses = user?.addresses || [];
  const email = reconstructEmail(user?.email);

  const {
    control: pwdControl,
    handleSubmit: handlePwdSubmit,
    formState: { errors: pwdErrors },
    reset: resetPwd,
    watch: watchPwd,
  } = useForm<PasswordForm>({
    defaultValues: { old_password: "", new_password: "", confirm_password: "" },
  });

  const handleSaveAddress = useCallback(
    async (data: AddressForm, id?: string) => {
      try {
        const body = { ...data, country_code: "in" };
        if (id) {
          await apiPatch(`${endpoints.address(id)}`, body);
          toast.success("Address updated");
        } else {
          await apiPost(endpoints.addresses, body);
          toast.success("Address added");
        }
        await fetchCustomerData();
      } catch {
        toast.error("Failed to save address");
      }
    },
    [fetchCustomerData, toast]
  );

  const handleDeleteAddress = useCallback(
    async (id: string) => {
      Alert.alert("Delete Address", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(endpoints.address(id));
              toast.success("Address deleted");
              await fetchCustomerData();
            } catch {
              toast.error("Failed to delete address");
            }
          },
        },
      ]);
    },
    [fetchCustomerData, toast]
  );

  const handlePasswordReset = useCallback(
    async (data: PasswordForm) => {
      if (data.new_password !== data.confirm_password) {
        toast.error("New passwords do not match");
        return;
      }
      setResetLoading(true);
      try {
        await apiPatch(endpoints.customerResetPassword, {
          old_password: data.old_password,
          new_password: data.new_password,
        });
        toast.success("Password updated successfully");
        setShowPasswordForm(false);
        resetPwd();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        toast.error(
          axiosErr?.response?.data?.message || "Failed to update password"
        );
      } finally {
        setResetLoading(false);
      }
    },
    [toast, resetPwd]
  );

  const profile = user?.student_profile;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Appbar.Header style={styles.appBar} elevated>
        <Appbar.Content title="My Account" titleStyle={styles.headerTitle} />
        <Appbar.Action
          icon="logout"
          iconColor={COLORS.error}
          onPress={() =>
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: logout },
            ])
          }
        />
      </Appbar.Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile card */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons
                name="account-circle"
                size={56}
                color={COLORS.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {user?.student_name ||
                  `${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
              </Text>
              <Text style={styles.userEmail}>{email}</Text>
              <View style={styles.classRow}>
                {user?.class?.name && (
                  <Chip
                    style={styles.classChip}
                    textStyle={styles.classChipText}
                  >
                    Class {user.class.name}
                  </Chip>
                )}
                {user?.section?.name && (
                  <Chip
                    style={styles.classChip}
                    textStyle={styles.classChipText}
                  >
                    Sec {user.section.name}
                  </Chip>
                )}
              </View>
            </View>
          </View>

          {/* Student details */}
          {user?.student_enrollment_code && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="identifier"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>
                Enrollment: {user.student_enrollment_code}
              </Text>
            </View>
          )}
          {profile?.father_name && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>Father: {profile.father_name}</Text>
            </View>
          )}
          {(profile?.mother_name || profile?.mother_phone) && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account-heart"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>
                Mother: {profile.mother_name}
                {profile.mother_phone ? ` • ${profile.mother_phone}` : ""}
              </Text>
            </View>
          )}
          {user?.phone && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="phone"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>{user.phone}</Text>
            </View>
          )}
        </Surface>

        {/* Addresses */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Addresses</Text>
            <Button
              compact
              mode="outlined"
              textColor={COLORS.primary}
              style={styles.addBtn}
              icon="plus"
              onPress={() => {
                setEditingAddress(undefined);
                setShowAddressDialog(true);
              }}
            >
              Add
            </Button>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyAddresses}>
              <MaterialCommunityIcons
                name="map-marker-plus-outline"
                size={36}
                color={COLORS.border}
              />
              <Text style={styles.emptyText}>No addresses yet</Text>
              <Text style={styles.emptySubText}>
                Add an address for delivery
              </Text>
            </View>
          ) : (
            addresses.map((addr, idx) => (
              <View key={addr.id}>
                {idx > 0 && <Divider style={{ marginVertical: SPACING.sm }} />}
                <View style={styles.addressItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressName}>
                      {addr.first_name} {addr.last_name}
                      {addr.is_default_billing ? " (Billing)" : ""}
                      {addr.is_default_shipping ? " (Shipping)" : ""}
                    </Text>
                    <Text style={styles.addressLines}>
                      {addr.address_1}
                      {addr.address_2 ? `, ${addr.address_2}` : ""}
                    </Text>
                    <Text style={styles.addressLines}>
                      {addr.city}, {addr.province} {addr.postal_code}
                    </Text>
                    {addr.phone && (
                      <Text style={styles.addressLines}>{addr.phone}</Text>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <IconButton
                      icon="pencil-outline"
                      size={20}
                      iconColor={COLORS.primary}
                      onPress={() => {
                        setEditingAddress(addr);
                        setShowAddressDialog(true);
                      }}
                    />
                    <IconButton
                      icon="trash-can-outline"
                      size={20}
                      iconColor={COLORS.error}
                      onPress={() => handleDeleteAddress(addr.id)}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </Surface>

        {/* Password reset */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security</Text>
            <Button
              compact
              mode="text"
              textColor={COLORS.primary}
              onPress={() => setShowPasswordForm((v) => !v)}
              icon={showPasswordForm ? "chevron-up" : "chevron-down"}
            >
              {showPasswordForm ? "Hide" : "Change Password"}
            </Button>
          </View>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <Controller
                control={pwdControl}
                name="old_password"
                rules={{ required: "Current password required" }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <>
                    <TextInput
                      label="Current Password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      secureTextEntry={!showPwd.old}
                      right={
                        <TextInput.Icon
                          icon={showPwd.old ? "eye-off" : "eye"}
                          onPress={() =>
                            setShowPwd((p) => ({ ...p, old: !p.old }))
                          }
                        />
                      }
                      style={styles.pwdInput}
                      dense
                      error={!!pwdErrors.old_password}
                    />
                    {pwdErrors.old_password && (
                      <HelperText type="error">
                        {pwdErrors.old_password.message}
                      </HelperText>
                    )}
                  </>
                )}
              />
              <Controller
                control={pwdControl}
                name="new_password"
                rules={{
                  required: "New password required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <>
                    <TextInput
                      label="New Password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      secureTextEntry={!showPwd.new}
                      right={
                        <TextInput.Icon
                          icon={showPwd.new ? "eye-off" : "eye"}
                          onPress={() =>
                            setShowPwd((p) => ({ ...p, new: !p.new }))
                          }
                        />
                      }
                      style={styles.pwdInput}
                      dense
                      error={!!pwdErrors.new_password}
                    />
                    {pwdErrors.new_password && (
                      <HelperText type="error">
                        {pwdErrors.new_password.message}
                      </HelperText>
                    )}
                  </>
                )}
              />
              <Controller
                control={pwdControl}
                name="confirm_password"
                rules={{
                  required: "Please confirm your password",
                  validate: (val) =>
                    val === watchPwd("new_password") || "Passwords do not match",
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <>
                    <TextInput
                      label="Confirm New Password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      secureTextEntry={!showPwd.confirm}
                      right={
                        <TextInput.Icon
                          icon={showPwd.confirm ? "eye-off" : "eye"}
                          onPress={() =>
                            setShowPwd((p) => ({ ...p, confirm: !p.confirm }))
                          }
                        />
                      }
                      style={styles.pwdInput}
                      dense
                      error={!!pwdErrors.confirm_password}
                    />
                    {pwdErrors.confirm_password && (
                      <HelperText type="error">
                        {pwdErrors.confirm_password.message}
                      </HelperText>
                    )}
                  </>
                )}
              />
              <Button
                mode="contained"
                buttonColor={COLORS.primary}
                style={{ marginTop: SPACING.sm, borderRadius: RADIUS.md }}
                loading={resetLoading}
                disabled={resetLoading}
                onPress={handlePwdSubmit(handlePasswordReset)}
              >
                Update Password
              </Button>
            </View>
          )}
        </Surface>

        {/* Sign out */}
        <Button
          mode="outlined"
          icon="logout"
          textColor={COLORS.error}
          style={styles.logoutBtn}
          onPress={() =>
            Alert.alert("Sign Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign Out",
                style: "destructive",
                onPress: logout,
              },
            ])
          }
        >
          Sign Out
        </Button>
        <View style={{ height: 80 }} />
      </ScrollView>

      <AddressDialog
        visible={showAddressDialog}
        onDismiss={() => setShowAddressDialog(false)}
        existing={editingAddress}
        onSave={handleSaveAddress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  appBar: { backgroundColor: COLORS.surface },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700" },
  scrollContent: { padding: SPACING.md },
  section: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatarCircle: {},
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  classRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  classChip: {
    backgroundColor: COLORS.chip,
    height: 26,
  },
  classChipText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  addBtn: {
    borderColor: COLORS.primary,
  },
  emptyAddresses: {
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  emptySubText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.disabled,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  addressLines: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  addressActions: {
    flexDirection: "row",
  },
  passwordForm: {
    gap: SPACING.xs,
  },
  pwdInput: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  logoutBtn: {
    borderColor: COLORS.error,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  // AddressDialog
  dialog: {
    maxHeight: "90%",
  },
  nameRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  dialogInput: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.xs,
  },
});
