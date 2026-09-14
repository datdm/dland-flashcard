 import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/colors';
import { authApi } from '../../services/api';
import { useSync } from '../../hooks/useSync';

export default function SettingsScreen() {
  const { user, clearAuth, lastSyncAt } = useStore();
  const { syncFromServer, syncToServer, isSyncing } = useSync();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleChangePwd = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Vui lòng nhập đầy đủ thông tin'); return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Mật khẩu mới không khớp'); return;
    }
    if (newPwd.length < 6) {
      setPwdError('Mật khẩu mới phải ít nhất 6 ký tự'); return;
    }
    setPwdLoading(true);
    setPwdError('');
    try {
      await authApi.changePassword(currentPwd, newPwd);
      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công');
      setShowChangePwd(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setPwdLoading(false);
    }
  };

  const syncTime = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString('vi-VN')
    : 'Chưa đồng bộ';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.userRole}>{user?.isAdmin ? '👑 Admin' : '👤 Thành viên'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Đồng bộ</Text>
      <View style={styles.section}>
        <View style={styles.syncInfo}>
          <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.syncInfoText}>Đồng bộ lần cuối: {syncTime}</Text>
        </View>
        <TouchableOpacity
          style={[styles.menuItem, isSyncing && { opacity: 0.6 }]}
          onPress={syncFromServer}
          disabled={isSyncing}
        >
          <Ionicons name="cloud-download-outline" size={20} color={Colors.primary} />
          <Text style={styles.menuText}>Tải từ server</Text>
          {isSyncing && <ActivityIndicator size="small" color={Colors.primary} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, isSyncing && { opacity: 0.6 }]}
          onPress={syncToServer}
          disabled={isSyncing}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
          <Text style={styles.menuText}>Tải lên server</Text>
          {isSyncing && <ActivityIndicator size="small" color={Colors.primary} />}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Tài khoản</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setShowChangePwd(true)}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.text} />
          <Text style={styles.menuText}>Đổi mật khẩu</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[styles.menuText, { color: Colors.error }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Thông tin</Text>
      <View style={styles.section}>
        <View style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.menuText}>Phiên bản</Text>
          <Text style={[styles.menuText, { marginLeft: 'auto', color: Colors.textMuted }]}>1.0.0</Text>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="server-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.menuText}>Server</Text>
          <Text style={[{ marginLeft: 'auto', color: Colors.textMuted, fontSize: 11 }]}>Render.com</Text>
        </View>
      </View>

      <Modal visible={showChangePwd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            {pwdError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{pwdError}</Text>
              </View>
            ) : null}
            {[
              { key: 'current', label: 'Mật khẩu hiện tại', state: currentPwd, set: setCurrentPwd },
              { key: 'new', label: 'Mật khẩu mới', state: newPwd, set: setNewPwd },
              { key: 'confirm', label: 'Xác nhận mật khẩu mới', state: confirmPwd, set: setConfirmPwd },
            ].map(({ key, label, state, set }) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={state}
                  onChangeText={set}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textMuted}
                  placeholder="••••••"
                />
              </View>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowChangePwd(false); setPwdError(''); }}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, pwdLoading && { opacity: 0.6 }]}
                onPress={handleChangePwd}
                disabled={pwdLoading}
              >
                {pwdLoading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.modalConfirmText}>Lưu</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 20, marginBottom: 28,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  username: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  userRole: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  sectionTitle: {
    color: Colors.textMuted, fontSize: 12, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 10, marginLeft: 4,
  },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 24, overflow: 'hidden',
  },
  syncInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  syncInfoText: { color: Colors.textMuted, fontSize: 13 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuText: { color: Colors.text, fontSize: 15, flex: 1 },
  logoutItem: { borderBottomWidth: 0 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: Colors.error,
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 4 },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, padding: 12,
    color: Colors.text, fontSize: 15, marginBottom: 10,
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
