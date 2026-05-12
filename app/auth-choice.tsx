import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';
import { auth } from '../config/firebase';

export default function AuthChoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [guestName, setGuestName] = useState('');

  const handleGuestLogin = () => {
    setGuestName('');
    setNameModalVisible(true);
  };

  const confirmGuestLogin = async () => {
    const name = guestName.trim();
    if (name.length < 2) {
      Alert.alert("Hata", "Lütfen en az 2 karakterli bir isim girin.");
      return;
    }

    setNameModalVisible(false);
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      await updateProfile(userCredential.user, { displayName: name });
    } catch (error) {
      console.error(error);
      Alert.alert("Hata", "Misafir girişi yapılamadı.");
    } finally {
      setLoading(false);
    }
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
          Misafir girişinde puanların liderlik tablosunda görünmesi için testi tamamlaman gerekir.
        </Text>
      </View>

      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 }}
        >
          <View style={{ width: '100%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: theme.space.xl, gap: theme.space.md }}>
            <Text style={{ ...theme.type.h3, color: theme.colors.text, textAlign: 'center' }}>
              Kullanıcı Adı
            </Text>
            <Text style={{ ...theme.type.small, color: theme.colors.muted, textAlign: 'center' }}>
              Yarışmada ve liderlik tablosunda görünecek ismini yaz.
            </Text>
            <Input
              placeholder="Örn: Ahmet"
              value={guestName}
              onChangeText={setGuestName}
              autoFocus
              autoCapitalize="words"
              onSubmitEditing={confirmGuestLogin}
            />
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <TouchableOpacity
                onPress={() => setNameModalVisible(false)}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.border, alignItems: 'center' }}
              >
                <Text style={{ ...theme.type.body, color: theme.colors.muted, fontWeight: '700' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmGuestLogin}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center' }}
              >
                <Text style={{ ...theme.type.body, color: '#000', fontWeight: '800' }}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
