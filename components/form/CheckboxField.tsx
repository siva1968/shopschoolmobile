import { colors, spacing, typography } from '@/theme/theme';
import React from 'react';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
    Checkbox,
    HelperText,
    Text,
    useTheme
} from 'react-native-paper';

interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
  helperText?: string;
  color?: string;
}

export default function CheckboxField<T extends FieldValues>({
  name,
  control,
  label,
  disabled = false,
  rules,
  helperText,
  color = colors.primary,
}: CheckboxFieldProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <View style={styles.container}>
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={field.value ? 'checked' : 'unchecked'}
              onPress={() => field.onChange(!field.value)}
              disabled={disabled}
              theme={{
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: color,
                }
              }}
            />
            <Text 
              style={[
                styles.label,
                disabled && styles.disabledLabel,
                error && styles.errorLabel,
              ]}
              variant="bodyLarge"
              onPress={() => !disabled && field.onChange(!field.value)}
            >
              {label}
            </Text>
          </View>
          
          {(error || helperText) && (
            <HelperText 
              type={error ? 'error' : 'info'}
              style={styles.helperText}
            >
              {error?.message || helperText}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text.primary,
    ...typography.body1,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  errorLabel: {
    color: colors.error,
  },
  helperText: {
    marginLeft: spacing.xl + spacing.sm, // Align with label
    marginTop: spacing.xs,
  },
});
