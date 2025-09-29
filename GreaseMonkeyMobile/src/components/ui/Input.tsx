import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const inputStyles = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || isPassword) && styles.inputWithRightIcon,
    style,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={theme.colors.foreground.muted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={inputStyles}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={theme.colors.foreground.muted}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.foreground.muted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={theme.colors.foreground.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.foreground.DEFAULT,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.card.DEFAULT,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground.DEFAULT,
    minHeight: 44,
  },
  inputFocused: {
    borderColor: theme.colors.primary.orange,
    ...theme.shadows.sm,
  },
  inputError: {
    borderColor: theme.colors.destructive.DEFAULT,
  },
  inputWithLeftIcon: {
    paddingLeft: 48,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  leftIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    zIndex: 1,
    padding: theme.spacing.xs,
  },
  error: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.destructive.DEFAULT,
    marginTop: theme.spacing.xs,
  },
});

export default Input;