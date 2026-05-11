import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, View
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';
import { auth, db } from '../config/firebase';

export default function KayitEkrani() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName.trim() });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: displayName.trim(),
        email: user.email,
        totalScore: 0,
        completedQuizzes: 0,
        createdAt: new Date().toISOString()
      });

      // Kayıttan sonra _layout otomatik dashboard'a atacak
    } catch (error: any) {
      let message = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') message = "Bu e-posta zaten kullanımda.";
      Alert.alert("Hata", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen withPadding={false}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: theme.space.xl, paddingTop: theme.space.xl, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginBottom: theme.space.xl }}>
            <Text style={{ fontSize: 56, marginBottom: 10 }}>✨</Text>
            <Text style={{ ...theme.type.h2, color: theme.colors.text }}>Hesap Oluştur</Text>
            <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8, textAlign: "center" }}>
              Yeni bir maceraya hazır mısın?
            </Text>
          </View>

          <Card style={{ padding: theme.space.xl }}>
            <View style={{ gap: theme.space.md }}>
              <View style={{ gap: 8 }}>
                <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>
                  AD SOYAD
                </Text>
                <Input
                  placeholder="Örn: Ahmet Yılmaz"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>E-POSTA</Text>
                <Input
                  placeholder="örnek@mail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>ŞİFRE</Text>
                <Input
                  placeholder="En az 6 karakter"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Button text={loading ? "Hesap oluşturuluyor..." : "Kayıt Ol ve Başla"} onPress={handleRegister} disabled={loading} />
            </View>
          </Card>

          <View style={{ marginTop: theme.space.lg, gap: theme.space.md }}>
            <Button text="Zaten Hesabım Var" onPress={() => router.replace('/login')} variant="secondary" />
            <Button text="Ana Sayfaya Dön" onPress={() => router.replace('/')} variant="ghost" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}