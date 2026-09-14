import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { Colors } from '../constants/colors';

export default function Index() {
  const { user, isAuthLoading } = useStore();

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/notebooks" />;
  }

  return <Redirect href="/(auth)/login" />;
}
