import { spacing } from '@/theme/theme';
import React from 'react';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  HelperText,
  useTheme
} from 'react-native-paper';
import { Dropdown } from 'react-native-paper-dropdown';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
  helperText?: string;
  searchable?: boolean;
  mode?: 'outlined' | 'flat';
}

export default function SelectField<T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder,
  disabled = false,
  rules,
  helperText,
  searchable = false,
  mode = 'outlined',
}: SelectFieldProps<T>) {
  const theme = useTheme();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <View style={styles.container}>
          <Dropdown
            label={label}
            placeholder={placeholder}
            options={options}
            value={field.value}
            onSelect={field.onChange}
            mode={mode}
            disabled={disabled}
            error={!!error}
            hideMenuHeader={!searchable}
          />

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
    marginBottom: spacing.md,
  },
  helperText: {
    marginTop: spacing.xs,
  },
});
