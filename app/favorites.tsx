import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { arrayRemove, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { theme } from '../components/ui/theme';

interface FavoriteQuestion {
  id: string;
  question: string;
  correct: string;
  level: string;
}

export default function Favorites() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<FavoriteQuestion[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const raw = userSnap.exists() ? userSnap.data().favoriteQuestionIds : undefined;
      const ids: string[] = Array.isArray(raw)
        ? raw.filter((id): id is string => typeof id === 'string' && id.length > 0)
        : [];

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const qSnap = await getDoc(doc(db, "questions", id));
            if (!qSnap.exists()) return null;
            return { ...qSnap.data(), id } as FavoriteQuestion;
          } catch {
            return null;
          }
        })
      );
      setQuestions(results.filter((q): q is FavoriteQuestion => q !== null));
    } catch {
      // sessiz geç
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (questionId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    setRemovingId(questionId);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        favoriteQuestionIds: arrayRemove(questionId),
      });
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch {
      // sessiz geç
    } finally {
      setRemovingId(null);
    }
  };

  const levelLabel = (l: string) => l === 'easy' ? 'Kolay' : l === 'medium' ? 'Orta' : 'Zor';
  const levelColor = (l: string) => l === 'easy' ? '#16a34a' : l === 'medium' ? '#b45309' : '#b91c1c';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Stack.Screen options={{
        headerShown: true,
        title: "Favori Sorularım",
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: "800" },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.replace("/dashboard")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 10 }}
          >
            <Ionicons name="grid-outline" size={18} color={theme.colors.text} />
            <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Ana Sayfa</Text>
          </TouchableOpacity>
        ),
      }} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : questions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 }}>
          <Text style={{ fontSize: 48 }}>☆</Text>
          <Text style={{ ...theme.type.body, color: theme.colors.text, fontWeight: '800', textAlign: 'center' }}>
            Henüz favori soru eklemediniz
          </Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, textAlign: 'center' }}>
            Yarışma sırasında bir soruya cevap verdikten sonra "☆ Favorilere Ekle" butonuna tıklayarak kaydedebilirsin.
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: 10,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ ...theme.type.body, color: theme.colors.text, flex: 1, lineHeight: 22 }}>
                  {item.question}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  hitSlop={10}
                  style={{ paddingTop: 2 }}
                >
                  {removingId === item.id ? (
                    <ActivityIndicator size="small" color={theme.colors.danger} />
                  ) : (
                    <Ionicons name="star" size={20} color="#f59e0b" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary }}>✅ {item.correct}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(100,116,139,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: levelColor(item.level) }}>
                    {levelLabel(item.level)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
