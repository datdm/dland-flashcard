 import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { authApi } from '../../services/api';
import { useStore } from '../../store/useStore';
import { Colors } from '../../constants/colors';
import { useSync } from '../../hooks/useSync';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useStore((s) => s.setAuth);
  const { syncFromServer } = useSync();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(username.trim(), password);
      const { token, user } = res.data;
      await setAuth(user, token);
      await syncFromServer();
      router.replace('/(tabs)/notebooks');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.title}>Flashcard Japanese</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục học</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Nhập tên đăng nhập"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleLogin}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.linkText}>
              Chưa có tài khoản?{' '}
              <Text style={styles.linkHighlight}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  form: { gap: 12 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  label: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 4,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: Colors.textSecondary, fontSize: 15 },
  linkHighlight: { color: Colors.primary, fontWeight: '600' },
});
