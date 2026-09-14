import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Modal,
  Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore, VocabItem } from '../../store/useStore';
import { Colors } from '../../constants/colors';
import { vocabApi } from '../../services/api';
import { useSync } from '../../hooks/useSync';

export default function NotebookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notebooks, addVocab, updateVocab, deleteVocab } = useStore();
  const { syncToServer } = useSync();

  const notebook = notebooks.find((nb) => nb.id === id);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [form, setForm] = useState({ kanji: '', hiragana: '', meaning: '', onyomi: '', phonetic: '' });

  if (!notebook) {
    return (
      <View style={styles.container}>
        <Text style={styles.noFound}>Không tìm thấy sổ tay</Text>
      </View>
    );
  }

  const filtered = (notebook.vocabulary || []).filter((v) => {
    const q = search.toLowerCase();
    return (
      v.kanji?.toLowerCase().includes(q) ||
      v.hiragana?.toLowerCase().includes(q) ||
      v.meaning?.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!form.kanji.trim() && !form.hiragana.trim()) {
      setAddError('Vui lòng nhập Kanji hoặc Hiragana');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      const res = await vocabApi.upload({
        kanji: form.kanji.trim(),
        hiragana: form.hiragana.trim(),
        meaning: form.meaning.trim(),
        onyomi: form.onyomi.trim(),
        phonetic: form.phonetic.trim(),
        notebookId: id!,
      });
      addVocab(id!, res.data.vocab);
      syncToServer();
      setForm({ kanji: '', hiragana: '', meaning: '', onyomi: '', phonetic: '' });
      setShowAdd(false);
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Lỗi khi lưu từ vựng');
    } finally {
      setSaving(false);
    }
  };

  const handleFavorite = async (vocab: VocabItem) => {
    try {
      await vocabApi.patch(vocab.id, id!, { isFavorite: !vocab.isFavorite });
      updateVocab(id!, vocab.id, { isFavorite: !vocab.isFavorite });
    } catch {}
  };

  const handleDelete = (vocab: VocabItem) => {
    Alert.alert('Xóa từ vựng', `Xóa "${vocab.kanji || vocab.hiragana}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            await vocabApi.delete(vocab.id, id!);
            deleteVocab(id!, vocab.id);
            syncToServer();
          } catch {}
        },
      },
    ]);
  };

  const renderVocab = useCallback(({ item }: { item: VocabItem }) => (
    <View style={styles.vocabCard}>
      <View style={styles.vocabMain}>
        <View style={styles.vocabLeft}>
          {item.kanji ? <Text style={styles.kanji}>{item.kanji}</Text> : null}
          {item.hiragana ? <Text style={styles.hiragana}>{item.hiragana}</Text> : null}
          {item.meaning ? <Text style={styles.meaning}>{item.meaning}</Text> : null}
        </View>
        <View style={styles.vocabActions}>
          <TouchableOpacity onPress={() => handleFavorite(item)} style={styles.iconBtn}>
            <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isFavorite ? Colors.error : Colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [id]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: notebook.name,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShown: true,
        }}
      />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm từ vựng..."
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.countBadge}>{notebook.vocabulary?.length || 0}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderVocab}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              {search ? 'Không tìm thấy' : 'Chưa có từ vựng nào'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm từ vựng</Text>

            {addError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{addError}</Text>
              </View>
            ) : null}

            {[
              { key: 'kanji', label: 'Kanji', placeholder: '漢字' },
              { key: 'hiragana', label: 'Hiragana / Katakana', placeholder: 'ひらがな' },
              { key: 'meaning', label: 'Nghĩa tiếng Việt', placeholder: 'Ví dụ: học tập' },
              { key: 'onyomi', label: 'Onyomi (tùy chọn)', placeholder: '' },
              { key: 'phonetic', label: 'Phiên âm (tùy chọn)', placeholder: '' },
            ].map(({ key, label, placeholder }) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={form[key as keyof typeof form]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowAdd(false); setAddError(''); setForm({ kanji: '', hiragana: '', meaning: '', onyomi: '', phonetic: '' }); }}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.modalConfirmText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  noFound: { color: Colors.textSecondary, textAlign: 'center', marginTop: 80, fontSize: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 12 },
  countBadge: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  vocabCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vocabMain: { flexDirection: 'row', alignItems: 'center' },
  vocabLeft: { flex: 1 },
  kanji: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  hiragana: { fontSize: 14, color: Colors.primaryLight, marginTop: 2 },
  meaning: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  vocabActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 4 },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  modalConfirmText: { color: Colors.white, fontWeight: '600' },
});
