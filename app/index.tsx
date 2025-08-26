import { FieldType, Loader, TextField } from '@/components';
import { useAuth, usePortal, useSnackbar } from '@/contexts';
import { sdk } from '@/lib';
import { colors, spacing } from '@/theme/theme';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Surface,
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LoginFormData {
  student_enrollment_code: string;
  password: string;
}

interface StudentStatusResponse {
  is_active: boolean;
}

export default function LoginPage() {
  const formMethods = useForm<LoginFormData>({
    defaultValues: {
      student_enrollment_code: '',
      password: ''
    }
  });

  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const { portal, isLoading: portalLoading, error: portalError } = usePortal();
  const { showMessage } = useSnackbar();
  // const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [isClient, setIsClient] = useState(false);
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);

  // const portalParamFromUrl = params.portal as string;
  const portalParamFromUrl = "epistemo";

  // Ensure client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Show loading while checking auth, portal, or during login
  if (!isClient || authLoading || portalLoading) {
    return <Loader variant="page" message="Loading..." />;
  }

  // Show error state if portal is required but not found
  if (portalParamFromUrl && !portal && !portalLoading) {
    return (
      <View style={styles.errorContainer}>
        <Surface style={styles.errorCard} elevation={4}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Portal "{portalParamFromUrl}" not found
          </Text>
          <Text variant="bodyLarge" style={styles.errorMessage}>
            Please check the URL and try again.
          </Text>
        </Surface>
      </View>
    );
  }

  const onSubmit = formMethods.handleSubmit(async (values) => {
    try {
      // Check if portal is available and has a valid portal_id
      if (!portal || !portal.portal_id) {
        showMessage("No valid portal found. Please check the portal parameter in the URL.", 'error');
        return;
      }

      // Check student status before login
      setIsCheckingStudent(true);

      try {
        // Call the public student status API
        const studentStatus = await sdk.client.fetch(`/public/student/${values.student_enrollment_code}`) as StudentStatusResponse;

        // Check if student is active
        if (!studentStatus.is_active) {
          showMessage("Your account is not active. Please contact support.", 'error');
          return;
        }

        // If student is active, proceed with login
        await login({
          student_enrollment_code: values.student_enrollment_code,
          password: values.password,
          portal_id: portal.portal_id,
        });

      } catch (studentError) {
        console.error("Student status check failed:", studentError);
        showMessage("Unable to verify student status. Please try again.", 'error');
      }
    } catch (error: unknown) {
      // Error is already handled in the login function
      console.error("Login error:", error);
    } finally {
      setIsCheckingStudent(false);
    }
  });

  // Show error message if portal not found
  if (portalError) {
    return (
      <View style={styles.errorContainer}>
        <Surface style={styles.errorCard} elevation={4}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Portal Not Found
          </Text>
          <Text variant="bodyLarge" style={styles.errorMessage}>
            {portalError}
          </Text>
        </Surface>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={[styles.headerSection, { paddingTop: insets.top + spacing.lg }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text variant="headlineLarge" style={styles.brandTitle}>
              Good to see you again!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Your learning needs are unique and we do everything to ensure that they are met.
            </Text>
          </View>
        </View>

        {/* Login Form Section */}
        <View style={styles.formSection}>
          <Surface style={styles.loginCard} elevation={4}>
            {/* Login Header */}
            <View style={styles.loginHeader}>
              <Text variant="headlineSmall" style={styles.loginTitle}>
                Welcome to
              </Text>
              <Text variant="bodyMedium" style={styles.loginSubtitle}>
                SUKORA
              </Text>
            </View>

            {/* Login Form */}
            <FormProvider {...formMethods}>
              <View style={styles.formContainer}>
                <TextField
                  name="student_enrollment_code"
                  control={formMethods.control}
                  label="Enrollment Code"
                  placeholder="Enter your enrollment code"
                  type={FieldType.text}
                  rules={{ required: "Enrollment Code is required" }}
                />

                <TextField
                  name="password"
                  control={formMethods.control}
                  label="Password"
                  placeholder="Enter your password"
                  type={FieldType.password}
                  rules={{ required: "Password is required" }}
                />

                <Button
                  mode="contained"
                  onPress={onSubmit}
                  disabled={authLoading || isCheckingStudent}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonLabel}
                  icon={authLoading || isCheckingStudent ? undefined : "login"}
                >
                  {authLoading || isCheckingStudent ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.surface} />
                      <Text variant="bodyMedium" style={styles.loadingText}>
                        {isCheckingStudent ? 'Verifying...' : 'Logging in...'}
                      </Text>
                    </View>
                  ) : (
                    'Login'
                  )}
                </Button>
              </View>
            </FormProvider>

            {/* Footer Links */}
            <View style={styles.footerLinks}>
              <Text variant="bodySmall" style={styles.footerText}>
                Having trouble logging in?{' '}
                <TouchableOpacity onPress={() => Linking.openURL('mailto:epistemo@shopschool.in')}>
                  <Text style={styles.linkText}>Contact Support</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </Surface>
        </View>

        {/* Bottom Spacing */}
        <View style={[styles.bottomSpacing, { paddingBottom: insets.bottom }]} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    minHeight: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
  },
  welcomeContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeTitle: {
    color: colors.surface,
    fontWeight: '300',
    textAlign: 'center',
  },
  brandTitle: {
    color: colors.surface,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.surface,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: spacing.sm,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl, // Overlap with header section
    zIndex: 2,
  },
  loginCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    elevation: 8,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loginTitle: {
    color: "#64748b",
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    fontSize: 16
  },
  loginSubtitle: {
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 28,
  },
  formContainer: {
    gap: spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.surface,
  },
  footerLinks: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorTitle: {
    color: colors.error,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: spacing.xl,
  },
});
