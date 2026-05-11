import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleProp, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from "react-native";
import { theme } from "./theme";

type Props = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ containerStyle, style, placeholderTextColor, secureTextEntry, ...props }: Props) {
  const [hidden, setHidden] = useState(true);
  const isPassword = secureTextEntry === true;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.space.lg,
          height: 52,
          flexDirection: "row",
          alignItems: "center",
        },
        containerStyle,
      ]}
    >
      <TextInput
        style={[
          {
            flex: 1,
            color: theme.colors.text,
            ...theme.type.body,
          },
          style,
        ]}
        placeholderTextColor={placeholderTextColor ?? theme.colors.placeholder}
        secureTextEntry={isPassword ? hidden : false}
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={8}>
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={theme.colors.muted}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

