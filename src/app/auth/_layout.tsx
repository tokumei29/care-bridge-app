import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: '戻る',
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen name="login" options={{ title: 'ログイン' }} />
      <Stack.Screen name="sign-up" options={{ title: '新規登録' }} />
    </Stack>
  );
}
