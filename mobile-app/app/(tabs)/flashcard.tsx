 import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, FlatList,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'select' | 'play';

export default function FlashcardScreen() {
  const { notebooks } = useStore();
  const [mode, setMode] = useState<Mode>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const selectedNb = notebooks.find((nb) => nb.id === selectedId);
  const cards = selectedNb?.vocabulary || [];
  const current = cards[currentIndex];

  const flip = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const next = () => {
    setIsFlipped(false);
    flipAnim.setValue(0);
    setCurrentIndex((i) => Math.min(i + 1, cards.length - 1));
  };

  const prev = () => {
    setIsFlipped(false);
    flipAnim.setValue(0);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Chọn sổ tay để luyện tập</Text>
        <FlatList
          data={notebooks.filter((nb) => (nb.vocabulary?.length || 0) > 0)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.selectCard}
              onPress={() => {
                setSelectedId(item.id);
                setCurrentIndex(0);
                setIsFlipped(false);
                flipAnim.setValue(0);
                setMode('play');
              }}
            >
              <Text style={styles.selectName}>{item.name}</Text>
              <Text style={styles.selectCount}>{item.vocabulary?.length} từ</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có sổ tay nào có từ vựng</Text>
          }
        />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Không có từ vựng</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('select')}>
          <Text style={styles.backBtnText}>← Chọn lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setMode('select')}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.progress}>{currentIndex + 1} / {cards.length}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${((currentIndex + 1) / cards.length) * 100}%` }]}
        />
      </View>

      <TouchableOpacity style={styles.cardWrap} onPress={flip} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ rotateY: frontRotate }],
              opacity: isFlipped ? 0 : 1,
              position: isFlipped ? 'absolute' : 'relative',
            },
          ]}
        >
          <Text style={styles.cardLabel}>Kanji / Hiragana</Text>
          {current.kanji ? <Text style={styles.cardKanji}>{current.kanji}</Text> : null}
          {current.hiragana ? <Text style={styles.cardHiragana}>{current.hiragana}</Text> : null}
          <Text style={styles.tapHint}>Nhấn để xem nghĩa</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              transform: [{ rotateY: backRotate }],
              opacity: isFlipped ? 1 : 0,
              position: isFlipped ? 'relative' : 'absolute',
            },
          ]}
        >
          <Text style={styles.cardLabel}>Nghĩa</Text>
          <Text style={styles.cardMeaning}>{current.meaning}</Text>
          {current.phonetic ? <Text style={styles.cardPhonetic}>{current.phonetic}</Text> : null}
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={prev}
          disabled={currentIndex === 0}
        >
          <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? Colors.textMuted : Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipBtn} onPress={flip}>
          <Ionicons name="refresh" size={20} color={Colors.white} />
          <Text style={styles.flipBtnText}>Lật thẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, currentIndex === cards.length - 1 && styles.navBtnDisabled]}
          onPress={next}
          disabled={currentIndex === cards.length - 1}
        >
          <Ionicons name="arrow-forward" size={24} color={currentIndex === cards.length - 1 ? Colors.textMuted : Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: {
    color: Colors.text, fontSize: 18, fontWeight: '700',
    padding: 20, paddingBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  selectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  selectName: { color: Colors.text, fontWeight: '600', fontSize: 15, flex: 1 },
  selectCount: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 60, fontSize: 16 },
  backBtn: { marginTop: 16, padding: 12 },
  backBtnText: { color: Colors.primary, fontSize: 15 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
  },
  progress: { color: Colors.textSecondary, fontWeight: '600' },
  progressBar: {
    height: 4, backgroundColor: Colors.surface,
    marginHorizontal: 16, borderRadius: 2, marginBottom: 20,
  },
  progressFill: {
    height: 4, backgroundColor: Colors.primary, borderRadius: 2,
  },
  cardWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%', minHeight: 280,
    backgroundColor: Colors.surface,
    borderRadius: 24, padding: 32,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    backfaceVisibility: 'hidden',
  },
  cardBack: { backgroundColor: Colors.primaryDark },
  cardLabel: { color: Colors.textMuted, fontSize: 13, marginBottom: 16, letterSpacing: 1 },
  cardKanji: { fontSize: 52, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  cardHiragana: { fontSize: 20, color: Colors.primaryLight, marginBottom: 8 },
  cardMeaning: { fontSize: 24, fontWeight: 'bold', color: Colors.white, textAlign: 'center' },
  cardPhonetic: { fontSize: 16, color: Colors.primaryLight, marginTop: 12 },
  tapHint: { color: Colors.textMuted, fontSize: 13, marginTop: 20 },
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingBottom: 32,
  },
  navBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  flipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 16,
  },
  flipBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
});
