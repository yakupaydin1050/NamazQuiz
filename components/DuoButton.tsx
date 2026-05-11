import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface DuoButtonProps {
  text: string;
  onPress: () => void;
  color?: string;
  shadowColor?: string;
  textColor?: string; // YENİ: Yazı rengi özelliği
  disabled?: boolean;
  fontSize?: number;
}

export default function DuoButton({ 
  text, 
  onPress, 
  color = '#22c55e', 
  shadowColor = '#15803d', 
  textColor = 'white', // Varsayılan beyaz
  disabled = false,
  fontSize = 18 
}: DuoButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { opacity: disabled ? 0.5 : 1 }
      ]}
    >
      <View style={[styles.shadow, { backgroundColor: shadowColor }]} />
      <View style={[
        styles.surface, 
        { 
          backgroundColor: color,
          transform: [{ translateY: isPressed ? 5 : 0 }] 
        }
      ]}>
        {/* Yazı rengini buradan dinamik alıyoruz */}
        <Text style={[styles.text, { fontSize, color: textColor }]}>{text}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { height: 60, width: '100%', marginVertical: 8 },
  shadow: { position: 'absolute', bottom: 0, width: '100%', height: 52, borderRadius: 16 },
  surface: { position: 'absolute', top: 0, width: '100%', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  text: { fontWeight: '900', letterSpacing: 1 },
});