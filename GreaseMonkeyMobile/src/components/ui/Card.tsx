import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const cardStyle = [
    styles.base,
    variant === 'elevated' ? styles.elevated : styles.default,
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.card.DEFAULT,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  default: {
    ...theme.shadows.sm,
  },
  elevated: {
    ...theme.shadows.md,
  },
});

export default Card;