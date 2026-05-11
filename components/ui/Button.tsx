import React from "react";
import { Pressable, StyleProp, Text, ViewStyle } from "react-native";
import { theme } from "./theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  text,
  onPress,
  disabled = false,
  variant = "primary",
  style,
}: Props) {
  const bg =
    variant === "primary"
      ? theme.colors.primary
      : variant === "danger"
        ? theme.colors.danger
        : "transparent";

  const border =
    variant === "secondary"
      ? theme.colors.border
      : variant === "ghost"
        ? "transparent"
        : "transparent";

  const textColor =
    variant === "primary" || variant === "danger"
      ? "#071016"
      : theme.colors.text;

  const fill =
    variant === "secondary" ? theme.colors.surface2 : bg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: 54,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: fill,
          borderWidth: 1,
          borderColor: border,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: disabled ? 1 : pressed ? 0.96 : 1 }],
        },
        variant === "primary" && !disabled && {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 6,
        },
        variant === "danger" && !disabled && {
          shadowColor: theme.colors.danger,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 4,
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, ...theme.type.body, letterSpacing: 0.3 }}>
        {text}
      </Text>
    </Pressable>
  );
}

