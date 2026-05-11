import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  View
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';
import { auth } from '../config/firebase';

export default function AuthChoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = () => {
    // Android ve iOS uyumlu isim isteme penceresi
    Alert.prompt(
      "Kullanıcı Adı",
      "Yarışmada ve liderlik tablosunda görünecek ismini yaz:",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Giriş Yap",
          onPress: async (name?: string) => {
            if (!name || name.trim().length < 2) {
              Alert.alert("Hata", "Lütfen en az 2 karakterli bir isim girin.");
              return;
            }
            
            setLoading(true);
            try {
              // 1. Anonim giriş yap
              const userCredential = await signInAnonymously(auth);
              
              // 2. Firebase profiline ismi kaydet (Bu Dashboard'da görünmesini sağlar)
              await updateProfile(userCredential.user, {
                displayName: name.trim()
              });
              
              // Yönlendirme _layout.tsx tarafından otomatik yapılacak.
            } catch (error) {
              console.error(error);
              Alert.alert("Hata", "Misafir girişi yapılamadı.");
            } finally {
              setLoading(false);
            }
          } 
        }
      ],
      'plain-text'
    );
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: theme.space.xl }}>
          <Ionicons name="book-outline" size={64} color={theme.colors.text} style={{ marginBottom: 10 }} />
          <Text style={{ ...theme.type.h1, color: theme.colors.text }}>Namaz Quiz</Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8, textAlign: "center" }}>
            Bilgini test et, kendini geliştir.
          </Text>
        </View>

        <Card style={{ padding: theme.space.xl }}>
          <View style={{ gap: theme.space.md }}>
            <Button text="Giriş Yap" onPress={() => router.push('/login')} />
            <Button text="Hesap Oluştur" onPress={() => router.push('/register')} variant="secondary" />

            <Button
              text={loading ? "Misafir Girişi..." : "Misafir Olarak Devam Et"}
              onPress={handleGuestLogin}
              variant="ghost"
              disabled={loading}
            />

            {loading ? (
              <View style={{ marginTop: theme.space.sm, alignItems: "center" }}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null}
          </View>
        </Card>

        <Text style={{ marginTop: theme.space.lg, color: theme.colors.muted, ...theme.type.micro, textAlign: "center", lineHeight: 16 }}>
          Misafir girişinde puanlarının liderlik tablosunda görünmesi için testi tamamlaman gerekir.
        </Text>
      </View>
    </Screen>
  );
}