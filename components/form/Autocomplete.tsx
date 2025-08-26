import { spacing, typography } from '@/theme/theme';
import { Autocomplete } from '@telenko/react-native-paper-autocomplete';
import React from 'react';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { HelperText } from 'react-native-paper';

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: AutocompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
  helperText?: string;
  multiple?: boolean;
  style?: any;
}

export default function AutocompleteField<T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder,
  disabled = false,
  rules,
  helperText,
  multiple = false,
  style,
}: AutocompleteFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={[styles.container, style]}>
          {multiple ? (
            <Autocomplete
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={onChange}
              options={options}
              label={label}
              placeholder={placeholder}
              disabled={disabled}
              error={!!error}
            />
          ) : (
            <Autocomplete
              value={value || ''}
              onChange={onChange}
              options={options}
              label={label}
              placeholder={placeholder}
              disabled={disabled}
              error={!!error}
            />
          )}

          {(error || helperText) && (
            <HelperText 
              type={error ? 'error' : 'info'}
              visible={!!(error || helperText)}
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
  helperText: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
});
