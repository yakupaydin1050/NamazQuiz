import React from "react";
import { SafeAreaView, StatusBar, StyleProp, View, ViewStyle } from "react-native";
import { theme } from "./theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  withPadding?: boolean;
};

export function Screen({ children, style, contentStyle, withPadding = true }: Props) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.bg }, style]}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          { flex: 1, padding: withPadding ? theme.space.xl : 0 },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

