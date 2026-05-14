import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRank } from '../utils/rank';

// FIREBASE
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface LeaderboardUser {
  id: string;
  displayName: string;
  totalScore: number;
  completedQuizzes: number;
  photoURL?: string;
}

export default function LiderlikTablosu() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    // En yüksek puanlı 20 kullanıcıyı getiren sorgu
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("totalScore", "desc"), limit(20));

    // Real-time dinleyici: Birisi puan kazandığı an liste güncellenir
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: LeaderboardUser[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as LeaderboardUser);
      });
      setTopUsers(users);
      setLoading(false);
    }, (error) => {
      console.error("Liderlik tablosu çekilemedi:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderUserItem = ({ item, index }: { item: LeaderboardUser, index: number }) => {
    const isMe = item.id === auth.currentUser?.uid;
    const rank = getRank(item.totalScore);

    return (
      <View style={[styles.userRow, isMe && styles.meRow]}>
        <View style={styles.rankContainer}>
          {index === 0 ? <Text style={styles.medal}>🥇</Text> :
           index === 1 ? <Text style={styles.medal}>🥈</Text> :
           index === 2 ? <Text style={styles.medal}>🥉</Text> :
           <Text style={styles.rankText}>{index + 1}</Text>}
        </View>

        <View style={styles.avatar}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>
              {(item.displayName || "?")[0].toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isMe && styles.meText]}>
            {item.displayName || "İsimsiz"} {isMe && "(Siz)"}
          </Text>
          <Text style={styles.userStats}>
            {rank.emoji} {rank.title} · {item.completedQuizzes || 0} Test
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.totalScore.toLocaleString()}</Text>
          <Text style={styles.scoreLabel}>PUAN</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: "Liderlik Tablosu",
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTintColor: '#166534',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.replace("/dashboard")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 10 }}
          >
            <Ionicons name="grid-outline" size={18} color="#166534" />
            <Text style={{ color: "#166534", fontWeight: "800" }}>Ana Sayfa</Text>
          </TouchableOpacity>
        ),
      }} />

      <View style={styles.topSection}>
        <Text style={styles.title}>En İyiler 🏆</Text>
        <Text style={styles.subtitle}>Tüm zamanların en yüksek puanlı oyuncuları</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Sıralama yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={topUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Henüz kayıtlı kullanıcı yok.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topSection: { padding: 20, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  listContent: { padding: 15 },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 10,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  meRow: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#22c55e' },
  rankContainer: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8' },
  medal: { fontSize: 22 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 10, overflow: 'hidden' },
  avatarImage: { width: 38, height: 38 },
  avatarInitial: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  meText: { color: '#166534' },
  userStats: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#22c55e' },
  scoreLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8' },
  loadingText: { marginTop: 10, color: '#64748b' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});