import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';
import { auth, db } from '../config/firebase';
import { getRankProgress } from '../utils/rank';
import hadiths from '../data/hadiths.json';

export default function Dashboard() {
  const today = new Date();
  const dailyHadith = hadiths[Math.floor(today.getTime() / 86_400_000) % hadiths.length];
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ totalScore: 0, completedQuizzes: 0, displayName: auth.currentUser?.displayName || 'Oyuncu' });
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

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
          <Button text="Geri Bildirim Gönder" onPress={() => setFeedbackVisible(true)} variant="ghost" />
        </View>

        <View style={{ marginTop: theme.space.xl }}>
          <Button text="Çıkış Yap" onPress={handleLogout} variant="danger" />
        </View>

      </ScrollView>

      <Modal visible={feedbackVisible} transparent animationType="fade" onRequestClose={() => setFeedbackVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 }}
        >
          <View style={{ width: '100%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: theme.space.xl, gap: theme.space.md }}>
            <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Geri Bildirim</Text>
            <Text style={{ ...theme.type.small, color: theme.colors.muted }}>
              Öneri, şikayet veya her türlü görüşünü yazabilirsin.
            </Text>
            <TextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Görüşünü yaz..."
              placeholderTextColor={theme.colors.muted}
              multiline
              style={{
                backgroundColor: theme.colors.surface2,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.text,
                height: 100,
                textAlignVertical: 'top',
                fontSize: 14,
              }}
            />
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <TouchableOpacity
                onPress={() => { setFeedbackVisible(false); setFeedbackText(''); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.border, alignItems: 'center' }}
              >
                <Text style={{ ...theme.type.body, color: theme.colors.muted, fontWeight: '700' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={sendingFeedback}
                onPress={async () => {
                  if (!feedbackText.trim()) { Alert.alert('Hata', 'Lütfen bir şeyler yaz.'); return; }
                  setSendingFeedback(true);
                  try {
                    await addDoc(collection(db, 'feedback'), {
                      comment: feedbackText.trim(),
                      userId: auth.currentUser?.uid ?? 'anonim',
                      type: 'general',
                      createdAt: serverTimestamp(),
                    });
                    setFeedbackVisible(false);
                    setFeedbackText('');
                    Alert.alert('Teşekkürler!', 'Geri bildiriminiz iletildi.');
                  } catch {
                    Alert.alert('Hata', 'Gönderilemedi, tekrar dene.');
                  } finally {
                    setSendingFeedback(false);
                  }
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', opacity: sendingFeedback ? 0.6 : 1 }}
              >
                <Text style={{ ...theme.type.body, color: '#000', fontWeight: '800' }}>
                  {sendingFeedback ? 'Gönderiliyor...' : 'Gönder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </Screen>
  );
}