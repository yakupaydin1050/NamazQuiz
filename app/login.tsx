import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInAnonymously, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, Text, TouchableOpacity, View
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';
import { auth } from '../config/firebase';

export default function LoginEkranı() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("savedEmail").then(saved => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email.trim().toLowerCase());
      } else {
        await AsyncStorage.removeItem("savedEmail");
      }
    } catch {
      Alert.alert("Giriş Hatası", "E-posta veya şifre hatalı.");
    } finally { setLoading(false); }
  };

  const handleGuestLogin = async () => {
    const name = guestName.trim();
    if (name.length < 2) {
      Alert.alert("Hata", "Lütfen en az 2 karakterli bir isim girin.");
      return;
    }
    setGuestLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      await updateProfile(userCredential.user, { displayName: name });
      setGuestOpen(false);
      setGuestName("");
      // Yönlendirmeyi _layout.tsx yapacak.
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", "Misafir girişi yapılamadı.");
    } finally {
      setGuestLoading(false);
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
            <Ionicons name="book-outline" size={52} color={theme.colors.text} style={{ marginBottom: 10 }} />
            <Text style={{ ...theme.type.h2, color: theme.colors.text }}>Giriş Yap</Text>
            <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8, textAlign: "center" }}>
              Kaldığın yerden devam et.
            </Text>
          </View>

          <Card style={{ padding: theme.space.xl }}>
            <View style={{ gap: theme.space.md }}>
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
                  placeholder="******"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                onPress={() => setRememberMe(r => !r)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={rememberMe ? "checkbox" : "square-outline"}
                  size={22}
                  color={rememberMe ? theme.colors.primary : theme.colors.muted}
                />
                <Text style={{ ...theme.type.small, color: theme.colors.muted }}>Beni hatırla</Text>
              </TouchableOpacity>

              <Button text={loading ? "Giriş yapılıyor..." : "Giriş Yap"} onPress={handleLogin} disabled={loading} />
            </View>
          </Card>

          <View style={{ marginTop: theme.space.lg, gap: theme.space.md }}>
            <Button text="Hesap Oluştur" onPress={() => router.push('/register')} variant="secondary" />
            <Button text="Misafir Olarak Devam Et" onPress={() => setGuestOpen(true)} variant="ghost" />
            <Button text="Geri Dön" onPress={() => router.back()} variant="ghost" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={guestOpen} transparent animationType="fade" onRequestClose={() => setGuestOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: theme.space.xl,
            justifyContent: "center",
          }}
        >
          <Card style={{ padding: theme.space.xl }}>
            <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Misafir Girişi</Text>
            <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8 }}>
              Liderlik tablosunda görünecek ismini yaz.
            </Text>
            <View style={{ marginTop: theme.space.lg, gap: theme.space.md }}>
              <Input value={guestName} onChangeText={setGuestName} placeholder="Kullanıcı adı" />
              <Button
                text={guestLoading ? "Giriş yapılıyor..." : "Devam Et"}
                onPress={handleGuestLogin}
                disabled={guestLoading}
              />
              <Button text="Vazgeç" onPress={() => setGuestOpen(false)} variant="secondary" />
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}