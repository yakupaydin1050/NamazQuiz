import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../components/ui/theme';
import { RANKS } from '../utils/rank';

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  color: string;
  title: string;
  description: string;
  extra?: 'scoring' | 'ranks';
};

const slides: Slide[] = [
  {
    key: '1',
    icon: 'book-outline',
    color: theme.colors.primary,
    title: 'Namaz Quiz\'e\nHoş Geldin',
    description: 'Namaz bilgini test et, kendini geliştir. Hızlı, eğlenceli ve öğretici soru-cevap deneyimi.',
  },
  {
    key: '2',
    icon: 'layers-outline',
    color: theme.colors.info,
    title: 'Nasıl Oynanır?',
    description: '3 farklı zorluk seviyesinde 20 soruluk testler. Doğru cevapla puan kazan, yanlışta puan düşer. Süren başladı!',
  },
  {
    key: '3',
    icon: 'trophy-outline',
    color: theme.colors.warning,
    title: 'Puan Kazan,\nZirveye Çık',
    description: 'Zorluk arttıkça ödül artar. Hızlı cevapla bonus kazan! En yüksek puanlar liderlik tablosunda.',
    extra: 'scoring',
  },
  {
    key: '4',
    icon: 'ribbon-outline',
    color: theme.colors.danger,
    title: 'Rütbe Kazan,\nEfsane Ol',
    description: 'Puan kazandıkça rütben yükselir. En tepede seni ne bekliyor?',
    extra: 'ranks',
  },
];

const scoringRows = [
  { label: 'Kolay', gain: '+10', loss: '-5', color: theme.colors.primary },
  { label: 'Orta', gain: '+20', loss: '-10', color: theme.colors.warning },
  { label: 'Zor', gain: '+30', loss: '-15', color: theme.colors.danger },
];

const bonusRows = [
  { label: 'Kolay   0–5 / 5–10 / 10–15 sn', bonus: '+5 / +3 / +1 ⚡' },
  { label: 'Orta    0–8 / 8–15 / 15–22 sn', bonus: '+5 / +3 / +1 ⚡' },
  { label: 'Zor    0–12 / 12–20 / 20–30 sn', bonus: '+5 / +3 / +1 ⚡' },
];

export default function Onboarding() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    router.replace('/');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.space.xl }}>
      <View style={{
        width: 100, height: 100, borderRadius: 28,
        backgroundColor: theme.colors.surface,
        borderWidth: 1, borderColor: theme.colors.border,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: theme.space.xl,
      }}>
        <Ionicons name={item.icon} size={48} color={item.color} />
      </View>

      <Text style={{ ...theme.type.h2, color: theme.colors.text, textAlign: 'center', lineHeight: 38, marginBottom: theme.space.lg }}>
        {item.title}
      </Text>

      <Text style={{ ...theme.type.body, color: theme.colors.muted, textAlign: 'center', lineHeight: 24, fontWeight: '500' }}>
        {item.description}
      </Text>

      {item.extra === 'ranks' && (
        <View style={{ marginTop: theme.space.lg, width: '100%', gap: theme.space.sm }}>
          {RANKS.map(rank => (
            <View key={rank.title} style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              borderWidth: 1, borderColor: theme.colors.border,
              paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm,
            }}>
              <Text style={{ fontSize: 18, width: 32 }}>{rank.emoji}</Text>
              <Text style={{ ...theme.type.small, color: theme.colors.text, flex: 1 }}>{rank.title}</Text>
              <Text style={{ ...theme.type.micro, color: theme.colors.muted }}>
                {rank.maxScore ? `${rank.minScore} – ${rank.maxScore}` : `${rank.minScore}+`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {item.extra === 'scoring' && (
        <View style={{ marginTop: theme.space.lg, width: '100%', gap: theme.space.sm }}>
          {scoringRows.map(row => (
            <View key={row.label} style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              borderWidth: 1, borderColor: theme.colors.border,
              paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md,
            }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: row.color, marginRight: theme.space.md }} />
              <Text style={{ ...theme.type.small, color: theme.colors.text, flex: 1 }}>{row.label}</Text>
              <Text style={{ ...theme.type.small, color: theme.colors.primary, marginRight: theme.space.lg }}>
                Doğru {row.gain}
              </Text>
              <Text style={{ ...theme.type.small, color: theme.colors.danger }}>
                Yanlış {row.loss}
              </Text>
            </View>
          ))}

          <Text style={{ ...theme.type.micro, color: theme.colors.muted, letterSpacing: 1, marginTop: theme.space.xs }}>
            HIZ BONUSU
          </Text>
          {bonusRows.map(row => (
            <View key={row.label} style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              borderWidth: 1, borderColor: theme.colors.border,
              paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm,
            }}>
              <Text style={{ ...theme.type.small, color: theme.colors.muted, flex: 1 }}>{row.label}</Text>
              <Text style={{ ...theme.type.small, color: '#f59e0b', fontWeight: '700' }}>{row.bonus}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <TouchableOpacity
        onPress={handleComplete}
        style={{ alignSelf: 'flex-end', paddingHorizontal: theme.space.xl, paddingTop: theme.space.md }}
        hitSlop={12}
      >
        <Text style={{ ...theme.type.small, color: theme.colors.muted }}>Atla</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={{ paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xxl, gap: theme.space.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                height: 8,
                width: i === currentIndex ? 24 : 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? theme.colors.primary : theme.colors.border,
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.lg,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.85}
        >
          <Text style={{ ...theme.type.body, color: theme.colors.bg }}>
            {currentIndex === slides.length - 1 ? 'Başlayalım!' : 'İleri'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
