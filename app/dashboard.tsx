import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';
import { auth, db } from '../config/firebase';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ totalScore: 0, completedQuizzes: 0, displayName: auth.currentUser?.displayName || 'Oyuncu' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as any);
      } else {
        setUserData(prev => ({ ...prev, displayName: user.displayName || 'Misafir' }));
      }
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Namaz Quiz'i denedin mi? 🕌\nNamaz bilgini test et, liderlik tablosuna gir!\nKolay, orta ve zor seviyede yüzlerce soru seni bekliyor.\n\nHemen indir ve oyna! 👇",
      });
    } catch {
      // kullanıcı paylaşımı iptal etti
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış", "Emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Evet", onPress: () => signOut(auth) },
    ]);
  };

  if (loading) {
    return (
      <Screen withPadding={false} contentStyle={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen withPadding={false} contentStyle={{ paddingTop: theme.space.lg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: theme.space.xl }} keyboardShouldPersistTaps="handled">
        
        <View style={{ marginBottom: theme.space.xl }}>
          <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>
            HOŞ GELDİN
          </Text>
          <Text style={{ ...theme.type.h2, color: theme.colors.text, marginTop: 6 }}>
            {userData.displayName.toUpperCase()}{" "}
            <Text style={{ color: theme.colors.muted }}>👋</Text>
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: theme.space.md, marginBottom: theme.space.xl }}>
          <Card style={{ flex: 1, padding: theme.space.lg }}>
            <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>PUAN</Text>
            <Text style={{ ...theme.type.h3, color: theme.colors.text, marginTop: 8 }}>
              {userData.totalScore}
            </Text>
            <Text style={{ marginTop: 8, color: theme.colors.primary, ...theme.type.small }}>🔥</Text>
          </Card>
          <Card style={{ flex: 1, padding: theme.space.lg }}>
            <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>TEST</Text>
            <Text style={{ ...theme.type.h3, color: theme.colors.text, marginTop: 8 }}>
              {userData.completedQuizzes}
            </Text>
            <Text style={{ marginTop: 8, color: theme.colors.info, ...theme.type.small }}>🎯</Text>
          </Card>
        </View>

        <View style={{ gap: theme.space.md }}>
          <Button text="Yarışmaya Başla" onPress={() => router.push({ pathname: '/categories', params: { userName: userData.displayName } })} />
          <Button text="Liderlik Tablosu" onPress={() => router.push('/leaderboard')} variant="secondary" />
          <Button text="Profil & Güvenlik" onPress={() => router.push('/profile')} variant="secondary" />
          <Button text="Arkadaşına Tavsiye Et" onPress={handleShare} variant="ghost" />
        </View>

        <View style={{ marginTop: theme.space.xl }}>
          <Button text="Çıkış Yap" onPress={handleLogout} variant="danger" />
        </View>

      </ScrollView>
    </Screen>
  );
}