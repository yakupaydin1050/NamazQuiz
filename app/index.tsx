import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { theme } from '../components/ui/theme';

export default function KarşılamaEkranı() {
  const router = useRouter();
  const [policyVisible, setPolicyVisible] = useState(false);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ alignItems: "center", marginTop: theme.space.xxl }}>
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 28,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="book-outline" size={48} color={theme.colors.text} />
          </View>
          <Text style={{ ...theme.type.h1, color: theme.colors.text, marginTop: theme.space.lg }}>
            Namaz Quiz
          </Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 10 }}>
            Minimal. Hızlı. Öğretici.
          </Text>
        </View>

        <View style={{ paddingHorizontal: theme.space.lg }}>
          <Text style={{ ...theme.type.body, color: theme.colors.text, textAlign: "center", lineHeight: 24 }}>
            &quot;Namaz, mü&apos;minin miracıdır.&quot;
          </Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, textAlign: "center", marginTop: 10 }}>
            - Hadis-i Şerif
          </Text>
        </View>

        <View style={{ paddingBottom: theme.space.xxl }}>
          <Button text="Haydi Başlayalım!" onPress={() => router.push('/auth-choice')} />
          <Text style={{ marginTop: theme.space.md, color: theme.colors.muted, ...theme.type.micro, textAlign: "center" }}>
            Devam ederek{" "}
            <Text
              style={{ color: theme.colors.primary, textDecorationLine: "underline" }}
              onPress={() => setPolicyVisible(true)}
            >
              gizlilik politikamızı
            </Text>
            {" "}kabul etmiş olursun.
          </Text>
        </View>
      </View>

      <Modal visible={policyVisible} animationType="slide" transparent onRequestClose={() => setPolicyVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", padding: theme.space.xl }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.space.lg }}>
              <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Gizlilik Politikası</Text>
              <TouchableOpacity onPress={() => setPolicyVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <PolicySection title="Bu uygulama nedir?">
                Namaz Quiz, namaz bilgini eğlenceli bir şekilde test etmen için geliştirilmiş ücretsiz bir uygulamadır.
              </PolicySection>

              <PolicySection title="Hangi veriler toplanır?">
                Hesap oluşturursan e-posta adresin ve seçtiğin kullanıcı adı kaydedilir. Quiz sonuçların ve toplam puanın liderlik tablosunu oluşturmak için saklanır. Misafir olarak giriş yaparsan yalnızca kullanıcı adın ve puanların tutulur.
              </PolicySection>

              <PolicySection title="Veriler neden kullanılır?">
                Hesabını yönetmek, liderlik tablosunu göstermek ve kaldığın yerden devam etmeni sağlamak için kullanılır. Başka bir amaçla kullanılmaz.
              </PolicySection>

              <PolicySection title="Veriler paylaşılıyor mu?">
                Hayır. Veriler hiçbir üçüncü tarafla paylaşılmaz ve satılmaz. Veriler yalnızca Firebase (Google) altyapısında güvenli biçimde saklanır.
              </PolicySection>

              <PolicySection title="Hesabımı silebilir miyim?">
                Evet. Profil Ayarları sayfasından hesabını ve tüm verilerini kalıcı olarak silebilirsin.
              </PolicySection>

              <Text style={{ ...theme.type.micro, color: theme.colors.muted, marginTop: theme.space.lg, marginBottom: theme.space.sm }}>
                Son güncelleme: Mayıs 2026
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PolicySection({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: theme.space.lg }}>
      <Text style={{ ...theme.type.small, color: theme.colors.text, fontWeight: "700", marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ ...theme.type.small, color: theme.colors.muted, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}
