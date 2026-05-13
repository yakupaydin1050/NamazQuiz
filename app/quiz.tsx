import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// FIREBASE BAĞLANTILARI
import { addDoc, collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import QuestionText from '../components/ui/QuestionText';

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
  const handleFinishQuiz = async () => {
    if (isSaving) return;

    setIsFinished(true);
    setIsSaving(true);

    const user = auth.currentUser;

    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);

        await runTransaction(db, async (tx) => {
          const snap = await tx.get(userRef);
          const data = snap.exists() ? (snap.data() as any) : {};

          const prevTotalScore = typeof data.totalScore === "number" ? data.totalScore : 0;
          const prevCompleted = typeof data.completedQuizzes === "number" ? data.completedQuizzes : 0;

          const nextTotalScore = prevTotalScore + score;
          const nextCompleted = prevCompleted + 1;

          tx.set(
            userRef,
            {
              uid: user.uid,
              email: user.email || "misafir@quiz.com",
              displayName: user.displayName || data.displayName || "İsimsiz Oyuncu",
              totalScore: nextTotalScore,
              completedQuizzes: nextCompleted,
              lastPlayed: serverTimestamp(),
              lastQuiz: {
                score,
                seconds,
                level,
              },
            },
            { merge: true }
          );
        });

        console.log("Toplam puan ve test sayısı kaydedildi.");
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

  const handleSkip = () => {
    if (selectedAnswer || isFinished) return;
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
    } else {
      setScore(prev => Math.max(0, prev - loss));
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
        <Text style={styles.resultEmoji}>🏆</Text>
        <Text style={styles.resultTitle}>Tebrikler!</Text>
        <Text style={styles.resultSubtitle}>Yarışma sonuçların kaydedildi.</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>KAZANILAN PUAN</Text>
            <Text style={[styles.statValue, { color: '#166534' }]}>+{score}</Text>
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
            let backgroundColor = 'white', borderColor = '#e2e8f0';
            if (selectedAnswer) {
              if (option === currentQuestion.correct) { backgroundColor = '#dcfce7'; borderColor = '#22c55e'; }
              else if (option === selectedAnswer) { backgroundColor = '#fee2e2'; borderColor = '#ef4444'; }
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
            <TouchableOpacity onPress={handleSkip} hitSlop={10}>
              <Text style={styles.subtleAction}>Soruyu Atla</Text>
            </TouchableOpacity>
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
          onPress={() => {
            Alert.alert("Çıkış", "Yarışmayı bitirmek istiyor musun?", [
              { text: "Hayır", style: "cancel" },
              { text: "Evet, Bitir", onPress: () => handleFinishQuiz() }
            ]);
          }}
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
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'white', padding: 15, borderRadius: 20, elevation: 2 },
  headerItem: { alignItems: 'center' },
  headerLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  headerValue: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  questionCard: { backgroundColor: 'white', padding: 25, borderRadius: 25, marginBottom: 20, minHeight: 160, justifyContent: 'center', elevation: 3 },
  questionText: { fontSize: 19, fontWeight: '700', textAlign: 'center', color: '#1e293b' },
  reportIcon: { position: 'absolute', bottom: 10, right: 15 },
  optionsContainer: { width: '100%' },
  optionButton: { padding: 15, borderRadius: 18, marginBottom: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  optionCircle: { width: 30, height: 30, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionLetter: { fontWeight: 'bold', color: '#64748b' },
  optionText: { fontSize: 16, fontWeight: '500', flex: 1 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 12,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flex: 1,
  },
  pillPrimary: {
    borderColor: "#86efac",
  },
  pillDanger: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    maxWidth: 120,
  },
  pillDisabled: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
  pillText: {
    fontWeight: "800",
    color: "#1e293b",
  },
  pillTextDisabled: {
    color: "#cbd5e1",
  },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#F8FAFC' },
  resultEmoji: { fontSize: 80, marginBottom: 10 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#166534' },
  resultSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 30 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  statCard: { backgroundColor: 'white', width: '48%', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', elevation: 2 },
  statLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  mainButton: { backgroundColor: '#22c55e', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 25, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  feedbackInput: { backgroundColor: '#f1f5f9', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { padding: 12, paddingHorizontal: 20, borderRadius: 10 },
  subtleAction: { fontSize: 13, color: '#475569', fontWeight: '600' },
});