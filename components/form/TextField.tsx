import { colors, spacing, typography } from '@/theme/theme';
import React, { useState } from 'react';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { HelperText, IconButton, TextInput } from 'react-native-paper';

export enum FieldType {
  text = 'text',
  password = 'password',
  email = 'email',
  number = 'number',
  tel = 'tel',
  url = 'url',
}

interface TextFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: FieldType;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  rules?: RegisterOptions<T>;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: any;
}

export default function TextField<T extends FieldValues>({
  name,
  control,
  label,
  type = FieldType.text,
  placeholder,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  rules,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
}: TextFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const getSecureTextEntry = () => {
    return type === FieldType.password && !showPassword;
  };

  const getKeyboardType = () => {
    switch (type) {
      case FieldType.email:
        return 'email-address';
      case FieldType.number:
        return 'numeric';
      case FieldType.tel:
        return 'phone-pad';
      case FieldType.url:
        return 'url';
      default:
        return 'default';
    }
  };

  const getRightIcon = () => {
    if (type === FieldType.password) {
      return (
        <IconButton
          icon={showPassword ? 'eye-off' : 'eye'}
          onPress={handleTogglePassword}
          size={20}
        />
      );
    }
    if (rightIcon) {
      return (
        <IconButton
          icon={rightIcon}
          onPress={onRightIconPress}
          size={20}
        />
      );
    }
    return undefined;
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={[styles.container, style]}>
          <TextInput
            label={label}
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            secureTextEntry={getSecureTextEntry()}
            keyboardType={getKeyboardType()}
            error={!!error}
            mode="outlined"
            left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
            right={getRightIcon()}
            style={[
              styles.input,
              error && styles.inputError,
            ]}
            theme={{
              colors: {
                primary: colors.primary,
                error: colors.error,
              },
            }}
          />
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
  input: {
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  helperText: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
});
