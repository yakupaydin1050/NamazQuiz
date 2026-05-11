import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';

export default function KategoriSecimi() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userName = typeof params.userName === 'string' ? params.userName : 'Misafir';

  return (
    <Screen withPadding={false}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: 'Seviye Seçin',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace({ pathname: '/dashboard', params: { userName } })}
              style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '700' }}>Geri</Text>
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView contentContainerStyle={{ padding: theme.space.xl, paddingTop: theme.space.lg }}>
        <View style={{ marginBottom: theme.space.xl }}>
          <Text style={{ ...theme.type.small, color: theme.colors.muted }}>Hazır mısın?</Text>
          <Text style={{ ...theme.type.h1, color: theme.colors.text, marginTop: 6 }}>{userName} 👋</Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8 }}>
            Sana en uygun zorluk seviyesini seç:
          </Text>
        </View>

        <View style={{ gap: theme.space.md }}>
          {(['easy', 'medium', 'hard'] as const).map((level) => {
            const accent =
              level === 'easy'
                ? theme.colors.primary
                : level === 'medium'
                  ? theme.colors.warning
                  : theme.colors.danger;

            const title =
              level === 'easy' ? 'Kolay Seviye' : level === 'medium' ? 'Orta Seviye' : 'Zor Seviye';

            const desc =
              level === 'easy'
                ? 'Yeni başlayanlar için 20 soru'
                : level === 'medium'
                  ? 'Bilgisini ölçmek isteyenler için'
                  : 'Gerçek uzmanlar buraya!';

            return (
              <TouchableOpacity
                key={level}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/quiz', params: { level, userName } })}
              >
                <Card style={{ padding: theme.space.xl }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: theme.space.lg }}>
                    <View
                      style={{
                        width: 10,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: accent,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...theme.type.h3, color: theme.colors.text }}>{title}</Text>
                      <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 6 }}>
                        {desc}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={theme.colors.muted} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}