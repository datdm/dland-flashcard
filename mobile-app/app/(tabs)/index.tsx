 import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/colors';
import { useSync } from '../../hooks/useSync';

export default function HomeScreen() {
  const { user, notebooks, lastSyncAt } = useStore();
  const { syncFromServer, isSyncing } = useSync();

  const totalWords = notebooks.reduce((sum, nb) => sum + (nb.vocabulary?.length || 0), 0);
  const favoriteWords = notebooks.reduce(
    (sum, nb) => sum + (nb.vocabulary?.filter((v) => v.isFavorite)?.length || 0),
    0
  );

  const syncTime = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : 'Chưa đồng bộ';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isSyncing}
          onRefresh={syncFromServer}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.username} 👋</Text>
        <Text style={styles.syncTime}>Đồng bộ: {syncTime}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{notebooks.length}</Text>
          <Text style={styles.statLabel}>Sổ tay</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalWords}</Text>
          <Text style={styles.statLabel}>Từ vựng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.accent }]}>{favoriteWords}</Text>
          <Text style={styles.statLabel}>Yêu thích</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/notebooks')}>
          <Text style={styles.actionEmoji}>📖</Text>
          <Text style={styles.actionLabel}>Sổ tay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/flashcard')}>
          <Text style={styles.actionEmoji}>🃏</Text>
          <Text style={styles.actionLabel}>Flashcard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/search')}>
          <Text style={styles.actionEmoji}>🔍</Text>
          <Text style={styles.actionLabel}>Tìm kiếm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={syncFromServer}>
          <Text style={styles.actionEmoji}>🔄</Text>
          <Text style={styles.actionLabel}>Đồng bộ</Text>
        </TouchableOpacity>
      </View>

      {notebooks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sổ tay gần đây</Text>
          {notebooks.slice(0, 3).map((nb) => (
            <TouchableOpacity
              key={nb.id}
              style={styles.recentCard}
              onPress={() => router.push(`/notebook/${nb.id}` as any)}
            >
              <View style={styles.recentIcon}>
                <Text style={{ fontSize: 20 }}>📒</Text>
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{nb.name}</Text>
                <Text style={styles.recentCount}>{nb.vocabulary?.length || 0} từ</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  syncTime: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: { fontSize: 28, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionLabel: { color: Colors.text, fontWeight: '500' },
  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentIcon: { marginRight: 12 },
  recentInfo: { flex: 1 },
  recentName: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  recentCount: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  chevron: { color: Colors.textMuted, fontSize: 22 },
});
