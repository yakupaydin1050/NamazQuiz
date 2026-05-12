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
import { getRankProgress } from '../utils/rank';
import hadiths from '../data/hadiths.json';

const today = new Date();
const dayIndex = Math.floor(today.getTime() / 86_400_000);
const dailyHadith = hadiths[dayIndex % hadiths.length];

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
        
        <View style={{ marginBottom: theme.space.lg }}>
          <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>
            HOŞ GELDİN
          </Text>
          <Text style={{ ...theme.type.h2, color: theme.colors.text, marginTop: 6 }}>
            {(userData.displayName || 'Oyuncu').toUpperCase()}{" "}
            <Text style={{ color: theme.colors.muted }}>👋</Text>
          </Text>
        </View>

        <Card style={{ marginBottom: theme.space.xl, padding: theme.space.lg, borderColor: 'rgba(251,191,36,0.2)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.space.sm }}>
            <Text style={{ ...theme.type.micro, color: theme.colors.warning, letterSpacing: 1.2 }}>
              GÜNÜN HADİSİ
            </Text>
            <Text style={{ ...theme.type.micro, color: theme.colors.muted }}>
              {today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Text style={{ ...theme.type.small, color: theme.colors.text, lineHeight: 20, fontStyle: 'italic' }}>
            "{dailyHadith.text}"
          </Text>
          <Text style={{ ...theme.type.micro, color: theme.colors.muted, marginTop: theme.space.sm, textAlign: 'right' }}>
            — {dailyHadith.source}
          </Text>
        </Card>

        <View style={{ flexDirection: "row", gap: theme.space.md, marginBottom: theme.space.md }}>
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

        {(() => {
          const { rank, next, percent, remaining } = getRankProgress(userData.totalScore);
          return (
            <Card style={{ marginBottom: theme.space.xl, padding: theme.space.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
                <View style={{
                  width: 54, height: 54, borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface2,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 26 }}>{rank.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>RÜTBE</Text>
                  <Text style={{ ...theme.type.body, color: theme.colors.text, marginTop: 3, fontWeight: '800' }}>
                    {rank.title}
                  </Text>
                </View>
              </View>

              {next ? (
                <View style={{ marginTop: theme.space.md }}>
                  <View style={{
                    height: 6, backgroundColor: theme.colors.border,
                    borderRadius: 3, overflow: 'hidden',
                  }}>
                    <View style={{
                      height: 6,
                      width: `${percent * 100}%`,
                      backgroundColor: theme.colors.primary,
                      borderRadius: 3,
                    }} />
                  </View>
                  <Text style={{ ...theme.type.micro, color: theme.colors.muted, marginTop: 6 }}>
                    {remaining} puan daha → {next.emoji} {next.title}
                  </Text>
                </View>
              ) : (
                <Text style={{ ...theme.type.micro, color: theme.colors.warning, marginTop: theme.space.sm }}>
                  👑 En yüksek rütbedesin!
                </Text>
              )}
            </Card>
          );
        })()}

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