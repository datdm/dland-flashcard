 import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/colors';

export default function SearchScreen() {
  const { notebooks } = useStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found: Array<{
      vocab: any;
      notebookName: string;
      notebookId: string;
    }> = [];
    for (const nb of notebooks) {
      for (const v of nb.vocabulary || []) {
        if (
          v.kanji?.toLowerCase().includes(q) ||
          v.hiragana?.toLowerCase().includes(q) ||
          v.meaning?.toLowerCase().includes(q)
        ) {
          found.push({ vocab: v, notebookName: nb.name, notebookId: nb.id });
        }
      }
    }
    return found;
  }, [query, notebooks]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm kanji, hiragana, nghĩa..."
          placeholderTextColor={Colors.textMuted}
          autoFocus
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {query.trim() ? (
        <Text style={styles.resultCount}>
          {results.length} kết quả
        </Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.vocab.id}-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/notebook/${item.notebookId}` as any)}
          >
            <View style={styles.cardLeft}>
              {item.vocab.kanji ? <Text style={styles.kanji}>{item.vocab.kanji}</Text> : null}
              {item.vocab.hiragana ? <Text style={styles.hiragana}>{item.vocab.hiragana}</Text> : null}
              {item.vocab.meaning ? <Text style={styles.meaning}>{item.vocab.meaning}</Text> : null}
            </View>
            <View style={styles.notebookBadge}>
              <Text style={styles.notebookBadgeText} numberOfLines={1}>{item.notebookName}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !query.trim() ? (
            <View style={styles.hint}>
              <Ionicons name="search" size={48} color={Colors.textMuted} />
              <Text style={styles.hintText}>Nhập từ để tìm kiếm trong tất cả sổ tay</Text>
            </View>
          ) : (
            <View style={styles.hint}>
              <Text style={styles.hintText}>Không tìm thấy kết quả cho "{query}"</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16, paddingVertical: 14 },
  resultCount: { color: Colors.textMuted, fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  cardLeft: { flex: 1 },
  kanji: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  hiragana: { fontSize: 13, color: Colors.primaryLight, marginTop: 2 },
  meaning: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  notebookBadge: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    maxWidth: 100,
  },
  notebookBadgeText: { color: Colors.primaryLight, fontSize: 11, fontWeight: '600' },
  hint: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  hintText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 12 },
});
