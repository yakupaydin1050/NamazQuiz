import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Screen } from "../components/ui/Screen";
import { theme } from "../components/ui/theme";

type Provider = "password" | "anonymous" | "other";

function getProvider(): Provider {
  const u = auth.currentUser;
  if (!u) return "other";
  if (u.isAnonymous) return "anonymous";
  const ids = u.providerData?.map((p) => p.providerId) ?? [];
  return ids.includes("password") ? "password" : "other";
}

async function ensureRecentLogin(currentPassword?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("no-user");

  const provider = getProvider();
  if (provider !== "password") return;

  if (!user.email) throw new Error("no-email");
  if (!currentPassword) throw new Error("need-password");

  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
}

export default function ProfileSettings() {
  const router = useRouter();
  const user = auth.currentUser;

  const provider = getProvider();

  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  if (!user) {
    return (
      <Screen contentStyle={{ justifyContent: "center", alignItems: "center" }}>
        <Text style={{ ...theme.type.body, color: theme.colors.text, textAlign: "center" }}>
          Oturum bulunamadı.
        </Text>
        <Text style={{ ...theme.type.small, color: theme.colors.muted, textAlign: "center", marginTop: 10 }}>
          Tekrar giriş yapmayı deneyin.
        </Text>
        <View style={{ marginTop: theme.space.lg, width: "100%" }}>
          <Button text="Ana Sayfa" onPress={() => router.replace("/")} variant="secondary" />
        </View>
      </Screen>
    );
  }

  const isPasswordUser = provider === "password";
  const isAnonymous = provider === "anonymous";

  const handlePhotoUpdate = async (source: "camera" | "library") => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Kamera erişimi için izin vermelisin.");
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeri erişimi için izin vermelisin.");
        return;
      }
    }

    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6, mediaTypes: "images" });

    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profilePhotos/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL: downloadURL });
      await setDoc(doc(db, "users", user.uid), { photoURL: downloadURL }, { merge: true });

      setPhotoURL(downloadURL);
      Alert.alert("Tamam", "Profil fotoğrafı güncellendi.");
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", "Fotoğraf yüklenemedi.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    if (isAnonymous) {
      Alert.alert(
        "Üyelere Özel",
        "Profil fotoğrafı yüklemek için hesap oluşturman gerekiyor. Kayıt ekranından ücretsiz hesap açabilirsin.",
        [{ text: "Tamam", style: "cancel" }]
      );
      return;
    }
    Alert.alert("Profil Fotoğrafı", "Nasıl eklemek istersin?", [
      { text: "Kamera", onPress: () => handlePhotoUpdate("camera") },
      { text: "Galeriden Seç", onPress: () => handlePhotoUpdate("library") },
      { text: "İptal", style: "cancel" },
    ]);
  };

  const handleSaveName = async () => {
    const next = displayName.trim();
    if (next.length < 2) {
      Alert.alert("Hata", "Kullanıcı adı en az 2 karakter olmalı.");
      return;
    }

    setSavingName(true);
    try {
      await updateProfile(user, { displayName: next });
      const userRef = doc(db, "users", user.uid);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (snap.exists()) {
          tx.update(userRef, { displayName: next });
        } else {
          tx.set(userRef, {
            uid: user.uid,
            displayName: next,
            email: user.email ?? "misafir@quiz.com",
            totalScore: 0,
            completedQuizzes: 0,
            createdAt: new Date().toISOString(),
          });
        }
      });
      Alert.alert("Tamam", "Kullanıcı adı güncellendi.");
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", "Kullanıcı adı güncellenemedi.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isPasswordUser) return;
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Hata", "Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }
    if (!currentPassword) {
      Alert.alert("Hata", "Lütfen mevcut şifreni gir.");
      return;
    }

    setSavingPassword(true);
    try {
      await ensureRecentLogin(currentPassword);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
      Alert.alert("Tamam", "Şifren güncellendi.");
    } catch (e: any) {
      const code = e?.code as string | undefined;
      // console.error Firebase hatasını uygulamada kırmızı overlay gibi gösterebiliyor.
      console.log("changePassword failed", code);

      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        Alert.alert("Hata", "Mevcut şifre yanlış.");
      } else if (code === "auth/requires-recent-login") {
        Alert.alert("Hata", "Güvenlik nedeniyle tekrar giriş yapıp yeniden deneyin.");
      } else if (code === "auth/weak-password") {
        Alert.alert("Hata", "Şifre zayıf. Daha güçlü bir şifre deneyin.");
      } else {
        Alert.alert("Hata", "Şifre güncellenemedi.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Hesabı Sil",
      "Bu işlem geri alınamaz. Puanların ve hesabın kalıcı olarak silinecek.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              if (isPasswordUser) {
                if (!currentPassword) {
                  Alert.alert("Hata", "Hesabı silmek için mevcut şifreni girmen gerekiyor.");
                  return;
                }
                await ensureRecentLogin(currentPassword);
              }

              // Firestore kaydını sil
              await deleteDoc(doc(db, "users", user.uid));

              // Auth hesabını sil
              await deleteUser(user);

              // Root layout yönlendirmeyi yapacak; yine de güvenli taraf:
              router.replace("/");
            } catch (e: any) {
              const code = e?.code as string | undefined;
              console.log("deleteAccount failed", code);
              if (code === "auth/requires-recent-login") {
                Alert.alert("Hata", "Güvenlik nedeniyle tekrar giriş gerekli.");
              } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
                Alert.alert("Hata", "Mevcut şifre yanlış.");
              } else {
                Alert.alert("Hata", "Hesap silinemedi.");
              }
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen withPadding={false}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Profil Ayarları",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/dashboard")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginLeft: 10,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: "rgba(234,240,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(234,240,255,0.12)",
              }}
            >
              <Ionicons name="grid-outline" size={18} color={theme.colors.text} />
              <Text style={{ color: theme.colors.text, fontWeight: "800" }}>Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: theme.space.xl, gap: theme.space.lg }} keyboardShouldPersistTaps="handled">

        <View style={{ alignItems: "center", marginBottom: theme.space.sm }}>
          <TouchableOpacity onPress={showPhotoOptions} disabled={uploadingPhoto} activeOpacity={0.8}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.border, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {uploadingPhoto ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} style={{ width: 96, height: 96 }} />
              ) : (
                <Text style={{ fontSize: 36, fontWeight: "700", color: theme.colors.muted }}>
                  {(user.displayName || "?")[0].toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.colors.bg }}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 10 }}>
            Fotoğrafı değiştirmek için dokun
          </Text>
        </View>

        <Card>
          <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Hesap</Text>
          <View style={{ marginTop: theme.space.md, gap: 8 }}>
            <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>E-POSTA</Text>
            <Text style={{ ...theme.type.body, color: theme.colors.text }}>
              {user.email ?? (user.isAnonymous ? "Misafir" : "—")}
            </Text>
          </View>
          <View style={{ marginTop: theme.space.md, gap: 8 }}>
            <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>HESAP TÜRÜ</Text>
            <Text style={{ ...theme.type.body, color: theme.colors.text }}>
              {isAnonymous ? "Misafir" : isPasswordUser ? "E-posta / Şifre" : "Harici Sağlayıcı"}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Kullanıcı Adı</Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8 }}>
            Liderlik tablosunda bu isim görünecek.
          </Text>
          <View style={{ marginTop: theme.space.md, gap: theme.space.md }}>
            <Input value={displayName} onChangeText={setDisplayName} placeholder="Kullanıcı adı" />
            <Button text={savingName ? "Kaydediliyor..." : "Kaydet"} onPress={handleSaveName} disabled={savingName} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Şifre</Text>
            {!isPasswordUser ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.colors.muted} />
                <Text style={{ ...theme.type.micro, color: theme.colors.muted }}>
                  {isAnonymous ? "Misafir hesap" : "Desteklenmiyor"}
                </Text>
              </View>
            ) : null}
          </View>

          {isPasswordUser ? (
            <View style={{ marginTop: theme.space.md, gap: theme.space.md }}>
              <View style={{ gap: 8 }}>
                <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>MEVCUT ŞİFRE</Text>
                <Input
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>YENİ ŞİFRE</Text>
                <Input
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="En az 6 karakter"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1.2 }}>YENİ ŞİFRE (TEKRAR)</Text>
                <Input
                  value={newPasswordRepeat}
                  onChangeText={setNewPasswordRepeat}
                  placeholder="Tekrar yazın"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              <Button
                text={savingPassword ? "Güncelleniyor..." : "Şifreyi Değiştir"}
                onPress={handleChangePassword}
                disabled={savingPassword}
                variant="secondary"
              />
            </View>
          ) : (
            <Text style={{ marginTop: theme.space.md, color: theme.colors.muted, ...theme.type.small }}>
              Şifre değişikliği sadece e-posta/şifre ile kayıtlı hesaplarda kullanılabilir.
            </Text>
          )}
        </Card>

        <Card>
          <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Geri Bildirim</Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8 }}>
            Öneri veya şikayetlerini bizimle paylaş.
          </Text>
          <View style={{ marginTop: theme.space.md }}>
            <Button text="Geri Bildirim Gönder" onPress={() => setFeedbackVisible(true)} variant="secondary" />
          </View>
        </Card>

        <Card style={{ borderColor: "rgba(251,113,133,0.35)" }}>
          <Text style={{ ...theme.type.h3, color: theme.colors.text }}>Tehlikeli Alan</Text>
          <Text style={{ ...theme.type.small, color: theme.colors.muted, marginTop: 8 }}>
            Hesabını sildiğinde tüm verilerini kalıcı olarak kaybedersin.
          </Text>

          <View style={{ marginTop: theme.space.md }}>
            <Button
              text={deleting ? "Siliniyor..." : "Hesabı Sil"}
              onPress={handleDeleteAccount}
              disabled={deleting}
              variant="danger"
            />
          </View>
        </Card>

        <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: theme.space.sm }} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: theme.space.md }}>
          <Text
            style={{ ...theme.type.micro, color: theme.colors.info, textDecorationLine: 'underline' }}
            onPress={() => setLegalModal('privacy')}
          >
            Gizlilik Politikası
          </Text>
          <Text style={{ ...theme.type.micro, color: theme.colors.border }}>|</Text>
          <Text
            style={{ ...theme.type.micro, color: theme.colors.info, textDecorationLine: 'underline' }}
            onPress={() => setLegalModal('terms')}
          >
            Kullanım Koşulları
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 6, paddingVertical: theme.space.lg }}>
          <Text style={{ ...theme.type.small, color: theme.colors.text, fontWeight: "700", letterSpacing: 0.5 }}>
            Namaz Quiz
          </Text>
          <Text style={{ ...theme.type.micro, color: theme.colors.muted }}>
            Versiyon 1.0.0
          </Text>
          <Text style={{ ...theme.type.micro, color: theme.colors.muted }}>
            YAAY tarafından yapıldı
          </Text>
          <Text style={{ ...theme.type.micro, color: theme.colors.muted, marginTop: 2 }}>
            Claude ile geliştirildi ✦
          </Text>
        </View>
      </ScrollView>

      {/* Gizlilik / Kullanım Koşulları Modal */}
      <Modal visible={legalModal !== null} animationType="slide" transparent onRequestClose={() => setLegalModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", padding: theme.space.xl }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.space.lg }}>
              <Text style={{ ...theme.type.h3, color: theme.colors.text }}>
                {legalModal === 'privacy' ? 'Gizlilik Politikası' : 'Kullanım Koşulları'}
              </Text>
              <TouchableOpacity onPress={() => setLegalModal(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {legalModal === 'privacy' ? (
                <>
                  <LegalSection title="Bu uygulama nedir?">
                    Namaz Quiz, namaz bilgini eğlenceli bir şekilde test etmen için geliştirilmiş ücretsiz bir uygulamadır.
                  </LegalSection>
                  <LegalSection title="Hangi veriler toplanır?">
                    Hesap oluşturursan e-posta adresin ve kullanıcı adın kaydedilir. Quiz sonuçların ve toplam puanın liderlik tablosunu oluşturmak için saklanır. Misafir olarak giriş yaparsan yalnızca kullanıcı adın ve puanların tutulur.
                  </LegalSection>
                  <LegalSection title="Veriler neden kullanılır?">
                    Hesabını yönetmek, liderlik tablosunu göstermek ve kaldığın yerden devam etmeni sağlamak için kullanılır. Başka bir amaçla kullanılmaz.
                  </LegalSection>
                  <LegalSection title="Veriler paylaşılıyor mu?">
                    Hayır. Veriler hiçbir üçüncü tarafla paylaşılmaz ve satılmaz. Yalnızca Firebase (Google) altyapısında güvenli biçimde saklanır.
                  </LegalSection>
                  <LegalSection title="Hesabımı silebilir miyim?">
                    Evet. Bu sayfadan hesabını ve tüm verilerini kalıcı olarak silebilirsin.
                  </LegalSection>
                </>
              ) : (
                <>
                  <LegalSection title="Kabul">
                    Uygulamayı kullanarak bu koşulları kabul etmiş sayılırsın.
                  </LegalSection>
                  <LegalSection title="Hizmet">
                    NamazQuiz; sorular, sözlük, günlük hadis ve liderlik tablosu içeren ücretsiz bir eğitim uygulamasıdır. Reklam veya ücretli içerik yoktur.
                  </LegalSection>
                  <LegalSection title="Hesap">
                    Hesabının güvenliğinden kendin sorumlusun. 13 yaşın altındaysan uygulamayı kullanmamalısın.
                  </LegalSection>
                  <LegalSection title="Yasak Davranışlar">
                    Uygulamayı tersine mühendislik yapmak, puan sistemini manipüle etmek ve başka kullanıcıların verilerine erişmeye çalışmak yasaktır.
                  </LegalSection>
                  <LegalSection title="Hesap Silme">
                    Hesabını ve tüm verilerini istediğin zaman bu sayfadan silebilirsin.
                  </LegalSection>
                </>
              )}
              <Text style={{ ...theme.type.micro, color: theme.colors.muted, marginTop: theme.space.lg, marginBottom: theme.space.sm }}>
                Son güncelleme: Mayıs 2026
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Geri Bildirim Modal */}
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
              placeholderTextColor={theme.colors.placeholder}
              multiline
              style={{ backgroundColor: theme.colors.surface2, borderRadius: 12, padding: 14, color: theme.colors.text, height: 100, textAlignVertical: 'top', fontSize: 14 }}
            />
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <TouchableOpacity
                onPress={() => { setFeedbackVisible(false); setFeedbackText(''); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.surface2, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
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

function LegalSection({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: theme.space.lg }}>
      <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: '700', marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: theme.colors.muted, lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

