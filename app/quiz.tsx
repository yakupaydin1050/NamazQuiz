import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// FIREBASE BAĞLANTILARI
import { addDoc, collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { auth, db } from '../config/firebase';
import QuestionText from '../components/ui/QuestionText';
import { theme } from '../components/ui/theme';

function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function YarışmaEkranı() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const level = typeof params.level === 'string' ? params.level : 'easy';

  // State Tanımlamaları
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFeedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [bonusLabel, setBonusLabel] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [wasEarlyQuit, setWasEarlyQuit] = useState(false);
  const questionStartTime = useRef(Date.now());

  // Firestore'dan soruları çek
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "questions"), where("level", "==", level));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(d => d.data());
        setQuestions(shuffleArray(fetched).slice(0, 20));
      } catch (err) {
        console.error("Sorular yüklenemedi:", err);
        Alert.alert("Hata", "Sorular yüklenemedi. İnternet bağlantını kontrol et.");
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [level]);

  // Yeni soru gösterilince süreyi sıfırla
  useEffect(() => {
    questionStartTime.current = Date.now();
    setBonusLabel("");
  }, [currentIndex]);

  // Sayaç Mantığı
  useEffect(() => {
    let interval: any;
    if (!isFinished && !loadingQuestions) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished, loadingQuestions]);

  // TESTİ BİTİR VE VERİTABANINA KAYDET
  const handleFinishQuiz = async (earlyQuit = false) => {
    if (isSaving) return;

    setIsFinished(true);
    setWasEarlyQuit(earlyQuit);
    setIsSaving(true);

    const user = auth.currentUser;
    const pointsToSave = earlyQuit ? Math.floor(score / 2) : score;
    let newCompletedCount = 0;

    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);

        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          const data = snap.exists() ? (snap.data() as any) : {};

          const prevTotalScore = typeof data.totalScore === "number" ? data.totalScore : 0;
          const prevCompleted = typeof data.completedQuizzes === "number" ? data.completedQuizzes : 0;
          newCompletedCount = earlyQuit ? prevCompleted : prevCompleted + 1;

          tx.set(
            userRef,
            {
              uid: user.uid,
              email: user.email || "misafir@quiz.com",
              displayName: user.displayName || data.displayName || "İsimsiz Oyuncu",
              totalScore: prevTotalScore + pointsToSave,
              completedQuizzes: newCompletedCount,
              lastPlayed: serverTimestamp(),
              lastQuiz: { score: pointsToSave, seconds, level },
            },
            { merge: true }
          );
        });

        let shouldReview = !earlyQuit && newCompletedCount === 2;

        if (earlyQuit) {
          const raw = await AsyncStorage.getItem('earlyQuitCount');
          const newCount = (parseInt(raw ?? '0') || 0) + 1;
          await AsyncStorage.setItem('earlyQuitCount', String(newCount));
          if (newCount === 2) shouldReview = true;
        }

        if (shouldReview) {
          const available = await StoreReview.isAvailableAsync();
          if (available) StoreReview.requestReview();
        }
      } catch (error: any) {
        console.error("Firestore Kayıt Hatası:", error.message);
      }
    }
    setIsSaving(false);
  };

  if (loadingQuestions) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: '#64748b', marginTop: 12 }}>Sorular yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = userAnswers[currentIndex];

  const getTimeBonus = (elapsed: number): number => {
    if (level === 'easy') {
      if (elapsed <= 5) return 5;
      if (elapsed <= 10) return 3;
      if (elapsed <= 15) return 1;
    } else if (level === 'medium') {
      if (elapsed <= 8) return 5;
      if (elapsed <= 15) return 3;
      if (elapsed <= 22) return 1;
    } else {
      if (elapsed <= 12) return 5;
      if (elapsed <= 20) return 3;
      if (elapsed <= 30) return 1;
    }
    return 0;
  };

  const handleReveal = () => {
    if (selectedAnswer || isFinished) return;
    setRevealedAnswers(prev => new Set([...prev, currentIndex]));
    setUserAnswers(prev => ({ ...prev, [currentIndex]: currentQuestion.correct }));
  };

  const handleShareQuestion = async () => {
    try {
      const optionLabels = currentQuestion.options
        .map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`)
        .join('\n');
      await Share.share({
        message: `📖 NamazQuiz Sorusu\n\n${currentQuestion.question}\n\n${optionLabels}\n\n✅ Doğru Cevap: ${currentQuestion.correct}\n\n🕌 NamazQuiz'i dene!`,
      });
    } catch {
      // kullanıcı iptal etti
    }
  };

  const SKIP_LIMIT = 3;

  const handleSkip = () => {
    if (selectedAnswer || isFinished) return;
    if (!skippedQuestions.has(currentIndex) && skippedQuestions.size >= SKIP_LIMIT) {
      Alert.alert("Atla hakkın bitti", `En fazla ${SKIP_LIMIT} soruyu atlayabilirsin.`);
      return;
    }
    setSkippedQuestions(prev => new Set([...prev, currentIndex]));
    if (currentIndex === questions.length - 1) {
      handleFinishQuiz();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedAnswer || isFinished) return;

    setUserAnswers({ ...userAnswers, [currentIndex]: option });

    let gain = 10;
    let loss = 5;
    if (level === 'medium') { gain = 20; loss = 10; }
    else if (level === 'hard') { gain = 30; loss = 15; }

    if (option === currentQuestion.correct) {
      const elapsed = (Date.now() - questionStartTime.current) / 1000;
      const bonus = getTimeBonus(elapsed);
      setScore(prev => prev + gain + bonus);
      if (bonus > 0) {
        setBonusLabel(`+${bonus} ⚡`);
        setTimeout(() => setBonusLabel(""), 1500);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setScore(prev => Math.max(0, prev - loss));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // SONUÇ EKRANI
  if (isFinished) {
    const correctCount = Object.keys(userAnswers).filter(idx => {
      const i = parseInt(idx);
      return userAnswers[i] === questions[i].correct && !revealedAnswers.has(i);
    }).length;
    const skippedCount = skippedQuestions.size;
    const wrongCount = Object.keys(userAnswers).length - correctCount - revealedAnswers.size;

    return (
      <SafeAreaView style={styles.resultContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.resultEmoji}>{wasEarlyQuit ? '⏹️' : '🏆'}</Text>
        <Text style={styles.resultTitle}>{wasEarlyQuit ? 'Test Yarıda Bırakıldı' : 'Tebrikler!'}</Text>
        <Text style={styles.resultSubtitle}>
          {wasEarlyQuit
            ? 'Kazandığın puanların yarısı kaydedildi. Tamamlanan test sayına eklenmedi.'
            : 'Tüm soruları bitirdin! Sonuçların kaydedildi.'}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>KAZANILAN PUAN</Text>
            <Text style={[styles.statValue, { color: '#166534' }]}>+{wasEarlyQuit ? Math.floor(score / 2) : score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SÜRE</Text>
            <Text style={[styles.statValue, { color: '#1e40af' }]}>{formatTime(seconds)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DOĞRU / YANLIŞ / ATLA</Text>
            <Text style={styles.statValue}>✅{correctCount} / ❌{wrongCount} / ⏭{skippedCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ZORLUK</Text>
            <Text style={[styles.statValue, { color: '#64748b' }]}>
              {level === 'easy' ? 'Kolay' : level === 'medium' ? 'Orta' : 'Zor'}
            </Text>
          </View>
          <View style={[styles.statCard, { width: '100%' }]}>
            <Text style={styles.statLabel}>DURUM</Text>
            {isSaving ? (
              <ActivityIndicator size="small" color="#22c55e" />
            ) : (
              <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold' }}>Kaydedildi ✓</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.replace('/dashboard')}
        >
          <Text style={styles.mainButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerItem}>
          <Text style={styles.headerLabel}>PUAN</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.headerValue}>{score}</Text>
            {bonusLabel ? (
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#f59e0b' }}>{bonusLabel}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.headerItem}>
          <Text style={styles.headerLabel}>SÜRE</Text>
          <Text style={[styles.headerValue, { color: '#1e40af' }]}>{formatTime(seconds)}</Text>
        </View>
        <View style={styles.headerItem}>
          <Text style={styles.headerLabel}>SORU</Text>
          <Text style={styles.headerValue}>{currentIndex + 1} / {questions.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.questionCard}>
          <QuestionText text={currentQuestion.question} style={styles.questionText} />
          <TouchableOpacity
            style={styles.reportIcon}
            onPress={() => setFeedbackVisible(true)}
          >
            <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>⚠️ Hata Bildir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option: string, index: number) => {
            let backgroundColor: string = theme.colors.surface2, borderColor: string = theme.colors.border;
            if (selectedAnswer) {
              if (option === currentQuestion.correct) { backgroundColor = 'rgba(74,222,128,0.15)'; borderColor = theme.colors.primary; }
              else if (option === selectedAnswer) { backgroundColor = 'rgba(251,113,133,0.15)'; borderColor = theme.colors.danger; }
            }
            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, { backgroundColor, borderColor }]}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.7}
              >
                <View style={styles.optionCircle}>
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!selectedAnswer && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 6, marginBottom: 8 }}>
            <TouchableOpacity onPress={handleReveal} hitSlop={10}>
              <Text style={styles.subtleAction}>Yanıtı Göster</Text>
            </TouchableOpacity>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>|</Text>
            {(() => {
              const canSkip = skippedQuestions.has(currentIndex) || skippedQuestions.size < SKIP_LIMIT;
              const remaining = SKIP_LIMIT - skippedQuestions.size;
              return (
                <TouchableOpacity onPress={handleSkip} hitSlop={10} disabled={!canSkip}>
                  <Text style={[styles.subtleAction, !canSkip && { color: theme.colors.border }]}>
                    Soruyu Atla {canSkip && remaining < SKIP_LIMIT ? `(${remaining})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        )}

        {selectedAnswer && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6, marginBottom: 8 }}>
            <TouchableOpacity onPress={handleShareQuestion} hitSlop={10}>
              <Text style={styles.subtleAction}>📤 Soruyu Paylaş</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.pillButton, currentIndex === 0 && styles.pillDisabled]}
          activeOpacity={0.85}
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
        >
          <Ionicons name="chevron-back" size={18} color={currentIndex === 0 ? "#cbd5e1" : "#1e293b"} />
          <Text style={[styles.pillText, currentIndex === 0 && styles.pillTextDisabled]}>Önceki</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillButton, styles.pillDanger]}
          activeOpacity={0.85}
          onPress={() => setShowQuitModal(true)}
        >
          <Ionicons name="flag-outline" size={18} color="#ffffff" />
          <Text style={[styles.pillText, { color: "#ffffff" }]}>Bitir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pillButton,
            ((!selectedAnswer && !skippedQuestions.has(currentIndex)) || isSaving) && styles.pillDisabled,
            currentIndex === questions.length - 1 && (selectedAnswer || skippedQuestions.has(currentIndex)) ? styles.pillPrimary : null,
          ]}
          activeOpacity={0.85}
          disabled={(!selectedAnswer && !skippedQuestions.has(currentIndex)) || isSaving}
          onPress={() => {
            if (currentIndex === questions.length - 1) {
              handleFinishQuiz();
            } else {
              setCurrentIndex(prev => prev + 1);
            }
          }}
        >
          <Text style={[styles.pillText, ((!selectedAnswer && !skippedQuestions.has(currentIndex)) || isSaving) && styles.pillTextDisabled]}>
            {currentIndex === questions.length - 1 ? "Sonuçlar" : "Sonraki"}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={(!selectedAnswer && !skippedQuestions.has(currentIndex)) || isSaving ? "#cbd5e1" : "#1e293b"}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showQuitModal} transparent animationType="fade" onRequestClose={() => setShowQuitModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: theme.colors.surface2, borderRadius: 20, padding: theme.space.xl, gap: theme.space.md, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.45)' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.text, textAlign: 'center' }}>Yarışmayı Bitir?</Text>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surface2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ fontSize: 13, color: theme.colors.muted }}>Şu anki puanın</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text }}>{score} puan</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)' }}>
                <Text style={{ fontSize: 13, color: theme.colors.muted }}>Hesabına eklenecek</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.warning }}>+{Math.floor(score / 2)} puan</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' }}>
                <Text style={{ fontSize: 13, color: theme.colors.muted }}>Testi bitirirsen</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.primary }}>+{score} puan</Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.muted, textAlign: 'center', marginTop: 2 }}>
                Bu test tamamlanan testler arasına girmeyecek.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.xs }}>
              <TouchableOpacity
                onPress={() => setShowQuitModal(false)}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.surface2, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>Devam Et</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowQuitModal(false); handleFinishQuiz(true); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.colors.danger, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Bitir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isFeedbackVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Soruyu Bildir</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Sorun nedir?"
              multiline
              value={feedbackComment}
              onChangeText={setFeedbackComment}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setFeedbackVisible(false)}>
                <Text>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#22c55e', opacity: sendingFeedback ? 0.6 : 1 }]}
                disabled={sendingFeedback}
                onPress={async () => {
                  if (!feedbackComment.trim()) {
                    Alert.alert("Hata", "Lütfen bir açıklama yaz.");
                    return;
                  }
                  setSendingFeedback(true);
                  try {
                    await addDoc(collection(db, "feedback"), {
                      questionIndex: currentIndex,
                      questionText: currentQuestion.question,
                      level,
                      comment: feedbackComment.trim(),
                      userId: auth.currentUser?.uid ?? "anonim",
                      createdAt: serverTimestamp(),
                    });
                    setFeedbackVisible(false);
                    setFeedbackComment("");
                    Alert.alert("Teşekkürler!", "Bildirim gönderildi.");
                  } catch {
                    Alert.alert("Hata", "Bildirim gönderilemedi, tekrar dene.");
                  } finally {
                    setSendingFeedback(false);
                  }
                }}
              >
                <Text style={{ color: 'white' }}>{sendingFeedback ? "Gönderiliyor..." : "Gönder"}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: theme.colors.surface, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  headerItem: { alignItems: 'center' },
  headerLabel: { fontSize: 10, color: theme.colors.muted, fontWeight: 'bold', letterSpacing: 1 },
  headerValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
  questionCard: { backgroundColor: theme.colors.surface, padding: 25, borderRadius: 25, marginBottom: 20, minHeight: 160, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  questionText: { fontSize: 19, fontWeight: '700', textAlign: 'center', color: theme.colors.text },
  reportIcon: { position: 'absolute', bottom: 10, right: 15 },
  optionsContainer: { width: '100%' },
  optionButton: { padding: 15, borderRadius: 18, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  optionCircle: { width: 30, height: 30, backgroundColor: theme.colors.bg, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionLetter: { fontWeight: 'bold', color: theme.colors.muted },
  optionText: { fontSize: 16, fontWeight: '500', flex: 1, color: theme.colors.text },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 12 },
  pillButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 999, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, flex: 1 },
  pillPrimary: { borderColor: theme.colors.primary },
  pillDanger: { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger, maxWidth: 120 },
  pillDisabled: { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
  pillText: { fontWeight: "800", color: theme.colors.text },
  pillTextDisabled: { color: theme.colors.muted },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: theme.colors.bg },
  resultEmoji: { fontSize: 80, marginBottom: 10 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.primary },
  resultSubtitle: { fontSize: 14, color: theme.colors.muted, marginBottom: 30 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  statCard: { backgroundColor: theme.colors.surface, width: '48%', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  statLabel: { fontSize: 9, color: theme.colors.muted, fontWeight: 'bold', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  mainButton: { backgroundColor: theme.colors.primary, width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  mainButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 25, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: theme.colors.text },
  feedbackInput: { backgroundColor: theme.colors.surface2, borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', marginBottom: 20, color: theme.colors.text },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { padding: 12, paddingHorizontal: 20, borderRadius: 10 },
  subtleAction: { fontSize: 13, color: theme.colors.muted, fontWeight: '600' },
});